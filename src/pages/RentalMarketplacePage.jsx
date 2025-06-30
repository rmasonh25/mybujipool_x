import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Search, 
  Filter, 
  MapPin, 
  Zap, 
  DollarSign, 
  Star, 
  Calendar,
  Cpu,
  TrendingUp,
  Shield,
  Clock,
  X,
  AlertCircle
} from 'lucide-react'

const RentalMarketplacePage = () => {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [machines, setMachines] = useState([])
  const [filteredMachines, setFilteredMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [minHashrate, setMinHashrate] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [location, setLocation] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [sortBy, setSortBy] = useState('daily_rate') // daily_rate, hashrate, efficiency, rating
  const [showFilters, setShowFilters] = useState(false)
  const [includeDemoEquipment, setIncludeDemoEquipment] = useState(true)

  useEffect(() => {
    fetchMachines()
  }, [])

  useEffect(() => {
    filterMachines()
  }, [machines, searchTerm, minHashrate, maxPrice, location, manufacturer, sortBy, includeDemoEquipment])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('rental_machines')
        .select(`
          *,
          owner:owner_id(email),
          machine_owner:owner_id(
            machine_owners(business_name, payout_enabled)
          )
        `)
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('daily_rate', { ascending: true })
      
      if (error) throw error
      
      setMachines(data || [])
    } catch (error) {
      console.error('Error fetching machines:', error)
      setError('Failed to load rental machines')
    } finally {
      setLoading(false)
    }
  }

  const filterMachines = () => {
    let filtered = machines

    // Filter out demo equipment if not included
    if (!includeDemoEquipment) {
      filtered = filtered.filter(machine => !machine.is_demo)
    }

    // Search filter - search across multiple fields
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(machine => 
        machine.name.toLowerCase().includes(searchLower) ||
        machine.model.toLowerCase().includes(searchLower) ||
        machine.manufacturer.toLowerCase().includes(searchLower) ||
        (machine.description && machine.description.toLowerCase().includes(searchLower)) ||
        (machine.location && machine.location.toLowerCase().includes(searchLower)) ||
        (machine.machine_owner?.machine_owners?.[0]?.business_name && 
         machine.machine_owner.machine_owners[0].business_name.toLowerCase().includes(searchLower))
      )
    }

    // Hashrate filter
    if (minHashrate) {
      filtered = filtered.filter(machine => machine.hashrate >= parseFloat(minHashrate))
    }

    // Price filter
    if (maxPrice) {
      filtered = filtered.filter(machine => machine.daily_rate <= parseFloat(maxPrice))
    }

    // Location filter
    if (location) {
      filtered = filtered.filter(machine => 
        machine.location?.toLowerCase().includes(location.toLowerCase())
      )
    }

    // Manufacturer filter
    if (manufacturer) {
      filtered = filtered.filter(machine => 
        machine.manufacturer.toLowerCase() === manufacturer.toLowerCase()
      )
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'hashrate':
          return b.hashrate - a.hashrate
        case 'efficiency':
          return a.efficiency - b.efficiency
        case 'rating':
          return b.average_rating - a.average_rating
        case 'daily_rate':
        default:
          return a.daily_rate - b.daily_rate
      }
    })

    setFilteredMachines(filtered)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled automatically by useEffect
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setMinHashrate('')
    setMaxPrice('')
    setLocation('')
    setManufacturer('')
    setSortBy('daily_rate')
    setIncludeDemoEquipment(true)
  }

  const hasActiveFilters = searchTerm || minHashrate || maxPrice || location || manufacturer || sortBy !== 'daily_rate' || !includeDemoEquipment

  const formatHashrate = (hashrate) => {
    return `${hashrate} TH/s`
  }

  const formatEfficiency = (efficiency) => {
    return `${efficiency.toFixed(1)} J/GH`
  }

  const getManufacturers = () => {
    const manufacturers = [...new Set(machines.map(m => m.manufacturer))]
    return manufacturers.sort()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mining Equipment Marketplace</h1>
        <p className="text-gray-600">
          Rent professional mining equipment by the day. All machines are verified and monitored 24/7.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <p className="text-blue-700">
            <strong>New Fee Structure:</strong> Only $1.25 per day per machine rental fee. No monthly subscription required!
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Available Machines</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{machines.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Total Hashrate</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {machines.reduce((sum, m) => sum + (m.hashrate || 0), 0).toFixed(0)} TH/s
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-medium">Starting From</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {machines.length > 0 ? formatCurrency(Math.min(...machines.map(m => m.daily_rate))) : '$0'}/day
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {machines.length > 0 ? (machines.reduce((sum, m) => sum + m.average_rating, 0) / machines.length).toFixed(1) : '0'}/5
          </p>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search Equipment</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by model, manufacturer, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="w-48">
            <Label htmlFor="sortBy" className="sr-only">Sort By</Label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="daily_rate">Price (Low to High)</option>
              <option value="hashrate">Hashrate (High to Low)</option>
              <option value="efficiency">Efficiency (Best First)</option>
              <option value="rating">Rating (High to Low)</option>
            </select>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </form>
        
        {/* Search Results Summary */}
        <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
          <span>
            Showing {filteredMachines.length} of {machines.length} machines
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h3 className="font-medium mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <select
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">All Manufacturers</option>
                {getManufacturers().map(mfg => (
                  <option key={mfg} value={mfg}>{mfg}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="minHashrate">Min Hashrate (TH/s)</Label>
              <Input
                id="minHashrate"
                type="number"
                step="0.1"
                placeholder="e.g., 100"
                value={minHashrate}
                onChange={(e) => setMinHashrate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="maxPrice">Max Price ($/day)</Label>
              <Input
                id="maxPrice"
                type="number"
                step="0.01"
                placeholder="e.g., 50.00"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Texas"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Demo Equipment Toggle */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeDemoEquipment"
                checked={includeDemoEquipment}
                onChange={(e) => setIncludeDemoEquipment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeDemoEquipment" className="ml-2 block text-sm text-gray-700">
                Include demonstration equipment
              </label>
            </div>
          </div>
        </div>
      )}

      {/* New Fee Structure Banner */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">New Simple Pricing</h3>
            <p className="text-sm text-green-700">
              We've simplified our pricing! Now you only pay $1.25 per day per machine rental fee. No monthly subscription required. 
              Access to our solo mining pool with rotating block system is completely free.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">
            {hasActiveFilters ? 'No machines match your search' : 'No machines found'}
          </h3>
          <p className="text-gray-500 mt-2">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or filters'
              : 'Check back later for new listings'
            }
          </p>
          {hasActiveFilters && (
            <Button 
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear filters and show all
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <Link 
              key={machine.id}
              to={`/rent/${machine.id}`}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                machine.is_demo ? 'border-2 border-yellow-300' : ''
              }`}
            >
              <div className="h-48 bg-gray-200 relative">
                {machine.image_url ? (
                  <img 
                    src={machine.image_url} 
                    alt={machine.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Cpu className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Status badges */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Available
                  </span>
                </div>
                
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Verified
                  </span>
                </div>

                {/* Demo watermark */}
                {machine.is_demo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-yellow-500 text-black px-4 py-2 font-bold text-lg transform rotate-45 shadow-lg opacity-90">
                      DEMO ONLY
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{machine.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{machine.average_rating}</span>
                    <span className="text-xs text-gray-500">({machine.total_rentals})</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{machine.model} by {machine.manufacturer}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Hashrate</p>
                    <p className="font-medium">{formatHashrate(machine.hashrate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Power</p>
                    <p className="font-medium">{machine.power_consumption}W</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Efficiency</p>
                    <p className="font-medium">{formatEfficiency(machine.efficiency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Daily Rate</p>
                    <p className="font-bold text-green-600">{formatCurrency(machine.daily_rate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{machine.location}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    Owned by {machine.machine_owner?.machine_owners?.[0]?.business_name || 'Verified Owner'}
                  </span>
                </div>
                
                {machine.is_demo && (
                  <div className="bg-yellow-50 p-2 rounded-md mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      This is a demonstration machine for testing purposes only. No actual mining will occur.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Min {machine.min_rental_days} day{machine.min_rental_days > 1 ? 's' : ''}
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = `/rent/${machine.id}`
                    }}
                  >
                    Rent Now
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 bg-blue-50 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Why Rent ASICs?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access professional mining equipment without the upfront investment, maintenance, or electricity costs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">No Upfront Costs</h3>
            <p className="text-sm text-gray-600">
              Start mining immediately without buying expensive hardware
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Professional Setup</h3>
            <p className="text-sm text-gray-600">
              All machines are hosted in professional data centers with 24/7 monitoring
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Flexible Terms</h3>
            <p className="text-sm text-gray-600">
              Rent for as little as 1 day or as long as 30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RentalMarketplacePage