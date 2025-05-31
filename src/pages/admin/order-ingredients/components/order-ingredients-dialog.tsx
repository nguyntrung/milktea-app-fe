import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { getData } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Ban, CalendarIcon, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema cho form đặt nguyên liệu
const orderSchema = z.object({
  maNhaCungCap: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
  ngayDat: z.date({
    required_error: "Vui lòng chọn ngày đặt",
  }),
  thoiGianCanGiao: z.date({
    required_error: "Vui lòng chọn thời gian cần giao",
  }),
  nguyenLieu: z.array(
    z.object({
      maNguyenLieu: z.string().min(1, "Vui lòng chọn nguyên liệu"),
      soLuong: z.coerce.number().min(1, "Số lượng phải lớn hơn 0"),
    })
  ).min(1, "Phải có ít nhất một nguyên liệu"),
  trangThai: z.string().default("DATAO"),
  nguoiDat: z.string().min(1, "Vui lòng nhập người đặt"),
});

// Schema cho form nhập nguyên liệu
const importSchema = z.object({
  nguoiNhap: z.string().min(1, "Vui lòng nhập người nhập"),
  ngayNhap: z.date({
    required_error: "Vui lòng chọn ngày nhập",
  }),
  nguyenLieu: z.array(
    z.object({
      maNguyenLieu: z.string().min(1, "Vui lòng chọn nguyên liệu"),
      soLuong: z.coerce.number().min(1, "Số lượng phải lớn hơn 0"),
      donGia: z.coerce.number().min(0, "Đơn giá không được âm"),
      thanhTien: z.coerce.number().min(0, "Thành tiền không được âm"),
    })
  ).min(1, "Phải có ít nhất một nguyên liệu"),
  tongTien: z.coerce.number().min(0, "Tổng tiền không được âm"),
  trangThai: z.string().default("DANHAP"),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type ImportFormValues = z.infer<typeof importSchema>;

interface OrderIngredient {
  _id: string;
  maNhaCungCap: string;
  ngayDat: string;
  thoiGianCanGiao: string;
  nguyenLieu: {
    maNguyenLieu: string;
    soLuong: number;
    donGia?: number;
    thanhTien?: number;
    _id: string;
  }[];
  trangThai: "DATAO" | "DANHAP" | "DAHUY";
  nguoiDat: string;
  ngayTao?: string;
  ngayCapNhat?: string;
  ngayNhap?: string;
  nguoiNhap?: string;
  tongTien?: number;
}

interface OrderIngredientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderIngredient;
  onSubmit: (data: any, mode: "create" | "import") => Promise<void>;
  mode: "create" | "import";
}

export default function OrderIngredientsDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
  mode: initialMode
}: OrderIngredientsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "import">(initialMode);
  const [suppliers, setSuppliers] = useState<{ _id: string; ten: string }[]>([]);
  const [ingredients, setIngredients] = useState<{ _id: string; ten: string; donViTinh: string; maNhaCungCap: { _id: string; ten: string }[]; hoatDong: boolean; nguyenLieuHaoHut: boolean }[]>([]);
  
  // Lấy userID từ localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          return userData._id || '';
        } catch (error) {
          console.error('Lỗi khi parse dữ liệu user:', error);
        }
      }
    }
    return '';
  };
  
  const userId = getUserId();

  // Form đặt nguyên liệu
  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      maNhaCungCap: "",
      ngayDat: new Date(),
      thoiGianCanGiao: new Date(),
      nguyenLieu: [{ maNguyenLieu: "", soLuong: 1 }],
      trangThai: "DATAO",
      nguoiDat: userId, // Sử dụng userID từ localStorage
    },
  });

  // Form nhập nguyên liệu
  const importForm = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      nguoiNhap: userId, // Sử dụng userID từ localStorage
      ngayNhap: new Date(),
      nguyenLieu: [{ maNguyenLieu: "", soLuong: 1, donGia: 0, thanhTien: 0 }],
      tongTien: 0,
      trangThai: "DANHAP",
    },
  });

  // Field array cho danh sách nguyên liệu trong form đặt
  const orderIngredientsFields = useFieldArray({
    control: orderForm.control,
    name: "nguyenLieu",
  });

  // Field array cho danh sách nguyên liệu trong form nhập
  const importIngredientsFields = useFieldArray({
    control: importForm.control,
    name: "nguyenLieu",
  });

  // Lấy danh sách nhà cung cấp và nguyên liệu
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách nhà cung cấp
        const suppliersResponse = await getData("/api/suppliers");
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          setSuppliers(suppliersResponse.data || []);
        }
        
        // Lấy danh sách nguyên liệu
        const ingredientsResponse = await getData("/api/ingredients");
        if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
          setIngredients(ingredientsResponse.data || []);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        toast.error("Không thể tải dữ liệu nhà cung cấp và nguyên liệu");
      }
    };

    fetchData();
  }, []);

  // Cập nhật giá trị form khi order thay đổi
  useEffect(() => {
    if (order) {
      if (initialMode === "create") {
        orderForm.reset({
          maNhaCungCap: order.maNhaCungCap || "",
          ngayDat: order.ngayDat ? new Date(order.ngayDat) : new Date(),
          thoiGianCanGiao: order.thoiGianCanGiao ? new Date(order.thoiGianCanGiao) : new Date(),
          nguyenLieu: order.nguyenLieu.map(item => ({
            maNguyenLieu: item.maNguyenLieu,
            soLuong: item.soLuong
          })),
          trangThai: order.trangThai || "DATAO",
          nguoiDat: order.nguoiDat || userId, // Sử dụng userID từ localStorage nếu không có giá trị
        });
      } else if (initialMode === "import") {
        importForm.reset({
          nguoiNhap: order.nguoiNhap || userId, // Sử dụng userID từ localStorage nếu không có giá trị
          ngayNhap: order.ngayNhap ? new Date(order.ngayNhap) : new Date(),
          nguyenLieu: order.nguyenLieu.map(item => ({
            maNguyenLieu: item.maNguyenLieu,
            soLuong: item.soLuong,
            donGia: item.donGia || 0,
            thanhTien: item.thanhTien || 0
          })),
          tongTien: order.tongTien || 0,
          trangThai: "DANHAP",
        });
      }
    } else {
      if (initialMode === "create") {
        orderForm.reset({
          maNhaCungCap: "",
          ngayDat: new Date(),
          thoiGianCanGiao: new Date(),
          nguyenLieu: [{ maNguyenLieu: "", soLuong: 1 }],
          trangThai: "DATAO",
          nguoiDat: userId, // Sử dụng userID từ localStorage
        });
      } else {
        importForm.reset({
          nguoiNhap: userId, // Sử dụng userID từ localStorage
          ngayNhap: new Date(),
          nguyenLieu: [{ maNguyenLieu: "", soLuong: 1, donGia: 0, thanhTien: 0 }],
          tongTien: 0,
          trangThai: "DANHAP",
        });
      }
    }
  }, [order, initialMode, orderForm, importForm, userId]);

  // Xử lý khi submit form đặt nguyên liệu
  const handleOrderSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      
      // Chuyển đổi ngày thành chuỗi ISO
      const formattedData = {
        ...data,
        ngayDat: format(data.ngayDat, "yyyy-MM-dd"),
        thoiGianCanGiao: format(data.thoiGianCanGiao, "yyyy-MM-dd"),
      };
      
      await onSubmit(formattedData, "create");
      
      // Hiển thị thông báo thành công
      toast.success("Tạo đơn đặt nguyên liệu thành công");
      
      // Đóng dialog và reset form
      onOpenChange(false);
      orderForm.reset({
        ...orderForm.getValues(),
        nguoiDat: userId, // Đảm bảo nguoiDat luôn được đặt lại
      });
    } catch (error) {
      console.error("Lỗi khi tạo đơn đặt nguyên liệu:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn đặt nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi submit form nhập nguyên liệu
  const handleImportSubmit = async (data: ImportFormValues) => {
    try {
      setLoading(true);
      
      // Chuyển đổi ngày thành chuỗi ISO
      const formattedData = {
        ...data,
        ngayNhap: format(data.ngayNhap, "yyyy-MM-dd"),
      };
      
      await onSubmit(formattedData, "import");
      
      // Hiển thị thông báo thành công
      toast.success("Nhập nguyên liệu thành công");
      
      // Đóng dialog và reset form
      onOpenChange(false);
      importForm.reset({
        ...importForm.getValues(),
        nguoiNhap: userId, // Đảm bảo nguoiNhap luôn được đặt lại
      });
    } catch (error) {
      console.error("Lỗi khi nhập nguyên liệu:", error);
      toast.error("Có lỗi xảy ra khi nhập nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  // Tính thành tiền khi thay đổi số lượng hoặc đơn giá
  const calculateTotal = (index: number) => {
    const values = importForm.getValues();
    const item = values.nguyenLieu[index];
    const thanhTien = item.soLuong * item.donGia;
    
    // Cập nhật thành tiền cho item
    importForm.setValue(`nguyenLieu.${index}.thanhTien`, thanhTien);
    
    // Tính lại tổng tiền
    const tongTien = values.nguyenLieu.reduce((sum, item) => {
      return sum + (item.soLuong * item.donGia);
    }, 0);
    
    importForm.setValue("tongTien", tongTien);
  };

  // Lấy tên nguyên liệu từ ID
  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find(i => i._id === id);
    return ingredient ? ingredient.ten : id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {initialMode === "create" ? "Tạo đơn đặt nguyên liệu" : "Nhập nguyên liệu"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "create" | "import")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Đặt nguyên liệu</TabsTrigger>
            <TabsTrigger value="import">Nhập nguyên liệu</TabsTrigger>
          </TabsList>
          
          {/* Tab đặt nguyên liệu */}
          <TabsContent value="create">
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(handleOrderSubmit)} className="space-y-4">
                {/* Nhà cung cấp */}
                <FormField
                  control={orderForm.control}
                  name="maNhaCungCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà cung cấp</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhà cung cấp" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier._id} value={supplier._id}>
                              {supplier.ten}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  {/* Ngày đặt */}
                  <FormField
                    control={orderForm.control}
                    name="ngayDat"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày đặt</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Thời gian cần giao */}
                  <FormField
                    control={orderForm.control}
                    name="thoiGianCanGiao"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Thời gian cần giao</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
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
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Người đặt - Ẩn trường này vì đã lấy từ localStorage */}
                <FormField
                  control={orderForm.control}
                  name="nguoiDat"
                  render={({ field }) => (
                    <FormItem className="hidden"> {/* Ẩn trường này */}
                      <FormLabel>Người đặt</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Danh sách nguyên liệu */}
                <div>
                  <div className="flex justify-start items-center mb-2">
                    <FormLabel>Danh sách nguyên liệu</FormLabel>
                    <Button
                      className="ml-2 cursor-pointer"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => orderIngredientsFields.append({ maNguyenLieu: "", soLuong: 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {orderIngredientsFields.fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 mb-2">
                      <FormField
                        control={orderForm.control}
                        name={`nguyenLieu.${index}.maNguyenLieu`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn nguyên liệu" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient._id} value={ingredient._id}>
                                    {ingredient.ten}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={orderForm.control}
                        name={`nguyenLieu.${index}.soLuong`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Số lượng" 
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => orderIngredientsFields.remove(index)}
                        disabled={orderIngredientsFields.fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="cursor-pointer">
                      <Ban /> Hủy
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    <Save /> {loading ? "Đang xử lý..." : "Tạo đơn đặt"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Tab nhập nguyên liệu */}
          <TabsContent value="import">
            <Form {...importForm}>
              <form onSubmit={importForm.handleSubmit(handleImportSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {/* Người nhập - Ẩn trường này vì đã lấy từ localStorage */}
                  <FormField
                    control={importForm.control}
                    name="nguoiNhap"
                    render={({ field }) => (
                      <FormItem className="hidden"> {/* Ẩn trường này */}
                        <FormLabel>Người nhập</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ngày nhập */}
                  <FormField
                    control={importForm.control}
                    name="ngayNhap"
                    render={({ field }) => (
                      <FormItem className="flex flex-col col-span-2">
                        <FormLabel>Ngày nhập</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Danh sách nguyên liệu */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Danh sách nguyên liệu</FormLabel>
                    <div className="text-sm text-right">
                      <span className="font-medium">Tổng tiền: </span>
                      <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(importForm.watch("tongTien") || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
                    <div className="col-span-4">Nguyên liệu</div>
                    <div className="col-span-2">Số lượng</div>
                    <div className="col-span-2">Đơn giá</div>
                    <div className="col-span-3">Thành tiền</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {importIngredientsFields.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-4">
                        <FormField
                          control={importForm.control}
                          name={`nguyenLieu.${index}.maNguyenLieu`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  value={field.value}
                                  disabled={order?.trangThai === "DATAO"}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn nguyên liệu" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ingredients.map((ingredient) => (
                                      <SelectItem key={ingredient._id} value={ingredient._id}>
                                        {ingredient.ten}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={importForm.control}
                          name={`nguyenLieu.${index}.soLuong`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Số lượng" 
                                  min={1}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseInt(e.target.value) || 0);
                                    calculateTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={importForm.control}
                          name={`nguyenLieu.${index}.donGia`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Đơn giá" 
                                  min={0}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseInt(e.target.value) || 0);
                                    calculateTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <FormField
                          control={importForm.control}
                          name={`nguyenLieu.${index}.thanhTien`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  readOnly
                                  value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(field.value || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            importIngredientsFields.remove(index);
                            // Tính lại tổng tiền sau khi xóa
                            setTimeout(() => {
                              const values = importForm.getValues();
                              const tongTien = values.nguyenLieu.reduce((sum, item) => {
                                return sum + (item.soLuong * item.donGia);
                              }, 0);
                              importForm.setValue("tongTien", tongTien);
                            }, 0);
                          }}
                          disabled={importIngredientsFields.fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    className="w-full mt-2 cursor-pointer"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      importIngredientsFields.append({ 
                        maNguyenLieu: "", 
                        soLuong: 1, 
                        donGia: 0, 
                        thanhTien: 0 
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm nguyên liệu
                  </Button>
                </div>

                {/* Tổng tiền */}
                <FormField
                  control={importForm.control}
                  name="tongTien"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tổng tiền</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          readOnly
                          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(field.value || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="cursor-pointer">
                      <Ban /> Hủy
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    <Save /> {loading ? "Đang xử lý..." : "Nhập nguyên liệu"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
