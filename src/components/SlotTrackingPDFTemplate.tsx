import { forwardRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  EyeOff,
  Frown,
  UserX,
  CalendarDays,
  ClipboardList,
  Minus,
} from "lucide-react";

interface DateAggregatedRow {
  date: string;
  formattedDate: string;
  finalTotalDone: number;
  finalTotalPass: number;
  finalTotalFail: number;
  finalTotalReschedule: number;
  finalTotalNoShow: number;
  finalTotalDisinterested: number;
  finalTotalNotEligible: number;
  finalTotalSlots: number;
  finalTotalEmpty: number;
}

interface SlotTrackingPDFTemplateProps {
  periodTitle: string;
  periodSubtitle: string;
  generatedDate: string;
  grandTotalRow: DateAggregatedRow;
  lrTotalRow: DateAggregatedRow;
  crfTotalRow: DateAggregatedRow;
  trendData: Array<{ date: string; LR: number; CFR: number }>;
  pieData: Array<{ name: string; value: number; color: string }>;
  interviewerName?: string;
  showCharts?: boolean; // New prop to control charts visibility
}

const SlotTrackingPDFTemplate = forwardRef<HTMLDivElement, SlotTrackingPDFTemplateProps>(
  (
    {
      periodTitle,
      periodSubtitle,
      generatedDate,
      grandTotalRow,
      lrTotalRow,
      crfTotalRow,
      trendData,
      pieData,
      interviewerName,
      showCharts = true, // Default to true
    },
    ref
  ) => {
    // Calculate percentage for each result
    const totalInterviews = grandTotalRow.finalTotalSlots;
    const calculatePercentage = (value: number) => {
      if (totalInterviews === 0) return 0;
      return Math.round((value / totalInterviews) * 100);
    };

    return (
      <div
        ref={ref}
        className="bg-white w-[794px] mx-auto"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "794px", // A4 width in pixels at 96 DPI
          minHeight: "1123px", // A4 height in pixels at 96 DPI
          maxHeight: "1123px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pb-2.5 border-b-2 border-gray-200 px-8 pt-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">NavGurukul</h1>
            <p className="text-[9px] text-gray-500 tracking-wide">Learn | Build | Belong</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">Admissions Report</h2>
            <p className="text-[11px] font-semibold text-gray-700">{periodTitle}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Period: {periodSubtitle}</p>
            <p className="text-[9px] text-gray-500">Generated: {generatedDate}</p>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-3 px-8">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">Overview</h3>
          <p className="text-[9px] text-gray-600 mb-1.5">
            Summary of interview slots for {interviewerName ? interviewerName : "all interviewers"}
          </p>

          {/* First Row - 4 columns */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {/* Total Slots */}
            <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Total Slots</span>
                <Calendar className="w-3 h-3 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-600">
                {grandTotalRow.finalTotalSlots}
              </div>
            </div>

            {/* Interviews Done */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Interviews Done</span>
                <Users className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-600">
                {grandTotalRow.finalTotalDone}
              </div>
            </div>

            {/* Pass */}
            <div className="bg-green-50 border border-green-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Pass</span>
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              </div>
              <div className="text-lg font-bold text-green-600">
                {grandTotalRow.finalTotalPass}
              </div>
            </div>

            {/* Fail */}
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Fail</span>
                <XCircle className="w-3 h-3 text-red-600" />
              </div>
              <div className="text-lg font-bold text-red-600">
                {grandTotalRow.finalTotalFail}
              </div>
            </div>
          </div>

          {/* Second Row - 4 columns */}
          <div className="grid grid-cols-4 gap-2">
            {/* Reschedule */}
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Reschedule</span>
                <RotateCcw className="w-3 h-3 text-orange-600" />
              </div>
              <div className="text-lg font-bold text-orange-600">
                {grandTotalRow.finalTotalReschedule}
              </div>
            </div>

            {/* No Show */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">No Show</span>
                <EyeOff className="w-3 h-3 text-gray-600" />
              </div>
              <div className="text-lg font-bold text-gray-600">
                {grandTotalRow.finalTotalNoShow}
              </div>
            </div>

            {/* Disinterested */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Disinterested</span>
                <Frown className="w-3 h-3 text-yellow-600" />
              </div>
              <div className="text-lg font-bold text-yellow-600">
                {grandTotalRow.finalTotalDisinterested}
              </div>
            </div>

            {/* Not Eligible */}
            <div className="bg-pink-50 border border-pink-200 rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-semibold text-gray-700">Not Eligible</span>
                <UserX className="w-3 h-3 text-pink-600" />
              </div>
              <div className="text-lg font-bold text-pink-600">
                {grandTotalRow.finalTotalNotEligible}
              </div>
            </div>
          </div>

          {/* Third Row - Empty Slots centered */}
          <div className="flex justify-center mt-2">
            <div className="w-[24%]">
              <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-semibold text-gray-700">Empty Slots</span>
                  <CalendarDays className="w-3 h-3 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {grandTotalRow.finalTotalEmpty}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance by Round */}
        <div className="mb-3 px-8">
          <h3 className="text-sm font-bold text-gray-900 mb-1.5">Performance by Round</h3>
          <div className="bg-gray-50 rounded-md overflow-hidden">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="text-left py-1 px-2 font-bold text-gray-700">Round</th>
                  <th className="text-center py-1 px-1 font-bold text-purple-700">Total Slots</th>
                  <th className="text-center py-1 px-1 font-bold text-blue-700">Interviews Done</th>
                  <th className="text-center py-1 px-1 font-bold text-green-700">Pass</th>
                  <th className="text-center py-1 px-1 font-bold text-red-700">Fail</th>
                  <th className="text-center py-1 px-1 font-bold text-orange-700">Reschedule</th>
                  <th className="text-center py-1 px-1 font-bold text-gray-700">No Show</th>
                  <th className="text-center py-1 px-1 font-bold text-yellow-700">Disinterested</th>
                  <th className="text-center py-1 px-1 font-bold text-pink-700">Not Eligible</th>
                  <th className="text-center py-1 px-1 font-bold text-purple-700">Empty Slots</th>
                </tr>
              </thead>
              <tbody>
                {/* LR Row */}
                <tr className="border-b border-gray-200">
                  <td className="py-1 px-2 font-bold text-gray-900">LR</td>
                  <td className="text-center py-1 px-1 font-semibold text-purple-700">
                    {lrTotalRow.finalTotalSlots}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-blue-700">
                    {lrTotalRow.finalTotalDone}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-green-700">
                    {lrTotalRow.finalTotalPass}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-red-700">
                    {lrTotalRow.finalTotalFail}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-orange-700">
                    {lrTotalRow.finalTotalReschedule}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-gray-700">
                    {lrTotalRow.finalTotalNoShow}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-yellow-700">
                    {lrTotalRow.finalTotalDisinterested}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-pink-700">
                    {lrTotalRow.finalTotalNotEligible}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-purple-700">
                    {lrTotalRow.finalTotalEmpty}
                  </td>
                </tr>

                {/* CFR Row */}
                <tr className="border-b border-gray-200">
                  <td className="py-1 px-2 font-bold text-gray-900">CFR</td>
                  <td className="text-center py-1 px-1 font-semibold text-purple-700">
                    {crfTotalRow.finalTotalSlots}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-blue-700">
                    {crfTotalRow.finalTotalDone}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-green-700">
                    {crfTotalRow.finalTotalPass}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-red-700">
                    {crfTotalRow.finalTotalFail}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-orange-700">
                    {crfTotalRow.finalTotalReschedule}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-gray-700">
                    {crfTotalRow.finalTotalNoShow}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-yellow-700">
                    {crfTotalRow.finalTotalDisinterested}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-pink-700">
                    {crfTotalRow.finalTotalNotEligible}
                  </td>
                  <td className="text-center py-1 px-1 font-semibold text-purple-700">
                    {crfTotalRow.finalTotalEmpty}
                  </td>
                </tr>

                {/* Total Row */}
                <tr className="bg-gray-100 border-t border-gray-400">
                  <td className="py-1 px-2 font-bold text-gray-900">Total</td>
                  <td className="text-center py-1 px-1 font-bold text-purple-700">
                    {grandTotalRow.finalTotalSlots}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-blue-700">
                    {grandTotalRow.finalTotalDone}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-green-700">
                    {grandTotalRow.finalTotalPass}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-red-700">
                    {grandTotalRow.finalTotalFail}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-orange-700">
                    {grandTotalRow.finalTotalReschedule}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-gray-700">
                    {grandTotalRow.finalTotalNoShow}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-yellow-700">
                    {grandTotalRow.finalTotalDisinterested}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-pink-700">
                    {grandTotalRow.finalTotalNotEligible}
                  </td>
                  <td className="text-center py-1 px-1 font-bold text-purple-700">
                    {grandTotalRow.finalTotalEmpty}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section - Stacked (only show if showCharts is true) */}
        {showCharts && (
          <div className="space-y-2.5 px-8 mb-3">
          {/* Daily Interviews Trend - Full Width */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-1">
              Daily Interviews Trend
              {trendData.length > 0 && (
                <span className="text-[8px] font-normal text-gray-500 ml-1.5">
                  ({trendData[0]?.date} – {trendData[trendData.length - 1]?.date})
                </span>
              )}
            </h3>
            <div className="bg-gray-50 rounded-md p-2 h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#6B7280" }}
                    axisLine={{ stroke: "#D1D5DB" }}
                    tickLine={{ stroke: "#D1D5DB" }}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#6B7280" }}
                    axisLine={{ stroke: "#D1D5DB" }}
                    tickLine={{ stroke: "#D1D5DB" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "6px",
                      fontSize: "10px",
                      border: "1px solid #E5E7EB",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px" }}
                    align="right"
                    verticalAlign="top"
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="LR"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3B82F6" }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="CFR"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#22C55E" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Result Distribution - Full Width */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-1">Result Distribution</h3>
            <div className="bg-gray-50 rounded-md p-2 h-[170px] flex items-center justify-center gap-4">
              {/* Pie Chart */}
              <div className="w-[160px] h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "6px",
                        fontSize: "9px",
                        border: "1px solid #E5E7EB",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with center text */}
              <div className="flex-1">
                <div className="text-center mb-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {grandTotalRow.finalTotalSlots}
                  </div>
                  <div className="text-[9px] text-gray-600 font-medium">Slots</div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[8px]">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-1.5 h-1.5 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900 ml-1">
                        {item.value} ({calculatePercentage(item.value)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-gray-200 px-8 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 mb-0.5">Note</p>
                <p className="text-[10px] text-gray-700 max-w-md leading-relaxed">
                  This report shows the interview slots and outcomes for{" "}
                  {interviewerName ? interviewerName : "all interviewers"}.
                  Data is for the selected period: {periodSubtitle}.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900 mb-0.5">NavGurukul</p>
              <p className="text-[10px] text-gray-600">Creating Opportunities Together</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SlotTrackingPDFTemplate.displayName = "SlotTrackingPDFTemplate";

export default SlotTrackingPDFTemplate;
