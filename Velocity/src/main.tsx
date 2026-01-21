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
import TrainerProfilePage from "./pages/Trainer/TrainerProfilePage.tsx";
import WorkshopsPage from "./pages/WorkshopsPage.tsx";
import WorkshopDetailPage from "./pages/WorkshopDetailPage.tsx";
import CreateWorkshopPage from "./pages/Trainer/CreateWorkshopPage.tsx";
import WorkshopManagementPage from "./pages/Trainer/WorkshopManagementPage.tsx";
import MyWorkshopsPage from "./pages/Trainer/MyWorkshopsPage.tsx";
import EnrolledWorkshopsPage from "./pages/EnrolledWorkshopsPage.tsx";
import { ThemeProvider } from "./service/theme-provider.tsx";

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
      { path: "course/all", element: <WorkshopsPage /> },
      { path: "course/my", element: <MyWorkshopsPage /> },
      { path: "course/enrolled", element: <EnrolledWorkshopsPage /> },
      { path: "course/create", element: <CreateWorkshopPage /> },
      { path: "course/:id", element: <WorkshopDetailPage /> },
      { path: "course/:id/manage", element: <WorkshopManagementPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
