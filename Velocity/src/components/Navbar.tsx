import React, { useEffect } from "react";
import Logo from "../assets/Logo.jpg";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useClerk,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import UserProfile from "./UserProfile";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useUserStore } from "../stores/userStore";

const Navbar = () => {
  const { user } = useUserStore();
  const clerk = useClerk();
  const clerkuser = useUser();
  const { getToken } = useAuth();

  return (
    <div className="shadow py-4">
      <div className="container px-4 2xl:px-20 mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="w-auto h-10" />
          <span className="text-xl font-bold text-gray-800">Velocity</span>
        </div>
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
            <button
              onClick={async () => {
                console.log(await getToken());
              }}
              className="bg-red-600 text-white px-6 sm:px-9 py-2 rounded-full"
            >
              token
            </button>
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
