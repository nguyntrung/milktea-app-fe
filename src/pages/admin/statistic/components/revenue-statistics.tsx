import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar as CalendarIcon, DollarSign, Search, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { getData } from '@/lib/api';
import { format } from 'date-fns';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Interface cho dữ liệu doanh thu
interface RevenueData {
  tongDoanhThu: number;
  ngay?: number;
  thang?: number;
  nam: number;
}

export default function RevenueStatistics() {
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'yearly'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Data states
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [dailyData, setDailyData] = useState<RevenueData[]>([]);
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
          case 'month':
            const monthResponse = await getData(`/api/statistic-ingredients/revenue/month?month=${month}&year=${year}`);
            if (monthResponse.success) {
              // Nếu API trả về một object đơn lẻ, chuyển thành mảng để dễ xử lý
              const data = Array.isArray(monthResponse.data) 
                ? monthResponse.data 
                : [monthResponse.data];
              setMonthlyData(data);
            }
            break;
            
          case 'daily':
            const dailyResponse = await getData(`/api/statistic-ingredients/revenue/daily?day=${day}&month=${month}&year=${year}`);
            if (dailyResponse.success) {
              const data = Array.isArray(dailyResponse.data) 
                ? dailyResponse.data 
                : [dailyResponse.data];
              setDailyData(data);
            }
            break;
            
          case 'yearly':
            const yearlyResponse = await getData(`/api/statistic-ingredients/revenue/yearly?year=${year}`);
            if (yearlyResponse.success) {
              const data = Array.isArray(yearlyResponse.data) 
                ? yearlyResponse.data 
                : [yearlyResponse.data];
              setYearlyData(data);
            }
            break;
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Prepare chart data
  const chartData = currentData.map((item: RevenueData) => ({
    name: activeTab === 'daily' 
      ? `Ngày ${item.ngay}/${item.thang}/${item.nam}`
      : activeTab === 'month'
        ? `Tháng ${item.thang}/${item.nam}`
        : `Năm ${item.nam}`,
    'Doanh thu': item.tongDoanhThu || 0,
  }));

  const tabConfig = {
    daily: { title: 'Thống kê theo ngày', icon: CalendarIcon },
    month: { title: 'Thống kê theo tháng', icon: BarChart3 },
    yearly: { title: 'Thống kê theo năm', icon: TrendingUp },
  };

  // Stat Card component using Card component
  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <Card className={`border-l-4 border-${color}-500 hover:shadow-xl transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-2xl mt-1">
              {value}
            </CardTitle>
          </div>
          <div className={`p-3 bg-${color}-100 rounded-lg`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Calculate total revenue
  const totalRevenue = currentData.reduce((sum, item) => sum + (item.tongDoanhThu || 0), 0);

  return (
    <Card className='bg-background rounded-lg shadow-md mb-3'>
      <CardHeader className="mt-4">
        <CardTitle>Thống kê doanh thu</CardTitle>
        <CardDescription className="flex justify-between">
          Quản lý và theo dõi doanh thu của cửa hàng
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
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
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">{error}</div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                      title="Tổng doanh thu"
                      value={formatCurrency(totalRevenue)}
                      icon={DollarSign}
                      color="purple"
                    />
                  </div>

                  {currentData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu thống kê doanh thu cho khoảng thời gian này
                    </div>
                  ) : (
                    <>
                      {/* Charts */}
                      <div className="flex flex-col gap-4 mb-8">
                        {/* Bar Chart */}
                        <Card>
                          <CardHeader className='mt-4'>
                            <CardTitle className='text-center'>Biểu đồ doanh thu</CardTitle>
                          </CardHeader>
                          <CardContent className="bg-gray-50 rounded-xl p-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Doanh thu']} />
                                <Legend />
                                <Bar dataKey="Doanh thu" fill="#8884d8" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Line Chart */}
                        <Card>
                          <CardHeader className='mt-4'>
                            <CardTitle className='text-center'>Xu hướng doanh thu</CardTitle>
                          </CardHeader>
                          <CardContent className="bg-gray-50 rounded-xl p-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Doanh thu']} />
                                <Legend />
                                <Line type="monotone" dataKey="Doanh thu" stroke="#8884d8" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Data Table */}
                      <div>
                        <div className='font-medium text-center mb-2'>
                          Chi tiết doanh thu - {tabConfig[activeTab].title}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {activeTab === 'daily' && <TableHead>Ngày</TableHead>}
                              {activeTab === 'month' && <TableHead>Tháng</TableHead>}
                              {activeTab === 'yearly' && <TableHead>Năm</TableHead>}
                              <TableHead className="text-right">Doanh thu</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className='border rounded'>
                            {currentData.map((item: RevenueData, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                {activeTab === 'daily' && (
                                  <TableCell>
                                    {`${item.ngay}/${item.thang}/${item.nam}`}
                                  </TableCell>
                                )}
                                {activeTab === 'month' && (
                                  <TableCell>
                                    {`${item.thang}/${item.nam}`}
                                  </TableCell>
                                )}
                                {activeTab === 'yearly' && (
                                  <TableCell>{item.nam}</TableCell>
                                )}
                                <TableCell className="text-right text-purple-600">
                                  {formatCurrency(item.tongDoanhThu || 0)}
                                </TableCell>
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
}