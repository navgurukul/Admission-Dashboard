import { useState, useEffect, useMemo, useRef } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, getAllUsers, getInterviewerStats } from "@/utils/api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  User,
  X,
  Users,
  Download,
  Sparkles,
  Layers,
  Filter,
  Calendar,
  FileSpreadsheet,
  Table as TableIcon,
  Camera,
  Loader2,
  FileDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InterviewerStat {
  interviewer_id: number;
  interviewer_name: string;
  date: string;
  slot_type: string;
  total_slots: number;
  empty_slots: number;
  interview_done: number;
  pass: number;
  fail: number;
  reschedule: number;
  no_show: number;
  disinterested: number;
  not_eligible: number;
}

interface UserOption {
  id: number;
  name: string;
}

type TimePeriodMode = "daily" | "weekly" | "monthly" | "all_time" | "custom";

interface DateAggregatedRow {
  date: string;
  formattedDate: string;
  finalTotalDone: number;
  finalTotalPass: number;
  finalTotalFail: number;
  finalTotalReschedule: number;
  finalTotalNoShow: number;
  finalTotalDisinterested: number;
  finalTotalSlots: number;
  finalTotalEmpty: number;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => formatDateISO(new Date());

const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateISO(d);
};

const getThisWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDateISO(monday), end: formatDateISO(sunday) };
};

const getLast7DaysRange = (): { start: string; end: string } => {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 6);
  return { start: formatDateISO(past), end: formatDateISO(now) };
};

const getLastWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day + 6) % 7;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - diffToMon - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return { start: formatDateISO(lastMonday), end: formatDateISO(lastSunday) };
};

const getThisMonthRange = (): { start: string; end: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateISO(firstDay), end: formatDateISO(lastDay) };
};

const getLastMonthRange = (): { start: string; end: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: formatDateISO(firstDay), end: formatDateISO(lastDay) };
};

const formatSheetDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "all") return "All Dates";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "all") return "All Dates";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Helper to identify slot type
const isLRType = (type?: string): boolean => {
  if (!type) return false;
  const t = type.trim().toUpperCase();
  return t === "LR" || t.includes("LEARNING");
};

const isCRFType = (type?: string): boolean => {
  if (!type) return false;
  const t = type.trim().toUpperCase();
  return t === "CRF" || t === "CFR" || t.includes("CULTURE") || t.includes("CULTURAL");
};

// Aggregate records by Date
const aggregateByDate = (items: InterviewerStat[]): DateAggregatedRow[] => {
  const map = new Map<string, DateAggregatedRow>();

  items.forEach((item) => {
    const d = item.date || "Unknown";
    const existing = map.get(d) || {
      date: d,
      formattedDate: formatSheetDate(d),
      finalTotalDone: 0,
      finalTotalPass: 0,
      finalTotalFail: 0,
      finalTotalReschedule: 0,
      finalTotalNoShow: 0,
      finalTotalDisinterested: 0,
      finalTotalSlots: 0,
      finalTotalEmpty: 0,
    };

    existing.finalTotalDone += item.interview_done || 0;
    existing.finalTotalPass += item.pass || 0;
    existing.finalTotalFail += item.fail || 0;
    existing.finalTotalReschedule += item.reschedule || 0;
    existing.finalTotalNoShow += item.no_show || 0;
    existing.finalTotalDisinterested += item.disinterested || 0;
    existing.finalTotalSlots += item.total_slots || 0;
    existing.finalTotalEmpty += item.empty_slots || 0;

    map.set(d, existing);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const calculateGroupTotal = (rows: DateAggregatedRow[]): DateAggregatedRow => {
  return rows.reduce(
    (acc, r) => ({
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: acc.finalTotalDone + r.finalTotalDone,
      finalTotalPass: acc.finalTotalPass + r.finalTotalPass,
      finalTotalFail: acc.finalTotalFail + r.finalTotalFail,
      finalTotalReschedule: acc.finalTotalReschedule + r.finalTotalReschedule,
      finalTotalNoShow: acc.finalTotalNoShow + r.finalTotalNoShow,
      finalTotalDisinterested: acc.finalTotalDisinterested + r.finalTotalDisinterested,
      finalTotalSlots: acc.finalTotalSlots + r.finalTotalSlots,
      finalTotalEmpty: acc.finalTotalEmpty + r.finalTotalEmpty,
    }),
    {
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: 0,
      finalTotalPass: 0,
      finalTotalFail: 0,
      finalTotalReschedule: 0,
      finalTotalNoShow: 0,
      finalTotalDisinterested: 0,
      finalTotalSlots: 0,
      finalTotalEmpty: 0,
    }
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SlotTracking = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const userRole = Number(currentUser?.user_role_id);
  const isAdmin = userRole === 1 || userRole === 3;

  // View scope: "all" for all interviewers (admin only) or "my"
  const [viewScope, setViewScope] = useState<"my" | "all">(isAdmin ? "all" : "my");

  // Display mode: "sheet" (Exact Google Sheet style format) vs "detailed"
  const [displayMode, setDisplayMode] = useState<"sheet" | "detailed">("sheet");

  // Time period mode: daily | weekly | monthly | all_time | custom
  const [timeMode, setTimeMode] = useState<TimePeriodMode>("daily");

  // Date states
  const [dailyDate, setDailyDate] = useState<string>(getTodayDate());

  const [weeklyPreset, setWeeklyPreset] = useState<"this_week" | "last_7_days" | "last_week">("this_week");
  const [weekRange, setWeekRange] = useState<{ start: string; end: string }>(getThisWeekRange());

  const [monthlyPreset, setMonthlyPreset] = useState<"this_month" | "last_month">("this_month");
  const [monthRange, setMonthRange] = useState<{ start: string; end: string }>(getThisMonthRange());

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: getTodayDate(),
    end: getTodayDate(),
  });

  // Filter by specific interviewer (when viewScope === "all")
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");

  // Search filter for detailed table
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Users list for dropdown
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  // Stats data
  const [stats, setStats] = useState<InterviewerStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Screenshot & PDF ref and states
  const sheetRef = useRef<HTMLDivElement>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  // ── Compute current start_date and end_date for API request ──────────────

  const getActiveApiParams = (): {
    start_date: string;
    end_date?: string;
    interviewer_id?: string;
  } => {
    let start_date = "";
    let end_date: string | undefined = undefined;

    switch (timeMode) {
      case "daily":
        start_date = dailyDate || getTodayDate();
        end_date = dailyDate || getTodayDate();
        break;

      case "weekly":
        start_date = weekRange.start;
        end_date = weekRange.end;
        break;

      case "monthly":
        start_date = monthRange.start;
        end_date = monthRange.end;
        break;

      case "all_time":
        start_date = "all";
        end_date = undefined;
        break;

      case "custom":
        start_date = customRange.start;
        end_date = customRange.end;
        break;
    }

    const params: {
      start_date: string;
      end_date?: string;
      interviewer_id?: string;
    } = { start_date };

    if (end_date && start_date !== "all") {
      params.end_date = end_date;
    }

    if (viewScope === "my") {
      if (currentUserId) {
        params.interviewer_id = String(currentUserId);
      }
    } else if (viewScope === "all") {
      if (selectedInterviewerId.trim() && selectedInterviewerId !== "all") {
        params.interviewer_id = selectedInterviewerId.trim();
      }
    }

    return params;
  };

  // ── Fetch Stats ──────────────────────────────────────────────────────────

  const fetchStats = async () => {
    if (viewScope === "my" && !currentUserId) {
      toast({
        title: "⚠️ User not identified",
        description: "Could not find your logged-in user ID. Please re-login.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const activeParams = getActiveApiParams();
      // For sheet reporting, we fetch full data
      const params: Record<string, any> = {
        ...activeParams,
        limit: 1000,
      };

      const json = await getInterviewerStats(params);
      if (!json.success && json.success !== undefined) {
        throw new Error(json.message || "API returned failure");
      }

      let items: InterviewerStat[] = [];

      if (Array.isArray(json.data)) {
        items = json.data;
      } else if (json.data && Array.isArray(json.data.records)) {
        items = json.data.records;
      } else if (json.data && Array.isArray(json.data.data)) {
        items = json.data.data;
      } else if (Array.isArray(json.records)) {
        items = json.records;
      }

      setStats(items);
    } catch (err: any) {
      console.error("SlotTracking fetch error:", err);
      toast({
        title: "❌ Failed to load slot stats",
        description: err?.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [
    viewScope,
    timeMode,
    dailyDate,
    weekRange.start,
    weekRange.end,
    monthRange.start,
    monthRange.end,
    customRange.start,
    customRange.end,
    selectedInterviewerId,
  ]);

  // ── Fetch Users for dropdown ─────────────────────────────────────────────

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await getAllUsers(1, 100);
        const mapped = (res.users || [])
          .filter((u) => u.id && u.name)
          .map((u) => ({ id: Number(u.id), name: String(u.name) }));
        setUsersList(mapped);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // ── Sheet Format Calculations ────────────────────────────────────────────

  // 1. Learning Rounds Online (LR)
  const lrItems = useMemo(() => stats.filter((s) => isLRType(s.slot_type)), [stats]);
  const lrDateRows = useMemo(() => aggregateByDate(lrItems), [lrItems]);
  const lrTotalRow = useMemo(() => calculateGroupTotal(lrDateRows), [lrDateRows]);

  // 2. Culture-Fit Rounds Online (CFR / CRF)
  const crfItems = useMemo(() => stats.filter((s) => isCRFType(s.slot_type)), [stats]);
  const crfDateRows = useMemo(() => aggregateByDate(crfItems), [crfItems]);
  const crfTotalRow = useMemo(() => calculateGroupTotal(crfDateRows), [crfDateRows]);

  // 3. Total Interviews (CFR + LR) Grand Total
  const grandTotalRow = useMemo((): DateAggregatedRow => {
    return {
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: lrTotalRow.finalTotalDone + crfTotalRow.finalTotalDone,
      finalTotalPass: lrTotalRow.finalTotalPass + crfTotalRow.finalTotalPass,
      finalTotalFail: lrTotalRow.finalTotalFail + crfTotalRow.finalTotalFail,
      finalTotalReschedule: lrTotalRow.finalTotalReschedule + crfTotalRow.finalTotalReschedule,
      finalTotalNoShow: lrTotalRow.finalTotalNoShow + crfTotalRow.finalTotalNoShow,
      finalTotalDisinterested: lrTotalRow.finalTotalDisinterested + crfTotalRow.finalTotalDisinterested,
      finalTotalSlots: lrTotalRow.finalTotalSlots + crfTotalRow.finalTotalSlots,
      finalTotalEmpty: lrTotalRow.finalTotalEmpty + crfTotalRow.finalTotalEmpty,
    };
  }, [lrTotalRow, crfTotalRow]);

  // Date-wise combined rows for Total Interviews CFR + LR
  const combinedDateRows = useMemo(() => {
    const datesSet = new Set<string>();
    lrDateRows.forEach((r) => datesSet.add(r.date));
    crfDateRows.forEach((r) => datesSet.add(r.date));

    const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((d) => {
      const lr = lrDateRows.find((r) => r.date === d);
      const crf = crfDateRows.find((r) => r.date === d);

      return {
        date: d,
        formattedDate: formatSheetDate(d),
        finalTotalDone: (lr?.finalTotalDone || 0) + (crf?.finalTotalDone || 0),
        finalTotalPass: (lr?.finalTotalPass || 0) + (crf?.finalTotalPass || 0),
        finalTotalFail: (lr?.finalTotalFail || 0) + (crf?.finalTotalFail || 0),
        finalTotalReschedule: (lr?.finalTotalReschedule || 0) + (crf?.finalTotalReschedule || 0),
        finalTotalNoShow: (lr?.finalTotalNoShow || 0) + (crf?.finalTotalNoShow || 0),
        finalTotalDisinterested: (lr?.finalTotalDisinterested || 0) + (crf?.finalTotalDisinterested || 0),
        finalTotalSlots: (lr?.finalTotalSlots || 0) + (crf?.finalTotalSlots || 0),
        finalTotalEmpty: (lr?.finalTotalEmpty || 0) + (crf?.finalTotalEmpty || 0),
      };
    });
  }, [lrDateRows, crfDateRows]);

  // ── CSV Export ───────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const csvLines: string[] = [];

    // Section 1: Learning Rounds Online
    csvLines.push(`,,,Learning Rounds Online,,,,,`);
    csvLines.push(
      [
        "Dates",
        "Final Total Done",
        "Final Total Pass",
        "Final Total Fail",
        "Final Total Reschedule",
        "Final Total No Show",
        "Final Total Disinterested",
        "Final Total Slots",
        "Final Total Empty",
      ].join(",")
    );
    lrDateRows.forEach((r) => {
      csvLines.push(
        [
          `"${r.formattedDate}"`,
          r.finalTotalDone,
          r.finalTotalPass,
          r.finalTotalFail,
          r.finalTotalReschedule,
          r.finalTotalNoShow,
          r.finalTotalDisinterested,
          r.finalTotalSlots,
          r.finalTotalEmpty,
        ].join(",")
      );
    });
    csvLines.push(
      [
        "Total",
        lrTotalRow.finalTotalDone,
        lrTotalRow.finalTotalPass,
        lrTotalRow.finalTotalFail,
        lrTotalRow.finalTotalReschedule,
        lrTotalRow.finalTotalNoShow,
        lrTotalRow.finalTotalDisinterested,
        lrTotalRow.finalTotalSlots,
        lrTotalRow.finalTotalEmpty,
      ].join(",")
    );
    csvLines.push(""); // empty row

    // Section 2: Culture-Fit Rounds Online
    csvLines.push(`,,,Culture-Fit Rounds Online,,,,,`);
    csvLines.push(
      [
        "Date",
        "Final Total Done",
        "Final Total Pass",
        "Final Total Fail",
        "Final Total Reschedule",
        "Final Total No Show",
        "Final Total Disinterested",
        "Final Total Slots",
        "Final Total Empty",
      ].join(",")
    );
    crfDateRows.forEach((r) => {
      csvLines.push(
        [
          `"${r.formattedDate}"`,
          r.finalTotalDone,
          r.finalTotalPass,
          r.finalTotalFail,
          r.finalTotalReschedule,
          r.finalTotalNoShow,
          r.finalTotalDisinterested,
          r.finalTotalSlots,
          r.finalTotalEmpty,
        ].join(",")
      );
    });
    csvLines.push(
      [
        "Total",
        crfTotalRow.finalTotalDone,
        crfTotalRow.finalTotalPass,
        crfTotalRow.finalTotalFail,
        crfTotalRow.finalTotalReschedule,
        crfTotalRow.finalTotalNoShow,
        crfTotalRow.finalTotalDisinterested,
        crfTotalRow.finalTotalSlots,
        crfTotalRow.finalTotalEmpty,
      ].join(",")
    );
    csvLines.push(""); // empty row

    // Section 3: Total Interviews (CFR + LR)
    csvLines.push(`,,,Total Interviews (CFR + LR),,,,,`);
    csvLines.push(
      [
        "",
        "Final Total Done",
        "Final Total Pass",
        "Final Total Fail",
        "Final Total Reschedule",
        "Final Total No Show",
        "Final Total Disinterested",
        "Final Total Slots",
        "Final Total Empty",
      ].join(",")
    );
    csvLines.push(
      [
        "",
        grandTotalRow.finalTotalDone,
        grandTotalRow.finalTotalPass,
        grandTotalRow.finalTotalFail,
        grandTotalRow.finalTotalReschedule,
        grandTotalRow.finalTotalNoShow,
        grandTotalRow.finalTotalDisinterested,
        grandTotalRow.finalTotalSlots,
        grandTotalRow.finalTotalEmpty,
      ].join(",")
    );

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `slot-sheet-report-${timeMode}-${formatDateISO(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Sheet Exported",
      description: "Downloaded spreadsheet report as CSV file.",
    });
  };

  // ── Screenshot Capture ───────────────────────────────────────────────────

  const handleTakeScreenshot = async () => {
    if (!sheetRef.current) return;
    setCapturingScreenshot(true);

    try {
      // Small pause to ensure layout is ready
      await new Promise((resolve) => setTimeout(resolve, 120));

      const isDark = document.documentElement.classList.contains("dark");
      const dataUrl = await toPng(sheetRef.current, {
        quality: 1,
        pixelRatio: 2, // Crisp 2x retina screenshot
        backgroundColor: isDark ? "#09090b" : "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `slot-tracking-sheet-${timeMode}-${formatDateISO(new Date())}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "📸 Screenshot Downloaded",
        description: "Slot tracking report screenshot saved as high-resolution PNG image.",
      });
    } catch (error: any) {
      console.error("Screenshot error:", error);
      toast({
        title: "❌ Failed to take screenshot",
        description: error?.message || "Could not capture image",
        variant: "destructive",
      });
    } finally {
      setCapturingScreenshot(false);
    }
  };

  // ── PDF Download ─────────────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    if (!sheetRef.current) return;
    setGeneratingPdf(true);

    try {
      // Small pause to ensure layout is ready
      await new Promise((resolve) => setTimeout(resolve, 120));

      const isDark = document.documentElement.classList.contains("dark");
      const dataUrl = await toPng(sheetRef.current, {
        quality: 1,
        pixelRatio: 2, // 2x high resolution
        backgroundColor: isDark ? "#09090b" : "#ffffff",
        cacheBust: true,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = (e) => reject(e);
      });

      // Landscape A4 orientation for table spreadsheets
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 8;
      const maxContentWidth = pageWidth - margin * 2;
      const maxContentHeight = pageHeight - margin * 2;

      const imgWidth = maxContentWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      if (imgHeight <= maxContentHeight) {
        // Fits comfortably on single page
        pdf.addImage(dataUrl, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        // Handle multi-page pagination smoothly
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= maxContentHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= maxContentHeight;
        }
      }

      pdf.save(`slot-tracking-sheet-${timeMode}-${formatDateISO(new Date())}.pdf`);

      toast({
        title: "📄 PDF Downloaded",
        description: "Slot tracking report saved as a PDF document.",
      });
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast({
        title: "❌ Failed to download PDF",
        description: error?.message || "Could not generate PDF file",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Active Date Filter Text
  const getActiveFilterLabel = () => {
    switch (timeMode) {
      case "daily":
        return `Daily: ${formatDisplayDate(dailyDate)}`;
      case "weekly":
        return `Weekly: ${formatDisplayDate(weekRange.start)} – ${formatDisplayDate(weekRange.end)}`;
      case "monthly":
        return `Monthly: ${formatDisplayDate(monthRange.start)} – ${formatDisplayDate(monthRange.end)}`;
      case "all_time":
        return "All-Time Historical History";
      case "custom":
        return `Custom: ${formatDisplayDate(customRange.start)} – ${formatDisplayDate(customRange.end)}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex font-sans text-slate-900 dark:text-slate-100">
      <AdmissionsSidebar />

      <main className="md:ml-64 flex-1 p-3 sm:p-6 overflow-y-auto h-screen">
        <div className="max-w-[1550px] mx-auto space-y-4 mt-12 md:mt-0">

          {/* ── Page Header ── */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Slot Tracking & Performance Sheet
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Learning Rounds (Online), Culture-Fit Rounds (Online), and Total Combined (CFR + LR) stats.
                  </p>
                </div>
              </div>

              {/* View Scope & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Mode Switcher: Sheet vs Detailed */}
                <div className="inline-flex p-1 bg-muted/80 rounded-xl border border-border">
                  <button
                    onClick={() => setDisplayMode("sheet")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${displayMode === "sheet"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                    Sheet View
                  </button>
                  <button
                    onClick={() => setDisplayMode("detailed")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${displayMode === "detailed"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Interviewer Records
                  </button>
                </div>

                {/* Scope Switcher (Admin Only) */}
                {isAdmin ? (
                  <div className="inline-flex p-1 bg-muted/80 rounded-xl border border-border">
                    <button
                      onClick={() => setViewScope("all")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${viewScope === "all"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      All Interviewers
                    </button>
                    <button
                      onClick={() => setViewScope("my")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${viewScope === "my"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      My Stats
                    </button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                    <User className="w-3.5 h-3.5" />
                    My Performance
                  </Badge>
                )}

                {/* Download PDF Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf || loading || stats.length === 0}
                  className="h-9 gap-1.5 text-xs font-medium shadow-sm hover:bg-muted text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                >
                  {generatingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {generatingPdf ? "Generating..." : "Download PDF"}
                </Button>

                {/* Screenshot Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTakeScreenshot}
                  disabled={capturingScreenshot || loading || stats.length === 0}
                  className="h-9 gap-1.5 text-xs font-medium shadow-sm hover:bg-muted text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                >
                  {capturingScreenshot ? (
                    <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  {capturingScreenshot ? "Capturing..." : "Screenshot"}
                </Button>

                {/* Export CSV */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={loading || stats.length === 0}
                  className="h-9 gap-1.5 text-xs font-medium shadow-sm hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Export Sheet
                </Button>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStats}
                  disabled={loading}
                  className="h-9 gap-1.5 text-xs font-medium shadow-sm hover:bg-muted"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* ── Time Period & Date Range Filter Bar ── */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Filter Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setTimeMode("daily")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${timeMode === "daily"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Daily
                </button>

                <button
                  onClick={() => setTimeMode("weekly")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${timeMode === "weekly"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Weekly
                </button>

                <button
                  onClick={() => setTimeMode("monthly")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${timeMode === "monthly"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Monthly
                </button>

                <button
                  onClick={() => setTimeMode("all_time")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${timeMode === "all_time"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  All-Time
                </button>

                <button
                  onClick={() => setTimeMode("custom")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${timeMode === "custom"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Custom Range
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/40 border-border">
                  Active: <span className="font-semibold text-foreground ml-1">{getActiveFilterLabel()}</span>
                </Badge>
              </div>
            </div>

            {/* Mode-specific Controls & Presets */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Daily Mode Controls */}
              {timeMode === "daily" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
                    <Button
                      size="sm"
                      variant={dailyDate === getTodayDate() ? "default" : "ghost"}
                      onClick={() => setDailyDate(getTodayDate())}
                      className="h-7 text-xs px-3"
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant={dailyDate === getYesterdayDate() ? "default" : "ghost"}
                      onClick={() => setDailyDate(getYesterdayDate())}
                      className="h-7 text-xs px-3"
                    >
                      Yesterday
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Select Date:</span>
                    <Input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="h-8 text-xs w-[150px] bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Weekly Mode Controls */}
              {timeMode === "weekly" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
                    <Button
                      size="sm"
                      variant={weeklyPreset === "this_week" ? "default" : "ghost"}
                      onClick={() => {
                        setWeeklyPreset("this_week");
                        setWeekRange(getThisWeekRange());
                      }}
                      className="h-7 text-xs px-3"
                    >
                      This Week
                    </Button>
                    <Button
                      size="sm"
                      variant={weeklyPreset === "last_7_days" ? "default" : "ghost"}
                      onClick={() => {
                        setWeeklyPreset("last_7_days");
                        setWeekRange(getLast7DaysRange());
                      }}
                      className="h-7 text-xs px-3"
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      size="sm"
                      variant={weeklyPreset === "last_week" ? "default" : "ghost"}
                      onClick={() => {
                        setWeeklyPreset("last_week");
                        setWeekRange(getLastWeekRange());
                      }}
                      className="h-7 text-xs px-3"
                    >
                      Last Week
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Range:</span>
                    <Input
                      type="date"
                      value={weekRange.start}
                      onChange={(e) => {
                        setWeeklyPreset("this_week");
                        setWeekRange((prev) => ({ ...prev, start: e.target.value }));
                      }}
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={weekRange.end}
                      onChange={(e) => {
                        setWeeklyPreset("this_week");
                        setWeekRange((prev) => ({ ...prev, end: e.target.value }));
                      }}
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Monthly Mode Controls */}
              {timeMode === "monthly" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
                    <Button
                      size="sm"
                      variant={monthlyPreset === "this_month" ? "default" : "ghost"}
                      onClick={() => {
                        setMonthlyPreset("this_month");
                        setMonthRange(getThisMonthRange());
                      }}
                      className="h-7 text-xs px-3"
                    >
                      This Month
                    </Button>
                    <Button
                      size="sm"
                      variant={monthlyPreset === "last_month" ? "default" : "ghost"}
                      onClick={() => {
                        setMonthlyPreset("last_month");
                        setMonthRange(getLastMonthRange());
                      }}
                      className="h-7 text-xs px-3"
                    >
                      Last Month
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Month Range:</span>
                    <Input
                      type="date"
                      value={monthRange.start}
                      onChange={(e) => {
                        setMonthRange((prev) => ({ ...prev, start: e.target.value }));
                      }}
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={monthRange.end}
                      onChange={(e) => {
                        setMonthRange((prev) => ({ ...prev, end: e.target.value }));
                      }}
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                  </div>
                </div>
              )}

              {/* All-Time Mode Info */}
              {timeMode === "all_time" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Fetching entire historical record history (`start_date=all`)</span>
                </div>
              )}

              {/* Custom Range Mode Controls */}
              {timeMode === "custom" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">From:</span>
                    <Input
                      type="date"
                      value={customRange.start}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                    <span className="text-xs text-muted-foreground font-medium">To:</span>
                    <Input
                      type="date"
                      value={customRange.end}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                      className="h-8 text-xs w-[140px] bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Interviewer Filter */}
              {isAdmin && viewScope === "all" && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" /> Interviewer:
                  </span>
                  <Select
                    value={selectedInterviewerId || "all"}
                    onValueChange={(val) => setSelectedInterviewerId(val === "all" ? "" : val)}
                    disabled={usersLoading}
                  >
                    <SelectTrigger className="h-8 text-xs w-[200px] bg-background">
                      <SelectValue placeholder={usersLoading ? "Loading users..." : "All Interviewers"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Interviewers (Combined)</SelectItem>
                      {usersList.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name} (ID: {u.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 1: EXACT SHEET FORMAT REPORT (AS PER SCREENSHOT)
             ══════════════════════════════════════════════════════════════════════ */}
          {displayMode === "sheet" && (
            <div ref={sheetRef} className="space-y-6 bg-card dark:bg-zinc-950 p-2 sm:p-4 rounded-2xl border border-border/40 shadow-sm">

              {/* ── 1. Learning Rounds Online Table ── */}
              <div className="bg-card border border-slate-300 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                {/* Title Top Header Bar (Outside Table) */}
                <div className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-300 dark:border-zinc-700 py-2.5 px-4 flex items-center justify-center">
                  <span className="bg-[#FCE4D6] dark:bg-amber-950/90 text-[#7030A0] dark:text-amber-200 font-extrabold text-sm sm:text-base px-6 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-800 shadow-sm text-center tracking-wide">
                    Learning Rounds Online
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      {/* Column Headers Row */}
                      <tr>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Dates
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Done
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Pass
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Fail
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Reschedule
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total No Show
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Disinterested
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Slots
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Empty
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="animate-pulse bg-white dark:bg-zinc-900">
                            {Array.from({ length: 9 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700">
                                <div className="h-4 bg-muted rounded w-14 mx-auto" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : lrDateRows.length === 0 ? (
                        <tr className="bg-white dark:bg-zinc-900">
                          <td className="px-3 py-3 text-center font-medium border border-slate-300 dark:border-zinc-700 text-muted-foreground">
                            {timeMode === "daily" ? formatSheetDate(dailyDate) : "No data"}
                          </td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                        </tr>
                      ) : (
                        lrDateRows.map((row) => (
                          <tr key={row.date} className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                            <td className="px-3 py-2 text-center font-semibold text-foreground border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                              {row.formattedDate}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalDone}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalPass}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalFail}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalReschedule}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalNoShow}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalDisinterested}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalSlots}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalEmpty}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Total Row */}
                      <tr className="bg-[#FFF2CC] dark:bg-amber-900/40 text-slate-900 dark:text-amber-100 font-bold border-t-2 border-slate-300 dark:border-zinc-700">
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          Total
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalDone}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalPass}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalFail}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalReschedule}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalNoShow}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalDisinterested}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalSlots}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {lrTotalRow.finalTotalEmpty}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 2. Culture-Fit Rounds Online Table ── */}
              <div className="bg-card border border-slate-300 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                {/* Title Top Header Bar (Outside Table) */}
                <div className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-300 dark:border-zinc-700 py-2.5 px-4 flex items-center justify-center">
                  <span className="bg-[#FCE4D6] dark:bg-amber-950/90 text-[#7030A0] dark:text-amber-200 font-extrabold text-sm sm:text-base px-6 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-800 shadow-sm text-center tracking-wide">
                    Culture-Fit Rounds Online
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      {/* Column Headers Row */}
                      <tr>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Date
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Done
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Pass
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Fail
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Reschedule
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total No Show
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Disinterested
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Slots
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Empty
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="animate-pulse bg-white dark:bg-zinc-900">
                            {Array.from({ length: 9 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700">
                                <div className="h-4 bg-muted rounded w-14 mx-auto" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : crfDateRows.length === 0 ? (
                        <tr className="bg-white dark:bg-zinc-900">
                          <td className="px-3 py-3 text-center font-medium border border-slate-300 dark:border-zinc-700 text-muted-foreground">
                            {timeMode === "daily" ? formatSheetDate(dailyDate) : "No data"}
                          </td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                          <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700">0</td>
                        </tr>
                      ) : (
                        crfDateRows.map((row) => (
                          <tr key={row.date} className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                            <td className="px-3 py-2 text-center font-semibold text-foreground border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                              {row.formattedDate}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalDone}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalPass}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalFail}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalReschedule}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalNoShow}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalDisinterested}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalSlots}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-300 dark:border-zinc-700 font-medium">
                              {row.finalTotalEmpty}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Total Row */}
                      <tr className="bg-[#FFF2CC] dark:bg-amber-900/40 text-slate-900 dark:text-amber-100 font-bold border-t-2 border-slate-300 dark:border-zinc-700">
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          Total
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalDone}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalPass}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalFail}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalReschedule}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalNoShow}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalDisinterested}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalSlots}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-slate-300 dark:border-zinc-700 font-extrabold">
                          {crfTotalRow.finalTotalEmpty}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 3. Total Interviews (CFR + LR) Grand Total Table ── */}
              <div className="bg-card border border-slate-300 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                {/* Title Top Header Bar (Outside Table) */}
                <div className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-300 dark:border-zinc-700 py-2.5 px-4 flex items-center justify-center">
                  <span className="bg-[#FCE4D6] dark:bg-amber-950/90 text-[#7030A0] dark:text-amber-200 font-extrabold text-sm sm:text-base px-6 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-800 shadow-sm text-center tracking-wide">
                    Total Interviews (CFR + LR)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      {/* Column Headers Row */}
                      <tr>
                        <th className="w-20 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700" />
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Done
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Pass
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Fail
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Reschedule
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total No Show
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Disinterested
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Slots
                        </th>
                        <th className="bg-[#D9E1F2] dark:bg-blue-950/70 text-[#1F3864] dark:text-blue-200 font-bold text-center px-3 py-2.5 border border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                          Final Total Empty
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Grand Total Row */}
                      <tr className="bg-[#FFF2CC] dark:bg-amber-900/40 text-slate-900 dark:text-amber-100 font-bold text-sm">
                        <td className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-3 py-3 font-semibold text-center text-muted-foreground">
                          Total
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalDone}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalPass}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalFail}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalReschedule}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalNoShow}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalDisinterested}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalSlots}
                        </td>
                        <td className="px-3 py-3 text-center border border-slate-300 dark:border-zinc-700 font-black">
                          {grandTotalRow.finalTotalEmpty}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 2: DETAILED INTERVIEWER RECORDS & BREAKDOWN
             ══════════════════════════════════════════════════════════════════════ */}
          {displayMode === "detailed" && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search interviewer or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                  {searchQuery && (
                    <X
                      className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    />
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Showing <b>{stats.length}</b> total raw interviewer slot records
                </div>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/70 border-b border-border font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Interviewer Name</th>
                      <th className="px-3 py-2 text-center">Round Type</th>
                      <th className="px-3 py-2 text-center text-purple-600">Total Slots</th>
                      <th className="px-3 py-2 text-center text-orange-500">Empty</th>
                      <th className="px-3 py-2 text-center text-blue-600">Conducted</th>
                      <th className="px-3 py-2 text-center text-emerald-600">Pass</th>
                      <th className="px-3 py-2 text-center text-rose-500">Fail</th>
                      <th className="px-3 py-2 text-center text-amber-600">Reschedule</th>
                      <th className="px-3 py-2 text-center text-slate-500">No Show</th>
                      <th className="px-3 py-2 text-center text-orange-600">Disinterested</th>
                      <th className="px-3 py-2 text-center text-red-600">Not Eligible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats
                      .filter((r) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          (r.interviewer_name || "").toLowerCase().includes(q) ||
                          (r.date || "").toLowerCase().includes(q) ||
                          (r.slot_type || "").toLowerCase().includes(q)
                        );
                      })
                      .map((row, idx) => {
                        const isLR = isLRType(row.slot_type);
                        const isCRF = isCRFType(row.slot_type);

                        return (
                          <tr key={`${row.interviewer_id}-${row.date}-${idx}`} className="hover:bg-muted/20">
                            <td className="px-3 py-2 whitespace-nowrap font-medium">{formatSheetDate(row.date)}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-semibold">{row.interviewer_name}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isLR
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : isCRF
                                      ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                              >
                                {row.slot_type || "N/A"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-purple-600">{row.total_slots || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-orange-500">{row.empty_slots || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-blue-600">{row.interview_done || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-emerald-600">{row.pass || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-rose-500">{row.fail || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-amber-600">{row.reschedule || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-500">{row.no_show || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-orange-600">{row.disinterested || 0}</td>
                            <td className="px-3 py-2 text-center font-bold text-red-600">{row.not_eligible || 0}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SlotTracking;
