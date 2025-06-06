import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getData, postData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductSize {
  id: string;
  name: string;
  priceIncrease: number;
  ingredients: {
    id: string;
    materialId: string | null;
    amount: number;
    unit: string;
  }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: ProductSize[];
  images: string[];
  toppings: {
    _id: string;
    ten: string;
    gia: number;
  }[];
  options: string[];
  recipe: string;
  active: boolean;
}

interface ProductApiResponse {
  _id: string;
  ten: string;
  moTa: string;
  giaCoBan: number;
  luaChonSize: {
    _id: string;
    tenSize: string;
    giaTang: number;
    thanhPhan: {
      _id: string;
      maNguyenLieu: string | null;
      soLuong: number;
      donViTinh: string;
    }[];
  }[];
  hinhAnh: string[];
  toppingCoTheThem: {
    _id: string;
    ten: string;
    gia: number;
    hoatDong: boolean;
  }[];
  tuychon: string[];
  congThuc: string;
  hoatDong: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ProductApiResponse;
}

// Product Detail Skeleton Component
const ProductDetailSkeleton = () => (
  <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Image Section Skeleton */}
      <div className="order-1">
        <div className="aspect-square bg-gray-200 rounded-lg animate-pulse mb-4"></div>
        <div className="flex gap-2 justify-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Product Info Section Skeleton */}
      <div className="order-2">
        <div className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Size Options Skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-1/4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Options Skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-1/3"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Toppings Skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Add to Cart Button Skeleton */}
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Description Section Skeleton */}
    <div className="mt-8 lg:mt-12">
      <div className="bg-gray-50 rounded-md p-4 sm:p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response: ApiResponse = await getData(`/api/products/${id}`);
        
        if (!response.success || !response.data) {
          throw new Error("Không thể tải thông tin sản phẩm");
        }
        
        const item = response.data;
        const formattedProduct: Product = {
          id: item._id,
          name: item.ten,
          price: item.giaCoBan,
          description: item.moTa,
          sizes: item.luaChonSize.map(size => ({
            id: size._id,
            name: size.tenSize,
            priceIncrease: size.giaTang,
            ingredients: size.thanhPhan.map(ingredient => ({
              id: ingredient._id,
              materialId: ingredient.maNguyenLieu,
              amount: ingredient.soLuong,
              unit: ingredient.donViTinh
            }))
          })),
          images: item.hinhAnh,
          toppings: item.toppingCoTheThem,
          options: item.tuychon,
          recipe: item.congThuc,
          active: item.hoatDong
        };
        
        setProduct(formattedProduct);
        
        // Thiết lập kích thước mặc định là kích thước đầu tiên
        if (formattedProduct.sizes.length > 0) {
          setSelectedSize(formattedProduct.sizes[0].id);
        }
        
        // Thiết lập hình ảnh mặc định là hình ảnh đầu tiên
        if (formattedProduct.images.length > 0) {
          setSelectedImage(formattedProduct.images[0]);
        }

        if (formattedProduct.options.length > 0) {
          const defaultOptions: Record<string, string> = {};
          formattedProduct.options.forEach(option => {
            defaultOptions[option] = '100%';
          });
          setSelectedOptions(defaultOptions);
        }

      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Tính tổng giá dựa trên kích thước đã chọn và topping
  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    const selectedSizeObj = product.sizes.find(size => size.id === selectedSize);
    const sizePrice = selectedSizeObj ? selectedSizeObj.priceIncrease : 0;
    
    // Tính tổng giá topping
    let toppingPrice = 0;
    selectedToppings.forEach(toppingId => {
      const topping = product.toppings.find(t => t._id === toppingId);
      if (topping) {
        toppingPrice += topping.gia;
      }
    });
    
    return (product.price + sizePrice + toppingPrice) * quantity;
  };

  // Tăng số lượng
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  // Giảm số lượng
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleOptionLevelChange = (option: string, level: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: level
    }));
  };

  // Hàm thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      // Lấy thông tin size đã chọn
      const selectedSizeObj = product.sizes.find(size => size.id === selectedSize);
      if (!selectedSizeObj) {
        toast.error("Vui lòng chọn kích thước");
        return;
      }
      
      // Chuẩn bị dữ liệu để gửi lên server
      const cartItem = {
        maSanPham: product.id,
        kichThuoc: selectedSizeObj.name,
        soLuong: quantity,
        tuychon: Object.entries(selectedOptions).map(([loai, muc]) => ({
          loai,
          muc
        })),
        toppings: selectedToppings,
        ghiChu: ""
      };
      
      // Thêm sản phẩm vào giỏ hàng sử dụng API mới
      try {
        const response = await postData("/api/carts/items", cartItem);
        
        if (response.success) {
          toast.success("Đã thêm sản phẩm vào giỏ hàng");
          // Thông báo cho header biết giỏ hàng đã được cập nhật
          window.dispatchEvent(new CustomEvent('cart-updated'));
        } else {
          toast.error("Không thể thêm sản phẩm vào giỏ hàng: " + response.message);
        }
      } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.313 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{error || "Không tìm thấy sản phẩm"}</p>
          <Button onClick={() => window.location.reload()} className="px-4 sm:px-6 py-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Phần hình ảnh */}
        <div className="order-1">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Không có hình ảnh</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Danh sách hình ảnh nhỏ */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto justify-center pb-2">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`min-w-[60px] w-15 h-15 sm:min-w-[80px] sm:w-20 sm:h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                    selectedImage === image 
                      ? 'border-primary shadow-md' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} - ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Phần thông tin sản phẩm */}
        <div className="order-2">
          <h1 className="text-2xl sm:text-3xl font-medium text-primary mb-3 sm:mb-4">{product.name}</h1>
          
          <div className="flex sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="text-xl sm:text-2xl font-medium text-destructive">
              {formatPrice(product.price)}
            </div>
            
            {/* Số lượng */}
            <div className="flex items-center justify-end">
              <button 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center bg-primary text-background hover:bg-primary/90 transition-colors"
                onClick={decreaseQuantity}
              >
                <Minus size={isMobile ? 14 : 16} />
              </button>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 sm:w-14 h-8 sm:h-9 border-t border-b text-center p-1 mx-2 text-sm sm:text-base"
                min="1"
                type="number"
              />
              <button 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center bg-primary text-background hover:bg-primary/90 transition-colors"
                onClick={increaseQuantity}
              >
                <Plus size={isMobile ? 14 : 16} />
              </button>
            </div>
          </div>
          
          {/* Lựa chọn kích thước */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-sm sm:text-base">Chọn kích cỡ:</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className="rounded-md border cursor-pointer flex flex-col items-center hover:shadow-md transition-all duration-200"
                  >
                    <span className={`p-2 sm:p-3 w-full font-medium text-xs sm:text-sm rounded-t-md transition-colors ${
                      selectedSize === size.id ? 'bg-gray-100' : 'bg-background hover:bg-gray-50'
                    }`}>
                      {size.name}
                    </span>
                    <span className={`p-2 sm:p-3 w-full text-xs font-medium rounded-b-md transition-colors ${
                      selectedSize === size.id ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}>
                      {size.priceIncrease > 0 ? `+${formatPrice(size.priceIncrease)}` : '+0 đ'}
                    </span>
                  </button>                
                ))}
              </div>
            </div>
          )}
          
          {/* Tùy chọn */}
          {product.options.length > 0 && (
            <div className="space-y-4 mb-6">
              {product.options.map((option, index) => (
                <div key={index} className="space-y-2">
                  <p className="font-medium text-sm sm:text-base">{option}:</p>
                  <div className="flex flex-wrap gap-2">
                    {['0%', '25%', '50%', '75%', '100%'].map((level, levelIndex) => (
                      <button
                        key={levelIndex}
                        className={`flex-1 min-w-[50px] sm:min-w-[60px] px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded transition-all duration-200 ${
                          selectedOptions[option] === level 
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                        }`}
                        onClick={() => handleOptionLevelChange(option, level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chọn topping */}
          {product.toppings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-sm sm:text-base">Chọn Topping:</h3>
              <div className="space-y-3">
                {product.toppings.map((topping, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div 
                      className="flex justify-between items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                      onClick={() => {
                        const isSelected = selectedToppings.includes(topping._id);
                        if (isSelected) {
                          setSelectedToppings(selectedToppings.filter(id => id !== topping._id));
                        } else {
                          setSelectedToppings([...selectedToppings, topping._id]);
                        }
                      }}
                    >
                      <div className="flex flex-col flex-1">
                        <label className="text-sm sm:text-base font-medium cursor-pointer">
                          {topping.ten}
                        </label>
                        <span className="text-xs sm:text-sm text-gray-600">{formatPrice(topping.gia)}</span>
                      </div>
                      <Checkbox
                        checked={selectedToppings.includes(topping._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedToppings([...selectedToppings, topping._id]);
                          } else {
                            setSelectedToppings(selectedToppings.filter(id => id !== topping._id));
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Nút mua hàng */}
          <div className="sticky bottom-4 sm:static">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 sm:py-4 text-sm sm:text-base shadow-lg sm:shadow-md transition-all duration-300"
              onClick={handleAddToCart}
              size={isMobile ? "default" : "lg"}
            >
              <ShoppingCart className="mr-2" size={isMobile ? 16 : 18} />
              {isMobile ? "Thêm vào giỏ" : "Thêm vào giỏ hàng"} : {formatPrice(calculateTotalPrice())}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs thông tin chi tiết */}
      <div className="mt-8 lg:mt-12 bg-card rounded-md p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="font-medium text-lg sm:text-xl text-primary mb-3 sm:mb-4">Mô tả sản phẩm</div>
        <div 
          className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
      
      {/* Sản phẩm liên quan */}
      <div className="mt-8 lg:mt-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Sản phẩm liên quan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm sm:text-base">Chưa có sản phẩm liên quan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
