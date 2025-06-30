import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
  AlertTriangle, 
  Info, 
  ArrowLeft,
  Lock,
  Shield,
  CheckCircle,
  Loader2
} from 'lucide-react'

const ListAsicPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    model: '',
    hashrate: '',
    power: '',
    reserve_price: '',
    image_url: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [checkingOwner, setCheckingOwner] = useState(true)
  const [showOwnerDialog, setShowOwnerDialog] = useState(false)

  useEffect(() => {
    checkOwnerStatus()
  }, [user])

  const checkOwnerStatus = async () => {
    try {
      setCheckingOwner(true)
      
      const { data: profiles, error } = await supabase
        .from('machine_owners')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      const profile = profiles && profiles.length > 0 ? profiles[0] : null
      setOwnerProfile(profile)
      
      // Check if user is verified
      if (!profile || !profile.payout_enabled || !profile.agreement_accepted) {
        setShowOwnerDialog(true)
      }
    } catch (error) {
      console.error('Error checking owner status:', error)
    } finally {
      setCheckingOwner(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const calculateListingFee = (dailyPrice) => {
    const monthlyRevenue = dailyPrice * 30
    const standardFee = monthlyRevenue * 0.035
    const launchFee = monthlyRevenue * 0.0175
    return { standardFee, launchFee }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    
    // Check owner verification status
    if (!ownerProfile || !ownerProfile.payout_enabled || !ownerProfile.agreement_accepted) {
      setError('You must complete owner verification before listing ASICs')
      setIsSubmitting(false)
      setShowOwnerDialog(true)
      return
    }
    
    try {
      let imageUrl = formData.image_url
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `asic-images/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('asics')
          .upload(filePath, imageFile)
          
        if (uploadError) throw uploadError
        
        const { data } = supabase.storage.from('asics').getPublicUrl(filePath)
        imageUrl = data.publicUrl
      }
      
      // Create ASIC listing
      const { data, error } = await supabase
        .from('asics')
        .insert([
          {
            owner_id: user.id,
            model: formData.model,
            hashrate: parseFloat(formData.hashrate),
            power: parseFloat(formData.power),
            reserve_price: parseFloat(formData.reserve_price),
            image_url: imageUrl,
            listed: true,
          }
        ])
        .select()
      
      if (error) throw error
      
      // Create auction for the ASIC
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 3) // 3-day auction
      
      const { error: auctionError } = await supabase
        .from('auctions')
        .insert([
          {
            asic_id: data[0].id,
            reserve_price: parseFloat(formData.reserve_price),
            end_time: endTime.toISOString(),
          }
        ])
      
      if (auctionError) throw auctionError
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Error listing ASIC:', error)
      setError(error.message || 'Failed to list ASIC')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartOwnerSetup = () => {
    setShowOwnerDialog(false)
    navigate('/owner-signup')
  }

  const handleGoToOwnerDashboard = () => {
    setShowOwnerDialog(false)
    navigate('/owner-dashboard')
  }

  const isVerified = ownerProfile?.payout_enabled && ownerProfile?.agreement_accepted

  if (checkingOwner) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show verification required if not verified
  if (!isVerified) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold">List Your ASIC</h1>
            </div>

            {/* Verification Required */}
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Owner Verification Required</h2>
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
                  <Button size="lg" onClick={handleStartOwnerSetup}>
                    Start Owner Registration
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleGoToOwnerDashboard}>
                    Complete Verification
                  </Button>
                )}
                
                <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Setup Dialog */}
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
                  <li>• Only 3.5% platform fee on rentals</li>
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

  const dailyPrice = parseFloat(formData.reserve_price) || 0
  const fees = calculateListingFee(dailyPrice)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">List Your ASIC</h1>
        
        {/* Verification Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Verified Owner</span>
        </div>
      </div>
      
      {/* Pricing Information Banner */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Listing Fee Information</h3>
            <div className="text-blue-700 space-y-2">
              <p>• <strong>Standard listing fee:</strong> 3.5% of rental income</p>
              <p>• <strong>Launch special:</strong> 1.75% for the first year (50% off!)</p>
              <p>• <strong>Payment processing:</strong> Direct payments via Stripe</p>
              <p>• <strong>No upfront costs:</strong> Fees only charged on successful rentals</p>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="model">ASIC Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., Antminer S19 Pro"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hashrate">Hashrate (TH/s)</Label>
                  <Input
                    id="hashrate"
                    name="hashrate"
                    type="number"
                    step="0.01"
                    value={formData.hashrate}
                    onChange={handleChange}
                    placeholder="e.g., 110"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="power">Power Consumption (W)</Label>
                  <Input
                    id="power"
                    name="power"
                    type="number"
                    step="1"
                    value={formData.power}
                    onChange={handleChange}
                    placeholder="e.g., 3250"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reserve_price">Daily Rental Price (USD)</Label>
                  <Input
                    id="reserve_price"
                    name="reserve_price"
                    type="number"
                    step="0.01"
                    value={formData.reserve_price}
                    onChange={handleChange}
                    placeholder="e.g., 25.00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">ASIC Image</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      Or provide an image URL:
                    </p>
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="border rounded-md overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    ) : formData.image_url ? (
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'
                        }}
                      />
                    ) : (
                      <span className="text-gray-400">Image preview</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listing...
                    </>
                  ) : (
                    'List ASIC for Rental'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Pricing Calculator Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Earnings Calculator</h3>
            
            {dailyPrice > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Monthly Revenue Projection</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Daily rate:</span>
                      <span className="font-medium">${dailyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly (30 days):</span>
                      <span className="font-medium">${(dailyPrice * 30).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Launch Special (1st Year)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Listing fee (1.75%):</span>
                      <span className="font-medium">-${fees.launchFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Your net income:</span>
                      <span className="font-bold text-green-600">
                        ${((dailyPrice * 30) - fees.launchFee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Standard Rate (After Year 1)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Listing fee (3.5%):</span>
                      <span className="font-medium">-${fees.standardFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Your net income:</span>
                      <span className="font-bold text-blue-600">
                        ${((dailyPrice * 30) - fees.standardFee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Annual Savings</h4>
                  <p className="text-sm text-yellow-700">
                    Launch special saves you <strong>${((fees.standardFee - fees.launchFee) * 12).toFixed(2)}</strong> in the first year!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Enter a daily rental price to see earnings projection
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-2">Key Benefits</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• No upfront listing costs</li>
                <li>• Direct Stripe payment processing</li>
                <li>• Automatic rental management</li>
                <li>• Real-time performance tracking</li>
                <li>• 24/7 customer support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListAsicPage