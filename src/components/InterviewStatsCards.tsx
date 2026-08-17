import React, { useEffect, useState } from "react";
import { getSlotScheduleStats, SlotScheduleStatsResponse } from "@/utils/api";
import { Calendar, CheckCircle, User, Clock } from "lucide-react";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
  const todaysBooked = data?.slots?.today?.booked || 0;
  const todaysAvailable = data?.slots?.today?.available || 0;
  const todaysExpired = data?.slots?.today?.expired || 0;
  
  const totalScheduled = data?.schedules?.total_scheduled || 0;
  const completedInterviews = data?.schedules?.completed || 0;
  const canceledInterviews = data?.schedules?.cancelled || 0;
  const noShowInterviews = data?.schedules?.no_show || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
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
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Booked: <span className="font-bold">{bookedSlots.toLocaleString()}</span>
            </span>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Available: <span className="font-bold">{availableSlots.toLocaleString()}</span>
            </span>
            <span className="bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Expired: <span className="font-bold">{expiredSlots.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-white border border-violet-200 rounded-2xl p-3 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center space-x-2 mb-2">
          <div className="p-1.5 bg-violet-100 rounded-md">
            <Clock className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Today</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{todaysSlots.toLocaleString()}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Booked: <span className="font-bold">{todaysBooked.toLocaleString()}</span>
            </span>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Available: <span className="font-bold">{todaysAvailable.toLocaleString()}</span>
            </span>
            <span className="bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Expired: <span className="font-bold">{todaysExpired.toLocaleString()}</span>
            </span>
          </div>
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
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Completed: <span className="font-bold">{completedInterviews}</span>
            </span>
            <span className="bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Cancelled: <span className="font-bold">{canceledInterviews}</span>
            </span>
            <span className="bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
              No Show: <span className="font-bold">{noShowInterviews}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
