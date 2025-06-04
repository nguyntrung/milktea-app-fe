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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Định nghĩa schema validation cho form
const toppingSchema = z.object({
  ten: z.string().min(1, "Tên topping không được để trống"),
  gia: z.coerce.number().min(0, "Giá không được âm"),
  donViTinh: z.string().min(1, "Đơn vị tính không được để trống"),
  soLuongMotPhan: z.coerce.number().min(0, "Số lượng không được âm"),
  hoatDong: z.boolean().optional(),
});

type ToppingFormValues = z.infer<typeof toppingSchema>;

interface Topping {
  _id?: string;
  ten: string;
  gia: number;
  donViTinh: string;
  soLuongMotPhan: number;
  hoatDong: boolean;
}

interface ToppingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topping?: Topping;
  onSubmit: (data: ToppingFormValues) => Promise<void>;
  mode: "add" | "edit";
}

// Danh sách đơn vị tính
const donViTinhOptions = [
  { value: "gram", label: "gram" },
  { value: "ml", label: "ml" },
  { value: "miếng", label: "miếng" }
];

export default function ToppingDialog({
  open,
  onOpenChange,
  topping,
  onSubmit,
  mode
}: ToppingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  // Khởi tạo form với giá trị mặc định
  const form = useForm<ToppingFormValues>({
    resolver: zodResolver(toppingSchema),
    defaultValues: {
      ten: "",
      gia: 0,
      donViTinh: topping?.donViTinh || "gram",
      soLuongMotPhan: 0,
      hoatDong: true,
    } as ToppingFormValues,
  });

  // Cập nhật giá trị form khi topping thay đổi
  useEffect(() => {
    if (topping && mode === "edit") {
      form.reset({
        ten: topping.ten || "",
        gia: topping.gia || 0,
        donViTinh: topping.donViTinh || "gram",
        soLuongMotPhan: topping.soLuongMotPhan || 0,
        hoatDong: topping.hoatDong !== undefined ? topping.hoatDong : true,
      });
  
      // Cập nhật inputValue cho ô giá
      setInputValue(topping.gia.toString());
    } else if (mode === "add") {
      form.reset({
        ten: "",
        gia: 0,
        donViTinh: "gram",
        soLuongMotPhan: 0,
        hoatDong: true,
      });
  
      // Reset inputValue
      setInputValue("");
    }
  }, [topping, mode, form]);  

  // Xử lý khi submit form
  const handleSubmit = async (data: ToppingFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
      
      // Hiển thị thông báo thành công
      toast.success(
        mode === "add" 
          ? "Thêm topping thành công" 
          : "Cập nhật topping thành công"
      );
      
      // Đóng dialog và reset form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi khi xử lý topping:", error);
      toast.error(
        mode === "add"
          ? "Có lỗi xảy ra khi thêm topping"
          : "Có lỗi xảy ra khi cập nhật topping"
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
            {mode === "add" ? "Thêm topping mới" : "Cập nhật topping"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tên topping */}
            <FormField
              // control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên topping</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên topping" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Giá */}
            <FormField
              // control={form.control}
              name="gia"
              render={({ field }) => {
                
                const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setInputValue(value);
                  
                  // Chuyển đổi giá trị thành số
                  const numValue = parseInt(value);
                  
                  // Nếu là số hợp lệ và nhỏ hơn 1000, tự động nhân với 1000
                  if (!isNaN(numValue) && numValue > 0 && numValue < 1000) {
                    // Hiển thị giá trị gốc trong input, nhưng cập nhật giá trị thực tế
                    field.onChange(numValue * 1000);
                  } else {
                    // Nếu là số lớn hơn 1000, giữ nguyên giá trị
                    field.onChange(isNaN(numValue) ? 0 : numValue);
                  }
                };
                
                return (
                  <FormItem>
                    <FormLabel>Giá (VNĐ)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Nhập giá" 
                        value={inputValue}
                        onChange={handlePriceChange}
                        onBlur={() => {
                          // Khi blur, hiển thị giá trị thực tế đã được nhân
                          setInputValue(field.value ? field.value.toString() : "");
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      {!isNaN(parseInt(inputValue)) && parseInt(inputValue) > 0 && parseInt(inputValue) < 1000 ? (
                        <span>Giá thực tế: {(parseInt(inputValue) * 1000).toLocaleString('vi-VN')} VNĐ</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gợi ý: Nhập 5 cho 5.000đ, 10 cho 10.000đ, 50 cho 50.000đ...
                    </p>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Số lượng một phần */}
            <FormField
              // control={form.control}
              name="soLuongMotPhan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng một phần</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Nhập số lượng một phần" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Đơn vị tính */}
            <FormField
              // control={form.control}
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

            {/* Trạng thái hoạt động */}
            <FormField
              // control={form.control}
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
                      Topping sẽ hiển thị trên trang web
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
                    ? "Thêm topping" 
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
