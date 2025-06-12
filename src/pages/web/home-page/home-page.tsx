import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { getData } from "../../../lib/api";
import { Link } from "react-router";
import Reviews from "./components/review";

interface Slide {
  src: string;
  alt: string;
  lienKet?: string;
}

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

interface BannerApiResponse {
  _id: string;
  hinhAnh: string;
  lienKet?: string;
  thuTu: number;
  hienThi: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
}

export default function HomePage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingSlides, setLoadingSlides] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Lấy danh sách banner
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingSlides(true);
        const response: ApiResponse<BannerApiResponse> = await getData(
          "/api/banners"
        );
        const data = response.data;
        if (!Array.isArray(data)) {
          throw new Error("API response data for banners is not an array");
        }

        const formattedSlides: Slide[] = data.map((banner, index) => ({
          src: banner.hinhAnh,
          alt: `Banner ${index + 1}`,
          lienKet: banner.lienKet,
        }));
        setSlides(formattedSlides);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to fetch banners:", error.message);
        } else {
          console.error("Failed to fetch banners:", error);
        }
        console.error("Error details:", error);
        // Fallback to default slides if API fails
        setSlides([
          {
            src: "https://hcm.fstorage.vn/images/2025/04/snapedit_1744181887589-20250409070007.jpeg",
            alt: "Slide 1",
          },
          {
            src: "https://hcm.fstorage.vn/images/2025/02/z6354760025523_12445341681b2738b00b305e3265cc74-20250226105255.jpg",
            alt: "Slide 2",
          },
          {
            src: "https://hcm.fstorage.vn/images/2025/02/z6354752585421_19941f398535b340836dfb6e184027dc-20250226105402.jpg",
            alt: "Slide 3",
          },
        ]);
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchBanners();
  }, []);

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
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
        setLoadingCategories(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Container với responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Hero Banner Section */}
        <section className="pt-4 sm:pt-6 lg:pt-8">
          <Carousel className="w-full overflow-hidden">
            <CarouselContent>
              {loadingSlides ? (
                <CarouselItem>
                  <div className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-5 h-5 bg-gray-400 rounded-full animate-bounce"></div>
                      <span className="text-sm sm:text-base">Đang tải banner...</span>
                    </div>
                  </div>
                </CarouselItem>
              ) : slides.length === 0 ? (
                <CarouselItem>
                  <div className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm sm:text-base">Không có banner nào</p>
                  </div>
                </CarouselItem>
              ) : (
                slides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <div className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500">
                      {slide.lienKet ? (
                        <Link to={slide.lienKet} target="_blank" className="block">
                          <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] object-cover transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                      ) : (
                        <>
                          <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      )}
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Categories Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Danh mục sản phẩm
            </h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
          </div>

          {loadingCategories ? (
            <>
              {/* Mobile Loading */}
              <div className="sm:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <MobileCategorySkeleton key={index} />
                  ))}
                </div>
              </div>
              
              {/* Desktop Loading */}
              <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <CategorySkeleton key={index} />
                ))}
              </div>
            </>
          ) : categories.length > 0 ? (
            <>
              {/* Mobile Layout - Horizontal Scroll */}
              <div className="sm:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                  {categories.map((category) => (
                    <Link
                      to={`/products?category=${category.id}`}
                      key={category.id}
                      className="flex-shrink-0 text-center group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center mb-2 group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                        <img
                          className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                          src={category.hinhAnh}
                          alt={category.name}
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300 text-center w-16 line-clamp-2 leading-tight">
                        {category.name}
                      </p>
                    </Link>
                  ))}
                  
                  {/* Tất cả sản phẩm card for mobile */}
                  <Link
                    to="/products"
                    className="flex-shrink-0 text-center group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-full shadow-md flex items-center justify-center mb-2 group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                      <img
                        className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                        src="https://png.pngtree.com/png-vector/20240907/ourmid/pngtree-frappe-coffee-with-beans-on-white-background-png-image_13775917.png"
                        alt="Tất cả sản phẩm"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs font-bold text-blue-600 transition-colors duration-300 text-center w-16 line-clamp-2 leading-tight">
                      Tất cả sản phẩm
                    </p>
                  </Link>
                </div>
              </div>

              {/* Desktop Layout - Grid */}
              <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {categories.map((category) => (
                  <Link
                    to={`/products?category=${category.id}`}
                    key={category.id}
                    className="group bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative overflow-hidden rounded-lg mb-3 sm:mb-4">
                      <img
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto transition-transform duration-500 group-hover:scale-110"
                        src={category.hinhAnh}
                        alt={category.name}
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300 text-center line-clamp-2">
                      {category.name}
                    </p>
                  </Link>
                ))}
                
                {/* Tất cả sản phẩm card for desktop */}
                <Link
                  to="/products"
                  className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 sm:mb-4">
                    <img
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto transition-transform duration-500 group-hover:scale-110"
                      src="https://png.pngtree.com/png-vector/20240907/ourmid/pngtree-frappe-coffee-with-beans-on-white-background-png-image_13775917.png"
                      alt="Tất cả sản phẩm"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-blue-600 transition-colors duration-300 text-center">
                    Tất cả sản phẩm
                  </p>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm sm:text-base">Đang tải danh mục...</p>
            </div>
          )}
        </section>

        {/* Suggested Products Section */}
        <section className="pb-8 sm:pb-12 lg:pb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Gợi ý sản phẩm
            </h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Placeholder for suggested products */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Sản phẩm gợi ý sẽ được hiển thị tại đây</p>
          </div>
        </section>

        <section className="pb-8 sm:pb-12 lg:pb-16">
          <Reviews />
        </section>
      </div>
    </div>
  );
}
