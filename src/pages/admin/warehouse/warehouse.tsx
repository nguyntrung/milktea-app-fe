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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WarehouseDialog from "./components/warehouse-dialog";

interface Ingredient {
  _id: string;
  ten: string;
  donViTinh: string;
  maNhaCungCap: string[];
  hoatDong: boolean;
}

interface StatisticIngredient {
  _id: string;
  ngay: string;
  maNguyenLieu: {
    _id: string;
    ten: string;
  };
  tenNguyenLieu: string;
  donViTinh: string;
  soLuongBanDau: number;
  soLuongBan: number;
  soLuongNhap: number;
  soLuongHaoHut: number;
  soLuongTon: number;
}

interface WarehouseIngredient {
  _id: string;
  ten: string;
  donViTinh: string;
  soLuongTon: number;
  canNhap: boolean;
}

export default function Warehouse() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [statisticIngredients, setStatisticIngredients] = useState<StatisticIngredient[]>([]);
  const [warehouseData, setWarehouseData] = useState<WarehouseIngredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Lấy danh sách nguyên liệu và thống kê
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách nguyên liệu
      const ingredientsResponse = await getData("/api/ingredients");
      if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
        setIngredients(ingredientsResponse.data || []);
      }
      
      // Lấy thống kê nguyên liệu
      const statisticResponse = await getData("/api/statistic-ingredients");
      if (statisticResponse.success && Array.isArray(statisticResponse.data)) {
        setStatisticIngredients(statisticResponse.data || []);
      }
      
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setError("Không thể tải danh sách nguyên liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Kết hợp dữ liệu từ hai API
  useEffect(() => {
    if (ingredients.length > 0 && statisticIngredients.length > 0) {
      const combinedData = ingredients.map(ingredient => {
        // Tìm thông tin thống kê cho nguyên liệu này
        const statistic = statisticIngredients.find(
          stat => stat.maNguyenLieu._id === ingredient._id
        );
        
        return {
          _id: ingredient._id,
          ten: ingredient.ten,
          donViTinh: ingredient.donViTinh,
          soLuongTon: statistic ? statistic.soLuongTon : 0,
          canNhap: false // Mặc định không cần nhập
        };
      });
      
      setWarehouseData(combinedData);
    }
  }, [ingredients, statisticIngredients]);

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý khi checkbox thay đổi
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setWarehouseData(prev => 
      prev.map(item => 
        item._id === id ? { ...item, canNhap: checked } : item
      )
    );
  };

  // Lấy danh sách nguyên liệu đã chọn
  const getSelectedIngredients = () => {
    return warehouseData.filter(item => item.canNhap);
  };

  // Xử lý khi nhấn nút tạo phiếu nhập
  const handleCreateOrder = () => {
    const selectedIngredients = getSelectedIngredients();
    if (selectedIngredients.length === 0) {
      alert("Vui lòng chọn ít nhất một nguyên liệu để tạo phiếu nhập");
      return;
    }
    setDialogOpen(true);
  };

  // Xử lý khi tạo phiếu nhập thành công
  const handleOrderSuccess = () => {
    // Reset trạng thái checkbox
    setWarehouseData(prev => 
      prev.map(item => ({ ...item, canNhap: false }))
    );
    // Tải lại dữ liệu
    fetchData();
  };

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<WarehouseIngredient>[] = [
    {
      accessorKey: "stt",
      header: () => <div className="text-center">STT</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "_id",
      header: "Mã nguyên liệu",
      cell: ({ row }) => <div>{row.getValue("_id")}</div>,
    },
    {
      accessorKey: "ten",
      header: "Nguyên liệu",
      cell: ({ row }) => <div>{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "soLuongTon",
      header: "Số lượng tồn",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("soLuongTon"));
        const formatted = new Intl.NumberFormat("vi-VN").format(amount);
        const unit = ingredients.find(item => item._id === row.getValue("_id"))?.donViTinh;
        console.log(amount);
        return <div className={`${amount < 5 ? "text-destructive" : ""} font-medium`}>{formatted} {unit}</div>;
      },
    },
    {
      id: "canNhap",
      header: () => <div className="text-center">Cần nhập</div>,
      cell: ({ row }) => {
        const ingredient = row.original;
        return (
          <div className="text-center">
            <Checkbox
              checked={ingredient.canNhap}
              onCheckedChange={(checked) => 
                handleCheckboxChange(ingredient._id, checked as boolean)
              }
            />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: warehouseData,
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
        <CardTitle>Quản lý nguyên liệu</CardTitle>
        <CardDescription className="flex justify-between">
          Quản lý kiểm kho và tạo phiếu nguyên liệu
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading && warehouseData.length === 0 ? (
          <div className="text-center py-4">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-destructive py-4">{error}</div>
        ) : (
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={(table.getColumn("ten")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("ten")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <Button 
                variant="default" 
                className="ml-auto cursor-pointer"
                onClick={handleCreateOrder}
                disabled={getSelectedIngredients().length === 0}
              >
                Tạo phiếu nhập
              </Button>
            </div>
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length} nguyên liệu
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
                        Không có dữ liệu nguyên liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {table.getRowModel().rows.length} / {warehouseData.length} nguyên liệu
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
      </CardContent>

      {/* Dialog tạo phiếu nhập */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedIngredients={getSelectedIngredients()}
        onSubmitSuccess={handleOrderSuccess}
      />
    </Card>
  );
}
