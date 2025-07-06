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
    appointmentsByReasonByMonth?: { [reason: string]: number[] };
    inventoryChangesByMonth?: { expired: number[], subtracted: number[], added: number[], removed: number[] };
    petsAdmittedByMonth?: number[];
    petsStatusChangesByMonth?: { [status: string]: number[] };
    mostSubtractedItem?: string;
    mostSubtractedItemAmount?: number;
    topSubtractedItems?: { item: string; amount: number }[]; // New prop for top subtracted items
    topSubtractedItemsByMonth?: { item: string; monthly: number[] }[]; // New prop for 12-month top subtracted items
  };
  analyticsYear?: number;
  setAnalyticsYear?: (year: number) => void;
  currentYear?: number;
  showInventoryChanges?: boolean; // new prop
  showAppointmentsByReason?: boolean; // new prop
  showPetStatusChanges?: boolean; // new prop
  showPetsAdmitted?: boolean; // new prop, controls Pets Admitted chart
  showPetHealthStatus?: boolean; // new prop, controls Pet Health Status chart
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps & { showPetHealthStatus?: boolean }> = ({ data, analyticsYear, setAnalyticsYear, currentYear, showInventoryChanges = true, showAppointmentsByReason = true, showPetStatusChanges = true, showPetsAdmitted = true, showPetHealthStatus = true }) => {
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

  // Remove all references to weeklyReasonData and monthlyReasonData
  // The new charts are already present, so just ensure no old code remains and all tags are closed properly.
  const appointmentsByReasonByMonth = data.appointmentsByReasonByMonth || {};
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const reasonChartData = months.map((month, i) => {
    const entry: any = { month };
    for (const reason in appointmentsByReasonByMonth) {
      entry[reason] = appointmentsByReasonByMonth[reason][i] || 0;
    }
    return entry;
  });
  // Inventory changes analytics
  const inventoryChangesByMonth: any = data.inventoryChangesByMonth || {};
  const inventoryChartData = months.map((month, i) => ({
    month,
    Expired: inventoryChangesByMonth.expired?.[i] || 0,
    Subtracted: inventoryChangesByMonth.subtracted?.[i] || 0,
    Added: inventoryChangesByMonth.added?.[i] || 0,
    Removed: inventoryChangesByMonth.removed?.[i] || 0,
  }));
  const petsAdmittedByMonth = data.petsAdmittedByMonth || [];
  const petsStatusChangesByMonth = data.petsStatusChangesByMonth || {};
  const petsAdmittedChartData = months.map((month, i) => ({
    month,
    Admitted: petsAdmittedByMonth[i] || 0
  }));
  const petsStatusChangesChartData = months.map((month, i) => {
    const entry: any = { month };
    for (const status of ["Critical","Stable","Improving","Recovered"]) {
      entry[status] = petsStatusChangesByMonth[status]?.[i] || 0;
    }
    return entry;
  });

  // Prepare 12-month analytics for top 5 most subtracted items
  const topSubtractedItemsByMonth = useMemo(() => {
    if (!Array.isArray(data.topSubtractedItemsByMonth)) return [];
    // Each entry: { item: string, monthly: number[] }
    return data.topSubtractedItemsByMonth.slice(0, 5).map(entry => ({
      item: entry.item,
      monthly: entry.monthly || Array(12).fill(0)
    }));
  }, [data.topSubtractedItemsByMonth]);
  const topItemsChartData = months.map((month, i) => {
    const entry: Record<string, number | string> = { month };
    topSubtractedItemsByMonth.forEach(item => {
      entry[item.item] = item.monthly[i] || 0;
    });
    return entry;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Pets health status */}
      {showPetHealthStatus && petsPieData.length > 0 && (
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
            {/* Top 5 most subtracted inventory items info at the top */}
            {Array.isArray(data.topSubtractedItems) && data.topSubtractedItems.length > 0 ? (
              <div className="mt-2 mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-900">
                <div className="font-semibold mb-1">Most Subtracted Inventory Items (Top 5):</div>
                <ol className="list-decimal ml-6">
                  {data.topSubtractedItems.map((entry, idx) => (
                    <li key={entry.item} className="mb-1">
                      <span className="font-bold">{entry.item}</span>
                      <span className="ml-2 text-sm">&gt; Total Subtracted: <span className="font-mono">{entry.amount}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : data.mostSubtractedItem && (
              <div className="mt-2 mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-900">
                <div className="font-semibold">Most Subtracted Inventory Item: <span className="font-bold">{data.mostSubtractedItem}</span></div>
                <div className="text-sm ml-2">&gt; Total Subtracted: <span className="font-mono">{data.mostSubtractedItemAmount}</span></div>
              </div>
            )}
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
            {/* Most subtracted category info (keep below chart) */}
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

      {/* Move Analytics Year selector here, below Summary and above Appointments by Reason */}
      {typeof analyticsYear === 'number' && setAnalyticsYear && currentYear && (
        <div className="flex items-center gap-4 mb-4 md:col-span-3">
          <label htmlFor="analyticsYear" className="font-medium">Analytics Year:</label>
          <input
            id="analyticsYear"
            type="number"
            min="2000"
            max={currentYear + 10}
            value={analyticsYear}
            onChange={e => setAnalyticsYear(Number(e.target.value))}
            className="border rounded px-2 py-1 w-32"
          />
        </div>
      )}

      {/* Remove the weekly/monthly by reason charts and add the new ones: */}
      {showAppointmentsByReason && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Appointments by Reason (12-Month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonChartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {Object.keys(appointmentsByReasonByMonth).map((reason, idx) => (
                  <Bar key={reason} dataKey={reason} fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {/* Inventory Changes (12-Month) - only show if showInventoryChanges is true */}
      {showInventoryChanges && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Changes (12-Month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Expired" fill="#ef4444" />
                <Bar dataKey="Subtracted" fill="#f59e0b" />
                <Bar dataKey="Added" fill="#10b981" />
                <Bar dataKey="Removed" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {showPetsAdmitted && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Pets Admitted (12-Month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={petsAdmittedChartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Admitted" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {showPetStatusChanges && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Pet Status Changes (12-Month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={petsStatusChangesChartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Critical" fill="#ef4444" />
                <Bar dataKey="Stable" fill="#10b981" />
                <Bar dataKey="Improving" fill="#f59e0b" />
                <Bar dataKey="Recovered" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {/* Top Subtracted Inventory Items (12-Month Analytics) */}
      {topSubtractedItemsByMonth.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Top 5 Subtracted Inventory Items (12-Month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsChartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {topSubtractedItemsByMonth.map((item, idx) => (
                  <Bar key={item.item} dataKey={item.item} fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardAnalytics; 