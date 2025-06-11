import { useEffect, useState, useRef } from "react";
import { getData, putData, deleteData, postFormData, putFormData } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, Trash2, Plus, Upload, Pencil, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Banner {
  _Markers?: Record<string, unknown>;
  _id: string;
  hinhAnh: string;
  lienKet?: string;
  thuTu: number;
  hienThi: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

interface BannerFormData {
  id?: string;
  hinhAnh?: File;
  hinhAnhPreview?: string;
  lienKet: string;
  hienThi: boolean;
}

export default function Design() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [originalBanners, setOriginalBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<BannerFormData>({
    lienKet: "",
    hienThi: true,
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy danh sách banner
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/banners");
      const sortedBanners = (response.data || []).sort((a: Banner, b: Banner) => a.thuTu - b.thuTu);
      setBanners(sortedBanners);
      const deepCloned = JSON.parse(JSON.stringify(sortedBanners));
      setOriginalBanners(deepCloned);
      setError(null);
      setHasChanges(false);
    } catch (error) {
      console.error("Lỗi khi tải banner:", error);
      setError("Không thể tải danh sách banner. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Kiểm tra thay đổi
  const checkForChanges = (newBanners: Banner[]) => {
    const hasDiff = JSON.stringify(newBanners) !== JSON.stringify(originalBanners);
    setHasChanges(hasDiff);
  };

  // Di chuyển banner lên
  const moveBannerUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index - 1];
    newBanners[index - 1] = temp;
    // Cập nhật thứ tự
    newBanners[index].thuTu = index + 1;
    newBanners[index - 1].thuTu = index;
    setBanners(newBanners);
    checkForChanges(newBanners);
  };

  // Di chuyển banner xuống
  const moveBannerDown = (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index + 1];
    newBanners[index + 1] = temp;
    // Cập nhật thứ tự
    newBanners[index].thuTu = index + 1;
    newBanners[index + 1].thuTu = index + 2;
    setBanners(newBanners);
    checkForChanges(newBanners);
  };

  // Cập nhật liên kết
  const updateLienKet = (index: number, value: string) => {
    const newBanners = [...banners];
    newBanners[index].lienKet = value;
    setBanners(newBanners);
    checkForChanges(newBanners);
  };

  // Cập nhật trạng thái hiển thị
  // const toggleHienThi = (index: number) => {
  //   const newBanners = [...banners];
  //   newBanners[index].hienThi = !newBanners[index].hienThi;
  //   setBanners(newBanners);
  //   checkForChanges(newBanners);
  // };

  // Xóa banner
  const deleteBanner = async (id: string) => {
    try {
      await deleteData(`/api/banners/${id}`);
      toast.success("Xóa banner thành công");
      fetchBanners();
    } catch (error) {
      console.error("Lỗi khi xóa banner:", error);
      toast.error("Có lỗi xảy ra khi xóa banner");
    }
  };

  // Lưu thay đổi
  const saveChanges = async () => {
    try {
      for (const banner of banners) {
        const formData = new FormData();
        formData.append("thuTu", banner.thuTu.toString());
        formData.append("hienThi", banner.hienThi.toString());
        if (banner.lienKet) {
          formData.append("lienKet", banner.lienKet);
        }
        await putData(`/api/banners/${banner._id}`, formData);
      }
      toast.success("Lưu thay đổi thành công");
      fetchBanners();
    } catch (error) {
      console.error("Lỗi khi lưu thay đổi:", error);
      toast.error("Có lỗi xảy ra khi lưu thay đổi");
    }
  };

  // Hủy thay đổi
  const cancelChanges = () => {
    setBanners(originalBanners);
    setHasChanges(false);
  };

  // Mở dialog thêm banner mới
  const openAddDialog = () => {
    setFormData({
      lienKet: "",
      hienThi: true,
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Mở dialog chỉnh sửa banner
  const openEditDialog = (banner: Banner) => {
    setFormData({
      id: banner._id,
      lienKet: banner.lienKet || "",
      hienThi: banner.hienThi,
      hinhAnhPreview: banner.hinhAnh,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Xử lý khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 2MB");
        return;
      }

      // Kiểm tra định dạng file
      const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validFormats.includes(file.type)) {
        toast.error("Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG, GIF");
        return;
      }

      // Tạo URL preview
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        hinhAnh: file,
        hinhAnhPreview: previewUrl,
      }));
    }
  };

  // Xử lý submit form
  const handleSubmit = async () => {
    if (submitting) return; // Ngăn spam
  
    try {
      setSubmitting(true); // Bắt đầu gửi
  
      if (!formData.hinhAnh && !isEditing) {
        toast.error("Vui lòng chọn hình ảnh cho banner");
        return;
      }
  
      const formDataToSend = new FormData();
      if (formData.hinhAnh) {
        formDataToSend.append("hinhAnh", formData.hinhAnh);
      }
      formDataToSend.append("lienKet", formData.lienKet);
      formDataToSend.append("hienThi", formData.hienThi.toString());
  
      if (isEditing && formData.id) {
        await putFormData(`/api/banners/${formData.id}`, formDataToSend);
        toast.success("Cập nhật banner thành công");
      } else {
        const maxThuTu = Math.max(...banners.map((b) => b.thuTu), 0);
        formDataToSend.append("thuTu", (maxThuTu + 1).toString());
        await postFormData("/api/banners", formDataToSend);
        toast.success("Thêm banner thành công");
      }
  
      setDialogOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("Lỗi khi lưu banner:", error);
      toast.error("Có lỗi xảy ra khi lưu banner");
    } finally {
      setSubmitting(false); // Kết thúc gửi
    }
  };  

  return (
    <Card className="bg-background rounded-lg shadow-md mb-3">
      <CardHeader className="mt-4">
        <div className="flex justify-between items-center">
          <CardTitle>Danh sách banner</CardTitle>
          <Button onClick={openAddDialog} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Thêm banner
          </Button>
        </div>
        <CardDescription>
          Quản lý danh sách banner hiển thị trên trang chủ
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-4">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-destructive py-4">{error}</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-4">Không có banner nào</div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <div key={banner._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center space-x-4">
                  {/* Điều khiển vị trí */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveBannerUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveBannerDown(index)}
                      disabled={index === banners.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Hình ảnh */}
                  <div className="flex-shrink-0 relative group w-[85%]">
                    <img
                      src={banner.hinhAnh}
                      alt="Banner"
                      className="w-full h-64 object-contain rounded"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white" 
                        onClick={() => openEditDialog(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Trạng thái hiển thị */}
                  {/* <div className="flex items-center space-x-2">
                    <Switch
                      checked={banner.hienThi}
                      onCheckedChange={() => toggleHienThi(index)}
                    />
                    <span>{banner.hienThi ? "Hiển thị" : "Ẩn"}</span>
                  </div> */}

                  {/* Xóa banner */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteBanner(banner._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Thông tin banner */}
                <Input
                  value={banner.lienKet || ""}
                  onChange={(e) => updateLienKet(index, e.target.value)}
                  placeholder="Nhập liên kết (URL)"
                  className="mt-2 w-full"
                />
              </div>
            ))}

            {/* Nút Lưu và Hủy */}
            {hasChanges && (
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={cancelChanges}>
                  Hủy
                </Button>
                <Button onClick={saveChanges}>
                  <Save />
                  Lưu
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog thêm/chỉnh sửa banner */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Chỉnh sửa banner" : "Thêm banner mới"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Cập nhật thông tin và hình ảnh cho banner" 
                : "Tải lên hình ảnh và nhập thông tin cho banner mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Upload hình ảnh */}
            <div className="space-y-2">
              <Label htmlFor="banner-image">Hình ảnh banner</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.hinhAnhPreview ? (
                  <div className="relative">
                    <img 
                      src={formData.hinhAnhPreview} 
                      alt="Preview" 
                      className="max-h-40 mx-auto rounded-md"
                    />
                    <p className="mt-2 text-sm text-gray-500">Nhấp để thay đổi hình ảnh</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">Nhấp để tải lên hình ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ JPG, JPEG, PNG, GIF. Tối đa 2MB.
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  id="banner-image"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Liên kết */}
            <div className="space-y-2">
              <Label htmlFor="banner-link">Liên kết (URL)</Label>
              <Input
                id="banner-link"
                value={formData.lienKet}
                onChange={(e) => setFormData(prev => ({ ...prev, lienKet: e.target.value }))}
                placeholder="Nhập liên kết cho banner (tùy chọn)"
              />
            </div>

            {/* Trạng thái hiển thị */}
            <div className="flex items-center space-x-2">
              <Switch
                id="banner-status"
                checked={formData.hienThi}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hienThi: checked }))}
              />
              <Label htmlFor="banner-status">{formData.hienThi ? "Hiển thị" : "Ẩn"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang xử lý..." : isEditing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
