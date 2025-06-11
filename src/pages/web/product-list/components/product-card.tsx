import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ProductCardProps {
  product: Product;
  favorites: Set<string>;
  onToggleFavorite: (productId: string, e: React.MouseEvent) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
}

export default function ProductCard({ 
  product, 
  favorites, 
  onToggleFavorite, 
  onAddToCart 
}: ProductCardProps) {
  const isMobile = useIsMobile();

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
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
            onClick={(e) => onToggleFavorite(product.id, e)}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-md"
          >
            <Heart 
              size={16} 
              className={`transition-colors duration-200 ${
                favorites.has(product.id) 
                  ? 'fill-destructive text-destructive' 
                  : 'text-gray-400 hover:text-destructive'
              }`} 
            />
          </button>

          {/* Rating Badge */}
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            className="w-full bg-primary text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            size={isMobile ? "sm" : "default"}
          >
            {isMobile ? "Mua" : "Mua ngay"}
          </Button>
        </Link>
        <Button 
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={(e) => onAddToCart(product.id, e)}
          className="px-3 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
        >
          <ShoppingCart size={isMobile ? 14 : 16} className="text-muted-foreground hover:text-primary" />
        </Button>
      </CardFooter>
    </Card>
  );
}
