import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, Box, LogOut, Menu, ShoppingCart, Store, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getData } from "@/lib/api";
import SearchComponent from "./search";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

// interface StoreInfo {
//   logo: string;
//   ten: string;
//   diaChi: string;
//   soDienThoai: string;
//   email: string;
//   website: string;
// }

function Header({ isLoggedIn, setIsLoggedIn, isAdmin, setIsAdmin }: HeaderProps) {
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [storeLogo, setStoreLogo] = useState<string>("https://res.cloudinary.com/db4xiceow/image/upload/v1747460240/logo-no-background.png");

  useEffect(() => {
    // Lấy thông tin cửa hàng từ API
    const fetchStoreInfo = async () => {
      try {
        const response = await getData("/api/store");
        if (response.success && response.data && response.data.logo) {
          setStoreLogo(response.data.logo);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin cửa hàng:", error);
      }
    };
    
    fetchStoreInfo();
    
    // Lấy số lượng sản phẩm trong giỏ hàng khi component được mount
    if (isLoggedIn) {
      fetchCartItemCount();
    }

    // Lắng nghe sự kiện khi có sản phẩm được thêm vào giỏ hàng
    window.addEventListener('cart-updated', fetchCartItemCount);
    
    return () => {
      window.removeEventListener('cart-updated', fetchCartItemCount);
    };
  }, [isLoggedIn]);

  const fetchCartItemCount = async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await getData("/api/carts");
      if (response.success && response.data && response.data.cart) {
        const count = response.data.cart.sanPhams.length;
        setCartItemCount(count);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin giỏ hàng:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/");
  };

  const handleSwitchToAdmin = () => {
    setIsAdmin(true);
    navigate("/admin");
  };

  // Các mục menu cho mobile
  const renderMobileMenuItems = () => (
    <div className="flex flex-col space-y-4 py-4">
      {isLoggedIn ? (
        <>
          <div className="flex items-center space-x-2 px-4 py-2">
            <img src="https://fsviet.com/image/data/decaltrasua/logo-tra-sua-dep.jpg" alt="" className="w-8 h-8 rounded-full" />
            <span>demo</span>
          </div>
          <div className="border-t pt-4">
            <div onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-4 py-2 hover:bg-muted cursor-pointer">
              <User size={18} />
              <span>Tài khoản của tôi</span>
            </div>
            {isAdmin && (
              <div onClick={() => { handleSwitchToAdmin(); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-4 py-2 hover:bg-muted cursor-pointer">
                <Store size={18} />
                <span>Kênh Người Bán</span>
              </div>
            )}
            <div onClick={() => { navigate("/orders"); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-4 py-2 hover:bg-muted cursor-pointer">
              <Box size={18} />
              <span>Đơn hàng của tôi</span>
            </div>
            <div onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-4 py-2 hover:bg-muted cursor-pointer text-red-500">
              <LogOut size={18} className="text-red-500" />
              <span>Đăng Xuất</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col space-y-2 px-4">
          <Button variant="ghost" onClick={() => { navigate("/signup"); setIsMenuOpen(false); }} className="justify-start">Đăng ký</Button>
          <Button variant="outline" onClick={() => { navigate("/sign-in"); setIsMenuOpen(false); }} className="justify-start">Đăng nhập</Button>
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background shadow-md">
      <div className="max-w-[1200px] m-auto flex justify-between items-center py-2 px-4 md:px-2">
        {/* Logo */}
        <div className="flex items-center">
          <Link to={'/'} className="flex items-center">
            <img 
              className="w-20 md:w-25" 
              src={storeLogo} 
              alt="Logo" 
            />
          </Link>
        </div>
        
        {/* Search Component - Ẩn trên mobile, hiển thị đầy đủ trên desktop */}
        {!isMobile ? (
          <div className="flex-1 max-w-[500px] mx-4 md:mx-8">
            <SearchComponent />
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Giỏ hàng */}
          <div className="relative inline-block">
            <Link to="/cart">
              <Button variant="outline" className="rounded-full w-10 h-10 md:w-12 md:h-12" id="cart-button">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            {cartItemCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </div>
            )}
          </div>
          
          {/* Thông báo - Ẩn trên mobile */}
          {isMobile && (
            <Button variant="outline" className="rounded-full w-10 h-10">
              <Bell />
            </Button>
          )}
          
          {/* Đăng nhập/Đăng ký hoặc Menu người dùng */}
          {!isMobile && (
            !isLoggedIn ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/signup")}>Đăng ký</Button>
                <Button variant="outline" onClick={() => navigate("/sign-in")}>Đăng nhập</Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full py-6">
                    <img src="https://fsviet.com/image/data/decaltrasua/logo-tra-sua-dep.jpg" alt="" className="w-8" /> 
                    <span className="ml-2 hidden md:inline">demo</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer p-2">
                    <User /> Tài khoản của tôi
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={handleSwitchToAdmin} className="cursor-pointer p-2">
                      <Store /> Kênh Người Bán
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer p-2">
                    <Box /> Đơn hàng của tôi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer p-2">
                    <LogOut className="text-destructive" /> Đăng Xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
        </div>
      </div>
      
      {/* Thanh tìm kiếm dưới header trên mobile */}
      {isMobile && (
        <div className="flex items-center gap-2 p-2">
          {isMobile && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Menu className="h-5 w-5 cursor-pointer" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                {renderMobileMenuItems()}
              </SheetContent>
            </Sheet>
          )}
          <SearchComponent className="w-full" />
        </div>
      )}
    </nav>
  );
}

export default Header;
