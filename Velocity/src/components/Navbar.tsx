import Logo from "../assets/Logo.jpg";
import { useUserStore } from "../stores/userStore";
import { logout } from "../api/authApi";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchTrainers } from "../api/trainerApi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Settings, Search } from "lucide-react";

const Navbar = () => {
    const user = useUserStore((state) => state.user);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const response = await searchTrainers(searchQuery);
                    if (response.success) {
                        setSearchResults(response.data);
                        setShowResults(true);
                    }
                } catch (error) {
                    console.error("Error searching trainers:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    // Get user initials for avatar fallback
    const getInitials = () => {
        if (!user) return "U";
        return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""
            }`.toUpperCase();
    };

    return (
        <nav className="border-b bg-white/75 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <img src={Logo} alt="Logo" className="w-8 h-8 rounded-md object-cover" />
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Velocity
                    </span>
                </div>

                {/* Search Bar */}
                {user &&
                    <div className="relative hidden md:block w-96 mx-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search trainers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                onFocus={() => {
                                    if (searchResults.length > 0) setShowResults(true);
                                }}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                </div>
                            )}
                        </div>


                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 max-h-96 overflow-y-auto z-50">
                                {searchResults.map((trainer) => (
                                    <div
                                        key={trainer.id}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                        onClick={() => {
                                            navigate(`/trainers/${trainer.id}`);
                                            setShowResults(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                                                {trainer.first_name[0]}{trainer.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {trainer.first_name} {trainer.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">Trainer</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}


                        {/* Click outside to close - simplifed by using onBlur on input or separate overlay, for now relying on click selection */}
                        {showResults && (
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setShowResults(false)}
                            />
                        )}
                    </div>}

                {/* Navigation Links */}
                {user && (
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate("/trainers")}
                            className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            Browse Trainers
                        </button>
                        <button
                            onClick={() => navigate("/workshops")}
                            className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            Workshops
                        </button>
                    </div>
                )}

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-10 w-10 rounded-full"
                                >
                                    <Avatar className="h-10 w-10 border-2 border-indigo-100 hover:border-indigo-200 transition-colors">
                                        <AvatarImage src="" alt={user.firstName} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => navigate("/login")}>
                                Sign In
                            </Button>
                            <Button onClick={() => navigate("/register")}>Sign up</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
