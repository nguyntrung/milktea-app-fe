import React, { useState, useEffect } from "react";
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
}

// Định nghĩa interface cho nhà cung cấp
interface Supplier {
  _id: string;
  ten: string;
}

// Định nghĩa interface cho ingredient từ API - CẬP NHẬT
interface IngredientFromAPI {
  _id: string;
  ten: string;
  donViTinh: string;
  maNhaCungCap: Supplier[]; // Đây là mảng object Supplier, không phải string ID
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
  const [date, setDate] = React.useState<Date>()
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<{[key: string]: SelectedIngredient[]}>({});
  const [availableSuppliers, setAvailableSuppliers] = useState<{[key: string]: Supplier[]}>({});

  // Lấy userID từ localStorage
  // const getUserName = () => {
  //   if (typeof window !== 'undefined') {
  //     return localStorage.getItem('user') || "Admin";
  //   }
  //   return "Admin";
  // };

  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || "defaultUserId";
    }
    return "defaultUserId";
  };

  // Khởi tạo danh sách nguyên liệu từ props
  useEffect(() => {
    if (selectedIngredients.length > 0) {
      // Thêm trường soLuong mặc định cho mỗi nguyên liệu
      const ingredientsWithQuantity = selectedIngredients.map(ingredient => ({
        ...ingredient,
        soLuong: 1
      }));
      setIngredients(ingredientsWithQuantity);
    }
  }, [selectedIngredients]);

  // Lấy danh sách nhà cung cấp và thông tin chi tiết nguyên liệu - CẬP NHẬT
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách tất cả nhà cung cấp
        const suppliersResponse = await getData('/api/suppliers');
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          setSuppliers(suppliersResponse.data);
        }

        // Lấy thông tin chi tiết nguyên liệu để có danh sách nhà cung cấp cho từng nguyên liệu
        const ingredientsResponse = await getData('/api/ingredients');
        if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
          const ingredientSuppliers: {[key: string]: Supplier[]} = {};
          
          // Tạo mapping giữa ingredient ID và danh sách nhà cung cấp của nó
          ingredientsResponse.data.forEach((ingredient: IngredientFromAPI) => {
            if (ingredient.maNhaCungCap && Array.isArray(ingredient.maNhaCungCap)) {
              // Lấy trực tiếp danh sách nhà cung cấp từ mảng object
              ingredientSuppliers[ingredient._id] = ingredient.maNhaCungCap;
            }
          });
          
          setAvailableSuppliers(ingredientSuppliers);
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
    if (supplierId.length !== 24) {
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

  // Gom nhóm nguyên liệu theo nhà cung cấp
  const groupIngredientsBySupplier = () => {
    const grouped: {[key: string]: SelectedIngredient[]} = {};
    
    // Lọc ra những nguyên liệu đã có nhà cung cấp
    const validIngredients = ingredients.filter(ing => ing.maNhaCungCap);
    
    validIngredients.forEach(ingredient => {
      const supplierId = ingredient.maNhaCungCap as string;
      if (!grouped[supplierId]) {
        grouped[supplierId] = [];
      }
      grouped[supplierId].push(ingredient);
    });
    
    return grouped;
  };

  // Cập nhật nhóm nguyên liệu khi có thay đổi
  useEffect(() => {
    const grouped = groupIngredientsBySupplier();
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
      
      // Tạo các phiếu đặt hàng theo nhóm nhà cung cấp
      const orderPromises = Object.entries(groupedOrders).map(async ([supplierId, items]) => {
        const orderData = {
          maNhaCungCap: supplierId,
          ngayDat: new Date().toISOString(),
          thoiGianCanGiao: date ? date.toISOString() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          nguyenLieu: items.map(item => item._id),
          tongTien: 0,
          trangThai: "chuaNhap",
          ghiChu: "Tạo từ quản lý kho",
          nguoiDat: getUserId()
        };
        
        return await postData("/api/order-ingredients", orderData);
      });
      
      await Promise.all(orderPromises);
      
      toast.success("Đã tạo phiếu đặt hàng thành công");
      onSubmitSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi tạo phiếu đặt hàng:", error);
      toast.error("Không thể tạo phiếu đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị danh sách nhà cung cấp đã được gom nhóm
  const renderGroupedOrders = () => {
    return Object.entries(groupedOrders).map(([supplierId, items]) => {
      const supplier = suppliers.find(s => s._id === supplierId);
      
      return (
        <div key={supplierId} className="border rounded-md p-4 mb-4">
          <h3 className="font-medium text-lg mb-2">
            {supplier?.ten || "Nhà cung cấp không xác định"}
          </h3>
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

  console.log("groupedOrders:", groupedOrders);
  console.log("availableSuppliers:", availableSuppliers);

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
              <div className="col-span-4">
                <p>Nhà cung cấp</p>
              </div>
              <div className="col-span-2">
                <p>Số lượng</p>
              </div>
              <div className="col-span-3">
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
                    
                    <div className="col-span-4">
                      <Select
                        value={ingredient.maNhaCungCap}
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
                    <div className="col-span-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border rounded-lg shadow-lg">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
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
              <h3 className="font-medium mb-2">Phiếu đặt hàng theo nhà cung cấp</h3>
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
