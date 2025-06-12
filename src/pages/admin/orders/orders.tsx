import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { getData, putData } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns"
import { vi } from "date-fns/locale"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RefreshCw, Copy, EllipsisVertical, CalendarIcon, Search, X, Trash } from "lucide-react";
import Fallback from "@/components/ui/fallback";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const orderStatusMap: Record<string, { label: string; color: string }> = {
  "choXacNhan": { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-800" },
  "dangChuanBi": { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800" },
  "dangGiao": { label: "Đang giao", color: "bg-indigo-100 text-indigo-800" },
  "daGiao": { label: "Đã giao", color: "bg-green-100 text-green-800" },
  "daHuy": { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

const paymentMethodMap: Record<string, string> = {
  "cod": "Thanh toán khi nhận hàng",
  "banking": "Chuyển khoản ngân hàng",
  "momo": "Ví MoMo",
  "zalopay": "ZaloPay",
  "grab": "Grab",
  "ghn": "Giao Hàng Nhanh",
};

interface Order {
  _id: string;
  maKhachHang: {
    _id: string;
    ten: string;
    email: string;
  };
  maNhanVien: {
    _id: string;
    ten: string;
  };
  ngayLap: string;
  tongTienHang: number;
  tongTien: number;
  khuyenMai: Array<{
    maKhuyenMai: string;
    giaTri: number;
  }>;
  nguoiGiao: string;
  thongTinNguoiNhan: string;
  lichSuTrangThai: Array<{
    thoiGian: string;
    trangThaiDonHang: string;
    _id: string;
  }>;
  ghiChu: string;
  thanhToan: {
    phuongThucThanhToan: string;
    trangThaiThanhToan: string;
  };
  ngayTao: string;
  ngayCapNhat: string;
  chiTietDonHang?: OrderDetail[];
}

interface OrderDetail {
  _id: string;
  maHoaDon: string;
  maSanPham: string | {
    _id: string;
    ten: string;
  };
  hinhAnh: string;
  tenSanPham?: string;
  soLuong: number;
  kichCo: {
    tenSize: string;
    giaTang: number;
  };
  tuyChon: string[];
  topping: Array<{
    maTopping: string | {
      _id: string;
      ten: string;
    };
    ten?: string;
    gia: number;
    soLuong: number;
    _id: string;
  }>;
  thanhTien: number;
  ghiChu?: string;
  donGia?: number;
}

interface FilterState {
  searchTerm: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "ngayLap", desc: true }]);
  const [, setExpandedRows] = useState<Record<string, boolean>>({});
  const [, setStatusUpdating] = useState<boolean>(false);
  const [visibleProductCount, setVisibleProductCount] = useState<Record<string, number>>({});
  const DEFAULT_VISIBLE_PRODUCTS = 1;
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; currentStatus: string; nextStatus: string } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      "choXacNhan": "dangChuanBi",
      "dangChuanBi": "dangGiao",
      "dangGiao": "daGiao",
      "daGiao": "daGiao",
      "daHuy": "daHuy",
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };

  const handleStatusChange = (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    
    if (nextStatus === currentStatus) {
      toast.info("Không thể chuyển trạng thái tiếp theo");
      return;
    }
    
    setSelectedOrder({ id: orderId, currentStatus, nextStatus });
    setDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    
    await updateOrderStatus(selectedOrder.id, selectedOrder.nextStatus);
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  const fetchOrders = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const response = await getData(`/api/orders/paginated?page=${pageNum}&limit=10`);
      if (response.success && Array.isArray(response.data.orders)) {
        const ordersWithDetails = await Promise.all(
          response.data.orders.map(async (order: Order) => {
            try {
              const detailsResponse = await getData(`/api/order-details/${order._id}`);
              if (detailsResponse.success && Array.isArray(detailsResponse.data)) {
                return { ...order, chiTietDonHang: detailsResponse.data };
              }
              return order;
            } catch (error) {
              console.error(`Lỗi khi lấy chi tiết đơn hàng ${order._id}:`, error);
              return order;
            }
          })
        );
        setOrders(ordersWithDetails);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
        setPage(pageNum);
      } else {
        setError("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      setError("Đã xảy ra lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setStatusUpdating(true);
      const response = await putData(`/api/orders/${orderId}/status`, {
        trangThaiDonHang: status
      });
      
      if (response.success) {
        toast.success("Cập nhật trạng thái đơn hàng thành công");
        fetchOrders(page);
      } else {
        toast.error("Không thể cập nhật trạng thái đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancelOrder = (orderId: string, currentStatus: string) => {
    if (currentStatus === "daHuy" || currentStatus === "daGiao") {
      toast.info("Không thể hủy đơn hàng ở trạng thái này");
      return;
    }
    
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      setStatusUpdating(true);
      const response = await putData(`/api/orders/${orderToCancel}/deactivate`, {});
      
      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        fetchOrders(page);
      } else {
        toast.error("Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      toast.error("Đã xảy ra lỗi khi hủy đơn hàng");
    } finally {
      setStatusUpdating(false);
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleViewOrder = async (order: Order) => {
    navigate(`/admin/orders/${order._id}`);
  };

  const showMoreProducts = (orderId: string, totalProducts: number) => {
    setVisibleProductCount(prev => ({
      ...prev,
      [orderId]: totalProducts
    }));
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: true
    }));
  };

  const showLessProducts = (orderId: string) => {
    setVisibleProductCount(prev => ({
      ...prev,
      [orderId]: DEFAULT_VISIBLE_PRODUCTS
    }));
  };

  const getCurrentStatus = (order: Order) => {
    if (!order.lichSuTrangThai || order.lichSuTrangThai.length === 0) {
      return "choXacNhan";
    }
    return order.lichSuTrangThai[order.lichSuTrangThai.length - 1].trangThaiDonHang;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const parseReceiverInfo = (jsonString: string) => {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { ten: "Không xác định", soDienThoai: "", diaChi: "", email: "" };
      }
      
      const cleanedString = jsonString.trim();
      
      if (!cleanedString.startsWith('{') || !cleanedString.endsWith('}')) {
        return { ten: jsonString, soDienThoai: "", diaChi: "", email: "" };
      }
      
      return JSON.parse(cleanedString);
    } catch (error) {
      console.error("Lỗi khi parse thông tin người nhận:", error);
      return { ten: "Không xác định", soDienThoai: "", diaChi: "", email: "" };
    }
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Đã sao chép mã đơn hàng");
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const matchOrderId = order._id.toLowerCase().includes(searchLower);
        const matchCustomerName = order.maKhachHang?.ten?.toLowerCase().includes(searchLower);
        const receiverInfo = parseReceiverInfo(order.thongTinNguoiNhan);
        const matchAddress = receiverInfo.diaChi?.toLowerCase().includes(searchLower);
        const matchProductName = order.chiTietDonHang?.some(product => {
          const productName = typeof product.maSanPham === 'object' 
            ? product.maSanPham.ten 
            : product.tenSanPham || '';
          return productName.toLowerCase().includes(searchLower);
        });
        const matchEmail = order.maKhachHang?.email?.toLowerCase().includes(searchLower);
        const matchPhone = receiverInfo.soDienThoai?.toLowerCase().includes(searchLower);

        return matchOrderId || matchCustomerName || matchAddress || matchProductName || matchEmail || matchPhone;
      });
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => {
        const currentStatus = getCurrentStatus(order);
        return currentStatus === filters.status;
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.ngayLap);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0);
        }
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
        }

        const afterFromDate = !fromDate || orderDate >= fromDate;
        const beforeToDate = !toDate || orderDate <= toDate;

        return afterFromDate && beforeToDate;
      });
    }

    return filtered;
  }, [orders, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const filteredCount = filteredOrders.length;

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "_id",
      header: "Mã đơn hàng",
      enableHiding: true,
      enableSorting: true,
    },
    {
      accessorKey: "sanPham",
      header: "Sản Phẩm",
      cell: ({ row }) => {
        const order = row.original;
        const hasMultipleProducts = order.chiTietDonHang && order.chiTietDonHang.length > DEFAULT_VISIBLE_PRODUCTS;
        
        const visibleCount = visibleProductCount[order._id] || DEFAULT_VISIBLE_PRODUCTS;
        const totalProducts = order.chiTietDonHang?.length || 0;
        
        if (!order.chiTietDonHang || order.chiTietDonHang.length === 0) {
          return <div>Không có thông tin sản phẩm</div>;
        }
        
        const visibleProducts = order.chiTietDonHang.slice(0, visibleCount);
        const remainingCount = totalProducts - visibleCount;
        
        const renderProduct = (product: OrderDetail, index: number) => {
          const productName = typeof product.maSanPham === 'object' 
            ? product.maSanPham.ten 
            : product.tenSanPham || 'Sản phẩm không xác định';
          
          const size = product.kichCo?.tenSize || '';
          const toppings = product.topping?.map(t => 
            typeof t.maTopping === 'object' ? t.maTopping.ten : t.ten
          ).join(', ') || '';
          
          return (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                {product.hinhAnh ? (
                  <img 
                    src={product.hinhAnh} 
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{productName}</div>
                <div className="text-sm text-muted-foreground">
                  {size && <span>{size} • </span>}
                  {
                    toppings && 
                    <span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {toppings.length > 30 ? toppings.slice(0, 30) + "..." : toppings}
                          </TooltipTrigger>
                          <TooltipContent>
                            {toppings}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  }
                </div>
                <div className="text-sm">
                  {formatPrice(product.donGia || 0)} x {product.soLuong}
                  {product.ghiChu && (
                    <div className="text-muted-foreground italic">
                      Ghi chú: {product.ghiChu}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        };
        
        return (
          <div className="flex flex-col">
            {visibleProducts.map((product, index) => renderProduct(product, index))}
            {hasMultipleProducts && (
              <div className="mt-1">
                {remainingCount > 0 ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => showMoreProducts(order._id, totalProducts)}
                  >
                    <ChevronDown className="h-3 w-3 mr-1" /> 
                    Xem thêm {remainingCount} sản phẩm
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => showLessProducts(order._id)}
                  >
                    <ChevronUp className="h-3 w-3 mr-1" /> 
                    Thu gọn
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "tongThanhToan",
      header: () => <div className="text-right">Tổng thanh toán</div>,
      cell: ({ row }) => {
        const amount = row.original.tongTien;
        const order = row.original;
        const method = order.thanhToan?.phuongThucThanhToan || "cod";
        const deliveryMethod = paymentMethodMap[method] || method;
        return (
          <div className="text-right">
            <p>{formatPrice(amount)}</p>
            <span className="font-medium text-muted-foreground text-xs">{deliveryMethod}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "ngayLap",
      header: "Ngày đặt hàng",
      cell: ({ row }) => {
        const date = row.getValue("ngayLap") as string;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const order = row.original;
        const currentStatus = getCurrentStatus(order);
        const statusInfo = orderStatusMap[currentStatus] || { label: currentStatus, color: "bg-gray-100 text-gray-800" };
        const nextStatus = getNextStatus(currentStatus);
    
        return (
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} w-[80%] h-8 flex items-center justify-start`}>
              {statusInfo.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <EllipsisVertical className="text-primary hover:text-muted-foreground cursor-pointer h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(order._id, currentStatus)}
                  disabled={nextStatus === currentStatus}
                >
                  {`${currentStatus === "choXacNhan" ? "Xác nhận đơn hàng" : "Chuyển sang " + (nextStatus && orderStatusMap[nextStatus]?.label)}`}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCancelOrder(order._id, currentStatus)}
                  disabled={currentStatus === "daGiao" || currentStatus === "daHuy" || currentStatus === "dangGiao"}
                >
                  Hủy đơn hàng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleViewOrder(order)}
                >
                  Xem chi tiết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility: {
        _id: false,
      },
      pagination: {
        pageIndex: page - 1,
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-card h-fit w-full rounded-md p-3 mb-3 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <Button onClick={() => fetchOrders(1)} variant="outline" className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, địa chỉ, tên sản phẩm, email, số điện thoại..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => handleFilterChange('searchTerm', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(orderStatusMap).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="w-full md:w-58">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP", { locale: vi }) : <span>Từ ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleFilterChange('dateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-58">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP", { locale: vi }) : <span>Đến ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleFilterChange('dateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={clearAllFilters}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="my-4 flex justify-end">
        <div className="flex flex-wrap gap-4">
          {Object.entries(orderStatusMap).map(([status, { label, color }]) => (
            <div key={status} className="flex items-center gap-2">
              <Badge className={`${color} h-3 w-3 flex items-center justify-center rounded-full`}></Badge>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
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
                  <div className="text-destructive mb-4">{error}</div>
                  <Button onClick={() => fetchOrders(1)} variant="outline" className="cursor-pointer">
                    Thử lại
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <>
                    <TableRow key={`${row.id}-header`}>
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="bg-[#ecf0fe] px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center">
                              <img
                                src="https://fsviet.com/image/data/decaltrasua/logo-tra-sua-dep.jpg"
                                alt=""
                                className="rounded-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {row.original.maKhachHang?.ten}
                              </span>
                              <span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-muted-foreground font-normal">
                                        {parseReceiverInfo(row.original.thongTinNguoiNhan).diaChi.split(",").slice(0, 3).join(",")}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {parseReceiverInfo(row.original.thongTinNguoiNhan).diaChi}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                            </div>
                          </div>
                          <div className="text-sm flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => copyOrderId(row.original._id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <span>Mã đơn hàng:</span> {row.original._id}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${orderStatusMap[getCurrentStatus(row.original)]?.color || "bg-gray-100"}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Không tìm thấy đơn hàng nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredCount} / {totalCount} đơn hàng
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(page - 1)}
              disabled={page <= 1}
              className="cursor-pointer"
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(page + 1)}
              disabled={page >= totalPages}
              className="cursor-pointer"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn chuyển trạng thái đơn hàng từ "
              {selectedOrder?.currentStatus && orderStatusMap[selectedOrder.currentStatus]?.label}" sang "
              {selectedOrder?.nextStatus && orderStatusMap[selectedOrder.nextStatus]?.label}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={confirmStatusChange}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Hủy</Button>
            <Button onClick={confirmCancelOrder}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
