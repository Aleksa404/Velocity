import { useUserStore } from "../../stores/userStore";

export const RoleBasedDashboard = () => {
  const user = useUserStore((state) => state.user);
  const role = user?.role;

  if (!user) return null;

  return (
    <>
      <div>Admin Dashboard</div>
    </>
  );
};

export default RoleBasedDashboard;
