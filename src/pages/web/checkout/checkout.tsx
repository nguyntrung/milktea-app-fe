import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { postData, getData, deleteData, putData } from "../../../lib/api";
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
  const [paymentMethod, setPaymentMethod] = useState<PhuongThucThanhToan>(PhuongThucThanhToan.COD);
  const [, setCoordinates] = useState<{lat: string, lon: string} | null>(null);
  const [, setShippingFee] = useState<number>(0);

  useEffect(() => {
    if (location.state) {
      const state = location.state as CheckoutState;
      setShippingFee(state.shipping);
      setCheckoutState(state);
    } else {
      toast.error("Không có thông tin đơn hàng, vui lòng thử lại");
      navigate("/cart");
    }

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

    const fetchUserInfo = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          setIsLoadingUserInfo(true);
          const response = await getData(`/api/auth/${userId}`);
          if (response.success) {
            setUserInfo(response.data);
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
    if (value === "nguoiNhan" && userInfo) {
      setCustomerInfo({
        ten: userInfo.ten || "",
        soDienThoai: userInfo.soDienThoai || "",
        diaChi: userInfo.diaChi || "",
        email: userInfo.email || "",
        ghiChu: customerInfo.ghiChu
      });
    } else if (value === "datHo") {
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
    if (name in errors) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleAddressChange = (value: string, coords?: {lat: string, lon: string}) => {
    setCustomerInfo(prev => ({
      ...prev,
      diaChi: value
    }));
    if (coords) {
      setCoordinates(coords);
      const storeLat = 10.807035;
      const storeLon = 106.628703;
      const distance = calculateHaversineDistance(
        storeLat,
        storeLon,
        parseFloat(coords.lat),
        parseFloat(coords.lon)
      );
      const fee = calculateShippingFee(distance);
      setShippingFee(fee);
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
      }
    }
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

  const calculateRewardPoints = (totalAmount: number): number => {
    return Math.floor(totalAmount * 0.05);
  };

  const updateUserRewardPoints = async (userId: string, points: number, orderId: string) => {
    try {
      const userResponse = await getData(`/api/auth/${userId}`);
      if (!userResponse.success) {
        throw new Error("Không thể lấy thông tin người dùng");
      }
      const currentUser = userResponse.data;
      const newPoints = (currentUser.diemTichLuy || 0) + points;
      const newPointHistory = {
        loai: "cong",
        diem: points,
        lyDo: `Tích điểm từ đơn hàng #${orderId}`,
        ngayTao: new Date().toISOString()
      };
      const updateData = {
        diemTichLuy: newPoints,
        lichSuDiem: [...(currentUser.lichSuDiem || []), newPointHistory]
      };
      const updateResponse = await putData(`/api/auth/${userId}`, updateData);
      if (updateResponse.success) {
        return true;
      } else {
        throw new Error(updateResponse.message || "Không thể cập nhật điểm tích lũy");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật điểm tích lũy:", error);
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || !checkoutState) return;

    try {
      setLoading(true);

      const thongTinNguoiNhan = {
        ten: customerInfo.ten,
        soDienThoai: customerInfo.soDienThoai,
        diaChi: customerInfo.diaChi,
        email: customerInfo.email
      };

      const orderData = {
        maKhachHang: localStorage.getItem("userId") || "guest",
        maNhanVien: "680f003b777f9f21543c88c9",
        nguoiGiao: "681b5c598333b96fc916ba43",
        phiVanChuyen: checkoutState.shipping,
        thongTinNguoiNhan: JSON.stringify(thongTinNguoiNhan),
        khuyenMai: checkoutState.discount > 0 && checkoutState.maKhuyenMai ? [
          { maKhuyenMai: checkoutState.maKhuyenMai }
        ] : [],
        thanhToan: {
          phuongThucThanhToan: paymentMethod,
          trangThaiThanhToan: paymentMethod === PhuongThucThanhToan.COD
            ? TrangThaiThanhToan.CHUA_THANH_TOAN
            : TrangThaiThanhToan.CHUA_THANH_TOAN
        },
        ghiChu: customerInfo.ghiChu || "Không có",
        ngayLap: new Date().toISOString(),
        tongTienHang: checkoutState.subtotal,
        tongTien: checkoutState.total,
        lichSuTrangThai: [{
          thoiGian: new Date().toISOString(),
          trangThaiDonHang: TrangThaiDonHang.CHO_XAC_NHAN
        }]
      };

      console.log("Order data being sent:", orderData);

      const orderResponse = await postData("/api/orders", orderData);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Không thể tạo đơn hàng");
      }

      const orderId = orderResponse.data._id;

      // Create order details
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

      // Handle VNPAY payment
      if (paymentMethod === PhuongThucThanhToan.VNPAY) {
        const ipAddr = '127.0.0.1'; // In a real application, get client IP
        const vnpayData = {
          orderId: orderId,
          amount: checkoutState.total,
          orderInfo: `Thanh toan don hang ${orderId}`,
          ipAddr: ipAddr
        };

        const vnpayResponse = await postData("/api/vnpay/create_payment_url", vnpayData);
        if (vnpayResponse.success) {
          // Redirect to VNPAY payment page
          window.location.href = vnpayResponse.data.paymentUrl;
          return;
        } else {
          throw new Error(vnpayResponse.message || "Không thể tạo URL thanh toán VNPAY");
        }
      }

      // For COD, proceed with reward points and cart clearing
      const userId = localStorage.getItem("userId");
      if (userId && userId !== "guest") {
        const rewardPoints = calculateRewardPoints(checkoutState.total);
        const pointsUpdated = await updateUserRewardPoints(userId, rewardPoints, orderId);
        if (pointsUpdated) {
          toast.success(`Bạn đã được cộng ${rewardPoints.toLocaleString('vi-VN')} điểm tích lũy!`, {
            duration: 3000,
          });
        }
      }

      try {
        const clearResult = await deleteData("/api/carts");
        if (clearResult.success) {
          const event = new CustomEvent("cartUpdated", {
            detail: { cart: { items: [], total: 0 } }
          });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error("Lỗi khi xóa giỏ hàng:", error);
        const event = new CustomEvent("cartUpdated", {
          detail: { cart: { items: [], total: 0 } }
        });
        window.dispatchEvent(event);
      }

      localStorage.setItem("userInfo", JSON.stringify({
        ten: customerInfo.ten,
        soDienThoai: customerInfo.soDienThoai,
        diaChi: customerInfo.diaChi,
        email: customerInfo.email
      }));

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const calculateShippingFee = (distance: number): number => {
    if (distance <= 2) return 15000;
    else if (distance <= 5) return 20000;
    else if (distance <= 10) return 30000;
    else return 40000;
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
                <AddressAutocomplete
                  id="diaChi"
                  name="diaChi"
                  value={customerInfo.diaChi}
                  onChange={handleAddressChange}
                  placeholder="Nhập địa chỉ giao hàng"
                  hasError={!!errors.diaChi}
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
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PhuongThucThanhToan)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value={PhuongThucThanhToan.COD} id="cod" />
                <Label htmlFor="cod" className="flex items-center">
                  <img src="https://cdn-icons-png.flaticon.com/512/2331/2331895.png" alt="COD" className="w-8 h-8 mr-2" />
                  Thanh toán khi nhận hàng (COD)
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value={PhuongThucThanhToan.VNPAY} id="vnpay" />
                <Label htmlFor="vnpay" className="flex items-center">
                  <img src="https://static.cdnlogo.com/logos/v/99/vnpay.svg" alt="VNPAY" className="w-8 h-8 mr-2" />
                  Ví điện tử VNPAY
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
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
