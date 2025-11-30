import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import RegisterPage from "./pages/RegisterPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import AdminDashboard from "./components/Admin/AdminDashboard.tsx";
import RoleBasedDashboard from "./components/RoleBasedDashboard.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import TrainersPage from "./pages/TrainersPage.tsx";
import TrainerProfilePage from "./pages/TrainerProfilePage.tsx";
import WorkshopsPage from "./pages/WorkshopsPage.tsx";
import WorkshopDetailPage from "./pages/WorkshopDetailPage.tsx";
import CreateWorkshopPage from "./pages/CreateWorkshopPage.tsx";
import WorkshopManagementPage from "./pages/WorkshopManagementPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "", element: <RoleBasedDashboard /> },
      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "adminDashboard", element: <AdminDashboard /> },
      { path: "trainers", element: <TrainersPage /> },
      { path: "trainers/:id", element: <TrainerProfilePage /> },
      { path: "workshops", element: <WorkshopsPage /> },
      { path: "workshops/create", element: <CreateWorkshopPage /> },
      { path: "workshops/:id", element: <WorkshopDetailPage /> },
      { path: "workshops/:id/manage", element: <WorkshopManagementPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
