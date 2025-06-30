import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Search, 
  Filter,
  Clock,
  ChevronRight,
  Star,
  Megaphone,
  Package,
  Settings
} from 'lucide-react'

const NewsPage = () => {
  const { id } = useParams()
  const [announcements, setAnnouncements] = useState([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    if (id) {
      fetchSingleAnnouncement(id)
    } else {
      fetchAnnouncements()
    }
  }, [id])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleAnnouncement = async (announcementId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .eq('is_published', true)
        .single()

      if (error) throw error
      setSelectedAnnouncement(data)
    } catch (error) {
      console.error('Error fetching announcement:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'announcement': return <Megaphone className="w-4 h-4" />
      case 'product': return <Package className="w-4 h-4" />
      case 'update': return <Settings className="w-4 h-4" />
      default: return <Megaphone className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'announcement': return 'bg-blue-100 text-blue-800'
      case 'product': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(announcements.map(a => a.category))]

  // Single announcement view
  if (id && selectedAnnouncement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-8">
            <Button variant="outline" asChild>
              <Link to="/news">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to News
              </Link>
            </Button>
          </div>

          {/* Article header */}
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {selectedAnnouncement.image_url && (
              <div className="h-64 bg-gray-200">
                <img 
                  src={selectedAnnouncement.image_url} 
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              {/* Meta info */}
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2 ${getCategoryColor(selectedAnnouncement.category)}`}>
                  {getCategoryIcon(selectedAnnouncement.category)}
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.is_featured && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Featured
                  </span>
                )}
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(selectedAnnouncement.published_at)}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {selectedAnnouncement.title}
              </h1>

              {/* Summary */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {selectedAnnouncement.summary}
              </p>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                {selectedAnnouncement.content.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
                        {paragraph.replace('## ', '')}
                      </h2>
                    )
                  } else if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
                        {paragraph.replace('### ', '')}
                      </h3>
                    )
                  } else if (paragraph.trim() === '') {
                    return <br key={index} />
                  } else {
                    return (
                      <p key={index} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    )
                  }
                })}
              </div>
            </div>
          </article>

          {/* Related articles */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">More News & Updates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements
                .filter(a => a.id !== selectedAnnouncement.id)
                .slice(0, 4)
                .map((announcement) => (
                  <Link 
                    key={announcement.id}
                    to={`/news/${announcement.id}`}
                    className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(announcement.category)}`}>
                        {announcement.category}
                      </span>
                      {announcement.is_featured && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {announcement.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(announcement.published_at)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // News listing view
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">News & Announcements</h1>
        <p className="text-gray-600">
          Stay up to date with the latest platform updates, features, and mining insights.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Articles
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search news and announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>
            Showing {filteredAnnouncements.length} of {announcements.length} articles
          </span>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search terms or filters'
              : 'No announcements available at this time'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Featured articles */}
          {filteredAnnouncements.some(a => a.is_featured) && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Featured</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredAnnouncements
                  .filter(a => a.is_featured)
                  .slice(0, 2)
                  .map((announcement) => (
                    <Link 
                      key={announcement.id}
                      to={`/news/${announcement.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {announcement.image_url && (
                        <div className="h-48 bg-gray-200">
                          <img 
                            src={announcement.image_url} 
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2 ${getCategoryColor(announcement.category)}`}>
                            {getCategoryIcon(announcement.category)}
                            {announcement.category}
                          </span>
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Featured
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3">
                          {announcement.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4">
                          {announcement.summary}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(announcement.published_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* All articles */}
          <div>
            <h2 className="text-2xl font-bold mb-6">All Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements
                .filter(a => !a.is_featured || filteredAnnouncements.filter(f => f.is_featured).length > 2)
                .map((announcement) => (
                  <Link 
                    key={announcement.id}
                    to={`/news/${announcement.id}`}
                    className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getCategoryColor(announcement.category)}`}>
                        {getCategoryIcon(announcement.category)}
                        {announcement.category}
                      </span>
                      {announcement.is_featured && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {announcement.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(announcement.published_at)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NewsPage