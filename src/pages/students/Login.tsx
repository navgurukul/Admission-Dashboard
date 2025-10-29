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
  const { user: googleUser, isAuthenticated, loading: googleLoading, renderGoogleSignInButton } = useGoogleAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  // Render Google button when component mounts and Google auth is ready
  useEffect(() => {
    if (googleButtonRef.current && !googleLoading) {
      const timer = setTimeout(() => {
        renderGoogleSignInButton('google-signin-button-student');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [googleLoading, renderGoogleSignInButton]);

  // Handle Google authentication redirect
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!googleUser) return;

    // Save student identifier from Google user
    localStorage.setItem("role", "student");
    localStorage.setItem("studentId", googleUser.id);

    toast({
      title: getContent().successMessage,
      description: (
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>Welcome back, {googleUser.name}! 🎉</span>
        </div>
      ),
      className: "bg-green-50 border-green-500 text-green-800",
    });

    navigate("/students/details/instructions");
  }, [googleUser, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const content = {
    english: {
      title: "Student Login",
      description: "Sign in with your name and phone number to continue",
      namePlaceholder: "Enter your name",
      lastnamePlaceholder: "Enter your last name",
      phonePlaceholder: "Enter your phone number",
      signInButton: "Sign In",
      successMessage: "Login Successful! ",
      failureMessage: "Login Failed. Please try again.",
    },
    hindi: {
      title: "छात्र लॉगिन",
      description: "जारी रखने के लिए अपना नाम और फोन नंबर दर्ज करें",
      namePlaceholder: "अपना नाम दर्ज करें",
      lastnamePlaceholder: "अपना उपनाम दर्ज करें",
      phonePlaceholder: "अपना फोन नंबर दर्ज करें",
      signInButton: "साइन इन करें",
      successMessage: "लॉगिन सफल! ",
      failureMessage: "लॉगिन विफल। कृपया पुनः प्रयास करें।",
    },
    marathi: {
      title: "विद्यार्थी लॉगिन",
      description: "सुरू ठेवण्यासाठी आपले नाव आणि फोन नंबर प्रविष्ट करा",
      namePlaceholder: "आपले नाव प्रविष्ट करा",
      lastnamePlaceholder: "आपले आडनाव प्रविष्ट करा",
      phonePlaceholder: "आपला फोन नंबर प्रविष्ट करा",
      signInButton: "साइन इन करा",
      successMessage: "लॉगिन यशस्वी! ",
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
        className: "bg-green-50 border-green-500 text-green-800",
      });

      navigate("/students/details/instructions");
    } catch (err: any) {
      toast({
        title: getContent().failureMessage,
        description: (
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span>{err.message}</span>
          </div>
        ),
        className: "bg-red-50 border-red-500 text-red-800",
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="name"
              placeholder={getContent().namePlaceholder}
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              name="lastname"
              placeholder={getContent().lastnamePlaceholder}
              value={formData.lastname}
              onChange={handleChange}
              required
            />
            <Input
              type="tel"
              name="phone"
              placeholder={getContent().phonePlaceholder}
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : getContent().signInButton}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

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
