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
  hoatDong: z.boolean().optional(),
  hinhAnh: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "File ảnh không được lớn hơn 5MB",
    })
    .refine((file) => !file || file.type.startsWith("image/"), {
      message: "Chỉ cho phép upload file ảnh",
    }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  _id?: string;
  ten: string;
  hinhAnh: string;
  hoatDong?: boolean;
  ngayTao?: string;
  ngayCapNhat?: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSubmit: (data: FormData) => Promise<void>;
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Khởi tạo form với giá trị mặc định
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      ten: "",
      hoatDong: true,
      hinhAnh: undefined,
    },
  });

  // Cập nhật giá trị form và preview ảnh khi category thay đổi
  useEffect(() => {
    if (category && mode === "edit") {
      form.reset({
        ten: category.ten || "",
        hoatDong: category.hoatDong !== undefined ? category.hoatDong : true,
        hinhAnh: undefined,
      });
      setPreviewImage(category.hinhAnh || null);
    } else if (mode === "add") {
      form.reset({
        ten: "",
        hoatDong: true,
        hinhAnh: undefined,
      });
      setPreviewImage(null);
    }
  }, [category, mode, form]);

  // Xử lý thay đổi file ảnh
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("hinhAnh", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("hinhAnh", undefined);
      setPreviewImage(null);
    }
  };

  // Xử lý khi submit form
  const handleSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("ten", data.ten);
      formData.append("hoatDong", (data.hoatDong ?? true).toString());
      if (data.hinhAnh) {
        formData.append("hinhAnh", data.hinhAnh);
      }

      await onSubmit(formData);
      
      // Đóng dialog và reset form
      onOpenChange(false);
      form.reset();
      setPreviewImage(null);
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

            {/* Upload ảnh */}
            <FormField
              control={form.control}
              name="hinhAnh"
              render={() => (
                <FormItem>
                  <FormLabel>Hình ảnh danh mục</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="mt-2 h-24 w-24 object-cover rounded"
                    />
                  )}
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
