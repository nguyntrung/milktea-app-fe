import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && location.state.orderId) {
      setOrderId(location.state.orderId);
    } else {
      // Nếu không có thông tin đơn hàng, chuyển về trang chủ
      navigate("/");
    }
  }, [location, navigate]);

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-md p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
        </p>
        
        {orderId && (
          <div className="bg-gray-100 rounded-md p-3 mb-6">
            <p className="text-sm text-gray-500">Mã đơn hàng của bạn</p>
            <p className="font-medium">{orderId}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <Link to="/orders">
            <Button variant="outline" className="w-full">Xem đơn hàng của tôi</Button>
          </Link>
          <Link to="/">
            <Button className="w-full">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
