#!/usr/bin/env node

/**
 * VM Connection Fix Script
 * 
 * This script helps fix common VM connection issues
 * Run with: node scripts/fix-vm-connection.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 GameControl VM Connection Fix')
console.log('================================')
console.log('')

// Check for .env file
const envPath = path.join(process.cwd(), '.env')
const envLocalPath = path.join(process.cwd(), '.env.local')

let envFile = null
if (fs.existsSync(envPath)) {
  envFile = envPath
} else if (fs.existsSync(envLocalPath)) {
  envFile = envLocalPath
}

if (!envFile) {
  console.log('❌ No .env file found!')
  console.log('   Create a .env file with your environment variables.')
  console.log('')
  console.log('📝 Example .env file:')
  console.log('   STORAGE_DATABASE_URL=postgresql://...')
  console.log('   NEXTAUTH_SECRET=your-secret-here')
  console.log('   NEXTAUTH_URL=https://your-app.vercel.app')
  console.log('   VM_API_URL=http://YOUR-VPS-IP:3001')
  console.log('   VM_API_KEY=your-api-key-here')
  process.exit(1)
}

console.log(`📁 Found environment file: ${envFile}`)

// Read current .env file
let envContent = fs.readFileSync(envFile, 'utf8')
let hasChanges = false

// Check and fix VM_API_URL
const vmApiUrlMatch = envContent.match(/VM_API_URL=(.+)/)
if (vmApiUrlMatch) {
  const currentUrl = vmApiUrlMatch[1].trim()
  console.log(`🔗 Current VM_API_URL: ${currentUrl}`)
  
  if (currentUrl.startsWith('https://')) {
    console.log('⚠️  VM_API_URL uses HTTPS but VM Manager runs on HTTP')
    console.log('   This is likely causing the SSL error!')
    
    const newUrl = currentUrl.replace('https://', 'http://')
    envContent = envContent.replace(/VM_API_URL=.+/, `VM_API_URL=${newUrl}`)
    hasChanges = true
    console.log(`✅ Fixed VM_API_URL: ${newUrl}`)
  } else if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    console.log('⚠️  VM_API_URL missing protocol')
    const newUrl = `http://${currentUrl}`
    envContent = envContent.replace(/VM_API_URL=.+/, `VM_API_URL=${newUrl}`)
    hasChanges = true
    console.log(`✅ Fixed VM_API_URL: ${newUrl}`)
  } else {
    console.log('✅ VM_API_URL looks correct')
  }
} else {
  console.log('❌ VM_API_URL not found in .env file')
  console.log('   Add: VM_API_URL=http://YOUR-VPS-IP:3001')
}

// Check VM_API_KEY
const vmApiKeyMatch = envContent.match(/VM_API_KEY=(.+)/)
if (vmApiKeyMatch) {
  const apiKey = vmApiKeyMatch[1].trim()
  if (apiKey.length < 20) {
    console.log('⚠️  VM_API_KEY seems too short (should be 20+ characters)')
    console.log('   Generate a new one: openssl rand -base64 32')
  } else {
    console.log('✅ VM_API_KEY looks secure')
  }
} else {
  console.log('❌ VM_API_KEY not found in .env file')
  console.log('   Add: VM_API_KEY=your-generated-api-key')
}

// Write changes if any
if (hasChanges) {
  fs.writeFileSync(envFile, envContent)
  console.log('')
  console.log('💾 Changes saved to .env file')
  console.log('   Restart your development server to apply changes')
} else {
  console.log('')
  console.log('✅ No changes needed - environment variables look correct')
}

console.log('')
console.log('🧪 Next Steps:')
console.log('   1. Test the connection: node scripts/test-vm-connection.js')
console.log('   2. If still failing, check VM Manager logs on your VPS')
console.log('   3. Verify the VPS IP address and port are correct')
console.log('   4. Make sure VM Manager is running: pm2 logs gamecontrol-vm')
