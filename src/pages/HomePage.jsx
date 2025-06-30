import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Cpu, Zap, DollarSign, Users, Shield, Crown, Target, Calendar, HardDrive, ChevronRight, Clock, User, Percent, Calculator, TrendingUp, ShoppingCart } from 'lucide-react'
import { Button } from '../components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../components/ui/dialog'

const HomePage = () => {
  const { isLoggedIn } = useAuth()
  const { addToCart, getCartItemCount } = useCart()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using demo data')
        // Set demo announcements for development
        setAnnouncements([
          {
            id: 'demo-1',
            title: 'Welcome to MybujiPool Beta',
            summary: 'Experience the future of Bitcoin mining with our revolutionary rotating block system and free solo mining access.',
            category: 'announcement',
            is_featured: true,
            published_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            title: 'Launch Special: $1.25/day Rentals',
            summary: 'Rent mining equipment for just $1.25 per day with no percentage fees. Fair pricing for everyone.',
            category: 'product',
            is_featured: false,
            published_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
          },
          {
            id: 'demo-3',
            title: 'Understanding Solo Mining',
            summary: 'Learn how our rotating block system gives every miner a fair chance at earning the full 3.125 BTC block reward.',
            category: 'education',
            is_featured: false,
            published_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          }
        ])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      // Set empty array on error to prevent UI issues
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartMining = () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div>
      {/* Launch Date Banner */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Official Launch: July 15, 2025</span>
            <span className="text-green-200">•</span>
            <span>Beta Testing</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.65), rgba(67, 56, 202, 0.65)), url('/images/ChatGPT Image Jun 26, 2025, 11_49_53 AM.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Bolt.new Badge */}
          <div className="absolute top-0 right-0">
            <a 
              href="https://bolt.new/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
              title="Built with Bolt.new"
            >
              <img
                src="/images/white_circle_360x360.png"
                alt="Built with Bolt.new"
                width="48"
                height="48"
                className="w-12 h-12"
              />
            </a>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            MybujiPool
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 drop-shadow-md text-yellow-300">
            Free Solo Mining Access
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto drop-shadow-md leading-relaxed">
            <span className="font-semibold">Free access to solo mining.</span> <span className="font-semibold">No monthly fees.</span> <span className="font-semibold text-yellow-300">Keep 100% of block rewards.</span>
          </p>
          
          {/* Key Stats/Benefits */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-8 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-300" />
              <span>Free Solo Mining</span>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-yellow-300" />
              <span>Only $1.25/day per rental</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-300" />
              <span>Rotating Block</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-300" />
              <span>100% Block Rewards</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="shadow-lg hover:shadow-xl transition-shadow bg-yellow-500 hover:bg-yellow-400 text-black font-semibold" 
                  asChild
                >
                  <Link to="/demo-mining">Start Mining</Link>
                </Button>
                <Button 
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-shadow bg-green-600 hover:bg-green-500 text-white font-semibold"
                  asChild
                >
                  <Link to="/list-machine">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    List Your Machine
                  </Link>
                </Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="shadow-lg hover:shadow-xl transition-all bg-gray-400 hover:bg-gray-500 text-white font-semibold cursor-not-allowed opacity-75"
                onClick={handleStartMining}
              >
                Start Mining
              </Button>
            )}
          </div>
        </div>
        
        {/* Subtle overlay pattern for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Login Required Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You must be logged in to access the mining platform. Create an account or log in to start mining.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button asChild>
              <Link to="/login" onClick={() => setShowLoginDialog(false)}>
                Login
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/register" onClick={() => setShowLoginDialog(false)}>
                Sign Up
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Business Model Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Revolutionary Business Model</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Free access to solo mining with a fair, transparent fee structure that only charges when you earn
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 bg-green-50 rounded-2xl">
              <div className="text-4xl font-bold text-green-600 mb-2">FREE</div>
              <div className="text-lg font-semibold mb-2">Solo Mining Access</div>
              <div className="text-sm text-gray-600 mb-2">No monthly fees</div>
              <div className="text-sm text-gray-600 mb-4">No upfront costs</div>
              <div className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                OPEN ACCESS
              </div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">$1.25</div>
              <div className="text-lg font-semibold mb-2">Per Rental Per Day</div>
              <div className="text-sm text-gray-600 mb-2">Only pay when you rent</div>
              <div className="text-sm text-gray-600 mb-4">No percentage fees</div>
              <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                FAIR PRICING
              </div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-2xl">
              <div className="text-4xl font-bold text-purple-600 mb-2">FREE</div>
              <div className="text-lg font-semibold mb-2">Machine Listings</div>
              <div className="text-sm text-gray-600 mb-2">List unlimited machines</div>
              <div className="text-sm text-gray-600 mb-4">No listing fees</div>
              <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                OWNER FRIENDLY
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">Rotating Block System</div>
            <p className="text-gray-600">Our unique rotating block system gives everyone a fair chance at finding blocks</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Create Your Free Account</h3>
                    <p className="text-gray-600">
                      Sign up and add your Bitcoin wallet address to your profile. This is where your mining rewards will be sent.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Equipment</h3>
                    <p className="text-gray-600">
                      Connect your own mining equipment to our solo pool or rent equipment from our marketplace.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Start Mining</h3>
                    <p className="text-gray-600">
                      Your hashpower joins our rotating block system, giving you a fair chance at finding blocks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
                    <p className="text-gray-600">
                      When your wallet is selected in the rotation and a block is found, you receive the full 3.125 BTC reward.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-center">Rotating Block System</h3>
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">How Rotation Works</h4>
                  <p className="text-gray-700 text-sm">
                    Our system rotates through all active miners' wallet addresses. When a block is found, the current wallet in rotation receives the full reward.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Fair Distribution</h4>
                  <p className="text-gray-700 text-sm">
                    Rotation time is weighted by hashrate contribution, giving miners with more hashpower proportionally more time in the rotation.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Rental Fee Structure</h4>
                  <p className="text-gray-700 text-sm">
                    Machine owners list for free and pay nothing until their machine is rented. Renters pay just $1.25 per day per machine.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Transparent System</h4>
                  <p className="text-gray-700 text-sm">
                    Monitor your position in the rotation and estimated time until your wallet is active in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Announcements Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest News & Updates</h2>
              <p className="text-gray-600">Stay informed about platform updates, new features, and mining insights</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/news">
                View All News
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      announcement.category === 'announcement' ? 'bg-blue-100 text-blue-800' :
                      announcement.category === 'product' ? 'bg-green-100 text-green-800' :
                      announcement.category === 'education' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {announcement.category}
                    </span>
                    {announcement.is_featured && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                    {announcement.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {truncateText(announcement.summary)}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(announcement.published_at)}</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/news/${announcement.id}`}>
                        Read More
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements available at this time.</p>
              {!isSupabaseConfigured && (
                <p className="text-sm text-blue-600 mt-2">
                  Connect to Supabase to load real announcements
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose MybujiPool?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Percent className="text-green-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Free Solo Mining Access</h3>
                    <p className="text-gray-600">
                      Unlike competitors who charge monthly fees or take a percentage of your rewards, our solo mining pool is completely free to access.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calculator className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fair Rental Fee Structure</h3>
                    <p className="text-gray-600">
                      Just $1.25 per day per machine rental - no percentage-based fees or hidden costs. Machine owners list for free and only pay when their machines are rented.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Crown className="text-orange-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">100% Block Rewards</h3>
                    <p className="text-gray-600">
                      When you find a block, you keep the entire 3.125 BTC reward plus fees. No sharing, no reduced payouts. Solo mining at its finest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-center">Rotating Block System</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-gray-700">All miners contribute hashpower to the pool</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-gray-700">System rotates through miners' wallet addresses</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-gray-700">Rotation time is proportional to hashrate contribution</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <p className="text-gray-700">When a block is found, the current wallet gets 100% of the reward</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Mining?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join the revolution with free solo mining access and the potential for life-changing rewards. Launch date: July 15, 2025
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shadow-lg"
                asChild
              >
                <Link to="/demo-mining">
                  Start Mining Now
                </Link>
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shadow-lg"
                asChild
              >
                <Link to="/register">
                  Create Free Account
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-2 border-white/50 backdrop-blur-sm" asChild>
              <Link to="/rental-marketplace">
                Browse Rental Machines
              </Link>
            </Button>
          </div>
          
          <div className="mt-6 text-sm opacity-75">
            <p>✓ No monthly fees ✓ No hidden costs ✓ Only pay for rentals</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage