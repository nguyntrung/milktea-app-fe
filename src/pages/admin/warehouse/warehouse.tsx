import { useState, useEffect } from "react";
import { getData, postData, putData } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Định nghĩa kiểu dữ liệu
interface Ingredient {
  _id: string;
  ten: string;
  donViTinh: string;
}

interface WarehouseItem {
  _id: string;
  ngay: string;
  maNguyenLieu: {
    _id: string;
    ten: string;
  };
  donViTinh: string;
  soLuongBanDau: number;
  soLuongBan: number;
  soLuongNhap: number;
  soLuongHaoHut: number;
  soLuongTon: number;
  ngayTao: string;
  ngayCapNhat: string;
}

// Schema cho form thêm/cập nhật kiểm kho
const warehouseFormSchema = z.object({
  ngay: z.date({
    required_error: "Vui lòng chọn ngày kiểm kho",
  }),
  maNguyenLieu: z.string({
    required_error: "Vui lòng chọn nguyên liệu",
  }),
  soLuongBanDau: z.coerce.number().min(0, "Số lượng không được âm"),
  soLuongNhap: z.coerce.number().min(0, "Số lượng không được âm"),
  soLuongBan: z.coerce.number().min(0, "Số lượng không được âm"),
  soLuongHaoHut: z.coerce.number().min(0, "Số lượng không được âm"),
});

type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export default function Warehouse() {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // Form cho thêm/cập nhật kiểm kho
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      ngay: new Date(),
      maNguyenLieu: "",
      soLuongBanDau: 0,
      soLuongNhap: 0,
      soLuongBan: 0,
      soLuongHaoHut: 0,
    },
  });

  // Lấy danh sách kiểm kho và nguyên liệu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy danh sách kiểm kho
        const warehouseResponse = await getData("/api/statistic-ingredients");
        if (warehouseResponse.success && Array.isArray(warehouseResponse.data)) {
          setWarehouseItems(warehouseResponse.data);
        }

        // Lấy danh sách nguyên liệu
        const ingredientsResponse = await getData("/api/ingredients");
        if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
          setIngredients(ingredientsResponse.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Xử lý khi chọn một mục để cập nhật
  const handleSelectItem = (item: WarehouseItem) => {
    setSelectedItem(item);
    
    // Cập nhật giá trị form
    form.reset({
      ngay: new Date(item.ngay),
      maNguyenLieu: item.maNguyenLieu._id,
      soLuongBanDau: item.soLuongBanDau,
      soLuongNhap: item.soLuongNhap,
      soLuongBan: item.soLuongBan,
      soLuongHaoHut: item.soLuongHaoHut,
    });
    
    setOpenDialog(true);
  };

  // Xử lý khi mở dialog thêm mới
  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({
      ngay: new Date(),
      maNguyenLieu: "",
      soLuongBanDau: 0,
      soLuongNhap: 0,
      soLuongBan: 0,
      soLuongHaoHut: 0,
    });
    setOpenDialog(true);
  };

  // Xử lý khi submit form
  const onSubmit = async (data: WarehouseFormValues) => {
    try {
      // Tính toán số lượng tồn
      const soLuongTon = data.soLuongBanDau + data.soLuongNhap - data.soLuongBan - data.soLuongHaoHut;
      
      // Lấy đơn vị tính của nguyên liệu
      const selectedIngredient = ingredients.find(ing => ing._id === data.maNguyenLieu);
      const donViTinh = selectedIngredient?.donViTinh || "";
      
      // Chuẩn bị dữ liệu gửi đi
      const payload = {
        ...data,
        donViTinh,
        soLuongTon,
      };
      
      if (selectedItem) {
        // Cập nhật
        await putData(`/api/statistic-ingredients`, {
          ...payload,
          _id: selectedItem._id,
        });
        toast.success("Cập nhật kiểm kho thành công");
      } else {
        // Thêm mới
        await postData("/api/statistic-ingredients", payload);
        toast.success("Thêm kiểm kho thành công");
      }
      
      // Tải lại dữ liệu
      const response = await getData("/api/statistic-ingredients");
      if (response.success && Array.isArray(response.data)) {
        setWarehouseItems(response.data);
      }
      
      // Đóng dialog
      setOpenDialog(false);
    } catch (err) {
      console.error("Lỗi khi xử lý dữ liệu:", err);
      toast.error(selectedItem ? "Lỗi khi cập nhật kiểm kho" : "Lỗi khi thêm kiểm kho");
    }
  };

  // Format số lượng với đơn vị tính
  const formatQuantity = (quantity: number | null | undefined, unit: string) => {
    if (quantity === null || quantity === undefined) {
      return `0.00 ${unit}`;
    }
    return `${quantity.toFixed(2)} ${unit}`;
  };

  // Tính tổng số lượng tồn kho theo nguyên liệu
  const calculateTotalStock = (ingredientId: string) => {
    const items = warehouseItems.filter(item => item.maNguyenLieu._id === ingredientId);
    if (items.length === 0) return 0;
    
    return items.reduce((total, item) => total + item.soLuongTon, 0);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card h-fit w-full rounded-md py-3 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý kho hàng</CardTitle>
              <CardDescription>
                Kiểm tra và cập nhật tồn kho nguyên liệu
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Tạo phiếu kiểm kho
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "list" | "add")}>
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="list">Danh sách kiểm kho</TabsTrigger>
              <TabsTrigger value="add">Tồn kho hiện tại</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : warehouseItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu kiểm kho
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Nguyên liệu</TableHead>
                      <TableHead>Số lượng ban đầu</TableHead>
                      <TableHead>Nhập</TableHead>
                      <TableHead>Bán</TableHead>
                      <TableHead>Hao hụt</TableHead>
                      <TableHead>Tồn</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="border-1 rounded-xl">
                    {warehouseItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          {format(new Date(item.ngay), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.maNguyenLieu.ten}
                        </TableCell>
                        <TableCell>{formatQuantity(item.soLuongBanDau, item.donViTinh)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatQuantity(item.soLuongNhap, item.donViTinh)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatQuantity(item.soLuongBan, item.donViTinh)}
                        </TableCell>
                        <TableCell className="text-amber-600">
                          {formatQuantity(item.soLuongHaoHut, item.donViTinh)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatQuantity(item.soLuongTon, item.donViTinh)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSelectItem(item)}
                          >
                            Cập nhật
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="add">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : ingredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu nguyên liệu
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nguyên liệu</TableHead>
                      <TableHead>Đơn vị tính</TableHead>
                      <TableHead>Tồn kho hiện tại</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.map((ingredient) => (
                      <TableRow key={ingredient._id}>
                        <TableCell className="font-medium">
                          {ingredient.ten}
                        </TableCell>
                        <TableCell>{ingredient.donViTinh}</TableCell>
                        <TableCell className="font-medium">
                          {formatQuantity(calculateTotalStock(ingredient._id), ingredient.donViTinh)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedItem(null);
                              form.reset({
                                ngay: new Date(),
                                maNguyenLieu: ingredient._id,
                                soLuongBanDau: calculateTotalStock(ingredient._id),
                                soLuongNhap: 0,
                                soLuongBan: 0,
                                soLuongHaoHut: 0,
                              });
                              setOpenDialog(true);
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Cập nhật kho
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog thêm/cập nhật kiểm kho */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Cập nhật kiểm kho" : "Thêm phiếu kiểm kho mới"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin kiểm kho cho nguyên liệu
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {/* Ngày kiểm kho */}
                <FormField
                  control={form.control}
                  name="ngay"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày kiểm kho</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Nguyên liệu */}
                <FormField
                  control={form.control}
                  name="maNguyenLieu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nguyên liệu</FormLabel>
                      <Select
                        disabled={selectedItem !== null}
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
                              {ingredient.ten} ({ingredient.donViTinh})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Số lượng ban đầu */}
                <FormField
                  control={form.control}
                  name="soLuongBanDau"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng ban đầu</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Số lượng nhập */}
                <FormField
                  control={form.control}
                  name="soLuongNhap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng nhập</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Hiển thị số lượng tồn dự kiến */}
              {selectedItem && (
                <div className="rounded-md border p-4">
                  <div className="font-medium">Số lượng tồn hiện tại:</div>
                  <div className="text-xl font-medium mt-1">
                    {formatQuantity(selectedItem.soLuongTon, selectedItem.donViTinh)}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit">
                  {selectedItem ? "Cập nhật" : "Thêm mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
