import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Outlet } from "react-router";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
  // <header>
  //   <SignedOut>
  //     <SignInButton />
  //   </SignedOut>
  //   <SignedIn>
  //     <UserButton />
  //   </SignedIn>
  // </header>
}

export default App;
