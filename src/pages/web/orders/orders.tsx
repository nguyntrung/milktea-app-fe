import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData, putData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TrangThaiDonHang } from "../../../types/common";
import { CircleArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
}

// Add these interfaces for API responses
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

// Skeleton Components
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

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng");
        navigate("/login", { state: { from: "/orders" } });
        return;
      }

      try {
        setLoading(true);
        const response = await getData(`/api/orders/auth/${userId}`);
        if (response.success) {
          // Xử lý dữ liệu đơn hàng
          const processedOrders = await Promise.all(
            response.data.map(async (order: OrderResponse) => {
              // Lấy chi tiết đơn hàng
              const detailsResponse = await getData(`/api/order-details/${order._id}`);
              
              let items: OrderItem[] = [];
              if (detailsResponse.success) {
                items = await Promise.all(detailsResponse.data.map(async (detail: OrderDetailResponse) => {
                  // Xử lý trường hợp maSanPham là object
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

              // Parse thông tin người nhận từ chuỗi JSON
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
                  } else {
                    console.warn("Không phải JSON, bỏ qua:", info);
                  }
                } else if (typeof info === "object" && info !== null) {
                  // Nếu API đã trả về đúng object
                  thongTinNguoiNhan = info;
                }
              } catch (error) {
                console.error("Lỗi khi parse thông tin người nhận:", error, order.thongTinNguoiNhan);
              }              

              // Lấy trạng thái đơn hàng mới nhất từ lichSuTrangThai
              const trangThai = order.lichSuTrangThai && order.lichSuTrangThai.length > 0
                ? mapTrangThaiDonHang(order.lichSuTrangThai[order.lichSuTrangThai.length - 1].trangThaiDonHang)
                : TrangThaiDonHang.CHO_XAC_NHAN;

              return {
                _id: order._id,
                maHoaDon: order._id,
                ngayTao: order.ngayTao,
                trangThai: trangThai,
                tongTien: order.tongTien || 0,
                thongTinNguoiNhan,
                items
              };
            })
          );

          setOrders(processedOrders);
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

    fetchOrders();
  }, [navigate]);

  // Hàm chuyển đổi từ chuỗi trạng thái API sang enum TrangThaiDonHang
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

  // Lọc đơn hàng theo trạng thái
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

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      const response = await putData(`/api/orders/${cancelOrderId}/status`, {
        trangThaiDonHang: "daHuy",
      });

      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        // Cập nhật lại danh sách đơn hàng
        const updatedOrders = orders.map(order => {
          if (order._id === cancelOrderId) {
            return { ...order, trangThai: TrangThaiDonHang.DA_HUY };
          }
          return order;
        });
        setOrders(updatedOrders);
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

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Hàm hiển thị trạng thái đơn hàng
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

  return (
    <Card className="py-6 m-2 lg:py-8 max-w-7xl">
      <CardHeader className="">
        <CardTitle>Đơn hàng của tôi</CardTitle>
        <CardDescription className="flex justify-between">
          Xem và theo dõi tình trạng các đơn hàng bạn đã đặt
        </CardDescription>
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
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4 lg:mb-6">
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
    </Card>
  );
}
