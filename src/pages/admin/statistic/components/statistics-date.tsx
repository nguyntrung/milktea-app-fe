import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Calendar as CalendarIcon, DollarSign, Coffee, Search, Download, BarChart3, LineChart as LineChartIcon, RefreshCcw } from 'lucide-react';
import { getData } from '@/lib/api';
import { format } from 'date-fns';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Interfaces from your existing code
interface IngredientStatistic {
  donViTinh: string;
  tenNguyenLieu: string | null;
  soLuongBanDau: number;
  tongSoLuongNhap: number;
  tongSoLuongBan: number;
  tongSoLuongHaoHut: number;
  soLuongTon: number;
  maNguyenLieu: string;
}

interface DailyIngredientStatistic extends IngredientStatistic {
  ngay: string;
  tongSoLuongBanDau: number;
}

interface YearlyIngredientStatistic extends IngredientStatistic {
  nam: number;
}

interface RevenueStatistic {
  maNguyenLieu: string;
  tenNguyenLieu: string;
  donViTinh: string;
  tongDoanhThu: number;
  tongSoLuongBan: number;
  giaTriTrungBinh: number;
}

export default function IngredientStatistics() {
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'yearly' | 'revenue'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState('all');
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Data states
  const [monthlyData, setMonthlyData] = useState<IngredientStatistic[]>([]);
  const [dailyData, setDailyData] = useState<DailyIngredientStatistic[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyIngredientStatistic[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueStatistic[]>([]);
  const [ingredients, setIngredients] = useState<{[key: string]: string}>({});
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ingredients list
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await getData("/api/ingredients");
        if (response.success && Array.isArray(response.data)) {
          const ingredientsMap: {[key: string]: string} = {};
          response.data.forEach((ingredient: any) => {
            ingredientsMap[ingredient._id] = ingredient.ten;
          });
          setIngredients(ingredientsMap);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách nguyên liệu:", error);
      }
    };

    fetchIngredients();
  }, []);

  // Fetch statistics data based on active tab and selected date
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const day = selectedDate.getDate();
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        
        switch (activeTab) {
          case 'month':
            const monthResponse = await getData(`/api/statistic-ingredients/month?month=${month}&year=${year}`);
            if (monthResponse.success && Array.isArray(monthResponse.data)) {
              setMonthlyData(monthResponse.data);
            }
            break;
            
          case 'daily':
            const dailyResponse = await getData(`/api/statistic-ingredients/daily?day=${day}&month=${month}&year=${year}`);
            if (dailyResponse.success && Array.isArray(dailyResponse.data)) {
              setDailyData(dailyResponse.data);
            }
            break;
            
          case 'yearly':
            const yearlyResponse = await getData(`/api/statistic-ingredients/yearly?year=${year}`);
            if (yearlyResponse.success && Array.isArray(yearlyResponse.data)) {
              setYearlyData(yearlyResponse.data);
            }
            break;
            
          case 'revenue':
            const revenueResponse = await getData(`/api/statistic-ingredients/revenue/month?month=${month}&year=${year}`);
            if (revenueResponse.success && Array.isArray(revenueResponse.data)) {
              setRevenueData(revenueResponse.data);
            }
            break;
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [activeTab, selectedDate]);

  // Get ingredient name from ID
  const getIngredientName = (id: string) => {
    return ingredients[id] || "Không xác định";
  };

  // Format quantity with unit
  const formatQuantity = (quantity: number | null | undefined, unit: string) => {
    if (quantity === null || quantity === undefined) {
      return `0.00 ${unit}`;
    }
    return `${quantity.toFixed(2)} ${unit}`;
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'month':
        return monthlyData;
      case 'daily':
        return dailyData;
      case 'yearly':
        return yearlyData;
      case 'revenue':
        return revenueData;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Filter data based on search and ingredient selection
  const filteredData = currentData.filter((item: any) => {
    const ingredientName = getIngredientName(item.maNguyenLieu);
    const matchesIngredient = selectedIngredient === 'all' || item.maNguyenLieu === selectedIngredient;
    const matchesSearch = ingredientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesIngredient && matchesSearch;
  });

  // Prepare chart data
  const chartData = filteredData.map((item: any, index) => ({
    name: getIngredientName(item.maNguyenLieu),
    'Tồn đầu': item.soLuongBanDau || item.tongSoLuongBanDau || 0,
    'Nhập kho': item.tongSoLuongNhap || 0,
    'Bán ra': item.tongSoLuongBan || 0,
    'Hao hụt': item.tongSoLuongHaoHut || 0,
    'Tồn cuối': item.soLuongTon || 0,
    'Doanh thu': item.tongDoanhThu || 0,
    date: (() => {
      const parsedDate = new Date(item.ngay);
      return isNaN(parsedDate.getTime()) ? `Item ${index + 1}` : format(parsedDate, 'dd/MM');
    })()    
  }));

  // Prepare pie chart data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const pieData = Object.entries(
    filteredData.reduce((acc: any, item: any) => {
      const name = getIngredientName(item.maNguyenLieu);
      const sold = item.tongSoLuongBan || 0;
      acc[name] = (acc[name] || 0) + sold;
      return acc;
    }, {})
  ).map(([name, value], index) => ({
    name,
    value: value as number,
    color: COLORS[index % COLORS.length]
  }));

  // Calculate total statistics
  const totalStats = {
    totalSold: filteredData.reduce((sum: number, item: any) => sum + (item.tongSoLuongBan || 0), 0),
    totalImported: filteredData.reduce((sum: number, item: any) => sum + (item.tongSoLuongNhap || 0), 0),
    totalRevenue: filteredData.reduce((sum: number, item: any) => sum + (item.tongDoanhThu || 0), 0),
    totalRemaining: filteredData.reduce((sum: number, item: any) => sum + Math.max(0, item.soLuongTon || 0), 0)
  };

  const tabConfig = {
    daily: { title: 'Thống kê theo ngày', icon: CalendarIcon },
    month: { title: 'Thống kê theo tháng', icon: BarChart3 },
    yearly: { title: 'Thống kê theo năm', icon: TrendingUp },
  };

  // Stat Card component using Card component
  const StatCard = ({ title, value, unit, icon: Icon, color = "blue" }) => (
    <Card className={`border-l-4 border-${color}-500 hover:shadow-xl transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-2xl mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
              <span className="text-sm text-muted-foreground ml-1">{unit}</span>
            </CardTitle>
          </div>
          <div className={`p-3 bg-${color}-100 rounded-lg`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Get unique ingredients for filter dropdown
  const uniqueIngredients = [...new Set(currentData.map((item: any) => item.maNguyenLieu))];

  return (
    <Card className='bg-background rounded-lg shadow-md mb-3'>
      <CardHeader className="mt-4">
        <CardTitle>Thống kê nguyên liệu</CardTitle>
        <CardDescription className="flex justify-between">
          Quản lý và theo dõi tình trạng nguyên liệu trong cửa hàng
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
          <div className="relative col-span-2">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muinted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <Input
              type="text"
              placeholder="Tìm nguyên liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn nguyên liệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nguyên liệu</SelectItem>
              {uniqueIngredients.map(ingredientId => (
                <SelectItem key={ingredientId} value={ingredientId}>
                  {getIngredientName(ingredientId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="w-full border-b border-muted rounded-md p-0">
              {Object.entries(tabConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center px-6 py-4 rounded border-b-2 border-transparent data-[state=active]:bg-primary data-[state=active]:text-background"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {config.title}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="p-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">{error}</div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                      title="Tổng đã bán"
                      value={totalStats.totalSold.toFixed(2)}
                      unit="đơn vị"
                      icon={Package}
                      color="green"
                    />
                    <StatCard
                      title="Tổng nhập kho"
                      value={totalStats.totalImported.toFixed(2)}
                      unit="đơn vị"
                      icon={TrendingUp}
                      color="blue"
                    />
                    <StatCard
                      title="Tổng tồn kho"
                      value={totalStats.totalRemaining.toFixed(2)}
                      unit="đơn vị"
                      icon={Coffee}
                      color="orange"
                    />
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu thống kê cho khoảng thời gian này
                    </div>
                  ) : (
                    <>
                      {/* Charts */}
                      <div className="flex flex-col gap-4 mb-8">
                        {/* Bar Chart */}
                        <Card>
                          <CardHeader className='mt-4'>
                            <CardTitle className='text-center'>Biểu đồ xuất - nhập - tồn</CardTitle>
                          </CardHeader>
                          <CardContent className="bg-gray-50 rounded-xl p-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Bán ra" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Nhập kho" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Tồn cuối" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                          <CardHeader className='mt-4'>
                            <CardTitle className='text-center'>Biểu đồ tỷ lệ bán ra</CardTitle>
                          </CardHeader>
                          <CardContent className="bg-gray-50 rounded-xl p-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={130}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Line Chart */}
                        {/* {activeTab !== 'revenue' && (
                          <Card className="lg:col-span-2">
                            <CardHeader className='mt-4'>
                              <CardTitle className='text-center'>Biểu đồ xu hướng theo thời gian</CardTitle>
                            </CardHeader>
                            <CardContent className="bg-gray-50 rounded-xl p-6">
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey="Bán ra" stroke="#ef4444" strokeWidth={2} />
                                  <Line type="monotone" dataKey="Nhập kho" stroke="#22c55e" strokeWidth={2} />
                                  <Line type="monotone" dataKey="Tồn cuối" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        )} */}

                        {/* Revenue Chart */}
                        {activeTab === 'revenue' && (
                          <Card className="lg:col-span-2">
                            <CardHeader className='mt-4'>
                              <CardTitle>Biểu đồ doanh thu</CardTitle>
                            </CardHeader>
                            <CardContent className="bg-gray-50 rounded-xl p-6">
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [value.toLocaleString() + ' VNĐ', 'Doanh thu']} />
                                  <Legend />
                                  <Line type="monotone" dataKey="Doanh thu" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Data Table */}
                      <div>
                        <div className='font-medium text-center mb-2'>
                          Chi tiết dữ liệu - {tabConfig[activeTab].title}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {activeTab === 'daily' && <TableHead>Ngày</TableHead>}
                              {activeTab === 'yearly' && <TableHead>Năm</TableHead>}
                              <TableHead>Nguyên liệu</TableHead>
                              {/* <TableHead>Đơn vị</TableHead> */}
                              <TableHead className="text-right">Tổng nguyên liệu</TableHead>
                              <TableHead className="text-right">Tồn đầu</TableHead>
                              <TableHead className="text-right">Nhập</TableHead>
                              <TableHead className="text-right">Số lượng bán</TableHead>
                              <TableHead className="text-right">Hao hụt</TableHead>
                              <TableHead className="text-right">Tồn cuối</TableHead>
                              {activeTab === 'revenue' && <TableHead className="text-right">Doanh thu</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody className='border rounded'>
                            {filteredData.map((item: any, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                {activeTab === 'daily' && (
                                  <TableCell>
                                    {format(new Date(item.ngay), 'dd/MM/yyyy')}
                                  </TableCell>
                                )}
                                {activeTab === 'yearly' && (
                                  <TableCell>{item.nam}</TableCell>
                                )}
                                <TableCell className="font-medium">
                                  {getIngredientName(item.maNguyenLieu)}
                                </TableCell>
                                {/* <TableCell>{item.donViTinh}</TableCell> */}
                                <TableCell className="text-left">
                                  {formatQuantity(item.tongSoLuongTon || item.tongSoLuongTon, item.donViTinh)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatQuantity(item.soLuongBanDau || item.tongSoLuongBanDau, item.donViTinh)}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {formatQuantity(item.tongSoLuongNhap, item.donViTinh)}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                  {formatQuantity(item.tongSoLuongBan, item.donViTinh)}
                                </TableCell>
                                <TableCell className="text-right text-amber-600">
                                  {formatQuantity(item.tongSoLuongHaoHut, item.donViTinh)}
                                </TableCell>
                                <TableCell className={`text-right ${item.soLuongTon < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                  {formatQuantity(item.soLuongTon, item.donViTinh)}
                                </TableCell>
                                {activeTab === 'revenue' && (
                                  <TableCell className="text-right text-purple-600">
                                    {(item.tongDoanhThu || 0).toLocaleString()} VNĐ
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </CardContent>
    </Card>
  );
};
