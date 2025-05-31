import { useIsMobile } from "@/hooks/use-mobile";
import { Globe, MapPin, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { getData } from "@/lib/api";

interface StoreInfo {
  logo: string;
  ten: string;
  diaChi: string;
  soDienThoai: string;
  email: string;
  website: string;
}

export default function Footer() {
  const isMobile = useIsMobile();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await getData("/api/store");
        if (response.success) {
          setStoreInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      }
    };
    fetchStoreInfo();
  }, []);

  return (
    <footer
      className={`bg-primary text-popover py-6 md:py-10 max-w-[1200px] mx-auto grid ${
        isMobile ? "grid-cols-1" : "grid-cols-3"
      } gap-6 px-4 md:px-6`}
    >
      <section>
        <h3 className="text-lg md:text-xl font-medium mb-3">{storeInfo?.ten || "Forest Bean"}</h3>
        <main className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span className="text-sm md:text-base">
              {storeInfo?.diaChi || "140 Lê Trọng Tấn - Tây Thạnh - Tân Phú - HCM"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            <span className="text-sm md:text-base">
              {storeInfo?.soDienThoai || "(+84) 983648583"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <span className="text-sm md:text-base">{storeInfo?.email || "contact@forestbean.com"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span className="text-sm md:text-base">{storeInfo?.website || "forestbean.com"}</span>
          </div>
        </main>

        <h3 className="text-lg md:text-xl font-medium my-3">TẢI ỨNG DỤNG TẠI</h3>
        <main className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img
              className="w-24 md:w-32 h-auto"
              src="https://dsvn.vn/images/playstore.png"
              alt="Play Store"
            />
          </div>
          <div className="flex items-center gap-2">
            <img
              className="w-24 md:w-32 h-auto"
              src="https://dsvn.vn/images/appstore.png"
              alt="App Store"
            />
          </div>
        </main>
      </section>

      <section>
        <h3 className="text-lg md:text-xl font-medium mb-3">CHĂM SÓC KHÁCH HÀNG</h3>
        <main className="flex flex-col gap-3">
          <div className="text-sm md:text-base">Trung tâm trợ giúp</div>
          <div className="text-sm md:text-base">Vận chuyển</div>
          <div className="text-sm md:text-base">Thanh toán</div>
          <div className="text-sm md:text-base">Hướng dẫn mua hàng</div>
          <div className="text-sm md:text-base">Chính sách bảo hành</div>
        </main>
      </section>

      <section>
        <h3 className="text-lg md:text-xl font-medium mb-3">PHƯƠNG THỨC THANH TOÁN</h3>
        <main className="flex gap-2 flex-wrap">
          <div className="w-10 h-10 md:w-12 md:h-12">
            <img
              className="w-full h-full object-contain"
              src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
              alt="MoMo"
            />
          </div>
        </main>
      </section>
    </footer>
  );
}
