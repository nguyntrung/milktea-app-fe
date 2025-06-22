import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getData } from "../../../lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "./components/product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  createdAt?: Date;
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
  createdAt?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    products: ProductApiResponse[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

enum SortOption {
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  NEWEST = "newest"
}

interface ProductListProps {
  apiEndpoint?: string;
  queryParams?: Record<string, string | number>;
  useUrlParams?: boolean;
  urlParamMapping?: Record<string, string>;
  title?: string | ((params: Record<string, string>) => string);
  description?: string | ((params: Record<string, string>) => string);
  filterFunction?: (products: Product[]) => Product[];
  gridCols?: {
    mobile: number;
    tablet: number;
    desktop: number;
    xl: number;
  };
  showHeader?: boolean;
  showSort?: boolean;
  defaultSort?: SortOption;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
}

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
  apiEndpoint = "/api/products/paginated",
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
  showSort = true,
  defaultSort = SortOption.NEWEST,
  emptyState = {
    title: "Chưa có sản phẩm nào",
    description: "Hãy quay lại sau để xem những sản phẩm mới nhất"
  }
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>(defaultSort);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const sortProducts = (products: Product[], sortBy: SortOption): Product[] => {
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case SortOption.NAME_ASC:
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      case SortOption.NAME_DESC:
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
      case SortOption.PRICE_ASC:
        return sortedProducts.sort((a, b) => a.price - b.price);
      case SortOption.PRICE_DESC:
        return sortedProducts.sort((a, b) => b.price - a.price);
      case SortOption.NEWEST:
        return sortedProducts.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
      default:
        return sortedProducts;
    }
  };

  useEffect(() => {
    if (originalProducts.length > 0) {
      const sorted = sortProducts(originalProducts, sortOption);
      setProducts(sorted);
    }
  }, [sortOption, originalProducts]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        let finalQueryParams = { ...queryParams, page, limit: 10 };
        
        if (useUrlParams) {
          const urlParams: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            const mappedKey = urlParamMapping[key] || key;
            urlParams[mappedKey] = value;
          });
          finalQueryParams = { ...finalQueryParams, ...urlParams };
        }
        
        const url = new URL(apiEndpoint, window.location.origin);
        Object.entries(finalQueryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value.toString() !== '') {
            url.searchParams.append(key, value.toString());
          }
        });
        
        const response: ApiResponse = await getData(url.pathname + url.search);
        
        if (!response.success) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }
        
        let formattedProducts: Product[] = response.data.products.map((item: ProductApiResponse) => ({
          id: item._id,
          name: item.ten,
          price: item.giaCoBan,
          description: item.moTa.replace(/<[^>]*>/g, ''),
          sizes: item.luaChonSize.map(size => ({
            name: size.tenSize,
            priceIncrease: size.giaTang
          })),
          image: item.hinhAnh && item.hinhAnh.length > 0 ? item.hinhAnh[0] : undefined,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined
        }));
        
        if (filterFunction) {
          formattedProducts = filterFunction(formattedProducts);
        }
        
        setOriginalProducts(formattedProducts);
        const sortedProducts = sortProducts(formattedProducts, sortOption);
        setProducts(sortedProducts);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
        setPage(response.data.currentPage);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiEndpoint, JSON.stringify(queryParams), searchParams, useUrlParams, JSON.stringify(urlParamMapping), filterFunction, page]);

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

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Added to cart:", productId);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage.toString() });
  };

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

  const gridClasses = `grid grid-cols-${gridCols.mobile} sm:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop} xl:grid-cols-${gridCols.xl} gap-3 sm:gap-4 lg:gap-4`;

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case SortOption.NAME_ASC:
        return "Tên A → Z";
      case SortOption.NAME_DESC:
        return "Tên Z → A";
      case SortOption.PRICE_ASC:
        return "Giá tăng dần";
      case SortOption.PRICE_DESC:
        return "Giá giảm dần";
      case SortOption.NEWEST:
        return "Hàng mới";
      default:
        return "Sắp xếp";
    }
  };

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

      {showSort && products.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            Hiển thị {products.length} / {totalCount} sản phẩm
          </div>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp theo">
                {getSortLabel(sortOption)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SortOption.NEWEST}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hàng mới
                </div>
              </SelectItem>
              <SelectItem value={SortOption.NAME_ASC}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Tên A → Z
                </div>
              </SelectItem>
              <SelectItem value={SortOption.NAME_DESC}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                  Tên Z → A
                </div>
              </SelectItem>
              <SelectItem value={SortOption.PRICE_ASC}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Giá tăng dần
                </div>
              </SelectItem>
              <SelectItem value={SortOption.PRICE_DESC}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                  Giá giảm dần
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
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

      {products.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t mt-6">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * 10 + 1} - {Math.min(page * 10, totalCount)} / {totalCount} sản phẩm
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
