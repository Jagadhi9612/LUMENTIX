import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, TrendingUp, Calendar } from 'lucide-react';

interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  attendanceToday: number;
  expiringSoon: number;
  attendanceTrend: Array<{ date: string; count: number }>;
  revenueByPackage: Array<{ name: string; value: number }>;
}

function formatThousands(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return `₹${(amount / 1000).toFixed(0)}K`;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/v1/dashboard?range=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (!metrics) {
    return <div className="p-8">Failed to load dashboard data</div>;
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Date Range Filter */}
        <div className="mb-8 flex gap-4">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded capitalize ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Total Members"
            value={metrics.totalMembers}
            subtitle={`${metrics.activeMembers} active`}
            color="blue"
          />
          <MetricCard
            icon={<CreditCard className="w-6 h-6" />}
            title="Total Revenue"
            value={`₹${(metrics.totalRevenue / 100000).toFixed(1)}L`}
            subtitle={`₹${(metrics.monthlyRevenue / 100000).toFixed(1)}L this month`}
            color="green"
          />
          <MetricCard
            icon={<Calendar className="w-6 h-6" />}
            title="Attendance Today"
            value={metrics.attendanceToday}
            subtitle={`${Math.round((metrics.attendanceToday / metrics.activeMembers) * 100)}% occupancy`}
            color="purple"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Expiring Soon"
            value={metrics.expiringSoon}
            subtitle="Next 30 days"
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Attendance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Members Attended"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Package */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Revenue by Package</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.revenueByPackage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatThousands(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.revenueByPackage.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatThousands(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="New Member"
            description="Add a new member to the system"
            href="/members/new"
          />
          <QuickActionCard
            title="Process Payment"
            description="Record a member payment"
            href="/payments/new"
          />
          <QuickActionCard
            title="View Reports"
            description="Generate detailed reports"
            href="/reports"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function MetricCard({ icon, title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
}

function QuickActionCard({ title, description, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      <div className="mt-4 text-blue-600 text-sm font-medium">Get started →</div>
    </a>
  );
}
