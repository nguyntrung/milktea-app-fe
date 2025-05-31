import { useState, useEffect } from "react";
import { getData, postData, putData } from "@/lib/api";
import { toast } from "sonner";
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
import { SquarePen, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SupplierDialog from "./components/supplier-dialog";

interface Supplier {
  _id: string;
  ten: string;
  diaChi: string;
  lienHe: string;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // State cho dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Lấy danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/suppliers");
      setSuppliers(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải nhà cung cấp:", error);
      setError("Không thể tải danh sách nhà cung cấp. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Xử lý khi thêm nhà cung cấp mới
  const handleAddSupplier = () => {
    setSelectedSupplier(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  // Xử lý khi sửa nhà cung cấp
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  // Xử lý khi submit form
  const handleSubmitSupplier = async (data: Omit<Supplier, '_id' | 'ngayTao' | 'ngayCapNhat'>) => {
    try {
      if (dialogMode === "add") {
        // Thêm mới
        await postData("/api/suppliers", data);
        toast.success("Thêm nhà cung cấp thành công");
      } else {
        // Cập nhật
        await putData(`/api/suppliers/${selectedSupplier?._id}`, data);
        toast.success("Cập nhật nhà cung cấp thành công");
      }
      // Tải lại danh sách sau khi thêm/sửa
      fetchSuppliers();
    } catch (error) {
      console.error("Lỗi khi xử lý nhà cung cấp:", error);
      toast.error(dialogMode === "add" 
        ? "Có lỗi xảy ra khi thêm nhà cung cấp" 
        : "Có lỗi xảy ra khi cập nhật nhà cung cấp");
    }
  };

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "ten",
      header: "Tên nhà cung cấp",
      cell: ({ row }) => <div>{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "diaChi",
      header: "Địa chỉ",
      cell: ({ row }) => <div>{row.getValue("diaChi")}</div>,
    },
    {
      accessorKey: "lienHe",
      header: "Số điện thoại",
      cell: ({ row }) => <div>{row.getValue("lienHe")}</div>,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleEditSupplier(supplier)}
            >
              <SquarePen className="h-4 w-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: suppliers,
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
      <h3 className="text-2xl font-bold mb-3">Danh sách nhà cung cấp</h3>
      
      {loading && suppliers.length === 0 ? (
        <div className="text-center py-4">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
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
              onClick={handleAddSupplier}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhà cung cấp
            </Button>
          </div>
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} nhà cung cấp
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
                      Không có dữ liệu nhà cung cấp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {table.getRowModel().rows.length} / {suppliers.length} nhà cung cấp
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

      {/* Dialog thêm/sửa nhà cung cấp */}
      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSubmit={handleSubmitSupplier}
        mode={dialogMode}
      />
    </div>
  );
}