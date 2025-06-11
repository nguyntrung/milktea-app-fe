import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData, putData } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import Fallback from "@/components/ui/fallback";
import { CalendarIcon, User, Gift, History, Edit, UserCircle, Award, Clock, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface UserProfile {
  _id: string;
  email: string;
  ten: string;
  ngaySinh: string;
  gioiTinh: string;
  soDienThoai: string;
  diemTichLuy: number;
  lichSuDiem: Array<{
    ngay: string;
    diem: number;
    loai: string;
    ghiChu: string;
  }>;
  khuyenMaiDaSuDung: Array<{
    maKhuyenMai: string;
    ngaySuDung: string;
    giaTri: number;
    moTa: string;
  }>;
  vaiTro: string;
  hoatDong: boolean;
}

const sidebarItems = [
  {
    id: "thongTin",
    label: "Tài khoản của tôi",
    icon: UserCircle,
    description: "Quản lý thông tin cá nhân"
  },
  {
    id: "diemTichLuy", 
    label: "Điểm tích lũy",
    icon: Award,
    description: "Xem điểm tích lũy hiện tại"
  },
  {
    id: "lichSuDiem",
    label: "Lịch sử điểm",
    icon: Clock,
    description: "Lịch sử tích lũy và sử dụng"
  }
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("thongTin");
  
  // Form state
  const [formData, setFormData] = useState({
    ten: "",
    email: "",
    soDienThoai: "",
    ngaySinh: "",
    gioiTinh: "nam"
  });
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      if (!userId || !token) {
        toast.error("Vui lòng đăng nhập để xem thông tin cá nhân");
        navigate("/sign-in", { state: { from: "/profile" } });
        return;
      }
      
      try {
        setLoading(true);
        const response = await getData(`/api/auth/${userId}`);
        
        if (response.success) {
          setUser(response.data);
          setFormData({
            ten: response.data.ten || "",
            email: response.data.email || "",
            soDienThoai: response.data.soDienThoai || "",
            ngaySinh: response.data.ngaySinh || "",
            gioiTinh: response.data.gioiTinh || "nam"
          });
        } else {
          setError("Không thể tải thông tin người dùng");
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
        setError("Đã xảy ra lỗi khi tải thông tin người dùng");
        toast.error("Đã xảy ra lỗi khi tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, ngaySinh: date.toISOString() }));
    }
  };
  
  // Handle gender change
  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gioiTinh: value }));
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const response = await putData(`/api/auth/profile`, formData);
      
      if (response.success) {
        setUser({
          ...user,
          ...formData
        });
        setIsEditing(false);
        toast.success("Cập nhật thông tin thành công");
      } else {
        toast.error(response.message || "Không thể cập nhật thông tin");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật thông tin");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return "Không có";
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Fallback />
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">{error || "Không tìm thấy thông tin người dùng"}</p>
        <Button onClick={() => navigate("/")} variant="outline" className="cursor-pointer">
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "thongTin":
        return (
          <Card>
            <CardHeader>
              <div className="mt-5">
                <CardTitle>Hồ sơ của tôi</CardTitle>
                <CardDescription>Quản lý thông tin hồ sở để bảo mật tài khoản</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ten">Tên hiển thị</Label>
                      {isEditing ? (
                        <Input
                          id="ten"
                          name="ten"
                          value={formData.ten}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-muted rounded">
                          {user.ten || "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Nhập email"
                          type="email"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-muted rounded">
                          {user.email || "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="soDienThoai">Số điện thoại</Label>
                      {isEditing ? (
                        <Input
                          id="soDienThoai"
                          name="soDienThoai"
                          value={formData.soDienThoai}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoai"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-muted rounded">
                          {user.soDienThoai || "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ngaySinh">Ngày sinh</Label>
                      {isEditing ? (
                        <div className="mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal cursor-pointer"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.ngaySinh ? (
                                  formatDate(formData.ngaySinh)
                                ) : (
                                  <span>Chọn ngày sinh</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.ngaySinh ? new Date(formData.ngaySinh) : undefined}
                                onSelect={handleDateChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <div className="mt-1 p-2 bg-muted rounded">
                          {user.ngaySinh ? formatDate(user.ngaySinh) : "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>Giới tính</Label>
                      {isEditing ? (
                        <RadioGroup
                          value={formData.gioiTinh}
                          onValueChange={handleGenderChange}
                          className="flex gap-4 mt-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nam" id="nam" />
                            <Label htmlFor="nam" className="cursor-pointer">Nam</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nu" id="nu" />
                            <Label htmlFor="nu" className="cursor-pointer">Nữ</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="khac" id="khac" />
                            <Label htmlFor="khac" className="cursor-pointer">Khác</Label>
                          </div>
                        </RadioGroup>
                      ) : (
                        <div className="mt-1 p-2 bg-muted rounded capitalize">
                          {user.gioiTinh || "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardContent className="flex justify-end gap-2 pt-5">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="cursor-pointer"
                  >
                    {isSaving ? "Đang lưu..." : <><Save /> Lưu thay đổi</>}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa
                </Button>
              )}
            </CardContent>
          </Card>
        );
        
      case "diemTichLuy":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="mt-5">Điểm tích lũy</CardTitle>
              <CardDescription>Thông tin điểm tích lũy của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center flex-col p-6">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Gift className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">{user.diemTichLuy}</h3>
                <p className="text-muted-foreground mt-2">Điểm tích lũy hiện tại</p>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Tích lũy điểm qua mỗi đơn hàng để nhận ưu đãi đặc biệt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case "lichSuDiem":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="mt-5">Lịch sử điểm</CardTitle>
              <CardDescription>Lịch sử tích lũy và sử dụng điểm</CardDescription>
            </CardHeader>
            <CardContent>
              {user.lichSuDiem && user.lichSuDiem.length > 0 ? (
                <div className="space-y-4">
                  {user.lichSuDiem.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-md">
                      <div>
                        <p className="font-medium">{item.ghiChu || (item.loai === "cong" ? "Tích lũy điểm" : "Sử dụng điểm")}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(item.ngay)}</p>
                      </div>
                      <div className={`font-bold ${item.loai === "cong" ? "text-green-600" : "text-red-600"}`}>
                        {item.loai === "cong" ? "+" : "-"}{item.diem}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Bạn chưa có lịch sử điểm nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 lg:flex-shrink-0">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user.ten || "Người dùng"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
