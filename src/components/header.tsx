import { Link, useNavigate, useLocation } from "react-router";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, Box, LogOut, ShoppingCart, Store, User, Home, Package, Mail, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getData } from "@/lib/api";
import SearchComponent from "./search";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

function Header({ isLoggedIn, setIsLoggedIn, setIsAdmin }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItemCount, setCartItemCount] = useState(0);
  const isMobile = useIsMobile();
  const [storeLogo, setStoreLogo] = useState<string>("https://res.cloudinary.com/db4xiceow/image/upload/v1747460240/logo-no-background.png");

  const userRole = localStorage.getItem("role") || "user";
  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : {};
  

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
    const role = localStorage.getItem("role");

    let path = "/admin";
    if (role === "employee" || role === "shipper") {
      path = "/admin/orders";
    } else if (role === "nhan-vien-kho") {
      path = "/admin/order-ingredients";
    }

    setIsAdmin(true);
    navigate(path);
  };


  // Bottom Navigation Items
  const bottomNavItems = [
    {
      icon: Home,
      label: "Trang chủ",
      path: "/",
      active: location.pathname === "/"
    },
    {
      icon: Package,
      label: "Sản phẩm",
      path: "/products",
      active: location.pathname.startsWith("/products")
    },
    {
      icon: Box,
      label: "Đơn hàng",
      path: "/orders",
      active: location.pathname === "/orders"
    },
    {
      icon: Mail,
      label: "Hộp thư",
      path: "/notification",
      active: location.pathname === "/notification"
    },
    {
      icon: UserCircle,
      label: "Tài khoản",
      path: isLoggedIn ? "/profile" : "/sign-in",
      active: location.pathname === "/profile"
    }
  ];

  // Bottom Navigation Component
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16">
        {bottomNavItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                item.active 
                  ? "text-primary bg-blue-50" 
                  : "text-gray-600 hover:text-primary hover:bg-gray-50"
              }`}
            >
              <IconComponent size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-30">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to={'/'} className="flex items-center">
                <img 
                  className="h-15 w-auto sm:h-10 lg:h-25" 
                  src={storeLogo} 
                  alt="Logo" 
                />
              </Link>
            </div>
            
            {/* Search Component - Desktop only */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-6 lg:mx-8">
                <SearchComponent />
              </div>
            )}

            {/* Desktop Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <div className="relative">
                <Link to="/cart">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative h-10 w-10 lg:h-12 lg:w-12 rounded-full hover:bg-gray-100"
                  >
                    <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
                    {cartItemCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center text-xs font-bold">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </div>
                    )}
                  </Button>
                </Link>
              </div>
              
              {/* Notifications - Desktop only */}
              {!isMobile && (
                <Link to="/notification">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-10 w-10 lg:h-12 lg:w-12 rounded-full hover:bg-gray-100"
                  >
                    <Bell className="h-5 w-5 lg:h-6 lg:w-6" />
                  </Button>
                </Link>
              )}
              
              {/* Auth Buttons or User Menu - Desktop only */}
              {!isMobile && (
                !isLoggedIn ? (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate("/sign-in")} 
                      className="px-4 py-2 rounded-full hover:bg-gray-100"
                    >
                      Đăng ký
                    </Button>
                    <Button 
                      onClick={() => navigate("/sign-in")} 
                      className="px-4 py-2 rounded-full bg-primary text-white"
                    >
                      Đăng nhập
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100"
                      >
                        <img 
                          src="https://fsviet.com/image/data/decaltrasua/logo-tra-sua-dep.jpg" 
                          alt="Avatar" 
                          className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover" 
                        /> 
                        <span className="hidden lg:inline font-medium">{userInfo.ten}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => navigate("/profile")} 
                        className="cursor-pointer flex items-center space-x-2 p-3"
                      >
                        <User size={18} />
                        <span>Tài khoản của tôi</span>
                      </DropdownMenuItem>
                      {userRole !== "user" && (
                        <DropdownMenuItem 
                          onClick={handleSwitchToAdmin} 
                          className="cursor-pointer flex items-center space-x-2 p-3"
                        >
                          <Store size={18} />
                          <span>Kênh Người Bán</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => navigate("/orders")} 
                        className="cursor-pointer flex items-center space-x-2 p-3"
                      >
                        <Box size={18} />
                        <span>Đơn hàng của tôi</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="text-red-600 hover:text-red-600 hover:bg-red-50 cursor-pointer flex items-center space-x-2 p-3"
                      >
                        <LogOut size={18} />
                        <span>Đăng Xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              )}
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          {isMobile && (
            <div className="pb-3">
              <SearchComponent className="w-full" />
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNavigation />}
      
      {/* Spacer for bottom navigation on mobile */}
      {/* {isMobile && <div className="h-16"></div>} */}
    </>
  );
}

export default Header;
