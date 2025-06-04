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
import { MultiSelect } from "@/components/ui/multi-select";
import { getData } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Định nghĩa schema validation cho form
const ingredientSchema = z.object({
  ten: z.string().min(1, "Tên nguyên liệu không được để trống"),
  donViTinh: z.string().min(1, "Đơn vị tính không được để trống"),
  maNhaCungCap: z.array(z.string()).min(1, "Phải chọn ít nhất một nhà cung cấp"),
  hoatDong: z.boolean().optional(),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface Ingredient {
  _id?: string;
  ten: string;
  donViTinh: string;
  maNhaCungCap: Array<string | { _id: string; ten: string }>;
  hoatDong: boolean;
  ngayTao?: string;
  ngayCapNhat?: string;
}

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient;
  onSubmit: (data: IngredientFormValues) => Promise<void>;
  mode: "add" | "edit";
}

// Danh sách đơn vị tính
const donViTinhOptions = [
  { value: "gram", label: "gram" },
  { value: "ml", label: "ml" },
  { value: "kg", label: "kg" },
  { value: "lít", label: "lit" }
];

export default function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onSubmit,
  mode
}: IngredientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ value: string; label: string }[]>([]);

  // Khởi tạo form với giá trị mặc định
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      ten: "",
      donViTinh: "kg",
      maNhaCungCap: [],
      hoatDong: true,
    },
  });

  // Lấy danh sách nhà cung cấp khi component được mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await getData("/api/suppliers");
        if (response.success && Array.isArray(response.data)) {
          const formattedSuppliers = response.data.map((supplier: { _id: string; ten: string }) => ({
            value: supplier._id,
            label: supplier.ten
          }));
          setSuppliers(formattedSuppliers);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
        toast.error("Không thể tải danh sách nhà cung cấp");
      }
    };

    fetchSuppliers();
  }, []);

  // Cập nhật giá trị form khi ingredient thay đổi
  useEffect(() => {
    if (ingredient && mode === "edit") {
      // Xử lý maNhaCungCap để chuyển đổi từ mảng đối tượng sang mảng ID nếu cần
      const supplierIds = ingredient.maNhaCungCap.map(item => 
        typeof item === 'object' && item !== null && '_id' in item ? item._id : item
      );
      
      form.reset({
        ten: ingredient.ten || "",
        donViTinh: ingredient.donViTinh || "kg",
        maNhaCungCap: supplierIds,
        hoatDong: ingredient.hoatDong !== undefined ? ingredient.hoatDong : true,
      });
    } else if (mode === "add") {
      form.reset({
        ten: "",
        donViTinh: "kg",
        maNhaCungCap: [],
        hoatDong: true,
      });
    }
  }, [ingredient, mode, form]);

  // Xử lý khi submit form
  const handleSubmit = async (data: IngredientFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
      
      // Hiển thị thông báo thành công
      toast.success(
        mode === "add" 
          ? "Thêm nguyên liệu thành công" 
          : "Cập nhật nguyên liệu thành công"
      );
      
      // Đóng dialog và reset form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi khi xử lý nguyên liệu:", error);
      toast.error(
        mode === "add"
          ? "Có lỗi xảy ra khi thêm nguyên liệu"
          : "Có lỗi xảy ra khi cập nhật nguyên liệu"
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
            {mode === "add" ? "Thêm nguyên liệu mới" : "Cập nhật nguyên liệu"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tên nguyên liệu */}
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nguyên liệu</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên nguyên liệu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Đơn vị tính */}
            <FormField
              control={form.control}
              name="donViTinh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị tính</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đơn vị tính" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {donViTinhOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nhà cung cấp */}
            <FormField
              control={form.control}
              name="maNhaCungCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà cung cấp</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={suppliers}
                      selectedValues={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn nhà cung cấp"
                    />
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
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Hoạt động</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Nguyên liệu sẽ hiển thị trong danh sách
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
                    ? "Thêm nguyên liệu" 
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