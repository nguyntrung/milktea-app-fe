import { useEffect, useState } from "react";
import { getData } from "../../../../lib/api";
import { Link } from "react-router";

interface Category {
  id: string;
  name: string;
  hinhAnh?: string;
}

interface CategoryApiResponse {
  _id: string;
  ten: string;
  hinhAnh?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
}

const ALL_PRODUCTS_IMAGE = "https://png.pngtree.com/png-vector/20240907/ourmid/pngtree-frappe-coffee-with-beans-on-white-background-png-image_13775917.png";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<CategoryApiResponse> = await getData("/api/categories");
        console.log("API response data:", response);
        const data = response.data;
        
        if (!Array.isArray(data)) {
          throw new Error("API response data is not an array");
        }

        const formattedData: Category[] = data.map((item: CategoryApiResponse) => {
          if (!item._id || !item.ten) {
            throw new Error("Invalid category data: missing _id or ten");
          }
          return {
            id: item._id,
            name: item.ten,
            hinhAnh: item.hinhAnh,
          };
        });
        
        setCategories(formattedData);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to fetch categories:", error.message);
        } else {
          console.error("Failed to fetch categories:", error);
        }
        console.error("Error details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Loading skeleton component for desktop
  const CategorySkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg mx-auto mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
    </div>
  );

  // Loading skeleton component for mobile
  const MobileCategorySkeleton = () => (
    <div className="flex-shrink-0 text-center animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
    </div>
  );

  const CategoryCard = ({ category }: { category: Category }) => (
    <Link
      to={`/products?category=${category.id}`}
      className="flex-shrink-0 text-center group sm:bg-white/80 sm:backdrop-blur-sm sm:p-4 sm:rounded-xl sm:border sm:border-gray-100 sm:shadow-sm sm:hover:shadow-xl sm:hover:border-blue-200 sm:transition-all sm:duration-300 sm:hover:-translate-y-1"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 group-hover:scale-105 sm:mx-auto">
        <img
          className="w-10 h-10 sm:w-16 sm:h-16 object-contain transition-transform duration-300 group-hover:scale-110"
          src={category.hinhAnh}
          alt={category.name}
          loading="lazy"
        />
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300 text-center w-16 sm:w-auto line-clamp-2 leading-tight">
        {category.name}
      </p>
    </Link>
  );

  const AllProductsCard = () => (
    <Link
      to="/products"
      className="flex-shrink-0 text-center group sm:bg-gradient-to-br sm:from-blue-50 sm:to-indigo-50 sm:border-2 sm:border-blue-200 sm:p-4 sm:rounded-xl sm:shadow-sm sm:hover:shadow-xl sm:hover:border-blue-300 sm:transition-all sm:duration-300 sm:hover:-translate-y-1"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 group-hover:scale-105 sm:mx-auto">
        <img
          className="w-10 h-10 sm:w-16 sm:h-16 object-contain transition-transform duration-300 group-hover:scale-110"
          src={ALL_PRODUCTS_IMAGE}
          alt="Tất cả sản phẩm"
          loading="lazy"
        />
      </div>
      <p className="text-xs sm:text-sm font-bold text-blue-600 transition-colors duration-300 text-center w-16 sm:w-auto line-clamp-2 leading-tight">
        Tất cả sản phẩm
      </p>
    </Link>
  );

  const LoadingState = () => (
    <>
      {/* Mobile Loading */}
      <div className="sm:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, index) => (
            <MobileCategorySkeleton key={index} />
          ))}
        </div>
      </div>
      
      {/* Desktop Loading */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <CategorySkeleton key={index} />
        ))}
      </div>
    </>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm sm:text-base">Đang tải danh mục...</p>
    </div>
  );

  const CategoryList = () => (
    <>
      {/* Mobile Layout - Horizontal Scroll */}
      <div className="sm:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          <AllProductsCard />
        </div>
      </div>

      {/* Desktop Layout - Grid */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
        <AllProductsCard />
      </div>
    </>
  );

  return (
    <section className="py-2">
      <div className="text-center lg:text-left">
        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl lg:text-lg">
          Danh mục sản phẩm
        </h2>
      </div>

      {loading ? (
        <LoadingState />
      ) : categories.length > 0 ? (
        <CategoryList />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
