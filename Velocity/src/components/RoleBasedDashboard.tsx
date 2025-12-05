import { useUserStore } from "../stores/userStore";
import AdminDashboard from "./Admin/AdminDashboard";
import TrainerDashboard from "./Trainer/TrainerDashboard";
import { Navigate } from "react-router";

import UserDashboard from "./User/UserDashboard";

const RoleBasedDashboard = () => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (user.role === "TRAINER") {
    return <TrainerDashboard />;
  }

  return <UserDashboard />;
};

export default RoleBasedDashboard;
