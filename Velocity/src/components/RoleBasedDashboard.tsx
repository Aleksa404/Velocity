import React from "react";
import { useUserStore } from "../stores/userStore";
import { useAxiosAuth } from "../hooks/useAxiosAuth";

export const RoleBasedDashboard = () => {
  const { user } = useUserStore();
  const role = user?.role;
  const axiosAuth = useAxiosAuth();

  if (!user) return null;

  return (
    <>
      <div>
        {role === "ADMIN" && <div>Admin Dashboard</div>}
        {role === "TRAINER" && <div>Trainer Dashboard</div>}
        {role === "USER" && <div>User Dashboard</div>}
      </div>
    </>
  );
};

export default RoleBasedDashboard;
