import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TrangThaiDonHang } from "../../../types/common";
import Fallback from "@/components/ui/fallback";

interface OrderItem {
  _id: string;
  maSanPham: string;
  tenSanPham: string;
  soLuong: number;
  gia: number;
  tongGia: number;
  hinhAnh?: string;
  kichCo?: {
    tenSize: string;
    giaTang: number;
  };
  tuyChon?: string[];
  topping?: {
    maTopping: string;
    ten: string;
    gia: number;
    soLuong: number;
    _id: string;
  }[];
  ghiChu?: string;
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
  thanhToan: {
    phuongThucThanhToan: string;
    trangThaiThanhToan: string;
  };
  lichSuTrangThai: Array<{
    thoiGian: string;
    trangThaiDonHang: string;
    _id: string;
  }>;
  ghiChu?: string;
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
  maSanPham: string;
  tenSanPham?: string;
  soLuong: number;
  kichCo: {
    tenSize: string;
    giaTang: number;
  };
  tuyChon: Array<string>;
  topping: Array<{
    maTopping: string;
    gia: number;
    soLuong: number;
    _id: string;
  }>;
  thanhTien: number;
  hinhAnh?: string;
  ghiChu: string;
}

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng");
        navigate("/login", { state: { from: `/order-detail/${id}` } });
        return;
      }

      if (!id) {
        toast.error("Không tìm thấy mã đơn hàng");
        navigate("/orders");
        return;
      }

      try {
        setLoading(true);
        // Lấy thông tin đơn hàng
        const response = await getData(`/api/orders/${id}`);
        
        if (!response.success) {
          toast.error("Không thể tải thông tin đơn hàng");
          navigate("/orders");
          return;
        }

        const orderData: OrderResponse = response.data;
        
        // Lấy chi tiết đơn hàng
        const detailsResponse = await getData(`/api/order-details/${id}`);
        
        let items: OrderItem[] = [];
        if (detailsResponse.success) {
          // Xử lý từng chi tiết đơn hàng và lấy thông tin sản phẩm
          items = await Promise.all(detailsResponse.data.map(async (detail: OrderDetailResponse) => {
            // Lấy thông tin sản phẩm để có hình ảnh
            let tenSanPham = "Sản phẩm";
            let hinhAnh = undefined;
            
            try {
              // Kiểm tra xem maSanPham có phải là chuỗi ID hợp lệ không
              const productId = typeof detail.maSanPham === 'object' && detail.maSanPham !== null 
                ? (detail.maSanPham as {_id: string})._id || String(detail.maSanPham)
                : detail.maSanPham;
                
              const productResponse = await getData(`/api/products/${productId}`);
              if (productResponse.success && productResponse.data) {
                tenSanPham = productResponse.data.ten || "Sản phẩm";
                hinhAnh = productResponse.data.hinhAnh || undefined;
              }
            } catch (error) {
              console.error("Lỗi khi lấy thông tin sản phẩm:", error);
            }
            
            // Lấy thông tin topping
            const toppingDetails = await Promise.all(detail.topping.map(async (topping) => {
              try {
                // Kiểm tra xem maTopping có phải là chuỗi ID hợp lệ không
                const toppingId = typeof topping.maTopping === 'object' && topping.maTopping !== null
                  ? (topping.maTopping as { _id: string })._id || String(topping.maTopping)
                  : topping.maTopping;
                  
                const toppingResponse = await getData(`/api/toppings/${toppingId}`);
                return {
                  ...topping,
                  ten: toppingResponse.success ? toppingResponse.data.ten : "Topping"
                };
              } catch (error) {
                console.error("Lỗi khi lấy thông tin topping:", error);
                return {
                  ...topping,
                  ten: "Topping"
                };
              }
            }));
            
            return {
              _id: detail._id,
              maSanPham: detail.maSanPham,
              tenSanPham: detail.tenSanPham || tenSanPham,
              soLuong: detail.soLuong,
              gia: detail.kichCo?.giaTang || 0,
              tongGia: detail.thanhTien || 0,
              hinhAnh: hinhAnh,
              kichCo: detail.kichCo,
              tuyChon: detail.tuyChon,
              topping: toppingDetails,
              ghiChu: detail.ghiChu
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
          const info = orderData.thongTinNguoiNhan;
        
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
          console.error("Lỗi khi parse thông tin người nhận:", error, orderData.thongTinNguoiNhan);
        }              

        // Lấy trạng thái đơn hàng mới nhất từ lichSuTrangThai
        const trangThai = orderData.lichSuTrangThai && orderData.lichSuTrangThai.length > 0
          ? mapTrangThaiDonHang(orderData.lichSuTrangThai[orderData.lichSuTrangThai.length - 1].trangThaiDonHang)
          : TrangThaiDonHang.CHO_XAC_NHAN;

        // Tạo đối tượng đơn hàng
        const processedOrder: Order = {
          _id: orderData._id,
          maHoaDon: orderData._id,
          ngayTao: orderData.ngayTao,
          trangThai: trangThai,
          tongTien: orderData.tongTien || 0,
          thongTinNguoiNhan,
          items,
          thanhToan: orderData.thanhToan,
          lichSuTrangThai: orderData.lichSuTrangThai,
          ghiChu: orderData.ghiChu
        };

        setOrder(processedOrder);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
        toast.error("Đã xảy ra lỗi khi tải đơn hàng");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, navigate]);

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

  // Hàm hiển thị trạng thái thanh toán
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "daThanhToan":
        return { text: "Đã thanh toán", color: "bg-green-100 text-green-800" };
      case "chuaThanhToan":
        return { text: "Chưa thanh toán", color: "bg-amber-100 text-amber-800" };
      default:
        return { text: "Không xác định", color: "bg-gray-100 text-gray-800" };
    }
  };

  // Hàm hiển thị phương thức thanh toán
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)";
      case "banking":
        return "Chuyển khoản ngân hàng";
      case "momo":
        return "Ví MoMo";
      case "zalopay":
        return "ZaloPay";
      default:
        return "Không xác định";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[550px]">
        <Fallback />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16 bg-card rounded-lg shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
          <p className="text-gray-500 mb-6">Đơn hàng không tồn tại hoặc đã bị xóa</p>
          <Button onClick={() => navigate("/orders")}>Quay lại danh sách đơn hàng</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Mã đơn hàng: <span className="font-medium text-gray-700">{order.maHoaDon}</span></p>
                <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.ngayTao)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusText(order.trangThai).color}`}>
                {getStatusText(order.trangThai).text}
              </div>
            </div>

            {/* Lịch sử trạng thái */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Lịch sử trạng thái</h3>
              <div className="space-y-2">
                {order.lichSuTrangThai.map((status, index) => (
                  <div key={status._id} className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                    <div className="text-sm">
                      <span className={`font-medium ${index === order.lichSuTrangThai.length - 1 ? 'text-primary' : ''}`}>
                        {(() => {
                          const statusEnum = mapTrangThaiDonHang(status.trangThaiDonHang);
                          return getStatusText(statusEnum).text;
                        })()}
                      </span>
                      <span className="text-gray-500 ml-2">{formatDate(status.thoiGian)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="p-4">
              <h3 className="font-medium mb-3">Sản phẩm</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item._id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3">
                        {item.hinhAnh ? (
                          <img src={item.hinhAnh} alt={item.tenSanPham} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{item.tenSanPham}</p>
                          <p className="font-medium text-destructive">{formatPrice(item.tongGia)}</p>
                        </div>
                        <p className="text-sm text-gray-500">SL: {item.soLuong} x {formatPrice(item.tongGia / item.soLuong)}</p>
                        
                        {/* Chi tiết sản phẩm */}
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Size: {item.kichCo?.tenSize || 'M'}</p>
                          
                          {item.tuyChon && item.tuyChon.length > 0 && (
                            <p>Tùy chọn: {item.tuyChon.join(', ')}</p>
                          )}
                          
                          {item.topping && item.topping.length > 0 && (
                            <p>Topping: {item.topping.map(t => `${t.ten} (${formatPrice(t.gia)})`).join(', ')}</p>
                          )}
                          
                          {item.ghiChu && (
                            <p className="mt-1 italic">Ghi chú: {item.ghiChu}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Thông tin người nhận */}
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Thông tin người nhận</h3>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Họ tên:</span> {order.thongTinNguoiNhan.ten}</p>
              <p className="text-sm"><span className="font-medium">Số điện thoại:</span> {order.thongTinNguoiNhan.soDienThoai}</p>
              <p className="text-sm"><span className="font-medium">Địa chỉ:</span> {order.thongTinNguoiNhan.diaChi}</p>
              {order.thongTinNguoiNhan.email && (
                <p className="text-sm"><span className="font-medium">Email:</span> {order.thongTinNguoiNhan.email}</p>
              )}
              {order.ghiChu && (
                <p className="text-sm mt-3"><span className="font-medium">Ghi chú đơn hàng:</span> {order.ghiChu}</p>
              )}
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Thông tin thanh toán</h3>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Phương thức:</span> {getPaymentMethodText(order.thanhToan.phuongThucThanhToan)}</p>
              <p className="text-sm flex items-center">
                <span className="font-medium mr-2">Trạng thái:</span> 
                <span className={`px-2 py-0.5 rounded-full text-xs ${getPaymentStatusText(order.thanhToan.trangThaiThanhToan).color}`}>
                  {getPaymentStatusText(order.thanhToan.trangThaiThanhToan).text}
                </span>
              </p>
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Tổng tiền</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>{formatPrice(order.items.reduce((sum, item) => sum + item.tongGia, 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển:</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Giảm giá:</span>
                <span>-{formatPrice(order.items.reduce((sum, item) => sum + item.tongGia, 0) - order.tongTien)}</span>
              </div>
              <div className="border-t pt-3 mt-2 flex justify-between font-medium">
                <span>Tổng cộng:</span>
                <span className="text-destructive text-lg">{formatPrice(order.tongTien)}</span>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col space-y-2">
            {order.trangThai === TrangThaiDonHang.CHO_XAC_NHAN && (
              <Button variant="destructive">Hủy đơn hàng</Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              In đơn hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}