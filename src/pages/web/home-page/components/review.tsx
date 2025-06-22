import { useState, useEffect } from "react";
import { getData } from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Star, Filter, ChevronDown, ChevronUp, MessageSquare, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [imageModal, setImageModal] = useState<string | null>(null);

  // Số lượng đánh giá hiển thị ban đầu
  const initialReviewCount = 6;

  // Lấy dữ liệu đánh giá từ API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getData("/api/reviews");
        if (response.success && Array.isArray(response.data)) {
          setReviews(response.data);
          setFilteredReviews(response.data);
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

  // Lọc đánh giá theo số sao
  const filterByRating = (rating: number | null) => {
    setSelectedRating(rating);
    
    if (rating === null) {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.diemDanhGia === rating));
    }
    
    setExpanded(false);
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: vi });
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
          className={`h-4 w-4 transition-colors duration-200 ${
            index < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"
          }`}
        />
      ));
  };

  // Tính thống kê đánh giá
  const getReviewStats = () => {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.diemDanhGia, 0) / totalReviews 
      : 0;
    
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(review => review.diemDanhGia === rating).length,
      percentage: totalReviews > 0 ? (reviews.filter(review => review.diemDanhGia === rating).length / totalReviews) * 100 : 0
    }));

    return { totalReviews, averageRating, ratingCounts };
  };

  const { totalReviews, averageRating, ratingCounts } = getReviewStats();

  // Xác định số lượng đánh giá hiển thị
  const displayedReviews = expanded
    ? filteredReviews
    : filteredReviews.slice(0, initialReviewCount);

  const hasMoreReviews = filteredReviews.length > initialReviewCount;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4">
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải đánh giá</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold text-gray-900">
          Đánh Giá Từ Khách Hàng
        </h2>
        <p className=" text-gray-600 max-w-2xl mx-auto">
          Khám phá những chia sẻ chân thực từ cộng đồng khách hàng của chúng tôi
        </p>
      </div>

      {/* Review Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 mb-12 border border-blue-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-gray-600">Trên {totalReviews} đánh giá</p>
          </div>

          {/* Rating Breakdown */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <button
          onClick={() => filterByRating(null)}
          className={`group px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 font-medium ${
            selectedRating === null 
              ? "bg-primary text-white shadow-lg shadow-blue-500/25" 
              : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Tất cả ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviews.filter(review => review.diemDanhGia === rating).length;
          return (
            <button
              key={rating}
              onClick={() => filterByRating(rating)}
              className={`group px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 font-medium ${
                selectedRating === rating 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25" 
                  : "bg-white text-gray-700 border border-gray-200 hover:border-amber-300 hover:bg-amber-50"
              }`}
            >
              <span>{rating}</span>
              <Star className={`w-4 h-4 ${selectedRating === rating ? "text-white" : "text-amber-400 fill-amber-400"}`} />
              <span className="text-sm">({count})</span>
            </button>
          );
        })}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đánh giá</h3>
          <p className="text-gray-500">
            {selectedRating ? `Không có đánh giá nào với ${selectedRating} sao` : "Chưa có đánh giá nào"}
          </p>
        </div>
      ) : (
        <>
          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayedReviews.map((review, index) => (
              <div 
                key={review._id} 
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold">
                    <img src="https://fsviet.com/image/data/decaltrasua/logo-tra-sua-dep.jpg" alt="" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {getCustomerName(review.maKhachHang)}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(review.ngayDanhGia)}</p>
                  </div>
                  <div className="flex">{renderStars(review.diemDanhGia)}</div>
                </div>
                
                {/* Content */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed line-clamp-4">{review.noiDung}</p>
                </div>
                
                {/* Images */}
                {review.hinhAnh && review.hinhAnh.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.hinhAnh.slice(0, 3).map((image, imgIndex) => (
                      <div key={imgIndex} className="relative group/img">
                        <div className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer">
                          <img 
                            src={image.replace(/[\s`]/g, '')}
                            alt={`Hình ảnh đánh giá ${imgIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=No+Image';
                            }}
                            onClick={() => setImageModal(image)}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 rounded-xl flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    ))}
                    {review.hinhAnh.length > 3 && (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium">
                        +{review.hinhAnh.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreReviews && (
            <div className="text-center">
              <Button
                variant={"outline"}
                onClick={() => setExpanded(!expanded)}
                className="group px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  {expanded ? (
                    <>
                      Thu gọn
                      <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    </>
                  ) : (
                    <>
                      Xem thêm {filteredReviews.length - initialReviewCount} đánh giá
                      <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img 
              src={imageModal.replace(/[\s`]/g, '')}
              alt="Hình ảnh đánh giá"
              className="w-full h-full object-contain rounded-2xl"
            />
            <button 
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-300"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
