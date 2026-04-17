import type { CSSProperties } from "react";

import { useAuth } from "../auth/useAuth";

export function DashboardPage() {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  const { profile, tokenSet } = session;

  return (
    <main style={pageStyles}>
      <section style={heroStyles}>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <p style={eyebrowStyles}>Protected dashboard</p>
          <h1 style={headlineStyles}>Zentry is authenticated with CoreGate.</h1>
          <p style={copyStyles}>
            This phase proves the full browser flow: redirect, callback, code exchange,
            token storage, and authenticated identity bootstrap.
          </p>
        </div>

        <button onClick={signOut} style={buttonStyles} type="button">
          Log out
        </button>
      </section>

      <section style={gridStyles}>
        <article style={cardStyles}>
          <h2 style={cardTitleStyles}>Identity</h2>
          <dl style={definitionListStyles}>
            <InfoRow label="Subject" value={profile.subject} />
            <InfoRow label="Username" value={profile.preferredUsername ?? "Not provided"} />
            <InfoRow label="Email" value={profile.email ?? "Not provided"} />
            <InfoRow label="Workspace" value={profile.workspaceId ?? "Not provided"} />
            <InfoRow label="Roles" value={profile.roles?.join(", ") ?? "Not provided"} />
          </dl>
        </article>

        <article style={cardStyles}>
          <h2 style={cardTitleStyles}>Token snapshot</h2>
          <dl style={definitionListStyles}>
            <InfoRow label="Token type" value={tokenSet.tokenType} />
            <InfoRow label="Expires at" value={tokenSet.expiresAtUtc} />
            <InfoRow label="Scope" value={tokenSet.scope ?? "Not provided"} />
            <InfoRow label="Refresh token" value={tokenSet.refreshToken ? "Issued" : "Not issued"} />
            <InfoRow label="ID token" value={tokenSet.idToken ? "Issued" : "Not issued"} />
          </dl>
        </article>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={termStyles}>{label}</dt>
      <dd style={detailStyles}>{value}</dd>
    </>
  );
}

const pageStyles: CSSProperties = {
  background: "radial-gradient(circle at top left, #fff3d6 0%, #f8fafc 40%, #ecfeff 100%)",
  color: "#111827",
  minHeight: "100vh",
  padding: "2rem"
};

const heroStyles: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5rem",
  justifyContent: "space-between",
  margin: "0 auto 2rem",
  maxWidth: "72rem"
};

const eyebrowStyles: CSSProperties = {
  color: "#0f766e",
  fontSize: "0.85rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  margin: 0,
  textTransform: "uppercase"
};

const headlineStyles: CSSProperties = {
  fontSize: "clamp(2rem, 5vw, 4rem)",
  lineHeight: 1,
  margin: "0 0 0.75rem"
};

const copyStyles: CSSProperties = {
  color: "#475569",
  lineHeight: 1.7,
  margin: 0,
  maxWidth: "36rem"
};

const buttonStyles: CSSProperties = {
  background: "#111827",
  border: "none",
  borderRadius: "999px",
  color: "#fff",
  cursor: "pointer",
  padding: "0.9rem 1.2rem"
};

const gridStyles: CSSProperties = {
  display: "grid",
  gap: "1.5rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  margin: "0 auto",
  maxWidth: "72rem"
};

const cardStyles: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dbe4ee",
  borderRadius: "24px",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
  display: "grid",
  gap: "1rem",
  padding: "1.5rem"
};

const cardTitleStyles: CSSProperties = {
  fontSize: "1.1rem",
  margin: 0
};

const definitionListStyles: CSSProperties = {
  display: "grid",
  gap: "0.9rem",
  gridTemplateColumns: "minmax(100px, 140px) 1fr",
  margin: 0
};

const termStyles: CSSProperties = {
  color: "#64748b",
  fontWeight: 600,
  margin: 0
};

const detailStyles: CSSProperties = {
  margin: 0
};
