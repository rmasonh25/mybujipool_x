import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { 
  Check, 
  Crown, 
  Target, 
  Cpu, 
  Calendar,
  DollarSign,
  Shield,
  Zap,
  Users,
  Star,
  AlertTriangle,
  Monitor,
  Laptop,
  HardDrive,
  ShoppingCart,
  Building,
  TrendingUp,
  Phone,
  Calculator,
  Clock,
  Wallet,
  Settings,
  BarChart3,
  Info,
  ExternalLink,
  Award,
  Percent,
  Rotate3D
} from 'lucide-react'

const MembershipPage = () => {
  const { isLoggedIn } = useAuth()
  const [disclaimers, setDisclaimers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDisclaimers()
    setLoading(false)
  }, [])

  const fetchDisclaimers = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_disclaimers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      setDisclaimers(data || [])
    } catch (error) {
      console.error('Error fetching disclaimers:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">MyBujiPool v2: Free Solo Mining Access</h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Our revolutionary model gives you free access to solo mining with a fair, transparent fee structure.
          <strong> No monthly fees</strong> and <strong>only $1.25 per day</strong> for machine rentals.
        </p>
        
        {/* Launch Date Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-lg mt-6 inline-block">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Official Launch: July 15, 2025</span>
            <span className="text-green-200">•</span>
            <span>Free Access Available Now</span>
          </div>
        </div>
      </div>

      {/* New Business Model Highlight */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-8 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Our New Business Model</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Free access to solo mining with a simple, fair fee structure
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="text-3xl font-bold mb-2">FREE</div>
            <div className="text-lg font-semibold mb-2">Solo Mining Access</div>
            <div className="text-sm opacity-90">No monthly fees</div>
            <div className="text-sm opacity-90">No subscription required</div>
            <div className="mt-3 px-3 py-1 bg-green-500 rounded-full text-sm font-medium">
              OPEN TO ALL
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="text-3xl font-bold mb-2">$1.25</div>
            <div className="text-lg font-semibold mb-2">Per Machine Per Day</div>
            <div className="text-sm opacity-90">Only pay when you rent</div>
            <div className="text-sm opacity-90">No percentage fees</div>
            <div className="mt-3 px-3 py-1 bg-blue-500 rounded-full text-sm font-medium">
              SIMPLE PRICING
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="text-3xl font-bold mb-2">FREE</div>
            <div className="text-lg font-semibold mb-2">Machine Listings</div>
            <div className="text-sm opacity-90">List unlimited machines</div>
            <div className="text-sm opacity-90">No listing fees</div>
            <div className="mt-3 px-3 py-1 bg-purple-500 rounded-full text-sm font-medium">
              OWNER FRIENDLY
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <div className="text-2xl font-bold mb-2">Rotating Block System</div>
          <p className="opacity-90">Our unique rotating block system gives everyone a fair chance at finding blocks</p>
        </div>
      </div>

      {/* Rotating Block System Explanation */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">How Our Rotating Block System Works</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Rotate3D className="text-blue-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fair Rotation System</h3>
                  <p className="text-gray-600">
                    All miners contribute hashpower to the pool, but instead of sharing rewards, we rotate through miners' wallet addresses. When a block is found, the current wallet in rotation receives the full reward.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calculator className="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Hashrate-Weighted Time</h3>
                  <p className="text-gray-600">
                    Your time in the rotation is proportional to your hashrate contribution. If you contribute 10% of the pool's hashrate, your wallet will be active for 10% of the time.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="text-purple-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">100% Block Reward</h3>
                  <p className="text-gray-600">
                    When a block is found while your wallet is active in the rotation, you receive the entire block reward (currently 3.125 BTC) plus transaction fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-center">Example Scenario</h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Pool Setup</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Total Pool Hashrate: 1,000 TH/s</li>
                  <li>• Your Contribution: 100 TH/s (10%)</li>
                  <li>• Other Miners: 900 TH/s (90%)</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Rotation Time</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Your wallet is active for 10% of the time</li>
                  <li>• In a 24-hour period, your wallet is active for ~2.4 hours</li>
                  <li>• Rotation is continuous and automatic</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Reward Potential</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• If a block is found during your rotation: You get 3.125+ BTC</li>
                  <li>• Expected value matches traditional pool mining</li>
                  <li>• But with potential for much larger individual rewards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Fee Structure */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Simple, Transparent Rental Fee Structure</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-800">For Renters</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">$1.25 per machine per day</p>
                  <p className="text-sm text-gray-600">Simple, flat-rate pricing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">No monthly subscription required</p>
                  <p className="text-sm text-gray-600">Only pay for what you use</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">No percentage-based fees</p>
                  <p className="text-sm text-gray-600">Unlike competitors who charge 2-4% of earnings</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Free access to solo mining pool</p>
                  <p className="text-sm text-gray-600">Use your own equipment at no cost</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-center text-green-800">For Machine Owners</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Free machine listings</p>
                  <p className="text-sm text-gray-600">List as many machines as you want</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Set your own rental rates</p>
                  <p className="text-sm text-gray-600">Complete control over your pricing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Only $1.25 per rental per day</p>
                  <p className="text-sm text-gray-600">No fees if your machine isn't rented</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Automatic payments</p>
                  <p className="text-sm text-gray-600">Get paid directly to your account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-yellow-50 rounded-xl max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Example Calculation</h3>
              <p className="text-yellow-700 mb-4">
                If you rent a machine for 30 days, you'll pay just $37.50 in platform fees ($1.25 × 30 days). 
                Compare this to traditional platforms that would charge 2-4% of your earnings.
              </p>
              <div className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Machine daily rate:</p>
                    <p className="text-gray-600">$25.00</p>
                  </div>
                  <div>
                    <p className="font-medium">Rental period:</p>
                    <p className="text-gray-600">30 days</p>
                  </div>
                  <div>
                    <p className="font-medium">Total rental cost:</p>
                    <p className="text-gray-600">$750.00</p>
                  </div>
                  <div>
                    <p className="font-medium">Platform fee:</p>
                    <p className="text-gray-600">$37.50 ($1.25 × 30 days)</p>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <p className="font-medium">Total cost:</p>
                    <p className="text-green-600 font-bold">$787.50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Advantage Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <h2 className="text-2xl font-bold mb-4">How We Compare to Competitors</h2>
          <p className="text-blue-100">
            Our model is designed to be more fair, transparent, and potentially more profitable than traditional mining platforms.
          </p>
        </div>
        
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">MyBujiPool v2</th>
                  <th className="text-center py-4 px-4">NiceHash</th>
                  <th className="text-center py-4 px-4">Traditional Pools</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4 px-4 font-medium">Access Cost</td>
                  <td className="text-center py-4 px-4 bg-green-50 text-green-700 font-medium">FREE</td>
                  <td className="text-center py-4 px-4">Free with limitations</td>
                  <td className="text-center py-4 px-4">Free with limitations</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Rental Fee Structure</td>
                  <td className="text-center py-4 px-4 bg-green-50 text-green-700 font-medium">$1.25 per day flat fee</td>
                  <td className="text-center py-4 px-4">2% of rental value</td>
                  <td className="text-center py-4 px-4">N/A</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Reward Structure</td>
                  <td className="text-center py-4 px-4 bg-green-50 text-green-700 font-medium">100% of block (rotating)</td>
                  <td className="text-center py-4 px-4">Proportional share</td>
                  <td className="text-center py-4 px-4">Proportional share</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Machine Listing Fee</td>
                  <td className="text-center py-4 px-4 bg-green-50 text-green-700 font-medium">FREE</td>
                  <td className="text-center py-4 px-4">Free + 2% commission</td>
                  <td className="text-center py-4 px-4">N/A</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Potential Reward Size</td>
                  <td className="text-center py-4 px-4 bg-green-50 text-green-700 font-medium">Full block (3.125+ BTC)</td>
                  <td className="text-center py-4 px-4">Small, frequent payouts</td>
                  <td className="text-center py-4 px-4">Small, frequent payouts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing Disclaimers */}
      {disclaimers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-16">
          <div className="flex items-start gap-4 mb-6">
            <Info className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Important Information</h2>
              <p className="text-yellow-700">
                Please review these important notes about our platform and fee structure.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {disclaimers.map((disclaimer) => (
              <div key={disclaimer.id} className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">{disclaimer.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{disclaimer.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive FAQ */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Platform & Pricing */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                How does the rotating block system work?
              </h3>
              <p className="text-gray-600 text-sm">
                Our system rotates through all active miners' wallet addresses based on their hashrate contribution. When a block is found, the current wallet in rotation receives the full reward. This gives everyone a fair chance at winning full blocks while maintaining expected value similar to traditional pools.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Why is your fee structure better than competitors?
              </h3>
              <p className="text-gray-600 text-sm">
                Traditional platforms charge 2-4% of your earnings or rental income. Our flat fee of $1.25 per day per rental is more predictable and often cheaper, especially for high-value machines. Plus, solo mining access is completely free - you only pay when you rent equipment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-green-600" />
                Are there any hidden fees?
              </h3>
              <p className="text-gray-600 text-sm">
                No hidden fees. Solo mining access is completely free. If you rent a machine, you pay just $1.25 per day per machine to the platform, plus the rental rate set by the machine owner. If you list your machine, you pay nothing until it's rented, then just $1.25 per day per rental.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                How often does the wallet rotation change?
              </h3>
              <p className="text-gray-600 text-sm">
                The rotation is continuous and proportional to hashrate contribution. If you contribute 10% of the pool's hashrate, your wallet will be active for 10% of the time. You can monitor your position in the rotation and estimated time until your wallet is active in real-time on your dashboard.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-yellow-600" />
                What happens if I find a block?
              </h3>
              <p className="text-gray-600 text-sm">
                You keep 100% of the block reward (currently 3.125 BTC plus transaction fees, worth $200,000+ at current prices). The reward goes directly to your wallet - we never hold or touch your Bitcoin. This is the key advantage of our rotating solo mining system.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                How do you make money if access is free?
              </h3>
              <p className="text-gray-600 text-sm">
                Our revenue comes from the $1.25 daily fee on machine rentals. This simple, transparent model allows us to provide free solo mining access while maintaining a sustainable business. As the rental marketplace grows, so does our revenue.
              </p>
            </div>
          </div>
          
          {/* Technical & Mining */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                What equipment types are supported?
              </h3>
              <p className="text-gray-600 text-sm">
                We support Bitcoin ASICs (SHA-256), GPU rigs, and CPU miners. Popular models include Antminer S19/S21 series, WhatsMiner M30S/M60S, and custom GPU rigs. Our platform is optimized for Bitcoin mining but can accommodate other SHA-256 cryptocurrencies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                What are my chances of finding a block?
              </h3>
              <p className="text-gray-600 text-sm">
                Your chance of finding a block during your rotation time depends on the total pool hashrate and network difficulty. The expected value matches traditional pool mining, but instead of small regular payments, you have a chance at winning full blocks when your wallet is in rotation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                How do I connect my equipment?
              </h3>
              <p className="text-gray-600 text-sm">
                Point your miners to our pool: stratum+tcp://pool.mybuji.com:3333 with your Bitcoin wallet address as the username. We provide detailed setup guides for popular ASIC models, GPU mining software, and CPU miners. Support is available 24/7.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                What statistics do you provide?
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time hashrate monitoring, share submission tracking, equipment status, historical performance data, rotation position tracking, estimated time until your wallet is active, and block discovery notifications.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                How does rental income work?
              </h3>
              <p className="text-gray-600 text-sm">
                List your equipment with competitive daily rates. When rented, you earn the full amount minus the $1.25 daily platform fee. Payments are processed automatically via Stripe within 2 business days.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-600" />
                What support do you offer?
              </h3>
              <p className="text-gray-600 text-sm">
                24/7 technical support via chat and email for all users. We also provide setup assistance and mining optimization guidance. Our support team is experienced in mining operations and can help with any issues you encounter.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Disclaimers */}
        <div className="mt-12 pt-8 border-t">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  Important Mining Disclaimers & Risk Factors
                </h3>
                <div className="text-yellow-700 space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Block Discovery Reality:</h4>
                    <p>Finding blocks in solo mining is extremely rare and unpredictable. Most miners will not find blocks during their active rotation time. Success depends on hashpower, luck, and network difficulty. The current Bitcoin network difficulty makes block discovery challenging even with significant hashpower.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Financial Risk Warning:</h4>
                    <p>Cryptocurrency mining involves substantial financial risk. Only invest what you can afford to lose completely. Electricity costs, equipment depreciation, market volatility, and network difficulty changes can result in losses. Past performance does not guarantee future results.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Platform Revenue Model:</h4>
                    <p>Our revenue comes exclusively from the $1.25 daily fee on machine rentals. We do not take any portion of block rewards or rental income - they go 100% to miners and machine owners. We succeed when our platform grows through consistent, reliable service.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Rotation System Fairness:</h4>
                    <p>Our rotation system is designed to be fair and transparent, with rotation time proportional to hashrate contribution. However, the timing of block discoveries is random, and there is no guarantee that a block will be found during your rotation time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Mining?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join the mining revolution with our free access model and rotating block system.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isLoggedIn ? (
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              asChild
            >
              <Link to="/demo-mining">
                Start Mining Now
              </Link>
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              asChild
            >
              <Link to="/register">
                Create Free Account
              </Link>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <Link to="/rental-marketplace">
              Browse Rental Marketplace
            </Link>
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>✓ No monthly fees ✓ No hidden costs ✓ Only pay for rentals</p>
        </div>
      </div>
    </div>
  )
}

export default MembershipPage