import { useState, useEffect } from "react";
import { getData, postData, putData } from "@/lib/api";
//import { toast } from "sonner";
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

interface Ingredient {
  _id: string;
  ten: string;
  donViTinh: string;
  nguongCanhBao: number;
  maNhaCungCap: string[];
  hoatDong: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // State cho dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  
  // State cho nhà cung cấp
  const [suppliers, setSuppliers] = useState<{ _id: string; ten: string }[]>([]);

  // Lấy danh sách nguyên liệu và nhà cung cấp
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách nguyên liệu
      const ingredientsResponse = await getData("/api/ingredients");
      if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
        setIngredients(ingredientsResponse.data || []);
      }
      
      // Lấy danh sách nhà cung cấp để hiển thị tên
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

  // Xử lý khi thêm nguyên liệu mới
  const handleAddIngredient = () => {
    setSelectedIngredient(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  // Xử lý khi sửa nguyên liệu
  const handleEditIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  // Xử lý khi submit form
  const handleSubmitIngredient = async (data: Omit<Ingredient, '_id' | 'ngayTao' | 'ngayCapNhat' | 'hoatDong'>) => {
    try {
      if (dialogMode === "add") {
        // Thêm mới
        await postData("/api/ingredients", data);
      } else {
        // Cập nhật
        await putData(`/api/ingredients/${selectedIngredient?._id}`, data);
      }
      // Tải lại danh sách sau khi thêm/sửa
      fetchData();
    } catch (error) {
      console.error("Lỗi khi xử lý nguyên liệu:", error);
      throw error; // Ném lỗi để dialog xử lý
    }
  };

  // Hàm lấy tên nhà cung cấp từ ID
  const getSupplierNames = (supplierIds: Array<string | { _id: string; ten: string }>) => {
    if (!supplierIds || !supplierIds.length) return "Không có";
    
    return supplierIds.map(item => {
      // Kiểm tra nếu item là object (đã được populate)
      if (typeof item === 'object' && item !== null && item._id && item.ten) {
        return item.ten;
      }
      
      // Nếu item là string (ID), tìm tên từ danh sách suppliers
      const supplier = suppliers.find(s => s._id === item);
      return supplier ? supplier.ten : item;
    }).join(", ");
  };

  // Định nghĩa cột cho bảng
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
        return <div>{getSupplierNames(ingredient.maNhaCungCap)}</div>;
      },
    },
    {
      accessorKey: "hoatDong",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div
            className={`px-4 py-2 rounded w-fit 
              ${row.getValue("hoatDong") 
                ? "text-green-700 bg-green-100" 
                : "text-red-700 bg-red-100"}`}
          >
            {row.getValue("hoatDong") ? "Hoạt động" : "Không hoạt động"}
          </div>
      ),
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
    <div className="bg-card h-fit w-full rounded-md p-3 shadow-md">
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

      {/* Dialog thêm/sửa nguyên liệu */}
      <IngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={selectedIngredient}
        onSubmit={async (data) => {
          await handleSubmitIngredient({
            ...data,
            nguongCanhBao: 0
          });
        }}
        mode={dialogMode}
      />
    </div>
  );
}
