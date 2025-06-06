import { useEffect, useState } from "react";
import { getData } from "../../../lib/api";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Link } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

interface ProductApiResponse {
  _id: string;
  ten: string;
  moTa: string;
  giaCoBan: number;
  luaChonSize: {
    tenSize: string;
    giaTang: number;
    thanhPhan: { ten: string; soLuong: number }[];
    _id: string;
  }[];
  hinhAnh: string[];
  toppingCoTheThem: {
    ten: string;
    gia: number;
    _id: string;
  }[];
  tuychon: string[];
  hoatDong: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ProductApiResponse[];
}

// Product Card Skeleton
const ProductSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square bg-gray-200 animate-pulse"></div>
    <CardHeader className="pb-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </CardHeader>
    <CardContent className="pb-2">
      <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </CardContent>
    <CardFooter>
      <div className="h-9 bg-gray-200 rounded animate-pulse w-full"></div>
    </CardFooter>
  </Card>
);

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response: ApiResponse = await getData("/api/products");
        
        if (!response.success) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }
        
        const formattedProducts: Product[] = response.data.map((item: ProductApiResponse) => ({
          id: item._id,
          name: item.ten,
          price: item.giaCoBan,
          description: item.moTa.replace(/<[^>]*>/g, ''), 
          sizes: item.luaChonSize.map(size => ({
            name: size.tenSize,
            priceIncrease: size.giaTang
          })),
          image: item.hinhAnh && item.hinhAnh.length > 0 ? item.hinhAnh[0] : undefined
        }));
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

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

  // Add to cart handler
  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add your cart logic here
    console.log("Added to cart:", productId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-0 max-w-7xl py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.313 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="px-6 py-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-0 max-w-7xl py-6">
      {/* Header Section */}
      {/* <div className="mb-6 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-medium">
          Danh sách sản phẩm
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Khám phá những sản phẩm tuyệt vời của chúng tôi
        </p>
      </div> */}
      
      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
            >
              <Link to={`/products/${product.id}`} className="block">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
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
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-md"
                  >
                    <Heart 
                      size={16} 
                      className={`transition-colors duration-200 ${
                        favorites.has(product.id) 
                          ? 'fill-detext-destructive text-destructive' 
                          : 'text-gray-400 hover:text-destructive'
                      }`} 
                    />
                  </button>

                  {/* Rating Badge */}
                  <div className="absolute top-2 left-2 bg-yellow-500 text-muted px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Star size={12} className="fill-current" />
                    <span>4.5</span>
                  </div>
                </div>
                
                {/* Product Info */}
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </CardTitle>
                  {product.description && !isMobile && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}
                </CardHeader>
              </Link>
                
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-bold text-destructive">
                    {formatPrice(product.price)}
                  </span>
                  {product.sizes.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {product.sizes.length} size
                    </span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-3 sm:p-4 pb-0 flex gap-2">
                <Link to={`/products/${product.id}`} className="flex-1">
                  <Button 
                    className="w-full bg-primary text-muted font-semibold py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                    size={isMobile ? "sm" : "default"}
                  >
                    {isMobile ? "Mua" : "Mua ngay"}
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  onClick={(e) => handleAddToCart(product.id, e)}
                  className="px-3 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                >
                  <ShoppingCart size={isMobile ? 14 : 16} className="text-muted-foreground hover:text-primary" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-muted-foreground">Hãy quay lại sau để xem những sản phẩm mới nhất</p>
          </div>
        )}
      </div>
    </div>
  );
}
