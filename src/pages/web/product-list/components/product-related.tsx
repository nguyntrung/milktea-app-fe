import { useEffect, useState } from "react";
import { getData } from "@/lib/api";
import ProductCard from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
}

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  limit?: number;
}

const RelatedProducts = ({ 
  categoryId, 
  currentProductId, 
  limit = 4 
}: RelatedProductsProps) => {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!categoryId) return;
      
      try {
        setLoading(true);
        const response = await getData(
          `/api/products/paginated?page=1&limit=${limit}&category=${categoryId}`
        );
        
        if (!response.success || !Array.isArray(response.data?.products)) {
          throw new Error("Không thể tải sản phẩm liên quan");
        }

        // Filter out the current product and map to the required format
        const relatedProducts = response.data.products
          .filter((product: { _id: string }) => product._id !== currentProductId)
          .map((product: { _id: string; ten: string; giaCoBan: number; moTa: string; hinhAnh?: string[] }) => ({
            id: product._id,
            name: product.ten,
            price: product.giaCoBan,
            description: product.moTa,
            image: product.hinhAnh?.[0]
          }));

        setProducts(relatedProducts);
        setError(null);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm liên quan:", error);
        setError("Không thể tải sản phẩm liên quan");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, currentProductId, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm sm:text-base">Chưa có sản phẩm liên quan</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            sizes: [] // Add empty sizes array to match Product type
          }}
          favorites={new Set()}
          onToggleFavorite={() => {}}
          onAddToCart={() => {}}
        />
      ))}
    </div>
  );
};

export default RelatedProducts;
