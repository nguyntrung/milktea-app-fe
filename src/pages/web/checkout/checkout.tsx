import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { postData, getData, deleteData } from "../../../lib/api";
import { PhuongThucThanhToan, TrangThaiDonHang, TrangThaiThanhToan } from "../../../types/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressAutocomplete from "./address-autocomplete";
import { CupSoda } from "lucide-react";

interface CartItem {
  _id: string;
  maSanPham: string;
  tenSanPham: string;
  hinhAnh: string;
  kichThuoc: string;
  giaSanPham: number;
  giaSize: number;
  tuychon: {
    loai: string;
    muc: string;
    _id: string;
  }[];
  toppings: {
    _id: string;
    ten: string;
    gia: number;
  }[];
  soLuong: number;
  ghiChu: string;
  tongGia: number;
}

interface CheckoutState {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  appliedPromotion?: {
    _id: string;
    maKhuyenMai: string;
    tenKhuyenMai: string;
    moTa: string;
    loaiKhuyenMai: "giamPhanTram" | "giamTienMat";
    doiTuongKhuyenMai: "hoaDon" | "sanPham";
    sanPhamApDung: string[];
    giaTri: number;
    thoiGianApDung: {
      batDau: string;
      ketThuc: string;
    };
    hoaDonApDung: {
      giaTriToiThieu: number;
      giaTriToiDa: number;
    };
    soLuong: {
      tongSoLuong: number;
      daSuDung: number;
      gioiHanMoiNguoiDung: number;
    };
  } | null;
  maKhuyenMai?: string | null;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [customerInfo, setCustomerInfo] = useState({
    ten: "",
    soDienThoai: "",
    diaChi: "",
    email: "",
    ghiChu: ""
  });
  const [errors, setErrors] = useState({
    ten: "",
    soDienThoai: "",
    diaChi: ""
  });
  const [userInfo, setUserInfo] = useState<{
    ten?: string;
    soDienThoai?: string;
    diaChi?: string;
    email?: string;
  } | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [activeTab, setActiveTab] = useState("nguoiNhan");

  // Thêm state để lưu tọa độ và phí ship
  const [, setCoordinates] = useState<{lat: string, lon: string} | null>(null);
  const [, setShippingFee] = useState<number>(0);

  useEffect(() => {
    // Lấy thông tin từ state của location (từ trang giỏ hàng)
    if (location.state) {
      const state = location.state as CheckoutState;
      // Cập nhật initial shipping fee để đảm bảo tính toán ban đầu chính xác
      setShippingFee(state.shipping);
      setCheckoutState(state);
    } else {
      // Nếu không có thông tin, chuyển về trang giỏ hàng
      toast.error("Không có thông tin đơn hàng, vui lòng thử lại");
      navigate("/cart");
    }

    // Lấy thông tin người dùng từ localStorage nếu có
    const savedUserInfo = localStorage.getItem("userInfo");
    if (savedUserInfo) {
      try {
        const parsedInfo = JSON.parse(savedUserInfo);
        setCustomerInfo(prev => ({
          ...prev,
          ten: parsedInfo.ten || "",
          soDienThoai: parsedInfo.soDienThoai || "",
          diaChi: parsedInfo.diaChi || "",
          email: parsedInfo.email || ""
        }));
      } catch (error) {
        console.error("Lỗi khi đọc thông tin người dùng:", error);
      }
    }

    // Lấy thông tin người dùng đăng nhập từ API
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          setIsLoadingUserInfo(true);
          const response = await getData(`/api/auth/${userId}`);
          if (response.success) {
            setUserInfo(response.data);
            
            // Nếu đang ở tab người nhận, tự động điền thông tin
            if (activeTab === "nguoiNhan") {
              setCustomerInfo(prev => ({
                ...prev,
                ten: response.data.ten || "",
                soDienThoai: response.data.soDienThoai || "",
                diaChi: response.data.diaChi || "",
                email: response.data.email || ""
              }));
            }
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
        } finally {
          setIsLoadingUserInfo(false);
        }
      }
    };

    fetchUserInfo();
  }, [location, navigate, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Nếu chuyển sang tab người nhận và có thông tin người dùng
    if (value === "nguoiNhan" && userInfo) {
      setCustomerInfo({
        ten: userInfo.ten || "",
        soDienThoai: userInfo.soDienThoai || "",
        diaChi: userInfo.diaChi || "",
        email: userInfo.email || "",
        ghiChu: customerInfo.ghiChu // Giữ nguyên ghi chú
      });
    } 
    // Nếu chuyển sang tab đặt hộ, sử dụng thông tin đã lưu trước đó
    else if (value === "datHo") {
      const savedUserInfo = localStorage.getItem("userInfo");
      if (savedUserInfo) {
        try {
          const parsedInfo = JSON.parse(savedUserInfo);
          setCustomerInfo(prev => ({
            ...prev,
            ten: parsedInfo.ten || "",
            soDienThoai: parsedInfo.soDienThoai || "",
            diaChi: parsedInfo.diaChi || "",
            email: parsedInfo.email || ""
          }));
        } catch (error) {
          console.error("Lỗi khi đọc thông tin người dùng:", error);
        }
      } else {
        // Nếu không có thông tin đã lưu, xóa thông tin hiện tại
        setCustomerInfo(prev => ({
          ...prev,
          ten: "",
          soDienThoai: "",
          diaChi: "",
          email: ""
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Xóa lỗi khi người dùng nhập
    if (name in errors) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Hàm xử lý thay đổi địa chỉ từ AddressAutocomplete
  const handleAddressChange = (value: string, coords?: {lat: string, lon: string}) => {
    setCustomerInfo(prev => ({
      ...prev,
      diaChi: value
    }));
    
    // Nếu có tọa độ, tính phí ship
    if (coords) {
      setCoordinates(coords);
      
      // Tọa độ cửa hàng (gán cứng)
      const storeLat = 10.807035;
      const storeLon = 106.628703;
      
      // Tính khoảng cách
      const distance = calculateHaversineDistance(
        storeLat,
        storeLon,
        parseFloat(coords.lat),
        parseFloat(coords.lon)
      );
      
      // Tính phí ship
      const fee = calculateShippingFee(distance);
      setShippingFee(fee);
      
      // Cập nhật tổng tiền với phí ship mới
      if (checkoutState) {
        const updatedTotal = checkoutState.subtotal + fee - checkoutState.discount;
        setCheckoutState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shipping: fee,
            total: updatedTotal
          };
        });
        
        // Log để kiểm tra
        console.log(`Shipping fee updated: ${fee}đ, New total: ${updatedTotal}đ`);
      }
    }
    
    // Xóa lỗi khi người dùng nhập
    if (value) {
      setErrors(prev => ({
        ...prev,
        diaChi: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      ten: "",
      soDienThoai: "",
      diaChi: ""
    };
    let isValid = true;

    if (!customerInfo.ten.trim()) {
      newErrors.ten = "Vui lòng nhập họ tên";
      isValid = false;
    }

    if (!customerInfo.soDienThoai.trim()) {
      newErrors.soDienThoai = "Vui lòng nhập số điện thoại";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(customerInfo.soDienThoai.trim())) {
      newErrors.soDienThoai = "Số điện thoại không hợp lệ";
      isValid = false;
    }

    if (!customerInfo.diaChi.trim()) {
      newErrors.diaChi = "Vui lòng nhập địa chỉ";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || !checkoutState) return;
  
    try {
      setLoading(true);
  
      // Tạo đối tượng thông tin người nhận
      const thongTinNguoiNhan = {
        ten: customerInfo.ten,
        soDienThoai: customerInfo.soDienThoai,
        diaChi: customerInfo.diaChi,
        email: customerInfo.email
      };
  
      // Tạo đơn hàng với cấu trúc mới
      const orderData = {
        maKhachHang: localStorage.getItem("userId") || "guest",
        maNhanVien: "680f003b777f9f21543c88c9", // ID nhân viên mặc định
        nguoiGiao: "681b5c598333b96fc916ba43", // ID người giao hàng mặc định
        phiVanChuyen: checkoutState.shipping,
        thongTinNguoiNhan: JSON.stringify(thongTinNguoiNhan), // Chuyển thành string JSON
        khuyenMai: checkoutState.discount > 0 && checkoutState.maKhuyenMai ? [
          {
            maKhuyenMai: checkoutState.maKhuyenMai // Sử dụng mã khuyến mãi thực tế từ my-cart
          }
        ] : [],
        thanhToan: {
          phuongThucThanhToan: PhuongThucThanhToan.COD,
          trangThaiThanhToan: TrangThaiThanhToan.CHUA_THANH_TOAN
        },
        ghiChu: customerInfo.ghiChu || "Không có",
        // Thêm các trường bổ sung nếu cần
        ngayLap: new Date().toISOString(),
        tongTienHang: checkoutState.subtotal,
        tongTien: checkoutState.total,
        lichSuTrangThai: [{
          thoiGian: new Date().toISOString(),
          trangThaiDonHang: TrangThaiDonHang.CHO_XAC_NHAN
        }]
      };
  
      console.log("Order data being sent:", orderData);
      console.log("Applied promotion code:", checkoutState.maKhuyenMai);
  
      const orderResponse = await postData("/api/orders", orderData);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Không thể tạo đơn hàng");
      }
  
      const orderId = orderResponse.data._id;
  
      // Tạo chi tiết đơn hàng
      const orderDetailPromises = checkoutState.items.map(item => {
        const orderDetailData = {
          maHoaDon: orderId,
          maSanPham: item.maSanPham,
          soLuong: item.soLuong,
          kichCo: {
            tenSize: item.kichThuoc,
            giaTang: item.giaSize
          },
          tuyChon: item.tuychon.map(option => `${option.loai}:${option.muc}`),
          topping: item.toppings.map(topping => ({
            maTopping: topping._id,
            gia: topping.gia,
            soLuong: 1
          })),
          ghiChu: item.ghiChu || ""
        };
        return postData("/api/order-details", orderDetailData);
      });
  
      await Promise.all(orderDetailPromises);
  
      // Xóa giỏ hàng và gửi sự kiện
      try {
        const userId = localStorage.getItem("userId");
        console.log("Attempting to clear cart for user:", userId);
        const clearResult = await deleteData("/api/carts");
        if (clearResult.success) {
          console.log("Cart cleared successfully:", clearResult);
          // Gửi sự kiện tùy chỉnh để thông báo giỏ hàng đã được xóa
          const event = new CustomEvent("cartUpdated", {
            detail: { cart: { items: [], total: 0 } }
          });
          window.dispatchEvent(event);
        } else {
          console.error("Failed to clear cart:", clearResult.message || clearResult);
        }
      } catch (error) {
        console.error("Lỗi khi xóa giỏ hàng:", error);
        // Vẫn gửi sự kiện để đảm bảo header cập nhật
        const event = new CustomEvent("cartUpdated", {
          detail: { cart: { items: [], total: 0 } }
        });
        window.dispatchEvent(event);
      }
  
      // Lưu thông tin người dùng
      localStorage.setItem("userInfo", JSON.stringify({
        ten: customerInfo.ten,
        soDienThoai: customerInfo.soDienThoai,
        diaChi: customerInfo.diaChi,
        email: customerInfo.email
      }));
  
      // Thông báo và chuyển hướng
      toast.success("Đặt hàng thành công!");
      setTimeout(() => {
        navigate("/order-success", {
          state: { orderId },
          replace: true
        });
      }, 1000);
  
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error("Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Hàm tính khoảng cách và phí ship
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

  if (!checkoutState) {
    return (
      <div className="flex justify-center items-center w-full h-64 mt-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Đang tải thông tin...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thông tin giao hàng */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-md shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
            
            <Tabs defaultValue="nguoiNhan" value={activeTab} onValueChange={handleTabChange} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nguoiNhan">Người nhận</TabsTrigger>
                <TabsTrigger value="datHo">Đặt hộ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="nguoiNhan" className="mt-4">
                {isLoadingUserInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-2"></div>
                    <span>Đang tải thông tin...</span>
                  </div>
                ) : !userInfo ? (
                  <div className="text-center py-4 text-amber-600">
                    <p>Bạn chưa đăng nhập hoặc không tìm thấy thông tin tài khoản.</p>
                    <p>Vui lòng đăng nhập hoặc chuyển sang tab "Đặt hộ" để nhập thông tin.</p>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ten">Họ tên người nhận <span className="text-red-500">*</span></Label>
                <Input
                  id="ten"
                  name="ten"
                  value={customerInfo.ten}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên người nhận"
                  className={errors.ten ? "border-red-500" : ""}
                  readOnly={activeTab === "nguoiNhan" && userInfo !== null}
                />
                {errors.ten && <p className="text-red-500 text-sm mt-1">{errors.ten}</p>}
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="soDienThoai">Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  id="soDienThoai"
                  name="soDienThoai"
                  value={customerInfo.soDienThoai}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className={errors.soDienThoai ? "border-red-500" : ""}
                  readOnly={activeTab === "nguoiNhan" && userInfo !== null}
                />
                {errors.soDienThoai && <p className="text-red-500 text-sm mt-1">{errors.soDienThoai}</p>}
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="diaChi">Địa chỉ giao hàng <span className="text-red-500">*</span></Label>
                {/* Thay thế Input component bằng AddressAutocomplete */}
                <AddressAutocomplete
                  id="diaChi"
                  name="diaChi"
                  value={customerInfo.diaChi}
                  onChange={handleAddressChange}
                  placeholder="Nhập địa chỉ giao hàng"
                  hasError={!!errors.diaChi}
                  // readOnly={activeTab === "nguoiNhan" && userInfo !== null}
                  calculateDistance={true}
                />
                {errors.diaChi && <p className="text-red-500 text-sm mt-1">{errors.diaChi}</p>}
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email (không bắt buộc)"
                  type="email"
                  readOnly={activeTab === "nguoiNhan" && userInfo !== null}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="ghiChu">Ghi chú</Label>
                <Textarea
                  id="ghiChu"
                  name="ghiChu"
                  value={customerInfo.ghiChu}
                  onChange={handleInputChange}
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-md shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
            
            <RadioGroup defaultValue="cod" className="space-y-3">
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="cod" id="cod" checked />
                <Label htmlFor="cod" className="flex items-center">
                  <img src="https://cdn-icons-png.flaticon.com/512/2331/2331895.png" alt="COD" className="w-8 h-8 mr-2" />
                  Thanh toán khi nhận hàng (COD)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-md shadow-md p-6 sticky top-39">
            <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="max-h-[300px] overflow-y-auto mb-4">
              {checkoutState.items.map((item) => (
                <div key={item._id} className="flex items-start py-3 border-b">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3">
                    {item.hinhAnh ? (
                      <img src={item.hinhAnh} alt={item.tenSanPham} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <CupSoda />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.tenSanPham}</h3>
                    <p className="text-xs text-gray-500">
                      {item.kichThuoc}
                      {item.tuychon.length > 0 && `, ${item.tuychon.map(option => `${option.loai}: ${option.muc}`).join(', ')}`}
                    </p>
                    {item.toppings.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Topping: {item.toppings.map(topping => topping.ten).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatPrice(item.tongGia)}</p>
                    <p className="text-xs text-gray-500">x{item.soLuong}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 py-3 border-b">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatPrice(checkoutState.subtotal)}</span>
              </div>
              {/* Hiển thị phí ship dựa trên shippingFee state thay vì checkoutState.shipping */}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(checkoutState.shipping)}</span>
              </div>
              {checkoutState.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(checkoutState.discount)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between py-3 font-bold">
              <span>Tổng cộng</span>
              <span className="text-xl text-primary">{formatPrice(checkoutState.total)}</span>
            </div>
            
            <Button 
              className="w-full mt-4 py-6" 
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                "Đặt hàng"
              )}
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Bằng cách đặt hàng, bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
