import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useTests } from "../../utils/TestContext";
import LogoutButton from "@/components/ui/LogoutButton";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import LanguageSelector from "@/components/ui/LanguageSelector";
import {
  getCompleteStudentData,
  getStudentDataByPhone,
  CompleteStudentData,
} from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { OfferLetterCard } from "./OfferLetterCard";
import Footer from "@/components/Footer";
import { useLanguage } from "@/routes/LaunguageContext";

interface Student {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  district: string;
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
  // Optional: when reattempt is locked due to 15-day cooldown after a fail
  cooldownUntil?: string | null;
};

export default function StudentResult() {
  const [student, setStudent] = useState<Student | null>(null);
  const [completeData, setCompleteData] = useState<CompleteStudentData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  // Used for live countdown timers on cooldown rows
  const [now, setNow] = useState<Date>(new Date());
  const { tests, setTests } = useTests();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { selectedLanguage } = useLanguage();
  const { signOut: googleSignOut } = useGoogleAuth();

  const handleLogout = () => {
    // Sign out from Google if authenticated
    try {
      googleSignOut();
    } catch (error) {
      console.error("Google sign out error:", error);
    }

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login page
    navigate("/students/login", { replace: true });
  };

  const getContent = () => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          title: "छात्र परिणाम",
          subtitle: "अपने परीक्षा परिणाम और साक्षात्कार स्लॉट बुकिंग स्थिति को ट्रैक करें।",
          studentDetails: "छात्र विवरण",
          name: "नाम:",
          email: "ईमेल:",
          phoneNumber: "फोन नंबर:",
          state: "राज्य:",
          testResults: "परीक्षा परिणाम और स्लॉट बुकिंग",
          stage: "चरण",
          status: "स्थिति",
          scheduledTime: "निर्धारित समय",
          actions: "कार्य",
          marks: "अंक",
          retest: "पुनः परीक्षा",
          bookSlot: "स्लॉट बुक करें",
          reschedule: "शेड्यूल देखें",
          viewDetails: "विवरण देखें",
          email2: "ईमेल:",
          helpline: "हेल्पलाइन:",
          issuesText: "परिणाम या स्लॉट बुकिंग से संबंधित किसी भी समस्या के लिए, प्रवेश सहायता से संपर्क करें।",
          scheduled: "शेड्यूल",
          pass: "उत्तीर्ण",
          fail: "अनुत्तीर्ण",
          pending: "लंबित",
        };
      case "marathi":
        return {
          title: "विद्यार्थी निकाल",
          subtitle: "तुमचे परीक्षेचे निकाल आणि मुलाखत स्लॉट बुकिंग स्थिती ट्रॅक करा.",
          studentDetails: "विद्यार्थी तपशील",
          name: "नाव:",
          email: "ईमेल:",
          phoneNumber: "फोन नंबर:",
          state: "राज्य:",
          testResults: "परीक्षा निकाल आणि स्लॉट बुकिंग",
          stage: "टप्पा",
          status: "स्थिती",
          scheduledTime: "नियोजित वेळ",
          actions: "क्रिया",
          marks: "गुण",
          retest: "पुन्हा परीक्षा",
          bookSlot: "स्लॉट बुक करा",
          reschedule: "शेड्यूल पहा",
          viewDetails: "तपशील पहा",
          email2: "ईमेल:",
          helpline: "हेल्पलाइन:",
          issuesText: "निकाल किंवा स्लॉट बुकिंगशी संबंधित कोणत्याही समस्यांसाठी, प्रवेश सहाय्यकडे संपर्क साधा.",
          scheduled: "शेड्यूल",
          pass: "उत्तीर्ण",
          fail: "अनुत्तीर्ण",
          pending: "प्रलंबित",
        };
      default: // English
        return {
          title: "Student Results",
          subtitle: "Track your test results and interview slot booking status.",
          studentDetails: "Student Details",
          name: "Name:",
          email: "Email:",
          phoneNumber: "Phone Number:",
          state: "State:",
          testResults: "Test Results & Slot Booking",
          stage: "Stage",
          status: "Status",
          scheduledTime: "Scheduled Time",
          actions: "Actions",
          marks: "Marks",
          retest: "Retest",
          bookSlot: "Book Slot",
          reschedule: "View Schchedule",
          viewDetails: "View Details",
          email2: "Email:",
          helpline: "Helpline:",
          issuesText: "For any issues related to results or slot booking, contact admissions support.",
          scheduled: "Scheduled",
          pass: "Pass",
          fail: "Fail",
          pending: "Pending",
        };
    }
  };

  const content = getContent();

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



  useEffect(() => {
    // Update "now" every second so countdown timers refresh
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Invisible history state approach to handle back button and refresh reliably
    const handlePopState = (event: PopStateEvent) => {
      // If the state we pushed is gone, it means they clicked back
      if (!event.state || !event.state.loggedIn) {
        handleLogout();
      }
    };

    window.addEventListener("popstate", handlePopState);

    // If there's no state flag, add it. This handles the initial land AND refreshes.
    // It doesn't change the URL, so it's invisible to the user.
    if (!window.history.state || !window.history.state.loggedIn) {
      window.history.pushState({ loggedIn: true }, "", window.location.pathname);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // 1. Check if data was passed via navigation state
        let data: any = location.state?.studentData;

        // 2. If not in state, try to find email and fetch fresh data
        if (!data) {
          const googleUser = localStorage.getItem("user");
          let email = "";
          let phone = "";
          let loginMethod: "email" | "phone" = "phone";

          // Detect actual login method - Google login stores google_credential in sessionStorage
          const googleCredential = sessionStorage.getItem("google_credential");
          if (googleCredential) {
            loginMethod = "email";
          } else {
            loginMethod = "phone";
          }

          if (googleUser) {
            try {
              const parsedUser = JSON.parse(googleUser);
              email = parsedUser.email;
              phone = parsedUser.mobile || parsedUser.phone || "";
            } catch (e) { }
          }

          // Always check studentData localStorage for phone number (more reliable for phone-based login)
          const savedApiPayload = localStorage.getItem("studentData");
          if (savedApiPayload) {
            try {
              const payload = JSON.parse(savedApiPayload);

              // Extract phone (prioritize if not already found)
              const payloadPhone = payload?.data?.student?.whatsapp_number ||
                payload?.data?.student?.phone_number ||
                payload?.student?.whatsapp_number ||
                payload?.student?.phone_number ||
                payload?.whatsapp_number ||
                payload?.phone_number || "";

              // Extract email (prioritize if not already found)
              const payloadEmail = payload?.data?.student?.email ||
                payload?.student?.email ||
                payload?.email || "";

              // Use payload values if not found in user localStorage
              if (!phone && payloadPhone) {
                phone = payloadPhone;
                // console.log(" Found phone in studentData:", phone);
              }
              if (!email && payloadEmail) {
                email = payloadEmail;
              }

              // If we found NO email/phone but HAVE cached data, use the cached data as fallback
              if (!email && !phone && payload) {
                data = payload;
              }
            } catch (e) { }
          }

          // Fetch fresh data if we have email or phone
          if (!data) {
            // PRIORITY 1: Use the method that was actually used for login
            if (loginMethod === "email" && email) {
              try {
                data = await getCompleteStudentData(email);
              } catch (emailError: any) {
                // Fallback to phone if email fails and phone is available
                if (phone) {
                  try {
                    data = await getStudentDataByPhone(phone);
                  } catch (phoneError: any) {
                    throw emailError; // Throw original email error
                  }
                } else {
                  throw emailError;
                }
              }
            } else if (loginMethod === "phone" && phone) {
              try {
                data = await getStudentDataByPhone(phone);
              } catch (phoneError: any) {
                // Fallback to email if phone fails and email is available
                if (email) {
                  try {
                    data = await getCompleteStudentData(email);
                  } catch (emailError: any) {
                    throw phoneError; // Throw original phone error
                  }
                } else {
                  throw phoneError; // No email to fallback to
                }
              }
            } else {
              // Fallback: If no identifier matches login method, try what's available
              if (phone) {
                data = await getStudentDataByPhone(phone);
              } else if (email) {
                data = await getCompleteStudentData(email);
              }
            }
          }
        }

        // 3. Process the data (either fetched or cached)
        if (data) {
          setCompleteData(data);

          // Handle multiple response structures from getByPhone, getByEmail, or getCompleteStudentData
          const profile = data?.data?.student || data?.student || data;

          // Extract student info with fallbacks for different field naming conventions
          if (profile) {
            const studentInfo = {
              firstName: profile.first_name || profile.firstName || "",
              middleName: profile.middle_name || profile.middleName || "",
              lastName: profile.last_name || profile.lastName || "",
              email: profile.email || "",
              whatsappNumber:
                profile.whatsapp_number || profile.whatsappNumber ||
                profile.phone_number || profile.phoneNumber ||
                profile.mobile || "",
              district: profile.district || "",
              state: profile.state || "",
            };
            setStudent(studentInfo);

            // Build tests array using API data (keep all relevant rows and history)
            const updatedTests: TestRow[] = [];

            // 1) Screening Test - show ALL attempts, not just latest
            const examSessions = data?.data?.exam_sessions || data?.exam_sessions || [];

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
              (exam: any) => exam.status && String(exam.status).toLowerCase().includes("pass"),
            );

            // Helper function to find schedule by attempt number from title
            // Title format: "Learning Round - Interview" (attempt 1) or "Learning Round (Attempt 2) - Interview"
            const findScheduleByAttempt = (
              schedules: any[],
              roundType: "LR" | "CFR",
              attemptNumber: number
            ): any | null => {
              const roundName = roundType === "LR" ? "Learning Round" : "Cultural Fit Round";

              // Filter schedules that match this attempt number and are not cancelled
              const matchingSchedules = schedules.filter((s: any) => {
                const title = s.title || "";
                const status = s.status?.toLowerCase();

                // Skip cancelled schedules
                if (status === "cancelled") return false;

                if (attemptNumber === 1) {
                  // For attempt 1, match titles without "(Attempt X)" or with "(Attempt 1)"
                  const hasAttemptNumber = /\(Attempt \d+\)/i.test(title);
                  if (!hasAttemptNumber && title.includes(roundName)) return true;
                  if (/\(Attempt 1\)/i.test(title)) return true;
                  return false;
                } else {
                  // For attempt N, match titles with "(Attempt N)"
                  const attemptPattern = new RegExp(`\\(Attempt ${attemptNumber}\\)`, "i");
                  return attemptPattern.test(title);
                }
              });

              // Return the last matching schedule (most recent)
              if (matchingSchedules.length > 0) {
                return matchingSchedules[matchingSchedules.length - 1];
              }

              return null;
            };

            // 2) Learning Round - Rows ONLY created from interview_learner_round
            const lrRounds = data?.data?.interview_learner_round || [];
            const lrSchedules = data?.data?.interview_schedules_lr || [];

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

              // Find schedule by attempt number using title matching
              const attemptNumber = index + 1;
              const matchingSchedule = findScheduleByAttempt(lrSchedules, "LR", attemptNumber);

              // Determine scheduled time from API schedule
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
              } else {
                scheduledTime = lr.scheduled_time || lr.scheduled_at || "";
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

            // Determine latest LR status (used for CFR gating and cooldown)
            const latestLR =
              lrRounds.length > 0 ? lrRounds[lrRounds.length - 1] : null;
            let lrStatus: "Pass" | "Fail" | "Pending" = "Pending";
            if (latestLR) {
              const lrText = latestLR.learning_round_status || "";
              if (lrText.toLowerCase().includes("pass")) lrStatus = "Pass";
              else if (lrText.toLowerCase().includes("fail")) lrStatus = "Fail";
            }

            // Compute 15-day cooldown end time after latest LR fail
            let lrFailCooldownUntil: string | null = null;
            if (lrStatus === "Fail" && latestLR?.created_at) {
              const failDate = new Date(latestLR.created_at);
              const cooldownEnd = new Date(failDate);
              cooldownEnd.setDate(cooldownEnd.getDate() + 15);
              lrFailCooldownUntil = cooldownEnd.toISOString();
            }

            // If screening passed but no LR rounds exist, create placeholder row
            if (hasPassedScreening && lrRounds.length === 0) {
              // Find schedule for attempt 1 using title matching
              const bookedSlotInfo = findScheduleByAttempt(lrSchedules, "LR", 1);

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
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
            const cfrRounds = data?.data?.interview_cultural_fit_round || [];
            const cfrSchedules = data?.data?.interview_schedules_cfr || [];

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

              // Find schedule by attempt number using title matching
              const attemptNumber = index + 1;
              const matchingSchedule = findScheduleByAttempt(cfrSchedules, "CFR", attemptNumber);

              // Determine scheduled time from API schedule
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
              } else {
                scheduledTime = cfr.scheduled_time || cfr.scheduled_at || "";
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

            // Determine latest CFR status (for gating and cooldown)
            const latestCFR =
              cfrRounds.length > 0 ? cfrRounds[cfrRounds.length - 1] : null;
            let cfrStatus: "Pass" | "Fail" | "Pending" = "Pending";
            if (latestCFR) {
              const cfrText = latestCFR.cultural_fit_status || "";
              if (cfrText.toLowerCase().includes("pass")) cfrStatus = "Pass";
              else if (cfrText.toLowerCase().includes("fail"))
                cfrStatus = "Fail";
            }

            // Compute 15-day cooldown end time after latest CFR fail
            let cfrFailCooldownUntil: string | null = null;
            if (cfrStatus === "Fail" && latestCFR?.created_at) {
              const failDate = new Date(latestCFR.created_at);
              const cooldownEnd = new Date(failDate);
              cooldownEnd.setDate(cooldownEnd.getDate() + 15);
              cfrFailCooldownUntil = cooldownEnd.toISOString();
            }

            // If latest LR passed and no CFR rounds exist, create placeholder row
            if (lrStatus === "Pass" && cfrRounds.length === 0) {
              // Find schedule for attempt 1 using title matching
              const bookedSlotInfo = findScheduleByAttempt(cfrSchedules, "CFR", 1);

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
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

            // If latest LR failed, create new LR placeholder for rebooking (with 15-day cooldown)
            if (lrStatus === "Fail") {
              const nextAttemptNumber = lrRounds.length + 1;
              // Find schedule for next attempt using title matching
              const bookedSlotInfo = findScheduleByAttempt(lrSchedules, "LR", nextAttemptNumber);

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
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

              const hasTimePassed = scheduledTime
                ? new Date(scheduledTime) < new Date()
                : false;

              updatedTests.push({
                id: 200 + lrRounds.length,
                name: `Learning Round (Attempt ${nextAttemptNumber})`,
                status: "Pending",
                score: null,
                action: hasTimePassed ? "Completed" : "slot-book",
                slotBooking: {
                  status: slotStatus,
                  scheduledTime: scheduledTime,
                },
                cooldownUntil: lrFailCooldownUntil,
              });
            }

            // If latest CFR failed, create new CFR placeholder for rebooking (with 15-day cooldown)
            if (cfrStatus === "Fail") {
              const nextAttemptNumber = cfrRounds.length + 1;
              // Find schedule for next attempt using title matching
              const bookedSlotInfo = findScheduleByAttempt(cfrSchedules, "CFR", nextAttemptNumber);

              let scheduledTime = "";
              let slotStatus: BookingStatus = null;

              if (bookedSlotInfo) {
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

              const hasTimePassed = scheduledTime
                ? new Date(scheduledTime) < new Date()
                : false;

              updatedTests.push({
                id: 300 + cfrRounds.length,
                name: `Cultural Fit Round(Attempt ${nextAttemptNumber})`,
                status: "Pending",
                score: null,
                action: hasTimePassed ? "Completed" : "slot-book",
                slotBooking: {
                  status: slotStatus,
                  scheduledTime: scheduledTime,
                },
                cooldownUntil: cfrFailCooldownUntil,
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
          title: "❌ Unable to Load Data",
          description: getFriendlyErrorMessage(error),
          className: "border-red-500 bg-red-50 text-red-900"
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
    localStorage.setItem("registrationDone", "true");

    navigate("/students/test/start", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center student-bg-gradient">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading student data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen student-bg-gradient p-4 flex flex-col">
      <div className="flex-1 flex">
        <div className="bg-card rounded-t-md shadow-2xl p-6 w-full overflow-y-auto">
          <header className="mb-6 mt-14 md:mt-0 px-1 sm:px-0">
            <LanguageSelector />
            <LogoutButton />
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl hidden sm:block">
                 <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{content.title}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 font-medium">
                  {content.subtitle}
                </p>
              </div>
            </div>
          </header>

          {/* Student Details */}
          <Card className="mb-6 border-transparent sm:border-border shadow-lg sm:shadow-sm mx-0 sm:mx-0 overflow-hidden bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-4 px-5 sm:px-6 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {content.studentDetails}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm md:text-base px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-center gap-4 bg-background sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-border/50 sm:border-transparent shadow-sm sm:shadow-none">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <User className="w-5 h-5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest sm:normal-case sm:tracking-normal mb-0.5">{content.name}</span>
                  <span className="font-semibold sm:font-medium text-foreground truncate">{student?.firstName || "-"} {student?.middleName || ""} {student?.lastName || ""}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-background sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-border/50 sm:border-transparent shadow-sm sm:shadow-none">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-full text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className="text-[11px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest sm:normal-case sm:tracking-normal mb-0.5">{content.email}</span>
                  <span className="font-semibold sm:font-medium text-foreground truncate block w-full">{student?.email || "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-background sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-border/50 sm:border-transparent shadow-sm sm:shadow-none">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-full text-green-600 dark:text-green-400 flex-shrink-0">
                  <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest sm:normal-case sm:tracking-normal mb-0.5">{content.phoneNumber}</span>
                  <span className="font-semibold sm:font-medium text-foreground truncate">{student?.whatsappNumber || "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-background sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-border/50 sm:border-transparent shadow-sm sm:shadow-none">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-full text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest sm:normal-case sm:tracking-normal mb-0.5">{content.state}</span>
                  <span className="font-semibold sm:font-medium text-foreground truncate">{student?.state ? student.state : "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Congratulations Message - Only show if Offer Sent */}
          {completeData?.data?.final_decisions?.length > 0 &&
            completeData.data.final_decisions
              .sort(
                (a: any, b: any) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )[0]
              ?.offer_letter_status?.toLowerCase() === "offer sent" && (
              <OfferLetterCard student={completeData.data?.student} />
            )}

          {/* Test Results & Slot Booking */}
          <Card className="border-transparent sm:border-border shadow-lg sm:shadow-sm mx-0 sm:mx-0 overflow-hidden bg-gradient-to-br from-card to-muted/10">
            <CardHeader className="pb-4 px-5 sm:px-6 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {content.testResults}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-5 sm:py-6">
              <div className="w-full">
                <table className="w-full border-collapse text-left">
                  <thead className="hidden md:table-header-group bg-muted text-sm border border-border rounded-t-lg overflow-hidden">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs border-r border-border/50">{content.stage}</th>
                      <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs border-r border-border/50">{content.status}</th>
                      <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs border-r border-border/50">{content.scheduledTime}</th>
                      <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs border-r border-border/50">{content.actions}</th>
                      <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs">{content.marks}</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
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

                        // Check if 15-day cooldown after latest fail is active (for LR/CFR)
                        let isCooldownActive = false;
                        let remainingText: string | null = null;
                        if (test.cooldownUntil) {
                          const cooldownEnd = new Date(test.cooldownUntil);
                          if (cooldownEnd > now) {
                            isCooldownActive = true;
                            const diffMs = cooldownEnd.getTime() - now.getTime();
                            const totalSeconds = Math.max(
                              0,
                              Math.floor(diffMs / 1000),
                            );
                            const days = Math.floor(totalSeconds / (24 * 3600));
                            const hours = Math.floor(
                              (totalSeconds % (24 * 3600)) / 3600,
                            );
                            const minutes = Math.floor(
                              (totalSeconds % 3600) / 60,
                            );
                            const seconds = totalSeconds % 60;

                            if (days > 0) {
                              remainingText = `${days} day${
                                days === 1 ? "" : "s"
                                } ${hours.toString().padStart(2, "0")}:${minutes
                                  .toString()
                                  .padStart(2, "0")}:${seconds
                                    .toString()
                                    .padStart(2, "0")}`;
                            } else {
                              remainingText = `${hours
                                .toString()
                                .padStart(2, "0")}:${minutes
                                  .toString()
                                  .padStart(2, "0")}:${seconds
                                    .toString()
                                    .padStart(2, "0")}`;
                            }
                          }
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
                          <tr key={test.id} className="block md:table-row bg-background md:bg-card border border-border/60 md:border md:border-border rounded-2xl md:rounded-none mb-6 md:mb-0 hover:bg-muted/30 overflow-hidden shadow-lg shadow-black/5 md:shadow-none relative transition-all">
                            {/* Mobile decorative edge indicator */}
                            <div className={`md:hidden absolute left-0 top-0 bottom-0 w-1.5 ${
                              test.status === "Pass" ? "bg-green-500" : test.status === "Fail" ? "bg-red-500" : isSlotBooked && test.slotBooking?.scheduledTime ? "bg-blue-500" : "bg-yellow-500"
                            }`} />
                            
                            <td className="block md:table-cell px-5 pt-5 pb-3 md:py-4 border-b border-border/20 md:border-none md:border-b md:border-border/60 text-base md:text-sm font-bold md:font-medium">
                              <div className="flex justify-between items-start md:block ml-1 md:ml-0">
                                <span className="text-left text-foreground flex items-center md:items-start gap-2 max-w-[70%]">
                                  <span className="md:hidden text-muted-foreground/50 opacity-0 absolute">Row</span>
                                  {test.name}
                                  {test.score && (
                                     <span className="md:hidden inline-flex items-center ml-2 bg-muted/50 px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground uppercase">{content.marks}: {test.score}</span>
                                  )}
                                </span>
                                
                                {/* Mobile Status Badge */}
                                <div className="md:hidden flex-shrink-0">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 border ${
                                      test.status === "Pass"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : test.status === "Pending"
                                          ? isSlotBooked && test.slotBooking?.scheduledTime
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      }`}
                                  >
                                    {test.status === "Pass" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {test.status === "Fail" && <XCircle className="w-3.5 h-3.5" />}
                                    {test.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                                    {test.status === "Pending" && isSlotBooked && test.slotBooking?.scheduledTime
                                      ? content.scheduled
                                      : test.status === "Pass"
                                        ? content.pass
                                        : test.status === "Fail"
                                          ? content.fail
                                          : content.pending}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="hidden md:table-cell px-5 py-4 md:border-b border-border/60 text-sm">
                              <span
                                className={`px-2.5 py-1 rounded-md text-sm font-semibold flex-shrink-0 inline-flex items-center gap-1 border ${test.status === "Pass"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : test.status === "Pending"
                                    ? isSlotBooked && test.slotBooking?.scheduledTime
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                              >
                                {test.status === "Pass" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {test.status === "Fail" && <XCircle className="w-3.5 h-3.5" />}
                                {test.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                                {test.status === "Pending" && isSlotBooked && test.slotBooking?.scheduledTime
                                  ? content.scheduled
                                  : test.status === "Pass"
                                    ? content.pass
                                    : test.status === "Fail"
                                      ? content.fail
                                      : content.pending}
                              </span>
                            </td>

                            <td className="flex md:table-cell items-center gap-3 px-5 py-3 md:py-4 border-b border-border/20 md:border-b md:border-border/60 text-sm">
                              <Calendar className="w-4 h-4 md:hidden text-muted-foreground/70 ml-1 flex-shrink-0" />
                              <span className="text-left text-muted-foreground md:text-foreground font-medium md:font-normal">
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
                                  : <span className="italic opacity-70">Not Scheduled</span>}
                              </span>
                            </td>

                            <td className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center md:table-cell px-5 pt-3 pb-5 md:py-4 md:border-b md:border-border/60 text-sm">
                              <div className="w-full sm:w-auto text-left relative z-10 ml-1 md:ml-0">
                                <span className="md:hidden block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{content.actions}</span>
                                {/* Screening Test Actions - Only show Retest button for Fail */}
                                {test.name.includes("Screening Test") ? (
                                  test.status === "Pass" ? (
                                    <p className="text-muted-foreground font-medium">-</p>
                                  ) : hasPassedAttempt ? (
                                    <Button
                                      disabled
                                      className="bg-secondary/50 text-muted-foreground cursor-not-allowed w-full sm:w-auto font-medium shadow-none h-11 md:h-9"
                                    >
                                      {content.retest}
                                    </Button>
                                  ) : test.status === "Fail" ? (
                                    <Button
                                      onClick={handleRetestNavigation}
                                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto font-semibold shadow-md md:shadow-sm h-11 md:h-9 active:scale-[0.98] transition-all"
                                    >
                                      {content.retest}
                                    </Button>
                                  ) : (
                                    <p className="text-muted-foreground font-medium">-</p>
                                  )
                                ) : (
                                  /* Book/Reschedule for LR & CFR only */
                                  <div className="w-full">
                                    {/* If completed (Pass/Fail), show nothing */}
                                    {test.action === "Completed" ? (
                                      <p className="text-muted-foreground font-medium">-</p>
                                    ) : isCooldownActive ? (
                                      <div className="flex flex-col gap-2">
                                        <Button
                                          disabled
                                          className="bg-secondary/50 text-muted-foreground cursor-not-allowed w-full sm:w-auto shadow-none h-11 md:h-9"
                                          variant="outline"
                                        >
                                          {content.bookSlot}
                                        </Button>
                                        <p className="text-[11px] md:text-xs text-destructive/90 bg-destructive/5 p-2 rounded-md leading-relaxed border border-destructive/10">
                                          You can book the slot after{" "}
                                          <span className="font-bold">{remainingText || "15 days"}</span>
                                          {" "}Till then please practice.
                                        </p>
                                      </div>
                                    ) : hasPassedAttempt ? (
                                      /* If another attempt passed, disable button */
                                      <Button
                                        disabled
                                        className="bg-secondary/50 text-muted-foreground cursor-not-allowed w-full sm:w-auto shadow-none h-11 md:h-9"
                                        variant="outline"
                                      >
                                        {isSlotBooked ? content.reschedule : content.bookSlot}
                                      </Button>
                                    ) : hasTimePassed && !isSlotCompleted ? (
                                      /* If time passed but not completed, disable (awaiting result) */
                                      <Button
                                        disabled
                                        className="bg-secondary/50 text-muted-foreground cursor-not-allowed w-full sm:w-auto whitespace-normal h-auto py-3 md:py-2 px-4 shadow-none font-medium border-dashed"
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
                                        className="w-full sm:w-auto border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold h-11 md:h-9 active:scale-[0.98] transition-all"
                                      >
                                        {content.reschedule}
                                      </Button>
                                    ) : (
                                      /* Default: Show Book Slot */
                                      <Button
                                        onClick={() =>
                                          handleBooking(test.id, test.name)
                                        }
                                        className="bg-[hsl(var(--status-active))] hover:bg-[hsl(var(--status-active))]/90 w-full sm:w-auto font-semibold border-0 shadow-md md:shadow-sm h-11 md:h-9 text-white active:scale-[0.98] transition-all"
                                      >
                                        {content.bookSlot}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Desktop only marks - Mobile marks are moved to the top header for cleaner look */}
                            <td className="hidden md:table-cell px-5 py-4 border-b border-border/60 text-sm">
                              <span className="font-semibold px-3 py-1 bg-muted/30 rounded-md block w-max">{test.score ?? "-"}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="block md:table-row border border-border md:border-none rounded-xl md:rounded-none md:border-b">
                        <td
                          colSpan={5}
                          className="block md:table-cell px-4 py-12 text-center text-muted-foreground text-sm md:text-base bg-muted/10 md:bg-transparent rounded-xl md:rounded-none"
                        >
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <span className="text-4xl md:text-5xl opacity-50">📄</span>
                            <span className="font-medium">No test data available</span>
                          </div>
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
      {/* Footer sits outside the white card */}
      <Footer />
    </div>
  );
}
