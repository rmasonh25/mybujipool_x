import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatHashrate, formatCurrency } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { 
  Cpu, 
  Zap, 
  DollarSign, 
  Activity, 
  Clock, 
  Target,
  TrendingUp,
  Wifi,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Play,
  Square,
  Rotate3D,
  Users
} from 'lucide-react'

const DemoMiningPage = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isMining, setIsMining] = useState(false)
  const [hashrate, setHashrate] = useState(0)
  const [shares, setShares] = useState(0)
  const [runtime, setRuntime] = useState(0)
  const [walletAddress, setWalletAddress] = useState('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh') // Demo wallet address
  const [selectedAsic, setSelectedAsic] = useState(null)
  
  // Rotation system simulation
  const [rotationStatus, setRotationStatus] = useState({
    isActive: false,
    position: 5,
    totalMiners: 87,
    estimatedTimeRemaining: 0,
    estimatedTimeUntilActive: 45
  })

  // Demo ASICs data
  const demoAsics = [
    {
      id: 1,
      model: 'Antminer S19 Pro',
      hashrate: 110000000000000, // 110 TH/s
      power: 3250,
      price: 28.50,
      status: 'available'
    },
    {
      id: 2,
      model: 'WhatsMiner M30S++',
      hashrate: 112000000000000, // 112 TH/s
      power: 3472,
      price: 29.75,
      status: 'available'
    },
    {
      id: 3,
      model: 'Antminer S21',
      hashrate: 200000000000000, // 200 TH/s
      power: 3550,
      price: 45.00,
      status: 'rented'
    }
  ]

  // Auto-select first available ASIC on component mount
  useEffect(() => {
    if (!selectedAsic) {
      const firstAvailable = demoAsics.find(asic => asic.status === 'available')
      if (firstAvailable) {
        setSelectedAsic(firstAvailable)
      }
    }
  }, [])

  // Simulate mining activity when mining is active
  useEffect(() => {
    let interval
    if (isMining && selectedAsic) {
      interval = setInterval(() => {
        setShares(prev => prev + Math.floor(Math.random() * 3) + 1)
        setRuntime(prev => prev + 1)
        setHashrate(selectedAsic.hashrate * (0.95 + Math.random() * 0.1)) // Simulate slight variance
        
        // Randomly change rotation status
        if (Math.random() < 0.1) { // 10% chance each interval
          const isActive = Math.random() < 0.2 // 20% chance of being active
          setRotationStatus(prev => ({
            ...prev,
            isActive,
            position: isActive ? 0 : Math.floor(Math.random() * 10) + 1,
            estimatedTimeRemaining: isActive ? Math.floor(Math.random() * 30) + 5 : 0,
            estimatedTimeUntilActive: isActive ? 0 : Math.floor(Math.random() * 60) + 15
          }))
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isMining, selectedAsic])

  const handleConnect = () => {
    if (!walletAddress || !selectedAsic) return
    setIsConnected(true)
    setShares(0)
    setRuntime(0)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setIsMining(false)
    setHashrate(0)
    setShares(0)
    setRuntime(0)
  }

  const handleStartMining = () => {
    if (!isConnected) {
      // Auto-connect if not connected but ASIC and wallet are selected
      if (walletAddress && selectedAsic) {
        setIsConnected(true)
        setShares(0)
        setRuntime(0)
      } else {
        return
      }
    }
    setIsMining(true)
  }

  const handleStopMining = () => {
    setIsMining(false)
    setHashrate(0)
  }

  const handleUseDemoWallet = () => {
    setWalletAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Solo Mining Demo</h1>
        <p className="text-gray-600">
          Experience what it's like to mine with our rotating block system. This is a demonstration of the mining interface.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <p className="text-blue-700 text-sm">
            <strong>Demo Mode:</strong> This simulation uses a demo wallet address and simulated mining data. 
            No real Bitcoin mining occurs and no actual rewards are earned.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - ASIC Selection & Connection */}
        <div className="lg:col-span-1 space-y-6">
          {/* ASIC Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Select ASIC</h2>
            <div className="space-y-3">
              {demoAsics.map((asic) => (
                <div 
                  key={asic.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAsic?.id === asic.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : asic.status === 'rented'
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => asic.status === 'available' && !isMining && setSelectedAsic(asic)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{asic.model}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      asic.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {asic.status === 'available' ? 'Available' : 'Rented'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Hashrate:</span>
                      <br />
                      {formatHashrate(asic.hashrate)}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <br />
                      {formatCurrency(asic.price)}/day
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Setup */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Mining Setup</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="walletAddress">Bitcoin Wallet Address</Label>
                <div className="space-y-2">
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="bc1q..."
                    disabled={isConnected}
                  />
                  {!isConnected && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUseDemoWallet}
                      className="w-full text-xs"
                    >
                      Use Demo Wallet Address
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Block rewards will be sent directly to this address when your wallet is active in rotation
                </p>
              </div>

              <div className="pt-4 space-y-2">
                {!isConnected ? (
                  <Button 
                    onClick={handleConnect}
                    disabled={!walletAddress || !selectedAsic}
                    className="w-full"
                    variant="outline"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Connect to Pool
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                )}

                {/* Start/Stop Mining Button */}
                {!isMining ? (
                  <Button 
                    onClick={handleStartMining}
                    disabled={!walletAddress || !selectedAsic}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Mining
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopMining}
                    variant="destructive"
                    className="w-full"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Mining
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Mining Dashboard */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="rotation">Rotation System</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="pool">Pool Info</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Connection</p>
                        <p className={`font-semibold ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                          {isConnected ? 'Connected' : 'Offline'}
                        </p>
                      </div>
                      {isConnected ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Mining Status</p>
                        <p className={`font-semibold ${isMining ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isMining ? 'Mining' : 'Idle'}
                        </p>
                      </div>
                      <Activity className={`w-8 h-8 ${isMining ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Hashrate</p>
                        <p className="font-semibold">
                          {isMining ? formatHashrate(hashrate) : '0 TH/s'}
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Shares</p>
                        <p className="font-semibold">{shares.toLocaleString()}</p>
                      </div>
                      <Target className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Rotation Status */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Rotate3D className="w-5 h-5 text-blue-600" />
                    Rotation Status
                  </h3>
                  
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Select an ASIC and connect to start mining</p>
                      <p className="text-sm text-gray-400 mt-2">
                        A demo wallet address is already provided for testing
                      </p>
                    </div>
                  ) : !isMining ? (
                    <div className="text-center py-8">
                      <Play className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-500">Connected to pool. Click "Start Mining" to begin.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-4 rounded-lg ${
                        rotationStatus.isActive ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 ${
                            rotationStatus.isActive ? 'bg-green-500' : 'bg-blue-500'
                          } rounded-full animate-pulse`}></div>
                          <span className="font-medium">
                            {rotationStatus.isActive 
                              ? 'Your wallet is ACTIVE in rotation!' 
                              : 'Mining in progress - waiting for rotation'
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          {rotationStatus.isActive ? (
                            <div>
                              <div className="text-sm font-medium text-green-700">
                                Time remaining: ~{rotationStatus.estimatedTimeRemaining} minutes
                              </div>
                              <div className="text-xs text-green-600">
                                If a block is found now, you get the reward!
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-600">
                                Position: {rotationStatus.position} of {rotationStatus.totalMiners}
                              </div>
                              <div className="text-xs text-gray-500">
                                Est. wait: ~{rotationStatus.estimatedTimeUntilActive} minutes
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Rotating Block System</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Our system rotates through all miners' wallet addresses. When your wallet is active and a block is found, you'll receive the full 3.125 BTC reward plus transaction fees.
                        </p>
                        <p className="text-xs text-blue-600">
                          Your rotation time is proportional to your hashrate contribution to the pool.
                        </p>
                      </div>

                      {selectedAsic && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">Current ASIC: {selectedAsic.model}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Target Hashrate:</span>
                              <div className="font-medium">{formatHashrate(selectedAsic.hashrate)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Daily Cost:</span>
                              <div className="font-medium">{formatCurrency(selectedAsic.price)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rotation">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Rotate3D className="w-5 h-5 text-blue-600" />
                  Rotation System Explained
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">How Our Rotation Works</h4>
                    <p className="text-sm text-blue-700">
                      Instead of splitting rewards among all miners, our system rotates through miners' wallet addresses based on their hashrate contribution. When a block is found, the current wallet in rotation receives the full reward.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Your Rotation Details</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Your Hashrate:</span>
                            <span className="font-medium">
                              {isMining ? formatHashrate(hashrate) : formatHashrate(selectedAsic?.hashrate || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pool Hashrate:</span>
                            <span className="font-medium">
                              {formatHashrate(Math.random() * 10000 + 5000)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Your Pool Share:</span>
                            <span className="font-medium">
                              {(Math.random() * 5 + 0.1).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Daily Rotation Time:</span>
                            <span className="font-medium">
                              ~{Math.floor(Math.random() * 60 + 10)} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Current Status</h4>
                      <div className={`bg-white border rounded-lg p-4 ${
                        rotationStatus.isActive ? 'border-green-300' : ''
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Wallet Status:</span>
                            <span className={`font-medium ${
                              rotationStatus.isActive ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {rotationStatus.isActive ? 'ACTIVE' : 'In Queue'}
                            </span>
                          </div>
                          
                          {rotationStatus.isActive ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Time Remaining:</span>
                                <span className="font-medium text-green-600">
                                  ~{rotationStatus.estimatedTimeRemaining} minutes
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Block Reward:</span>
                                <span className="font-medium">3.125+ BTC</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Position in Queue:</span>
                                <span className="font-medium">
                                  {rotationStatus.position} of {rotationStatus.totalMiners}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Estimated Wait:</span>
                                <span className="font-medium">
                                  ~{rotationStatus.estimatedTimeUntilActive} minutes
                                </span>
                              </div>
                            </>
                          )}
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Active Miners:</span>
                            <span className="font-medium">
                              {rotationStatus.totalMiners}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Benefits of Rotation System</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Chance to win full block rewards (3.125+ BTC)</li>
                      <li>• Fair distribution based on hashrate contribution</li>
                      <li>• No pool fees or reward splitting</li>
                      <li>• Transparent rotation tracking</li>
                      <li>• Same expected value as traditional pool mining</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Important Note</h4>
                        <p className="text-sm text-yellow-700">
                          This is a simulation for demonstration purposes. In the real system, rotation times are precisely calculated based on actual hashrate contributions, and blocks are found based on network difficulty and luck.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Mining Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Session Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Shares:</span>
                        <span className="font-medium">{shares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Hashrate:</span>
                        <span className="font-medium">
                          {isMining ? formatHashrate(hashrate) : '0 TH/s'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mining Time:</span>
                        <span className="font-medium">{formatTime(runtime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Efficiency:</span>
                        <span className="font-medium">
                          {runtime > 0 ? (shares / (runtime / 60)).toFixed(2) : '0'} shares/min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Potential Rewards</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Block Reward:</span>
                        <span className="font-medium">3.125 BTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg. Fees:</span>
                        <span className="font-medium">~0.15 BTC</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Total Potential:</span>
                        <span className="font-bold text-green-600">~3.275 BTC</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        ≈ ${(3.275 * 65000).toLocaleString()} USD at current prices
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAsic && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">ASIC Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-blue-600 font-medium">Power Efficiency</div>
                        <div className="text-lg font-bold">
                          {(selectedAsic.power / (selectedAsic.hashrate / 1000000000000)).toFixed(1)} W/TH
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-green-600 font-medium">Daily Cost</div>
                        <div className="text-lg font-bold">{formatCurrency(selectedAsic.price)}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-purple-600 font-medium">Power Draw</div>
                        <div className="text-lg font-bold">{selectedAsic.power}W</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pool">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Pool Information</h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Mybuji Rotating Solo Pool</h4>
                    <p className="text-sm text-blue-700">
                      This is a demonstration of our rotating solo mining pool. In the real version, you would connect to our actual mining infrastructure with your wallet address.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Connection Details</h5>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Stratum URL:</span>
                          <br />
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            stratum+tcp://pool.mybuji.com:3333
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-600">Worker Name:</span>
                          <br />
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {walletAddress ? `${walletAddress.substring(0, 10)}...` : 'your_wallet_address'}
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-600">Demo Wallet:</span>
                          <br />
                          <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                            bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Pool Features</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Rotating solo mining system
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          100% of block rewards to miners
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Free access - no monthly fees
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Real-time rotation tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          24/7 monitoring and support
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Current Pool Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Hashrate:</span>
                        <div className="font-medium">{formatHashrate(Math.random() * 10000 + 5000)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Miners:</span>
                        <div className="font-medium">{rotationStatus.totalMiners}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Blocks Found (24h):</span>
                        <div className="font-medium">{Math.floor(Math.random() * 3)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-800 mb-2">Demo Mode Notice</h5>
                    <p className="text-sm text-yellow-700">
                      This is a simulation for demonstration purposes. No actual mining is taking place, and no real Bitcoin will be earned. 
                      The statistics and activity shown are generated for educational purposes only.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default DemoMiningPage