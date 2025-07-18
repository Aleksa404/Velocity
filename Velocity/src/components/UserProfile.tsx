import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import React, { useState } from "react";
import { getUserRole, updateUserRole } from "../api/userApi";

const UserProfile = () => {
  const { user } = useUser();

  const handleBecomeTrainer = async () => {
    try {
      if (!user) {
        return;
      }
      console.log("Current user ID:", user.id);
      const userRole = await getUserRole(user.id);
      console.log("User role:", userRole.data);
      if (userRole.data === "TRAINER") {
        const res = await updateUserRole(user.id, "USER");
        console.log("Korisnik je postao user", res.data);
        return;
      } else if (userRole.data === "USER") {
        const res = await updateUserRole(user.id, "TRAINER");
        console.log("Korisnik je postao trener", res.data);
        return;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Proverite da li je korisnik već trener
  const isTrainer = user?.publicMetadata?.role === "TRAINER";

  return (
    <UserButton
      afterSignOutUrl="/"
      userProfileMode="navigation"
      userProfileUrl="/profile"
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label="Postani trener"
          labelIcon={isTrainer ? "✓" : "🚀"}
          onClick={handleBecomeTrainer}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
};
export default UserProfile;
