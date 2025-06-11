import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getData } from "../../../lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductCard from "./components/product-card";

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

interface ProductListProps {
  // API endpoint để fetch dữ liệu
  apiEndpoint?: string;
  // Query parameters cho API (category, search, etc.) - sẽ merge với URL params
  queryParams?: Record<string, string | number>;
  // Có tự động đọc URL search params không
  useUrlParams?: boolean;
  // Mapping URL params sang API params (vd: category -> categoryId)
  urlParamMapping?: Record<string, string>;
  // Title và description cho page (có thể là function để dynamic)
  title?: string | ((params: Record<string, string>) => string);
  description?: string | ((params: Record<string, string>) => string);
  // Custom filter function để lọc products sau khi fetch
  filterFunction?: (products: Product[]) => Product[];
  // Props cho grid layout
  gridCols?: {
    mobile: number;
    tablet: number;
    desktop: number;
    xl: number;
  };
  // Show/hide header section
  showHeader?: boolean;
  // Empty state customization
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
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

export default function ProductList({
  apiEndpoint = "/api/products",
  queryParams = {},
  useUrlParams = true,
  urlParamMapping = {},
  title,
  description,
  filterFunction,
  gridCols = {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    xl: 4
  },
  showHeader = false,
  emptyState = {
    title: "Chưa có sản phẩm nào",
    description: "Hãy quay lại sau để xem những sản phẩm mới nhất"
  }
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build final query parameters
        let finalQueryParams = { ...queryParams };
        
        // Merge URL search params if enabled
        if (useUrlParams) {
          const urlParams: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            // Apply URL param mapping if provided
            const mappedKey = urlParamMapping[key] || key;
            urlParams[mappedKey] = value;
          });
          finalQueryParams = { ...finalQueryParams, ...urlParams };
        }
        
        // Build API URL with query parameters
        const url = new URL(apiEndpoint, window.location.origin);
        Object.entries(finalQueryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value.toString());
          }
        });
        
        const response: ApiResponse = await getData(url.pathname + url.search);
        
        if (!response.success) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }
        
        let formattedProducts: Product[] = response.data.map((item: ProductApiResponse) => ({
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
        
        // Apply custom filter if provided
        if (filterFunction) {
          formattedProducts = filterFunction(formattedProducts);
        }
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiEndpoint, JSON.stringify(queryParams), searchParams, useUrlParams, JSON.stringify(urlParamMapping), filterFunction]);

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

  // Generate dynamic title and description
  const getDisplayTitle = () => {
    if (!title) return undefined;
    if (typeof title === 'string') return title;
    
    const urlParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });
    return title(urlParams);
  };

  const getDisplayDescription = () => {
    if (!description) return undefined;
    if (typeof description === 'string') return description;
    
    const urlParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });
    return description(urlParams);
  };

  // Generate grid classes based on props
  const gridClasses = `grid grid-cols-${gridCols.mobile} sm:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop} xl:grid-cols-${gridCols.xl} gap-3 sm:gap-4 lg:gap-4`;

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-0 max-w-7xl py-6">
        <div className={gridClasses}>
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
      {showHeader && (getDisplayTitle() || getDisplayDescription()) && (
        <div className="mb-6 sm:mb-4">
          {getDisplayTitle() && (
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-medium">
              {getDisplayTitle()}
            </h1>
          )}
          {getDisplayDescription() && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {getDisplayDescription()}
            </p>
          )}
        </div>
      )}
      
      {/* Products Grid */}
      <div className={gridClasses}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onAddToCart={handleAddToCart}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              {emptyState.icon || (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyState.title}</h3>
            <p className="text-muted-foreground">{emptyState.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
