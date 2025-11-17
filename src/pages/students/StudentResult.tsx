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

export default function StudentResult() {
  const [student, setStudent] = useState<Student | null>(null);
  const [completeData, setCompleteData] = useState<CompleteStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { tests, setTests } = useTests();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load student from localStorage and fetch complete data from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Get email from localStorage or googleUser
        const googleUser = localStorage.getItem("user");
        let email = "";
        
        if (googleUser) {
          const parsedUser = JSON.parse(googleUser);
          email = parsedUser.email;
        }
        
        if (!email) {
          // Try to get from studentData
          const savedApiPayload = localStorage.getItem("studentData");
          if (savedApiPayload) {
            const payload = JSON.parse(savedApiPayload);
            email = payload?.student?.email || payload?.email || "";
          }
        }
        
        if (email) {
          // Fetch complete student data from API
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
            
            // Update tests array based on API data
            const updatedTests = [];
            
            // 1. Screening Test - Get latest exam session (by created_at or id)
            const examSessions = data.data.exam_sessions || [];
            const latestExam = examSessions.length > 0 
              ? examSessions.reduce((latest, current) => 
                  new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                )
              : null;
            
            if (latestExam) {
              updatedTests.push({
                id: 1,
                name: "Screening Test",
                status: latestExam.is_passed ? "Pass" : "Fail",
                score: latestExam.obtained_marks,
                action: latestExam.is_passed ? "Completed" : "Failed",
                slotBooking: { status: null, scheduledTime: "" },
              });
            }
            
            // 2. Learning Round - Get latest LR status
            if (latestExam?.is_passed) {
              const lrRounds = data.data.interview_learner_round || [];
              const latestLR = lrRounds.length > 0
                ? lrRounds.reduce((latest, current) => 
                    new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                  )
                : null;
              
              // Determine LR status
              let lrStatus: "Pass" | "Fail" | "Pending" = "Pending";
              if (latestLR) {
                if (latestLR.learning_round_status?.includes("Pass")) {
                  lrStatus = "Pass";
                } else if (latestLR.learning_round_status?.includes("Fail")) {
                  lrStatus = "Fail";
                }
              }
              
              updatedTests.push({
                id: 2,
                name: "Learning Round",
                status: lrStatus,
                score: null,
                action: lrStatus === "Pending" ? "slot-book" : "Completed",
                slotBooking: { 
                  status: latestLR ? (lrStatus === "Pending" ? "Booked" : "Completed") : "Pending",
                  scheduledTime: ""
                },
              });
            }
            
            // 3. Cultural Fit Round - Only show if LR is passed
            const lrRounds = data.data.interview_learner_round || [];
            const latestLR = lrRounds.length > 0
              ? lrRounds.reduce((latest, current) => 
                  new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                )
              : null;
            
            const isLRPassed = latestLR?.learning_round_status?.includes("Pass");
            
            if (isLRPassed) {
              const cfrRounds = data.data.interview_cultural_fit_round || [];
              const latestCFR = cfrRounds.length > 0
                ? cfrRounds.reduce((latest, current) => 
                    new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                  )
                : null;
              
              // Determine CFR status
              let cfrStatus: "Pass" | "Fail" | "Pending" = "Pending";
              if (latestCFR) {
                if (latestCFR.cultural_fit_status?.includes("Pass")) {
                  cfrStatus = "Pass";
                } else if (latestCFR.cultural_fit_status?.includes("Fail")) {
                  cfrStatus = "Fail";
                }
              }
              
              updatedTests.push({
                id: 3,
                name: "Culture Fit Round",
                status: cfrStatus,
                score: null,
                action: cfrStatus === "Pending" ? "slot-book" : "Completed",
                slotBooking: { 
                  status: latestCFR ? (cfrStatus === "Pending" ? "Booked" : "Completed") : "Pending",
                  scheduledTime: ""
                },
              });
            }
            
            // Update tests context
            if (updatedTests.length > 0) {
              setTests(updatedTests);
            }
          }
        } else {
          // Fallback to localStorage if no email found
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
    // Determine slot_type based on test name
    let slotType: "LR" | "CFR" | undefined;
    
    if (testName === "Learning Round") {
      slotType = "LR";
    } else if (testName === "Culture Fit Round") {
      slotType = "CFR";
    }
    
    // Navigate with state containing slot_type
    navigate(`/students/slot-booking/${testId}`, { 
      state: { slot_type: slotType } 
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
              <span className="font-semibold">Name:</span> {student.firstName}{" "}
              {student.middleName} {student.lastName}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {student.email}
            </p>
            <p>
              <span className="font-semibold">Phone Number:</span>{" "}
              {student.whatsappNumber}
            </p>
            <p>
              <span className="font-semibold">State:</span> {student.state || "-"}
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
                  {tests.map((test) => {
                    // Get slot booking status
                    const slotStatus = test.slotBooking?.status;
                    const isSlotBooked = slotStatus === "Booked";
                    const isSlotCancelled = slotStatus === "Cancelled";
                    const hasSlotBooking = test.slotBooking !== undefined;

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
                                test.slotBooking.scheduledTime
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {/* Action button for Screening Test */}
                          {test.name === "Screening Test" &&
                            (test.status === "Fail" ? (
                              <Button
                                onClick={handleRetestNavigation}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                Retest
                              </Button>
                            ) : (
                              <p
                                className="text-gray-600"
                              >
                                -
                              </p>
                            ))}

                          {/* Book/Reschedule button for passed tests */}
                          {test.name !== "Screening Test" && test.status === "Pending" && (
                            <>
                              {isSlotBooked || isSlotCancelled ? (
                                <Button
                                  onClick={() => handleBooking(test.id, test.name)}
                                  variant="outline"
                                >
                                  Reschedule
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleBooking(test.id, test.name)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Book Slot
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-2 border">
                          {test.score || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Exam History - Show if multiple attempts */}
        {completeData && completeData.data.exam_sessions?.length > 1 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Screening Test History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completeData.data.exam_sessions
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((exam, index) => (
                    <div 
                      key={exam.id} 
                      className={`p-4 rounded-lg border ${
                        exam.is_passed 
                          ? "bg-green-50 border-green-200" 
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-700">
                          Attempt {completeData.data.exam_sessions.length - index}
                        </span>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          exam.is_passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {exam.is_passed ? "Pass" : "Fail"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Score:</span> {exam.obtained_marks} / {exam.total_marks} 
                        {exam.percentage > 0 && ` (${exam.percentage.toFixed(1)}%)`}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(exam.date_of_test).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {exam.exam_centre && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Exam Centre:</span> {exam.exam_centre}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview History & Comments */}
        {completeData && (completeData.data.interview_learner_round?.length > 0 || completeData.data.interview_cultural_fit_round?.length > 0) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Interview History & Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Round History */}
              {completeData.data.interview_learner_round?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Learning Round Attempts</h3>
                  <div className="space-y-3">
                    {completeData.data.interview_learner_round
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((round, index) => (
                        <div 
                          key={round.id} 
                          className={`p-4 rounded-lg border ${
                            round.learning_round_status?.includes("Pass") 
                              ? "bg-green-50 border-green-200" 
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-gray-700">
                              Attempt {completeData.data.interview_learner_round.length - index}
                            </span>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              round.learning_round_status?.includes("Pass")
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {round.learning_round_status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(round.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {round.comments && (
                            <p className="text-sm text-gray-700 mt-2">
                              <span className="font-medium">Feedback:</span> {round.comments}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Cultural Fit Round History */}
              {completeData.data.interview_cultural_fit_round?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Cultural Fit Round Attempts</h3>
                  <div className="space-y-3">
                    {completeData.data.interview_cultural_fit_round
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((round, index) => (
                        <div 
                          key={round.id} 
                          className={`p-4 rounded-lg border ${
                            round.cultural_fit_status?.includes("Pass") 
                              ? "bg-green-50 border-green-200" 
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-gray-700">
                              Attempt {completeData.data.interview_cultural_fit_round.length - index}
                            </span>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              round.cultural_fit_status?.includes("Pass")
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {round.cultural_fit_status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(round.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {round.comments && (
                            <p className="text-sm text-gray-700 mt-2">
                              <span className="font-medium">Feedback:</span> {round.comments}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Congratulations Message - Only show if Offer Sent */}
        {completeData?.data.final_decisions?.length > 0 && 
         completeData.data.final_decisions
           .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
           ?.offer_letter_status?.toLowerCase() === "offer sent" && (
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">🎉 Congratulations!</CardTitle>
            </CardHeader>
            <CardContent>
              {completeData.data.final_decisions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((decision, index) => (
                  index === 0 && ( // Show only the latest decision
                    <div key={decision.id} className="space-y-4">
                      <div className="rounded-lg p-4">
                        <p className="text-lg text-center text-gray-800 leading-relaxed">
                          🎊 Please check your email, your offer letter has been sent!
                        </p>
                      </div>
                      
                      {decision.joining_date && (
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
                      )}
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
