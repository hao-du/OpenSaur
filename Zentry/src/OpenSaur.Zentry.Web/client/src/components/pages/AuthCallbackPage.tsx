import { useSearchParams } from "react-router-dom";
import { DefaultLayout } from "../layouts/DefaultLayout";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  return (
    <DefaultLayout
      subtitle="OAuth callback values returned from CoreGate are shown below for verification."
      title="Auth Callback"
    >
      <div>
        <p><strong>Code:</strong> {code ?? "(missing)"}</p>
        <p><strong>State:</strong> {state ?? "(missing)"}</p>
        <p><strong>Error:</strong> {error ?? "(none)"}</p>
        <p><strong>Error description:</strong> {errorDescription ?? "(none)"}</p>
      </div>
    </DefaultLayout>
  );
}
