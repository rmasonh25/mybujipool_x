import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createConnectAccount, getConnectOnboardingLink } from '../lib/stripe'
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
  Building, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  ExternalLink
} from 'lucide-react'

const OwnerSignupPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Info, 2: Stripe Connect, 3: Success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showStripeDialog, setShowStripeDialog] = useState(false)
  const [existingProfile, setExistingProfile] = useState(null)
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    taxId: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    },
    payoutSchedule: 'weekly',
    minimumPayout: 50.00
  })

  // Check for existing owner profile on component mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return

      try {
        const { data: profile, error } = await supabase
          .from('machine_owners')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile && !error) {
          setExistingProfile(profile)
          // Pre-fill form with existing data
          setFormData({
            businessName: profile.business_name || '',
            contactEmail: profile.contact_email || user.email || '',
            contactPhone: profile.contact_phone || '',
            taxId: profile.tax_id || '',
            address: profile.address || {
              line1: '',
              city: '',
              state: '',
              postal_code: '',
              country: 'US'
            },
            payoutSchedule: profile.payout_schedule || 'weekly',
            minimumPayout: profile.minimum_payout || 50.00
          })

          // If profile exists and is complete, skip to appropriate step
          if (profile.stripe_account_id && profile.payout_enabled) {
            setStep(3) // Already complete
          } else if (profile.business_name) {
            setStep(2) // Has profile but needs Stripe setup
          }
        }
      } catch (error) {
        // Profile doesn't exist, which is fine for new users
        console.log('No existing profile found, starting fresh')
      }
    }

    checkExistingProfile()
  }, [user])

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateStep1 = () => {
    const errors = []
    
    if (!formData.businessName.trim()) errors.push('Business name is required')
    if (!formData.contactEmail.trim()) errors.push('Contact email is required')
    if (!formData.contactPhone.trim()) errors.push('Contact phone is required')
    if (!formData.address.line1.trim()) errors.push('Address is required')
    if (!formData.address.city.trim()) errors.push('City is required')
    if (!formData.address.state.trim()) errors.push('State is required')
    if (!formData.address.postal_code.trim()) errors.push('ZIP code is required')
    
    return errors
  }

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setError(null)
    
    const validationErrors = validateStep1()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setLoading(true)
    
    try {
      // Use upsert to handle existing profiles
      const { data: ownerProfile, error: profileError } = await supabase
        .from('machine_owners')
        .upsert({
          user_id: user.id,
          business_name: formData.businessName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          tax_id: formData.taxId,
          address: formData.address,
          payout_schedule: formData.payoutSchedule,
          minimum_payout: formData.minimumPayout,
          payout_enabled: existingProfile?.payout_enabled || false,
          stripe_account_id: existingProfile?.stripe_account_id || null,
          bank_account_verified: existingProfile?.bank_account_verified || false,
          agreement_accepted: existingProfile?.agreement_accepted || false
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (profileError) throw profileError

      setExistingProfile(ownerProfile)
      
      // Move to Stripe Connect step
      setStep(2)
    } catch (error) {
      console.error('Error creating/updating owner profile:', error)
      setError(error.message || 'Failed to create or update owner profile')
    } finally {
      setLoading(false)
    }
  }

  const handleStripeConnect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let stripeAccountId = existingProfile?.stripe_account_id

      // Create Stripe Connect account if it doesn't exist
      if (!stripeAccountId) {
        const account = await createConnectAccount({
          userId: user.id,
          email: formData.contactEmail,
          businessName: formData.businessName,
          country: formData.address.country
        })
        
        stripeAccountId = account.id
      }

      // Get onboarding link
      const accountLink = await getConnectOnboardingLink(
        stripeAccountId,
        `${window.location.origin}/owner-signup?refresh=true`,
        `${window.location.origin}/owner-signup?success=true`
      )

      // Redirect to Stripe onboarding
      window.location.href = accountLink.url

    } catch (error) {
      console.error('Error setting up Stripe Connect:', error)
      setError('Failed to set up payment processing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    navigate('/owner-dashboard')
  }

  // Handle return from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const refresh = urlParams.get('refresh')

    if (success === 'true') {
      setStep(3)
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (refresh === 'true') {
      // User needs to complete onboarding again
      setError('Please complete the Stripe onboarding process to enable payouts.')
      setStep(2)
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to become a machine owner.
          </p>
          <Button onClick={() => navigate('/login')}>
            Login to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {existingProfile ? 'Update Owner Profile' : 'Become a Machine Owner'}
          </h1>
          <p className="text-xl text-gray-600">
            {existingProfile 
              ? 'Update your information or complete your setup'
              : 'Start earning by renting out your mining equipment to other miners'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2">
              <div className={`h-full transition-all duration-300 ${
                step >= 2 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2">
              <div className={`h-full transition-all duration-300 ${
                step >= 3 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-8">
          <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Business Info</span>
          <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Payment Setup</span>
          <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Complete</span>
        </div>

        {/* Step 1: Business Information */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">
                {existingProfile ? 'Update Business Information' : 'Business Information'}
              </h2>
            </div>

            {existingProfile && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> You already have an owner profile. You can update your information below.
                </p>
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Your business or personal name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="taxId">Tax ID (Optional)</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.address.line1}
                      onChange={(e) => handleInputChange('address.line1', e.target.value)}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">ZIP Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.address.postal_code}
                      onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                      placeholder="ZIP code"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Payout Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <select
                      id="payoutSchedule"
                      value={formData.payoutSchedule}
                      onChange={(e) => handleInputChange('payoutSchedule', e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="minimumPayout">Minimum Payout ($)</Label>
                    <Input
                      id="minimumPayout"
                      type="number"
                      step="0.01"
                      value={formData.minimumPayout}
                      onChange={(e) => handleInputChange('minimumPayout', parseFloat(e.target.value))}
                      placeholder="50.00"
                    />
                  </div>
                </div>
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
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {existingProfile ? 'Updating Profile...' : 'Creating Profile...'}
                    </>
                  ) : (
                    <>
                      Continue to Payment Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Stripe Connect Setup */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">Payment Processing Setup</h2>
            </div>

            {existingProfile?.stripe_account_id && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 text-sm">
                  <strong>Note:</strong> You already have a Stripe account connected. Complete the onboarding process to enable payouts.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">Connect Your Bank Account</h3>
                <p className="text-green-700 mb-4">
                  We use Stripe Connect to securely process payments and send payouts directly to your bank account.
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Secure, encrypted payment processing</li>
                  <li>• Automatic payouts on your schedule</li>
                  <li>• Real-time transaction monitoring</li>
                  <li>• Tax reporting and documentation</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Secure</h4>
                  <p className="text-sm text-gray-600">Bank-level security with PCI compliance</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Fast Payouts</h4>
                  <p className="text-sm text-gray-600">Receive payments within 2 business days</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Analytics</h4>
                  <p className="text-sm text-gray-600">Detailed earnings and performance reports</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">What You'll Need</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Government-issued ID (driver's license or passport)</li>
                  <li>• Bank account information for payouts</li>
                  <li>• Business tax ID (if applicable)</li>
                  <li>• Phone number for verification</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={handleStripeConnect}
                  disabled={loading}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5 mr-2" />
                      {existingProfile?.stripe_account_id ? 'Complete Stripe Onboarding' : 'Connect with Stripe'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">
              {existingProfile?.stripe_account_id ? 'Setup Complete!' : 'Welcome to Mybuji!'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {existingProfile?.stripe_account_id 
                ? 'Your machine owner account has been successfully updated and verified.'
                : 'Your machine owner account has been successfully created and verified.'
              }
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-blue-800 mb-3">What's Next?</h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li>• Add your first mining machine to the rental marketplace</li>
                <li>• Set competitive daily rates and availability</li>
                <li>• Start receiving rental requests from miners</li>
                <li>• Monitor your earnings in the owner dashboard</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleComplete}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Owner Dashboard
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/list-machine')}
              >
                Add Your First Machine
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerSignupPage