import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTests } from "../../utils/TestContext";
import LogoutButton from "@/components/ui/LogoutButton";
import {
  getCompleteStudentData,
  CompleteStudentData,
  getAllStates,
} from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { OfferLetterCard } from "./OfferLetterCard";

interface Student {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  city: string;
  state: string;
}

type BookingStatus = "Pending" | "Booked" | "Cancelled" | "Completed" | null;

type TestRow = {
  id: number;
  name: string;
  status: "Pass" | "Fail" | "Pending" | "-";
  score: number | null;
  action: string;
  slotBooking: {
    status: BookingStatus;
    scheduledTime?: string;
  };
};

export default function StudentResult() {
  const [student, setStudent] = useState<Student | null>(null);
  const [completeData, setCompleteData] = useState<CompleteStudentData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<any[]>([]);
  const { tests, setTests } = useTests();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper: normalize booking status
  const normalizeBooking = (val: any): BookingStatus => {
    if (!val) return null;
    const normalized = String(val).toLowerCase();
    if (normalized === "pending") return "Pending";
    if (normalized === "booked") return "Booked";
    if (normalized === "cancelled") return "Cancelled";
    if (normalized === "completed") return "Completed";
    return null;
  };

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesData = await getAllStates();
        // console.log("Fetched states:", statesData);
        setStates(statesData || []);
      } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
      }
    };
    fetchStates();
  }, []);

  const getStateByCodeId = async (codeId: string): Promise<string> => {
    if (!codeId) return "";
    const states = await getAllStates();
    const match = states.data.find((s: any) => s.state_code === codeId);
    return match?.state_name || "";
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // Get email from  or googleUser
        const googleUser = localStorage.getItem("user");
        let email = "";

        if (googleUser) {
          const parsedUser = JSON.parse(googleUser);
          email = parsedUser.email;
        }

        if (!email) {
          const savedApiPayload = localStorage.getItem("studentData");
          if (savedApiPayload) {
            const payload = JSON.parse(savedApiPayload);
            email = payload?.student?.email || payload?.email || "";
          }
        }

        if (email) {
          const data = await getCompleteStudentData(email);
          setCompleteData(data);

          const profile = data.data.student;
          if (profile) {
            // console.log("state:", profile.state);
            const stateName = await getStateByCodeId(profile.state);
            // console.log("Mapped state name:", stateName);
            setStudent({
              firstName: profile.first_name || "",
              middleName: profile.middle_name || "",
              lastName: profile.last_name || "",
              email: profile.email || "",
              whatsappNumber:
                profile.whatsapp_number || profile.phone_number || "",
              city: profile.city || "",
              state: stateName || "",
            });

            // Build tests array using API data (keep all relevant rows and history)
            const updatedTests: TestRow[] = [];

            // 1) Screening Test - show ALL attempts, not just latest
            const examSessions = data.data.exam_sessions || [];

            if (examSessions.length > 0) {
              // Sort by date oldest to newest
              examSessions.sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );

              // Push each screening test attempt
              examSessions.forEach((exam: any, index: number) => {
                const screeningText = String(exam.status || "").toLowerCase();

                let screeningStatus: "Pass" | "Fail" = "Fail";
                if (screeningText.includes("pass")) screeningStatus = "Pass";

                updatedTests.push({
                  id: 100 + index,
                  name:
                    examSessions.length > 1
                      ? `Screening Test (Attempt ${index + 1})`
                      : "Screening Test",
                  status: screeningStatus,
                  score: exam.obtained_marks ?? null,
                  action: screeningStatus === "Pass" ? "Completed" : "Failed",
                  slotBooking: {
                    status: null,
                    scheduledTime: exam.date_of_test || "",
                  },
                });
              });
            }

            // Check if any screening test was passed
            const hasPassedScreening = examSessions.some(
              (exam: any) => exam.is_passed,
            );

            // Helper function to get booked slots from localStorage
            const getLocalStorageBookedSlots = (slotType: "LR" | "CFR") => {
              const bookedSlots: any[] = [];
              // Check all localStorage keys for bookedSlot_ pattern
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("bookedSlot_")) {
                  try {
                    const slotData = JSON.parse(
                      localStorage.getItem(key) || "{}",
                    );
                    // Check if it's the correct type based on topic_name
                    if (
                      slotType === "LR" &&
                      slotData.topic_name === "Learning Round"
                    ) {
                      bookedSlots.push({ ...slotData, localStorageKey: key });
                    } else if (
                      slotType === "CFR" &&
                      slotData.topic_name === "Cultural Fit Round"
                    ) {
                      bookedSlots.push({ ...slotData, localStorageKey: key });
                    }
                  } catch (e) {
                    console.error("Error parsing localStorage slot:", e);
                  }
                }
              }
              return bookedSlots;
            };

            // 2) Learning Round - Rows ONLY created from interview_learner_round
            const lrRounds = data.data.interview_learner_round || [];
            const lrSchedules = data.data.interview_schedules_lr || [];
            const lrLocalSlots = getLocalStorageBookedSlots("LR");

            // Sort completed rounds by creation date (oldest to newest)
            lrRounds.sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );

            // Push LR rounds - rows are ONLY created from interview_learner_round
            lrRounds.forEach((lr: any, index: number) => {
              const lrText = lr.learning_round_status || "";
              let lrAttemptStatus: "Pass" | "Fail" | "Pending" = "Pending";
              if (lrText.toLowerCase().includes("pass"))
                lrAttemptStatus = "Pass";
              else if (lrText.toLowerCase().includes("fail"))
                lrAttemptStatus = "Fail";

              // Match schedule by index (attempt number) - sorted by creation date
              // Sort schedules by creation date to match with attempt number
              const sortedLrSchedules = [...lrSchedules].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );

              // Get the schedule for this attempt (index)
              const matchingSchedule = sortedLrSchedules[index];

              // Find matching localStorage slot for time/details
              const matchingLocalSlot = lrLocalSlots.find(
                (ls: any) =>
                  ls.scheduled_interview_id === matchingSchedule?.schedule_id,
              );

              // Determine scheduled time from schedule or localStorage
              let scheduledTime = "";
              let slotStatus: BookingStatus = "Completed";

              if (matchingSchedule) {
                scheduledTime = `${matchingSchedule.date}T${matchingSchedule.start_time}`;
                slotStatus =
                  lrAttemptStatus === "Pending"
                    ? normalizeBooking(
                        matchingSchedule.slot_details?.status ||
                          matchingSchedule.status,
                      )
                    : "Completed";
                // console.log(`LR Attempt ${index + 1} scheduledTime from API schedule:`, scheduledTime, "schedule_id:", matchingSchedule.schedule_id);
              } else if (matchingLocalSlot) {
                scheduledTime = `${matchingLocalSlot.on_date}T${matchingLocalSlot.from}`;
                slotStatus =
                  lrAttemptStatus === "Pending"
                    ? matchingLocalSlot.is_cancelled
                      ? "Cancelled"
                      : "Booked"
                    : "Completed";
                // console.log(`LR Attempt ${index + 1} scheduledTime from localStorage:`, scheduledTime);
              } else {
                scheduledTime = lr.scheduled_time || lr.scheduled_at || "";
                // console.log(`LR Attempt ${index + 1} scheduledTime from interview_learner_round:`, scheduledTime);
              }

              // Check if time has passed
              let hasTimePassed = false;
              if (scheduledTime) {
                const scheduledDateTime = new Date(scheduledTime);
                hasTimePassed = scheduledDateTime < new Date();
              }

              updatedTests.push({
                id: 200 + index,
                name:
                  lrRounds.length > 1
                    ? `Learning Round (Attempt ${index + 1})`
                    : "Learning Round",
                status: lrAttemptStatus,
                score: null,
                action:
                  lrAttemptStatus === "Pass" || lrAttemptStatus === "Fail"
                    ? "Completed"
                    : hasTimePassed
                      ? "Completed"
                      : "slot-book",
                slotBooking: {
                  status:
                    lrAttemptStatus === "Pass" || lrAttemptStatus === "Fail"
                      ? "Completed"
                      : hasTimePassed
                        ? "Completed"
                        : slotStatus,
                  scheduledTime: scheduledTime,
                },
              });
            });

            // Determine latest LR status (used for CFR gating)
            const latestLR =
              lrRounds.length > 0 ? lrRounds[lrRounds.length - 1] : null;
            let lrStatus: "Pass" | "Fail" | "Pending" = "Pending";
            if (latestLR) {
              const lrText = latestLR.learning_round_status || "";
              if (lrText.toLowerCase().includes("pass")) lrStatus = "Pass";
              else if (lrText.toLowerCase().includes("fail")) lrStatus = "Fail";
            }

            // If screening passed but no LR rounds exist, create placeholder row
            if (hasPassedScreening && lrRounds.length === 0) {
              // Check if there's a booked slot in localStorage or API
              let bookedSlotInfo: any = null;

              if (lrLocalSlots.length > 0) {
                bookedSlotInfo = lrLocalSlots[0];
              } else if (lrSchedules.length > 0) {
                bookedSlotInfo = lrSchedules[0];
              }

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
                if (bookedSlotInfo.on_date) {
                  // localStorage slot
                  scheduledTime = `${bookedSlotInfo.on_date}T${bookedSlotInfo.from}`;
                  const scheduledDateTime = new Date(scheduledTime);
                  const hasTimePassed = scheduledDateTime < new Date();
                  slotStatus = hasTimePassed
                    ? "Completed"
                    : bookedSlotInfo.is_cancelled
                      ? "Cancelled"
                      : "Booked";
                } else {
                  // API schedule slot
                  scheduledTime = `${bookedSlotInfo.date}T${bookedSlotInfo.start_time}`;
                  const scheduledDateTime = new Date(scheduledTime);
                  const hasTimePassed = scheduledDateTime < new Date();
                  slotStatus = hasTimePassed
                    ? "Completed"
                    : normalizeBooking(
                        bookedSlotInfo.slot_details?.status ||
                          bookedSlotInfo.status,
                      );
                }
              }

              const hasTimePassed = scheduledTime
                ? new Date(scheduledTime) < new Date()
                : false;

              updatedTests.push({
                id: 2,
                name: "Learning Round",
                status: "Pending",
                score: null,
                action: hasTimePassed ? "Completed" : "slot-book",
                slotBooking: {
                  status: slotStatus,
                  scheduledTime: scheduledTime,
                },
              });
            }

            // 3) Cultural Fit Round - Rows ONLY created from interview_cultural_fit_round
            const cfrRounds = data.data.interview_cultural_fit_round || [];
            const cfrSchedules = data.data.interview_schedules_cfr || [];
            const cfrLocalSlots = getLocalStorageBookedSlots("CFR");

            // Sort completed rounds by creation date (oldest to newest)
            cfrRounds.sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );

            // Push CFR rounds - rows are ONLY created from interview_cultural_fit_round
            cfrRounds.forEach((cfr: any, index: number) => {
              const cfrText = cfr.cultural_fit_status || "";
              let cfrAttemptStatus: "Pass" | "Fail" | "Pending" = "Pending";
              if (cfrText.toLowerCase().includes("pass"))
                cfrAttemptStatus = "Pass";
              else if (cfrText.toLowerCase().includes("fail"))
                cfrAttemptStatus = "Fail";

              // Match schedule by index (attempt number) - sorted by creation date
              // Sort schedules by creation date to match with attempt number
              const sortedCfrSchedules = [...cfrSchedules].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );

              // Get the schedule for this attempt (index)
              const matchingSchedule = sortedCfrSchedules[index];

              // Find matching localStorage slot for time/details
              const matchingLocalSlot = cfrLocalSlots.find(
                (ls: any) =>
                  ls.scheduled_interview_id === matchingSchedule?.schedule_id,
              );

              // Determine scheduled time from schedule or localStorage
              let scheduledTime = "";
              let slotStatus: BookingStatus = "Completed";

              if (matchingSchedule) {
                scheduledTime = `${matchingSchedule.date}T${matchingSchedule.start_time}`;
                slotStatus =
                  cfrAttemptStatus === "Pending"
                    ? normalizeBooking(
                        matchingSchedule.slot_details?.status ||
                          matchingSchedule.status,
                      )
                    : "Completed";
                // console.log(`CFR Attempt ${index + 1} scheduledTime from API schedule:`, scheduledTime, "schedule_id:", matchingSchedule.schedule_id);
              } else if (matchingLocalSlot) {
                scheduledTime = `${matchingLocalSlot.on_date}T${matchingLocalSlot.from}`;
                slotStatus =
                  cfrAttemptStatus === "Pending"
                    ? matchingLocalSlot.is_cancelled
                      ? "Cancelled"
                      : "Booked"
                    : "Completed";
                // console.log(`CFR Attempt ${index + 1} scheduledTime from localStorage:`, scheduledTime);
              } else {
                scheduledTime = cfr.scheduled_time || cfr.scheduled_at || "";
                // console.log(`CFR Attempt ${index + 1} scheduledTime from interview_cultural_fit_round:`, scheduledTime);
              }

              // Check if time has passed
              let hasTimePassed = false;
              if (scheduledTime) {
                const scheduledDateTime = new Date(scheduledTime);
                hasTimePassed = scheduledDateTime < new Date();
              }

              updatedTests.push({
                id: 300 + index,
                name:
                  cfrRounds.length > 1
                    ? `Cultural Fit Round (Attempt ${index + 1})`
                    : "Cultural Fit Round",
                status: cfrAttemptStatus,
                score: null,
                action:
                  cfrAttemptStatus === "Pass" || cfrAttemptStatus === "Fail"
                    ? "Completed"
                    : hasTimePassed
                      ? "Completed"
                      : "slot-book",
                slotBooking: {
                  status:
                    cfrAttemptStatus === "Pass" || cfrAttemptStatus === "Fail"
                      ? "Completed"
                      : hasTimePassed
                        ? "Completed"
                        : slotStatus,
                  scheduledTime: scheduledTime,
                },
              });
            });

            // Determine latest CFR status
            const latestCFR =
              cfrRounds.length > 0 ? cfrRounds[cfrRounds.length - 1] : null;
            let cfrStatus: "Pass" | "Fail" | "Pending" = "Pending";
            if (latestCFR) {
              const cfrText = latestCFR.cultural_fit_status || "";
              if (cfrText.toLowerCase().includes("pass")) cfrStatus = "Pass";
              else if (cfrText.toLowerCase().includes("fail"))
                cfrStatus = "Fail";
            }

            // If latest LR passed and no CFR rounds exist, create placeholder row
            if (lrStatus === "Pass" && cfrRounds.length === 0) {
              // Check if there's a booked slot in localStorage or API
              let bookedSlotInfo: any = null;

              if (cfrLocalSlots.length > 0) {
                bookedSlotInfo = cfrLocalSlots[0];
              } else if (cfrSchedules.length > 0) {
                bookedSlotInfo = cfrSchedules[0];
              }

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
                if (bookedSlotInfo.on_date) {
                  // localStorage slot
                  scheduledTime = `${bookedSlotInfo.on_date}T${bookedSlotInfo.from}`;
                  const scheduledDateTime = new Date(scheduledTime);
                  const hasTimePassed = scheduledDateTime < new Date();
                  slotStatus = hasTimePassed
                    ? "Completed"
                    : bookedSlotInfo.is_cancelled
                      ? "Cancelled"
                      : "Booked";
                } else {
                  // API schedule slot
                  scheduledTime = `${bookedSlotInfo.date}T${bookedSlotInfo.start_time}`;
                  const scheduledDateTime = new Date(scheduledTime);
                  const hasTimePassed = scheduledDateTime < new Date();
                  slotStatus = hasTimePassed
                    ? "Completed"
                    : normalizeBooking(
                        bookedSlotInfo.slot_details?.status ||
                          bookedSlotInfo.status,
                      );
                }
              }

              const hasTimePassed = scheduledTime
                ? new Date(scheduledTime) < new Date()
                : false;

              updatedTests.push({
                id: 3,
                name: "Cultural Fit Round",
                status: "Pending",
                score: null,
                action: hasTimePassed ? "Completed" : "slot-book",
                slotBooking: {
                  status: slotStatus,
                  scheduledTime: scheduledTime,
                },
              });
            }

            // If latest LR failed, create new LR placeholder for rebooking
            if (lrStatus === "Fail") {
              updatedTests.push({
                id: 200 + lrRounds.length,
                name: `Learning Round (Attempt ${lrRounds.length + 1})`,
                status: "Pending",
                score: null,
                action: "slot-book",
                slotBooking: {
                  status: null,
                  scheduledTime: "",
                },
              });
            }

            // If latest CFR failed, create new CFR placeholder for rebooking
            if (cfrStatus === "Fail") {
              updatedTests.push({
                id: 300 + cfrRounds.length,
                name: `Cultural Fit Round (Attempt ${cfrRounds.length + 1})`,
                status: "Pending",
                score: null,
                action: "slot-book",
                slotBooking: {
                  status: null,
                  scheduledTime: "",
                },
              });
            }

            // Finally, set tests context so UI renders - ALWAYS set, even if empty
            setTests(updatedTests);
          }
        } else {
          const savedForm = localStorage.getItem("studentFormData");
          if (savedForm) {
            setStudent(JSON.parse(savedForm));
          }
        }
      } catch (error: any) {
        console.error("Error fetching student data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load student data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [setTests, toast]);

  const handleBooking = (testId: number, testName: string) => {
    let slotType: "LR" | "CFR" | undefined;

    if (testName.includes("Learning Round")) slotType = "LR";
    else if (
      testName.includes("Cultural Fit Round") ||
      testName.includes("Culture Fit Round")
    )
      slotType = "CFR";

    navigate(`/students/slot-booking/${testId}`, {
      state: { slot_type: slotType },
    });
  };

  const handleRetestNavigation = () => {
    localStorage.setItem("testStarted", "false");
    localStorage.setItem("testCompleted", "false");
    localStorage.setItem("allowRetest", "true");

    navigate("/students/test/start", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading student data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 p-4 flex">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full h-[95vh] overflow-y-auto">
        <header className="mb-6">
          <LogoutButton className="from-orange-400 to-red-500" />
          <h1 className="text-2xl font-bold">Student Results</h1>
          <p className="text-gray-600">
            Track your test results and interview slot booking status.
          </p>
        </header>

        {/* Student Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <p>
              <span className="font-semibold">Name:</span>{" "}
              {student?.firstName || "-"} {student?.middleName || ""}{" "}
              {student?.lastName || ""}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {student?.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Phone Number:</span>{" "}
              {student?.whatsappNumber || "-"}
            </p>
            <p>
              <span className="font-semibold">State:</span>{" "}
              {student?.state
                ? student.state
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : "-"}
            </p>
          </CardContent>
        </Card>

        {/* Congratulations Message - Only show if Offer Sent */}
        {completeData?.data.final_decisions?.length > 0 &&
          completeData.data.final_decisions
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )[0]
            ?.offer_letter_status?.toLowerCase() === "offer sent" && (
            <OfferLetterCard student={completeData.data.student} />
          )}

        {/* Test Results & Slot Booking */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results & Slot Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-left rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Stage</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Scheduled Time</th>
                    <th className="px-4 py-2 border">Actions</th>
                    <th className="px-4 py-2 border">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {tests && tests.length > 0 ? (
                    tests.map((test: TestRow) => {
                      const slotStatus = test.slotBooking?.status;
                      const isSlotBooked =
                        slotStatus === "Booked" || slotStatus === "Pending";
                      const isSlotCompleted = slotStatus === "Completed";
                      const isSlotCancelled = slotStatus === "Cancelled";

                      // Check if scheduled time has passed
                      let hasTimePassed = false;
                      if (test.slotBooking?.scheduledTime) {
                        const scheduledDateTime = new Date(
                          test.slotBooking.scheduledTime,
                        );
                        const now = new Date();
                        hasTimePassed = scheduledDateTime < now;
                      }

                      // Check if any attempt of the same type has passed
                      const hasPassedAttempt = tests.some((t: TestRow) => {
                        if (
                          test.name.includes("Screening Test") &&
                          t.name.includes("Screening Test")
                        ) {
                          return t.status === "Pass";
                        }
                        if (
                          test.name.includes("Learning Round") &&
                          t.name.includes("Learning Round")
                        ) {
                          return t.status === "Pass";
                        }
                        if (
                          test.name.includes("Cultural Fit Round") &&
                          t.name.includes("Cultural Fit Round")
                        ) {
                          return t.status === "Pass";
                        }
                        return false;
                      });

                      return (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border">{test.name}</td>
                          <td className="px-4 py-2 border">
                            <span
                              className={`px-2 py-1 rounded text-sm font-medium ${
                                test.status === "Pass"
                                  ? "bg-green-100 text-green-700"
                                  : test.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {test.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 border">
                            {test.slotBooking?.scheduledTime
                              ? new Date(
                                  test.slotBooking.scheduledTime,
                                ).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                          <td className="px-4 py-2 border">
                            {/* Screening Test Actions - Only show Retest button for Fail */}
                            {test.name.includes("Screening Test") ? (
                              test.status === "Pass" ? (
                                <p className="text-gray-600">-</p>
                              ) : hasPassedAttempt ? (
                                <Button
                                  disabled
                                  className="bg-gray-300 text-gray-500 cursor-not-allowed"
                                >
                                  Retest
                                </Button>
                              ) : test.status === "Fail" ? (
                                <Button
                                  onClick={handleRetestNavigation}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  Retest
                                </Button>
                              ) : (
                                <p className="text-gray-600">-</p>
                              )
                            ) : (
                              /* Book/Reschedule for LR & CFR only */
                              <>
                                {/* If completed (Pass/Fail), show nothing */}
                                {test.action === "Completed" ? (
                                  <p className="text-gray-600">-</p>
                                ) : hasPassedAttempt ? (
                                  /* If another attempt passed, disable button */
                                  <Button
                                    disabled
                                    className="bg-gray-300 text-gray-500 cursor-not-allowed"
                                    variant="outline"
                                  >
                                    {isSlotBooked ? "Reschedule" : "Book Slot"}
                                  </Button>
                                ) : hasTimePassed && !isSlotCompleted ? (
                                  /* If time passed but not completed, disable (awaiting result) */
                                  <Button
                                    disabled
                                    className="bg-gray-300 text-gray-500 cursor-not-allowed"
                                    variant="outline"
                                  >
                                    Interview Completed
                                  </Button>
                                ) : isSlotBooked && !isSlotCancelled ? (
                                  /* If slot is booked and time not passed, show Reschedule */
                                  <Button
                                    onClick={() =>
                                      handleBooking(test.id, test.name)
                                    }
                                    variant="outline"
                                  >
                                    Reschedule
                                  </Button>
                                ) : (
                                  /* Default: Show Book Slot */
                                  <Button
                                    onClick={() =>
                                      handleBooking(test.id, test.name)
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Book Slot
                                  </Button>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-2 border">
                            {test.score ?? "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No test data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
