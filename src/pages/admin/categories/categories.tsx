import { useEffect, useState } from "react";
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
import { Trash2, SquarePen, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryDialog from "./components/categories-dialog";

interface Category {
  _id: string;
  ten: string;
  hoatDong?: boolean;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // State cho dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/categories");
      setCategories(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      setError("Không thể tải danh sách danh mục. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Xử lý khi thêm danh mục mới
  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  // Xử lý khi sửa danh mục
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  // Xử lý khi submit form
  const handleSubmitCategory = async (data: Omit<Category, '_id' | 'ngayTao' | 'ngayCapNhat'>) => {
    try {
      if (dialogMode === "add") {
        // Thêm mới
        await postData("/api/categories", data);
        toast.success("Thêm danh mục thành công");
      } else {
        // Cập nhật
        await putData(`/api/categories/${selectedCategory?._id}`, data);
        toast.success("Cập nhật danh mục thành công");
      }
      // Tải lại danh sách sau khi thêm/sửa
      fetchCategories();
    } catch (error) {
      console.error("Lỗi khi xử lý danh mục:", error);
      toast.error(dialogMode === "add" 
        ? "Có lỗi xảy ra khi thêm danh mục" 
        : "Có lỗi xảy ra khi cập nhật danh mục");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "ten",
      header: "Tên danh mục",
      cell: ({ row }) => <div>{row.getValue("ten")}</div>,
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
        const category = row.original;
        return (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleEditCategory(category)}
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
    data: categories,
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
      <h3 className="text-2xl font-bold mb-3">Danh mục sản phẩm</h3>
      
      {loading ? (
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
              onClick={handleAddCategory}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục
            </Button>
          </div>
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} danh mục
          </span>
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
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                    >
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
                      Không có dữ liệu danh mục
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {table.getRowModel().rows.length} / {categories.length} danh mục
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

      {/* Dialog thêm/sửa danh mục */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSubmit={handleSubmitCategory}
        mode={dialogMode}
      />
    </div>
  );
}
