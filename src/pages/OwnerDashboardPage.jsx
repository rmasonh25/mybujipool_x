import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../components/ui/dialog'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Settings,
  Plus,
  Edit,
  Eye,
  BarChart3,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  FileText,
  UserCheck,
  Lock,
  Info
} from 'lucide-react'

const OwnerDashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [machines, setMachines] = useState([])
  const [rentals, setRentals] = useState([])
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingSettings, setEditingSettings] = useState(false)
  const [showAgreementDialog, setShowAgreementDialog] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  // Demo profile for testing
  const [showDemoProfile, setShowDemoProfile] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOwnerData()
    }
  }, [user])

  const fetchOwnerData = async () => {
    try {
      setLoading(true)
      
      // Fetch owner profile
      const { data: profiles, error: profileError } = await supabase
        .from('machine_owners')
        .select('*')
        .eq('user_id', user.id)
      
      if (profileError) throw profileError
      
      const profile = profiles && profiles.length > 0 ? profiles[0] : null
      setOwnerProfile(profile)
      
      // Fetch machines only if owner profile exists and is verified
      if (profile && profile.payout_enabled) {
        const { data: machinesData, error: machinesError } = await supabase
          .from('rental_machines')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        
        if (machinesError) throw machinesError
        setMachines(machinesData || [])
        
        // Fetch rentals
        const { data: rentalsData, error: rentalsError } = await supabase
          .from('rentals')
          .select(`
            *,
            machine:machine_id(name, model),
            renter:renter_id(email)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        
        if (rentalsError) throw rentalsError
        setRentals(rentalsData || [])
        
        // Calculate earnings
        const totalEarnings = rentalsData?.reduce((sum, rental) => {
          if (rental.payment_status === 'paid') {
            return sum + (rental.owner_payout || 0)
          }
          return sum
        }, 0) || 0
        
        const pendingEarnings = rentalsData?.reduce((sum, rental) => {
          if (rental.payment_status === 'pending') {
            return sum + (rental.owner_payout || 0)
          }
          return sum
        }, 0) || 0
        
        setEarnings({
          total: totalEarnings,
          pending: pendingEarnings,
          paid: totalEarnings - pendingEarnings
        })
      }
      
    } catch (error) {
      console.error('Error fetching owner data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOwnerProfile = async () => {
    try {
      const { error } = await supabase
        .from('machine_owners')
        .insert({
          user_id: user.id,
          contact_email: user.email,
          payout_enabled: false,
          agreement_accepted: false,
          verification_status: 'pending'
        })
      
      if (error) throw error
      await fetchOwnerData()
    } catch (error) {
      console.error('Error creating owner profile:', error)
      setError('Failed to create owner profile')
    }
  }

  const handleCreateDemoProfile = async () => {
    try {
      const { error } = await supabase
        .from('machine_owners')
        .upsert({
          user_id: user.id,
          business_name: 'Demo Mining Co.',
          contact_email: user.email,
          contact_phone: '+1 (555) 123-4567',
          tax_id: 'DEMO-123456789',
          address: {
            line1: '123 Demo Street',
            city: 'Austin',
            state: 'TX',
            postal_code: '78701',
            country: 'US'
          },
          payout_enabled: true,
          bank_account_verified: true,
          agreement_accepted: true,
          verification_status: 'verified',
          stripe_account_id: `acct_demo_${user.id}`,
          payout_schedule: 'weekly',
          minimum_payout: 50.00
        }, {
          onConflict: 'user_id'
        })
      
      if (error) throw error
      await fetchOwnerData()
      setShowDemoProfile(false)
    } catch (error) {
      console.error('Error creating demo profile:', error)
      setError('Failed to create demo profile')
    }
  }

  const handleAcceptAgreement = async () => {
    try {
      const { error } = await supabase
        .from('machine_owners')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error
      
      setAgreementAccepted(true)
      setShowAgreementDialog(false)
      await fetchOwnerData()
    } catch (error) {
      console.error('Error accepting agreement:', error)
      setError('Failed to accept agreement')
    }
  }

  const handleViewMachine = (machineId) => {
    navigate(`/rental-marketplace?machine=${machineId}`)
  }

  const handleEditMachine = (machineId) => {
    navigate(`/edit-machine/${machineId}`)
  }

  const handleDeleteMachine = async (machineId) => {
    if (!confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('rental_machines')
        .delete()
        .eq('id', machineId)
        .eq('owner_id', user.id)

      if (error) throw error

      await fetchOwnerData()
    } catch (error) {
      console.error('Error deleting machine:', error)
      setError('Failed to delete machine')
    }
  }

  const handleToggleAvailability = async (machineId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('rental_machines')
        .update({ is_available: !currentStatus })
        .eq('id', machineId)
        .eq('owner_id', user.id)

      if (error) throw error
      await fetchOwnerData()
    } catch (error) {
      console.error('Error updating machine availability:', error)
      setError('Failed to update machine availability')
    }
  }

  const handleConnectStripe = () => {
    alert('Demo: This would redirect to Stripe Connect onboarding to set up payouts')
  }

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('machine_owners')
        .update({
          business_name: ownerProfile.business_name,
          contact_email: ownerProfile.contact_email,
          contact_phone: ownerProfile.contact_phone,
          tax_id: ownerProfile.tax_id,
          payout_schedule: ownerProfile.payout_schedule,
          minimum_payout: ownerProfile.minimum_payout,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setEditingSettings(false)
      await fetchOwnerData()
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const isVerified = ownerProfile?.payout_enabled && ownerProfile?.agreement_accepted
  const canAddMachines = isVerified

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show setup flow if no owner profile
  if (!ownerProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Become a Machine Owner</h1>
          <p className="text-xl text-gray-600 mb-8">
            Start earning by renting out your mining equipment to other miners.
          </p>
          
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Create Owner Profile</h3>
                  <p className="text-sm text-gray-600">Set up your business information and contact details</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Accept Rental Agreement</h3>
                  <p className="text-sm text-gray-600">Review and accept the machine owner terms</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Connect Stripe Account</h3>
                  <p className="text-sm text-gray-600">Link your bank account for automatic payouts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h3 className="font-medium">List Your Machines</h3>
                  <p className="text-sm text-gray-600">Add your mining equipment and start earning</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleCreateOwnerProfile} size="lg">
              Create Owner Profile
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/owner-signup">Complete Full Setup</Link>
            </Button>
          </div>

          {/* Demo Profile Option */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Demo Mode</h3>
            <p className="text-sm text-yellow-700 mb-4">
              For testing purposes, you can create a pre-verified demo profile with sample data.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowDemoProfile(true)}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Create Demo Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-gray-600">
              Manage your mining equipment rentals and track earnings
            </p>
          </div>
          
          {/* Verification Status */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isVerified ? (
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
            
            <Button 
              className={`flex items-center gap-2 ${!canAddMachines ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canAddMachines}
              asChild={canAddMachines}
              onClick={!canAddMachines ? () => setError('Complete verification to add machines') : undefined}
            >
              {canAddMachines ? (
                <Link to="/list-machine">
                  <Plus className="w-4 h-4" />
                  Add Machine
                </Link>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Add Machine
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

        {/* New Fee Structure Banner */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-2">New Fee Structure</h3>
              <p className="text-blue-700 mb-4">
                We've simplified our pricing! Now you only pay $1.25 per day per machine rental. No monthly subscription required.
                List as many machines as you want for free and only pay when they're rented.
              </p>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Example Calculation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Your daily rate:</p>
                    <p className="text-gray-600">$25.00</p>
                  </div>
                  <div>
                    <p className="font-medium">Platform fee:</p>
                    <p className="text-gray-600">$1.25</p>
                  </div>
                  <div>
                    <p className="font-medium">Your daily profit:</p>
                    <p className="text-green-600 font-bold">$23.75</p>
                  </div>
                  <div>
                    <p className="font-medium">Monthly profit (30 days):</p>
                    <p className="text-green-600 font-bold">$712.50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        {!isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Complete Your Setup</h2>
            
            <div className="space-y-4">
              {/* Step 1: Profile Information */}
              <div className={`flex items-center gap-4 p-4 rounded-lg ${
                ownerProfile.business_name ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ownerProfile.business_name 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {ownerProfile.business_name ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Business Information</h3>
                  <p className="text-sm text-gray-600">
                    {ownerProfile.business_name 
                      ? 'Profile information completed' 
                      : 'Complete your business profile'}
                  </p>
                </div>
                {!ownerProfile.business_name && (
                  <Button size="sm" asChild>
                    <Link to="/owner-signup">Complete</Link>
                  </Button>
                )}
              </div>

              {/* Step 2: Agreement */}
              <div className={`flex items-center gap-4 p-4 rounded-lg ${
                ownerProfile.agreement_accepted ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ownerProfile.agreement_accepted 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {ownerProfile.agreement_accepted ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Rental Agreement</h3>
                  <p className="text-sm text-gray-600">
                    {ownerProfile.agreement_accepted 
                      ? 'Agreement accepted' 
                      : 'Review and accept the machine owner agreement'}
                  </p>
                </div>
                {!ownerProfile.agreement_accepted && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowAgreementDialog(true)}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Review
                  </Button>
                )}
              </div>

              {/* Step 3: Stripe Connect */}
              <div className={`flex items-center gap-4 p-4 rounded-lg ${
                ownerProfile.payout_enabled ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ownerProfile.payout_enabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {ownerProfile.payout_enabled ? <CheckCircle className="w-4 h-4" /> : '3'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Payment Setup</h3>
                  <p className="text-sm text-gray-600">
                    {ownerProfile.payout_enabled 
                      ? 'Stripe account connected' 
                      : 'Connect your bank account for payouts'}
                  </p>
                </div>
                {!ownerProfile.payout_enabled && (
                  <Button 
                    size="sm" 
                    onClick={handleConnectStripe}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.total)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(earnings.pending)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Active Machines</p>
                <p className="text-2xl font-bold text-blue-600">{machines.filter(m => m.is_available).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Total Rentals</p>
                <p className="text-2xl font-bold text-purple-600">{rentals.length}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="machines">
          <TabsList className="mb-6">
            <TabsTrigger value="machines">My Machines</TabsTrigger>
            <TabsTrigger value="rentals">Rental History</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="machines">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">My Machines</h2>
                  <Button 
                    className={`flex items-center gap-2 ${!canAddMachines ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canAddMachines}
                    asChild={canAddMachines}
                    onClick={!canAddMachines ? () => setError('Complete verification to add machines') : undefined}
                  >
                    {canAddMachines ? (
                      <Link to="/list-machine">
                        <Plus className="w-4 h-4" />
                        Add Machine
                      </Link>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Add Machine
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {!canAddMachines ? (
                <div className="p-8 text-center">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Complete Verification Required</h3>
                  <p className="text-gray-500 mb-4">
                    You must complete your owner profile, accept the agreement, and connect your payment method before listing machines.
                  </p>
                  <Button asChild>
                    <Link to="/owner-signup">Complete Setup</Link>
                  </Button>
                </div>
              ) : machines.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No machines listed yet</p>
                  <Button asChild>
                    <Link to="/list-machine">Add Your First Machine</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hashrate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rentals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {machines.map((machine) => (
                        <tr key={machine.id}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{machine.name}</p>
                              <p className="text-sm text-gray-500">{machine.model}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{machine.hashrate} TH/s</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{formatCurrency(machine.daily_rate)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              machine.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {machine.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{machine.total_rentals}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewMachine(machine.id)}
                                title="View in marketplace"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditMachine(machine.id)}
                                title="Edit machine"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleToggleAvailability(machine.id, machine.is_available)}
                                title={machine.is_available ? 'Make unavailable' : 'Make available'}
                              >
                                {machine.is_available ? (
                                  <ToggleRight className="w-3 h-3 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-3 h-3 text-gray-400" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteMachine(machine.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete machine"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rentals">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Rental History</h2>
              </div>
              
              {rentals.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No rentals yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renter</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Payout</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rentals.map((rental) => (
                        <tr key={rental.id}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{rental.machine?.name}</p>
                              <p className="text-sm text-gray-500">{rental.machine?.model}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm">{rental.renter?.email}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p>{new Date(rental.start_date).toLocaleDateString()}</p>
                              <p className="text-gray-500">to {new Date(rental.end_date).toLocaleDateString()}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{formatCurrency(rental.total_amount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-green-600">{formatCurrency(rental.daily_rate * rental.total_days - (1.25 * rental.total_days))}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rental.status)}`}>
                              {rental.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Payout Settings</h2>
              </div>
              
              <div className="p-6">
                {!ownerProfile.payout_enabled ? (
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800 mb-2">Payouts Not Enabled</h3>
                        <p className="text-yellow-700 mb-4">
                          Connect your Stripe account to receive automatic payouts for your rentals.
                        </p>
                        <Button 
                          className="bg-yellow-600 hover:bg-yellow-700"
                          onClick={handleConnectStripe}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Connect Stripe Account
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Payouts Enabled</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your Stripe account is connected and payouts are enabled.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Payout Schedule</Label>
                        <select 
                          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md mt-1"
                          value={ownerProfile.payout_schedule}
                          onChange={(e) => setOwnerProfile(prev => ({ ...prev, payout_schedule: e.target.value }))}
                          disabled={!editingSettings}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label>Minimum Payout</Label>
                        <Input
                          type="number"
                          value={ownerProfile.minimum_payout}
                          onChange={(e) => setOwnerProfile(prev => ({ ...prev, minimum_payout: parseFloat(e.target.value) }))}
                          className="mt-1"
                          disabled={!editingSettings}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {editingSettings ? (
                        <>
                          <Button onClick={handleSaveSettings}>Save Changes</Button>
                          <Button variant="outline" onClick={() => setEditingSettings(false)}>Cancel</Button>
                        </>
                      ) : (
                        <Button onClick={() => setEditingSettings(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Settings
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Owner Settings</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={ownerProfile.business_name || ''}
                      onChange={(e) => setOwnerProfile(prev => ({ ...prev, business_name: e.target.value }))}
                      placeholder="Your business name"
                      className="mt-1"
                      disabled={!editingSettings}
                    />
                  </div>
                  
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={ownerProfile.contact_email || ''}
                      onChange={(e) => setOwnerProfile(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="contact@example.com"
                      className="mt-1"
                      disabled={!editingSettings}
                    />
                  </div>
                  
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      value={ownerProfile.contact_phone || ''}
                      onChange={(e) => setOwnerProfile(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                      disabled={!editingSettings}
                    />
                  </div>
                  
                  <div>
                    <Label>Tax ID</Label>
                    <Input
                      value={ownerProfile.tax_id || ''}
                      onChange={(e) => setOwnerProfile(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="Tax identification number"
                      className="mt-1"
                      disabled={!editingSettings}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingSettings ? (
                    <>
                      <Button onClick={handleSaveSettings}>Save Settings</Button>
                      <Button variant="outline" onClick={() => setEditingSettings(false)}>Cancel</Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingSettings(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Settings
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Demo Profile Dialog */}
      <Dialog open={showDemoProfile} onOpenChange={setShowDemoProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Create Demo Profile
            </DialogTitle>
            <DialogDescription>
              This will create a pre-verified owner profile for testing purposes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Demo Profile Includes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Complete business information</li>
                <li>• Accepted rental agreement</li>
                <li>• Connected Stripe account (simulated)</li>
                <li>• Verified status for immediate machine listing</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Note:</h4>
              <p className="text-sm text-yellow-700">
                This demo profile should be removed before production deployment.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDemoProfile(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDemoProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Demo Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rental Agreement Dialog */}
      <Dialog open={showAgreementDialog} onOpenChange={setShowAgreementDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Machine Owner Rental Agreement
            </DialogTitle>
            <DialogDescription>
              Please review and accept the terms and conditions for listing mining equipment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Mybuji Machine Owner Agreement</h3>
              <p className="text-sm text-blue-700">
                This agreement governs the rental of mining equipment through the Mybuji platform.
              </p>
            </div>

            <div className="prose prose-sm max-w-none">
              <h4 className="font-semibold">1. Equipment Listing and Verification</h4>
              <p>
                By listing equipment on Mybuji, you represent that you own or have legal authority to rent the equipment. 
                All equipment specifications must be accurate and up-to-date.
              </p>

              <h4 className="font-semibold">2. Rental Terms and Pricing</h4>
              <p>
                You may set your own daily rental rates and availability. Mybuji charges a flat fee of $1.25 per day per rental. 
                You are responsible for maintaining equipment uptime and performance as advertised.
              </p>

              <h4 className="font-semibold">3. Payment Processing</h4>
              <p>
                Payments are processed through Stripe Connect. Payouts are made according to your selected schedule 
                (daily, weekly, or monthly) minus platform fees and payment processing costs.
              </p>

              <h4 className="font-semibold">4. Equipment Maintenance and Support</h4>
              <p>
                You are responsible for maintaining equipment in working condition, providing technical support to renters, 
                and ensuring 24/7 uptime during rental periods.
              </p>

              <h4 className="font-semibold">5. Liability and Insurance</h4>
              <p>
                You maintain full responsibility for equipment damage, theft, or loss. Mybuji recommends maintaining 
                appropriate insurance coverage for your equipment.
              </p>

              <h4 className="font-semibold">6. Dispute Resolution</h4>
              <p>
                Disputes between owners and renters will be mediated by Mybuji. In cases of equipment failure or 
                performance issues, refunds may be issued at Mybuji's discretion.
              </p>

              <h4 className="font-semibold">7. Termination</h4>
              <p>
                Either party may terminate this agreement with 30 days notice. Active rentals must be completed 
                before termination takes effect.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• This is a simplified agreement for demonstration purposes</li>
                <li>• The actual agreement would be more comprehensive and legally reviewed</li>
                <li>• Terms would vary by jurisdiction and regulatory requirements</li>
                <li>• Professional legal counsel should review all terms before deployment</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAgreementDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAcceptAgreement}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Agreement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OwnerDashboardPage