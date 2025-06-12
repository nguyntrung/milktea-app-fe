import { useState, useEffect } from "react";
import { getData } from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho đánh giá
interface Review {
  _id: string;
  maKhachHang: string;
  maDonHang: string;
  ngayDanhGia: string;
  diemDanhGia: number;
  noiDung: string;
  hinhAnh: string[];
  hoatDong: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function ReviewComponent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [customerNames, ] = useState<Record<string, string>>({});

  // Số lượng đánh giá hiển thị ban đầu
  const initialReviewCount = 3;

  // Lấy dữ liệu đánh giá từ API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getData("/api/reviews");
        if (response.success && Array.isArray(response.data)) {
          setReviews(response.data);
          setFilteredReviews(response.data);
          
          // Lấy thông tin tên khách hàng
          // const customerIds = [...new Set(response.data.map((review: Review) => review.maKhachHang))];
          // await fetchCustomerNames(customerIds as string[]);
        } else {
          setError("Không thể tải danh sách đánh giá");
        }
      } catch (error) {
        console.error("Lỗi khi tải đánh giá:", error);
        setError("Đã xảy ra lỗi khi tải danh sách đánh giá");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Lấy tên khách hàng từ API
  // const fetchCustomerNames = async (customerIds: string[]) => {
  //   try {
  //     const namesMap: Record<string, string> = {};
      
  //     // Lấy thông tin từng khách hàng
  //     await Promise.all(
  //       customerIds.map(async (id) => {
  //         try {
  //           const response = await getData(`/api/customers/${id}`);
  //           if (response.success && response.data) {
  //             namesMap[id] = response.data.ten || "Khách hàng";
  //           }
  //         } catch (error) {
  //           console.error(`Lỗi khi lấy thông tin khách hàng ${id}:`, error);
  //         }
  //       })
  //     );
      
  //     setCustomerNames(namesMap);
  //   } catch (error) {
  //     console.error("Lỗi khi lấy thông tin khách hàng:", error);
  //   }
  // };

  // Lọc đánh giá theo số sao
  const filterByRating = (rating: number | null) => {
    setSelectedRating(rating);
    
    if (rating === null) {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.diemDanhGia === rating));
    }
    
    // Reset trạng thái mở rộng khi lọc
    setExpanded(false);
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Lấy tên khách hàng
  const getCustomerName = (customerId: string) => {
    return customerNames[customerId] || "Khách hàng";
  };

  // Hiển thị số sao
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ));
  };

  // Xác định số lượng đánh giá hiển thị
  const displayedReviews = expanded
    ? filteredReviews
    : filteredReviews.slice(0, initialReviewCount);

  // Kiểm tra xem có thêm đánh giá để hiển thị không
  const hasMoreReviews = filteredReviews.length > initialReviewCount;

  if (loading) {
    return <div className="text-center py-8">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-center mb-8">Đánh Giá Từ Khách Hàng</h2>
      
      {/* Bộ lọc đánh giá */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => filterByRating(null)}
          className={`px-4 py-2 rounded-full ${selectedRating === null ? "bg-primary text-white" : "bg-gray-100"}`}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => filterByRating(rating)}
            className={`px-4 py-2 rounded-full flex items-center gap-1 ${selectedRating === rating ? "bg-primary text-white" : "bg-gray-100"}`}
          >
            {rating} <Star className={`h-4 w-4 ${selectedRating === rating ? "text-white" : "text-yellow-400 fill-yellow-400"}`} />
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Không có đánh giá nào {selectedRating ? `với ${selectedRating} sao` : ""}
        </div>
      ) : (
        <>
          {/* Danh sách đánh giá */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{getCustomerName(review.maKhachHang)}</h3>
                    <p className="text-sm text-gray-500">{formatDate(review.ngayDanhGia)}</p>
                  </div>
                  <div className="flex">{renderStars(review.diemDanhGia)}</div>
                </div>
                
                <p className="text-gray-700 mb-4 flex-grow">{review.noiDung}</p>
                
                {review.hinhAnh && review.hinhAnh.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {review.hinhAnh.map((image, index) => (
                      <div key={index} className="w-16 h-16 rounded overflow-hidden">
                        <img 
                          src={image.replace(/[\s`]/g, '')} // Xóa khoảng trắng và dấu ` từ URL
                          alt={`Hình ảnh đánh giá ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=No+Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nút xem thêm */}
          {hasMoreReviews && (
            <div className="text-center mt-8">
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {expanded ? (
                  <>
                    Thu gọn <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Xem thêm <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
