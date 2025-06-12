import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getData, deleteData } from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, X, Trash2, Edit } from "lucide-react";
import PromotionDialog from "./components/promotion-dialog";

// Định nghĩa kiểu dữ liệu cho khuyến mãi
interface Promotion {
  _id: string;
  maKhuyenMai: string;
  tenKhuyenMai: string;
  moTa: string;
  giaTri: number;
  loaiKhuyenMai: "phantram" | "tienmat";
  thoiGianApDung: {
    batDau: string;
    ketThuc: string;
  }
  dieuKienApDung: string;
  trangThai: boolean;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Memoize các hàm format để tránh re-render không cần thiết
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  }, []);

  const formatPromotionValue = useCallback((value: number, type: string) => {
    if (type === "phantram") {
      return `${value}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
  }, []);

  // Lấy danh sách khuyến mãi với error handling tốt hơn
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      
      const response = await getData("/api/promotions");
      
      if (response?.success && Array.isArray(response.data)) {
        setPromotions(response.data);
      } else {
        setError("Không thể tải danh sách khuyến mãi");
        setPromotions([]); // Set empty array để tránh lỗi
      }
    } catch (error) {
      console.error("Lỗi khi tải khuyến mãi:", error);
      setError("Đã xảy ra lỗi khi tải danh sách khuyến mãi");
      setPromotions([]); // Set empty array để tránh lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa khuyến mãi với loading state
  const handleDeletePromotion = useCallback(async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
      try {
        setLoading(true); // Thêm loading state
        const response = await deleteData(`/api/promotions/${id}`);
        if (response?.success) {
          toast.success("Xóa khuyến mãi thành công");
          await fetchPromotions(); // Refresh data
        } else {
          toast.error(response?.message || "Không thể xóa khuyến mãi");
        }
      } catch (error) {
        console.error("Lỗi khi xóa khuyến mãi:", error);
        toast.error("Đã xảy ra lỗi khi xóa khuyến mãi");
      } finally {
        setLoading(false);
      }
    }
  }, [fetchPromotions]);

  // Mở dialog thêm mới
  const handleAddPromotion = useCallback(() => {
    setSelectedPromotion(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  }, []);

  // Mở dialog chỉnh sửa
  const handleEditPromotion = useCallback((promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  // Memoize filtered promotions để tránh tính toán lại không cần thiết
  const filteredPromotions = useMemo(() => {
    if (!Array.isArray(promotions)) return [];
    
    if (!searchTerm) return promotions;
    
    const searchLower = searchTerm.toLowerCase();
    return promotions.filter(promotion => {
      return (
        promotion.maKhuyenMai?.toLowerCase().includes(searchLower) ||
        promotion.tenKhuyenMai?.toLowerCase().includes(searchLower) ||
        promotion.moTa?.toLowerCase().includes(searchLower)
      );
    });
  }, [promotions, searchTerm]);

  // Memoize columns để tránh re-render table
  const columns: ColumnDef<Promotion>[] = useMemo(() => [
    {
      accessorKey: "maKhuyenMai",
      header: "Mã khuyến mãi",
    },
    {
      accessorKey: "tenKhuyenMai",
      header: "Tên khuyến mãi",
    },
    // {
    //   accessorKey: "moTa",
    //   header: "Mô tả",
    //   cell: ({ row }) => {
    //     const description = row.getValue("moTa") as string;
    //     return description?.length > 50 ? `${description.substring(0, 50)}...` : description;
    //   },
    // },
    {
      accessorKey: "giaTri",
      header: "Giá trị",
      cell: ({ row }) => {
        const promotion = row.original;
        return formatPromotionValue(promotion.giaTri, promotion.loaiKhuyenMai);
      },
    },
    {
      accessorKey: "thoiGianApDung",
      header: "Thời gian áp dụng",
      cell: ({ row }) => {
        const promotion = row.original;
        return `${formatDate(promotion.thoiGianApDung.batDau)} - ${formatDate(promotion.thoiGianApDung.ketThuc)}`;
      },
    },
    // {
    //   accessorKey: "ngayKetThuc",
    //   header: "Ngày kết thúc",
    //   cell: ({ row }) => {
    //     const date = row.getValue("ngayKetThuc") as string;
    //     return formatDate(date);
    //   },
    // },
    {
      accessorKey: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("trangThai") as boolean;
        return (
          <Badge className={status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {status ? "Đang kích hoạt" : "Không kích hoạt"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const promotion = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditPromotion(promotion)}
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeletePromotion(promotion._id)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [formatPromotionValue, formatDate, handleEditPromotion, handleDeletePromotion, loading]);

  // Tải dữ liệu khi component được mount
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Memoize table configuration
  const table = useReactTable({
    data: filteredPromotions,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10, // Giới hạn số item trên mỗi trang
      },
    },
  });

  // Callback cho dialog submit
  const handleDialogSubmit = useCallback(async () => {
    await fetchPromotions();
  }, [fetchPromotions]);

  return (
    <div className="bg-card h-fit w-full rounded-md p-3 mb-3 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
        <div className="flex gap-2">
          <Button onClick={fetchPromotions} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Làm mới
          </Button>
          <Button onClick={handleAddPromotion} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Thêm khuyến mãi
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Tìm kiếm theo mã, tên hoặc mô tả khuyến mãi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          disabled={loading}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchTerm("")}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Table */}
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Đang tải...
                    </div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    "Không có dữ liệu"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredPromotions.length)} trong tổng số {filteredPromotions.length} khuyến mãi
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Dialog */}
      <PromotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={selectedPromotion as Promotion}
        onSubmit={handleDialogSubmit}
        mode={dialogMode}
      />
    </div>
  );
}
