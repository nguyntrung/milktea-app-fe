import { useState, useEffect } from "react";
import { getData, postData, putData, deleteData } from "@/lib/api";
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
import ToppingDialog from "./components/topping-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Topping {
  _id: string;
  ten: string;
  gia: number;
  donViTinh: string;
  soLuongMotPhan: number;
  hoatDong: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function ToppingsPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTopping, setSelectedTopping] = useState<Topping | undefined>(undefined);
  const [toppingToDelete, setToppingToDelete] = useState<Topping | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  const fetchToppings = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/toppings");
      setToppings(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải topping:", error);
      setError("Không thể tải danh sách topping. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToppings();
  }, []);

  const handleAddTopping = () => {
    setSelectedTopping(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEditTopping = (topping: Topping) => {
    setSelectedTopping(topping);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteTopping = (topping: Topping) => {
    setToppingToDelete(topping);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!toppingToDelete) return;
    
    try {
      await deleteData(`/api/toppings/${toppingToDelete._id}`);
      toast.success("Xóa topping thành công");
      setDeleteDialogOpen(false);
      setToppingToDelete(null);
      fetchToppings();
    } catch (error) {
      console.error("Lỗi khi xóa topping:", error);
      toast.error("Có lỗi xảy ra khi xóa topping");
    }
  };

  const handleSubmitTopping = async (data: Omit<Topping, '_id' | 'ngayTao' | 'ngayCapNhat'>) => {
    try {
      if (dialogMode === "add") {
        await postData("/api/toppings", data);
        toast.success("Thêm topping thành công");
      } else {
        await putData(`/api/toppings/${selectedTopping?._id}`, data);
        toast.success("Cập nhật topping thành công");
      }
      fetchToppings();
    } catch (error) {
      console.error("Lỗi khi xử lý topping:", error);
      toast.error(dialogMode === "add" 
        ? "Có lỗi xảy ra khi thêm topping" 
        : "Có lỗi xảy ra khi cập nhật topping");
    }
  };

  const columns: ColumnDef<Topping>[] = [
    {
      accessorKey: "ten",
      header: "Tên topping",
      cell: ({ row }) => <div>{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "gia",
      header: "Giá",
      cell: ({ row }) => <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.getValue("gia"))}</div>,
    },
    {
      accessorKey: "soLuongMotPhan",
      header: "Số lượng một phần",
      cell: ({ row }) => <div>{row.getValue("soLuongMotPhan")}</div>,
    },
    {
      accessorKey: "donViTinh",
      header: "Đơn vị tính",
      cell: ({ row }) => <div>{row.getValue("donViTinh")}</div>,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const topping = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleEditTopping(topping)}
            >
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-destructive"
              onClick={() => handleDeleteTopping(topping)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: toppings,
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
      <h3 className="text-2xl font-bold mb-3">Danh sách topping</h3>
      
      {loading && toppings.length === 0 ? (
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
              onClick={handleAddTopping}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm topping
            </Button>
          </div>
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} topping
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
                      Không có dữ liệu topping
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {table.getRowModel().rows.length} / {toppings.length} topping
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
      
      <ToppingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        topping={selectedTopping}
        onSubmit={(data) => 
          handleSubmitTopping({...data, hoatDong: data.hoatDong ?? false})}
        mode={dialogMode}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa topping</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa topping "{toppingToDelete?.ten}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setToppingToDelete(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
