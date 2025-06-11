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
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Định nghĩa schema validation cho form
const ingredientSchema = z.object({
  ten: z.string().min(1, "Tên nguyên liệu không được để trống"),
  donViTinh: z.string().min(1, "Đơn vị tính không được để trống"),
  nhaCungCap: z.array(z.object({
    maNhacungCap: z.string(),
    donGia: z.number().min(0, "Đơn giá phải lớn hơn hoặc bằng 0")
  })).min(1, "Phải chọn ít nhất một nhà cung cấp"),
  hoatDong: z.boolean(),
  nguyenLieuHaoHut: z.boolean(),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface Ingredient {
  _id?: string;
  ten: string;
  donViTinh: string;
  nhaCungCap: Array<{
    maNhacungCap: string;
    donGia: number;
  }>;
  hoatDong: boolean;
  nguyenLieuHaoHut: boolean;
  ngayTao?: string;
  ngayCapNhat?: string;
}

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient;
  onSubmit: (data: IngredientFormValues) => Promise<void>;
  mode: "add" | "edit";
  suppliers: Array<{ _id: string; ten: string }>;
}

// Danh sách đơn vị tính
const donViTinhOptions = [
  { value: "gram", label: "gram" },
  { value: "ml", label: "ml" },
  { value: "kg", label: "kg" },
  { value: "lít", label: "lít" }
];

export default function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onSubmit,
  mode,
  suppliers
}: IngredientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Array<{
    maNhacungCap: string;
    donGia: number;
  }>>([]);

  // Khởi tạo form với giá trị mặc định
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      ten: "",
      donViTinh: "kg",
      nhaCungCap: [],
      hoatDong: true,
      nguyenLieuHaoHut: false,
    },
  });

  // Cập nhật giá trị form khi ingredient thay đổi
  useEffect(() => {
    if (ingredient && mode === "edit") {
      form.reset({
        ten: ingredient.ten || "",
        donViTinh: ingredient.donViTinh || "kg",
        nhaCungCap: ingredient.nhaCungCap || [],
        hoatDong: ingredient.hoatDong !== undefined ? ingredient.hoatDong : true,
        nguyenLieuHaoHut: ingredient.nguyenLieuHaoHut !== undefined ? ingredient.nguyenLieuHaoHut : false,
      });
      setSelectedSuppliers(ingredient.nhaCungCap || []);
    } else if (mode === "add") {
      form.reset({
        ten: "",
        donViTinh: "kg",
        nhaCungCap: [],
        hoatDong: true,
        nguyenLieuHaoHut: false,
      });
      setSelectedSuppliers([]);
    }
  }, [ingredient, mode, form]);

  // Thêm nhà cung cấp
  const handleAddSupplier = (supplierId: string) => {
    if (selectedSuppliers.find(s => s.maNhacungCap === supplierId)) {
      toast.error("Nhà cung cấp đã được chọn");
      return;
    }

    const newSupplier = {
      maNhacungCap: supplierId,
      donGia: 0
    };

    const updatedSuppliers = [...selectedSuppliers, newSupplier];
    setSelectedSuppliers(updatedSuppliers);
    form.setValue("nhaCungCap", updatedSuppliers);
  };

  // Xóa nhà cung cấp
  const handleRemoveSupplier = (supplierId: string) => {
    const updatedSuppliers = selectedSuppliers.filter(s => s.maNhacungCap !== supplierId);
    setSelectedSuppliers(updatedSuppliers);
    form.setValue("nhaCungCap", updatedSuppliers);
  };

  // Cập nhật đơn giá
  const handlePriceChange = (supplierId: string, price: string) => {
    const numPrice = parseFloat(price) || 0;
    const updatedSuppliers = selectedSuppliers.map(s => 
      s.maNhacungCap === supplierId 
        ? { ...s, donGia: numPrice }
        : s
    );
    setSelectedSuppliers(updatedSuppliers);
    form.setValue("nhaCungCap", updatedSuppliers);
  };

  // Lấy tên nhà cung cấp
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    return supplier ? supplier.ten : supplierId;
  };

  // Lấy danh sách nhà cung cấp chưa được chọn
  const availableSuppliers = suppliers.filter(
    supplier => !selectedSuppliers.find(s => s.maNhacungCap === supplier._id)
  );

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
      setSelectedSuppliers([]);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

            {/* Thêm nhà cung cấp */}
            <div className="space-y-3">
              <FormLabel>Nhà cung cấp</FormLabel>
              
              {/* Select để thêm nhà cung cấp */}
              {availableSuppliers.length > 0 && (
                <div className="flex gap-2">
                  <Select onValueChange={(value) => handleAddSupplier(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn nhà cung cấp để thêm" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSuppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.ten}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Bảng hiển thị nhà cung cấp đã chọn */}
              {selectedSuppliers.length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead>Đơn giá (VNĐ)</TableHead>
                        <TableHead className="w-[80px]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSuppliers.map((supplier) => (
                        <TableRow key={supplier.maNhacungCap}>
                          <TableCell>
                            {getSupplierName(supplier.maNhacungCap)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={supplier.donGia}
                              onChange={(e) => handlePriceChange(supplier.maNhacungCap, e.target.value)}
                              placeholder="Nhập đơn giá"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSupplier(supplier.maNhacungCap)}
                              className="h-8 w-8 text-destructive hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedSuppliers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có nhà cung cấp nào được chọn
                </p>
              )}

              <FormField
                control={form.control}
                name="nhaCungCap"
                render={() => (
                  <FormMessage />
                )}
              />
            </div>

            {/* Checkbox controls */}
            <div className="space-y-4">
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
                        Nguyên liệu sẽ hiển thị trong danh sách
                      </p>
                    </div>
                  </FormItem>
                )}
              />

            </div>

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
