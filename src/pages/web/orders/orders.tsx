import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData, putData, postData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TrangThaiDonHang } from "../../../types/common";
import { CircleArrowRight, Star, StarIcon, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface OrderItem {
  _id: string;
  maSanPham: string;
  ten: string;
  soLuong: number;
  gia: number;
  tongGia: number;
  hinhAnh?: string;
}

interface Order {
  _id: string;
  maHoaDon: string;
  ngayTao: string;
  trangThai: TrangThaiDonHang;
  tongTien: number;
  thongTinNguoiNhan: {
    ten: string;
    soDienThoai: string;
    diaChi: string;
    email?: string;
  };
  items: OrderItem[];
  hasReview?: boolean;
}

interface OrderResponse {
  _id: string;
  maKhachHang: {
    _id: string;
    ten: string;
  };
  maNhanVien: {
    _id: string;
    ten: string;
  };
  ngayLap: string;
  tongTienHang: number;
  tongTien: number;
  nguoiGiao: string;
  thongTinNguoiNhan: string;
  lichSuTrangThai: Array<{
    thoiGian: string;
    trangThaiDonHang: string;
    _id: string;
  }>;
  ghiChu: string;
  ngayTao: string;
  ngayCapNhat: string;
  thanhToan: {
    phuongThucThanhToan: string;
    trangThaiThanhToan: string;
  };
}

interface OrderDetailResponse {
  _id: string;
  maHoaDon: string;
  maSanPham: string | {
    _id: string;
    ten: string;
  };
  ten?: string;
  soLuong: number;
  kichCo: {
    tenSize: string;
    giaTang: number;
  };
  tuyChon: Array<string>;
  topping: Array<{
    maTopping: string | {
      _id: string;
      ten: string;
    };
    gia: number;
    soLuong: number;
    _id: string;
  }>;
  thanhTien: number;
  hinhAnh?: string;
  ghiChu: string;
  donGia?: number;
}

interface Review {
  _id?: string;
  maKhachHang: string;
  maDonHang: string;
  diemDanhGia: number;
  noiDung: string;
  hinhAnh: string[];
  ngayTao?: string;
}

const OrderCardSkeleton = () => (
  <div className="bg-card rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
    </div>
    <div className="p-4">
      <Skeleton className="h-5 w-24 mb-3" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
    <div className="p-4 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const TabsSkeleton = () => (
  <div className="mb-6">
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 rounded-md" />
      ))}
    </div>
  </div>
);

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // State cho đánh giá
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [viewReviewOrderId, setViewReviewOrderId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Review>({
    maKhachHang: "",
    maDonHang: "",
    diemDanhGia: 5,
    noiDung: "",
    hinhAnh: []
  });
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const fetchOrders = async (pageNum: number = 1) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Vui lòng đăng nhập để xem đơn hàng");
      navigate("/login", { state: { from: "/orders" } });
      return;
    }

    try {
      setLoading(true);
      const response = await getData(`/api/orders/auth/${userId}/paginated?page=${pageNum}&limit=10`);
      if (response.success) {
        const processedOrders = await Promise.all(
          response.data.orders.map(async (order: OrderResponse) => {
            const detailsResponse = await getData(`/api/order-details/${order._id}`);
            
            let items: OrderItem[] = [];
            if (detailsResponse.success) {
              items = await Promise.all(detailsResponse.data.map(async (detail: OrderDetailResponse) => {
                let tenSanPham = "Sản phẩm";
                let idSanPham = "";
                const hinhAnh = detail.hinhAnh;
                
                if (typeof detail.maSanPham === 'object' && detail.maSanPham !== null) {
                  tenSanPham = detail.maSanPham.ten || "Sản phẩm";
                  idSanPham = detail.maSanPham._id || "";
                } else {
                  idSanPham = detail.maSanPham as string;
                  tenSanPham = detail.ten || "Sản phẩm";
                }
                
                return {
                  _id: detail._id,
                  maSanPham: idSanPham,
                  ten: tenSanPham,
                  soLuong: detail.soLuong,
                  gia: detail.donGia || detail.kichCo.giaTang || 0,
                  tongGia: detail.thanhTien || 0,
                  hinhAnh: hinhAnh
                };
              }));
            }

            let thongTinNguoiNhan = {
              ten: "",
              soDienThoai: "",
              diaChi: "",
              email: ""
            };
            
            try {
              const info = order.thongTinNguoiNhan;
              if (typeof info === "string") {
                if (info.trim().startsWith("{") && info.trim().endsWith("}")) {
                  thongTinNguoiNhan = JSON.parse(info);
                }
              } else if (typeof info === "object" && info !== null) {
                thongTinNguoiNhan = info;
              }
            } catch (error) {
              console.error("Lỗi khi parse thông tin người nhận:", error, order.thongTinNguoiNhan);
            }

            const trangThai = order.lichSuTrangThai && order.lichSuTrangThai.length > 0
              ? mapTrangThaiDonHang(order.lichSuTrangThai[order.lichSuTrangThai.length - 1].trangThaiDonHang)
              : TrangThaiDonHang.CHO_XAC_NHAN;

            let hasReview = false;
            if (trangThai === TrangThaiDonHang.DA_GIAO) {
              try {
                const reviewResponse = await getData(`/api/reviews/order/${order._id}`);
                hasReview = reviewResponse.success && reviewResponse.data;
              } catch (error) {
                console.error("Lỗi khi kiểm tra đánh giá:", error);
              }
            }

            return {
              _id: order._id,
              maHoaDon: order._id,
              ngayTao: order.ngayTao,
              trangThai: trangThai,
              tongTien: order.tongTien || 0,
              thongTinNguoiNhan,
              items,
              hasReview
            };
          })
        );

        setOrders(processedOrders);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
        setPage(pageNum);
      } else {
        toast.error("Không thể tải đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const mapTrangThaiDonHang = (trangThaiString: string): TrangThaiDonHang => {
    switch (trangThaiString) {
      case "choXuLy":
        return TrangThaiDonHang.CHO_XAC_NHAN;
      case "dangChuanBi":
        return TrangThaiDonHang.DANG_CHUAN_BI;
      case "dangGiao":
        return TrangThaiDonHang.DANG_GIAO;
      case "daGiao":
        return TrangThaiDonHang.DA_GIAO;
      case "daHuy":
        return TrangThaiDonHang.DA_HUY;
      default:
        return TrangThaiDonHang.CHO_XAC_NHAN;
    }
  };

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(order => {
        switch (activeTab) {
          case "pending":
            return order.trangThai === TrangThaiDonHang.CHO_XAC_NHAN;
          case "processing":
            return order.trangThai === TrangThaiDonHang.DANG_CHUAN_BI || 
                   order.trangThai === TrangThaiDonHang.DANG_GIAO;
          case "completed":
            return order.trangThai === TrangThaiDonHang.DA_GIAO;
          case "cancelled":
            return order.trangThai === TrangThaiDonHang.DA_HUY;
          default:
            return true;
        }
      });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      const response = await putData(`/api/orders/${cancelOrderId}/status`, {
        trangThaiDonHang: "daHuy",
      });

      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        fetchOrders(page);
      } else {
        toast.error("Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi hủy đơn hàng");
    } finally {
      setCancelOrderId(null);
    }
  };

  const handleOpenReviewDialog = (orderId: string) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setReviewData({
      maKhachHang: userId,
      maDonHang: orderId,
      diemDanhGia: 5,
      noiDung: "",
      hinhAnh: []
    });
    setReviewImages([]);
    setReviewOrderId(orderId);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        toast.error(`File ${file.name} không hợp lệ hoặc quá lớn`);
      }
      return isValid;
    });
    
    if (reviewImages.length + validFiles.length > 5) {
      toast.error("Chỉ được tải lên tối đa 5 ảnh");
      return;
    }
    
    setReviewImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!reviewData.noiDung.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);
      
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        const formData = new FormData();
        reviewImages.forEach(file => {
          formData.append('images', file);
        });
        
        try {
          const uploadResponse = await postData('/api/upload/review-images', formData);
          if (uploadResponse.success) {
            imageUrls = uploadResponse.data.urls || [];
          }
        } catch (uploadError) {
          console.error("Lỗi upload ảnh:", uploadError);
        }
      }

      const reviewPayload = {
        ...reviewData,
        hinhAnh: imageUrls
      };

      const response = await postData('/api/reviews/', reviewPayload);
      
      if (response.success) {
        toast.success("Đánh giá thành công!");
        setOrders(prev => prev.map(order => 
          order._id === reviewData.maDonHang 
            ? { ...order, hasReview: true }
            : order
        ));
        setReviewOrderId(null);
        fetchOrders(page);
      } else {
        toast.error("Không thể gửi đánh giá");
      }
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleViewReview = async (orderId: string) => {
    try {
      setLoadingReview(true);
      const response = await getData(`/api/reviews/order/${orderId}`);
      
      if (response.success && response.data) {
        setCurrentReview(response.data);
        setViewReviewOrderId(orderId);
      } else {
        toast.error("Không thể tải đánh giá");
      }
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi tải đánh giá");
    } finally {
      setLoadingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const getStatusText = (status: TrangThaiDonHang) => {
    switch (status) {
      case TrangThaiDonHang.CHO_XAC_NHAN:
        return { text: "Chờ xác nhận", color: "bg-amber-100 text-amber-800" };
      case TrangThaiDonHang.DANG_CHUAN_BI:
        return { text: "Đang xử lý", color: "bg-blue-100 text-blue-800" };
      case TrangThaiDonHang.DANG_GIAO:
        return { text: "Đang giao", color: "bg-indigo-100 text-indigo-800" };
      case TrangThaiDonHang.DA_GIAO:
        return { text: "Đã giao", color: "bg-green-100 text-green-800" };
      case TrangThaiDonHang.DA_HUY:
        return { text: "Đã hủy", color: "bg-red-100 text-red-800" };
      default:
        return { text: "Không xác định", color: "bg-gray-100 text-gray-800" };
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }: { 
    rating: number; 
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRatingChange?.(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="py-6 m-2 lg:py-8 max-w-7xl">
      <CardHeader>
        <CardTitle>Đơn hàng của tôi</CardTitle>
        <CardDescription>Xem và theo dõi tình trạng các đơn hàng bạn đã đặt</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <>
            <TabsSkeleton />
            <div className="space-y-4 lg:space-y-6">
              {[1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4 lg:mb-6 sticky top-30">
              <TabsList className="grid grid-cols-5 w-full h-auto p-1">
                <TabsTrigger value="all" className="cursor-pointer text-xs sm:text-sm px-2 py-2">
                  Tất cả
                </TabsTrigger>
                <TabsTrigger value="pending" className="cursor-pointer text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Chờ xác nhận</span>
                  <span className="sm:hidden">Chờ XN</span>
                </TabsTrigger>
                <TabsTrigger value="processing" className="cursor-pointer text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Đang xử lý</span>
                  <span className="sm:hidden">Đang XL</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="cursor-pointer text-xs sm:text-sm px-2 py-2">
                  Đã giao
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="cursor-pointer text-xs sm:text-sm px-2 py-2">
                  Đã hủy
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 lg:py-16 bg-card rounded-lg shadow-sm">
                <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4 text-gray-400">
                  <img 
                    src="https://erapharma.meu-solutions.com/assets/empty_box-CUmoE1Uo.gif"
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-muted-foreground mb-4 lg:mb-6 text-sm lg:text-base px-4">
                  Bạn chưa có đơn hàng nào trong mục này
                </p>
                <Button onClick={() => navigate("/products")} size="sm" className="lg:size-default">
                  Tiếp tục mua sắm
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 lg:space-y-6">
                  {filteredOrders.map((order) => (
                    <div key={order._id} className="bg-card rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 border-b">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-2 text-sm lg:text-base">Thông tin người nhận</h3>
                            <div className="space-y-1 text-xs lg:text-sm text-gray-600">
                              <p className="truncate">
                                <span className="font-medium">{order.thongTinNguoiNhan.ten}</span> - {order.thongTinNguoiNhan.soDienThoai}
                              </p>
                              <p className="break-words">{order.thongTinNguoiNhan.diaChi}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="space-y-1 mb-2 text-xs lg:text-sm text-muted-foreground">
                              <p>
                                Mã đơn hàng: <span className="font-medium text-gray-700 break-all">{order.maHoaDon}</span>
                              </p>
                              <p>Ngày đặt: {formatDate(order.ngayTao)}</p>
                            </div>
                            <div className={`inline-block px-2 lg:px-3 py-1 lg:py-2 rounded text-xs lg:text-sm font-medium ${getStatusText(order.trangThai).color}`}>
                              {getStatusText(order.trangThai).text}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-3 text-sm lg:text-base">Sản phẩm</h3>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item._id} className="flex items-center gap-3">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                {item.hinhAnh ? (
                                  <img src={item.hinhAnh} alt={item.ten} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 lg:w-6 lg:h-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs lg:text-sm truncate">{item.ten}</p>
                                <p className="text-xs text-gray-500">Số lượng: {item.soLuong}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-medium text-xs lg:text-sm">{formatPrice(item.tongGia)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <p className="text-xs lg:text-sm text-gray-500">Tổng tiền:</p>
                            <p className="font-medium text-primary text-base lg:text-lg">{formatPrice(order.tongTien)}</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            {order.trangThai === TrangThaiDonHang.CHO_XAC_NHAN && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="flex-1 sm:flex-none text-xs lg:text-sm"
                                onClick={() => setCancelOrderId(order._id)}
                              >
                                Hủy đơn hàng
                              </Button>
                            )}
                            {order.trangThai === TrangThaiDonHang.DA_GIAO && (
                              order.hasReview ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1 sm:flex-none text-xs lg:text-sm"
                                  onClick={() => handleViewReview(order._id)}
                                  disabled={loadingReview}
                                >
                                  <StarIcon className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                  Xem đánh giá
                                </Button>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  className="flex-1 sm:flex-none text-xs lg:text-sm bg-yellow-500 hover:bg-yellow-600"
                                  onClick={() => handleOpenReviewDialog(order._id)}
                                >
                                  <Star className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                  Đánh giá
                                </Button>
                              )
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 sm:flex-none text-xs lg:text-sm"
                              onClick={() => navigate(`/order-details/${order._id}`)}
                            >
                              Chi tiết
                              <CircleArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {filteredOrders.length} / {totalCount} đơn hàng
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(page - 1)}
                      disabled={page <= 1}
                      className="cursor-pointer"
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(page + 1)}
                      disabled={page >= totalPages}
                      className="cursor-pointer"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <DialogContent className="mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">Xác nhận hủy đơn hàng</DialogTitle>
            <DialogDescription className="text-sm lg:text-base">
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setCancelOrderId(null)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCancelOrder}
            >
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewOrderId} onOpenChange={() => setReviewOrderId(null)}>
        <DialogContent className="mx-4 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">Đánh giá đơn hàng</DialogTitle>
            <DialogDescription className="text-sm lg:text-base">
              Hãy chia sẻ trải nghiệm của bạn về đơn hàng này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Đánh giá của bạn</label>
              <StarRating 
                rating={reviewData.diemDanhGia} 
                onRatingChange={(rating) => setReviewData(prev => ({ ...prev, diemDanhGia: rating }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nội dung đánh giá</label>
              <Textarea
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm và dịch vụ..."
                value={reviewData.noiDung}
                onChange={(e) => setReviewData(prev => ({ ...prev, noiDung: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Hình ảnh (tùy chọn)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="review-images"
                  />
                  <label
                    htmlFor="review-images"
                    className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Tải ảnh lên
                  </label>
                  <span className="text-xs text-gray-500">
                    Tối đa 5 ảnh, mỗi ảnh không quá 5MB
                  </span>
                </div>
                {reviewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {reviewImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setReviewOrderId(null)}
              disabled={submittingReview}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewData.noiDung.trim()}
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewReviewOrderId} onOpenChange={() => setViewReviewOrderId(null)}>
        <DialogContent className="mx-4 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">Đánh giá của bạn</DialogTitle>
          </DialogHeader>
          {currentReview && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Đánh giá</label>
                <StarRating rating={currentReview.diemDanhGia} readonly />
                <p className="text-sm text-gray-500 mt-1">
                  {currentReview.diemDanhGia}/5 sao
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nội dung</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{currentReview.noiDung}</p>
                </div>
              </div>
              {currentReview.hinhAnh && currentReview.hinhAnh.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Hình ảnh</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentReview.hinhAnh.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Đánh giá ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
              {currentReview.ngayTao && (
                <div>
                  <p className="text-xs text-gray-500">
                    Đánh giá vào: {formatDate(currentReview.ngayTao)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setViewReviewOrderId(null);
                setCurrentReview(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
