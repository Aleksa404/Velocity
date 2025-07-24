import Logo from "../assets/Logo.jpg";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useUserStore } from "../stores/userStore";
import { logout } from "../api/authApi";
import { useNavigate } from "react-router";

const Navbar = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sendReq = async () => {};

  return (
    <div className="shadow py-4">
      <div className="container px-4 2xl:px-20 mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="w-auto h-10" />
          <span className="text-xl font-bold text-gray-800">Velocity</span>
        </div>
        <button
          onClick={(e) => {
            console.log("Button clicked");
            sendReq();
          }}
          className="bg-red-100 text-white px-6 sm:px-9 py-2 rounded-full"
        >
          token
        </button>

        <div className=" flex gap-4 max-sm:text-xs"></div>
        <RoleBasedDashboard />
        {user && (
          <button
            onClick={(e) => {
              handleLogout();
            }}
            className="bg-red-600 text-white px-6 sm:px-9 py-2 rounded-full"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
