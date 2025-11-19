
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTests } from "../../utils/TestContext";
import LogoutButton from "@/components/ui/LogoutButton";
import { getCompleteStudentData, CompleteStudentData } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface Student {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  city: string;
  state: string;
}

type BookingStatus = string | null | undefined;

type TestRow = {
  id: number;
  name: string;
  status: "Pass" | "Fail" | "Pending" | string;
  score: number | null | string;
  action: string;
  slotBooking?: {
    status?: BookingStatus; // API values like 'pending', 'booked', 'cancelled'
    scheduledTime?: string;
  };
};

export default function StudentResult() {
  const [student, setStudent] = useState<Student | null>(null);
  const [completeData, setCompleteData] = useState<CompleteStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { tests, setTests } = useTests();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper: normalize booking status
  const normalizeBooking = (val: any): BookingStatus => {
    if (!val) return null;
    return String(val).toLowerCase();
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
            setStudent({
              firstName: profile.first_name || "",
              middleName: profile.middle_name || "",
              lastName: profile.last_name || "",
              email: profile.email || "",
              whatsappNumber: profile.whatsapp_number || profile.phone_number || "",
              city: profile.city || "",
              state: profile.state || "",
            });

            // Build tests array using API data (keep all relevant rows and history)
            const updatedTests: TestRow[] = [];

            // 1) Screening Test - show ALL attempts, not just latest
            const examSessions = data.data.exam_sessions || [];
            
            if (examSessions.length > 0) {
              // Sort by date oldest to newest
              examSessions.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              
              // Push each screening test attempt
              examSessions.forEach((exam: any, index: number) => {
                updatedTests.push({
                  id: 100 + index,
                  name: examSessions.length > 1 ? `Screening Test (Attempt ${index + 1})` : "Screening Test",
                  status: exam.is_passed ? "Pass" : "Fail",
                  score: exam.obtained_marks ?? "-",
                  action: exam.is_passed ? "Completed" : "Failed",
                  slotBooking: { status: null, scheduledTime: exam.date_of_test || "" },
                });
              });
            }

            // 2) Learning Round - push ALL attempts
const lrRounds = data.data.interview_learner_round || [];

// sort oldest -> newest so Attempt 1 is oldest
lrRounds.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

// Push each LR attempt as its own row (preserve history)
lrRounds.forEach((lr: any, index: number) => {
  const lrText = lr.learning_round_status || "";
  let lrAttemptStatus: "Pass" | "Fail" | "Pending" = "Pending";
  if (lrText.toLowerCase().includes("pass")) lrAttemptStatus = "Pass";
  else if (lrText.toLowerCase().includes("fail")) lrAttemptStatus = "Fail";

  updatedTests.push({
    id: 200 + index,
    name: `Learning Round (Attempt ${index + 1})`,
    status: lrAttemptStatus,
    score: null,
    action: lrAttemptStatus === "Pending" ? "slot-book" : "Completed",
    slotBooking: {
      status: normalizeBooking(lr.booking_status),
      scheduledTime: lr.scheduled_time || lr.scheduled_at || "",
    },
  });
});

// Determine latest LR status (used for CFR gating / placeholder)
const latestLR = lrRounds.length ? lrRounds[lrRounds.length - 1] : null;
let lrStatus: "Pass" | "Fail" | "Pending" = "Pending";
if (latestLR) {
  const lrText = latestLR.learning_round_status || "";
  if (lrText.toLowerCase().includes("pass")) lrStatus = "Pass";
  else if (lrText.toLowerCase().includes("fail")) lrStatus = "Fail";
}

// If there are no LR attempts but ANY screening test was passed, show a single pending LR row so student can book
const hasPassedScreening = examSessions.some((exam: any) => exam.is_passed);
if (lrRounds.length === 0 && hasPassedScreening) {
  updatedTests.push({
    id: 2,
    name: "Learning Round",
    status: lrStatus,
    score: null,
    action: "slot-book",
    slotBooking: {
      status: null,
      scheduledTime: "",
    },
  });
}

// 3) Cultural Fit Round - push ALL attempts
const cfrRounds = data.data.interview_cultural_fit_round || [];

// sort oldest -> newest
cfrRounds.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

// Push each CFR attempt as its own row (preserve history)
cfrRounds.forEach((cfr: any, index: number) => {
  const cfrText = cfr.cultural_fit_status || "";
  let cfrAttemptStatus: "Pass" | "Fail" | "Pending" = "Pending";
  if (cfrText.toLowerCase().includes("pass")) cfrAttemptStatus = "Pass";
  else if (cfrText.toLowerCase().includes("fail")) cfrAttemptStatus = "Fail";

  updatedTests.push({
    id: 300 + index,
    name: `Cultural Fit Round (Attempt ${index + 1})`,
    status: cfrAttemptStatus,
    score: null,
    action: cfrAttemptStatus === "Pending" ? "slot-book" : "Completed",
    slotBooking: {
      status: normalizeBooking(cfr.booking_status),
      scheduledTime: cfr.scheduled_time || cfr.scheduled_at || "",
    },
  });
});

// If LR passed and there are no CFR attempts yet, show a placeholder Pending CFR row so user can book
const latestCFR = cfrRounds.length ? cfrRounds[cfrRounds.length - 1] : null;
let cfrStatus: "Pass" | "Fail" | "Pending" = "Pending";
if (latestCFR) {
  const cfrText = latestCFR.cultural_fit_status || "";
  if (cfrText.toLowerCase().includes("pass")) cfrStatus = "Pass";
  else if (cfrText.toLowerCase().includes("fail")) cfrStatus = "Fail";
}

if (lrStatus === "Pass" && cfrRounds.length === 0) {
  updatedTests.push({
    id: 3,
    name: "Culture Fit Round",
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

    if (testName === "Learning Round") slotType = "LR";
    else if (testName === "Culture Fit Round") slotType = "CFR";

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
          <p className="text-gray-600">Track your test results and interview slot booking status.</p>
        </header>

        {/* Student Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <p>
              <span className="font-semibold">Name:</span> {student?.firstName || "-"} {student?.middleName || ""}{" "}
              {student?.lastName || ""}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {student?.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Phone Number:</span> {student?.whatsappNumber || "-"}
            </p>
            <p>
              <span className="font-semibold">State:</span> {student?.state || "-"}
            </p>
          </CardContent>
        </Card>

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
                    const slotStatus = normalizeBooking(test.slotBooking?.status);
                    const isSlotBooked = slotStatus === "booked" || slotStatus === "pending";
                    const isSlotCancelled = slotStatus === "cancelled";

                    // Check if any attempt of the same type has passed
                    const hasPassedAttempt = tests.some((t: TestRow) => {
                      if (test.name.includes("Screening Test") && t.name.includes("Screening Test")) {
                        return t.status === "Pass";
                      }
                      if (test.name.includes("Learning Round") && t.name.includes("Learning Round")) {
                        return t.status === "Pass";
                      }
                      if (test.name.includes("Cultural Fit Round") && t.name.includes("Cultural Fit Round")) {
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
                            ? new Date(test.slotBooking.scheduledTime).toLocaleTimeString("en-US", {
                                year:"numeric",
                                month:"2-digit",
                                day:"2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {/* Screening Test Actions - Only show Retest button for Fail */}
                          {test.name.includes("Screening Test") ? (
                            test.status === "Pass" ? (
                              <p className="text-gray-600">-</p>
                            ) : hasPassedAttempt ? (
                              <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed">
                                Retest
                              </Button>
                            ) : test.status === "Fail" ? (
                              <Button onClick={handleRetestNavigation} className="bg-orange-500 hover:bg-orange-600">
                                Retest
                              </Button>
                            ) : (
                              <p className="text-gray-600">-</p>
                            )
                          ) : (
                            /* Book/Reschedule for LR & CFR only */
                            <>
                              {test.status === "Pass" ? (
                                <p className="text-gray-600">-</p>
                              ) : hasPassedAttempt ? (
                                <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed" variant="outline">
                                  Reschedule
                                </Button>
                              ) : test.status === "Fail" ? (
                                <Button onClick={() => handleBooking(test.id, test.name)} variant="outline">
                                  Reschedule
                                </Button>
                              ) : (
                                <>
                                  {isSlotBooked && !isSlotCancelled ? (
                                    <Button onClick={() => handleBooking(test.id, test.name)} variant="outline">
                                      Reschedule
                                    </Button>
                                  ) : (
                                    <Button onClick={() => handleBooking(test.id, test.name)} className="bg-green-600 hover:bg-green-700">
                                      Book Slot
                                    </Button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-2 border">{test.score ?? "-"}</td>
                      </tr>
                    );
                  })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No test data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Congratulations Message - Only show if Offer Sent */}
        {completeData?.data.final_decisions?.length > 0 && 
         completeData.data.final_decisions
           .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
           ?.offer_letter_status?.toLowerCase() === "offer sent" && (
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">🎉 Congratulations!</CardTitle>
            </CardHeader>
            <CardContent>
              {completeData.data.final_decisions
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((decision: any, index: number) => (
                  index === 0 && ( // Show only the latest decision
                    <div key={decision.id} className="space-y-4">
                      <div className="rounded-lg p-4">
                        <p className="text-lg text-center text-gray-800 leading-relaxed">
                          🎊 Your offer letter has been sent successfully.
                               Please check your registered email for details regarding the next steps.
                        </p>
                      </div>
                      
                      {/* {decision.joining_date && (
                        <div className="rounded-lg p-3">
                          <p className="text-base">
                            <span className="font-semibold text-gray-700">Joining Date:</span>{" "}
                            <span className="text-green-700 font-semibold">
                              {new Date(decision.joining_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>
                      )} */}
                    </div>
                  )
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
