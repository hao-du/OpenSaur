import { Route, Routes } from "react-router-dom";
import { DashboardPage } from "./components/pages/DashboardPage";


export function App() {
  return (
      <Routes>
        <Route
          element={<DashboardPage />}
          path="/"
        />
      </Routes>
  );
}
