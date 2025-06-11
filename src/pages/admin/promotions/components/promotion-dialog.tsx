import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
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

// Định nghĩa kiểu dữ liệu cho khuyến mãi
interface Promotion {
  _id?: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa: string;
  giaTri: number;
  loaiKhuyenMai: "phantram" | "tienmat";
  ngayBatDau: string;
  ngayKetThuc: string;
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

// Schema validation cho form
const formSchema = z.object({
  maKhuyenMai: z.string().min(1, "Mã khuyến mãi không được để trống"),
  tenKhuyenMai: z.string().min(1, "Tên khuyến mãi không được để trống"),
  moTa: z.string().optional(),
  giaTri: z.coerce.number().min(0, "Giá trị phải lớn hơn hoặc bằng 0"),
  loaiKhuyenMai: z.enum(["phantram", "tienmat"]),
  ngayBatDau: z.date({
    required_error: "Vui lòng chọn ngày bắt đầu",
  }),
  ngayKetThuc: z.date({
    required_error: "Vui lòng chọn ngày kết thúc",
  }),
  dieuKienApDung: z.string().optional(),
  trangThai: z.boolean().optional(),
}).refine(data => data.ngayKetThuc > data.ngayBatDau, {
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
      dieuKienApDung: "",
      trangThai: true,
    },
  });

  // Cập nhật giá trị form khi có dữ liệu promotion và mode là "edit"
  useEffect(() => {
    if (promotion && mode === "edit") {
      form.reset({
        maKhuyenMai: promotion.maKhuyenMai,
        tenKhuyenMai: promotion.tenKhuyenMai,
        moTa: promotion.moTa,
        giaTri: promotion.giaTri,
        loaiKhuyenMai: promotion.loaiKhuyenMai,
        ngayBatDau: new Date(promotion.ngayBatDau),
        ngayKetThuc: new Date(promotion.ngayKetThuc),
        dieuKienApDung: promotion.dieuKienApDung,
        trangThai: promotion.trangThai,
      });
    } else {
      form.reset({
        maKhuyenMai: "",
        tenKhuyenMai: "",
        moTa: "",
        giaTri: 0,
        loaiKhuyenMai: "phantram",
        dieuKienApDung: "",
        trangThai: true,
      });
    }
  }, [promotion, mode, form]);

  // Xử lý submit form
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
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

      if (response.success) {
        toast.success(mode === "add" ? "Thêm khuyến mãi thành công" : "Cập nhật khuyến mãi thành công");
        onSubmit();
        onOpenChange(false);
      } else {
        toast.error(response.message || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Lỗi khi gửi form:", error);
      toast.error("Đã có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

            <FormField
              control={form.control}
              name="moTa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập mô tả khuyến mãi" {...field} />
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
                        placeholder="Nhập giá trị khuyến mãi" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
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
                        <option value="phantram">Phần trăm</option>
                        <option value="tienmat">Tiền mặt</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                            {field.value ? (
                              format(field.value, "PPP", { locale: vi })
                            ) : (
                              <span>Chọn ngày</span>
                            )}
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
                            {field.value ? (
                              format(field.value, "PPP", { locale: vi })
                            ) : (
                              <span>Chọn ngày</span>
                            )}
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
                            return startDate && date < startDate;
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

            <FormField
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
            />

            <FormField
              control={form.control}
              name="trangThai"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Kích hoạt
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