import { useState, useEffect } from "react";
import { getData, postData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Ban, CalendarIcon, ChevronLeft, ChevronRight, Save } from "lucide-react";
import WarehouseDialog from "./components/warehouse-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

interface StatisticIngredient {
  maNguyenLieu: string;
  tenNguyenLieu: string;
  donViTinh: string;
  soLuongNhap: number;
  soLuongBan: number;
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

interface EndOfDayIngredient extends StatisticIngredient {
  haoHutInput: number;
}

export default function Warehouse() {
  const [statisticIngredients, setStatisticIngredients] = useState<StatisticIngredient[]>([]);
  const [warehouseData, setWarehouseData] = useState<WarehouseIngredient[]>([]);
  const [endOfDayData, setEndOfDayData] = useState<EndOfDayIngredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [endOfDayColumnFilters, setEndOfDayColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [saving, setSaving] = useState(false);
  const [initialEndOfDayData, setInitialEndOfDayData] = useState<EndOfDayIngredient[]>([]);

  const role = localStorage.getItem('role');

  // Lấy thống kê nguyên liệu
  const fetchData = async () => {
    if (!date) return; // Skip if no date is selected

    try {
      setLoading(true);
      
      // Format date for API call
      const day = format(date, "dd");
      const month = format(date, "MM");
      const year = format(date, "yyyy");
      const statisticResponse = await getData(`/api/statistic-ingredients/statistic?day=${day}&month=${month}&year=${year}`);
      
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

  // Chuyển đổi dữ liệu thống kê thành dữ liệu warehouse
  useEffect(() => {
    if (statisticIngredients.length > 0) {
      const transformedData = statisticIngredients.map(statistic => ({
        _id: statistic.maNguyenLieu,
        ten: statistic.tenNguyenLieu,
        donViTinh: statistic.donViTinh,
        soLuongTon: statistic.soLuongTon,
        canNhap: false // Mặc định không cần nhập
      }));
      
      setWarehouseData(transformedData);

      // Tạo dữ liệu cho bảng cuối ngày
      const endOfDayTransformed = statisticIngredients.map(statistic => ({
        ...statistic,
        haoHutInput: statistic.soLuongHaoHut // Khởi tạo với giá trị hiện tại
      }));
      
      setEndOfDayData(endOfDayTransformed);
      setInitialEndOfDayData(endOfDayTransformed);
    }
  }, [statisticIngredients]);

  useEffect(() => {
    fetchData();
  }, [date]); // Trigger fetchData when date changes

  const isHaoHutChanged = endOfDayData.some(item => {
    const initialItem = initialEndOfDayData.find(i => i.maNguyenLieu === item.maNguyenLieu);
    return initialItem && item.haoHutInput !== initialItem.soLuongHaoHut;
  });

  // Xử lý khi checkbox thay đổi
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setWarehouseData(prev => 
      prev.map(item => 
        item._id === id ? { ...item, canNhap: checked } : item
      )
    );
  };

  // Xử lý khi input hao hụt thay đổi
  const handleHaoHutChange = (maNguyenLieu: string, value: number) => {
    setEndOfDayData(prev => 
      prev.map(item => 
        item.maNguyenLieu === maNguyenLieu ? { ...item, haoHutInput: value } : item
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
      toast.warning("Vui lòng chọn ít nhất một nguyên liệu để tạo phiếu nhập");
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

  const handleSaveHaoHut = async () => {
    if (!date) return;
  
    try {
      setSaving(true);
      
      // Filter ingredients with non-zero waste input
      const wasteData = endOfDayData
        .filter(item => item.haoHutInput > 0)
        .map(item => ({
          maNguyenLieu: item.maNguyenLieu,
          soLuongHaoHut: item.haoHutInput
        }));
  
      // Only proceed if there's data to save
      if (wasteData.length === 0) {
        toast.error("Không có dữ liệu hao hụt để lưu");
        return;
      }
  
      // Format date for API call
      const day = format(date, "dd");
      const month = format(date, "MM");
      const year = format(date, "yyyy");
  
      // Make POST request using postData
      const response = await postData(`/api/statistic-ingredients/haohut?day=${day}&month=${month}&year=${year}`, wasteData);
  
      if (response.success) {
        toast.success("Lưu dữ liệu hao hụt thành công!");
        // Refresh data after successful save
        fetchData();
      } else {
        throw new Error(response.message || 'Lỗi khi lưu dữ liệu');
      }
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu hao hụt:", error);
      toast.error("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Định nghĩa cột cho bảng đầu ngày
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
        const unit = row.original.donViTinh;
        return <div className={`${amount < 5 ? "text-destructive" : ""} font-medium`}>{formatted} {unit}</div>;
      },
    },
    {
      id: "canNhap",
      header: () => <div className={`text-center ${role === "admin" ? "" : "hidden"}`}>Cần nhập</div>,
      cell: ({ row }) => {
        const ingredient = row.original;
        return (
          <div className={`text-center ${role === "admin" ? "" : "hidden"}`}>
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

  // Định nghĩa cột cho bảng cuối ngày
  const endOfDayColumns: ColumnDef<EndOfDayIngredient>[] = [
    {
      accessorKey: "stt",
      header: () => <div className="text-center">STT</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "maNguyenLieu",
      header: "Mã nguyên liệu",
      cell: ({ row }) => <div>{row.getValue("maNguyenLieu")}</div>,
    },
    {
      accessorKey: "tenNguyenLieu",
      header: "Nguyên liệu",
      cell: ({ row }) => <div>{row.getValue("tenNguyenLieu")}</div>,
    },
    {
      accessorKey: "soLuongNhap",
      header: "SL Nhập",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("soLuongNhap"));
        const formatted = new Intl.NumberFormat("vi-VN").format(amount);
        const unit = row.original.donViTinh;
        return <div className="font-medium">{formatted} {unit}</div>;
      },
    },
    {
      accessorKey: "soLuongBan",
      header: "SL Bán",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("soLuongBan"));
        const formatted = new Intl.NumberFormat("vi-VN").format(amount);
        const unit = row.original.donViTinh;
        return <div className="font-medium">{formatted} {unit}</div>;
      },
    },
    {
      accessorKey: "soLuongHaoHut",
      header: "SL Hao hụt",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("soLuongHaoHut"));
        const formatted = new Intl.NumberFormat("vi-VN").format(amount);
        const unit = row.original.donViTinh;
        return <div className="font-medium text-destructive">{formatted} {unit}</div>;
      },
    },
    {
      accessorKey: "soLuongTon",
      header: "SL Tồn",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("soLuongTon"));
        const formatted = new Intl.NumberFormat("vi-VN").format(amount);
        const unit = row.original.donViTinh;
        return <div className={`${amount < 5 ? "text-destructive" : ""} font-medium`}>{formatted} {unit}</div>;
      },
    },
    {
      id: "haoHutInput",
      header: () => <div className="text-center">Hao hụt</div>,
      cell: ({ row }) => {
        const ingredient = row.original;
        return (
          <div className="text-center">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={ingredient.haoHutInput}
              onChange={(e) => 
                handleHaoHutChange(ingredient.maNguyenLieu, parseFloat(e.target.value) || 0)
              }
              className="w-20 text-center"
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

  const endOfDayTable = useReactTable({
    data: endOfDayData,
    columns: endOfDayColumns,
    onColumnFiltersChange: setEndOfDayColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters: endOfDayColumnFilters,
    },
  });

  // Skeleton loading for table rows
  const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => {
    return (
      <>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Morning Check Card */}
      <Card className='bg-background rounded-lg shadow-md'>
        <CardHeader className="mt-4">
          <CardTitle>Kiểm kho đầu ngày</CardTitle>
          <CardDescription>Danh sách nguyên liệu cần kiểm tra vào đầu ngày</CardDescription>
        </CardHeader>

        <CardContent>
          {loading && warehouseData.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 py-4">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-10 w-[240px]" />
                <Skeleton className="h-10 w-[150px] ml-auto" />
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableHead key={i}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeleton rows={10} columns={5} />
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4 border-t">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="space-x-2">
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-destructive py-4">{error}</div>
          ) : (
            <div className="w-full">
              <div className="flex items-center gap-2 py-4">
                <Input
                  placeholder="Tìm kiếm theo tên..."
                  value={(table.getColumn("ten")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("ten")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon />
                      {date ? format(date, "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="default" 
                  className="ml-auto cursor-pointer"
                  onClick={handleCreateOrder}
                  disabled={getSelectedIngredients().length === 0}
                >
                  Tạo phiếu nhập
                </Button>
              </div>

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
                    {loading ? (
                      <TableSkeleton rows={5} columns={columns.length} />
                    ) : table.getRowModel().rows?.length ? (
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
      </Card>

      {/* End-of-Day Check Card */}
      <Card className='bg-background rounded-lg shadow-md'>
        <CardHeader className="mt-4">
          <CardTitle>Kiểm kho cuối ngày</CardTitle>
          <CardDescription>Nhập số lượng hao hụt và kiểm kho cuối ngày</CardDescription>
        </CardHeader>

        <CardContent>
          {loading && endOfDayData.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 py-4">
                <Skeleton className="h-10 w-[300px]" />
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <TableHead key={i}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeleton rows={5} columns={8} />
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4 border-t">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="space-x-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 bg-white pt-4 pb-2 sticky bottom-0">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          ) : error ? (
            <div className="text-destructive py-4">{error}</div>
          ) : (
            <div className="w-full">
              <div className="flex items-center gap-2 py-4">
                <Input
                  placeholder="Tìm kiếm theo tên..."
                  value={(endOfDayTable.getColumn("tenNguyenLieu")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    endOfDayTable.getColumn("tenNguyenLieu")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {endOfDayTable.getHeaderGroups().map((headerGroup) => (
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
                    {loading ? (
                      <TableSkeleton rows={5} columns={endOfDayColumns.length} />
                    ) : endOfDayTable.getRowModel().rows?.length ? (
                      endOfDayTable.getRowModel().rows.map((row) => (
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
                          colSpan={endOfDayColumns.length}
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
                    Hiển thị {endOfDayTable.getRowModel().rows.length} / {endOfDayData.length} nguyên liệu
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => endOfDayTable.previousPage()}
                      disabled={!endOfDayTable.getCanPreviousPage()}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => endOfDayTable.nextPage()}
                      disabled={!endOfDayTable.getCanNextPage()}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 bg-white pt-4 pb-2 sticky bottom-0">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    console.log(endOfDayData);
                  }}
                >
                  <Ban /> Hủy
                </Button>
                <Button
                  variant="default"
                  className="cursor-pointer w-35"
                  onClick={handleSaveHaoHut}
                  disabled={saving || !isHaoHutChanged}
                >
                  <Save /> {saving ? "Đang lưu..." : "Lưu kiểm kho"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog tạo phiếu nhập */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedIngredients={getSelectedIngredients()}
        onSubmitSuccess={handleOrderSuccess}
      />
    </div>
  );
}
