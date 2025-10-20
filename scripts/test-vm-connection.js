#!/usr/bin/env node

/**
 * VM Connection Test Script
 * 
 * This script helps diagnose VM connection issues
 * Run with: node scripts/test-vm-connection.js
 */

const https = require('https')
const http = require('http')

// Get environment variables
const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

console.log('🔍 GameControl VM Connection Diagnostic')
console.log('=====================================')
console.log('')

// Check environment variables
console.log('📋 Environment Variables:')
console.log(`   VM_API_URL: ${VM_API_URL || 'NOT SET'}`)
console.log(`   VM_API_KEY: ${VM_API_KEY ? `${VM_API_KEY.substring(0, 8)}...` : 'NOT SET'}`)
console.log('')

if (!VM_API_URL || !VM_API_KEY) {
  console.log('❌ Missing environment variables!')
  console.log('   Set VM_API_URL and VM_API_KEY in your .env file')
  process.exit(1)
}

// Parse URL
let url
try {
  url = new URL(VM_API_URL)
  console.log('🔗 URL Analysis:')
  console.log(`   Protocol: ${url.protocol}`)
  console.log(`   Host: ${url.hostname}`)
  console.log(`   Port: ${url.port || (url.protocol === 'https:' ? '443' : '80')}`)
  console.log('')
} catch (error) {
  console.log('❌ Invalid VM_API_URL format!')
  console.log(`   Error: ${error.message}`)
  console.log('   Expected: http://YOUR-VPS-IP:3001 or https://yourdomain.com')
  process.exit(1)
}

// Test connection
console.log('🌐 Testing Connection...')

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: '/api/status',
  method: 'GET',
  headers: {
    'x-api-key': VM_API_KEY,
    'User-Agent': 'GameControl-Diagnostic/1.0'
  },
  timeout: 10000
}

const client = url.protocol === 'https:' ? https : http

const req = client.request(options, (res) => {
  console.log(`✅ Connection successful!`)
  console.log(`   Status: ${res.statusCode}`)
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data)
      console.log('📊 VM Status Response:')
      console.log(JSON.stringify(json, null, 2))
      
      if (res.statusCode === 200) {
        console.log('')
        console.log('🎉 SUCCESS! VM Manager is responding correctly.')
        console.log('   Your server creation should work now.')
      } else {
        console.log('')
        console.log('⚠️ VM Manager responded but with an error status.')
        console.log('   Check your API key and VM Manager logs.')
      }
    } catch (error) {
      console.log('⚠️ Response is not valid JSON:')
      console.log(data)
    }
  })
})

req.on('error', (error) => {
  console.log('❌ Connection failed!')
  console.log(`   Error: ${error.message}`)
  
  if (error.code === 'ENOTFOUND') {
    console.log('   → Check if the hostname/IP is correct')
  } else if (error.code === 'ECONNREFUSED') {
    console.log('   → Check if the VM Manager is running on the VPS')
    console.log('   → Check if the port is correct (should be 3001)')
  } else if (error.code === 'ETIMEDOUT') {
    console.log('   → Check if the VPS is accessible')
    console.log('   → Check firewall settings')
  } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
    console.log('   → SSL/TLS Error detected!')
    console.log('   → Try using http:// instead of https://')
    console.log('   → Or set up proper SSL certificates')
  }
  
  console.log('')
  console.log('🔧 Troubleshooting Steps:')
  console.log('   1. Check if VM Manager is running: pm2 logs gamecontrol-vm')
  console.log('   2. Test from VPS: curl http://localhost:3001/api/status')
  console.log('   3. Check firewall: sudo ufw status')
  console.log('   4. Verify API key matches between Vercel and VPS')
})

req.on('timeout', () => {
  console.log('⏰ Connection timed out!')
  console.log('   → Check if the VPS is accessible')
  console.log('   → Check firewall settings')
  req.destroy()
})

req.setTimeout(10000)
req.end()

console.log('   Testing... (this may take up to 10 seconds)')
