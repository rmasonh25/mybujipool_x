import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../components/ui/dialog'
import { 
  ArrowLeft, 
  Calendar, 
  Cpu, 
  DollarSign, 
  MapPin, 
  Shield, 
  Star, 
  Zap,
  AlertTriangle,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

const RentMachinePage = () => {
  const { machineId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [machine, setMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showDemoDialog, setShowDemoDialog] = useState(false)
  const [rentalCreated, setRentalCreated] = useState(false)
  
  // Rental form state
  const [rentalData, setRentalData] = useState({
    startDate: '',
    endDate: '',
    walletAddress: '',
    poolUrl: 'stratum+tcp://pool.mybuji.com:3333',
    workerName: '',
    notes: ''
  })

  useEffect(() => {
    if (machineId) {
      fetchMachine()
    }
  }, [machineId])

  useEffect(() => {
    // Set default start date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setRentalData(prev => ({
      ...prev,
      startDate: tomorrow.toISOString().split('T')[0]
    }))
  }, [])

  const fetchMachine = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('rental_machines')
        .select(`
          *,
          owner:owner_id(email),
          machine_owner:owner_id(
            machine_owners(business_name, payout_enabled, contact_email)
          )
        `)
        .eq('id', machineId)
        .eq('is_available', true)
        .single()
      
      if (error) throw error
      
      if (!data) {
        setError('Machine not found or not available')
        return
      }
      
      setMachine(data)
    } catch (error) {
      console.error('Error fetching machine:', error)
      setError('Failed to load machine details')
    } finally {
      setLoading(false)
    }
  }

  const calculateRentalDetails = () => {
    if (!rentalData.startDate || !rentalData.endDate || !machine) {
      return { days: 0, subtotal: 0, platformFee: 0, total: 0 }
    }
    
    const start = new Date(rentalData.startDate)
    const end = new Date(rentalData.endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    if (days < machine.min_rental_days || days > machine.max_rental_days) {
      return { days, subtotal: 0, platformFee: 0, total: 0, error: true }
    }
    
    const subtotal = days * machine.daily_rate
    const platformFee = days * 1.25 // $1.25 per day platform fee
    const total = subtotal + platformFee
    
    return { days, subtotal, platformFee, total }
  }

  const handleInputChange = (field, value) => {
    setRentalData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!rentalData.startDate) errors.push('Start date is required')
    if (!rentalData.endDate) errors.push('End date is required')
    if (!rentalData.walletAddress) errors.push('Wallet address is required')
    if (!rentalData.workerName) errors.push('Worker name is required')
    
    const { days, error: dateError } = calculateRentalDetails()
    if (dateError) {
      errors.push(`Rental period must be between ${machine.min_rental_days} and ${machine.max_rental_days} days`)
    }
    
    if (new Date(rentalData.startDate) <= new Date()) {
      errors.push('Start date must be in the future')
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setSubmitting(true)
    
    try {
      // If this is a demo machine, show the demo dialog instead of creating a real rental
      if (machine.is_demo) {
        setShowDemoDialog(true)
        return
      }
      
      const { days, total } = calculateRentalDetails()
      
      // Create rental record
      const rentalRecord = {
        machine_id: machine.id,
        renter_id: user.id,
        owner_id: machine.owner_id,
        start_date: rentalData.startDate,
        end_date: rentalData.endDate,
        daily_rate: machine.daily_rate,
        wallet_address: rentalData.walletAddress,
        mining_pool_config: {
          stratum_url: rentalData.poolUrl,
          worker_name: rentalData.workerName,
          password: 'x'
        },
        notes: rentalData.notes,
        status: 'pending'
      }

      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .insert(rentalRecord)
        .select()
        .single()

      if (rentalError) throw rentalError

      // TODO: Create Stripe payment intent for the rental
      // const paymentIntent = await createStripePaymentIntent({
      //   amount: Math.round(total * 100), // Convert to cents
      //   currency: 'usd',
      //   metadata: {
      //     rental_id: rental.id,
      //     machine_id: machine.id,
      //     renter_id: user.id
      //   }
      // })

      // For demo purposes, show demo dialog
      setShowDemoDialog(true)
      
    } catch (error) {
      console.error('Error creating rental:', error)
      setError(error.message || 'Failed to create rental')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemoComplete = async () => {
    setShowDemoDialog(false)
    setRentalCreated(true)
    
    // In real implementation, this would be handled by Stripe webhook
    // For demo, simulate success
    setTimeout(() => {
      navigate('/dashboard?tab=rentals')
    }, 3000)
  }

  const formatHashrate = (hashrate) => `${hashrate} TH/s`
  const formatEfficiency = (efficiency) => `${efficiency.toFixed(1)} J/GH`

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !machine) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/rental-marketplace')} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  if (rentalCreated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Rental Request Submitted!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your rental request has been submitted and payment is being processed. You'll receive confirmation shortly.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Payment confirmation will be sent to your email</li>
              <li>• Machine owner will be notified and prepare your rental</li>
              <li>• You'll receive mining pool connection details</li>
              <li>• Rental will start on your selected date</li>
            </ul>
          </div>
          
          <p className="text-gray-500 mb-6">Redirecting to your dashboard...</p>
          
          <Button onClick={() => navigate('/dashboard?tab=rentals')}>
            View My Rentals
          </Button>
        </div>
      </div>
    )
  }

  const rentalDetails = calculateRentalDetails()

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate('/rental-marketplace')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
            <h1 className="text-3xl font-bold">Rent Mining Equipment</h1>
            
            {/* Demo Badge */}
            {machine?.is_demo && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Demo Equipment
              </span>
            )}
          </div>

          {/* Demo Warning Banner */}
          {machine?.is_demo && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 mb-1">Demonstration Equipment</h3>
                  <p className="text-sm text-yellow-700">
                    This is a demonstration machine for testing purposes only. No actual mining will occur if you rent this equipment.
                    Any rental requests will be simulated and no payment will be processed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Fee Structure Banner */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">New Simple Pricing</h3>
                <p className="text-sm text-blue-700">
                  We've simplified our pricing! Now you only pay $1.25 per day per machine rental fee plus the machine's daily rate. 
                  No monthly subscription required. Access to our solo mining pool with rotating block system is completely free.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Machine Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="h-64 bg-gray-200 relative">
                  {machine.image_url ? (
                    <img 
                      src={machine.image_url} 
                      alt={machine.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Cpu className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Available
                    </span>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      Verified
                    </span>
                  </div>
                  
                  {/* Demo watermark */}
                  {machine.is_demo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-yellow-500 text-black px-6 py-3 font-bold text-xl transform rotate-45 shadow-lg opacity-90">
                        DEMO ONLY
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{machine.name}</h2>
                      <p className="text-gray-600">{machine.model} by {machine.manufacturer}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{machine.average_rating}</span>
                      <span className="text-gray-500">({machine.total_rentals} rentals)</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6">{machine.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="text-sm text-gray-600">Hashrate</p>
                      <p className="font-bold">{formatHashrate(machine.hashrate)}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                      <p className="text-sm text-gray-600">Power</p>
                      <p className="font-bold">{machine.power_consumption}W</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Shield className="w-6 h-6 text-green-600 mb-2" />
                      <p className="text-sm text-gray-600">Efficiency</p>
                      <p className="font-bold">{formatEfficiency(machine.efficiency)}</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="text-sm text-gray-600">Daily Rate</p>
                      <p className="font-bold text-green-600">{formatCurrency(machine.daily_rate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{machine.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">
                        {machine.machine_owner?.machine_owners?.[0]?.business_name || 'Verified Owner'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Rental Terms</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Minimum rental: {machine.min_rental_days} day{machine.min_rental_days > 1 ? 's' : ''}</li>
                      <li>• Maximum rental: {machine.max_rental_days} days</li>
                      <li>• 24/7 monitoring and support included</li>
                      <li>• Direct mining pool connection</li>
                      <li>• Performance guarantees apply</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
                <h3 className="text-xl font-semibold mb-6">Book Your Rental</h3>
                
                {machine.is_demo && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Demo Equipment</h4>
                        <p className="text-sm text-yellow-700">
                          This is a demonstration machine. The rental process will be simulated and no payment will be processed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={rentalData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={rentalData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      min={rentalData.startDate}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="walletAddress">Bitcoin Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      value={rentalData.walletAddress}
                      onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                      placeholder="bc1q..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mining rewards will be sent directly to this address when it's active in rotation
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="poolUrl">Mining Pool URL</Label>
                    <Input
                      id="poolUrl"
                      value={rentalData.poolUrl}
                      onChange={(e) => handleInputChange('poolUrl', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="workerName">Worker Name</Label>
                    <Input
                      id="workerName"
                      value={rentalData.workerName}
                      onChange={(e) => handleInputChange('workerName', e.target.value)}
                      placeholder="worker1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      value={rentalData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any special requirements or notes..."
                      className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md resize-none"
                    />
                  </div>
                  
                  {/* Rental Summary */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Rental Summary</h4>
                    
                    {rentalDetails.days > 0 && !rentalDetails.error ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{rentalDetails.days} day{rentalDetails.days > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Rate:</span>
                          <span>{formatCurrency(machine.daily_rate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(rentalDetails.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee ($1.25/day):</span>
                          <span>{formatCurrency(rentalDetails.platformFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(rentalDetails.total)}</span>
                        </div>
                      </div>
                    ) : rentalDetails.error ? (
                      <div className="text-red-600 text-sm">
                        Invalid rental period. Must be {machine.min_rental_days}-{machine.max_rental_days} days.
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Select dates to see pricing
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={submitting || rentalDetails.error || rentalDetails.total === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {machine.is_demo ? 'Simulate Rental' : `Rent for ${formatCurrency(rentalDetails.total)}`}
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Secure Payment</h5>
                      <p className="text-xs text-blue-700">
                        Payments are processed securely through Stripe. Your rental is protected by our guarantee.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Payment Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Demo Rental Payment
            </DialogTitle>
            <DialogDescription>
              This is a demonstration of the rental payment process
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Demo Mode Active</h4>
              <p className="text-sm text-yellow-700 mb-4">
                This is a simulated rental payment for demonstration purposes. No real payment will be processed 
                and no actual mining equipment will be reserved.
              </p>
              <p className="text-sm text-yellow-700">
                In the real implementation, you would be redirected to Stripe's secure payment page 
                to complete your rental payment.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">New Fee Structure</h4>
              <p className="text-sm text-blue-700 mb-4">
                Our new pricing model charges just $1.25 per day per machine rental, plus the machine's daily rate.
                No monthly subscription required!
              </p>
              <div className="text-sm text-blue-700">
                <div className="flex justify-between mb-1">
                  <span>Machine daily rate:</span>
                  <span>{formatCurrency(machine.daily_rate)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Platform fee:</span>
                  <span>$1.25/day</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1 mt-1">
                  <span>Total daily cost:</span>
                  <span>{formatCurrency(machine.daily_rate + 1.25)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDemoDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDemoComplete}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Simulate Success
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RentMachinePage