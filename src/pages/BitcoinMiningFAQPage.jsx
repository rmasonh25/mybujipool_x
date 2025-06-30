import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { 
  ArrowLeft, 
  BookOpen, 
  Cpu, 
  Zap, 
  DollarSign, 
  Calculator, 
  Target,
  HardDrive,
  Lightbulb,
  Clock,
  BarChart3,
  Globe,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'

const BitcoinMiningFAQPage = () => {
  const [faqContent, setFaqContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    fetchFAQContent()
  }, [])

  const fetchFAQContent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('category', 'education')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(1)

      if (error) throw error
      
      if (data && data.length > 0) {
        setFaqContent(data[0])
        
        // Parse content to extract sections for the table of contents
        const sections = parseSections(data[0].content)
        if (sections.length > 0) {
          setActiveSection(sections[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching FAQ content:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseSections = (content) => {
    const sections = []
    const lines = content.split('\n')
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        const title = line.replace('## ', '')
        const id = title.toLowerCase().replace(/[^\w]+/g, '-')
        sections.push({ id, title, level: 2 })
      } else if (line.startsWith('### ')) {
        const title = line.replace('### ', '')
        const id = title.toLowerCase().replace(/[^\w]+/g, '-')
        sections.push({ id, title, level: 3 })
      }
    })
    
    return sections
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const renderContent = (content) => {
    if (!content) return null
    
    const sections = []
    let currentSection = { title: '', content: [], id: '' }
    let inSection = false
    
    content.split('\n').forEach(line => {
      if (line.startsWith('# ')) {
        // Main title, skip
      } else if (line.startsWith('## ')) {
        // New section
        if (inSection) {
          sections.push({ ...currentSection })
        }
        
        const title = line.replace('## ', '')
        const id = title.toLowerCase().replace(/[^\w]+/g, '-')
        currentSection = { title, content: [], id, level: 2 }
        inSection = true
      } else if (line.startsWith('### ')) {
        // Subsection
        const title = line.replace('### ', '')
        const id = title.toLowerCase().replace(/[^\w]+/g, '-')
        currentSection.content.push({ type: 'subsection', title, id })
      } else if (line.trim() === '') {
        // Empty line
        if (inSection) {
          currentSection.content.push({ type: 'break' })
        }
      } else {
        // Regular paragraph
        if (inSection) {
          currentSection.content.push({ type: 'paragraph', text: line })
        }
      }
    })
    
    // Add the last section
    if (inSection) {
      sections.push({ ...currentSection })
    }
    
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div 
            key={section.id} 
            id={section.id} 
            className="scroll-mt-20 border-b pb-6"
          >
            <div 
              className="flex justify-between items-center cursor-pointer mb-4"
              onClick={() => toggleSection(section.id)}
            >
              <h2 className="text-2xl font-bold">{section.title}</h2>
              {expandedSections[section.id] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            {(expandedSections[section.id] || expandedSections[section.id] === undefined) && (
              <div className="space-y-4">
                {section.content.map((item, index) => {
                  if (item.type === 'subsection') {
                    return (
                      <h3 
                        key={item.id || index} 
                        id={item.id} 
                        className="text-xl font-semibold mt-6 mb-3 scroll-mt-20"
                      >
                        {item.title}
                      </h3>
                    )
                  } else if (item.type === 'paragraph') {
                    return (
                      <p key={index} className="text-gray-700 leading-relaxed">
                        {item.text}
                      </p>
                    )
                  } else if (item.type === 'break') {
                    return <div key={index} className="h-2" />
                  }
                  return null
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderTableOfContents = (content) => {
    if (!content) return null
    
    const sections = parseSections(content)
    
    return (
      <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
        <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
        <ul className="space-y-2">
          {sections.map(section => (
            <li 
              key={section.id} 
              className={`${
                section.level === 3 ? 'ml-4' : ''
              } ${
                activeSection === section.id ? 'text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              <a 
                href={`#${section.id}`}
                className="hover:text-blue-600 transition-colors"
                onClick={() => {
                  setActiveSection(section.id)
                  setExpandedSections(prev => ({
                    ...prev,
                    [section.id]: true
                  }))
                }}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Related Resources</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a 
                href="https://bitcoin.org/en/how-it-works" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Bitcoin.org Resources
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.blockchain.com/explorer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Blockchain Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <Link 
                to="/membership"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                MyBujiPool Pricing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
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
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link to="/news">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Bitcoin Mining FAQ</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl">
          Everything you need to know about Bitcoin mining - from basic concepts to advanced strategies.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Current Block Reward</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">3.125 BTC</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="font-medium">Block Time</span>
          </div>
          <p className="text-2xl font-bold text-green-600">~10 minutes</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Network Hashrate</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">~500 EH/s</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Next Halving</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">2028</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {renderTableOfContents(faqContent?.content)}
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white p-8 rounded-lg shadow-md">
            {faqContent ? (
              <>
                <h1 className="text-3xl font-bold mb-6">{faqContent.title}</h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {faqContent.summary}
                </p>
                
                {renderContent(faqContent.content)}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No FAQ Content Available</h3>
                <p className="text-gray-500">
                  We're currently updating our Bitcoin mining FAQ. Please check back soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Mining?</h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Join MyBujiPool v2 with our competitive pricing and start mining with the potential for full block rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/membership">
                View Pricing Plans
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/demo-mining">
                Try Demo Mining
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">Mining Risk Disclaimer</h3>
            <p className="text-sm text-yellow-700">
              Bitcoin mining involves financial risk and significant electricity costs. Mining profitability depends on many factors including Bitcoin price, network difficulty, electricity costs, and hardware efficiency. Past performance is not indicative of future results. This information is provided for educational purposes only and should not be considered financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BitcoinMiningFAQPage