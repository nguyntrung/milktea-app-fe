import { Link, useLocation } from "react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  ShoppingBag,
  Paintbrush,
  Settings,
  ChevronRight,
  ArchiveRestore,
  ChartNoAxesCombined,
  PackageCheck,
  Blocks,
  TicketPercent,
  Warehouse,
} from "lucide-react";
import React from "react";

// 🧠 Định nghĩa role được hỗ trợ
type UserRole = "admin" | "employee" | "shipper" | "nhan-vien-kho";

// 📦 Định nghĩa kiểu cho menu
interface MenuItem {
  title: string;
  icon: React.ReactNode;
  to?: string;
  subItems?: {
    title: string;
    to: string;
  }[];
}

const fullMenuItems: MenuItem[] = [
  {
    title: "Dữ liệu thống kê",
    icon: <ChartNoAxesCombined className="h-5 w-5" />,
    to: "/admin",
  },
  {
    title: "Quản lý sản phẩm",
    icon: <ShoppingBag className="h-5 w-5" />,
    to: "/admin/products",
  },
  {
    title: "Đơn hàng",
    icon: <PackageCheck className="h-5 w-5" />,
    to: "/admin/orders",
  },
  {
    title: "Nhập hàng",
    icon: <ArchiveRestore className="h-5 w-5" />,
    to: "/admin/order-ingredients",
  },
  {
    title: "Quản lý hàng hóa",
    icon: <Blocks className="h-5 w-5" />,
    subItems: [
      { title: "Danh sách nguyên liệu", to: "/admin/ingredients" },
      { title: "Danh sách topping", to: "/admin/toppings" },
    ],
  },
  {
    title: "Quản lý kho",
    icon: <Warehouse className="h-5 w-5" />,
    to: "/admin/warehouse",
  },
  {
    title: "Kênh marketing",
    icon: <TicketPercent className="h-5 w-5" />,
    to: "/admin/marketing",
  },
  {
    title: "Thiết kế",
    icon: <Paintbrush className="h-5 w-5" />,
    to: "/admin/design",
  },
  {
    title: "Cấu hình cửa hàng",
    icon: <Settings className="h-5 w-5" />,
    subItems: [
      { title: "Thông tin cửa hàng", to: "/admin/store-setting" },
      { title: "Quản lý danh mục", to: "/admin/categories" },
      { title: "Quản lý người dùng", to: "/admin/users" },
      { title: "Nhà cung cấp", to: "/admin/suppliers" },
    ],
  },
];

const getMenuByRole = (role: UserRole | null): MenuItem[] => {
  switch (role) {
    case "admin":
      return fullMenuItems;
    case "employee":
    case "shipper":
      return fullMenuItems.filter((item) => item.to === "/admin/orders");
    case "nhan-vien-kho":
      return fullMenuItems.filter(
        (item) =>
          item.to === "/admin/warehouse" ||
          item.to === "/admin/order-ingredients"
      );
    default:
      return [];
  }
};

export default function Sidebar() {
  const location = useLocation();
  const role = localStorage.getItem("role") as UserRole | null;

  const menuItems = getMenuByRole(role);

  return (
    <div className="bg-background rounded-lg w-[300px] shadow-md mb-3 sticky top-[141px]">
      <SidebarProvider>
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={index}>
              {item.subItems ? (
                <Collapsible
                  defaultChecked={item.subItems.some(
                    (sub) => sub.to === location.pathname
                  )}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-12 p-4">
                      <div className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2">
                        {item.icon}
                        <span className="text-[15px]">{item.title}</span>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((subItem, subIndex) => (
                        <SidebarMenuSubItem key={subIndex}>
                          <Link
                            to={subItem.to}
                            className={`block p-2 rounded ${
                              location.pathname === subItem.to
                                ? "text-blue-600 font-semibold"
                                : "text-gray-700 hover:bg-accent"
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton className="h-12 p-4" asChild>
                  <Link
                    to={item.to || "#"}
                    className={`text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 p-3 ${
                      location.pathname === item.to
                        ? "text-blue-600 bg-gray-100 font-semibold"
                        : "text-gray-700 hover:bg-accent"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[15px]">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarProvider>
    </div>
  );
}
