import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { 
  Cpu, 
  Monitor, 
  Laptop, 
  Plus, 
  Settings, 
  Activity, 
  Wifi, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Power,
  Zap,
  HardDrive,
  Crown,
  Lock,
  ShoppingCart
} from 'lucide-react'

const MyEquipmentPage = () => {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'asic', // asic, gpu, cpu
    model: '',
    hashrate: '',
    power: '',
    wallet_address: '',
    pool_config: {
      stratum_url: 'stratum+tcp://pool.mybuji.com:3333',
      worker_name: '',
      password: 'x'
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
      
      // Get user profile to check membership status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (userError && userError.code !== 'PGRST116') throw userError
      setUserProfile(userData)
      
      // Get equipment only if user is a member
      if (userData?.is_paid_member) {
        const { data, error } = await supabase
          .from('user_equipment')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setEquipment(data || [])
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load your equipment')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('pool_')) {
      const poolField = name.replace('pool_', '')
      setFormData(prev => ({
        ...prev,
        pool_config: {
          ...prev.pool_config,
          [poolField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Check membership status
    if (!userProfile?.is_paid_member) {
      setError('Active membership required to add equipment')
      return
    }
    
    try {
      const equipmentData = {
        owner_id: user.id,
        name: formData.name,
        type: formData.type,
        model: formData.model,
        hashrate: parseFloat(formData.hashrate) || null,
        power: parseFloat(formData.power) || null,
        wallet_address: formData.wallet_address,
        pool_config: formData.pool_config,
        status: 'offline'
      }

      if (editingEquipment) {
        const { error } = await supabase
          .from('user_equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_equipment')
          .insert([equipmentData])
        
        if (error) throw error
      }
      
      // Reset form
      setFormData({
        name: '',
        type: 'asic',
        model: '',
        hashrate: '',
        power: '',
        wallet_address: '',
        pool_config: {
          stratum_url: 'stratum+tcp://pool.mybuji.com:3333',
          worker_name: '',
          password: 'x'
        }
      })
      setShowAddForm(false)
      setEditingEquipment(null)
      
      // Refresh equipment list
      fetchUserData()
    } catch (error) {
      console.error('Error saving equipment:', error)
      setError(error.message || 'Failed to save equipment')
    }
  }

  const handleEdit = (item) => {
    setEditingEquipment(item)
    setFormData({
      name: item.name,
      type: item.type,
      model: item.model,
      hashrate: item.hashrate?.toString() || '',
      power: item.power?.toString() || '',
      wallet_address: item.wallet_address,
      pool_config: item.pool_config || {
        stratum_url: 'stratum+tcp://pool.mybuji.com:3333',
        worker_name: '',
        password: 'x'
      }
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this equipment?')) return
    
    try {
      const { error } = await supabase
        .from('user_equipment')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      fetchUserData()
    } catch (error) {
      console.error('Error deleting equipment:', error)
      setError('Failed to delete equipment')
    }
  }

  const getEquipmentIcon = (type) => {
    switch (type) {
      case 'asic': return <Cpu className="w-6 h-6" />
      case 'gpu': return <Monitor className="w-6 h-6" />
      case 'cpu': return <Laptop className="w-6 h-6" />
      default: return <HardDrive className="w-6 h-6" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'mining': return 'text-blue-600 bg-blue-100'
      case 'offline': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const isMember = userProfile?.is_paid_member

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show membership required if not a member
  if (!isMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Mining Equipment</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Membership Required</h2>
            <p className="text-xl text-gray-600 mb-8">
              You need an active membership to connect your own mining equipment to our solo pool.
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
              <h3 className="font-semibold text-blue-800 mb-4">With a membership you can:</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connect unlimited ASICs, GPUs, and CPUs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mine directly to your wallet (non-custodial)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Keep 100% of any block rewards you find</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Access to equipment management dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Rent additional hashpower when needed</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                <Link to="/launch-special">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Launch Special - $9.98/month
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" asChild>
                <Link to="/membership">
                  View All Plans
                </Link>
              </Button>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Want to rent equipment instead?</h4>
              <p className="text-sm text-green-700 mb-3">
                Browse our rental marketplace to rent professional mining equipment by the day.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/rental-marketplace">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Browse Rental Equipment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Mining Equipment</h1>
          <p className="text-gray-600">
            Connect your own ASICs, GPUs, or CPUs to mine directly to your wallet
          </p>
          
          {/* Member Badge */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
              <Crown className="w-4 h-4" />
              <span className="font-medium">Active Member</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Link to Rental Marketplace */}
          <Button variant="outline" asChild>
            <Link to="/rental-marketplace">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Rent Equipment
            </Link>
          </Button>
          
          <Button 
            onClick={() => {
              setShowAddForm(true)
              setEditingEquipment(null)
              setFormData({
                name: '',
                type: 'asic',
                model: '',
                hashrate: '',
                power: '',
                wallet_address: '',
                pool_config: {
                  stratum_url: 'stratum+tcp://pool.mybuji.com:3333',
                  worker_name: '',
                  password: 'x'
                }
              })
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="equipment">
        <TabsList className="mb-6">
          <TabsTrigger value="equipment">My Equipment</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., My Antminer S19"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Equipment Type</Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="asic">ASIC Miner</option>
                      <option value="gpu">GPU Rig</option>
                      <option value="cpu">CPU Miner</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., Antminer S19 Pro"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hashrate">Hashrate (TH/s for ASIC, MH/s for GPU)</Label>
                    <Input
                      id="hashrate"
                      name="hashrate"
                      type="number"
                      step="0.01"
                      value={formData.hashrate}
                      onChange={handleChange}
                      placeholder="e.g., 110"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="power">Power Consumption (W)</Label>
                    <Input
                      id="power"
                      name="power"
                      type="number"
                      value={formData.power}
                      onChange={handleChange}
                      placeholder="e.g., 3250"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="wallet_address">Bitcoin Wallet Address</Label>
                    <Input
                      id="wallet_address"
                      name="wallet_address"
                      value={formData.wallet_address}
                      onChange={handleChange}
                      placeholder="bc1q..."
                      required
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Pool Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pool_stratum_url">Stratum URL</Label>
                      <Input
                        id="pool_stratum_url"
                        name="pool_stratum_url"
                        value={formData.pool_config.stratum_url}
                        onChange={handleChange}
                        placeholder="stratum+tcp://pool.mybuji.com:3333"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pool_worker_name">Worker Name</Label>
                      <Input
                        id="pool_worker_name"
                        name="pool_worker_name"
                        value={formData.pool_config.worker_name}
                        onChange={handleChange}
                        placeholder="worker1"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingEquipment(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Equipment List */}
          {equipment.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Equipment Added</h3>
              <p className="text-gray-500 mb-4">
                Add your mining equipment to start mining directly to your wallet.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Equipment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getEquipmentIcon(item.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.model}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status || 'offline'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {item.hashrate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Hashrate:</span>
                          <span className="font-medium">
                            {item.hashrate} {item.type === 'asic' ? 'TH/s' : 'MH/s'}
                          </span>
                        </div>
                      )}
                      {item.power && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Power:</span>
                          <span className="font-medium">{item.power}W</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium capitalize">{item.type}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <p className="text-xs text-gray-600 mb-1">Pool Connection:</p>
                      <p className="text-xs font-mono break-all">
                        {item.pool_config?.stratum_url || 'Not configured'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="setup">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Setup Guide</h2>
            
            <div className="space-y-8">
              {/* ASIC Setup */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  ASIC Miner Setup
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Access your ASIC's web interface (usually via IP address)</li>
                    <li>Navigate to the Pool Configuration section</li>
                    <li>Set Pool 1 URL: <code className="bg-white px-2 py-1 rounded">stratum+tcp://pool.mybuji.com:3333</code></li>
                    <li>Set Worker: <code className="bg-white px-2 py-1 rounded">your_wallet_address.worker_name</code></li>
                    <li>Set Password: <code className="bg-white px-2 py-1 rounded">x</code></li>
                    <li>Save settings and restart your miner</li>
                  </ol>
                </div>
              </div>

              {/* GPU Setup */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-green-600" />
                  GPU Rig Setup
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">For GPU mining, use mining software like CGMiner or BFGMiner:</p>
                  <div className="bg-white p-3 rounded font-mono text-xs">
                    cgminer --scrypt -o stratum+tcp://pool.mybuji.com:3333 -u your_wallet_address.worker1 -p x
                  </div>
                </div>
              </div>

              {/* CPU Setup */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-purple-600" />
                  CPU Miner Setup
                </h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">For CPU mining, use cpuminer:</p>
                  <div className="bg-white p-3 rounded font-mono text-xs">
                    cpuminer -a sha256d -o stratum+tcp://pool.mybuji.com:3333 -u your_wallet_address.worker1 -p x
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Important Notes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Ensure your equipment is properly cooled and ventilated</li>
                    <li>• Monitor power consumption and electricity costs</li>
                    <li>• Use a reliable internet connection for stable mining</li>
                    <li>• Keep your wallet address secure and backed up</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Equipment Monitoring</h2>
            
            {equipment.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No equipment to monitor. Add equipment first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Total Equipment</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{equipment.length}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Online</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {equipment.filter(e => e.status === 'online' || e.status === 'mining').length}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Total Hashrate</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {equipment.reduce((sum, e) => sum + (e.hashrate || 0), 0).toFixed(1)} TH/s
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Power className="w-5 h-5 text-red-600" />
                      <span className="font-medium">Total Power</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {equipment.reduce((sum, e) => sum + (e.power || 0), 0)} W
                    </p>
                  </div>
                </div>

                {/* Equipment Status List */}
                <div className="space-y-4">
                  <h3 className="font-medium">Equipment Status</h3>
                  {equipment.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded">
                          {getEquipmentIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.model}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {item.hashrate ? `${item.hashrate} ${item.type === 'asic' ? 'TH/s' : 'MH/s'}` : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.power ? `${item.power}W` : 'Power N/A'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status || 'offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MyEquipmentPage