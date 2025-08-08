import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { User } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: googleUser, isAuthenticated, loading: googleLoading, renderGoogleSignInButton } = useGoogleAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Check if user is already authenticated
  useEffect(() => {
    if (googleUser && isAuthenticated) {
      navigate("/");
    }
  }, [googleUser, isAuthenticated, navigate]);

  // Render Google button when component mounts and Google auth is ready
  useEffect(() => {
    if (googleButtonRef.current && !googleLoading) {
      // Small delay to ensure Google script is fully loaded
      const timer = setTimeout(() => {
        renderGoogleSignInButton('google-signin-button');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [renderGoogleSignInButton, googleLoading]);

  // Show loading state while checking authentication
  if (googleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Admission Dashboard</CardTitle>
          </div>
          <CardDescription>
            Sign in with your Google account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign In Button */}
          <div 
            id="google-signin-button" 
            ref={googleButtonRef}
            className="w-full flex justify-center"
          ></div>
        </CardContent>
      </Card>
    </div>
  );
}