import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './ui/dialog'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  ArrowRight
} from 'lucide-react'

const Cart = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { cartItems, updateCartItem, removeFromCart, getCartTotal } = useCart()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user || cartItems.length === 0) return
    
    onClose()
    navigate('/checkout')
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
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
          </DialogTitle>
          <DialogDescription>
            Review your items before checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">{item.product.description}</p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(item.price_at_time)}
                        {item.product.billing_period !== 'one-time' && `/${item.product.billing_period}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(getCartTotal())}</span>
                </div>

                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Cart