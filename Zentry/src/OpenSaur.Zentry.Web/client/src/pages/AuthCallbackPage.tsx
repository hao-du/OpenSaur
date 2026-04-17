import { useEffect, useRef, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { AuthErrorPanel } from "../components/AuthErrorPanel";
import { useAuth } from "../auth/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { error, handleCallback, signIn, status } = useAuth();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    void handleCallback();
  }, [handleCallback]);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, status]);

  return (
    <main style={pageStyles}>
      {status === "error" && error
        ? <AuthErrorPanel message={error} onRetry={() => signIn("/dashboard")} />
        : <section style={cardStyles}>
            <p style={eyebrowStyles}>CoreGate callback</p>
            <h1 style={titleStyles}>Completing your sign in.</h1>
            <p style={bodyStyles}>
              Zentry is validating state, exchanging the authorization code, and loading your profile.
            </p>
          </section>}
    </main>
  );
}

const pageStyles: CSSProperties = {
  alignItems: "center",
  background: "#f8fafc",
  display: "grid",
  minHeight: "100vh",
  padding: "2rem"
};

const cardStyles: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dbe4ee",
  borderRadius: "24px",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
  display: "grid",
  gap: "0.75rem",
  maxWidth: "34rem",
  padding: "2rem"
};

const eyebrowStyles: CSSProperties = {
  color: "#0f766e",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  margin: 0,
  textTransform: "uppercase"
};

const titleStyles: CSSProperties = {
  fontSize: "2rem",
  margin: 0
};

const bodyStyles: CSSProperties = {
  color: "#475569",
  lineHeight: 1.7,
  margin: 0
};
