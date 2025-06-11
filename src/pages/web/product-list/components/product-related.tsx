import { useEffect, useState } from "react";
import { getData } from "../../../../lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { postData } from "../../../../lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: {
    name: string;
    priceIncrease: number;
  }[];
  image?: string;
  categoryId?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductApiResponse {
  _id: string;
  ten: string;
  moTa: string;
  giaCoBan: number;
  luaChonSize: {
    tenSize: string;
    giaTang: number;
    _id: string;
  }[];
  hinhAnh: string[];
  maDanhMuc?: string;
  danhGia?: {
    diemTrungBinh: number;
    soLuongDanhGia: number;
  };
  hoatDong: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ProductApiResponse[];
}

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
  maxItems?: number;
  title?: string;
  showAddToCart?: boolean;
  className?: string;
}

// Product Card Component for Related Products
const RelatedProductCard = ({ 
  product, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite,
  showAddToCart = true 
}: {
  product: Product;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  onToggleFavorite: (productId: string, e: React.MouseEvent) => void;
  isFavorite: boolean;
  showAddToCart?: boolean;
}) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Không có ảnh</span>
            </div>
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          onClick={(e) => onToggleFavorite(product.id, e)}
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </button>

        {/* Quick Add to Cart Button */}
        {showAddToCart && (
          <button
            className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/90 transform translate-y-2 group-hover:translate-y-0"
            onClick={(e) => onAddToCart(product.id, e)}
          >
            <ShoppingCart size={14} />
          </button>
        )}
      </div>

      {/* Product Info */}
      <CardHeader className="pb-2 px-3 pt-3">
        <h3 className="font-medium text-sm sm:text-base leading-tight line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.rating && product.reviewCount && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-3 pb-2">
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-primary font-semibold text-sm sm:text-base">
            {formatPrice(product.price)}
          </span>
          {product.sizes.length > 0 && product.sizes[0].priceIncrease > 0 && (
            <span className="text-xs text-gray-500">
              từ
            </span>
          )}
        </div>
        
        {/* Size info */}
        {product.sizes.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {product.sizes.length} kích cỡ
          </div>
        )}
      </CardContent>

      {/* Add to Cart Button */}
      {showAddToCart && (
        <CardFooter className="px-3 pb-3 pt-0">
          <Button 
            className="w-full text-xs sm:text-sm py-2 h-8 bg-primary hover:bg-primary/90"
            onClick={(e) => onAddToCart(product.id, e)}
          >
            <ShoppingCart size={14} className="mr-1" />
            Thêm vào giỏ
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Skeleton Component
const RelatedProductSkeleton = () => (
  <Card className="overflow-hidden border-0">
    <div className="aspect-square bg-gray-200 animate-pulse"></div>
    <CardHeader className="pb-2 px-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </CardHeader>
    <CardContent className="px-3 pb-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </CardContent>
    <CardFooter className="px-3 pb-3">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-full"></div>
    </CardFooter>
  </Card>
);

// Usage example in ProductDetail.tsx:
// import RelatedProducts from "./components/RelatedProducts";
// 
// // In the ProductDetail component, replace the related products section with:
// <RelatedProducts 
//   currentProductId={product.id}
//   categoryId={product.categoryId} // Add categoryId to your Product interface
//   maxItems={8}
//   title="Sản phẩm liên quan"
//   showAddToCart={true}
// />

export default function RelatedProducts({
  currentProductId,
  categoryId,
  maxItems = 8,
  title = "Sản phẩm liên quan",
  showAddToCart = true,
  className = ""
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build API URL with filters
        const url = new URL('/api/products', window.location.origin);
        
        // Add category filter if provided
        if (categoryId) {
          url.searchParams.append('categoryId', categoryId);
        }
        
        // Add limit
        url.searchParams.append('limit', maxItems.toString());
        
        // Exclude current product
        url.searchParams.append('exclude', currentProductId);

        const response: ApiResponse = await getData(url.pathname + url.search);
        
        if (!response.success) {
          throw new Error("Không thể tải sản phẩm liên quan");
        }
        
        const formattedProducts: Product[] = response.data
          .filter(item => item._id !== currentProductId && item.hoatDong) // Filter out current product and inactive products
          .slice(0, maxItems) // Limit results
          .map((item: ProductApiResponse) => ({
            id: item._id,
            name: item.ten,
            price: item.giaCoBan,
            description: item.moTa.replace(/<[^>]*>/g, ''), 
            sizes: item.luaChonSize.map(size => ({
              name: size.tenSize,
              priceIncrease: size.giaTang
            })),
            image: item.hinhAnh && item.hinhAnh.length > 0 ? item.hinhAnh[0] : undefined,
            categoryId: item.maDanhMuc,
            rating: item.danhGia?.diemTrungBinh,
            reviewCount: item.danhGia?.soLuongDanhGia
          }));
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm liên quan:", error);
        setError("Không thể tải sản phẩm liên quan");
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      fetchRelatedProducts();
    }
  }, [currentProductId, categoryId, maxItems]);

  // Toggle favorite
  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  // Quick add to cart with default options
  const handleQuickAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Find the product to get its default size
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const defaultSize = product.sizes.length > 0 ? product.sizes[0].name : "M";
      
      const cartItem = {
        maSanPham: productId,
        kichThuoc: defaultSize,
        soLuong: 1,
        tuychon: [],
        toppings: [],
        ghiChu: ""
      };
      
      const response = await postData("/api/carts/items", cartItem);
      
      if (response.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cart-updated'));
      } else {
        toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  // Don't render anything if there's an error or no products
  if (error || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <div className={`mt-8 lg:mt-12 ${className}`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900">{title}</h2>
        {products.length > 0 && (
          <span className="text-sm text-gray-500">
            {products.length} sản phẩm
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <RelatedProductSkeleton key={index} />
          ))
        ) : (
          // Products
          products.map((product) => (
            <RelatedProductCard
              key={product.id}
              product={product}
              onAddToCart={handleQuickAddToCart}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.has(product.id)}
              showAddToCart={showAddToCart}
            />
          ))
        )}
      </div>
      
      {/* View More Button */}
      {products.length >= maxItems && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            className="px-6 py-2"
            onClick={() => {
              // Navigate to category page or all products page
              if (categoryId) {
                window.location.href = `/categories/${categoryId}`;
              } else {
                window.location.href = '/products';
              }
            }}
          >
            Xem thêm sản phẩm
          </Button>
        </div>
      )}
    </div>
  );
}
