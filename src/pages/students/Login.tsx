import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { getStudentDataByEmail } from "@/utils/api";
import studentImage from '@/assets/student-login-image.png';
import {
  ADMISSIONS_EMAIL,
  ADMISSIONS_PHONE_DISPLAY,
  ADMISSIONS_PHONE_TEL,
} from "@/lib/const";

type Student = {
  id: number;
  name: string;
  lastname: string;
  phone: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  student?: Student;
};

export default function StudentLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  // All users (Admin, User, Student) login from this page
  const {
    user: googleUser,
    isAuthenticated,
    loading: googleLoading,
    renderGoogleSignInButton,
  } = useGoogleAuth({ skipAutoNavigation: true });
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasProcessedAuth, setHasProcessedAuth] = useState(false);

  // Render Google button when component mounts and Google auth is ready
  useEffect(() => {
    if (googleButtonRef.current && !googleLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        renderGoogleSignInButton("google-signin-button-student");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [googleLoading, renderGoogleSignInButton, isAuthenticated]);

  // Fetch student data by email (normalize axios/REST shapes)
  const studentData = async (email: string) => {
    try {
      const data = await getStudentDataByEmail(email);
      // getStudentDataByEmail returns axios response.data which itself
      // often contains a `data` field with payload. Normalize both.
      const payload = data?.data ?? data ?? null;
      return payload?.student ?? null;
    } catch (error) {
      console.error("Error fetching student data:", error);
      return null;
    }
  };

  // Handle Google authentication redirect for students
  useEffect(() => {
    // Skip if we've already processed authentication in this session
    if (hasProcessedAuth) {
      return;
    }

    if (!isAuthenticated) {
      console.log("❌ Not authenticated yet, waiting...");
      return;
    }
    if (!googleUser) {
      console.log("❌ googleUser is undefined, waiting...");
      return;
    }

    const processAuth = async () => {
      // Check if authToken and user are already stored by useGoogleAuth
      let authToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      // Always try to get Google credential first
      const googleCredential = sessionStorage.getItem("google_credential");

      // Check if this is a fresh login or page refresh
      // Fresh login will have google_credential in sessionStorage
      // Page refresh won't have it but will have authToken and user in localStorage
      const isFreshLogin = googleCredential !== null;
      const isExistingSession = authToken && storedUser && !isFreshLogin;

      // // If existing session without fresh login, this is a page refresh
      // // Don't process authentication again
      // if (isExistingSession) {
      //   console.log("⚠️ Existing session detected - skipping auto-navigation (page refresh)");
      //   setHasProcessedAuth(true);
      //   return;
      // }

      // If not a fresh login and no existing session, something is wrong
      if (!isFreshLogin && !authToken) {
        console.log(
          "⚠️ No fresh login and no existing session - this shouldn't happen",
        );
        setHasProcessedAuth(true);
        return;
      }

      // Check if we need to use Google credential
      if ((!authToken || authToken === "undefined") && googleCredential) {
        // Store Google JWT as authToken
        localStorage.setItem("authToken", googleCredential);
        authToken = googleCredential;

        // Parse Google token to verify it
        try {
          const tokenParts = googleCredential.split(".");
          const payload = JSON.parse(atob(tokenParts[1]));
        } catch (e) {
          console.error("❌ Error parsing Google token:", e);
        }
      } else if (authToken && authToken !== "undefined") {
        console.log("✅ Using backend token (Admin/User)");
      } else {
        console.error(
          "❌ No valid token available - neither backend nor Google credential",
        );
      }

      // Ensure student user data exists
      if (googleUser && !storedUser) {
        const studentUserData = {
          id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          profile_pic: googleUser.avatar,
          user_role_id: 3,
          role_name: "STUDENT",
        };
        localStorage.setItem("user", JSON.stringify(studentUserData));
        console.log("✅ Stored student user data");
      }

      // Determine user role and navigate accordingly
      const userRole = googleUser.role_id;
      const roleName = googleUser.role_name;

      if (
        userRole === 1 ||
        userRole === 2 ||
        roleName === "ADMIN" ||
        roleName === "USER"
      ) {
        // Admin/User - Navigate to dashboard
        console.log("✅ Admin/User detected - navigating to dashboard");
        localStorage.setItem("role", roleName || "user");
        localStorage.setItem("userRole", JSON.stringify(roleName));

        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${googleUser.name}`,
        });

        // Mark as processed and clear the credential
        setHasProcessedAuth(true);
        sessionStorage.removeItem("google_credential");

        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        // Student - fetch student data and route based on progress
        try {
          const apiResponse = await getStudentDataByEmail(googleUser.email);

          // Normalize payload: API usually returns { success, message, data: { student, exam_sessions, ... } }
          const payload = apiResponse?.data ?? apiResponse ?? null;

          // Persist the whole payload for later use
          localStorage.setItem("studentData", JSON.stringify(payload));

          // Extract student profile from payload
          const profile = payload?.student ?? payload ?? null;

          // student_id in API is `student_id` (not `id`)
          const studentId = profile?.student_id ?? profile?.id ?? googleUser.id;
          localStorage.setItem("studentId", String(studentId));

          localStorage.setItem("role", "student");
          localStorage.setItem("userRole", JSON.stringify("student"));

          // Derive progress flags from payload
          const registrationDone = Boolean(
            profile && profile.student_id && profile.dob && profile.gender,
          );

          // // instructionsDone isn't provided by API in this payload; keep false unless explicit
          // const instructionsDone = Boolean(payload?.student?.instructions_done ?? payload?.student?.instructionsDone ?? false);

          // testStarted: true if any exam_sessions exist
          const examSessions = Array.isArray(payload?.exam_sessions)
            ? payload.exam_sessions
            : [];
          const testStarted = examSessions.length > 0;

          // testCompleted: true if any exam_session shows submitted_at or is_passed
          const testCompleted = examSessions.some(
            (s: any) => testStarted || Boolean(s.is_passed),
          );

          console.log("Derived Flags:", {
            registrationDone,
            testStarted,
            // testCompleted
          });

          // allowRetest: default false; could be derived from payload.final_decisions or business rules
          const allowRetest = Boolean(payload?.allow_retest ?? false);

          // Persist flags for other hooks/pages
          // localStorage.setItem("registrationDone", registrationDone ? "true" : "false");
          localStorage.setItem(
            "registrationDone",
            registrationDone ? "true" : "false",
          );
          localStorage.setItem("testStarted", testStarted ? "true" : "false");
          localStorage.setItem("testCompleted", testStarted ? "true" : "false");
          localStorage.setItem("allowRetest", allowRetest ? "true" : "false");

          toast({
            title: getContent().successMessage,
            description: (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-active))]" />
                <span>Welcome back, {googleUser.name}! 🎉</span>
              </div>
            ),
            className: "bg-accent border-[hsl(var(--status-active))] text-accent-foreground",
          });

          // Mark as processed and clear the credential
          setHasProcessedAuth(true);
          sessionStorage.removeItem("google_credential");

          // Route based on derived flags (order matters)

          // if (!registrationDone) {
          //   navigate("/students/details/registration", { state: { googleEmail: googleUser.email } });
          //   return;
          // }

          console.log(registrationDone);

          if (!registrationDone) {
            navigate("/students/details/instructions", {
              state: { googleEmail: googleUser.email },
            });
            return;
          }

          if (testStarted && !testCompleted) {
            // If test already started (but not completed) send to start (which will forward to section)
            navigate("/students/test/start");
            return;
          }

          if (testCompleted && !allowRetest) {
            navigate("/students/final-result");
            return;
          }

          // Default fallback: instructions
          navigate("/students/details/instructions", {
            state: { googleEmail: googleUser.email },
          });
        } catch (err) {
          console.error("Error fetching student data:", err);
          // If API fails, still set minimal student info and send to instructions
          localStorage.setItem("studentData", JSON.stringify(null));
          localStorage.setItem("studentId", String(googleUser.id));
          localStorage.setItem("role", "student");
          localStorage.setItem("userRole", JSON.stringify("student"));
          setHasProcessedAuth(true);
          sessionStorage.removeItem("google_credential");
          navigate("/students/details/instructions", {
            state: { googleEmail: googleUser.email },
          });
        }
      }
    };

    void processAuth();
  }, [googleUser, isAuthenticated, navigate, hasProcessedAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const content = {
    english: {
      title: "Login",
      description: "Sign in with your Google account to continue.",
      successMessage: "Login Successful!",
      failureMessage: "Login Failed. Please try again.",
    },
    hindi: {
      title: "लॉगिन",
      description: "जारी रखने के लिए अपने Google खाते से साइन इन करें।",
      successMessage: "लॉगिन सफल!",
      failureMessage: "लॉगिन विफल। कृपया पुनः प्रयास करें।",
    },
    marathi: {
      title: "लॉगिन",
      description: "सुरू ठेवण्यासाठी आपल्या Google खात्याने साइन इन करा.",
      successMessage: "लॉगिन यशस्वी!",
      failureMessage: "लॉगिन अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    },
  };

  const getContent = () => {
    const lang = localStorage.getItem("selectedLanguage") || "english";
    switch (lang) {
      case "hindi":
        return content.hindi;
      case "marathi":
        return content.marathi;
      case "english":
      default:
        return content.english;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: LoginResponse = {
        success: true,
        student: {
          id: 105,
          name: formData.name,
          lastname: formData.lastname,
          phone: formData.phone,
        },
      };

      if (!data.success || !data.student) {
        throw new Error(data.message || "Login failed");
      }

      // Save student identifier
      localStorage.setItem("role", "student");
      localStorage.setItem("studentId", data.student.id.toString());

      toast({
        title: getContent().successMessage,
        description: (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-active))]" />
            <span>Welcome back, {data.student.name}! 🎉</span>
          </div>
        ),
        className: "bg-accent border-[hsl(var(--status-active))] text-accent-foreground",
      });

      navigate("/students/details/instructions");
    } catch (err: any) {
      toast({
        title: getContent().failureMessage,
        description: (
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span>{err.message}</span>
          </div>
        ),
        className: "bg-destructive/10 border-destructive text-destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image with Improved Contrast */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Darker gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-900/60 to-gray-900/70 z-[1]"></div>
        <img
          src={studentImage}
          alt="Students learning together at NavGurukul"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">Welcome to NavGurukul</h1>
          <p className="text-xl lg:text-2xl mb-4 drop-shadow-md">Empowering students through technology education</p>
          <p className="text-lg lg:text-xl drop-shadow-md">Join thousands of students on their learning journey</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 student-bg-light min-h-screen lg:min-h-0">
        <div className="w-full max-w-lg">
          {/* Branding Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-purple to-primary rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <User className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {getContent().title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {getContent().description}
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl border-2 border-border/50 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10 px-8 sm:px-10">
              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground" role="status" aria-label="Secure login badge">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Login</span>
              </div>

              {/* Divider */}
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">Sign in with Google</span>
                </div>
              </div>

              {/* Google Sign In Button Wrapper with Enhanced Styling */}
              <div className="mb-10">
                <div
                  id="google-signin-button-student"
                  ref={googleButtonRef}
                  className="w-full flex justify-center [&_button]:!min-h-[48px] [&_button]:!h-12 [&_button]:transition-all [&_button]:hover:shadow-md [&_button]:hover:scale-[1.02] [&_button]:active:scale-[0.98]"
                  role="button"
                  aria-label="Sign in with Google"
                ></div>
                {googleLoading && (
                  <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                )}
              </div>

              {/* Help Text - Friendlier and Better Spaced */}
              <div className="text-center space-y-3 text-sm pt-6 border-t border-border/50">
                <p className="text-muted-foreground font-medium">Having trouble signing in?</p>
                <div className="space-y-2">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Contact us at </span>
                    <a href={`mailto:${ADMISSIONS_EMAIL}`} className="font-semibold hover:text-primary transition-colors">
                      {ADMISSIONS_EMAIL}
                    </a>
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Call us at </span>
                    <a href={`tel:${ADMISSIONS_PHONE_TEL}`} className="font-semibold hover:text-primary transition-colors">
                      {ADMISSIONS_PHONE_DISPLAY}
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer - Powered by NavGurukul */}
          {/* <div className="text-center mt-8 px-4">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold text-primary">NavGurukul</span>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
