import { useState, useEffect } from "react";
import { getData } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, Import } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import OrderIngredientsDialog from "./components/order-ingredients-dialog";

interface OrderIngredient {
  _id: string;
  maNhaCungCap: string;
  tenNhaCungCap?: string;
  ngayDat: string;
  thoiGianCanGiao: string;
  nguyenLieu: Array<{
    maNguyenLieu: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    _id: string;
  }>;
  tongTien: number;
  ngayNhap: string;
  trangThai: string;
  ghiChu: string;
  nguoiDat: string;
  nguoiNhap: string | null;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function OrderIngredients() {
  const [orders, setOrders] = useState<OrderIngredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Lấy danh sách đơn đặt nguyên liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách đơn đặt nguyên liệu
      const response = await getData("/api/order-ingredients");
      if (response.success && Array.isArray(response.data)) {
        // Xử lý dữ liệu để hiển thị tên nhà cung cấp
        const ordersWithSupplierNames = await Promise.all(
          response.data.map(async (order: OrderIngredient) => {
            try {
              // Lấy thông tin nhà cung cấp
              const supplierResponse = await getData(`/api/suppliers/${order.maNhaCungCap}`);
              if (supplierResponse.success && supplierResponse.data) {
                return {
                  ...order,
                  tenNhaCungCap: supplierResponse.data.ten
                };
              }
              return order;
            } catch (error) {
              console.error("Lỗi khi lấy thông tin nhà cung cấp:", error);
              return order;
            }
          })
        );
        
        setOrders(ordersWithSupplierNames || []);
      }
      
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setError("Không thể tải danh sách đơn đặt nguyên liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<OrderIngredient>[] = [
    {
      accessorKey: "stt",
      header: () => <div className="text-center">STT</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "_id",
      header: "Mã đơn",
      cell: ({ row }) => <div>{row.getValue("_id")}</div>,
    },
    {
      accessorKey: "tenNhaCungCap",
      header: "Nhà cung cấp",
      cell: ({ row }) => <div>{row.getValue("tenNhaCungCap") || "Không xác định"}</div>,
    },
    {
      accessorKey: "ngayDat",
      header: "Ngày đặt",
      cell: ({ row }) => {
        const date = new Date(row.getValue("ngayDat"));
        return <div>{format(date, "dd/MM/yyyy", { locale: vi })}</div>;
      },
    },
    {
      accessorKey: "thoiGianCanGiao",
      header: "Thời gian cần giao",
      cell: ({ row }) => {
        const date = new Date(row.getValue("thoiGianCanGiao"));
        return <div>{format(date, "dd/MM/yyyy", { locale: vi })}</div>;
      },
    },
    {
      accessorKey: "tongTien",
      header: "Tổng tiền",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("tongTien"));
        const formatted = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND"
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("trangThai") as string;
        let statusClass = "";
        let statusText = "";
        
        switch(status) {
          case "chuaNhap":
            statusClass = "bg-gray-100 text-gray-800";
            statusText = "Chưa nhập";
            break;
          case "daHuy":
            statusClass = "bg-red-100 text-red-800";
            statusText = "Đã hủy";
            break;
          case "daNhap":
            statusClass = "bg-green-100 text-green-800";
            statusText = "Đã nhập";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
            statusText = status;
        }
        
        return (
          <div className={`w-full text-center inline-block px-2 py-1 rounded-md ${statusClass}`}>
            {statusText}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Thao tác</div>,
      cell: ({ row }) => {
        const order = row.original;
        const status = order.trangThai;
        return (
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedOrderId(order._id);
                setImportDialogOpen(true);
              }}
              title={status === "chuaNhap"? "Nhập hàng" : "Xem chi tiết"}
            >
              {status === "chuaNhap" ? <Import /> : <Eye />}
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
    <Card className='bg-background rounded-lg shadow-md mb-3'>
      <CardHeader className="mt-4">
        <CardTitle>Danh sách đơn đặt nguyên liệu</CardTitle>
        <CardDescription className="flex justify-between">
          Quản lý đơn đặt nguyên liệu từ nhà cung cấp
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading && orders.length === 0 ? (
          <div className="text-center py-4">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-destructive py-4">{error}</div>
        ) : (
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Tìm kiếm theo nhà cung cấp..."
                value={(table.getColumn("tenNhaCungCap")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("tenNhaCungCap")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length} đơn đặt nguyên liệu
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
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {table.getRowModel().rows.length} / {orders.length} đơn đặt nguyên liệu
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <OrderIngredientsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          orderId={selectedOrderId}
          onSubmitSuccess={() => {
            fetchData();
            setSelectedOrderId(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
