import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getData, postData, putData } from "@/lib/api";
import { Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import OrderIngredientsDialog from "./components/order-ingredients-dialog";

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
  ghiChu?: string;
}

interface Supplier {
  _id: string;
  ten: string;
}

interface Ingredient {
  _id: string;
  ten: string;
  donViTinh: string;
  maNhaCungCap: {
    _id: string;
    ten: string;
  }[];
  hoatDong: boolean;
  nguyenLieuHaoHut: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

const orderStatusMap = {
  DATAO: { label: "Đã đặt", color: "bg-blue-100 text-blue-800" },
  DANHAP: { label: "Đã nhập", color: "bg-green-100 text-green-800" },
  DAHUY: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

export default function OrderIngredients() {
  const [orders, setOrders] = useState<OrderIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderIngredient | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "import">("create");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Lấy danh sách đơn đặt nguyên liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy danh sách đơn đặt nguyên liệu
      const ordersResponse = await getData("/api/order-ingredients");
      if (ordersResponse.success && Array.isArray(ordersResponse.data)) {
        setOrders(ordersResponse.data || []);
      } else {
        throw new Error("Không thể tải danh sách đơn đặt nguyên liệu");
      }

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
      setError("Không thể tải danh sách đơn đặt nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format ngày
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Lấy tên nhà cung cấp từ ID
  const getSupplierName = (id: string) => {
    const supplier = suppliers.find(s => s._id === id);
    return supplier ? supplier.ten : id;
  };

  // Xử lý tạo đơn đặt nguyên liệu mới
  const handleCreateOrder = () => {
    setSelectedOrder(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  // Xử lý xem chi tiết đơn đặt nguyên liệu
  const handleViewOrder = (order: OrderIngredient) => {
    setSelectedOrder(order);
    setDialogMode(order.trangThai === "DATAO" ? "import" : "create");
    setDialogOpen(true);
  };

  // Xử lý submit đơn đặt nguyên liệu
  const handleSubmitOrder = async (data: any, mode: "create" | "import") => {
    try {
      if (mode === "create") {
        // Nếu là tạo mới
        if (!selectedOrder) {
          await postData("/api/order-ingredients", data);
          toast.success("Tạo đơn đặt nguyên liệu thành công");
        } 
        // Nếu là cập nhật đơn đã tồn tại
        else {
          await putData(`/api/order-ingredients/${selectedOrder._id}`, {
            ...data,
            _id: selectedOrder._id,
          });
          toast.success("Cập nhật đơn đặt nguyên liệu thành công");
        }
      } else if (mode === "import") {
        // Nếu là nhập nguyên liệu
        if (selectedOrder) {
          await putData(`/api/order-ingredients/${selectedOrder._id}/import`, {
            ...data,
            _id: selectedOrder._id,
          });
          
          toast.success("Nhập nguyên liệu thành công");
        }
      }
      
      // Tải lại danh sách sau khi thêm/sửa
      fetchData();
    } catch (error) {
      console.error("Lỗi khi xử lý đơn đặt nguyên liệu:", error);
      toast.error("Có lỗi xảy ra khi xử lý đơn đặt nguyên liệu");
      throw error;
    }
  };

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<OrderIngredient>[] = [
    {
      accessorKey: "maNhaCungCap",
      header: "Nhà cung cấp",
      cell: ({ row }) => {
        const supplierId = row.getValue("maNhaCungCap") as string;
        return <div>{getSupplierName(supplierId)}</div>;
      },
    },
    {
      accessorKey: "ngayDat",
      header: "Ngày đặt",
      cell: ({ row }) => {
        const date = row.getValue("ngayDat") as string;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "thoiGianCanGiao",
      header: "Thời gian cần giao",
      cell: ({ row }) => {
        const date = row.getValue("thoiGianCanGiao") as string;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "soMatHang",
      header: "Số mặt hàng",
      cell: ({ row }) => {
        const order = row.original;
        return <div>{order.nguyenLieu.length}</div>;
      },
    },
    {
      accessorKey: "tongTien",
      header: "Tổng tiền",
      cell: ({ row }) => {
        const tongTien = row.original.tongTien;
        return tongTien ? (
          <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tongTien)}</div>
        ) : (
          <div>-</div>
        );
      },
    },
    {
      accessorKey: "ghiChu",
      header: "Ghi chú",
      cell: ({ row }) => {
        const ghiChu = row.original.ghiChu;
        return <div>{ghiChu || "-"}</div>;
      },
    },
    {
      accessorKey: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("trangThai") as keyof typeof orderStatusMap;
        const statusInfo = orderStatusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        
        return (
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleViewOrder(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <div className="bg-card h-fit w-full rounded-md p-3 shadow-md">
      <h3 className="text-2xl font-bold mb-3">Danh sách đơn đặt nguyên liệu</h3>
      
      {loading && orders.length === 0 ? (
        <div className="text-center py-4">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Tìm kiếm theo nhà cung cấp..."
              value={(table.getColumn("maNhaCungCap")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("maNhaCungCap")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Button 
              variant="default" 
              className="ml-auto cursor-pointer"
              onClick={handleCreateOrder}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn đặt hàng
            </Button>
          </div>
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} đơn đặt hàng
          </span>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Không có dữ liệu đơn đặt nguyên liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog đặt/nhập nguyên liệu */}
      <OrderIngredientsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
        onSubmit={handleSubmitOrder}
        mode={dialogMode}
      />
    </div>
  );
}