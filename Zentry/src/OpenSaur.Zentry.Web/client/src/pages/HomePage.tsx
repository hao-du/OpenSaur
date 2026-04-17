import { useEffect, type CSSProperties } from "react";
import { Navigate } from "react-router-dom";
import { AuthErrorPanel } from "../components/AuthErrorPanel";
import { useAuth } from "../auth/useAuth";

export function HomePage() {
  const { error, signIn, status } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      void signIn("/dashboard");
    }
  }, [signIn, status]);

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <main style={pageStyles}>
      <section style={heroStyles}>
        <p style={eyebrowStyles}>OpenSaur Zentry</p>
        <h1 style={headlineStyles}>Routing you through CoreGate sign-in.</h1>
        <p style={copyStyles}>
          This first phase keeps the app intentionally small: browser-based OIDC login,
          callback handling, and a protected dashboard once the token exchange completes.
        </p>
        {error ? <AuthErrorPanel message={error} onRetry={() => signIn("/dashboard")} /> : null}
      </section>
    </main>
  );
}

const pageStyles: CSSProperties = {
  alignItems: "center",
  background: "linear-gradient(135deg, #f4efe6 0%, #fffaf3 55%, #d8eef5 100%)",
  color: "#111827",
  display: "grid",
  minHeight: "100vh",
  padding: "2rem"
};

const heroStyles: CSSProperties = {
  display: "grid",
  gap: "1rem",
  margin: "0 auto",
  maxWidth: "42rem"
};

const eyebrowStyles: CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  margin: 0,
  textTransform: "uppercase"
};

const headlineStyles: CSSProperties = {
  fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
  lineHeight: 1,
  margin: 0
};

const copyStyles: CSSProperties = {
  color: "#374151",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  margin: 0,
  maxWidth: "36rem"
};
