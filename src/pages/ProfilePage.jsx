import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
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
  User, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Crown, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  CreditCard,
  UserCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  ExternalLink,
  Loader2,
  Wallet,
  Info
} from 'lucide-react'

const ProfilePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // User data states
  const [userProfile, setUserProfile] = useState(null)
  const [ownerProfile, setOwnerProfile] = useState(null)
  
  // Form data for editing
  const [formData, setFormData] = useState({
    email: '',
    wallet_address: '',
    // Owner profile fields
    business_name: '',
    contact_email: '',
    contact_phone: '',
    tax_id: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  })

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Get user profile
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
      
      if (userError) throw userError
      
      const userData = users && users.length > 0 ? users[0] : null
      
      // Create user profile if it doesn't exist
      if (!userData) {
        const { data: newUserData, error: createError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            wallet_address: ''
          }, {
            onConflict: 'id'
          })
          .select()
          .single()
        
        if (createError) throw createError
        setUserProfile(newUserData)
      } else {
        setUserProfile(userData)
      }
      
      // Get owner profile if exists
      const { data: owners, error: ownerError } = await supabase
        .from('machine_owners')
        .select('*')
        .eq('user_id', user.id)
      
      if (ownerError) throw ownerError
      
      const ownerData = owners && owners.length > 0 ? owners[0] : null
      setOwnerProfile(ownerData)
      
      // Set form data
      setFormData({
        email: user.email,
        wallet_address: userData?.wallet_address || '',
        business_name: ownerData?.business_name || '',
        contact_email: ownerData?.contact_email || user.email,
        contact_phone: ownerData?.contact_phone || '',
        tax_id: ownerData?.tax_id || '',
        address: ownerData?.address || {
          line1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US'
        }
      })
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Update user profile with wallet address
      const { error: userError } = await supabase
        .from('users')
        .update({
          wallet_address: formData.wallet_address
        })
        .eq('id', user.id)
      
      if (userError) throw userError
      
      // Update owner profile if it exists
      if (ownerProfile) {
        const { error: ownerError } = await supabase
          .from('machine_owners')
          .update({
            business_name: formData.business_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            tax_id: formData.tax_id,
            address: formData.address,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        
        if (ownerError) throw ownerError
      }
      
      setSuccess('Profile updated successfully')
      setEditing(false)
      await fetchUserData()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setError(null)
    // Reset form data
    setFormData({
      email: user.email,
      wallet_address: userProfile?.wallet_address || '',
      business_name: ownerProfile?.business_name || '',
      contact_email: ownerProfile?.contact_email || user.email,
      contact_phone: ownerProfile?.contact_phone || '',
      tax_id: ownerProfile?.tax_id || '',
      address: ownerProfile?.address || {
        line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US'
      }
    })
  }

  const handleDeleteAccount = async () => {
    try {
      // In a real implementation, this would be handled by a backend service
      // For demo purposes, we'll just log out the user
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      setError('Failed to delete account')
    }
  }

  const getWalletStatusInfo = () => {
    if (userProfile?.wallet_address) {
      return {
        icon: <Wallet className="w-5 h-5 text-green-600" />,
        text: 'Wallet Connected',
        description: 'Your Bitcoin wallet is set up for mining rewards',
        color: 'text-green-600 bg-green-100',
        action: null
      }
    } else {
      return {
        icon: <Wallet className="w-5 h-5 text-yellow-600" />,
        text: 'Wallet Not Set',
        description: 'Add your Bitcoin wallet to receive mining rewards',
        color: 'text-yellow-600 bg-yellow-100',
        action: (
          <Button size="sm" onClick={() => setEditing(true)}>
            <Wallet className="w-3 h-3 mr-1" />
            Add Wallet
          </Button>
        )
      }
    }
  }

  const getOwnerStatusInfo = () => {
    if (!ownerProfile) {
      return {
        icon: <Building className="w-5 h-5 text-gray-600" />,
        text: 'Not a Machine Owner',
        description: 'Become an owner to list your mining equipment for rent',
        color: 'text-gray-600 bg-gray-100',
        action: (
          <Button size="sm" asChild>
            <Link to="/owner-signup">
              <Building className="w-3 h-3 mr-1" />
              Become Owner
            </Link>
          </Button>
        )
      }
    }
    
    const isVerified = ownerProfile.payout_enabled && ownerProfile.agreement_accepted
    
    if (isVerified) {
      return {
        icon: <UserCheck className="w-5 h-5 text-green-600" />,
        text: 'Verified Owner',
        description: 'You can list mining equipment and receive rental payments',
        color: 'text-green-600 bg-green-100',
        action: (
          <Button size="sm" asChild>
            <Link to="/owner-dashboard">
              <Settings className="w-3 h-3 mr-1" />
              Manage
            </Link>
          </Button>
        )
      }
    } else {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        text: 'Setup Required',
        description: 'Complete verification to start listing equipment',
        color: 'text-yellow-600 bg-yellow-100',
        action: (
          <Button size="sm" asChild>
            <Link to="/owner-dashboard">
              <Settings className="w-3 h-3 mr-1" />
              Complete Setup
            </Link>
          </Button>
        )
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const walletInfo = getWalletStatusInfo()
  const ownerInfo = getOwnerStatusInfo()

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-gray-600">
                Manage your account settings, wallet, and owner status
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {!editing ? (
                <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Wallet Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {walletInfo.icon}
                  <div>
                    <h3 className="font-semibold">{walletInfo.text}</h3>
                    <p className="text-sm text-gray-600">{walletInfo.description}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${walletInfo.color}`}>
                  {userProfile?.wallet_address ? 'Connected' : 'Not Set'}
                </div>
              </div>
              
              {walletInfo.action && (
                <div className="flex justify-end">
                  {walletInfo.action}
                </div>
              )}
              
              {userProfile?.wallet_address && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Wallet Address:</span>
                    <span className="text-green-600 font-medium font-mono text-xs truncate max-w-[200px]">
                      {userProfile.wallet_address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Mining Status:</span>
                    <span className="text-green-600 font-medium">Ready for Rotation</span>
                  </div>
                </div>
              )}
            </div>

            {/* Owner Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {ownerInfo.icon}
                  <div>
                    <h3 className="font-semibold">{ownerInfo.text}</h3>
                    <p className="text-sm text-gray-600">{ownerInfo.description}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${ownerInfo.color}`}>
                  {ownerProfile ? (ownerProfile.payout_enabled ? 'Verified' : 'Pending') : 'Inactive'}
                </div>
              </div>
              
              {ownerInfo.action && (
                <div className="flex justify-end">
                  {ownerInfo.action}
                </div>
              )}
              
              {ownerProfile && (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Business Info:</span>
                      <span className={ownerProfile.business_name ? 'text-green-600' : 'text-gray-400'}>
                        {ownerProfile.business_name ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Agreement:</span>
                      <span className={ownerProfile.agreement_accepted ? 'text-green-600' : 'text-gray-400'}>
                        {ownerProfile.agreement_accepted ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payouts:</span>
                      <span className={ownerProfile.payout_enabled ? 'text-green-600' : 'text-gray-400'}>
                        {ownerProfile.payout_enabled ? 'Enabled' : 'Setup Required'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="account">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Account Information</TabsTrigger>
              <TabsTrigger value="wallet">Wallet Settings</TabsTrigger>
              <TabsTrigger value="owner">Owner Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Account Information</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>
                    
                    <div>
                      <Label>Account Created</Label>
                      <Input
                        value={new Date(user.created_at).toLocaleDateString()}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>User ID</Label>
                      <Input
                        value={user.id}
                        disabled
                        className="bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    
                    <div>
                      <Label>Last Sign In</Label>
                      <Input
                        value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wallet">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Wallet Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2">Mining Wallet Address</h3>
                        <p className="text-sm text-blue-700">
                          This wallet address will be used in our rotating block system. When a block is found during your rotation time, the reward will be sent directly to this address.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="wallet_address">Bitcoin Wallet Address</Label>
                    <Input
                      id="wallet_address"
                      value={formData.wallet_address}
                      onChange={(e) => handleInputChange('wallet_address', e.target.value)}
                      placeholder="bc1q..."
                      disabled={!editing}
                      className={!editing ? "bg-gray-50" : ""}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a valid Bitcoin address where you want to receive mining rewards
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Important</h4>
                        <p className="text-sm text-yellow-700">
                          Double-check your wallet address carefully. We cannot recover funds sent to incorrect addresses. Make sure you have full control of this wallet and keep your private keys secure.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {editing && (
                    <div className="flex justify-end">
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Wallet
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="owner">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Owner Profile</h2>
                  {!ownerProfile && (
                    <Button asChild>
                      <Link to="/owner-signup">
                        <Building className="w-4 h-4 mr-2" />
                        Become an Owner
                      </Link>
                    </Button>
                  )}
                </div>
                
                {!ownerProfile ? (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Owner Profile</h3>
                    <p className="text-gray-600 mb-6">
                      Create an owner profile to list your mining equipment for rent and start earning passive income.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-blue-800 mb-2">Benefits of Becoming an Owner:</h4>
                      <ul className="text-sm text-blue-700 space-y-1 text-left">
                        <li>• Earn passive income from your mining equipment</li>
                        <li>• List your machines for free</li>
                        <li>• Only $1.25 per day per rental</li>
                        <li>• Automatic payment processing via Stripe</li>
                        <li>• 24/7 customer support and monitoring</li>
                      </ul>
                    </div>
                    <Button size="lg" asChild>
                      <Link to="/owner-signup">Get Started</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={formData.business_name}
                          onChange={(e) => handleInputChange('business_name', e.target.value)}
                          disabled={!editing}
                          placeholder="Your business name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => handleInputChange('contact_email', e.target.value)}
                          disabled={!editing}
                          placeholder="contact@example.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                          disabled={!editing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input
                          id="taxId"
                          value={formData.tax_id}
                          onChange={(e) => handleInputChange('tax_id', e.target.value)}
                          disabled={!editing}
                          placeholder="Tax identification number"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Business Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="addressLine1">Address Line 1</Label>
                          <Input
                            id="addressLine1"
                            value={formData.address.line1}
                            onChange={(e) => handleInputChange('address.line1', e.target.value)}
                            disabled={!editing}
                            placeholder="Street address"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.address.city}
                            onChange={(e) => handleInputChange('address.city', e.target.value)}
                            disabled={!editing}
                            placeholder="City"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.address.state}
                            onChange={(e) => handleInputChange('address.state', e.target.value)}
                            disabled={!editing}
                            placeholder="State"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="postalCode">ZIP Code</Label>
                          <Input
                            id="postalCode"
                            value={formData.address.postal_code}
                            onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                            disabled={!editing}
                            placeholder="ZIP code"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <select
                            id="country"
                            value={formData.address.country}
                            onChange={(e) => handleInputChange('address.country', e.target.value)}
                            disabled={!editing}
                            className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md disabled:bg-gray-50"
                          >
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="AU">Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {ownerProfile && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Owner Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Payout Status</Label>
                            <Input
                              value={ownerProfile.payout_enabled ? 'Enabled' : 'Not Set Up'}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <Label>Stripe Account</Label>
                            <Input
                              value={ownerProfile.stripe_account_id ? 'Connected' : 'Not connected'}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <Label>Agreement Status</Label>
                            <Input
                              value={ownerProfile.agreement_accepted ? 'Accepted' : 'Not Accepted'}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <Label>Member Since</Label>
                            <Input
                              value={new Date(ownerProfile.created_at).toLocaleDateString()}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Password Management</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Password changes are handled through Supabase Auth. You can reset your password using the forgot password feature on the login page.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/login">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Reset Password
                      </Link>
                    </Button>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Account Security</h3>
                    <div className="space-y-2 text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Email verification: Enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Secure authentication: Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Data encryption: Enabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your user account and profile</li>
                <li>• Your wallet address and mining settings</li>
                <li>• All machine listings and rental history</li>
                <li>• Owner profile and business information</li>
                <li>• All associated data and preferences</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Note:</h4>
              <p className="text-sm text-yellow-700">
                This is a demo implementation. In production, account deletion would be handled by a secure backend process with proper data retention policies.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="flex-1"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProfilePage