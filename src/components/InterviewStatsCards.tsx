import React, { useEffect, useState } from "react";
import { getSlotScheduleStats, SlotScheduleStatsResponse } from "@/utils/api";
import { Calendar, CheckCircle, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const InterviewStatsCards = () => {
  const [data, setData] = useState<SlotScheduleStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getSlotScheduleStats();
      if (response && response.data) {
        setData(response.data);
      } else {
        setData(response);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-28 rounded-xl bg-gray-100" />
        <Skeleton className="h-28 rounded-xl bg-gray-100" />
        <Skeleton className="h-28 rounded-xl bg-gray-100" />
        <Skeleton className="h-28 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  const totalSlots = data?.slots?.all_time?.total || 0;
  const availableSlots = data?.slots?.all_time?.available || 0;
  const bookedSlots = data?.slots?.all_time?.booked || 0;
  const expiredSlots = data?.slots?.all_time?.expired || 0;
  
  const todaysSlots = data?.slots?.today?.total || 0;
  const totalScheduled = data?.schedules?.total_scheduled || 0;
  const completedInterviews = data?.schedules?.completed || 0;
  const canceledInterviews = data?.schedules?.cancelled || 0;
  const noShowInterviews = data?.schedules?.no_show || 0;
  
  const availableSlotsPercentage = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0;
  const bookedSlotsPercentage = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      {/* Total Slots */}
      <div className="bg-white border border-blue-200 rounded-2xl p-3 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center space-x-2 mb-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Total Slots</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{totalSlots.toLocaleString()}</h3>
          <div className="text-[10px] xl:text-xs text-gray-400 flex flex-wrap items-center gap-x-2 mt-1">
            <span>Expired: <span className="text-gray-600 font-medium">{expiredSlots.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Available Slots */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center space-x-2 mb-2">
          <div className="p-1.5 bg-emerald-100 rounded-md">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Available</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{availableSlots.toLocaleString()}</h3>
        </div>
      </div>

      {/* Booked Slots */}
      <div className="bg-white border border-violet-200 rounded-2xl p-3 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center space-x-2 mb-2">
          <div className="p-1.5 bg-violet-100 rounded-md">
            <User className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Booked</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{bookedSlots.toLocaleString()}</h3>
        </div>
      </div>

      {/* Scheduled Interviews */}
      <div className="bg-white border border-amber-200 rounded-2xl p-3 relative overflow-hidden group shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center space-x-2 mb-2">
          <div className="p-1.5 bg-amber-100 rounded-md">
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Scheduled Interviews</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{totalScheduled.toLocaleString()}</h3>
          <div className="text-[10px] xl:text-xs text-gray-400 flex flex-wrap items-center gap-x-2 mt-1">
            <span>Completed: <span className="text-gray-600 font-medium">{completedInterviews}</span></span>
            <span>Cancelled: <span className="text-gray-600 font-medium">{canceledInterviews}</span></span>
            <span>No Show: <span className="text-gray-600 font-medium">{noShowInterviews}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
