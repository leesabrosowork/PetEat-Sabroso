import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardAnalyticsProps {
  data: {
    // Generic metric fields based on vet-clinic & admin dashboards – others can ignore unused ones
    totalPets?: number;
    petsByStatus?: {
      stable: number;
      checkup: number;
      critical: number;
    };
    totalMedicalRecords?: number;
    upcomingAppointments?: number;
    completedAppointments?: number;
    videoConsultations?: number;
    inventoryItems?: number;
    lowStockItems?: number;
    totalUsers?: number;
    mostSubtractedCategory?: string;
    mostSubtractedAmount?: number;
    weeklyAppointmentsByReason?: Record<string, number>;
    monthlyAppointmentsByReason?: Record<string, number>;
  };
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ data }) => {
  // Memoised chart datasets for performance
  const petsPieData = useMemo(() => {
    if (!data.petsByStatus) return [];
    return [
      { name: "Stable", value: data.petsByStatus.stable, fill: COLORS[0] },
      { name: "Checkup", value: data.petsByStatus.checkup, fill: COLORS[1] },
      { name: "Critical", value: data.petsByStatus.critical, fill: COLORS[2] },
    ];
  }, [data.petsByStatus]);

  const appointmentsBarData = useMemo(() => {
    return [
      {
        name: "Appointments",
        Upcoming: data.upcomingAppointments ?? 0,
        Completed: data.completedAppointments ?? 0,
      },
    ];
  }, [data.upcomingAppointments, data.completedAppointments]);

  const inventoryBarData = useMemo(() => {
    return [
      {
        name: "Inventory",
        Total: data.inventoryItems ?? 0,
        "Low Stock": data.lowStockItems ?? 0,
      },
    ];
  }, [data.inventoryItems, data.lowStockItems]);

  const summaryBarData = useMemo(() => {
    const items: Record<string, number | undefined> = {
      Users: data.totalUsers,
      Pets: data.totalPets,
      Inventory: data.inventoryItems,
      "Video Consults": data.videoConsultations,
    };
    const filtered = Object.entries(items)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => ({ name: k, value: v as number }));
    return filtered;
  }, [data.totalUsers, data.totalPets, data.inventoryItems, data.videoConsultations]);

  const showSummary = summaryBarData.length >= 2; // Only if we have at least two metrics

  // Weekly/monthly appointments by reason
  const weeklyReasonData = useMemo(() => {
    if (!data.weeklyAppointmentsByReason) return [];
    return Object.entries(data.weeklyAppointmentsByReason).map(([reason, count]) => ({ reason, count }));
  }, [data.weeklyAppointmentsByReason]);
  const monthlyReasonData = useMemo(() => {
    if (!data.monthlyAppointmentsByReason) return [];
    return Object.entries(data.monthlyAppointmentsByReason).map(([reason, count]) => ({ reason, count }));
  }, [data.monthlyAppointmentsByReason]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Pets health status */}
      {petsPieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pet Health Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={petsPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={4}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  isAnimationActive
                >
                  {petsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Appointments overview */}
      {(data.upcomingAppointments !== undefined || data.completedAppointments !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsBarData} barCategoryGap={30}>
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Upcoming" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Inventory overview */}
      {(data.inventoryItems !== undefined || data.lowStockItems !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryBarData} barCategoryGap={30}>
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Low Stock" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Most subtracted category info */}
            {data.mostSubtractedCategory && (
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-center">
                <div className="font-semibold">Most Subtracted Category</div>
                <div className="text-lg font-bold">{data.mostSubtractedCategory}</div>
                <div className="text-sm">Total subtracted: <span className="font-mono">{data.mostSubtractedAmount}</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generic summary chart for other totals (e.g., admin dashboard) */}
      {showSummary && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryBarData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" isAnimationActive radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly appointments by reason */}
      {weeklyReasonData.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Weekly Appointments by Reason</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyReasonData}>
                <XAxis dataKey="reason" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" isAnimationActive radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly appointments by reason */}
      {monthlyReasonData.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Appointments by Reason</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReasonData}>
                <XAxis dataKey="reason" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" isAnimationActive radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardAnalytics; 