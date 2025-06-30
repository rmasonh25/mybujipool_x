import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  ArrowLeft, 
  Cpu, 
  DollarSign, 
  Calendar, 
  MapPin,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle,
  Lock,
  Shield
} from 'lucide-react'

const ListMachinePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [checkingOwner, setCheckingOwner] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [ownerProfile, setOwnerProfile] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    hashrate: '',
    powerConsumption: '',
    dailyRate: '',
    location: '',
    description: '',
    imageUrl: '',
    specifications: {
      algorithm: 'SHA-256',
      efficiency: '',
      noise_level: '',
      dimensions: '',
      weight: ''
    },
    minRentalDays: 1,
    maxRentalDays: 30,
    isDemo: false
  })

  useEffect(() => {
    checkOwnerStatus()
  }, [user])

  const checkOwnerStatus = async () => {
    try {
      setCheckingOwner(true)
      
      const { data: profile, error } = await supabase
        .from('machine_owners')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      setOwnerProfile(profile)
    } catch (error) {
      console.error('Error checking owner status:', error)
    } finally {
      setCheckingOwner(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('specifications.')) {
      const specField = field.replace('specifications.', '')
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const calculateEfficiency = () => {
    if (formData.powerConsumption && formData.hashrate) {
      const efficiency = (parseFloat(formData.powerConsumption) / parseFloat(formData.hashrate)).toFixed(1)
      return `${efficiency} J/GH`
    }
    return ''
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.name.trim()) errors.push('Machine name is required')
    if (!formData.model.trim()) errors.push('Model is required')
    if (!formData.manufacturer.trim()) errors.push('Manufacturer is required')
    if (!formData.hashrate || parseFloat(formData.hashrate) <= 0) errors.push('Valid hashrate is required')
    if (!formData.powerConsumption || parseFloat(formData.powerConsumption) <= 0) errors.push('Valid power consumption is required')
    if (!formData.dailyRate || parseFloat(formData.dailyRate) <= 0) errors.push('Valid daily rate is required')
    if (!formData.location.trim()) errors.push('Location is required')
    if (!formData.description.trim()) errors.push('Description is required')
    
    if (formData.minRentalDays < 1) errors.push('Minimum rental days must be at least 1')
    if (formData.maxRentalDays > 365) errors.push('Maximum rental days cannot exceed 365')
    if (formData.minRentalDays > formData.maxRentalDays) errors.push('Minimum rental days cannot exceed maximum')
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Check owner verification status
    if (!ownerProfile || !ownerProfile.payout_enabled || !ownerProfile.agreement_accepted) {
      setError('You must complete owner verification before listing machines')
      return
    }
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setLoading(true)
    
    try {
      // Calculate efficiency
      const efficiency = parseFloat(formData.powerConsumption) / (parseFloat(formData.hashrate) * 1000)
      
      // Create machine listing
      const machineData = {
        owner_id: user.id,
        name: formData.name,
        model: formData.model,
        manufacturer: formData.manufacturer,
        hashrate: parseFloat(formData.hashrate),
        power_consumption: parseFloat(formData.powerConsumption),
        efficiency: efficiency,
        daily_rate: parseFloat(formData.dailyRate),
        location: formData.location,
        description: formData.description,
        image_url: formData.imageUrl || null,
        specifications: {
          ...formData.specifications,
          efficiency: calculateEfficiency()
        },
        min_rental_days: parseInt(formData.minRentalDays),
        max_rental_days: parseInt(formData.maxRentalDays),
        is_available: true,
        is_verified: true, // Auto-verify for demo
        total_rentals: 0,
        average_rating: 0,
        is_demo: formData.isDemo
      }

      const { data: machine, error: machineError } = await supabase
        .from('rental_machines')
        .insert(machineData)
        .select()
        .single()

      if (machineError) throw machineError

      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        navigate('/owner-dashboard')
      }, 2000)
      
    } catch (error) {
      console.error('Error listing machine:', error)
      setError(error.message || 'Failed to list machine')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const dailyRate = parseFloat(formData.dailyRate) || 0
  const platformFee = 1.25 // $1.25 per day
  const netIncome = dailyRate - platformFee

  const isVerified = ownerProfile?.payout_enabled && ownerProfile?.agreement_accepted
  const canListMachines = isVerified

  if (checkingOwner) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show verification required if not verified
  if (!canListMachines) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate('/owner-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">List Your Mining Machine</h1>
          </div>

          {/* Verification Required */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Verification Required</h2>
            <p className="text-xl text-gray-600 mb-8">
              You must complete owner verification before listing mining equipment.
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
              <h3 className="font-semibold text-blue-800 mb-4">Required Steps:</h3>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${
                  ownerProfile?.business_name ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {ownerProfile?.business_name ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                  )}
                  <span>Complete business information</span>
                </div>
                
                <div className={`flex items-center gap-3 ${
                  ownerProfile?.agreement_accepted ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {ownerProfile?.agreement_accepted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                  )}
                  <span>Accept rental agreement</span>
                </div>
                
                <div className={`flex items-center gap-3 ${
                  ownerProfile?.payout_enabled ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {ownerProfile?.payout_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                  )}
                  <span>Connect Stripe account for payouts</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!ownerProfile ? (
                <Button size="lg" onClick={() => navigate('/owner-signup')}>
                  Start Owner Registration
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate('/owner-dashboard')}>
                  Complete Verification
                </Button>
              )}
              
              <Button size="lg" variant="outline" onClick={() => navigate('/owner-dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Machine Listed Successfully!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your mining machine is now available for rent on the marketplace.
          </p>
          
          <div className="bg-green-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Your machine will appear in the rental marketplace</li>
              <li>• Miners can now send rental requests</li>
              <li>• You'll receive notifications for new bookings</li>
              <li>• Payments will be processed automatically</li>
            </ul>
          </div>
          
          <p className="text-gray-500 mb-6">Redirecting to your dashboard...</p>
          
          <Button onClick={() => navigate('/owner-dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/owner-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">List Your Mining Machine</h1>
          
          {/* Verification Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Verified Owner</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">New Listing Fee Information</h3>
              <div className="text-blue-700 space-y-2">
                <p>• <strong>Free listings:</strong> List as many machines as you want at no cost</p>
                <p>• <strong>Simple fee structure:</strong> Only $1.25 per day per rental</p>
                <p>• <strong>No upfront costs:</strong> Fees only charged when your machine is rented</p>
                <p>• <strong>Instant payouts:</strong> Receive payments within 2 business days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Machine Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., My Antminer S19 Pro"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="e.g., S19 Pro"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="manufacturer">Manufacturer *</Label>
                      <select
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                        required
                      >
                        <option value="">Select manufacturer</option>
                        <option value="Bitmain">Bitmain</option>
                        <option value="MicroBT">MicroBT (WhatsMiner)</option>
                        <option value="Canaan">Canaan (AvalonMiner)</option>
                        <option value="Innosilicon">Innosilicon</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Texas, USA"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Technical Specifications
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hashrate">Hashrate (TH/s) *</Label>
                      <Input
                        id="hashrate"
                        type="number"
                        step="0.1"
                        value={formData.hashrate}
                        onChange={(e) => handleInputChange('hashrate', e.target.value)}
                        placeholder="e.g., 110"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="powerConsumption">Power Consumption (W) *</Label>
                      <Input
                        id="powerConsumption"
                        type="number"
                        value={formData.powerConsumption}
                        onChange={(e) => handleInputChange('powerConsumption', e.target.value)}
                        placeholder="e.g., 3250"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="algorithm">Algorithm</Label>
                      <select
                        id="algorithm"
                        value={formData.specifications.algorithm}
                        onChange={(e) => handleInputChange('specifications.algorithm', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="SHA-256">SHA-256 (Bitcoin)</option>
                        <option value="Scrypt">Scrypt (Litecoin)</option>
                        <option value="X11">X11 (Dash)</option>
                        <option value="Ethash">Ethash (Ethereum)</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="efficiency">Efficiency</Label>
                      <Input
                        id="efficiency"
                        value={calculateEfficiency()}
                        disabled
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Availability */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Pricing & Availability
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dailyRate">Daily Rate (USD) *</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        step="0.01"
                        value={formData.dailyRate}
                        onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                        placeholder="e.g., 25.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="minRentalDays">Min Rental (days)</Label>
                      <Input
                        id="minRentalDays"
                        type="number"
                        min="1"
                        value={formData.minRentalDays}
                        onChange={(e) => handleInputChange('minRentalDays', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxRentalDays">Max Rental (days)</Label>
                      <Input
                        id="maxRentalDays"
                        type="number"
                        max="365"
                        value={formData.maxRentalDays}
                        onChange={(e) => handleInputChange('maxRentalDays', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Description & Image */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Description & Media
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your machine, its condition, hosting location, and any special features..."
                        className="w-full h-24 px-3 py-2 border border-input bg-background rounded-md resize-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                        placeholder="https://example.com/machine-photo.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add a photo of your machine to attract more renters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Option */}
                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <input
                      id="isDemo"
                      type="checkbox"
                      checked={formData.isDemo}
                      onChange={(e) => handleInputChange('isDemo', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isDemo" className="ml-2 block text-sm font-medium text-gray-700">
                      Mark as demonstration equipment
                    </label>
                  </div>
                  
                  {formData.isDemo && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-700">
                            This equipment will be marked as a demonstration unit. It will be displayed with a "DEMO ONLY" watermark 
                            and users will be informed that it's for testing purposes only. No actual rentals will be processed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Listing Machine...
                      </>
                    ) : (
                      'List Machine for Rent'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Earnings Calculator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Earnings Calculator</h3>
              
              {dailyRate > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Daily Revenue Projection</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Your daily rate:</span>
                        <span className="font-medium">{formatCurrency(dailyRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fee:</span>
                        <span className="font-medium">-{formatCurrency(platformFee)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Your daily profit:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(netIncome)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Monthly Projection</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly revenue (30 days):</span>
                        <span className="font-medium">{formatCurrency(dailyRate * 30)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fees (30 days):</span>
                        <span className="font-medium">-{formatCurrency(platformFee * 30)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Monthly profit:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(netIncome * 30)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Annual Potential</h4>
                    <p className="text-sm text-blue-700">
                      If rented consistently: <strong>{formatCurrency(netIncome * 365)}</strong> per year
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter a daily rate to see earnings projection
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Key Benefits</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Free listings - no upfront costs</li>
                  <li>• Only $1.25 per day when rented</li>
                  <li>• Automatic payment processing</li>
                  <li>• Real-time rental management</li>
                  <li>• 24/7 customer support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListMachinePage