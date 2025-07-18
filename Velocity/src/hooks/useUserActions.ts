import { useEffect } from "react";
import { useUserStore } from "../stores/userStore";
import { useUser } from "@clerk/clerk-react";
import { getUserRole } from "../api/userApi";
import { useAxiosAuth } from "./useAxiosAuth";

export const useUserActions = () => {
  const { user, setUser, updateUser, setIsLoading, setError, clearUser } =
    useUserStore();
  const axios = useAxiosAuth();

  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && clerkUser) {
      syncStoreWithClerk();
    } else if (isLoaded && !clerkUser) {
      clearUser();
    }
  }, [isLoaded, clerkUser]);

  const syncStoreWithClerk = async () => {
    if (!clerkUser) return;

    setIsLoading(true);
    try {
      //  const userRole = await getUserRole(axios, clerkUser.id);
      const userData = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        //TODO ADD DATABASE FETCHING FOR ROLE
        role: user?.role || undefined,
        createdAt: clerkUser.createdAt
          ? new Date(clerkUser.createdAt)
          : new Date(),
        updatedAt: clerkUser.updatedAt
          ? new Date(clerkUser.updatedAt)
          : new Date(),
      };
      setUser(userData);
    } catch (error) {
      console.error("Error syncing user data:", error);
      setError("Failed to sync user data");
    } finally {
      setIsLoading(false);
    }
  };
  // const becomeTrainer = async () => {
  //     try {
  //     if (user) {
  //         // Call your API to update the user role
  //         // await apiCallToBecomeTrainer(user.id);

  //         // Update the user in the store
  //         updateUser({ role: "TRAINER" });
  //     }
  //     } catch (error) {
  //     console.error("Error becoming trainer:", error);
  //     setError("Failed to become trainer");
  //     }
  // };

  return {
    syncStoreWithClerk,
  };
};
