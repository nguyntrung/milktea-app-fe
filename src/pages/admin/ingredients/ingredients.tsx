import { useState, useEffect } from "react";
import { getData, postData, putData, deleteData } from "@/lib/api";
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
import IngredientDialog from "./components/ingredients-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Ingredient {
  _id: string;
  ten: string;
  donViTinh: string;
  nhaCungCap: Array<{
    maNhacungCap: string;
    donGia: number;
  }>;
  hoatDong: boolean;
  nguyenLieuHaoHut: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(undefined);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [suppliers, setSuppliers] = useState<{ _id: string; ten: string }[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ingredientsResponse = await getData("/api/ingredients");
      if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
        setIngredients(ingredientsResponse.data || []);
      }
      
      const suppliersResponse = await getData("/api/suppliers");
      if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
        setSuppliers(suppliersResponse.data || []);
      }
      
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setError("Không thể tải danh sách nguyên liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIngredient = () => {
    setSelectedIngredient(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteIngredient = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ingredientToDelete) return;
    
    try {
      await deleteData(`/api/ingredients/${ingredientToDelete._id}`);
      setDeleteDialogOpen(false);
      setIngredientToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Lỗi khi xóa nguyên liệu:", error);
      setError("Không thể xóa nguyên liệu. Vui lòng thử lại sau.");
    }
  };

  const handleSubmitIngredient = async (data: Omit<Ingredient, '_id' | 'ngayTao' | 'ngayCapNhat'>) => {
    try {
      if (dialogMode === "add") {
        await postData("/api/ingredients", data);
      } else {
        await putData(`/api/ingredients/${selectedIngredient?._id}`, data);
      }
      fetchData();
    } catch (error) {
      console.error("Lỗi khi xử lý nguyên liệu:", error);
      throw error;
    }
  };

  const getSupplierNames = (
    supplierData: Array<{ maNhacungCap: string; donGia: number }>
  ) => {
    if (!supplierData || !supplierData.length) return ["Không có"];

    return supplierData.map((item) => {
      const supplier = suppliers.find((s) => s._id === item.maNhacungCap);
      const supplierName = supplier ? supplier.ten : item.maNhacungCap;
      return `${supplierName} - ${item.donGia.toLocaleString("vi-VN")}đ`;
    });
  };

  const columns: ColumnDef<Ingredient>[] = [
    {
      accessorKey: "ten",
      header: "Tên nguyên liệu",
      cell: ({ row }) => <div>{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "donViTinh",
      header: "Đơn vị tính",
      cell: ({ row }) => <div>{row.getValue("donViTinh")}</div>,
    },
    {
      id: "nhaCungCap",
      header: "Nhà cung cấp",
      cell: ({ row }) => {
        const ingredient = row.original;
        const supplierLines = getSupplierNames(ingredient.nhaCungCap);
        return (
          <div className="max-w-xs text-muted-foreground whitespace-pre-line" title={supplierLines.join("\n")}>
            {supplierLines.map((line, index) => (
              <div key={index}>{supplierLines.length > 1 ? `${index + 1}. ` : ""} {line}</div>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const ingredient = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleEditIngredient(ingredient)}
            >
              <SquarePen className="h-4 w-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-destructive"
              onClick={() => handleDeleteIngredient(ingredient)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: ingredients,
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
      <h3 className="text-2xl font-bold mb-3">Danh sách nguyên liệu</h3>
      
      {loading && ingredients.length === 0 ? (
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
              onClick={handleAddIngredient}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm nguyên liệu
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
                Hiển thị {table.getRowModel().rows.length} / {ingredients.length} nguyên liệu
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

      <IngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={selectedIngredient}
        onSubmit={handleSubmitIngredient}
        mode={dialogMode}
        suppliers={suppliers}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa nguyên liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa nguyên liệu "{ingredientToDelete?.ten}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setIngredientToDelete(null);
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
