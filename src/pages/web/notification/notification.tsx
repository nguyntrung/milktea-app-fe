import { useState, useEffect } from "react";
import { getData, putData } from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCheck, ExternalLink, Bell, BellRing, Search, RotateCcw, Clock, User } from "lucide-react";
import { Link } from "react-router";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Định nghĩa kiểu dữ liệu cho thông báo
interface NguoiNhan {
  _id: string;
  ten: string;
}

interface Notification {
  _id: string;
  tieuDe: string;
  noiDung: string;
  loaiThongBao: string;
  maNguoiNhan: NguoiNhan;
  lienKet: string;
  trangThai: string;
  daDoc: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

interface ApiResponse {
  success: boolean;
  data: Notification[];
  message?: string;
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const userID = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || "defaultUserId";
    }
    return "defaultUserId";
  };
  
  // Lấy danh sách thông báo
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response: ApiResponse = await getData(`/api/notifications/user/${userID()}`);
  
      if (response.success) {
        setNotifications(response.data || []);
        setError(null);
      } else {
        setError(response.message || "Không thể tải thông báo");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setError("Không thể tải danh sách thông báo. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await putData(`/api/notifications/${notificationId}/read`, {});
      
      if (response.success) {
        // Cập nhật state
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, daDoc: true, trangThai: "daDoc" }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = async () => {
    try {
      const response = await putData("/api/notifications/read-all", {});
      
      if (response.success) {
        // Cập nhật state
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            daDoc: true,
            trangThai: "daDoc"
          }))
        );
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  // Lọc thông báo theo trạng thái và tìm kiếm
  const getFilteredNotifications = (filter: "all" | "unread" | "read") => {
    return notifications.filter(notification => {
      // Lọc theo trạng thái
      if (filter === "unread" && notification.daDoc) return false;
      if (filter === "read" && !notification.daDoc) return false;
      
      // Lọc theo từ khóa tìm kiếm
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          notification.tieuDe.toLowerCase().includes(searchLower) ||
          notification.noiDung.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Đếm số lượng thông báo theo trạng thái
  const getCounts = () => {
    const all = notifications.length;
    const unread = notifications.filter(n => !n.daDoc).length;
    const read = notifications.filter(n => n.daDoc).length;
    return { all, unread, read };
  };

  // Format thời gian
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      console.error("Lỗi khi định dạng thời gian:", error);
      return dateString;
    }
  };

  // Format thời gian tương đối
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Vừa xong";
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} giờ trước`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      
      return format(date, "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      console.error("Lỗi khi định dạng thời gian tương đối:", error);
      return dateString;
    }
  };

  // Lấy màu và icon cho loại thông báo
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "trangThaiDonHang":
        return {
          icon: "📦",
          color: "bg-blue-500/10 text-blue-700 border-blue-200",
          text: "Đơn hàng",
          bgClass: "bg-gradient-to-br from-blue-50 to-blue-100/50"
        };
      case "khuyenMai":
        return {
          icon: "🎁",
          color: "bg-red-500/10 text-red-700 border-red-200",
          text: "Khuyến mãi",
          bgClass: "bg-gradient-to-br from-red-50 to-red-100/50"
        };
      case "thongBaoHeTong":
        return {
          icon: "🔔",
          color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
          text: "Hệ thống",
          bgClass: "bg-gradient-to-br from-yellow-50 to-yellow-100/50"
        };
      default:
        return {
          icon: "📝",
          color: "bg-gray-500/10 text-gray-700 border-gray-200",
          text: type,
          bgClass: "bg-gradient-to-br from-gray-50 to-gray-100/50"
        };
    }
  };

  // Component hiển thị danh sách thông báo cho desktop - Design mới
  const DesktopNotificationList = ({ notifications }: { notifications: Notification[] }) => (
    <div className="grid gap-4">
      {notifications.map((notification) => {
        const typeConfig = getTypeConfig(notification.loaiThongBao);
        const isUnread = !notification.daDoc;
        
        return (
          <Card 
            key={notification._id}
            className={`group transition-all duration-200 hover:shadow-md border-l-4 ${
              isUnread 
                ? "border-l-primary bg-primary/5 shadow-sm" 
                : "border-l-transparent hover:border-l-gray-200"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar/Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${typeConfig.bgClass} border`}>
                  {typeConfig.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        {isUnread && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        )}
                        <h3 className={`font-semibold text-lg leading-tight ${
                          isUnread ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {notification.tieuDe}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatRelativeTime(notification.ngayTao)}</span>
                        </div>
                        {notification.maNguoiNhan?.ten && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{notification.maNguoiNhan.ten}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification._id)}
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {notification.lienKet && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                          title="Xem chi tiết"
                        >
                          <Link to={notification.lienKet}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-600 leading-relaxed line-clamp-2">
                    {notification.noiDung}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <Badge className={`${typeConfig.color} border font-medium`}>
                        {typeConfig.text}
                      </Badge>
                      <Badge variant={isUnread ? "default" : "outline"} className="text-xs">
                        {isUnread ? "Chưa đọc" : "Đã đọc"}
                      </Badge>
                    </div>
                    
                    <span className="text-xs text-gray-400 font-mono">
                      {formatDate(notification.ngayTao)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Component hiển thị danh sách thông báo cho mobile dạng card (giữ nguyên)
  const MobileNotificationList = ({ notifications }: { notifications: Notification[] }) => (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const typeConfig = getTypeConfig(notification.loaiThongBao);
        const isUnread = !notification.daDoc;
        
        return (
          <Card 
            key={notification._id} 
            className={`${isUnread ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isUnread && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    )}
                    <h4 className="font-medium truncate">{notification.tieuDe}</h4>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification._id)}
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    {notification.lienKet && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        title="Xem chi tiết"
                      >
                        <Link to={notification.lienKet}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.noiDung}
                </p>

                {/* Meta info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${typeConfig.color} border text-xs`}>
                      {typeConfig.text}
                    </Badge>
                    <Badge variant={isUnread ? "default" : "outline"} className="text-xs">
                      {isUnread ? "Chưa đọc" : "Đã đọc"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(notification.ngayTao)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Component hiển thị danh sách thông báo
  const NotificationList = ({ notifications }: { notifications: Notification[] }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <Bell className="absolute inset-0 m-auto h-6 w-6 text-primary/60" />
            </div>
            <p className="text-lg font-medium">Đang tải thông báo...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="text-center space-y-2">
            <div className="text-6xl">😞</div>
            <h3 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h3>
            <p className="text-red-500 max-w-md mx-auto">{error}</p>
          </div>
          <Button variant="outline" onClick={fetchNotifications} size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-center space-y-3">
            <div className="text-6xl">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900">
              {searchTerm ? "Không tìm thấy thông báo" : "Chưa có thông báo"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? "Thử thay đổi từ khóa tìm kiếm để có kết quả tốt hơn"
                : "Các thông báo mới sẽ xuất hiện ở đây khi có cập nhật"
              }
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Desktop view - Design mới */}
        <div className="hidden md:block">
          <DesktopNotificationList notifications={notifications} />
        </div>
        
        {/* Mobile view */}
        <div className="block md:hidden">
          <MobileNotificationList notifications={notifications} />
        </div>
      </>
    );
  };

  const counts = getCounts();

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <BellRing className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Thông báo
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-1">
                  Quản lý và theo dõi các thông báo trong hệ thống
                </CardDescription>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-4 lg:ml-auto">
              <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{counts.all}</div>
                <div className="text-xs text-blue-500">Tổng cộng</div>
              </div>
              <div className="text-center px-4 py-2 bg-red-50 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-600">{counts.unread}</div>
                <div className="text-xs text-red-500">Chưa đọc</div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-8">
          {/* Header Actions */}
          <div className="flex flex-col gap-6 mb-8">
            {/* Search bar */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                disabled={counts.unread === 0}
                className="h-10 px-6 bg-white hover:bg-gray-50 border-gray-200"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Đọc tất cả ({counts.unread})
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchNotifications}
                className="h-10 px-6 bg-white hover:bg-gray-50 border-gray-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "unread" | "read")}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <TabsList className="grid grid-cols-3 w-full lg:w-auto bg-gray-100/80 p-1 h-12">
                <TabsTrigger 
                  value="all" 
                  className="flex items-center gap-2 text-sm font-medium h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Bell className="h-4 w-4" />
                  Tất cả
                  {counts.all > 0 && (
                    <Badge variant="secondary" className="ml-2 px-2 text-xs">
                      {counts.all > 99 ? '99+' : counts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="flex items-center gap-2 text-sm font-medium h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <BellRing className="h-4 w-4" />
                  Chưa đọc
                  {counts.unread > 0 && (
                    <Badge variant="destructive" className="ml-2 px-2 text-xs">
                      {counts.unread > 99 ? '99+' : counts.unread}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="read" 
                  className="flex items-center gap-2 text-sm font-medium h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  Đã đọc
                  {counts.read > 0 && (
                    <Badge variant="outline" className="ml-2 px-2 text-xs">
                      {counts.read > 99 ? '99+' : counts.read}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Additional info for desktop */}
              <div className="hidden lg:block text-sm text-gray-500">
                {searchTerm && (
                  <span>Kết quả tìm kiếm cho "{searchTerm}"</span>
                )}
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <NotificationList notifications={getFilteredNotifications("all")} />
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <NotificationList notifications={getFilteredNotifications("unread")} />
            </TabsContent>

            <TabsContent value="read" className="mt-0">
              <NotificationList notifications={getFilteredNotifications("read")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
