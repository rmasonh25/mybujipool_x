import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Check, Plus, ShoppingCart } from 'lucide-react'

const ProductCard = ({ product, featured = false }) => {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!user) return

    try {
      setIsAdding(true)
      await addToCart(product.id)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getBillingText = (period) => {
    switch (period) {
      case 'monthly': return 'per month'
      case 'yearly': return 'per year'
      case 'one-time': return 'one-time'
      default: return period
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col ${featured ? 'ring-2 ring-blue-500' : ''}`}>
      {featured && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="p-8 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-6">{product.description}</p>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formatCurrency(product.price)}</span>
            <span className="text-gray-500">{getBillingText(product.billing_period)}</span>
          </div>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <ul className="space-y-3 mb-8 flex-grow">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <Button 
          onClick={handleAddToCart}
          disabled={isAdding || !user}
          className={`w-full mt-auto ${featured ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          size="lg"
        >
          {isAdding ? (
            'Adding...'
          ) : (
            <>
              {user ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              ) : (
                'Login to Purchase'
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default ProductCard