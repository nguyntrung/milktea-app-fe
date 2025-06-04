import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { getData } from "../../../lib/api";
import { Link } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="home-page">
      <section className="mt-5">
        <Carousel className={`w-full ${isMobile ? "p-2" : "p-0"}`}>
          <CarouselContent>
            {loadingSlides ? (
              <CarouselItem>
                <div className="w-full h-[410px] flex items-center justify-center">
                  <p>Đang tải banner...</p>
                </div>
              </CarouselItem>
            ) : slides.length === 0 ? (
              <CarouselItem>
                <div className="w-full h-[410px] flex items-center justify-center">
                  <p>Không có banner nào</p>
                </div>
              </CarouselItem>
            ) : (
              slides.map((slide, index) => (
                <CarouselItem key={index}>
                  {slide.lienKet ? (
                    <Link to={slide.lienKet} target="_blank">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className={`
                          w-full 
                          rounded
                          ${isMobile ? "h-auto" : "h-[410px]"}
                          object-contain
                        `}
                      />
                    </Link>
                  ) : (
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className={`
                        w-full 
                        rounded
                        ${isMobile ? "h-auto" : "h-[410px]"}
                        object-contain
                      `}
                    />
                  )}
                </CarouselItem>
              ))
            )}
          </CarouselContent>
        </Carousel>
      </section>

      <section className="mt-5">
        <div className="font-medium">Danh mục sản phẩm</div>
        <div className="flex justify-center mt-4">
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,1fr))] max-w-5xl w-full">
            {categories.length > 0 ? (
              <>
                {categories.map((category) => (
                  <Link
                    to={`/products?category=${category.id}`}
                    key={category.id}
                    className="bg-background p-4 rounded-lg shadow-md text-center cursor-pointer group"
                  >
                    <img
                      className="w-20 h-20 object-contain m-auto transition duration-500 group-hover:scale-105"
                      src={category.hinhAnh}
                      alt={category.name}
                    />
                    <p className="text-gray-700">{category.name}</p>
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="bg-background p-4 rounded-lg shadow-md text-center cursor-pointer group"
                >
                  <img
                    className="w-20 h-20 object-contain m-auto transition duration-500 group-hover:scale-105"
                    src="https://png.pngtree.com/png-vector/20240907/ourmid/pngtree-frappe-coffee-with-beans-on-white-background-png-image_13775917.png"
                    alt=""
                  />
                  <p className="text-gray-700">Tất cả sản phẩm</p>
                </Link>
              </>
            ) : (
              <p>Đang tải danh mục...</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="font-medium">Gợi ý sản phẩm</div>
      </section>
    </div>
  );
}
