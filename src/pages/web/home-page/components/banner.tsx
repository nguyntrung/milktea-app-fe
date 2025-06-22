import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { useEffect, useState, useRef } from "react";
import { getData } from "../../../../lib/api";
import { Link } from "react-router";

interface Slide {
  src: string;
  alt: string;
  lienKet?: string;
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

const DEFAULT_SLIDES: Slide[] = [
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
];

export default function Banner() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [api, setApi] = useState<CarouselApi>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<BannerApiResponse> = await getData("/api/banners");
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
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (!api || loading || slides.length <= 1) {
      return;
    }

    const startAutoSlide = () => {
      intervalRef.current = setInterval(() => {
        api.scrollNext();
      }, 5000); // 3 seconds
    };

    const stopAutoSlide = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start auto-slide
    startAutoSlide();

    // Stop auto-slide when user interacts
    const handlePointerDown = () => stopAutoSlide();
    const handlePointerUp = () => {
      // Resume auto-slide after a short delay
      setTimeout(startAutoSlide, 5000); // Resume after 5 seconds of inactivity
    };

    const carouselElement = api.rootNode();
    if (carouselElement) {
      carouselElement.addEventListener('pointerdown', handlePointerDown);
      carouselElement.addEventListener('pointerup', handlePointerUp);
      carouselElement.addEventListener('pointerleave', handlePointerUp);
    }

    // Cleanup
    return () => {
      stopAutoSlide();
      if (carouselElement) {
        carouselElement.removeEventListener('pointerdown', handlePointerDown);
        carouselElement.removeEventListener('pointerup', handlePointerUp);
        carouselElement.removeEventListener('pointerleave', handlePointerUp);
      }
    };
  }, [api, loading, slides.length]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const BannerSkeleton = () => (
    <CarouselItem>
      <div className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-5 h-5 bg-gray-400 rounded-full animate-bounce"></div>
          <span className="text-sm sm:text-base">Đang tải banner...</span>
        </div>
      </div>
    </CarouselItem>
  );

  const EmptyBanner = () => (
    <CarouselItem>
      <div className="w-full h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[450px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-sm sm:text-base">Không có banner nào</p>
      </div>
    </CarouselItem>
  );

  const BannerSlide = ({ slide, index }: { slide: Slide; index: number }) => (
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
  );

  return (
    <section className="pt-4 sm:pt-6 lg:pt-8">
      <Carousel 
        className="w-full overflow-hidden"
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {loading ? (
            <BannerSkeleton />
          ) : slides.length === 0 ? (
            <EmptyBanner />
          ) : (
            slides.map((slide, index) => (
              <BannerSlide key={index} slide={slide} index={index} />
            ))
          )}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
