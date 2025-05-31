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
import { Checkbox } from "@/components/ui/checkbox";

// Định nghĩa schema validation cho form
const categorySchema = z.object({
  ten: z.string().min(1, "Tên danh mục không được để trống"),
  hoatDong: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  _id?: string;
  ten: string;
  hoatDong?: boolean;
  ngayTao?: string;
  ngayCapNhat?: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  mode: "add" | "edit";
}

export default function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  mode
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  // Khởi tạo form với giá trị mặc định
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      ten: "",
      hoatDong: true,
    },
  });

  // Cập nhật giá trị form khi category thay đổi
  useEffect(() => {
    if (category && mode === "edit") {
      form.reset({
        ten: category.ten || "",
        hoatDong: category.hoatDong !== undefined ? category.hoatDong : true,
      });
    } else if (mode === "add") {
      form.reset({
        ten: "",
        hoatDong: true,
      });
    }
  }, [category, mode, form]);

  // Xử lý khi submit form
  const handleSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
      
      // Hiển thị thông báo thành công
      toast.success(
        mode === "add" 
          ? "Thêm danh mục thành công" 
          : "Cập nhật danh mục thành công"
      );
      
      // Đóng dialog và reset form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi khi xử lý danh mục:", error);
      toast.error(
        mode === "add"
          ? "Có lỗi xảy ra khi thêm danh mục"
          : "Có lỗi xảy ra khi cập nhật danh mục"
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
            {mode === "add" ? "Thêm danh mục mới" : "Cập nhật danh mục"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tên danh mục */}
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên danh mục" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trạng thái hoạt động */}
            <FormField
              control={form.control}
              name="hoatDong"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Hoạt động</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Danh mục sẽ hiển thị trên trang web
                    </p>
                  </div>
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
                    ? "Thêm danh mục" 
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