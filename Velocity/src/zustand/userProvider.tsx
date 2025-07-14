import { useEffect } from "react";
import { useUserActions } from "../hooks/useUserActions";
import { useUserStore } from "../stores/userStore";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { syncStoreWithClerk } = useUserActions();
  const { isLoading, error } = useUserStore();

  useEffect(() => {
    syncStoreWithClerk();
  }, []);

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <>{children}</>;
};
