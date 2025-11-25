import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import RegisterPage from "./pages/RegisterPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import AdminDashboard from "./components/Dashboard/AdminDashboard.tsx";
import PostVideoPage from "./pages/PostVideoPage.tsx";
import RoleBasedDashboard from "./components/RoleBasedDashboard.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "", element: <RoleBasedDashboard /> },
      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "adminDashboard", element: <AdminDashboard /> },
      { path: "trainer/post-video", element: <PostVideoPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
