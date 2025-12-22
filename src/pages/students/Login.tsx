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
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

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
          title: "✅ Welcome!",
          description: `Successfully signed in as ${googleUser.name}`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900"
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
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Welcome back, {googleUser.name}! 🎉</span>
              </div>
            ),
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900"
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
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>Welcome back, {data.student.name}! 🎉</span>
          </div>
        ),
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });

      navigate("/students/details/instructions");
    } catch (err: any) {
      toast({
        title: getContent().failureMessage,
        description: (
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span>{getFriendlyErrorMessage(err)}</span>
          </div>
        ),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {getContent().title}
            </CardTitle>
          </div>
          <CardDescription>{getContent().description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In Button */}
          <div
            id="google-signin-button-student"
            ref={googleButtonRef}
            className="w-full flex justify-center"
          ></div>
        </CardContent>
      </Card>
    </div>
  );
}
