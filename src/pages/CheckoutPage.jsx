import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import StripeCheckout from '../components/StripeCheckout'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../components/ui/dialog'
import { 
  CreditCard, 
  Lock, 
  ShoppingCart, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ExternalLink
} from 'lucide-react'

const CheckoutPage = () => {
  const { user } = useAuth()
  const { cartItems, getCartTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [error, setError] = useState(null)
  
  // Billing form state
  const [billingInfo, setBillingInfo] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })

  useEffect(() => {
    // Handle successful payment return from Stripe
    const sessionId = searchParams.get('session_id')
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true' && sessionId) {
      handlePaymentSuccess(sessionId)
    } else if (canceled === 'true') {
      setError('Payment was canceled. You can try again.')
    }

    // Redirect if cart is empty and no success parameter
    if (cartItems.length === 0 && !success) {
      navigate('/membership')
    }
  }, [cartItems, navigate, searchParams])

  const handlePaymentSuccess = async (sessionId) => {
    try {
      // Verify the session and update order status
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single()

      if (error) throw error

      if (order) {
        setCurrentOrder(order)
        setOrderCreated(true)
        await clearCart()
      }
    } catch (error) {
      console.error('Error handling payment success:', error)
      setError('Payment verification failed. Please contact support.')
    }
  }

  const handleInputChange = (field, value) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!billingInfo.firstName.trim()) errors.push('First name is required')
    if (!billingInfo.lastName.trim()) errors.push('Last name is required')
    if (!billingInfo.email.trim()) errors.push('Email is required')
    if (!billingInfo.address.trim()) errors.push('Address is required')
    if (!billingInfo.city.trim()) errors.push('City is required')
    if (!billingInfo.zipCode.trim()) errors.push('ZIP code is required')
    
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
    
    setLoading(true)
    
    try {
      // Create order in database
      const orderData = {
        user_id: user.id,
        total_amount: getCartTotal(),
        status: 'pending',
        metadata: {
          billing_info: billingInfo,
          cart_items: cartItems.map(item => ({
            product_id: item.product_id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.price_at_time
          }))
        }
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: item.price_at_time
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      setCurrentOrder(order)
      
      // Proceed to Stripe checkout
      await proceedToStripeCheckout(order)
      
    } catch (error) {
      console.error('Error creating order:', error)
      setError(error.message || 'Failed to process order')
    } finally {
      setLoading(false)
    }
  }

  const proceedToStripeCheckout = async (order) => {
    try {
      // Prepare line items for Stripe
      const lineItems = cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description,
          },
          unit_amount: Math.round(item.price_at_time * 100), // Convert to cents
          recurring: item.product.billing_period !== 'one-time' ? {
            interval: item.product.billing_period === 'yearly' ? 'year' : 'month'
          } : undefined
        },
        quantity: item.quantity,
      }))

      // Determine checkout mode
      const mode = lineItems.some(item => item.price_data.recurring) ? 'subscription' : 'payment'

      // Create checkout session
      const session = await createCheckoutSession({
        orderId: order.id,
        lineItems,
        customerEmail: billingInfo.email,
        successUrl: `${window.location.origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        mode
      })

      // Update order with session ID
      await supabase
        .from('orders')
        .update({ 
          stripe_session_id: session.id,
          status: 'processing'
        })
        .eq('id', order.id)

      // Redirect to Stripe checkout
      await redirectToCheckout(session.id)
      
    } catch (error) {
      console.error('Error proceeding to Stripe checkout:', error)
      setError('Failed to initialize payment. Please try again.')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Success page
  if (orderCreated || searchParams.get('success') === 'true') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your membership is now active and you can start mining immediately.
          </p>
          
          {currentOrder && (
            <div className="bg-green-50 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-green-800 mb-2">Order Details</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>Order ID: {currentOrder.id}</p>
                <p>Amount: {formatCurrency(currentOrder.total_amount)}</p>
                <p>Status: Completed</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Check your email for order confirmation and setup instructions</li>
              <li>• Visit your dashboard to configure your mining equipment</li>
              <li>• Connect to our solo mining pool and start mining</li>
              <li>• Monitor your progress with real-time statistics</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo-mining">Start Demo Mining</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Secure Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Billing Information */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-6">Billing Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={billingInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={billingInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={billingInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={billingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={billingInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={billingInfo.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      value={billingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Payment Information
                </h2>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Secure Payment with Stripe</h4>
                      <p className="text-sm text-blue-700 mb-4">
                        Your payment will be processed securely by Stripe. We never store your payment information.
                      </p>
                      <div className="flex items-center gap-4 text-sm text-blue-700">
                        <span>✓ SSL Encrypted</span>
                        <span>✓ PCI Compliant</span>
                        <span>✓ Bank-level Security</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading || cartItems.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Continue to Stripe - {formatCurrency(getCartTotal())}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity} × {formatCurrency(item.price_at_time)}
                        {item.product.billing_period !== 'one-time' && `/${item.product.billing_period}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.price_at_time * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Secure payment processing with Stripe</li>
                  <li>• Instant membership activation</li>
                  <li>• Email confirmation with setup guide</li>
                  <li>• Access to solo mining pool</li>
                  <li>• Equipment management dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage