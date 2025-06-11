import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Ban, CalendarIcon, Save } from "lucide-react";
import { postData, getData } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar";

// Định nghĩa interface cho nguyên liệu đã chọn
interface SelectedIngredient {
  _id: string;
  ten: string;
  donViTinh: string;
  soLuongTon: number;
  canNhap: boolean;
  maNhaCungCap?: string; // ID nhà cung cấp được chọn
  soLuong?: number; // Số lượng cần nhập
  thoiGianCanGiao?: Date; // Thời gian cần giao riêng cho từng nguyên liệu
}

// Định nghĩa interface cho nhà cung cấp
interface Supplier {
  _id: string;
  ten: string;
  diaChi?: string;
  lienHe?: string;
  hoatDong?: boolean;
}

// Định nghĩa interface cho nhà cung cấp trong ingredients - CẬP NHẬT
interface IngredientSupplier {
  maNhacungCap: string; // Chú ý: API trả về 'maNhacungCap' (chữ thường 'c')
  donGia: number;
}

// Định nghĩa interface cho ingredient từ API - CẬP NHẬT
interface IngredientFromAPI {
  _id: string;
  ten: string;
  donViTinh: string;
  nhaCungCap: IngredientSupplier[]; // Đây là mảng object chứa maNhacungCap và donGia
  hoatDong: boolean;
  nguyenLieuHaoHut?: boolean;
  ngayTao?: string;
  ngayCapNhat?: string;
  __v?: number;
}

// Định nghĩa props cho component
interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIngredients: SelectedIngredient[];
  onSubmitSuccess: () => void;
}

export default function WarehouseDialog({
  open,
  onOpenChange,
  selectedIngredients,
  onSubmitSuccess
}: WarehouseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<{[key: string]: SelectedIngredient[]}>({});
  const [availableSuppliers, setAvailableSuppliers] = useState<{[key: string]: Supplier[]}>({});

  // Lấy userID từ localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || "defaultUserId";
    }
    return "defaultUserId";
  };

  // Khởi tạo danh sách nguyên liệu từ props
  useEffect(() => {
    if (selectedIngredients.length > 0) {
      // Thêm trường soLuong và thoiGianCanGiao mặc định cho mỗi nguyên liệu
      const ingredientsWithQuantity = selectedIngredients.map(ingredient => ({
        ...ingredient,
        soLuong: 1,
        thoiGianCanGiao: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Mặc định sau 3 ngày
      }));
      setIngredients(ingredientsWithQuantity);
    }
  }, [selectedIngredients]);

  // Lấy danh sách nhà cung cấp và thông tin chi tiết nguyên liệu - ĐÃ SỬA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách tất cả nhà cung cấp
        const suppliersResponse = await getData('/api/suppliers');
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          setSuppliers(suppliersResponse.data);
          console.log("Suppliers loaded:", suppliersResponse.data);
        }

        // Lấy thông tin chi tiết nguyên liệu để có danh sách nhà cung cấp cho từng nguyên liệu
        const ingredientsResponse = await getData('/api/ingredients');
        if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
          const ingredientSuppliers: {[key: string]: Supplier[]} = {};
          
          // Tạo mapping giữa ingredient ID và danh sách nhà cung cấp của nó
          ingredientsResponse.data.forEach((ingredient: IngredientFromAPI) => {
            if (ingredient.nhaCungCap && Array.isArray(ingredient.nhaCungCap)) {
              // Lấy danh sách ID nhà cung cấp từ mảng nhaCungCap
              const supplierIds = ingredient.nhaCungCap.map(item => item.maNhacungCap);
              
              // Tìm thông tin chi tiết của các nhà cung cấp từ danh sách suppliers
              const ingredientSupplierList = suppliersResponse.data.filter((supplier: Supplier) => 
                supplierIds.includes(supplier._id)
              );
              
              ingredientSuppliers[ingredient._id] = ingredientSupplierList;
              
              console.log(`Ingredient ${ingredient.ten}:`, {
                supplierIds,
                availableSuppliers: ingredientSupplierList
              });
            }
          });
          
          setAvailableSuppliers(ingredientSuppliers);
          console.log("Available suppliers by ingredient:", ingredientSuppliers);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        toast.error("Không thể lấy danh sách nhà cung cấp");
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Xử lý khi chọn nhà cung cấp cho nguyên liệu
  const handleSupplierChange = (ingredientId: string, supplierId: string) => {
    // Kiểm tra ObjectId hợp lệ (24 ký tự hex)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(supplierId)) {
      toast.error("Nhà cung cấp không hợp lệ");
      return;
    }

    setIngredients(prev => 
      prev.map(item => 
        item._id === ingredientId ? { ...item, maNhaCungCap: supplierId } : item
      )
    );
  };

  // Xử lý khi thay đổi số lượng
  const handleQuantityChange = (ingredientId: string, quantity: number) => {
    setIngredients(prev => 
      prev.map(item => 
        item._id === ingredientId ? { ...item, soLuong: quantity } : item
      )
    );
  };

  // Xử lý khi thay đổi thời gian cần giao
  const handleDeliveryTimeChange = (ingredientId: string, date: Date) => {
    setIngredients(prev => 
      prev.map(item => 
        item._id === ingredientId ? { ...item, thoiGianCanGiao: date } : item
      )
    );
  };

  // Gom nhóm nguyên liệu theo nhà cung cấp và thời gian cần giao
  const groupIngredientsBySupplierAndDeliveryTime = () => {
    const grouped: {[key: string]: SelectedIngredient[]} = {};
    
    // Lọc ra những nguyên liệu đã có nhà cung cấp
    const validIngredients = ingredients.filter(ing => ing.maNhaCungCap);
    
    validIngredients.forEach(ingredient => {
      const supplierId = ingredient.maNhaCungCap as string;
      const deliveryDate = ingredient.thoiGianCanGiao?.toDateString() || 'no-date';
      
      // Tạo key kết hợp giữa nhà cung cấp và ngày giao
      const groupKey = `${supplierId}_${deliveryDate}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(ingredient);
    });
    
    return grouped;
  };

  // Cập nhật nhóm nguyên liệu khi có thay đổi
  useEffect(() => {
    const grouped = groupIngredientsBySupplierAndDeliveryTime();
    setGroupedOrders(grouped);
  }, [ingredients]);

  // Xử lý tạo phiếu đặt hàng
  const handleCreateOrders = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra xem tất cả nguyên liệu đã được chọn nhà cung cấp chưa
      const invalidIngredients = ingredients.filter(ing => !ing.maNhaCungCap);
      if (invalidIngredients.length > 0) {
        toast.error(`Vui lòng chọn nhà cung cấp cho ${invalidIngredients.length} nguyên liệu`);
        setLoading(false);
        return;
      }
      
      // Tạo các phiếu đặt hàng theo nhóm nhà cung cấp và thời gian giao
      const orderPromises = Object.entries(groupedOrders).map(async ([, items]) => {
        // Lấy thông tin nhà cung cấp và thời gian giao từ item đầu tiên (vì cùng nhóm)
        const firstItem = items[0];
        const supplierId = firstItem.maNhaCungCap as string;
        const deliveryTime = firstItem.thoiGianCanGiao || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        
        // Validate ObjectId trước khi gửi
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(supplierId)) {
          throw new Error(`ID nhà cung cấp không hợp lệ: ${supplierId}`);
        }
        
        // Validate tất cả ingredient IDs
        for (const item of items) {
          if (!objectIdRegex.test(item._id)) {
            throw new Error(`ID nguyên liệu không hợp lệ: ${item._id}`);
          }
        }
        
        const orderData = {
          maNhaCungCap: supplierId,
          nguoiDat: getUserId(),
          ngayDat: new Date().toISOString(),
          thoiGianCanGiao: deliveryTime.toISOString(),
          // Gửi mảng nguyên liệu với thông tin chi tiết bao gồm soLuong
          nguyenLieu: items.map(item => ({
            maNguyenLieu: item._id,
            soLuong: Number(item.soLuong) || 1 // Đảm bảo là số
          })),
          ngayNhap: "",
          nguoiNhap: "",
          trangThai: "chuaNhap",
          ghiChu: "Tạo từ quản lý kho"
        };
        
        console.log("Sending order data:", orderData); // Debug log
        
        // Tạo phiếu đặt hàng với thông tin đầy đủ
        const orderResponse = await postData("/api/order-ingredients", orderData);
        
        if (!orderResponse.success) {
          throw new Error(orderResponse.message || "Không thể tạo đơn hàng");
        }
        
        return orderResponse;
      });
      
      await Promise.all(orderPromises);
      
      toast.success("Đã tạo phiếu đặt hàng thành công");
      onSubmitSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi tạo phiếu đặt hàng:", error);
      toast.error(error instanceof Error ? error.message : "Không thể tạo phiếu đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị danh sách nhà cung cấp đã được gom nhóm
  const renderGroupedOrders = () => {
    return Object.entries(groupedOrders).map(([groupKey, items]) => {
      const firstItem = items[0];
      const supplierId = firstItem.maNhaCungCap as string;
      const supplier = suppliers.find(s => s._id === supplierId);
      const deliveryDate = firstItem.thoiGianCanGiao;
      
      return (
        <div key={groupKey} className="border rounded-md p-4 mb-4">
          <h3 className="font-medium text-lg mb-2">
            {supplier?.ten || "Nhà cung cấp không xác định"}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Ngày cần giao: {deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : "Chưa chọn"}
          </p>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item._id} className="flex items-center justify-between">
                <span>{item.ten} ({item.soLuong || 1} {item.donViTinh})</span>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  console.log("Debug info:", {
    groupedOrders,
    availableSuppliers,
    ingredients: ingredients.length,
    selectedIngredients: selectedIngredients.length,
    suppliers: suppliers.length
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu đặt nguyên liệu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Danh sách nguyên liệu cần nhập</h3>
            
            <div className="grid grid-cols-12 gap-2 items-center font-medium mb-2">
              <div className="col-span-3">
                <p>Tên nguyên liệu</p>
              </div>
              <div className="col-span-3">
                <p>Nhà cung cấp</p>
              </div>
              <div className="col-span-2">
                <p>Số lượng</p>
              </div>
              <div className="col-span-4">
                <p>Ngày cần giao</p>
              </div>
            </div>

            {ingredients.length === 0 ? (
              <p className="text-muted-foreground">Không có nguyên liệu nào được chọn</p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <div key={ingredient._id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <p>{ingredient.ten}</p>
                      <p className="text-xs text-muted-foreground">
                        Tồn kho: {ingredient.soLuongTon} {ingredient.donViTinh}
                      </p>
                    </div>
                    
                    <div className="col-span-3">
                      <Select
                        value={ingredient.maNhaCungCap || ""}
                        onValueChange={(value) => handleSupplierChange(ingredient._id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSuppliers[ingredient._id]?.length > 0 ? (
                            availableSuppliers[ingredient._id].map((supplier) => (
                              <SelectItem key={supplier._id} value={supplier._id}>
                                {supplier.ten}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              Không có nhà cung cấp
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={ingredient.soLuong || 1}
                        onChange={(e) => handleQuantityChange(ingredient._id, parseInt(e.target.value) || 1)}
                        placeholder="Số lượng"
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ingredient.thoiGianCanGiao && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ingredient.thoiGianCanGiao ? 
                              format(ingredient.thoiGianCanGiao, "dd/MM/yyyy") : 
                              <span>Chọn ngày</span>
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border rounded-lg shadow-lg">
                          <Calendar
                            mode="single"
                            selected={ingredient.thoiGianCanGiao}
                            onSelect={(date) => date && handleDeliveryTimeChange(ingredient._id, date)}
                            initialFocus
                            disabled={(date) => {
                              const now = new Date();
                              const oneDayAgo = new Date(now);
                              oneDayAgo.setDate(now.getDate() - 1);
                              return date < oneDayAgo;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {Object.keys(groupedOrders).length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Phiếu đặt hàng theo nhà cung cấp và thời gian giao</h3>
              {renderGroupedOrders()}
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              <Ban className="mr-2 h-4 w-4" /> Hủy
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleCreateOrders} 
            disabled={loading || ingredients.length === 0 || Object.keys(groupedOrders).length === 0}
            className="cursor-pointer"
          >
            <Save className="mr-2 h-4 w-4" /> {loading ? "Đang xử lý..." : "Tạo phiếu đặt hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
