import React from "react";
import { useUserStore } from "../stores/userStore";

const RoleBasedDashboard = () => {
  const { user } = useUserStore();
  const role = user?.role;

  console.log("User role:", user);

  if (!user) return null;

  return (
    <div>
      {role === "ADMIN" && <div>Admin Dashboard</div>}
      {role === "TRAINER" && <div>Trainer Dashboard</div>}
      {role === "USER" && <div>User Dashboard</div>}
    </div>
  );
};

export default RoleBasedDashboard;
