import { useUserStore } from "../stores/userStore";
import { useNavigate } from "react-router";

export const RoleBasedDashboard = () => {
  const user = useUserStore((state) => state.user);
  const role = user?.role;

  const navigate = useNavigate();
  if (!user) return null;

  return (
    <>
      <div>
        {role === "ADMIN" && (
          <button
            className="bg-blue-400 text-white px-6 sm:px-9 py-2 rounded-full"
            onClick={() => navigate("/adminDashboard")}
          >
            Dashboard
          </button>
        )}
        {role === "TRAINER" && <div>Trainer Dashboard</div>}
        {role === "USER" && <div>User Dashboard</div>}
      </div>
    </>
  );
};

export default RoleBasedDashboard;
