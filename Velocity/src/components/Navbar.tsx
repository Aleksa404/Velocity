import Logo from "../assets/Logo.jpg";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useUserStore } from "../stores/userStore";

const Navbar = () => {
  const sendReq = async () => {
    const user = useUserStore.getState().user;
    console.log(user);
    // You can send this token to your backend or use it as needed
  };

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
          className="bg-red-600 text-white px-6 sm:px-9 py-2 rounded-full"
        >
          token
        </button>
        <RoleBasedDashboard />

        <div className=" flex gap-4 max-sm:text-xs"></div>
      </div>
    </div>
  );
};

export default Navbar;
