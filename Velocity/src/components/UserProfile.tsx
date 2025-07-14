import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import React, { useState } from "react";

const UserProfile = () => {
  const { user } = useUser();

  const handleBecomeTrainer = async () => {
    try {
      console.log(user?.publicMetadata);
      //   // Poziv ka vašem API-ju
      //   const response = await fetch('/api/user/become-trainer', {
      //     method: 'POST',
      //   });
      //   if (response.ok) {
      //     // Ažuriraj Clerk metadata
      //     await user?.update({
      //       publicMetadata: {
      //         ...user.publicMetadata,
      //         role: 'TRAINER'
      //       }
      //     });
      //     setIsOpen(false);
      //   }
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
