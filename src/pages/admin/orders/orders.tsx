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

// Định nghĩa các trạng thái đơn hàng
const orderStatusMap: Record<string, { label: string; color: string }> = {
  "choXacNhan": { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-800" },
  "dangChuanBi": { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800" },
  "dangGiao": { label: "Đang giao", color: "bg-indigo-100 text-indigo-800" },
  "daGiao": { label: "Đã giao", color: "bg-green-100 text-green-800" },
  "daHuy": { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

// Định nghĩa các phương thức thanh toán
const paymentMethodMap: Record<string, string> = {
  "cod": "Thanh toán khi nhận hàng",
  "banking": "Chuyển khoản ngân hàng",
  "momo": "Ví MoMo",
  "zalopay": "ZaloPay",
  "grab": "Grab",
  "ghn": "Giao Hàng Nhanh",
};

// Định nghĩa kiểu dữ liệu cho đơn hàng
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

// Định nghĩa kiểu dữ liệu cho chi tiết đơn hàng
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

// Interface cho các bộ lọc
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
  
  // Thêm state để theo dõi số lượng sản phẩm hiển thị cho mỗi đơn hàng
  const [visibleProductCount, setVisibleProductCount] = useState<Record<string, number>>({});
  // Số lượng sản phẩm hiển thị mặc định
  const DEFAULT_VISIBLE_PRODUCTS = 1;
  
  // State cho dialog xác nhận chuyển trạng thái
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; currentStatus: string; nextStatus: string } | null>(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Xác định trạng thái tiếp theo dựa trên trạng thái hiện tại
  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      "choXacNhan": "dangChuanBi",
      "dangChuanBi": "dangGiao",
      "dangGiao": "daGiao",
      "daGiao": "daGiao", // Trạng thái cuối không thể chuyển tiếp
      "daHuy": "daHuy", // Trạng thái đã hủy không thể chuyển tiếp
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };

  // Xử lý khi nhấp vào nút chuyển trạng thái
  const handleStatusChange = (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    
    // Nếu trạng thái hiện tại là trạng thái cuối hoặc đã hủy, không làm gì cả
    if (nextStatus === currentStatus) {
      toast.info("Không thể chuyển trạng thái tiếp theo");
      return;
    }
    
    // Mở dialog xác nhận
    setSelectedOrder({ id: orderId, currentStatus, nextStatus });
    setDialogOpen(true);
  };

  // Xác nhận chuyển trạng thái
  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    
    await updateOrderStatus(selectedOrder.id, selectedOrder.nextStatus);
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  // Lấy danh sách đơn hàng và chi tiết đơn hàng
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getData("/api/orders");
      if (response.success && Array.isArray(response.data)) {
        // Lấy chi tiết đơn hàng cho mỗi đơn
        const ordersWithDetails = await Promise.all(
          response.data.map(async (order: Order) => {
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

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setStatusUpdating(true);
      const response = await putData(`/api/orders/${orderId}/status`, {
        trangThaiDonHang: status
      });
      
      if (response.success) {
        toast.success("Cập nhật trạng thái đơn hàng thành công");
        fetchOrders();
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

  // Xử lý khi nhấp vào nút hủy đơn hàng
  const handleCancelOrder = (orderId: string, currentStatus: string) => {
    // Kiểm tra nếu đơn hàng đã hủy hoặc đã giao thì không thể hủy
    if (currentStatus === "daHuy" || currentStatus === "daGiao") {
      toast.info("Không thể hủy đơn hàng ở trạng thái này");
      return;
    }
    
    // Mở dialog xác nhận hủy
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  // Xác nhận hủy đơn hàng
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      setStatusUpdating(true);
      const response = await putData(`/api/orders/${orderToCancel}/status`, {
        trangThaiDonHang: "daHuy"
      });
      
      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        fetchOrders(); // Làm mới danh sách đơn hàng
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

  // Xử lý khi xem chi tiết đơn hàng
  const handleViewOrder = async (order: Order) => {
    navigate(`/admin/orders/${order._id}`);
  };

  // Xử lý hiển thị thêm sản phẩm
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

  // Xử lý thu gọn sản phẩm
  const showLessProducts = (orderId: string) => {
    setVisibleProductCount(prev => ({
      ...prev,
      [orderId]: DEFAULT_VISIBLE_PRODUCTS
    }));
  };

  // Lấy trạng thái hiện tại của đơn hàng
  const getCurrentStatus = (order: Order) => {
    if (!order.lichSuTrangThai || order.lichSuTrangThai.length === 0) {
      return "choXacNhan";
    }
    return order.lichSuTrangThai[order.lichSuTrangThai.length - 1].trangThaiDonHang;
  };

  // Hàm định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Hàm parse thông tin người nhận từ chuỗi JSON
  const parseReceiverInfo = (jsonString: string) => {
    try {
      // Kiểm tra nếu chuỗi rỗng hoặc không phải chuỗi
      if (!jsonString || typeof jsonString !== 'string') {
        return { ten: "Không xác định", soDienThoai: "", diaChi: "", email: "" };
      }
      
      // Thử làm sạch chuỗi JSON trước khi parse
      // Đôi khi chuỗi JSON có thể chứa các ký tự không hợp lệ
      const cleanedString = jsonString.trim();
      
      // Kiểm tra xem chuỗi có bắt đầu bằng { và kết thúc bằng } không
      if (!cleanedString.startsWith('{') || !cleanedString.endsWith('}')) {
        // Nếu không phải JSON object, trả về đối tượng mặc định
        return { ten: jsonString, soDienThoai: "", diaChi: "", email: "" };
      }
      
      return JSON.parse(cleanedString);
    } catch (error) {
      console.error("Lỗi khi parse thông tin người nhận:", error);
      return { ten: "Không xác định", soDienThoai: "", diaChi: "", email: "" };
    }
  };

  // Hàm copy mã đơn hàng
  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Đã sao chép mã đơn hàng");
  };

  // Enhanced filtering function
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter - tìm kiếm theo nhiều tiêu chí
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        // Tìm theo mã đơn hàng
        const matchOrderId = order._id.toLowerCase().includes(searchLower);
        
        // Tìm theo tên khách hàng
        const matchCustomerName = order.maKhachHang?.ten?.toLowerCase().includes(searchLower);
        
        // Tìm theo địa chỉ
        const receiverInfo = parseReceiverInfo(order.thongTinNguoiNhan);
        const matchAddress = receiverInfo.diaChi?.toLowerCase().includes(searchLower);
        
        // Tìm theo tên sản phẩm
        const matchProductName = order.chiTietDonHang?.some(product => {
          const productName = typeof product.maSanPham === 'object' 
            ? product.maSanPham.ten 
            : product.tenSanPham || '';
          return productName.toLowerCase().includes(searchLower);
        });

        // Tìm theo email khách hàng
        const matchEmail = order.maKhachHang?.email?.toLowerCase().includes(searchLower);

        // Tìm theo số điện thoại
        const matchPhone = receiverInfo.soDienThoai?.toLowerCase().includes(searchLower);

        return matchOrderId || matchCustomerName || matchAddress || matchProductName || matchEmail || matchPhone;
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => {
        const currentStatus = getCurrentStatus(order);
        return currentStatus === filters.status;
      });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.ngayLap);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        // Set time to start/end of day for accurate comparison
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

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  // Count filtered results
  const filteredCount = filteredOrders.length;
  const totalCount = orders.length;

  // Tải dữ liệu khi component được mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Định nghĩa cột cho bảng
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "_id",
      header: "Mã đơn hàng",
      enableHiding: true, // Có thể ẩn cột này trong giao diện
      enableSorting: true,
    },
    {
      accessorKey: "sanPham",
      header: "Sản Phẩm",
      cell: ({ row }) => {
        const order = row.original;
        const hasMultipleProducts = order.chiTietDonHang && order.chiTietDonHang.length > DEFAULT_VISIBLE_PRODUCTS;
        
        // Lấy số lượng sản phẩm hiển thị
        const visibleCount = visibleProductCount[order._id] || DEFAULT_VISIBLE_PRODUCTS;
        const totalProducts = order.chiTietDonHang?.length || 0;
        
        // Nếu không có sản phẩm
        if (!order.chiTietDonHang || order.chiTietDonHang.length === 0) {
          return <div>Không có thông tin sản phẩm</div>;
        }
        
        // Lấy danh sách sản phẩm hiển thị
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
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs" style={{display: 'none'}}>
                  No Image
                </div>
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
                  {`${currentStatus === "choXacNhan" ? "Xác nhận đơn hàng" : "Chuyển sang" + nextStatus && orderStatusMap[nextStatus]?.label}`}
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
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="bg-card h-fit w-full rounded-md p-3 mb-3 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <Button onClick={fetchOrders} variant="outline" className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
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

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Status Filter */}
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

          {/* Date Range Filter */}
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

      {/* Status Legend */}
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

      {/* Table Section */}
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
                  <Button onClick={fetchOrders} variant="outline" className="cursor-pointer">
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
                    {/* Header thông tin khách hàng và mã đơn hàng */}
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
                    {/* Dòng thông tin sản phẩm và các thông tin khác */}
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${
                        orderStatusMap[getCurrentStatus(row.original)]?.color || "bg-gray-100"
                      }`}
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

        {/* Pagination and Summary */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredCount} / {totalCount} đơn hàng
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog xác nhận chuyển trạng thái */}
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

      {/* Dialog xác nhận hủy đơn hàng */}
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
