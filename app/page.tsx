import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { 
  Server, 
  Zap, 
  Shield, 
  Users, 
  Globe, 
  FileText, 
  MessageCircle, 
  Star,
  CheckCircle,
  ArrowRight,
  Gamepad2,
  Crown,
  Settings,
  Share2
} from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">GameControl</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/login" className="text-blue-200 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Game Server
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Hosting Done Right
            </span>
          </h1>
          <p className="text-xl text-blue-200 mb-12 max-w-3xl mx-auto">
            Powerful, reliable game server hosting for Minecraft, CS2, and Rust. 
            Complete control with our custom panel and cost-sharing features.
          </p>
          
          {/* Game Showcase */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Minecraft</h3>
              <p className="text-blue-200 mb-4">Survival, Creative, Modded servers</p>
              <div className="text-sm text-blue-300">
                <div className="flex justify-between mb-1">
                  <span>RAM:</span>
                  <span>1-16GB</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Players:</span>
                  <span>Up to 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Mods:</span>
                  <span>Supported</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Counter-Strike 2</h3>
              <p className="text-blue-200 mb-4">Competitive & Casual matches</p>
              <div className="text-sm text-blue-300">
                <div className="flex justify-between mb-1">
                  <span>RAM:</span>
                  <span>2-8GB</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Players:</span>
                  <span>Up to 32</span>
                </div>
                <div className="flex justify-between">
                  <span>Tickrate:</span>
                  <span>128 tick</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Rust</h3>
              <p className="text-blue-200 mb-4">Survival, PvP, Building</p>
              <div className="text-sm text-blue-300">
                <div className="flex justify-between mb-1">
                  <span>RAM:</span>
                  <span>4-16GB</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Players:</span>
                  <span>Up to 200</span>
                </div>
                <div className="flex justify-between">
                  <span>Mods:</span>
                  <span>Oxide</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
            >
              Start Hosting Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="#pricing" 
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors border border-white/20"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-blue-200">No hidden fees, no surprises. Pay only for what you use.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Minecraft Plan */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Minecraft</h3>
                <div className="text-4xl font-bold text-white mb-2">$5<span className="text-lg text-blue-300">/month</span></div>
                <p className="text-blue-200">Starting price</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  1GB RAM
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Up to 20 players
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Mod support
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Custom control panel
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  FTP access
                </li>
              </ul>
              <Link 
                href="/register" 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

            {/* CS2 Plan */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Counter-Strike 2</h3>
                <div className="text-4xl font-bold text-white mb-2">$8<span className="text-lg text-blue-300">/month</span></div>
                <p className="text-blue-200">Starting price</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  2GB RAM
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Up to 10 players
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  128 tick servers
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Auto-updates
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  RCON access
                </li>
              </ul>
              <Link 
                href="/register" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

            {/* Rust Plan */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Rust</h3>
                <div className="text-4xl font-bold text-white mb-2">$12<span className="text-lg text-blue-300">/month</span></div>
                <p className="text-blue-200">Starting price</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  4GB RAM
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Up to 50 players
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Oxide plugins
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Auto-wipes
                </li>
                <li className="flex items-center text-blue-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Map editor
                </li>
              </ul>
              <Link 
                href="/register" 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Cost Sharing Feature */}
          <div className="mt-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-400/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Split the Cost with Friends</h3>
              <p className="text-xl text-blue-200 mb-6 max-w-3xl mx-auto">
                Our unique cost-sharing feature lets you split server costs with friends. 
                Send an invite link and both pay 50/50 for the same server access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <span className="bg-white/10 px-6 py-3 rounded-lg text-white font-semibold">
                  Coming Soon: Billing Panel
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control Panel Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Complete Control</h2>
            <p className="text-xl text-blue-200">Our custom control panel gives you everything you need</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">One-Click Management</h3>
              <p className="text-blue-200">Start, stop, restart your servers with a single click. No technical knowledge required.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">File Management</h3>
              <p className="text-blue-200">We recommend FileZilla for complete file control. Upload plugins, configs, and mods easily.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Console</h3>
              <p className="text-blue-200">Monitor your server in real-time with our live console. See player joins, commands, and logs.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auto-Updates</h3>
              <p className="text-blue-200">Keep your servers updated automatically. Never worry about outdated game versions.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">DDoS Protection</h3>
              <p className="text-blue-200">Advanced protection against attacks. Keep your server online and accessible.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Global Locations</h3>
              <p className="text-blue-200">Host your servers close to your players for the best possible performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Server Specs Section */}
      <section className="px-6 py-20 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Infrastructure</h2>
            <p className="text-xl text-blue-200">Built for performance and reliability</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">SSD Storage</h3>
              <p className="text-blue-200">NVMe SSDs for lightning-fast load times</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">High Performance</h3>
              <p className="text-blue-200">Latest generation CPUs and RAM</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">99.9% Uptime</h3>
              <p className="text-blue-200">Reliable hosting with guaranteed uptime</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">24/7 Support</h3>
              <p className="text-blue-200">Round-the-clock technical assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-blue-200">Join thousands of satisfied server owners</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-blue-200 mb-4">
                "Best Minecraft hosting I've used. The control panel is intuitive and the performance is amazing."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">JS</span>
                </div>
                <div>
                  <div className="text-white font-semibold">John Smith</div>
                  <div className="text-blue-300 text-sm">Minecraft Server Owner</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-blue-200 mb-4">
                "The cost-sharing feature is genius! My friends and I split the cost and both have full access."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">MJ</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Mike Johnson</div>
                  <div className="text-blue-300 text-sm">CS2 Server Owner</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-blue-200 mb-4">
                "Reliable Rust hosting with great performance. The support team is always helpful."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">AS</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Alex Stevens</div>
                  <div className="text-blue-300 text-sm">Rust Server Owner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="px-6 py-20 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">We're Here to Help</h2>
            <p className="text-xl text-blue-200">Multiple ways to get support when you need it</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Ticket System</h3>
                  <p className="text-blue-200">Get help from our support team</p>
                </div>
              </div>
              <p className="text-blue-200 mb-4">
                Submit a ticket and our technical team will help you with any issues. 
                Average response time: 2 hours.
              </p>
              <Link 
                href="/support" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                Open Support Ticket
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Discord Community</h3>
                  <p className="text-blue-200">Join our active community</p>
                </div>
              </div>
              <p className="text-blue-200 mb-4">
                Connect with other server owners, get quick help, and share your experiences.
              </p>
              <Link 
                href="https://discord.gg/gamecontrol" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Discord
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">GameControl</span>
              </div>
              <p className="text-blue-200 mb-4">
                Professional game server hosting with complete control and innovative features.
              </p>
              <div className="flex space-x-4">
                <Link href="https://discord.gg/gamecontrol" className="text-blue-400 hover:text-blue-300 transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="#pricing" className="text-blue-200 hover:text-white transition-colors">Minecraft Hosting</Link></li>
                <li><Link href="#pricing" className="text-blue-200 hover:text-white transition-colors">CS2 Hosting</Link></li>
                <li><Link href="#pricing" className="text-blue-200 hover:text-white transition-colors">Rust Hosting</Link></li>
                <li><Link href="/billing" className="text-blue-200 hover:text-white transition-colors">Cost Sharing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/support" className="text-blue-200 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/support" className="text-blue-200 hover:text-white transition-colors">Submit Ticket</Link></li>
                <li><Link href="https://discord.gg/gamecontrol" className="text-blue-200 hover:text-white transition-colors">Discord</Link></li>
                <li><Link href="/contact" className="text-blue-200 hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-blue-200 hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="text-blue-200 hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/billing" className="text-blue-200 hover:text-white transition-colors">Billing</Link></li>
                <li><Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm">
              © 2024 GameControl. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-blue-200 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-blue-200 hover:text-white text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}