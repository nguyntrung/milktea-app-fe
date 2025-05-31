import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Định nghĩa schema validation cho form
const supplierSchema = z.object({
  ten: z.string().min(1, "Tên nhà cung cấp không được để trống"),
  diaChi: z.string().min(1, "Địa chỉ không được để trống"),
  lienHe: z.string()
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa các chữ số"),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface Supplier {
  _id?: string;
  ten: string;
  diaChi: string;
  lienHe: string;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  mode: "add" | "edit";
}

export default function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  mode
}: SupplierDialogProps) {
  const [loading, setLoading] = useState(false);

  // Khởi tạo form với giá trị mặc định
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      ten: "",
      diaChi: "",
      lienHe: "",
    },
  });

  // Cập nhật giá trị form khi supplier thay đổi
  useEffect(() => {
    if (supplier && mode === "edit") {
      form.reset({
        ten: supplier.ten || "",
        diaChi: supplier.diaChi || "",
        lienHe: supplier.lienHe || "",
      });
    } else if (mode === "add") {
      form.reset({
        ten: "",
        diaChi: "",
        lienHe: "",
      });
    }
  }, [supplier, mode, form]);

  // Xử lý khi submit form
  const handleSubmit = async (data: SupplierFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
      
      // Hiển thị thông báo thành công
      toast.success(
        mode === "add" 
          ? "Thêm nhà cung cấp thành công" 
          : "Cập nhật nhà cung cấp thành công"
      );
      
      // Đóng dialog và reset form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi khi xử lý nhà cung cấp:", error);
      toast.error(
        mode === "add"
          ? "Có lỗi xảy ra khi thêm nhà cung cấp"
          : "Có lỗi xảy ra khi cập nhật nhà cung cấp"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm nhà cung cấp mới" : "Cập nhật nhà cung cấp"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tên nhà cung cấp */}
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhà cung cấp</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên nhà cung cấp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Địa chỉ */}
            <FormField
              control={form.control}
              name="diaChi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Số điện thoại */}
            <FormField
              control={form.control}
              name="lienHe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số điện thoại" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading 
                  ? "Đang xử lý..." 
                  : mode === "add" 
                    ? "Thêm nhà cung cấp" 
                    : "Cập nhật"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
