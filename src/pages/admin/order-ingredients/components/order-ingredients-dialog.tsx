import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Ban, Save, Package } from "lucide-react";
import { putData, getData } from "@/lib/api";

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
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Định nghĩa interface cho nguyên liệu trong đơn hàng
interface OrderIngredient {
  _id?: string;
  maDonDat?: string;
  maNguyenLieu?: string;
  ten?: string;
  donViTinh?: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

// Định nghĩa interface cho đơn đặt hàng
interface OrderData {
  _id: string;
  maNhaCungCap: string;
  ngayDat: string;
  thoiGianCanGiao: string;
  nguyenLieu: string[];
  tongTien: number;
  ngayNhap: string | null;
  trangThai: string;
  ghiChu: string;
  nguoiDat: {
    ma: string;
    ten: string;
  };
  nguoiNhap: {
    ma: string;
    ten: string;
  } | null;
  ngayTao: string;
  ngayCapNhat: string;
  __v: number;
}

// Interface cho thông tin chi tiết nguyên liệu từ API order-ingredient-details
interface IngredientDetail {
  _id: string;
  maDonDat: string;
  maNguyenLieu: string;
  tenNguyenLieu: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  donViTinh: string;
  ngayTao: string;
  ngayCapNhat: string;
}

// Định nghĩa props cho component
interface OrderIngredientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onSubmitSuccess: () => void;
}

export default function OrderIngredientsDialog({
  open,
  onOpenChange,
  orderId,
  onSubmitSuccess
}: OrderIngredientsDialogProps) {
  const [date, setDate] = React.useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [ingredients, setIngredients] = useState<OrderIngredient[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Lấy userID từ localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || "defaultUserId";
    }
    return "defaultUserId";
  };

  // Lấy thông tin chi tiết nguyên liệu từ order-ingredient-details
  const fetchIngredientDetails = async (orderId: string) => {
    try {
      const response = await getData(`/api/order-ingredient-details`);
      
      if (response.success && Array.isArray(response.data)) {
        // Lọc các chi tiết nguyên liệu thuộc đơn đặt hàng này
        const orderDetails = response.data.filter((detail: IngredientDetail) => 
          detail.maDonDat === orderId
        );
        
        return orderDetails;
      }
      return [];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi tiết nguyên liệu:", error);
      return [];
    }
  };

  // Lấy thông tin đơn đặt hàng
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId || !open) return;

      try {
        setFetchLoading(true);
        const response = await getData(`/api/order-ingredients/${orderId}`);
        
        if (response.success && response.data) {
          setOrderData(response.data);
          
          // Lấy thông tin chi tiết nguyên liệu từ order-ingredient-details
          const details = await fetchIngredientDetails(orderId);
          
          // Khởi tạo danh sách nguyên liệu với thông tin từ order-ingredient-details
          const initialIngredients = details.map((detail: IngredientDetail) => ({
            _id: detail._id,
            maDonDat: detail.maDonDat,
            maNguyenLieu: detail.maNguyenLieu,
            ten: detail.tenNguyenLieu,
            donViTinh: detail.donViTinh,
            soLuong: detail.soLuong || 1, // Nếu chưa có số lượng thì mặc định là 1
            donGia: detail.donGia || 0,
            thanhTien: detail.thanhTien || 0
          }));
          
          setIngredients(initialIngredients);
          
          // Set ngày nhập mặc định
          if (response.data.ngayNhap) {
            setDate(new Date(response.data.ngayNhap));
          } else {
            setDate(new Date());
          }
        } else {
          toast.error("Không thể tải thông tin đơn đặt hàng");
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu đơn đặt hàng:", error);
        toast.error("Không thể tải thông tin đơn đặt hàng");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, open]);

  // Xử lý khi thay đổi số lượng
  const handleQuantityChange = (ingredientId: string, quantity: number) => {
    setIngredients(prev => 
      prev.map(item => {
        if (item.maNguyenLieu === ingredientId) {
          const newQuantity = Math.max(0, quantity);
          const thanhTien = newQuantity * item.donGia;
          return { ...item, soLuong: newQuantity, thanhTien };
        }
        return item;
      })
    );
  };

  // Xử lý khi thay đổi đơn giá
  const handlePriceChange = (ingredientId: string, price: number) => {
    setIngredients(prev => 
      prev.map(item => {
        if (item.maNguyenLieu === ingredientId) {
          const newPrice = Math.max(0, price);
          const thanhTien = item.soLuong * newPrice;
          return { ...item, donGia: newPrice, thanhTien };
        }
        return item;
      })
    );
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return ingredients.reduce((total, item) => total + item.thanhTien, 0);
  };

  // Xử lý nhập kho
  const handleImportOrder = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra dữ liệu đầu vào
      const invalidIngredients = ingredients.filter(ing => ing.soLuong <= 0 || ing.donGia < 0);
      if (invalidIngredients.length > 0) {
        toast.error("Vui lòng nhập số lượng và đơn giá hợp lệ cho tất cả nguyên liệu");
        setLoading(false);
        return;
      }

      if (!date) {
        toast.error("Vui lòng chọn ngày nhập");
        setLoading(false);
        return;
      }

      // Bước 1: Cập nhật từng chi tiết nguyên liệu
      const updateDetailsPromises = ingredients.map(async (ingredient) => {
        if (ingredient._id) {
          const updateDetailData = {
            maDonDat: ingredient.maDonDat,
            maNguyenLieu: ingredient.maNguyenLieu,
            soLuong: ingredient.soLuong,
            donGia: ingredient.donGia
          };
          
          return await putData(`/api/order-ingredient-details/${ingredient._id}`, updateDetailData);
        }
        return null;
      });

      // Thực hiện tất cả các cập nhật chi tiết nguyên liệu
      const detailResults = await Promise.all(updateDetailsPromises);
      
      // Kiểm tra xem có cập nhật chi tiết nào thất bại không
      const failedDetails = detailResults.filter(result => result && !result.success);
      if (failedDetails.length > 0) {
        toast.error("Không thể cập nhật một số chi tiết nguyên liệu");
        setLoading(false);
        return;
      }

      // Bước 2: Cập nhật đơn đặt hàng chính
      const updateOrderData = {
        tongTien: calculateTotal(),
        ngayNhap: new Date().toISOString(),
        trangThai: "daNhap",
        nguoiNhap: getUserId() // Chỉ gửi ID, backend sẽ tự động xử lý object
      };
      
      const orderResponse = await putData(`/api/order-ingredients/${orderId}`, updateOrderData);
      
      if (orderResponse.success) {
        toast.success("Đã nhập kho thành công");
        onSubmitSuccess();
        onOpenChange(false);
      } else {
        toast.error(orderResponse.message || "Không thể cập nhật đơn đặt hàng");
      }
    } catch (error) {
      console.error("Lỗi khi nhập kho:", error);
      toast.error("Không thể nhập kho");
    } finally {
      setLoading(false);
    }
  };

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  if (fetchLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[900px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Đang tải dữ liệu...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nhập nguyên liệu - Đơn #{orderId?.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        {orderData && (
          <div className="space-y-4 my-4">
            {/* Thông tin đơn hàng */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base mt-4">Thông tin đơn đặt hàng</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Người đặt</p>
                  <p className="font-medium">{orderData.nguoiDat.ten}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày đặt</p>
                  <p className="font-medium">{format(new Date(orderData.ngayDat), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian cần giao</p>
                  <p className="font-medium">{format(new Date(orderData.thoiGianCanGiao), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-medium text-blue-600">
                    {orderData.trangThai === "chuaNhap" ? "Chưa nhập" : 
                     orderData.trangThai === "daNhap" ? "Đã nhập" : orderData.trangThai}
                  </p>
                </div>
                {orderData.ghiChu && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                    <p className="font-medium">{orderData.ghiChu}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ngày nhập */}
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Ngày nhập kho:</Label>
              <span className="font-medium text-blue-600">
                {format(new Date(), "dd/MM/yyyy")}
              </span>
            </div>

            {/* Danh sách nguyên liệu */}
            <Table>
              <TableCaption>Danh sách nguyên liệu cần nhập</TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Tên nguyên liệu</TableHead>
                  <TableHead>Đơn vị tính</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>

              {ingredients.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={12}>
                      <p className="text-muted-foreground py-4 text-center">Không có nguyên liệu nào</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody className="border md:rounded-full">
                  {ingredients.map((ingredient) => (
                    <TableRow
                      key={ingredient.maNguyenLieu}
                    >
                      <TableCell>
                        <p className="text-center">
                          {ingredients.indexOf(ingredient) + 1}
                        </p>
                      </TableCell>
                      <TableCell className="w-80">
                        <p className="font-medium">{ingredient.ten || "Chưa có tên"}</p>
                      </TableCell>

                      <TableCell>
                        <p className="text-center text-muted-foreground">
                          {ingredient.donViTinh || "N/A"}
                        </p>
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={ingredient.soLuong}
                          onChange={(e) =>
                            handleQuantityChange(
                              ingredient.maNguyenLieu!,
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="Số lượng"
                          className="w-full"
                          disabled={orderData?.trangThai === "daNhap"}
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={ingredient.donGia}
                          onChange={(e) =>
                            handlePriceChange(
                              ingredient.maNguyenLieu!,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Đơn giá"
                          className="w-full"
                          disabled={orderData?.trangThai === "daNhap"}
                        />
                      </TableCell>

                      <TableCell className="col-span-3">
                        <p className="font-medium text-destructive">
                          {formatCurrency(ingredient.thanhTien)}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>


            {/* Tổng tiền */}
            {ingredients.length > 0 && (
              <div className="flex justify-end">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between min-w-[200px]">
                    <span className="font-medium">Tổng tiền:</span>
                    <span className="font-medium text-lg text-destructive">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              disabled={loading || ingredients.length === 0 || !date || orderData?.trangThai === "daNhap"}
            >
              <Ban className="mr-2 h-4 w-4" /> Hủy
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleImportOrder} 
            disabled={loading || ingredients.length === 0 || !date || orderData?.trangThai === "daNhap"}
            className="cursor-pointer"
          >
            <Save className="mr-2 h-4 w-4" /> {loading ? "Đang xử lý..." : "Nhập kho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
