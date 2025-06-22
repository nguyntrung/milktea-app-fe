import { useEffect, useState } from "react";
import { getData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router";

interface TopSellerProduct {
  _id: string;
  ten: string;
  giaCoBan: number;
  moTa: string;
  hinhAnh: string[];
  soLuongDaBan: number;
  top?: number;
}

export default function TopSeller({ limit = 4 }: { limit?: number }) {
  const [products, setProducts] = useState<TopSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        setLoading(true);
        const response = await getData(`/api/orders/top-seller`);
        
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Không thể tải sản phẩm bán chạy");
        }

        setProducts(response.data.slice(0, limit));
        setError(null);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm bán chạy:", error);
        setError("Không thể tải sản phẩm bán chạy");
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellers();
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg 
          className="w-12 h-12 mx-auto text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p className="mt-2">Chưa có sản phẩm bán chạy</p>
      </div>
    );
  }

  console.log(products);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Link 
          key={product._id}
          to={`/products/${product._id}`}
          className="group bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 block"
        >
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
              {product.hinhAnh?.[0] ? (
                <img
                  src={product.hinhAnh[0]}
                  alt={product.ten}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {product.top && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                  Top {product.top}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-1">{product.ten}</h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-900 font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.giaCoBan)}
                </p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Đã bán: {product.soLuongDaBan}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{product.moTa}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
