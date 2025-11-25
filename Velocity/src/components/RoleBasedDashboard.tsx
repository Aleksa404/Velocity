import { useUserStore } from "../stores/userStore";
import AdminDashboard from "./Dashboard/AdminDashboard";
import TrainerDashboard from "./Dashboard/TrainerDashboard";
import { Navigate } from "react-router";

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">User Dashboard</h1>
      <p>Welcome, {user.firstName}!</p>
    </div>
  );
};

export default RoleBasedDashboard;
