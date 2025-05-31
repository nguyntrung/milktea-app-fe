import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getData, putFormData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Upload, Save, XCircle, Loader2, SquarePen, Ban } from "lucide-react";
import axios from "axios";

// Schema validation cho form
const storeSchema = z.object({
  ten: z.string().min(1, "Tên cửa hàng không được để trống"),
  diaChi: z.string().min(1, "Địa chỉ không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  soDienThoai: z.string().min(1, "Số điện thoại không được để trống"),
  website: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function StoreSetting() {
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Khởi tạo form với react-hook-form
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      ten: "",
      diaChi: "",
      email: "",
      soDienThoai: "",
      website: "",
    },
  });

  // Lấy dữ liệu cửa hàng từ API
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await getData("/api/store");
        if (response.success && response.data) {
          const storeData = response.data;
          
          // Reset form với dữ liệu từ API
          form.reset({
            ten: storeData.ten || "",
            diaChi: storeData.diaChi || "",
            email: storeData.email || "",
            soDienThoai: storeData.soDienThoai || "",
            website: storeData.website || "",
          });
          
          // Set logo hiện tại nếu có
          if (storeData.logo) {
            setCurrentLogo(storeData.logo);
            setLogoPreview(storeData.logo);
          }
        } else {
          toast.error("Không thể tải thông tin cửa hàng");
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin cửa hàng:", error);
        toast.error("Đã xảy ra lỗi khi tải thông tin cửa hàng");
      }
    };

    fetchStoreData();
  }, [form]);

  // Debug useEffect
  useEffect(() => {
    console.log("Logo states:", {
      logoPreview,
      currentLogo,
      logoFile: logoFile?.name,
      logoLoading
    });
  }, [logoPreview, currentLogo, logoFile, logoLoading]);

  // Xử lý upload logo với cải thiện
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 2MB");
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error("Chỉ hỗ trợ file PNG, JPEG, JPG");
      return;
    }
    
    // Bắt đầu loading
    setLogoLoading(true);
    setLogoFile(file);
    
    try {
      // Tạo preview với Promise
      const preview = await createImagePreview(file);
      setLogoPreview(preview);
      console.log("Preview created successfully");
    } catch (error) {
      console.error("Error creating preview:", error);
      toast.error("Không thể tải preview ảnh");
      setLogoFile(null);
    } finally {
      setLogoLoading(false);
    }
  };

  // Helper function để tạo preview
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result.toString());
        } else {
          reject(new Error("Không thể đọc file"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Lỗi khi đọc file"));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Xử lý submit form với FormData
  const onSubmit = async (data: StoreFormValues) => {
    try {
      setLoading(true);
      
      // Tạo FormData để gửi cả dữ liệu và file
      const formData = new FormData();
      
      // Thêm dữ liệu form
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });
      
      // Thêm logo file nếu có
      if (logoFile) {
        formData.append('logo', logoFile);
        console.log("Logo file added to FormData:", logoFile.name);
      }
      
      // Log FormData contents for debugging
      console.log("FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Sử dụng putFormData từ API utils
      const response = await putFormData("/api/store", formData);
      
      if (response.success) {
        toast.success("Cập nhật thông tin cửa hàng thành công");
        
        // Cập nhật logo hiện tại
        if (response.data?.logo) {
          const newLogoUrl = response.data.logo;
          setCurrentLogo(newLogoUrl);
          setLogoPreview(newLogoUrl);
          console.log("New logo URL:", newLogoUrl);
        }
        
        // Clear file đã chọn
        setLogoFile(null);
        
        // Reset input file
        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        toast.error(response.message || "Cập nhật thông tin cửa hàng thất bại");
      }
    } catch (error: unknown) {
      console.error("Lỗi khi cập nhật thông tin cửa hàng:", error);
      
      // Xử lý error response từ server
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Đã xảy ra lỗi khi cập nhật thông tin cửa hàng");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa logo preview
  const handleRemoveLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview(currentLogo); // Trở về logo hiện tại
    setLogoLoading(false);
    
    // Reset input file
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-md mb-3">
      <Card>
        <CardHeader className="mt-4">
          <CardTitle>Thông tin cửa hàng</CardTitle>
          <CardDescription className="flex justify-between">
            <div>Xem và chỉnh sửa thông tin cửa hàng</div>
            <SquarePen 
              className="h-5 w-5 text-muted-foreground cursor-pointer"
              onClick={() => setIsEditing(true)}
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Logo upload section */}
              <div className="space-y-4">
                <FormLabel>Logo cửa hàng</FormLabel>
                <div className="flex items-center gap-4">
                  {/* Logo preview area */}
                  <div 
                    className={`relative w-24 h-24 ${logoPreview ? "border-none" : "border border-dashed border-muted-foreground"} rounded-full overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0`}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {logoLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                          onLoad={() => console.log("Image loaded successfully")}
                          onError={(e) => {
                            console.error("Image load error:", e);
                            toast.error("Không thể hiển thị ảnh");
                            setLogoPreview("");
                          }}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-xs">Logo</span>
                      </div>
                    )}
                  </div>
                  
                  {/* File input (hidden) */}
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={!isEditing || logoLoading}
                  />
                  
                  {/* Upload instructions và controls */}
                  <div className="flex flex-col gap-2">
                    <div className="text-muted-foreground">
                      <div className="text-xs">Định dạng: PNG, JPEG, JPG</div>
                      <div className="text-xs">Kích thước: tối đa 2MB</div>
                      <div className="text-xs">Kích thước khuyến nghị: 200x200px</div>
                    </div>
                    
                    {logoFile && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-600">
                          File mới: {logoFile.name}
                        </span>
                        <XCircle
                          className="h-4 w-4 cursor-pointer text-destructive/70 hover:text-destructive" 
                          onClick={handleRemoveLogoPreview}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 2 cột cho desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tên cửa hàng */}
                <FormField
                  control={form.control}
                  name="ten"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên cửa hàng *</FormLabel>
                      <FormControl>
                        <Input 
                        className="h-12"
                          placeholder="Nhập tên cửa hàng" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  disabled={!isEditing}
                />

                {/* Số điện thoại */}
                <FormField
                  control={form.control}
                  name="soDienThoai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại *</FormLabel>
                      <FormControl>
                        <Input 
                        className="h-12"
                          placeholder="Nhập số điện thoại" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          className="h-12"
                          placeholder="Nhập email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  disabled={!isEditing}
                />

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          className="h-12"
                          placeholder="https://example.com"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  disabled={!isEditing}
                />
              </div>

              {/* Địa chỉ */}
              <FormField
                control={form.control}
                name="diaChi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ *</FormLabel>
                    <FormControl>
                      <Input 
                      className="h-12"
                        placeholder="Nhập địa chỉ cửa hàng" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isEditing}
              />

              {/* Submit button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  disabled={!isEditing}
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setLogoPreview(currentLogo);
                    setLogoFile(null);
                    setIsEditing(false);
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" /> Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading || logoLoading || (!form.formState.isDirty && !logoFile)}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu thông tin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
