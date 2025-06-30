import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Button } from './ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu'
import { ChevronDown, User, ShoppingCart, Cpu, Settings, HardDrive, Building, Pickaxe, BookOpen } from 'lucide-react'
import Cart from './Cart'

const Navbar = () => {
  const { isLoggedIn, logout, user } = useAuth()
  const { getCartItemCount } = useCart()
  const navigate = useNavigate()
  const [showCart, setShowCart] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const cartItemCount = getCartItemCount()

  return (
    <>
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            Mybuji Marketplace
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-primary">
              Home
            </Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-primary">
              Marketplace
            </Link>
            <Link to="/membership" className="text-gray-700 hover:text-primary">
              Pricing
            </Link>
            <Link to="/bitcoin-mining-faq" className="text-gray-700 hover:text-primary">
              Mining FAQ
            </Link>
            {isLoggedIn && (
              <Link to="/demo-mining" className="text-gray-700 hover:text-primary">
                Demo Mining
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Cart Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCart(true)}
                  className="relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>

                {/* Account Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <User size={18} />
                      <span>Account</span>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Profile - Always available */}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Demo Mining - Always available for logged in users */}
                    <DropdownMenuItem asChild>
                      <Link to="/demo-mining" className="w-full cursor-pointer">
                        <Pickaxe className="w-4 h-4 mr-2" />
                        Demo Mining
                      </Link>
                    </DropdownMenuItem>

                    {/* Member-only features */}
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/my-equipment" className="w-full cursor-pointer">
                        <HardDrive className="w-4 h-4 mr-2" />
                        My Equipment
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Owner features */}
                    <DropdownMenuItem asChild>
                      <Link to="/owner-dashboard" className="w-full cursor-pointer">
                        <Building className="w-4 h-4 mr-2" />
                        Owner Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    
                    {/* Logout */}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Cart Modal */}
      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  )
}

export default Navbar