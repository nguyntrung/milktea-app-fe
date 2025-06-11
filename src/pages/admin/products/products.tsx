import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData, deleteData } from "@/lib/api";
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
import { Trash2, SquarePen, Plus, Ban, CupSoda } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Fallback from "@/components/ui/fallback";

interface ThanhPhan {
  maNguyenLieu: string;
  soLuong: number;
  donViTinh: string;
}

interface LuaChonSize {
  tenSize: string;
  giaTang: number;
  thanhPhan: ThanhPhan[];
}

interface Product {
  _id: string;
  ten: string;
  moTa: string;
  maDanhMuc: {
    _id: string;
    ten: string;
  };
  giaCoBan: number;
  luaChonSize: LuaChonSize[];
  hinhAnh: string[];
  toppingCoTheThem: string[];
  tuychon: string[];
  congThuc: string;
  hoatDong: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // State cho dialog xóa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Hàm lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/products");
      setProducts(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý khi nhấn nút xóa
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Xử lý khi xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteData(`/api/products/${productToDelete._id}`);
      toast.success("Xóa sản phẩm thành công");
      setDeleteDialogOpen(false);
      fetchProducts(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  // Xử lý khi nhấn nút chỉnh sửa
  const handleEditClick = (product: Product) => {
    navigate(`/admin/products/edit/${product._id}`, { state: { product } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "ten",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const product = row.original;
        const hinhAnh = product.hinhAnh;
        const firstImage = hinhAnh && hinhAnh.length > 0 ? hinhAnh[0] : "";
        const danhMuc = product.maDanhMuc;
        
        return (
          <div className="flex items-center gap-2">
            <div>
              {firstImage ? (
                <img 
                  src={firstImage.replace("blob: ", "")} 
                  alt={product.ten} 
                  className="h-12 w-12 object-cover rounded-md"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                  <CupSoda />
                </div>
              )}
            </div>
            <div>
              <div>
                {product.ten}
              </div>
              <div className="text-xs text-muted-foreground">
                {danhMuc?.ten || "Không có danh mục"}
              </div>
            </div>
          </div>
        );
      },
    },
    // {
    //   accessorKey: "maDanhMuc",
    //   header: "Danh mục",
    //   cell: ({ row }) => {
    //     const danhMuc = row.getValue("maDanhMuc") as { _id: string; ten: string };
    //     return <div>{danhMuc?.ten || "Không có danh mục"}</div>;
    //   },
    // },
    {
      accessorKey: "giaCoBan",
      header: "Đơn giá",
      cell: ({ row }) => {
        const giaCoBan = row.getValue("giaCoBan") as number;
        const luaChonSize = row.original.luaChonSize || [];
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {formatCurrency(giaCoBan || 0)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  {luaChonSize.map((size, index) => (
                    <div key={index}>
                      {size.tenSize}: {formatCurrency(giaCoBan + size.giaTang)}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "ngayTao",
      header: "Ngày tạo",
      cell: ({ row }) => <div>{formatDate(row.getValue("ngayTao"))}</div>,
    },
    {
      accessorKey: "ngayCapNhat",
      header: "Ngày cập nhật",
      cell: ({ row }) => <div>{formatDate(row.getValue("ngayCapNhat"))}</div>,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleEditClick(product)}
            >
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-destructive"
              onClick={() => handleDeleteClick(product)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: products,
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
    <div className="bg-card h-fit w-full rounded-md p-3 mb-3 shadow-md">
      <h3 className="text-2xl font-bold mb-3">Danh sách sản phẩm</h3>
      
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
          <Button variant="default" className="ml-auto cursor-pointer" onClick={() => navigate("/admin/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
        
        {!loading && !error && (
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} sản phẩm
          </span>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            
            {loading ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    <div className="flex justify-center items-center">
                      <Fallback />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : error ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="text-red-500">{error}</div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
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
                      Không có dữ liệu sản phẩm
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        
        {!loading && !error && (
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
        )}
      </div>

      {/* Dialog xác nhận xóa */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{productToDelete?.ten}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
