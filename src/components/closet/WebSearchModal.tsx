import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Globe, Loader2, Download, AlertCircle } from 'lucide-react';
import { CachedImage } from '@/components/ui/CachedImage';

interface WebSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

// 1. Get a free API Key at https://serper.dev (2500 free searches)
// 2. Replace 'YOUR_API_KEY' below
const SERPER_API_KEY = ''; // Leave empty to use fallback demo mode

export default function WebSearchModal({ isOpen, onClose, onSelectImage }: WebSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Fallback static images for demo (Real fashion items, not AI)
  const fallbackImages = [
    "https://images.unsplash.com/photo-1551488852-7a304bece453?auto=format&fit=crop&w=400&q=80", // Jacket
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80", // Jacket
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80", // Shirt
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80", // Shirt
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=400&q=80", // Shirt
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", // Shoes
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=400&q=80", // Shoes
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80", // Shoes
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80", // T-Shirt
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setResults([]);

    // 1. Try Serper API (Google Images)
    if (SERPER_API_KEY) {
      try {
        const response = await fetch('https://google.serper.dev/images', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery + ' clothing white background', // Add keywords for better results
            num: 12,
            gl: 'us',
            hl: 'en',
          }),
        });

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        if (data.images && data.images.length > 0) {
          setResults(data.images.map((img: any) => img.imageUrl));
          setIsSearching(false);
          return;
        }
      } catch (err) {
        console.error('Search API error:', err);
        // Fallback to demo if API fails
      }
    }

    // 2. Fallback Demo Mode (Static Real Images)
    // Use this if no API key is configured or if API fails
    console.log('Using fallback demo search results');
    setTimeout(() => {
      // Filter fallback images slightly to simulate randomness
      const shuffled = [...fallbackImages]
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
      setResults(shuffled);
      setIsSearching(false);
      
      if (!SERPER_API_KEY) {
        // Optional: Notify user about demo mode in console or toast
        console.info('NOTE: Using demo images. Add SERPER_API_KEY in WebSearchModal.tsx for real Google results.');
      }
    }, 1000);
  };

  const handleImageSelect = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Search Online</h3>
                  <p className="text-xs text-gray-500">Find real outfits from the web</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <form onSubmit={handleSearch} className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items (e.g. 'white air force 1', 'baggy jeans')"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-8 bg-black text-white font-semibold rounded-2xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
              {!SERPER_API_KEY && (
                <div className="flex items-center gap-2 mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>Demo Mode: Add a free API Key in WebSearchModal.tsx to enable real Google Search.</span>
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p>Searching web for '{searchQuery}'...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((url, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm border border-gray-100 hover:shadow-md transition-all"
                      onClick={() => handleImageSelect(url)}
                    >
                      <CachedImage
                        src={url}
                        blurHash={null}
                        width={320}
                        alt={`Result ${index + 1}`}
                        fit="contain"
                        className="w-full h-full p-2 bg-white transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg">
                          <Download size={14} />
                          Import
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-1">Search for anything</p>
                  <p className="text-sm max-w-sm mx-auto">
                    Try specific items like "nike tech fleece" or "vintage denim"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
