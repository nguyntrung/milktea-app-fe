import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { getData } from '@/lib/api';

interface Product {
  _id: string;
  ten: string;
  moTa?: string;
  giaCoBan: number;
  hinhAnh?: string[];
  hoatDong: boolean;
  maDanhMuc: string;
}

interface SearchComponentProps {
  className?: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load dữ liệu sản phẩm khi component mount
  useEffect(() => {
    fetchProducts();
    loadRecentSearches();
  }, []);

  // Lắng nghe click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter sản phẩm khi searchQuery thay đổi
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => 
      product.hoatDong && (
        product.ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.moTa?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).slice(0, 8); // Giới hạn 8 kết quả

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getData('/api/products');
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(item => item !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    saveRecentSearch(searchTerm);
    setShowSuggestions(false);
    
    // Navigate to search results page
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleProductClick = (product: Product) => {
    saveRecentSearch(product.ten);
    setShowSuggestions(false);
    navigate(`/products/${product._id}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredProducts([]);
    inputRef.current?.focus();
  };

  const removeRecentSearch = (index: number) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyPress}
          placeholder="Tìm kiếm trà, cà phê, topping..."
          className="h-12 pl-12 pr-10 rounded-full focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="p-3 border-b">
              <div className="text-sm text-muted-foreground mb-2">Tìm kiếm gần đây</div>
              {recentSearches.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded cursor-pointer group"
                >
                  <div
                    onClick={() => handleSuggestionClick(item)}
                    className="flex items-center flex-1"
                  >
                    <Search className="w-4 h-4 text-muted-foreground mr-3" />
                    <span className="text-sm">{item}</span>
                  </div>
                  <button
                    onClick={() => removeRecentSearch(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-4 text-center text-muted-foreground">
              Đang tìm kiếm...
            </div>
          )}

          {/* Search Results */}
          {searchQuery && filteredProducts.length > 0 && (
            <div className="p-2">
              <div className="text-sm text-muted-foreground mb-2 px-2">
                Sản phẩm ({filteredProducts.length})
              </div>
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 flex-shrink-0">
                    {product.hinhAnh && product.hinhAnh[0] ? (
                      <img
                        src={product.hinhAnh[0]}
                        alt={product.ten}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.ten}</div>
                    <div className="text-primary font-semibold text-sm">
                      {formatPrice(product.giaCoBan)}
                    </div>
                    {product.moTa && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {product.moTa}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* See All Results */}
              <div
                onClick={() => handleSearch()}
                className="mt-2 p-3 text-center text-primary hover:bg-gray-50 rounded-lg cursor-pointer border-t"
              >
                <div className="text-sm font-medium">
                  Xem tất cả kết quả cho "{searchQuery}"
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && filteredProducts.length === 0 && !loading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="text-sm">Không tìm thấy sản phẩm nào</div>
              <div className="text-xs mt-1">Thử tìm kiếm với từ khóa khác</div>
            </div>
          )}

          {/* Quick Suggestions */}
          {!searchQuery && recentSearches.length === 0 && (
            <div className="p-3">
              <div className="text-sm text-muted-foreground mb-2">Gợi ý tìm kiếm</div>
              {['Trà sữa', 'Cà phê', 'Trà trái cây', 'Topping', 'Bánh ngọt'].map((suggestion) => (
                <div
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <Search className="w-4 h-4 text-muted-foreground mr-3" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
