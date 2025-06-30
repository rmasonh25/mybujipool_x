import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import RentalMarketplacePage from './pages/RentalMarketplacePage'
import RentMachinePage from './pages/RentMachinePage'
import ListAsicPage from './pages/ListAsicPage'
import DashboardPage from './pages/DashboardPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import OwnerSignupPage from './pages/OwnerSignupPage'
import ListMachinePage from './pages/ListMachinePage'
import DemoMiningPage from './pages/DemoMiningPage'
import MyEquipmentPage from './pages/MyEquipmentPage'
import MembershipPage from './pages/MembershipPage'
import LaunchSpecialPage from './pages/LaunchSpecialPage'
import CheckoutPage from './pages/CheckoutPage'
import ProfilePage from './pages/ProfilePage'
import NewsPage from './pages/NewsPage'
import BitcoinMiningFAQPage from './pages/BitcoinMiningFAQPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { isInitialized } = useAuth()

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="rental-marketplace" element={<RentalMarketplacePage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="launch-special" element={<LaunchSpecialPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsPage />} />
        <Route path="bitcoin-mining-faq" element={<BitcoinMiningFAQPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="owner-dashboard" element={<OwnerDashboardPage />} />
          <Route path="owner-signup" element={<OwnerSignupPage />} />
          <Route path="list-machine" element={<ListMachinePage />} />
          <Route path="rent/:machineId" element={<RentMachinePage />} />
          <Route path="list-asic" element={<ListAsicPage />} />
          <Route path="demo-mining" element={<DemoMiningPage />} />
          <Route path="my-equipment" element={<MyEquipmentPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App