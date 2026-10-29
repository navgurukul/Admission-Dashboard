import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import logo from "@/assets/ng-logo-horizontal.png";

export default function Auth() {
  const navigate = useNavigate();
  const {
    user: googleUser,
    isAuthenticated,
    loading: googleLoading,
    renderGoogleSignInButton,
  } = useGoogleAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Check if user is already authenticated

  // console.log("AUTH.TSX")
  // Render Google button when component mounts and Google auth is ready
  useEffect(() => {
    if (googleButtonRef.current && !googleLoading) {
      // Small delay to ensure Google script is fully loaded
      const timer = setTimeout(() => {
        renderGoogleSignInButton("google-signin-button");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [googleLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const roleIdNum = Number(googleUser.role_id);
    const isTeam = roleIdNum === 3 || googleUser.role_name === "Team" || googleUser.role_name?.toUpperCase() === "TEAM";

    if (roleIdNum === 1 || roleIdNum === 2 || isTeam) {
      if (isTeam) {
        navigate("/donor");
      } else {
        navigate("/dashboard");
      }
      return;
    }
  }, [googleUser, isAuthenticated, navigate]);

  return (
    <main className="admin-login">
      <section className="admin-login__welcome" aria-label="NavGurukul Admin Portal">
        <div className="admin-login__sun" />
        <img src={logo} alt="NavGurukul" className="admin-login__logo" />
        <div className="admin-login__copy">
          <p className="admin-login__eyebrow">ADMIN PORTAL</p>
          <h1>Better Management.<br />Greater Impact.</h1>
          <p>Manage admissions, students, and programs<br />— all in one place.</p>
        </div>
        <div className="admin-login__illustration" aria-hidden="true">
          <div className="admin-login__plant"><i /><i /><i /></div>
          <div className="admin-login__desk" />
          <div className="admin-login__laptop"><span /><b /><b /><b /></div>
        </div>
      </section>
      <section className="admin-login__form-panel">
        <div className="admin-login__form">
          <div className="admin-login__accent" />
          <h2>Welcome Back</h2>
          <p className="admin-login__subtitle">Sign in to access the NavGurukul Admin Portal.</p>
          <div className="admin-login__divider"><span>SECURE SIGN IN</span></div>
          {googleLoading ? (
            <div className="admin-login__google admin-login__google-loading" aria-live="polite">
              Loading sign-in…
            </div>
          ) : (
            <div id="google-signin-button" ref={googleButtonRef} className="admin-login__google" />
          )}
          <p className="admin-login__note">Use your authorized NavGurukul Google account</p>
        </div>
        <p className="admin-login__footer"><span>NavGurukul</span><i /> Education for a Brighter Future</p>
      </section>
    </main>
  );
}
