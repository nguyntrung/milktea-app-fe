import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TrangThaiDonHang } from "../../../types/common";
import Fallback from "@/components/ui/fallback";
import { CircleArrowRight } from "lucide-react";

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

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all" className="cursor-pointer">Tất cả</TabsTrigger>
          <TabsTrigger value="pending" className="cursor-pointer">Chờ xác nhận</TabsTrigger>
          <TabsTrigger value="processing" className="cursor-pointer">Đang xử lý</TabsTrigger>
          <TabsTrigger value="completed" className="cursor-pointer">Đã giao</TabsTrigger>
          <TabsTrigger value="cancelled" className="cursor-pointer">Đã hủy</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center min-h-[550px]">
          <Fallback />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Không có đơn hàng nào</h3>
          <p className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào trong mục này</p>
          <Button onClick={() => navigate("/products")}>Tiếp tục mua sắm</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng: <span className="font-medium text-gray-700">{order.maHoaDon}</span></p>
                  <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.ngayTao)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusText(order.trangThai).color}`}>
                  {getStatusText(order.trangThai).text}
                </div>
              </div>

              <div className="p-4 border-b">
                <h3 className="font-medium mb-2">Thông tin người nhận</h3>
                <p className="text-sm">{order.thongTinNguoiNhan.ten}</p>
                <p className="text-sm">{order.thongTinNguoiNhan.soDienThoai}</p>
                <p className="text-sm">{order.thongTinNguoiNhan.diaChi}</p>
              </div>

              <div className="p-4">
                <h3 className="font-medium mb-2">Sản phẩm</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                        {item.hinhAnh ? (
                          <img src={item.hinhAnh} alt={item.ten} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.ten}</p>
                        <p className="text-xs text-gray-500">SL: {item.soLuong}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatPrice(item.tongGia)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền:</p>
                  <p className="font-medium text-primary text-lg">{formatPrice(order.tongTien)}</p>
                </div>
                <div className="space-x-2">
                  {order.trangThai === TrangThaiDonHang.DANG_CHUAN_BI && (
                    <Button variant="destructive" size="sm">Hủy đơn hàng</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate(`/order-detail/${order._id}`)}>
                    Chi tiết
                    <CircleArrowRight />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
