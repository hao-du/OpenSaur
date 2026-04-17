import type { CSSProperties } from "react";

type AuthErrorPanelProps = {
  message: string;
  onRetry: () => void | Promise<void>;
};

export function AuthErrorPanel({ message, onRetry }: AuthErrorPanelProps) {
  return (
    <section style={panelStyles}>
      <h2 style={{ margin: 0 }}>Authentication error</h2>
      <p style={{ margin: 0, color: "#4b5563" }}>{message}</p>
      <button onClick={() => void onRetry()} style={buttonStyles} type="button">
        Retry sign in
      </button>
    </section>
  );
}

const panelStyles: CSSProperties = {
  alignItems: "flex-start",
  background: "#fff4f2",
  border: "1px solid #f5b4aa",
  borderRadius: "16px",
  display: "grid",
  gap: "0.75rem",
  maxWidth: "32rem",
  padding: "1.25rem"
};

const buttonStyles: CSSProperties = {
  background: "#111827",
  border: "none",
  borderRadius: "999px",
  color: "#fff",
  cursor: "pointer",
  padding: "0.75rem 1rem"
};
