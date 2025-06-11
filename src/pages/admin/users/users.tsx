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
import { ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  _id: string;
  email: string;
  ten: string;
  ngaySinh: string;
  gioiTinh: string;
  soDienThoai: string;
  diemTichLuy: number;
  diaChi?: string;
  hoatDong: boolean;
  vaiTro: string;
  ngayTao: string;
  ngayCapNhat: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Gọi API lấy danh sách người dùng
      const response = await getData("/api/auth/");
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data || []);
      } else {
        setUsers([]);
      }
      
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
      setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "stt",
      header: () => <div className="text-center">STT</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "ten",
      header: "Họ tên",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div>{row.getValue("ten") || '--'}</div>
          <span className="text-muted-foreground text-xs">{row.getValue("email")} - {row.getValue("soDienThoai")}</span>
        </div>
      )
    },
    {
      accessorKey: "vaiTro",
      header: "Vai trò",
      cell: ({ row }) => {
        const role = row.getValue("vaiTro") as string;
        return (
          <div className={`${role === "admin" ? "text-blue-600 font-medium" : ""}`}>
            {role === "admin" ? "Quản trị viên" : "Khách hàng"}
          </div>
        );
      },
    },
    {
      accessorKey: "diemTichLuy",
      header: () => (<div className="text-center">Điểm tích lũy</div>),
      cell: ({ row }) => {
        const points = parseFloat(row.getValue("diemTichLuy"));
        const formatted = new Intl.NumberFormat("vi-VN").format(points);
        return <div className="font-medium text-center">{formatted}</div>;
      },
    },
    {
      accessorKey: "hoatDong",
      header: "Trạng thái",
      cell: ({ row }) => {
        const active = row.getValue("hoatDong") as boolean;
        return (
          <div className={`${active ? "text-green-600" : "text-red-600"} font-medium`}>
            {active ? "Hoạt động" : "Đã khóa"}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
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
        <CardTitle>Quản lý người dùng</CardTitle>
        <CardDescription className="flex justify-between">
          Quản lý thông tin và trạng thái người dùng trong hệ thống
        </CardDescription>
      </CardHeader>

      <CardContent>
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
          </div>
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length} người dùng
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24">
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24">
                      <div className="flex justify-center items-center h-full text-destructive">
                        {error}
                      </div>
                    </TableCell>
                  </TableRow>
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
                      Không có dữ liệu người dùng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {table.getRowModel().rows.length} / {users.length} người dùng
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
      </CardContent>
    </Card>
  );
}
