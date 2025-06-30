import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Mybuji Marketplace</h3>
            <p className="text-gray-600">
              Connect ASIC owners with miners who want to rent hashpower for solo mining.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-gray-600 hover:text-primary">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/membership" className="text-gray-600 hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/bitcoin-mining-faq" className="text-gray-600 hover:text-primary">
                  Bitcoin Mining FAQ
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-600 hover:text-primary">
                  News & Updates
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-600">
              Have questions? Contact us at support@mybujimarketplace.com
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Mybuji Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer