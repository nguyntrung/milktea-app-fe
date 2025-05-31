import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: string; lon: string }) => void;
  onBlur?: () => void;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  hasError?: boolean;
  readOnly?: boolean;
  calculateDistance?: boolean;
}

interface SuggestionItem {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

// Địa chỉ cửa hàng (gán cứng tạm thời)
const STORE_LOCATION = {
  lat: "10.8070354",  // Vĩ độ của cửa hàng
  lon: "106.62870307", // Kinh độ của cửa hàng
  address: "140 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP Hồ Chí Minh" // Địa chỉ cửa hàng
};

export default function AddressAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "Nhập địa chỉ",
  id = "diaChi",
  name = "diaChi",
  className = "",
  hasError = false,
  readOnly = false,
  calculateDistance = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);

  const LOCATIONIQ_API_KEY = "pk.df2fa76f44e0a60d49da5b807e4ff9b2"; // Thay thế bằng API key của bạn

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    // Hàm xử lý sự kiện click bên ngoài danh sách gợi ý
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionListRef.current &&
        !suggestionListRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    // Thêm event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Dọn dẹp event listener khi component unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3 || readOnly) return;

    setIsLoading(true);
    try {
      // Thêm "Vietnam" vào query để ưu tiên kết quả ở Việt Nam
      const searchQuery = `${query}, Vietnam`;
      
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=vn&accept-language=vi&dedupe=1`
      );
      
      if (!response.ok) {
        throw new Error("Lỗi khi tìm kiếm địa chỉ");
      }
      
      const data = await response.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi gọi API LocationIQ:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm tính khoảng cách giữa hai điểm theo công thức Haversine
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Khoảng cách tính bằng km
    return distance;
  };

  // Hàm tính phí ship dựa trên khoảng cách
  const calculateShippingFee = (distance: number): number => {
    if (distance <= 2) {
      return 15000; // Dưới 2km: 15,000 VND
    } else if (distance <= 5) {
      return 20000; // 2-5km: 20,000 VND
    } else if (distance <= 10) {
      return 30000; // 5-10km: 30,000 VND
    } else {
      return 40000; // Trên 10km: 40,000 VND
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    onChange(query);

    // Hủy timeout cũ nếu có
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Thiết lập timeout mới để debounce request API
    timeoutRef.current = setTimeout(() => {
      if (query.length >= 3) {
        fetchSuggestions(query);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    setSearchTerm(suggestion.display_name);
    
    if (calculateDistance) {
      // Tính khoảng cách từ cửa hàng đến địa chỉ giao hàng
      const distance = calculateHaversineDistance(
        parseFloat(STORE_LOCATION.lat),
        parseFloat(STORE_LOCATION.lon),
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon)
      );
      
      // Tính phí ship dựa trên khoảng cách
      const shippingFee = calculateShippingFee(distance);
      
      // Truyền thông tin địa chỉ và tọa độ để tính phí ship
      onChange(suggestion.display_name, {
        lat: suggestion.lat,
        lon: suggestion.lon
      });
      
      // Log thông tin để kiểm tra (có thể xóa sau)
      console.log(`Khoảng cách: ${distance.toFixed(2)} km, Phí ship: ${shippingFee.toLocaleString('vi-VN')} VND`);
    } else {
      onChange(suggestion.display_name);
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={suggestionListRef}>
      <Input
        id={id}
        name={name}
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`${className} ${hasError ? "border-red-500" : ""}`}
        autoComplete="off"
        onBlur={() => {
          // Trì hoãn đóng suggestions để cho phép click vào suggestion
          setTimeout(() => {
            if (onBlur) onBlur();
          }, 200);
        }}
        readOnly={readOnly}
      />

      {isLoading && searchTerm.length >= 3 && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
      
      {calculateDistance && (
        <div className="mt-2 text-sm text-muted-foreground">
          Địa chỉ cửa hàng: {STORE_LOCATION.address}
        </div>
      )}
    </div>
  );
}
