import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Ban, Save } from "lucide-react";
import { postData } from "@/lib/api";

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

  // Lấy userID từ localStorage
  const getUserName = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user') || "Admin";
    }
    return "Admin";
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

  // Lấy danh sách nhà cung cấp
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('https://trasua.up.railway.app/api/suppliers');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setSuppliers(data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
        toast.error("Không thể lấy danh sách nhà cung cấp");
      }
    };

    fetchSuppliers();
  }, []);

  // Xử lý khi chọn nhà cung cấp cho nguyên liệu
  const handleSupplierChange = (ingredientId: string, supplierId: string) => {
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
          thoiGianCanGiao: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày sau
          nguyenLieu: items.map(item => ({
            maNguyenLieu: item._id,
            soLuong: item.soLuong || 1,
            donGia: 0,
            thanhTien: 0
          })),
          tongTien: 0,
          trangThai: "daDuyet",
          ghiChu: "Tạo từ quản lý kho",
          nguoiDat: getUserName()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tạo phiếu đặt nguyên liệu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Danh sách nguyên liệu cần nhập</h3>
            
            {ingredients.length === 0 ? (
              <p className="text-muted-foreground">Không có nguyên liệu nào được chọn</p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <div key={ingredient._id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
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
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier._id} value={supplier._id}>
                              {supplier.ten}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={1}
                        value={ingredient.soLuong || 1}
                        onChange={(e) => handleQuantityChange(ingredient._id, parseInt(e.target.value) || 1)}
                        placeholder="Số lượng"
                      />
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

        <DialogFooter>
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