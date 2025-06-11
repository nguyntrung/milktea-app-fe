import { useEffect, useState } from "react";
import { getData, putData, deleteData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { CupSoda, Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Link } from "react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import Fallback from "@/components/ui/fallback";

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

interface CartApiResponse {
  success: boolean;
  data: {
    cart: {
      _id: string;
      maKhachHang: string;
      sanPhams: {
        maSanPham: string | {
          _id: string;
          ten: string;
          hinhAnh: string[];
          giaCoBan: number;
          luaChonSize: {
            tenSize: string;
            giaTang: number;
            thanhPhan: { ten: string; soLuong: number }[];
            _id: string;
          }[];
          toppingCoTheThem: {
            _id: string;
            ten: string;
            gia: number;
            donViTinh: string;
            moTa?: string;
            trangThai: boolean;
          }[];
          tuychon: string[];
        };
        kichThuoc: string;
        tuychon: {
          loai: string;
          muc: string;
          _id: string;
        }[];
        toppings: string[];
        soLuong: number;
        ghiChu: string;
        _id: string;
      }[];
      hoatDong: boolean;
      ngayTao: string;
      ngayCapNhat: string;
    };
    totalPrice: number;
  };
}

interface Promotion {
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
}

interface PromotionApiResponse {
  success: boolean;
  data: Promotion[];
}

interface PopulatedTopping {
  _id: string;
  ten: string;
  gia: number;
}

export default function MyCart() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [shippingFee] = useState<number>(0);
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<{id: string, note: string} | null>(null);
  const [, setIsApplyingDiscount] = useState<boolean>(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Recalculate discount when selected items change
  useEffect(() => {
    if (appliedPromotion) {
      const newDiscountAmount = calculateDiscountAmount(appliedPromotion);
      setDiscountAmount(newDiscountAmount);
    }
  }, [selectedItems, appliedPromotion]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response: CartApiResponse = await getData("/api/carts");
      
      if (!response.success || !response.data || !response.data.cart) {
        throw new Error("Không thể tải thông tin giỏ hàng");
      }
      
      // Cần gọi thêm API để lấy thông tin chi tiết sản phẩm
      const cartItemsWithDetails = await Promise.all(
        response.data.cart.sanPhams.map(async (item) => {
          try {
            // Kiểm tra nếu maSanPham là một đối tượng (đã được populate)
            const productData = typeof item.maSanPham === 'object' ? item.maSanPham : null;
            
            // Nếu đã có dữ liệu sản phẩm từ populate, sử dụng nó
            if (productData) {
              const product = productData;
              const selectedSize = product.luaChonSize.find(
                (size: { tenSize: string }) => size.tenSize === item.kichThuoc
              );
              
              // Lấy thông tin topping
              const toppingDetails = await Promise.all(
                item.toppings.map(async (toppingId: string | PopulatedTopping) => {
                  // Nếu toppingId là object (đã được populate)
                  if (typeof toppingId === 'object' && toppingId !== null) {
                    return {
                      _id: toppingId._id,
                      ten: toppingId.ten,
                      gia: toppingId.gia
                    };
                  }
                  // Nếu toppingId là string, gọi API để lấy thông tin
                  const toppingResponse = await getData(`/api/toppings/${toppingId}`);
                  if (!toppingResponse.success) return null;
                  return {
                    _id: toppingResponse.data._id,
                    ten: toppingResponse.data.ten,
                    gia: toppingResponse.data.gia
                  };
                })
              );
              
              // Tính tổng giá bao gồm cả topping
              const sizePrice = selectedSize ? selectedSize.giaTang : 0;
              const toppingPrice = toppingDetails.reduce(
                (sum, topping) => sum + (topping ? topping.gia : 0), 
                0
              );
              const totalPrice = (product.giaCoBan + sizePrice + toppingPrice) * item.soLuong;
              
              return {
                _id: item._id,
                maSanPham: product._id,
                tenSanPham: product.ten,
                hinhAnh: product.hinhAnh && product.hinhAnh.length > 0 ? product.hinhAnh[0] : "",
                kichThuoc: item.kichThuoc,
                giaSanPham: product.giaCoBan,
                giaSize: sizePrice,
                tuychon: item.tuychon,
                toppings: toppingDetails.filter(Boolean),
                soLuong: item.soLuong,
                ghiChu: item.ghiChu,
                tongGia: totalPrice
              };
            } else {
              // Nếu không có dữ liệu sản phẩm, gọi API để lấy
              const productResponse = await getData(`/api/products/${item.maSanPham}`);
              if (!productResponse.success) {
                throw new Error(`Không thể tải thông tin sản phẩm ${item.maSanPham}`);
              }
              
              const product = productResponse.data;
              const selectedSize = product.luaChonSize.find(
                (size: { tenSize: string }) => size.tenSize === item.kichThuoc
              );
              
              // Tính tổng giá
              const sizePrice = selectedSize ? selectedSize.giaTang : 0;
              const totalPrice = (product.giaCoBan + sizePrice) * item.soLuong;

              console.log("product: ", product)
              
              return {
                _id: item._id,
                maSanPham: item.maSanPham,
                tenSanPham: product.ten,
                hinhAnh: product.hinhAnh && product.hinhAnh.length > 0 ? product.hinhAnh[0] : "",
                kichThuoc: item.kichThuoc,
                giaSanPham: product.giaCoBan,
                giaSize: sizePrice,
                tuychon: item.tuychon,
                toppings: [], // API đã trả về mảng rỗng
                soLuong: item.soLuong,
                ghiChu: item.ghiChu,
                tongGia: totalPrice
              };
            }
          } catch (error) {
            console.error("Lỗi khi tải chi tiết sản phẩm:", error);
            return null;
          }
        })
      );
      
      setCartItems(cartItemsWithDetails.filter(Boolean) as CartItem[]);
      // Mặc định chọn tất cả các sản phẩm
      const validCartItems: CartItem[] = cartItemsWithDetails.filter(Boolean) as CartItem[];

      setCartItems(validCartItems);
      setSelectedItems(validCartItems.map(item => item._id));
      
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
      setError("Không thể tải thông tin giỏ hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const validatePromotion = (promotion: Promotion): { isValid: boolean; message: string } => {
    const now = new Date();
    const startDate = new Date(promotion.thoiGianApDung.batDau);
    const endDate = new Date(promotion.thoiGianApDung.ketThuc);
    
    // Kiểm tra thời gian hiệu lực
    if (now < startDate) {
      return { isValid: false, message: "Mã khuyến mãi chưa có hiệu lực" };
    }
    
    if (now > endDate) {
      return { isValid: false, message: "Mã khuyến mãi đã hết hạn" };
    }
    
    // Kiểm tra số lượng
    if (promotion.soLuong.daSuDung >= promotion.soLuong.tongSoLuong) {
      return { isValid: false, message: "Mã khuyến mãi đã hết lượt sử dụng" };
    }
    
    const subtotal = calculateSubtotal();
    
    // Kiểm tra giá trị tối thiểu của hóa đơn
    if (subtotal < promotion.hoaDonApDung.giaTriToiThieu) {
      return { 
        isValid: false, 
        message: `Đơn hàng cần tối thiểu ${formatPrice(promotion.hoaDonApDung.giaTriToiThieu)}` 
      };
    }
    
    // Kiểm tra sản phẩm áp dụng (nếu là khuyến mãi theo sản phẩm)
    if (promotion.doiTuongKhuyenMai === "sanPham") {
      const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
      const hasApplicableProduct = selectedCartItems.some(item => 
        promotion.sanPhamApDung.includes(item.maSanPham)
      );
      
      if (!hasApplicableProduct) {
        return { isValid: false, message: "Không có sản phẩm nào trong giỏ hàng áp dụng được mã này" };
      }
    }
    
    return { isValid: true, message: "" };
  };

  const calculateDiscountAmount = (promotion: Promotion): number => {
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
    
    if (promotion.doiTuongKhuyenMai === "hoaDon") {
      // Áp dụng cho toàn bộ hóa đơn
      const subtotal = calculateSubtotal();
      
      if (promotion.loaiKhuyenMai === "giamPhanTram") {
        const discountAmount = (subtotal * promotion.giaTri) / 100;
        return Math.min(discountAmount, promotion.hoaDonApDung.giaTriToiDa);
      } else {
        // giamTienMat
        return Math.min(promotion.giaTri, promotion.hoaDonApDung.giaTriToiDa);
      }
    } else {
      // Áp dụng cho sản phẩm cụ thể
      const applicableItems = selectedCartItems.filter(item => 
        promotion.sanPhamApDung.includes(item.maSanPham)
      );
      
      const applicableTotal = applicableItems.reduce((sum, item) => sum + item.tongGia, 0);
      
      if (promotion.loaiKhuyenMai === "giamPhanTram") {
        const discountAmount = (applicableTotal * promotion.giaTri) / 100;
        return Math.min(discountAmount, promotion.hoaDonApDung.giaTriToiDa);
      } else {
        // giamTienMat
        return Math.min(promotion.giaTri, promotion.hoaDonApDung.giaTriToiDa);
      }
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    setIsApplyingDiscount(true);
    
    try {
      // Gọi API để lấy danh sách khuyến mãi
      const response: PromotionApiResponse = await getData("/api/promotions");
      
      if (!response.success) {
        throw new Error("Không thể tải thông tin khuyến mãi");
      }
      
      // Tìm khuyến mãi theo mã
      const promotion = response.data.find(p => p.maKhuyenMai === discountCode.trim());
      
      if (!promotion) {
        setDiscountAmount(0);
        setAppliedPromotion(null);
        toast.error("Mã khuyến mãi không tồn tại");
        return;
      }
      
      // Validate khuyến mãi
      const validation = validatePromotion(promotion);
      
      if (!validation.isValid) {
        setDiscountAmount(0);
        setAppliedPromotion(null);
        toast.error(validation.message);
        return;
      }
      
      // Tính toán số tiền giảm giá
      const discountAmount = calculateDiscountAmount(promotion);
      
      setDiscountAmount(discountAmount);
      setAppliedPromotion(promotion);
      
      toast.success(`Áp dụng mã khuyến mãi thành công! Giảm ${formatPrice(discountAmount)}`);
      
    } catch (error) {
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
      toast.error("Không thể áp dụng mã giảm giá. Vui lòng thử lại.");
      setDiscountAmount(0);
      setAppliedPromotion(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // const handleRemoveDiscount = () => {
  //   setDiscountCode("");
  //   setDiscountAmount(0);
  //   setAppliedPromotion(null);
  //   toast.success("Đã hủy mã giảm giá");
  // };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      // Tìm item trong giỏ hàng
      const itemIndex = cartItems.findIndex(item => item._id === itemId);
      if (itemIndex === -1) return;
      
      // Cập nhật số lượng trong state
      const updatedItems = [...cartItems];
      updatedItems[itemIndex].soLuong = newQuantity;
      updatedItems[itemIndex].tongGia = 
        (updatedItems[itemIndex].giaSanPham + 
         updatedItems[itemIndex].giaSize + 
         updatedItems[itemIndex].toppings.reduce((sum, topping) => sum + topping.gia, 0)) * 
        newQuantity;
      
      setCartItems(updatedItems);
      
      // Gửi request cập nhật lên server sử dụng API mới
      await putData(`/api/carts/items/${itemIndex}`, {
        soLuong: newQuantity,
        ghiChu: updatedItems[itemIndex].ghiChu
      });
      
      toast.success("Đã cập nhật số lượng sản phẩm");
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      toast.error("Không thể cập nhật số lượng sản phẩm");
      // Tải lại giỏ hàng nếu có lỗi
      fetchCartItems();
    }
  };

  const handleUpdateNote = async (itemId: string, note: string) => {
    try {
      // Tìm item trong giỏ hàng
      const itemIndex = cartItems.findIndex(item => item._id === itemId);
      if (itemIndex === -1) return;
      
      // Cập nhật ghi chú trong state
      const updatedItems = [...cartItems];
      updatedItems[itemIndex].ghiChu = note;
      
      setCartItems(updatedItems);
      
      // Gửi request cập nhật lên server sử dụng API mới
      await putData(`/api/carts/items/${itemIndex}`, {
        soLuong: updatedItems[itemIndex].soLuong,
        ghiChu: note
      });
      
      toast.success("Đã cập nhật ghi chú sản phẩm");
      setItemToEdit(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật ghi chú:", error);
      toast.error("Không thể cập nhật ghi chú sản phẩm");
      // Tải lại giỏ hàng nếu có lỗi
      fetchCartItems();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Tìm item trong giỏ hàng
      const itemIndex = cartItems.findIndex(item => item._id === itemId);
      if (itemIndex === -1) return;
      
      // Gửi request xóa lên server sử dụng API mới
      await deleteData(`/api/carts/items/${itemIndex}`);
      
      // Cập nhật state
      setCartItems(cartItems.filter(item => item._id !== itemId));
      setSelectedItems(selectedItems.filter(id => id !== itemId));
      
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      toast.error("Không thể xóa sản phẩm khỏi giỏ hàng");
      // Tải lại giỏ hàng nếu có lỗi
      fetchCartItems();
    }
  };

  const handleClearCart = async () => {
    try {
      // Gửi request xóa toàn bộ giỏ hàng
      await deleteData("/api/carts");
      
      // Cập nhật state
      setCartItems([]);
      setSelectedItems([]);
      setIsDeleteDialogOpen(false);
      
      // Reset discount khi xóa giỏ hàng
      setDiscountCode("");
      setDiscountAmount(0);
      setAppliedPromotion(null);
      
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (error) {
      console.error("Lỗi khi xóa giỏ hàng:", error);
      toast.error("Không thể xóa giỏ hàng");
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const calculateSubtotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + item.tongGia, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingFee - discountAmount;
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }
    
    // Chuyển đến trang thanh toán
    navigate("/checkout", {
      state: {
        items: cartItems.filter(item => selectedItems.includes(item._id)),
        subtotal: calculateSubtotal(),
        shipping: shippingFee,
        discount: discountAmount,
        total: calculateTotal(),
        paymentMethod,
        appliedPromotion,
        maKhuyenMai: appliedPromotion?.maKhuyenMai || null
      }
    });
  };

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[550px]">
        <Fallback />
      </div>
    );    
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      {cartItems.length === 0 ? (
        <div className="text-center py-10">
          <img 
            src="https://saigonpetro.vn/images/cart/cart-empty.png"
            alt="Giỏ hàng trống"
            className="w-100 m-auto"
          />
          <p className="text-gray-500 my-4">Giỏ hàng của bạn đang trống</p>
          <Link to="/products">
            <Button className="bg-primary">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-md shadow-md p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Checkbox 
                    checked={selectedItems.length === cartItems.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    className="mr-2"
                  />
                  <span className="font-medium">Chọn tất cả ({cartItems.length} sản phẩm)</span>
                </div>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-destructive">
                      <Trash2 size={16} className="mr-2" />
                      Xóa tất cả
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận xóa giỏ hàng</DialogTitle>
                    </DialogHeader>
                    <p className="py-4">Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng không?</p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
                      <Button variant="destructive" onClick={handleClearCart}>Xóa tất cả</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {cartItems.map((item) => (
                <div key={item._id} className="border-t py-4">
                  <div className="flex items-start gap-4">
                    <Checkbox 
                      checked={selectedItems.includes(item._id)}
                      onCheckedChange={(checked) => handleItemSelect(item._id, !!checked)}
                      className="mt-2"
                    />
                    
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                      {item.hinhAnh ? (
                        <img 
                          src={item.hinhAnh} 
                          alt={item.tenSanPham} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <CupSoda />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.tenSanPham}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <p>Kích cỡ: {item.kichThuoc}</p>
                        {item.tuychon.length > 0 && (
                          <p>
                            Tùy chọn: {item.tuychon.map(option => `${option.loai}: ${option.muc}`).join(', ')}
                          </p>
                        )}
                        {item.toppings.length > 0 && (
                          <p>
                            Topping: {item.toppings.map(topping => topping.ten).join(', ')}
                          </p>
                        )}
                        <div className="flex items-center mt-1">
                          {item.ghiChu ? (
                            <p>Ghi chú: {item.ghiChu}</p>
                          ) : (
                            <p className="text-gray-400">Không có ghi chú</p>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 h-6 text-primary"
                            onClick={() => setItemToEdit({id: item._id, note: item.ghiChu || ''})}
                          >
                            Sửa
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-destructive font-medium">
                          {formatPrice(item.tongGia / item.soLuong)}
                        </div>
                        <div className="flex items-center">
                          <button 
                            className="w-7 h-7 rounded-full border flex items-center justify-center bg-primary text-background cursor-pointer"
                            onClick={() => handleQuantityChange(item._id, item.soLuong - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <Input
                            value={item.soLuong}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)} 
                            className="w-10 h-8 border-t border-b text-center p-1 mx-1"
                          />
                          <button 
                            className="w-7 h-7 rounded-full border flex items-center justify-center bg-primary text-background cursor-pointer"
                            onClick={() => handleQuantityChange(item._id, item.soLuong + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-destructive"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Thông tin thanh toán */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-md shadow-md p-4 sticky top-39">
              <h2 className="text-xl font-bold mb-4">Thông tin thanh toán</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Tổng tiền tạm tính</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Tổng tiền (Đã có VAT)</span>
                  <span className="text-destructive">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Mã giảm giá"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleApplyDiscount}>Áp dụng</Button>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Phương thức thanh toán</h3>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="payment-cod" />
                    <label htmlFor="payment-cod" className="text-sm font-medium cursor-pointer">
                      Thanh toán khi nhận hàng (COD)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="banking" id="payment-banking" />
                    <label htmlFor="payment-banking" className="text-sm font-medium cursor-pointer">
                      Chuyển khoản ngân hàng
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="momo" id="payment-momo" />
                    <label htmlFor="payment-momo" className="text-sm font-medium cursor-pointer">
                      Ví điện tử MoMo
                    </label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center mb-4">
                <Checkbox
                  id="terms"
                  className="mr-2"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                />
                <label htmlFor="terms" className="text-sm">
                  Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản, điều kiện và chính sách liên quan
                </label>
              </div>
              
              <Button 
                className="w-full bg-primary"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0 || !agreed}
              >
                Tiến hành thanh toán
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog chỉnh sửa ghi chú */}
      {itemToEdit && (
        <Dialog open={!!itemToEdit} onOpenChange={(open) => !open && setItemToEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa ghi chú</DialogTitle>
            </DialogHeader>
            <Textarea 
              placeholder="Nhập ghi chú cho sản phẩm..."
              value={itemToEdit.note}
              onChange={(e) => setItemToEdit({...itemToEdit, note: e.target.value})}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToEdit(null)}>Hủy</Button>
              <Button onClick={() => handleUpdateNote(itemToEdit.id, itemToEdit.note)}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
