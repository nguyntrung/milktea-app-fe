import { useEffect, useState } from "react";
import { getData } from "../../../lib/api";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import Fallback from "@/components/ui/fallback";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: {
    name: string;
    priceIncrease: number;
  }[];
  image?: string;
}

interface ProductApiResponse {
  _id: string;
  ten: string;
  moTa: string;
  giaCoBan: number;
  luaChonSize: {
    tenSize: string;
    giaTang: number;
    thanhPhan: { ten: string; soLuong: number }[];
    _id: string;
  }[];
  hinhAnh: string[];
  toppingCoTheThem: {
    ten: string;
    gia: number;
    _id: string;
  }[];
  tuychon: string[];
  hoatDong: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ProductApiResponse[];
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response: ApiResponse = await getData("/api/products");
        
        if (!response.success) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }
        
        const formattedProducts: Product[] = response.data.map((item: ProductApiResponse) => ({
          id: item._id,
          name: item.ten,
          price: item.giaCoBan,
          description: item.moTa.replace(/<[^>]*>/g, ''), 
          sizes: item.luaChonSize.map(size => ({
            name: size.tenSize,
            priceIncrease: size.giaTang
          })),
          image: item.hinhAnh && item.hinhAnh.length > 0 ? item.hinhAnh[0] : undefined
        }));
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return <div className="mt-30"><Fallback /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[550px]">
        <Fallback />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Danh sách sản phẩm</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <Link to={`/products/${product.id}`} className="block">
                <div className="h-70 bg-gray-200 relative">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Không có hình ảnh
                    </div>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="font-medium mt-2">{product.name}</CardTitle>
                </CardHeader>
              </Link>
                
              <CardContent className="col-1 font-medium text-destructive">
                {formatPrice(product.price)}
              </CardContent>
              
              <CardFooter className="flex justify-between items-center">
                <Link to={`/products/${product.id}`} className="w-[80%]">
                  <Button className="bg-primary rounded-md transition-colors w-full">
                    Mua ngay
                  </Button>
                </Link>
                <Button 
                  variant={"outline"}
                  className="px-4 py-2 rounded-md transition-colors">
                  <ShoppingCart />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            Không có sản phẩm nào
          </div>
        )}
      </div>
    </div>
  );
}