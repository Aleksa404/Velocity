import { useUserStore } from "../../stores/userStore";

export const RoleBasedDashboard = () => {
  const user = useUserStore((state) => state.user);


  if (!user) return null;

  return (
    <>
      <div>Admin Dashboard</div>
    </>
  );
};

export default RoleBasedDashboard;
