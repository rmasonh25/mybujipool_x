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
  Calendar,
  ShoppingCart,
  Star,
  Zap,
  Shield,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Gift,
  Sparkles,
  Percent,
  Calculator,
  AlertTriangle
} from 'lucide-react'

const LaunchSpecialPage = () => {
  const { isLoggedIn } = useAuth()
  const { addToCart, getCartItemCount } = useCart()
  const [launchSpecialProduct, setLaunchSpecialProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [disclaimers, setDisclaimers] = useState([])

  useEffect(() => {
    fetchLaunchSpecial()
    fetchDisclaimers()
  }, [])

  const fetchLaunchSpecial = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%Launch Special%')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      setLaunchSpecialProduct(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error('Error fetching launch special:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDisclaimers = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_disclaimers')
        .select('*')
        .eq('is_active', true)
        .in('type', ['startup_pricing', 'pricing_changes'])

      if (error) throw error
      setDisclaimers(data || [])
    } catch (error) {
      console.error('Error fetching disclaimers:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!isLoggedIn || !launchSpecialProduct) return

    try {
      setIsAdding(true)
      await addToCart(launchSpecialProduct.id)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Launch Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
              <Sparkles className="w-4 h-4" />
              STARTUP PRICING - LIMITED TIME
              <Sparkles className="w-4 h-4" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Single Rig Plan - $14.99/month
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
              Join MyBujiPool v2 at Our Lowest Rate
            </p>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Be among the first to experience our revolutionary pricing model with <strong>0% rental commissions</strong> and <strong>fixed monthly fees</strong> that beat the competition.
            </p>

            {/* Countdown Timer */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 inline-block shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-700">Launch Date: July 15, 2025</span>
              </div>
              <div className="text-sm text-gray-600">
                Startup pricing available now • Limited spots remaining
              </div>
            </div>

            {/* Price Comparison */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-gray-500 text-sm mb-2">Regular Price</div>
                  <div className="text-3xl font-bold text-gray-400 line-through">$19.95</div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 text-sm mb-2 font-semibold">Startup Special</div>
                  <div className="text-4xl font-bold text-green-600">$14.99</div>
                  <div className="text-sm text-green-600">per month</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                  <Gift className="w-5 h-5" />
                  Save $59.52 Per Year Compared to Regular Pricing!
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  {isAdding ? (
                    'Adding to Cart...'
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart - $14.99/month
                      {getCartItemCount() > 0 && (
                        <span className="ml-2 bg-white text-green-600 rounded-full px-2 py-1 text-sm">
                          {getCartItemCount()}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              ) : (
                <Button size="lg" asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 text-lg shadow-lg">
                  <Link to="/register">
                    <Crown className="w-5 h-5 mr-2" />
                    Claim Your Startup Price
                  </Link>
                </Button>
              )}
              
              <Button size="lg" variant="outline" asChild className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 text-lg">
                <Link to="/membership">
                  View All Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What's Included in Your Single Rig Plan</h2>
            <p className="text-xl text-gray-600">Everything you need to start solo mining with maximum profit potential</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Solo Mining Pool Access</h3>
              <p className="text-gray-600 text-sm">
                Connect to our exclusive solo mining pool and keep 100% of any block rewards you find.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">0% Rental Commission</h3>
              <p className="text-gray-600 text-sm">
                List your equipment for rent and keep 100% of rental income. No percentage-based fees.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1 Rig Slot</h3>
              <p className="text-gray-600 text-sm">
                Connect your own equipment OR rent a professional mining rig from our marketplace.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Statistics</h3>
              <p className="text-gray-600 text-sm">
                Monitor your hashrate, shares, and mining performance with our advanced dashboard.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Non-Custodial Mining</h3>
              <p className="text-gray-600 text-sm">
                Mine directly to your wallet. We never hold or touch your Bitcoin.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">
                Get priority support from our mining experts whenever you need help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why MyBujiPool v2 Beats the Competition</h2>
            <p className="text-xl text-gray-600">See how our revolutionary pricing model puts more money in your pocket</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Traditional Platforms */}
                <div className="p-8 border-r border-gray-200">
                  <h3 className="text-xl font-semibold mb-6 text-gray-700">NiceHash & MiningRigRentals</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">2-4% commission on all rental earnings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">Variable costs that increase with success</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">Shared mining pools with diluted rewards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">No true solo mining option</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">Charges based on hashpower</span>
                    </li>
                  </ul>
                </div>

                {/* MyBujiPool v2 */}
                <div className="p-8 bg-gradient-to-br from-green-50 to-blue-50">
                  <h3 className="text-xl font-semibold mb-6 text-green-700">MyBujiPool v2</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700"><strong>0% commission</strong> on all rental earnings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700"><strong>Fixed monthly fee</strong> regardless of volume</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700"><strong>True solo mining</strong> with 100% block rewards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700"><strong>Dual revenue</strong> from mining and rentals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700"><strong>Charges per rig</strong> not by hashpower</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Disclaimers */}
      {disclaimers.length > 0 && (
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                      Important Pricing Information
                    </h3>
                    <div className="space-y-4">
                      {disclaimers.map((disclaimer) => (
                        <div key={disclaimer.id}>
                          <h4 className="font-medium text-yellow-800 mb-1">{disclaimer.title}</h4>
                          <p className="text-sm text-yellow-700">{disclaimer.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials/Social Proof */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join the Early Adopters</h2>
            <p className="text-xl text-gray-600">Be part of the solo mining revolution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600 mb-2">500+</h3>
              <p className="text-gray-600">Early access signups</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">50+ TH/s</h3>
              <p className="text-gray-600">Combined hashpower ready</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">4.9/5</h3>
              <p className="text-gray-600">Beta tester satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">How long does the startup pricing last?</h3>
              <p className="text-gray-600">The startup price of $14.99/month is our introductory rate for the first year of operation. We reserve the right to adjust pricing with 30 days notice, but early adopters will receive preferential consideration for future rate changes.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">What does "0% rental commission" mean?</h3>
              <p className="text-gray-600">Unlike competitors who take 2-4% of your rental earnings, we charge absolutely no commission on equipment rentals. You keep 100% of your rental income (minus standard payment processing fees). Our revenue comes exclusively from subscription fees.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">What are my chances of finding a block?</h3>
              <p className="text-gray-600">Block discovery depends on your hashrate and luck. With 100 TH/s, you have roughly a 1 in 5,000 chance per day. While rare, solo miners do find blocks regularly. The current block reward is 3.125 BTC (~$200,000+).</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Can I use my existing mining equipment?</h3>
              <p className="text-gray-600">Yes! Connect your ASICs, GPU rigs, or CPU miners directly to our pool. Each subscription plan includes a specific number of rig slots that can be used for your own equipment or rented machines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Don't Miss Our Startup Pricing</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the solo mining revolution with our competitive pricing model. 
            Limited spots available at startup rates.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Button 
                onClick={handleAddToCart}
                disabled={isAdding}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 text-lg shadow-lg"
              >
                {isAdding ? (
                  'Adding to Cart...'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart - $14.99/month
                  </>
                )}
              </Button>
            ) : (
              <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 text-lg shadow-lg">
                <Link to="/register">
                  <Crown className="w-5 h-5 mr-2" />
                  Claim Your Spot Now
                </Link>
              </Button>
            )}
            
            <Button size="lg" variant="outline" asChild className="border-2 border-white text-white hover:bg-white/10 font-semibold py-4 px-8 text-lg">
              <Link to="/membership">
                Compare All Plans
              </Link>
            </Button>
          </div>

          <div className="mt-8 text-sm opacity-75">
            <p>✓ No long-term contracts ✓ Cancel anytime ✓ 30-day pricing change notice</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LaunchSpecialPage