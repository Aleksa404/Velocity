import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider, SignInButton } from "@clerk/clerk-react";
import { createBrowserRouter, Router, RouterProvider } from "react-router";
import { UserProvider } from "./zustand/userProvider.tsx";
import { Axios } from "axios";
import { AxiosProvider } from "./api/axiosProvider.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [{ path: "", element: <div>home</div> }],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AxiosProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AxiosProvider>
    </ClerkProvider>
  </StrictMode>
);
