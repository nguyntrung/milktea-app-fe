import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getData, postData } from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Fallback from "@/components/ui/fallback";

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
    return (
      <div className="flex items-center justify-center min-h-[550px]">
        <Fallback />
      </div>
    );
  }

  if (error || !product) {
    return <div className="container mx-auto py-10 text-center text-red-500">{error || "Không tìm thấy sản phẩm"}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Phần hình ảnh */}
        <div>
          <div className="cols-1 bg-gray-100 rounded-lg overflow-hidden mb-4 h-[400px]">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Không có hình ảnh
              </div>
            )}
          </div>
          
          {/* Danh sách hình ảnh nhỏ */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto justify-center">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${selectedImage === image ? 'border-primary' : 'border-transparent'}`}
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
        <div>
          <h1 className="text-3xl font-medium text-primary mb-2">{product.name}</h1>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-medium text-destructive mb-4">
              {formatPrice(product.price)}
            </div>
            {/* Số lượng */}
            <div className="flex items-center">
              <button 
                className="w-7 h-7 rounded-full border flex items-center justify-center bg-primary text-background cursor-pointer"
                onClick={decreaseQuantity}
              >
                <Minus size={14} />
              </button>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))} 
                className="w-8 h-8 border-t border-b text-center p-1 mx-1"
                
              />
              <button 
                className="w-7 h-7 rounded-full border flex items-center justify-center bg-primary text-background cursor-pointer"
                onClick={increaseQuantity}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          {/* <div className="mb-6" dangerouslySetInnerHTML={{ __html: product.description }} /> */}
          
          {/* Lựa chọn kích thước */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Chọn kích cỡ:</h3>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`rounded-md border cursor-pointer flex flex-col items-center`}
                  >
                    <span className={`p-1 w-full font-medium rounded-t-md ${selectedSize === size.id ? 'bg-gray-100' : 'bg-background'}`}>{size.name}</span>
                    <span className={`p-1 w-full text-xs font-medium rounded-b-md ${selectedSize === size.id ? 'bg-primary text-white' : 'bg-gray-100'}`}>
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
                  <p className="font-medium">{option}:</p>
                  <div className="flex flex-wrap gap-2">
                    {['0%', '25%', '50%', '75%', '100%'].map((level, levelIndex) => (
                      <button
                        key={levelIndex}
                        className={`w-1/6 px-3 py-1 text-sm border rounded transition-colors cursor-pointer ${selectedOptions[option] === level ? 'bg-primary text-white' : 'bg-gray-100'}`}
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
          <div className="mb-6">
            <h3 className="font-medium mb-2">{product.toppings.length === 0 ? '' : 'Chọn Topping:'}</h3>
            <div className="space-y-2">
              {product.toppings.map((topping, index) => (
                <div key={index} className="border-b pb-2">
                  <div 
                    className="flex justify-between items-center gap-2 cursor-pointer"
                    onClick={() => {
                      const isSelected = selectedToppings.includes(topping._id);
                      if (isSelected) {
                        setSelectedToppings(selectedToppings.filter(id => id !== topping._id));
                      } else {
                        setSelectedToppings([...selectedToppings, topping._id]);
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <label htmlFor={`topping-${index}`} className="text-sm font-medium">
                        {topping.ten}
                      </label>
                      <span className="text-sm text-gray-600">{formatPrice(topping.gia)}</span>
                    </div>
                    <Checkbox
                      id={`topping-${index}`}
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
          
          {/* Nút mua hàng */}
          <div className="flex gap-4">
            <Button 
              className={`w-auto bg-primary ${product.toppings.length === 0 ? '' : 'm-auto'}`}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2" />
              Thêm vào giỏ hàng : {formatPrice(calculateTotalPrice())}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs thông tin chi tiết */}
      <div className="mt-12 bg-card h-fit w-full rounded-md p-3 shadow-md">
        <div className="font-medium text-xl text-primary mb-2">Mô tả sản phẩm</div>
        <div 
          className="p-5"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
      
      {/* Sản phẩm liên quan */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Phần này sẽ hiển thị các sản phẩm liên quan, có thể thêm sau */}
          <div className="text-center text-gray-500">Chưa có sản phẩm liên quan</div>
        </div>
      </div>
    </div>
  );
}
