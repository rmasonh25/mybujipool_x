import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatHashrate } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../components/ui/dialog'
import { 
  Cpu, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2, 
  Lock,
  AlertTriangle,
  Shield,
  UserCheck,
  Plus,
  Wallet,
  Rotate3D,
  Target,
  BarChart3,
  Timer
} from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myAsics, setMyAsics] = useState([])
  const [myRentals, setMyRentals] = useState([])
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showOwnerDialog, setShowOwnerDialog] = useState(false)
  
  // Rotation system simulation
  const [rotationStatus, setRotationStatus] = useState({
    isActive: false,
    position: 0,
    totalMiners: 0,
    estimatedTimeRemaining: 0,
    estimatedTimeUntilActive: 0
  })

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  useEffect(() => {
    // Simulate rotation status updates
    const interval = setInterval(() => {
      setRotationStatus(prev => {
        // Randomly determine if wallet is active
        const isActive = Math.random() > 0.8
        
        // Random position in queue (1-20)
        const position = Math.floor(Math.random() * 20) + 1
        
        // Random total miners (50-200)
        const totalMiners = Math.floor(Math.random() * 150) + 50
        
        // Random time remaining if active (0-60 minutes)
        const estimatedTimeRemaining = isActive ? Math.floor(Math.random() * 60) : 0
        
        // Random time until active if not active (5-120 minutes)
        const estimatedTimeUntilActive = !isActive ? Math.floor(Math.random() * 115) + 5 : 0
        
        return {
          isActive,
          position,
          totalMiners,
          estimatedTimeRemaining,
          estimatedTimeUntilActive
        }
      })
    }, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (userError && userError.code !== 'PGRST116') throw userError
      setUserProfile(userData)
      
      // Check for owner profile
      const { data: ownerData, error: ownerError } = await supabase
        .from('machine_owners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (ownerError && ownerError.code !== 'PGRST116') throw ownerError
      setOwnerProfile(ownerData)
      
      // Get user's ASICs (from rental_machines table)
      const { data: asicsData, error: asicsError } = await supabase
        .from('rental_machines')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        
      if (asicsError) throw asicsError
      
      setMyAsics(asicsData || [])
      
      // Get user's active rentals
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          *,
          machine:machine_id(*)
        `)
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false })
        
      if (rentalsError) throw rentalsError
      
      setMyRentals(rentalsData || [])
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAsic = async (asicId) => {
    if (!confirm('Are you sure you want to delete this machine listing?')) return
    
    try {
      const { error } = await supabase
        .from('rental_machines')
        .delete()
        .eq('id', asicId)
        .eq('owner_id', user.id)
      
      if (error) throw error
      
      // Refresh data
      fetchUserData()
    } catch (error) {
      console.error('Error deleting machine:', error)
      setError('Failed to delete machine listing')
    }
  }

  const toggleAsicListing = async (asicId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('rental_machines')
        .update({ is_available: !currentStatus })
        .eq('id', asicId)
        .eq('owner_id', user.id)
      
      if (error) throw error
      
      // Refresh data
      fetchUserData()
    } catch (error) {
      console.error('Error updating machine listing:', error)
      setError('Failed to update machine listing')
    }
  }

  const handleListAsicClick = () => {
    // Check if user has completed owner verification
    if (!ownerProfile || !ownerProfile.payout_enabled || !ownerProfile.agreement_accepted) {
      setShowOwnerDialog(true)
      return
    }
    
    // User is verified, proceed to listing
    navigate('/list-machine')
  }

  const handleStartOwnerSetup = () => {
    setShowOwnerDialog(false)
    navigate('/owner-signup')
  }

  const handleGoToOwnerDashboard = () => {
    setShowOwnerDialog(false)
    navigate('/owner-dashboard')
  }

  const isVerifiedOwner = ownerProfile?.payout_enabled && ownerProfile?.agreement_accepted

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
            <p className="text-gray-600">
              Monitor your mining activity, track rentals, and manage your equipment
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Owner Status Badge */}
            {ownerProfile && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isVerifiedOwner 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isVerifiedOwner ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Verified Owner</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Setup Required</span>
                  </>
                )}
              </div>
            )}
            
            {/* List Machine Button */}
            <Button 
              onClick={handleListAsicClick}
              className={`flex items-center gap-2 ${!isVerifiedOwner ? 'opacity-75' : ''}`}
            >
              {isVerifiedOwner ? (
                <>
                  <Plus className="w-4 h-4" />
                  List New Machine
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  List New Machine
                </>
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Wallet Address Warning */}
        {!userProfile?.wallet_address && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Wallet Address Required
                </h3>
                <p className="text-yellow-700 mb-4">
                  You need to add a Bitcoin wallet address to your profile to receive mining rewards. This wallet will be used in the rotation system.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/profile')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Add Wallet Address
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Owner Setup Reminder */}
        {!isVerifiedOwner && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">
                  {ownerProfile ? 'Complete Owner Verification' : 'Become a Machine Owner'}
                </h3>
                <p className="text-blue-700 mb-4">
                  {ownerProfile 
                    ? 'Complete your owner verification to start listing mining equipment for rent.'
                    : 'Set up your owner profile to list your mining equipment and start earning rental income.'
                  }
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={ownerProfile ? handleGoToOwnerDashboard : handleStartOwnerSetup}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {ownerProfile ? 'Complete Setup' : 'Get Started'}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/owner-dashboard">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rotation Status */}
        {userProfile?.wallet_address && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Rotate3D className="w-5 h-5 text-blue-600" />
              Rotation Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className={`p-4 rounded-lg ${rotationStatus.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Wallet Status</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rotationStatus.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {rotationStatus.isActive ? 'ACTIVE' : 'WAITING'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Your Wallet:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {userProfile.wallet_address}
                      </span>
                    </div>
                    
                    {rotationStatus.isActive ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time Remaining:</span>
                        <span className="text-green-600 font-medium">
                          ~{rotationStatus.estimatedTimeRemaining} minutes
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Position in Queue:</span>
                          <span className="font-medium">
                            {rotationStatus.position} of {rotationStatus.totalMiners}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estimated Wait:</span>
                          <span className="font-medium">
                            ~{rotationStatus.estimatedTimeUntilActive} minutes
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">How Rotation Works</h4>
                  <p className="text-sm text-blue-700">
                    Our system rotates through all miners' wallet addresses based on hashrate contribution. When your wallet is active and a block is found, you receive the full 3.125+ BTC reward.
                  </p>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-3">Mining Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Your Hashrate</p>
                      <p className="font-medium">
                        {formatHashrate(Math.random() * 100 + 50)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pool Hashrate</p>
                      <p className="font-medium">
                        {formatHashrate(Math.random() * 10000 + 5000)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Shares Submitted</p>
                      <p className="font-medium">
                        {Math.floor(Math.random() * 10000)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Blocks Found</p>
                      <p className="font-medium">0</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link to="/demo-mining">
                      <Target className="w-4 h-4 mr-2" />
                      Start Mining
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/rental-marketplace">
                      <Plus className="w-4 h-4 mr-2" />
                      Rent More Hashpower
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Machines</p>
                <p className="text-2xl font-bold">{myAsics.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Rentals</p>
                <p className="text-2xl font-bold">{myRentals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Machines</p>
                <p className="text-2xl font-bold">{myAsics.filter(a => a.is_available).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Rentals</p>
                <p className="text-2xl font-bold">{myRentals.filter(r => r.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="my-machines">
          <TabsList className="mb-8">
            <TabsTrigger value="my-machines">My Machines</TabsTrigger>
            <TabsTrigger value="my-rentals">My Rentals</TabsTrigger>
            <TabsTrigger value="mining-stats">Mining Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-machines">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Machine Listings</h2>
              <Button 
                onClick={handleListAsicClick}
                className={`flex items-center gap-2 ${!isVerifiedOwner ? 'opacity-75' : ''}`}
              >
                {isVerifiedOwner ? (
                  <>
                    <Plus className="w-4 h-4" />
                    List New Machine
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    List New Machine
                  </>
                )}
              </Button>
            </div>
            
            {myAsics.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Machines Listed</h3>
                <p className="text-gray-500 mb-4">
                  {isVerifiedOwner 
                    ? "You haven't listed any machines for rent yet. Start earning by listing your mining equipment."
                    : "Complete owner verification to start listing your mining equipment for rent."
                  }
                </p>
                <Button onClick={handleListAsicClick}>
                  {isVerifiedOwner ? 'List Your First Machine' : 'Get Started'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAsics.map((machine) => (
                  <div key={machine.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-40 bg-gray-200 relative">
                      {machine.image_url ? (
                        <img 
                          src={machine.image_url} 
                          alt={machine.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Cpu className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                        machine.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {machine.is_available ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{machine.name}</h3>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Hashrate</p>
                          <p className="font-medium">{formatHashrate(machine.hashrate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Daily Rate</p>
                          <p className="font-medium">{formatCurrency(machine.daily_rate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button 
                          variant={machine.is_available ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => toggleAsicListing(machine.id, machine.is_available)}
                        >
                          {machine.is_available ? 'Disable' : 'Enable'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteAsic(machine.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-rentals">
            <h2 className="text-xl font-semibold mb-6">My Active Rentals</h2>
            
            {myRentals.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Rentals</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any active machine rentals at the moment. Browse the marketplace to rent equipment!
                </p>
                <Button asChild>
                  <Link to="/rental-marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRentals.map((rental) => {
                  const machine = rental.machine
                  
                  return (
                    <div key={rental.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold">{machine?.name || 'Machine'}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {rental.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Daily Rate</p>
                            <p className="font-medium">{formatCurrency(rental.daily_rate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Days</p>
                            <p className="font-medium">{rental.total_days}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="font-medium">{new Date(rental.start_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="font-medium">{new Date(rental.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-2">Mining Connection Details</h4>
                          <p className="text-sm mb-1">
                            <span className="font-medium">Pool URL:</span> {rental.mining_pool_config?.stratum_url || 'N/A'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Worker:</span> {rental.mining_pool_config?.worker_name || 'N/A'}
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button size="sm">
                            Manage Rental
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mining-stats">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Mining Statistics
              </h2>
              
              {!userProfile?.wallet_address ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Wallet Address Required</h3>
                  <p className="text-gray-500 mb-4">
                    You need to add a Bitcoin wallet address to your profile to start mining and see statistics.
                  </p>
                  <Button asChild>
                    <Link to="/profile">Add Wallet Address</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rotation Status */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">Rotation Status</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className={`p-4 rounded-lg ${rotationStatus.isActive ? 'bg-green-100' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Current Status</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rotationStatus.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                              {rotationStatus.isActive ? 'ACTIVE' : 'WAITING'}
                            </span>
                          </div>
                          
                          {rotationStatus.isActive ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Time Remaining:</span>
                                <span className="font-medium text-green-700">
                                  ~{rotationStatus.estimatedTimeRemaining} minutes
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Wallet:</span>
                                <span className="font-mono text-xs truncate max-w-[150px]">
                                  {userProfile.wallet_address}
                                </span>
                              </div>
                              <div className="mt-2 text-green-700 text-xs">
                                Your wallet is currently active in the rotation. If a block is found now, you'll receive the full reward!
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Position:</span>
                                <span className="font-medium">
                                  {rotationStatus.position} of {rotationStatus.totalMiners}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Est. Wait Time:</span>
                                <span className="font-medium">
                                  ~{rotationStatus.estimatedTimeUntilActive} minutes
                                </span>
                              </div>
                              <div className="mt-2 text-blue-700 text-xs">
                                Your wallet is in the queue. Estimated time until active is based on current hashrate distribution.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Your Contribution</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Your Hashrate:</span>
                              <span className="font-medium">
                                {formatHashrate(Math.random() * 100 + 50)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pool Share:</span>
                              <span className="font-medium">
                                {(Math.random() * 5 + 0.1).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rotation Time:</span>
                              <span className="font-medium">
                                ~{Math.floor(Math.random() * 60 + 10)} min/day
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Pool Statistics</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Hashrate:</span>
                              <span className="font-medium">
                                {formatHashrate(Math.random() * 10000 + 5000)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Active Miners:</span>
                              <span className="font-medium">
                                {rotationStatus.totalMiners}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Blocks Found:</span>
                              <span className="font-medium">
                                {Math.floor(Math.random() * 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mining Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">Performance</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shares Submitted:</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 10000 + 1000)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accepted Shares:</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 9000 + 1000)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efficiency:</span>
                          <span className="font-medium">
                            {(Math.random() * 5 + 95).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Timer className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium">Uptime</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Connected Since:</span>
                          <span className="font-medium">
                            {new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Uptime:</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 168 + 24)} hours
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Availability:</span>
                          <span className="font-medium">
                            {(Math.random() * 5 + 95).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <h3 className="font-medium">Rewards</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blocks Found:</span>
                          <span className="font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potential Reward:</span>
                          <span className="font-medium">3.125+ BTC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">USD Value:</span>
                          <span className="font-medium">$200,000+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Important Note</h4>
                        <p className="text-sm text-yellow-700">
                          Solo mining with our rotating block system means you have a chance at winning full block rewards, but success depends on luck and timing. The more hashrate you contribute, the more time your wallet spends in the active position.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Owner Setup Required Dialog */}
      <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Owner Verification Required
            </DialogTitle>
            <DialogDescription>
              Complete owner verification to list mining equipment for rent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                {ownerProfile ? 'Complete Your Setup' : 'Become a Machine Owner'}
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                {ownerProfile 
                  ? 'You need to complete owner verification before listing equipment.'
                  : 'Set up your owner profile to start earning rental income from your mining equipment.'
                }
              </p>
              
              {ownerProfile && (
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${
                    ownerProfile.business_name ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {ownerProfile.business_name ? '✓' : '○'} Business information
                  </div>
                  <div className={`flex items-center gap-2 ${
                    ownerProfile.agreement_accepted ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {ownerProfile.agreement_accepted ? '✓' : '○'} Rental agreement
                  </div>
                  <div className={`flex items-center gap-2 ${
                    ownerProfile.payout_enabled ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {ownerProfile.payout_enabled ? '✓' : '○'} Payment setup
                  </div>
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Benefits of Listing</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Earn passive income from your equipment</li>
                <li>• Free listings - only $1.25 per day when rented</li>
                <li>• Automatic payment processing</li>
                <li>• 24/7 customer support</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowOwnerDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={ownerProfile ? handleGoToOwnerDashboard : handleStartOwnerSetup}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {ownerProfile ? 'Complete Setup' : 'Get Started'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DashboardPage