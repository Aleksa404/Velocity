import "./App.css";

import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "./stores/userStore";

function App() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {user && <Sidebar />}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
