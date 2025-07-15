import Logo from "../assets/Logo.jpg";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import UserProfile from "./UserProfile";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useAxiosAuth } from "../hooks/useAxiosAuth";

const Navbar = () => {
  const axiosAuth = useAxiosAuth();

  const sendReq = async () => {
    console.log("Send request function called");
    try {
      const res = await axiosAuth.get<any>("/protected");
      console.log("Test function called", res.data);
    } catch (error) {
      console.error("Error in test function:", error);
    }
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

        <div className=" flex gap-4 max-sm:text-xs">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-6 sm:px-9 py-2 rounded-full">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {/* <UserButton afterSignOutUrl="/" /> */}
            <UserProfile />
          </SignedIn>

          {/* {!user.isSignedIn ? (
            <button className="text-gray-600">Login</button>
          ) : (
            <button
              onClick={() => clerk.openSignIn({})}
              className="bg-blue-600 text-white px-6 sm:px-9 py-2 rounded-full"
            >
              Login
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
