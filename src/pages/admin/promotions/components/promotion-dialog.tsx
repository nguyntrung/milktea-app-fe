import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postData, putData } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Định nghĩa kiểu dữ liệu cho khuyến mãi
interface Promotion {
  _id?: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa: string;
  giaTri: number;
  loaiKhuyenMai: "phantram" | "tienmat";
  thoiGianApDung: {
    batDau: string;
    ketThuc: string;
  }
  dieuKienApDung: string;
  trangThai: boolean;
}

// Props cho dialog
interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion;
  onSubmit: () => void;
  mode: "add" | "edit";
}

// Hàm helper untuk parse date an toàn
const parseDate = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined;
  
  try {
    // Thử parse ISO string trước
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) {
      return isoDate;
    }
    
    // Thử tạo Date object trực tiếp
    const directDate = new Date(dateString);
    if (isValid(directDate)) {
      return directDate;
    }
    
    return undefined;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return undefined;
  }
};

// Hàm helper để format date an toàn
const safeFormatDate = (date: Date | undefined): string => {
  if (!date || !isValid(date)) {
    return "Chọn ngày";
  }
  
  try {
    return format(date, "PPP", { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Chọn ngày";
  }
};

// Schema validation cho form với custom date validation
const formSchema = z.object({
  maKhuyenMai: z.string().min(1, "Mã khuyến mãi không được để trống"),
  tenKhuyenMai: z.string().min(1, "Tên khuyến mãi không được để trống"),
  moTa: z.string().optional(),
  giaTri: z.coerce.number().min(0, "Giá trị phải lớn hơn hoặc bằng 0"),
  loaiKhuyenMai: z.enum(["phantram", "tienmat"]),
  ngayBatDau: z.date({
    required_error: "Vui lòng chọn ngày bắt đầu",
    invalid_type_error: "Ngày bắt đầu không hợp lệ",
  }),
  ngayKetThuc: z.date({
    required_error: "Vui lòng chọn ngày kết thúc",
    invalid_type_error: "Ngày kết thúc không hợp lệ",
  }),
  dieuKienApDung: z.string().optional(),
  trangThai: z.boolean().optional(),
}).refine(data => {
  // Kiểm tra cả hai ngày có hợp lệ không trước khi so sánh
  if (!isValid(data.ngayBatDau) || !isValid(data.ngayKetThuc)) {
    return false;
  }
  return data.ngayKetThuc > data.ngayBatDau;
}, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["ngayKetThuc"],
});

export default function PromotionDialog({
  open,
  onOpenChange,
  promotion,
  onSubmit,
  mode
}: PromotionDialogProps) {
  const [loading, setLoading] = useState(false);

  // Khởi tạo form với react-hook-form và zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maKhuyenMai: "",
      tenKhuyenMai: "",
      moTa: "",
      giaTri: 0,
      loaiKhuyenMai: "phantram",
      dieuKienApDung: "hoaDon",
      trangThai: true,
    },
  });

  // Cập nhật giá trị form khi có dữ liệu promotion và mode là "edit"
  useEffect(() => {
    if (promotion && mode === "edit") {
      // Parse dates an toàn
      const startDate = parseDate(promotion.thoiGianApDung.batDau);
      const endDate = parseDate(promotion.thoiGianApDung.ketThuc);
      
      // Chỉ reset form nếu có đủ dữ liệu hợp lệ
      form.reset({
        maKhuyenMai: promotion.maKhuyenMai || "",
        tenKhuyenMai: promotion.tenKhuyenMai || "",
        moTa: promotion.moTa || "",
        giaTri: promotion.giaTri || 0,
        loaiKhuyenMai: promotion.loaiKhuyenMai || "phantram",
        ngayBatDau: startDate || new Date(),
        ngayKetThuc: endDate || new Date(),
        dieuKienApDung: promotion.dieuKienApDung || "",
        trangThai: promotion.trangThai ?? true,
      });
    } else {
      // Reset form về giá trị mặc định cho mode "add"
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      form.reset({
        maKhuyenMai: "",
        tenKhuyenMai: "",
        moTa: "",
        giaTri: 0,
        loaiKhuyenMai: "phantram",
        ngayBatDau: tomorrow,
        ngayKetThuc: nextWeek,
        dieuKienApDung: "hoaDon",
        trangThai: true,
      });
    }
  }, [promotion, mode, form]);

  // Xử lý submit form
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Kiểm tra ngày hợp lệ trước khi submit
      if (!isValid(values.ngayBatDau) || !isValid(values.ngayKetThuc)) {
        toast.error("Ngày tháng không hợp lệ");
        return;
      }
      
      // Chuyển đổi ngày thành chuỗi ISO
      const formattedValues = {
        ...values,
        ngayBatDau: values.ngayBatDau.toISOString(),
        ngayKetThuc: values.ngayKetThuc.toISOString(),
      };

      let response;
      if (mode === "add") {
        response = await postData("/api/promotions", formattedValues);
      } else {
        response = await putData(`/api/promotions/${promotion?._id}`, formattedValues);
      }

      if (response?.success) {
        toast.success(mode === "add" ? "Thêm khuyến mãi thành công" : "Cập nhật khuyến mãi thành công");
        onSubmit();
        onOpenChange(false);
      } else {
        toast.error(response?.message || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Lỗi khi gửi form:", error);
      toast.error("Đã có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  // Reset form khi dialog đóng
  useEffect(() => {
    if (!open) {
      form.clearErrors();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm khuyến mãi mới" : "Chỉnh sửa khuyến mãi"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maKhuyenMai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã khuyến mãi</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập mã khuyến mãi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenKhuyenMai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khuyến mãi</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên khuyến mãi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="giaTri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá trị</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="Nhập giá trị khuyến mãi" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="loaiKhuyenMai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại khuyến mãi</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="phantram">Phần trăm (%)</option>
                        <option value="tienmat">Tiền mặt (VND)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <FormField
              control={form.control}
              name="moTa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập mô tả khuyến mãi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range Picker */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ngayBatDau"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {safeFormatDate(field.value)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ngayKetThuc"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {safeFormatDate(field.value)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("ngayBatDau");
                            return startDate && isValid(startDate) && date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* <FormField
              control={form.control}
              name="dieuKienApDung"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điều kiện áp dụng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập điều kiện áp dụng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="trangThai"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Kích hoạt khuyến mãi
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang xử lý...
                  </>
                ) : mode === "add" ? (
                  "Thêm khuyến mãi"
                ) : (
                  "Cập nhật khuyến mãi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
