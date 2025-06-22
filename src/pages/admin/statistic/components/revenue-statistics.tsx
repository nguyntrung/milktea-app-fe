import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar as CalendarIcon, DollarSign, BarChart2 } from 'lucide-react';
import { getData } from '@/lib/api';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

// Interface cho dữ liệu doanh thu
interface RevenueData {
  thang?: number;
  ngay?: number;
  nam: number;
  doanhThu?: number;
  tongDoanhThu?: number;
  tongSanPhamBanDuoc: number;
}

export default function RevenueStatistics() {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Data states
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [dailyData, setDailyData] = useState<RevenueData | null>(null);
  const [yearlyData, setYearlyData] = useState<RevenueData[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          case 'monthly': {
            const response = await getData(`/api/statistic-ingredients/revenue/monthinyear?month=${month}&year=${year}`);
            if (response.success) {
              setMonthlyData(response.data || []);
            }
            break;
          }
            
          case 'daily': {
            const response = await getData(`/api/statistic-ingredients/revenue/daily?day=${day}&month=${month}&year=${year}`);
            if (response.success) {
              setDailyData(response.data || null);
            }
            break;
          }
            
          case 'yearly': {
            // Giả sử API năm lấy dữ liệu 3 năm gần nhất
            const response = await getData(`/api/statistic-ingredients/revenue/monthinyear?month=1&year=${year}`);
            if (response.success) {
              // Nhóm theo năm (đây là mock, cần thay bằng API thực tế)
              const yearlyMock = [
                { nam: year - 2, doanhThu: 15000000, tongSanPhamBanDuoc: 120 },
                { nam: year - 1, doanhThu: 25000000, tongSanPhamBanDuoc: 180 },
                { nam: year, doanhThu: 30000000, tongSanPhamBanDuoc: 220 }
              ];
              setYearlyData(yearlyMock);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê doanh thu:", error);
        setError("Không thể tải dữ liệu thống kê doanh thu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [activeTab, selectedDate]);

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'monthly':
        return monthlyData;
      case 'daily':
        return dailyData ? [dailyData] : [];
      case 'yearly':
        return yearlyData;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Prepare chart data
  const chartData = currentData.map((item: RevenueData) => ({
    name: activeTab === 'daily' 
      ? `Ngày ${item.ngay}/${item.thang}/${item.nam}`
      : activeTab === 'monthly'
        ? `Tháng ${item.thang}/${item.nam}`
        : `Năm ${item.nam}`,
    'Doanh thu': item.doanhThu || item.tongDoanhThu || 0,
    'Sản phẩm bán': item.tongSanPhamBanDuoc || 0
  }));

  const tabConfig = {
    daily: { title: 'Theo ngày', icon: CalendarIcon, description: 'Thống kê doanh thu chi tiết theo ngày' },
    monthly: { title: 'Theo tháng', icon: BarChart2, description: 'Thống kê doanh thu theo các tháng trong năm' },
    yearly: { title: 'Theo năm', icon: TrendingUp, description: 'Xu hướng doanh thu qua các năm' },
  };

  // Stat Card component
  const StatCard = ({ 
    title, 
    value, 
    secondaryValue,
    icon: Icon, 
    color = "blue" 
  }: {
    title: string;
    value: string;
    secondaryValue?: string;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Card className={`border-l-4 border-${color}-500`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {value}
            </h3>
            {secondaryValue && (
              <p className="text-sm text-muted-foreground mt-1">{secondaryValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/50`}>
            <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Calculate totals
  const totalRevenue = currentData.reduce((sum, item) => sum + (item.doanhThu || item.tongDoanhThu || 0), 0);
  const totalProducts = currentData.reduce((sum, item) => sum + (item.tongSanPhamBanDuoc || 0), 0);

  // Date range labels
  const getDateRangeLabel = () => {
    switch (activeTab) {
      case 'daily':
        return format(selectedDate, 'dd/MM/yyyy');
      case 'monthly':
        return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
      case 'yearly':
        return `Năm ${selectedDate.getFullYear()}`;
      default:
        return '';
    }
  };

  return (
    <Card className='bg-background rounded-lg shadow-md mb-3'>
      <CardHeader className="mt-4">
        <CardTitle>Thống kê doanh thu</CardTitle>
        <CardDescription className="flex justify-between">
          {tabConfig[activeTab].description} - {getDateRangeLabel()}
          <div className="flex flex-col w-full md:w-auto gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full md:w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
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
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'monthly' | 'yearly')}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(tabConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {config.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  {error}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(totalRevenue)}
                    icon={DollarSign}
                    color="purple"
                  />
                  <StatCard
                    title="Sản phẩm đã bán"
                    value={totalProducts.toString()}
                    secondaryValue={`${activeTab === 'daily' ? 'hôm nay' : activeTab === 'monthly' ? 'tháng này' : 'năm nay'}`}
                    icon={BarChart2}
                    color="green"
                  />
                  <StatCard
                    title="Doanh thu trung bình"
                    value={formatCurrency(currentData.length > 0 ? totalRevenue / currentData.length : 0)}
                    secondaryValue={`mỗi ${activeTab === 'daily' ? 'ngày' : activeTab === 'monthly' ? 'tháng' : 'năm'}`}
                    icon={TrendingUp}
                    color="blue"
                  />
                </div>

                {currentData.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Không có dữ liệu thống kê cho khoảng thời gian này
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Bar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='mt-4'>Biểu đồ doanh thu</CardTitle>
                          <CardDescription>
                            Tổng quan doanh thu {activeTab === 'daily' ? 'theo giờ' : activeTab === 'monthly' ? 'theo ngày' : 'theo tháng'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45} 
                                  textAnchor="end" 
                                  height={60} 
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                  yAxisId="left" 
                                  orientation="left" 
                                  tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                                />
                                <YAxis 
                                  yAxisId="right" 
                                  orientation="right" 
                                  dataKey="Sản phẩm bán"
                                />
                                <Tooltip 
                                  formatter={(value, name) => {
                                    if (name === 'Doanh thu') {
                                      return [formatCurrency(Number(value)), name];
                                    }
                                    return [value, name];
                                  }}
                                />
                                <Legend />
                                <Bar 
                                  yAxisId="left"
                                  dataKey="Doanh thu" 
                                  fill="#8884d8" 
                                  radius={[4, 4, 0, 0]} 
                                  name="Doanh thu"
                                />
                                <Bar 
                                  yAxisId="right"
                                  dataKey="Sản phẩm bán" 
                                  fill="#82ca9d" 
                                  radius={[4, 4, 0, 0]} 
                                  name="Sản phẩm bán"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Line Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='mt-4'>Xu hướng doanh thu</CardTitle>

                          <CardDescription>
                            Diễn biến doanh thu theo thời gian
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45} 
                                  textAnchor="end" 
                                  height={60} 
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                  tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
                                />
                                <Tooltip 
                                  formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="Doanh thu" 
                                  stroke="#8884d8" 
                                  strokeWidth={2} 
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='mt-4'>Chi tiết doanh thu</CardTitle>
                        <CardDescription>
                          Bảng dữ liệu chi tiết {tabConfig[activeTab].description.toLowerCase()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {activeTab === 'daily' && <TableHead>Ngày</TableHead>}
                                {activeTab === 'monthly' && <TableHead>Tháng</TableHead>}
                                {activeTab === 'yearly' && <TableHead>Năm</TableHead>}
                                <TableHead className="text-right">Doanh thu</TableHead>
                                <TableHead className="text-right">Sản phẩm bán</TableHead>
                                <TableHead className="text-right">Đơn giá trung bình</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentData.map((item: RevenueData, index) => {
                                const revenue = item.doanhThu || item.tongDoanhThu || 0;
                                const products = item.tongSanPhamBanDuoc || 0;
                                const avgPrice = products > 0 ? revenue / products : 0;
                                
                                return (
                                  <TableRow key={index}>
                                    {activeTab === 'daily' && (
                                      <TableCell>
                                        {item.ngay ? `${item.ngay}/${item.thang}/${item.nam}` : '-'}
                                      </TableCell>
                                    )}
                                    {activeTab === 'monthly' && (
                                      <TableCell>
                                        {item.thang ? `Tháng ${item.thang}/${item.nam}` : '-'}
                                      </TableCell>
                                    )}
                                    {activeTab === 'yearly' && (
                                      <TableCell>Năm {item.nam}</TableCell>
                                    )}
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(revenue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {products.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(avgPrice)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}