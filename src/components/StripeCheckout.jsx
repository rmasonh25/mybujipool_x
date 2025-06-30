import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './ui/dialog'
import { 
  CreditCard, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

const StripeCheckout = ({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  items = [],
  mode = 'payment',
  onSuccess 
}) => {
  const { user } = useAuth()
  const { clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckout = async () => {
    if (!user || !orderId) {
      setError('User authentication required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Prepare line items for Stripe
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product?.name || item.name,
            description: item.product?.description || item.description,
            images: item.product?.image_url ? [item.product.image_url] : []
          },
          unit_amount: Math.round((item.price_at_time || item.price) * 100), // Convert to cents
          recurring: item.product?.billing_period && item.product.billing_period !== 'one-time' ? {
            interval: item.product.billing_period === 'yearly' ? 'year' : 'month'
          } : undefined
        },
        quantity: item.quantity || 1
      }))

      // Create checkout session
      const session = await createCheckoutSession({
        orderId,
        lineItems,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        mode: lineItems.some(item => item.price_data.recurring) ? 'subscription' : 'payment'
      })

      // Update order with session ID
      await supabase
        .from('orders')
        .update({ 
          stripe_session_id: session.id,
          status: 'processing'
        })
        .eq('id', orderId)

      // Redirect to Stripe checkout
      await redirectToCheckout(session.id)

    } catch (error) {
      console.error('Checkout error:', error)
      setError(error.message || 'Failed to process checkout')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Secure Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your purchase with Stripe's secure payment processing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Order Summary</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.product?.name || item.name}</span>
                  <span>{formatCurrency(item.price_at_time || item.price)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Secure Payment</h4>
                <p className="text-sm text-blue-700">
                  Your payment is processed securely by Stripe. We never store your payment information.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Payment Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pay with Stripe
                </>
              )}
            </Button>
          </div>

          {/* Stripe Branding */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Powered by <span className="font-medium">Stripe</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StripeCheckout