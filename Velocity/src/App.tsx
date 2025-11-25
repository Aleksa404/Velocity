import "./App.css";

import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Toaster />
    </>
  );
}

export default App;
