import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getData, putData } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Fallback from "@/components/ui/fallback";

// Định nghĩa các trạng thái đơn hàng
const orderStatusMap: Record<string, { label: string; color: string }> = {
  "choXacNhan": { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-800" },
  "dangChuanBi": { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800" },
  "dangGiao": { label: "Đang giao", color: "bg-indigo-100 text-indigo-800" },
  "daGiao": { label: "Đã giao", color: "bg-green-100 text-green-800" },
  "daHuy": { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

// Định nghĩa các trạng thái thanh toán
const paymentStatusMap: Record<string, { label: string; color: string }> = {
  "daThanhToan": { label: "Đã thanh toán", color: "bg-green-100 text-green-800" },
  "chuaThanhToan": { label: "Chưa thanh toán", color: "bg-amber-100 text-amber-800" },
};

// Định nghĩa các phương thức thanh toán
const paymentMethodMap: Record<string, string> = {
  "cod": "Thanh toán khi nhận hàng",
  "banking": "Chuyển khoản ngân hàng",
  "momo": "Ví MoMo",
  "zalopay": "ZaloPay",
};

// Định nghĩa kiểu dữ liệu cho đơn hàng
interface Order {
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
  phiVanChuyen: number;
  tongTienHang: number;
  tongTien: number;
  khuyenMai: Array<{
    maKhuyenMai: string;
    giaTri: number;
  }>;
  nguoiGiao: string;
  thongTinNguoiNhan: string;
  lichSuTrangThai: Array<{
    thoiGian: string;
    trangThaiDonHang: string;
    _id: string;
  }>;
  ghiChu: string;
  thanhToan: {
    phuongThucThanhToan: string;
    trangThaiThanhToan: string;
  };
  ngayTao: string;
  ngayCapNhat: string;
}

// Định nghĩa kiểu dữ liệu cho chi tiết đơn hàng
interface OrderDetail {
  _id: string;
  maHoaDon: string;
  maSanPham: string | {
    _id: string;
    ten: string;
  };
  tenSanPham?: string;
  soLuong: number;
  kichCo: {
    tenSize: string;
    giaTang: number;
  };
  tuyChon: string[];
  topping: Array<{
    maTopping: string | {
      _id: string;
      ten: string;
    };
    ten?: string;
    gia: number;
    soLuong: number;
    _id: string;
  }>;
  thanhTien: number;
  ghiChu?: string;
  hinhAnh?: string | string[]; // Thêm trường hình ảnh có thể là chuỗi hoặc mảng chuỗi
}

export default function OrderDetailManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Lấy thông tin đơn hàng
  const fetchOrder = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await getData(`/api/orders/${id}`);
      if (response.success) {
        setOrder(response.data);
        await fetchOrderDetails(response.data._id);
      } else {
        setError("Không thể tải thông tin đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      setError("Đã xảy ra lỗi khi tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết đơn hàng
  // Trong phần fetchOrderDetails, thêm xử lý để lấy hình ảnh sản phẩm nếu cần
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setDetailsLoading(true);
      const response = await getData(`/api/order-details/${orderId}`);
      if (response.success && Array.isArray(response.data)) {
        // Xử lý dữ liệu chi tiết đơn hàng
        const details = await Promise.all(response.data.map(async (detail: OrderDetail) => {
          // Xác định ID sản phẩm
          let productId = "";
          if (typeof detail.maSanPham === 'object' && detail.maSanPham !== null) {
            productId = detail.maSanPham._id;
          } else {
            productId = detail.maSanPham as string;
          }
          
          // Nếu không có hình ảnh, gọi API để lấy thông tin sản phẩm
          if (!detail.hinhAnh && productId) {
            try {
              const productResponse = await getData(`/api/products/${productId}`);
              if (productResponse.success && productResponse.data) {
                // Gán hình ảnh từ thông tin sản phẩm
                detail.hinhAnh = productResponse.data.hinhAnh;
              }
            } catch (error) {
              console.error("Lỗi khi lấy thông tin sản phẩm:", error);
            }
          }
          
          return detail;
        }));
        
        setOrderDetails(details);
      } else {
        toast.error("Không thể tải chi tiết đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi tải chi tiết đơn hàng");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (status: string) => {
    if (!order) return;
    
    try {
      setStatusUpdating(true);
      const response = await putData(`/api/orders/${order._id}/status`, {
        trangThaiDonHang: status
      });
      
      if (response.success) {
        toast.success("Cập nhật trạng thái đơn hàng thành công");
        
        // Cập nhật lại đơn hàng
        const updatedOrder = { 
          ...order,
          lichSuTrangThai: [
            ...order.lichSuTrangThai,
            {
              thoiGian: new Date().toISOString(),
              trangThaiDonHang: status,
              _id: Date.now().toString() // Tạm thời dùng timestamp làm ID
            }
          ]
        };
        setOrder(updatedOrder);
      } else {
        toast.error("Không thể cập nhật trạng thái đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Lấy trạng thái hiện tại của đơn hàng
  const getCurrentStatus = (order: Order) => {
    if (!order.lichSuTrangThai || order.lichSuTrangThai.length === 0) {
      return "choXacNhan";
    }
    return order.lichSuTrangThai[order.lichSuTrangThai.length - 1].trangThaiDonHang;
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

  // Hàm parse thông tin người nhận từ chuỗi JSON
  const parseReceiverInfo = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Lỗi khi parse thông tin người nhận:", error);
      return { ten: "Không xác định", soDienThoai: "", diaChi: "", email: "" };
    }
  };

  // Tải dữ liệu khi component được mount
  const fetchOrderCallback = useCallback(fetchOrder, [id]);
  useEffect(() => {
    fetchOrderCallback();
  }, [id, fetchOrderCallback]);

  // Xử lý quay lại trang danh sách
  const handleBack = () => {
    navigate("/admin/orders");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Fallback />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">{error || "Không tìm thấy đơn hàng"}</p>
        <Button onClick={handleBack} variant="outline" className="cursor-pointer">
          Quay lại
        </Button>
      </div>
    );
  }

  // Lấy thông tin người nhận
  const receiverInfo = parseReceiverInfo(order.thongTinNguoiNhan);
  
  // Lấy trạng thái hiện tại
  const currentStatus = getCurrentStatus(order);
  const statusInfo = orderStatusMap[currentStatus] || { label: currentStatus, color: "bg-gray-100 text-gray-800" };
  
  // Lấy trạng thái thanh toán
  const paymentStatus = order.thanhToan?.trangThaiThanhToan || "chuaThanhToan";
  const paymentStatusInfo = paymentStatusMap[paymentStatus] || { label: paymentStatus, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="mr-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
        </Button>
        {/* <h1 className="text-2xl font-medium">Chi tiết đơn hàng</h1> */}
        <Button 
          onClick={fetchOrder} 
          variant="outline" 
          size="sm"
          className="ml-auto cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-2 mb-6">
        <div className="flex gap-2">
          <div className="grid grid-cols-1 gap-2 w-[60%]">
            {/* Thông tin đơn hàng */}
            <Card>
              <CardHeader className="pt-4">
                <CardTitle>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Mã đơn hàng:</div>
                  <div className="col-span-3 text-sm font-medium">{order._id}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Ngày đặt:</div>
                  <div className="col-span-3 text-sm">{formatDate(order.ngayLap)}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Khách hàng:</div>
                  <div className="col-span-3 text-sm">{order.maKhachHang?.ten || "Khách vãng lai"}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Trạng thái:</div>
                  <div>
                    <Badge className={`${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Thanh toán:</div>
                  <div>
                    <Badge className={`${paymentStatusInfo.color} col-span-3`}>
                      {paymentStatusInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thông tin người nhận */}
            <Card>
              <CardHeader className="pt-4">
                <CardTitle>Thông tin người nhận</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Họ tên:</div>
                  <div className="col-span-3 text-sm font-medium">{receiverInfo.ten}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Số điện thoại:</div>
                  <div className="col-span-3 text-sm">{receiverInfo.soDienThoai}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm text-muted-foreground">Địa chỉ:</div>
                  <div className="col-span-3 text-sm">{receiverInfo.diaChi}</div>
                </div>
                {receiverInfo.email && (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-sm text-muted-foreground">Email:</div>
                    <div className="col-span-3 text-sm">{receiverInfo.email}</div>
                  </div>
                )}
                {order.ghiChu && (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-sm text-muted-foreground">Ghi chú:</div>
                    <div className="col-span-3 text-sm italic">{order.ghiChu}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2 w-[40%] h-full max-h-screen">
            {/* Phương thức thanh toán (cao theo nội dung) */}
            <Card className="shrink-0">
              <CardHeader className="pt-4">
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-1">
                <img src="https://cdn-icons-png.flaticon.com/512/2331/2331895.png" alt="cod" className="w-8 h-8 mr-2" />
                {paymentMethodMap[order.thanhToan?.phuongThucThanhToan] || order.thanhToan?.phuongThucThanhToan || "Không có"}
              </CardContent>
            </Card>

            {/* Hóa đơn (chiếm phần còn lại) */}
            <Card className="flex flex-col grow min-h-0">
              <CardHeader className="pt-4">
                <CardTitle>Hóa đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 overflow-auto">
                {/* Nội dung hóa đơn giữ nguyên như bạn đã viết */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Tiền sản phẩm:</div>
                  <div className="text-sm text-right">{formatPrice(order.tongTienHang || 0)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Phí vận chuyển:</div>
                  <div className="text-sm text-right">{formatPrice(order.phiVanChuyen)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Giảm giá:</div>
                  <div className="text-sm text-right text-destructive">0 ₫</div>
                </div>
                {order.khuyenMai && order.khuyenMai.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Giảm giá:</div>
                    <div className="text-sm text-right text-red-500">
                      -{formatPrice(order.khuyenMai.reduce((sum, item) => sum + (item.giaTri || 0), 0))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 border-t pt-2">
                  <div className="text-sm font-medium">Doanh thu:</div>
                  <div className="text-lg font-medium text-right text-destructive">{formatPrice(order.tongTien || 0)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products" className="cursor-pointer">Sản phẩm</TabsTrigger>
          <TabsTrigger value="status" className="cursor-pointer">Trạng thái</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <Card>
            <CardHeader className="pt-4">
              <CardTitle>Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Fallback />
                </div>
              ) : orderDetails.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Không có sản phẩm nào
                </div>
              ) : (
                <div className="space-y-4">
                  {orderDetails.map((detail) => {
                    // Xử lý tên sản phẩm
                    const productName = typeof detail.maSanPham === 'object' && detail.maSanPham !== null
                      ? detail.maSanPham.ten
                      : detail.tenSanPham || "Sản phẩm";

                    // Xử lý hình ảnh sản phẩm
                    let productImage = "";
                    if (detail.hinhAnh) {
                      if (Array.isArray(detail.hinhAnh) && detail.hinhAnh.length > 0) {
                        productImage = detail.hinhAnh[0];
                      } else if (typeof detail.hinhAnh === 'string') {
                        productImage = detail.hinhAnh;
                      }
                    }
                    
                    // Tính tổng giá topping
                    //const toppingPrice = detail.topping.reduce((sum, topping) => sum + topping.gia, 0);
                    
                    return (
                      <div key={detail._id} className="flex flex-col md:flex-row border rounded-md p-4">
                        {/* Thêm hình ảnh sản phẩm */}
                        <div className="w-16 h-16 mr-4 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={productName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Xử lý lỗi khi không tải được hình ảnh
                                (e.target as HTMLImageElement).src = '/placeholder.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Size: {detail.kichCo.tenSize} (+{formatPrice(detail.kichCo.giaTang)})
                          </div>
                          
                          {/* Tùy chọn */}
                          {detail.tuyChon && detail.tuyChon.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Tùy chọn: {detail.tuyChon.join(", ")}
                            </div>
                          )}
                          
                          {/* Topping */}
                          {detail.topping && detail.topping.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Topping: {detail.topping.map(t => {
                                const toppingName = typeof t.maTopping === 'object' && t.maTopping !== null
                                  ? t.maTopping.ten
                                  : t.ten || "Topping";
                                return `${toppingName} (+${formatPrice(t.gia)})`;
                              }).join(", ")}
                            </div>
                          )}
                          
                          {/* Ghi chú */}
                          {detail.ghiChu && (
                            <div className="text-sm italic mt-1">
                              Ghi chú: {detail.ghiChu}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-row md:flex-col justify-between items-end mt-2 md:mt-0 md:ml-4 md:min-w-[150px] text-right">
                          <div className="text-xs text-muted-foreground">Số lượng: {detail.soLuong}</div>
                          <div className="font-medium">{formatPrice(detail.thanhTien)}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-lg font-medium">
                      Tổng cộng: {formatPrice(order.tongTien || 0)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pt-4">
              <CardTitle>Lịch sử trạng thái</CardTitle>
              
              {/* Cập nhật trạng thái */}
              <div className="flex items-center space-x-2">
                <Select
                  disabled={statusUpdating || currentStatus === "daGiao" || currentStatus === "daHuy"}
                  onValueChange={updateOrderStatus}
                  defaultValue={currentStatus}
                >
                  <SelectTrigger className="w-[180px] cursor-pointer hidden">
                    <SelectValue placeholder="Cập nhật trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusMap).map(([key, { label }]) => (
                      <SelectItem key={key} value={key} disabled={key === currentStatus} className="cursor-pointer">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={statusUpdating || currentStatus === "daGiao" || currentStatus === "daHuy"}
                >
                  {statusUpdating ? "Đang cập nhật..." : "Cập nhật"}
                </Button> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.lichSuTrangThai && order.lichSuTrangThai.length > 0 ? (
                  <div className="relative border-l-2 pl-4 ml-2 space-y-6">
                    {order.lichSuTrangThai.map((status) => {
                      const statusInfo = orderStatusMap[status.trangThaiDonHang] || 
                        { label: status.trangThaiDonHang, color: "bg-gray-100 text-gray-800" };
                      
                      return (
                        <div key={status._id} className="relative">
                          <div className="absolute -left-[22px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                          <div className="flex flex-col">
                            <Badge className={`${statusInfo.color} w-fit mb-1`}>
                              {statusInfo.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(status.thoiGian)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Không có lịch sử trạng thái
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
