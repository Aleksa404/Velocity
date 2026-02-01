import Logo from "../assets/Logo.jpg";
import { useUserStore } from "../stores/userStore";
import { logout } from "../api/authApi";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import { searchTrainers } from "../api/trainerApi";
import * as LucideIcons from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LogOut,
    User as UserIcon,
    Search,
    Menu,
    Sun,
    Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
    const user = useUserStore((state) => state.user);
    const { sections } = useSidebarStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const { setTheme, theme } = useTheme()

    // Icon mapper for mobile menu
    const getIcon = (iconName?: string) => {
        if (!iconName) return <LucideIcons.FolderOpen className="h-5 w-5" />;
        const Icon = (LucideIcons as any)[iconName];
        return Icon ? <Icon className="h-5 w-5" /> : <LucideIcons.FolderOpen className="h-5 w-5" />;
    };

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
        <nav className="border-b bg-white/75 dark:bg-background/75 backdrop-blur-md sticky top-0 z-50 border-gray-200 dark:border-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Mobile Menu Trigger */}
                {user && (
                    <div className="md:hidden mr-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-200">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                                <SheetHeader className="text-left mb-6">
                                    <SheetTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        Velocity
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">
                                        Navigation menu for mobile devices
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="flex flex-col gap-2">
                                    {sections.map((section) => {
                                        // Section Role Access
                                        if (section.roles && section.roles.length > 0 && user.role && !section.roles.includes(user.role)) {
                                            return null;
                                        }

                                        return (
                                            <div key={section.id} className="space-y-1">
                                                {section.title && (
                                                    <div className="px-3 py-2">
                                                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                            {section.title}
                                                        </h3>
                                                    </div>
                                                )}
                                                {section.items.map((item) => {
                                                    // Item Role Access
                                                    if (item.roles && item.roles.length > 0 && user.role && !item.roles.includes(user.role)) {
                                                        return null;
                                                    }

                                                    return (
                                                        <Button
                                                            key={item.id}
                                                            variant="ghost"
                                                            className="justify-start gap-2 w-full dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                                            onClick={() => navigate(item.path)}
                                                        >
                                                            {getIcon(item.icon)}
                                                            {item.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                )}

                {/* Logo Section */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <img src={Logo} alt="Logo" className="hidden md:block w-8 h-8 rounded-md object-cover" />
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Velocity
                    </span>
                </div>

                {/* Search Bar */}
                {user &&
                    <div className="relative w-96 mx-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search trainers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full bg-gray-50 border-gray-200 focus:bg-white dark:bg-muted/50 dark:border-border dark:focus:bg-muted transition-colors dark:text-foreground dark:placeholder:text-muted-foreground"
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
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-lg shadow-lg border border-gray-100 dark:border-border py-2 max-h-96 overflow-y-auto z-50">
                                {searchResults.map((trainer) => (
                                    <div
                                        key={trainer.id}
                                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors"
                                        onClick={() => {
                                            navigate(`/trainers/${trainer.id}`);
                                            setShowResults(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs dark:bg-indigo-900/50 dark:text-indigo-400">
                                                {trainer.first_name[0]}{trainer.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                                {trainer.first_name} {trainer.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Trainer</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}


                        {/* Click outside to close */}
                        {showResults && (
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setShowResults(false)}
                            />
                        )}
                    </div>}



                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-10 w-10 rounded-full"
                                >
                                    <Avatar className="h-10 w-10 border-2 border-indigo-100 hover:border-indigo-200 dark:border-indigo-900 dark:hover:border-indigo-800 transition-colors">
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
                                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                    <div className="relative mr-2 h-4 w-4">
                                        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
                                    </div>
                                    <span>Toggle Theme</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem onClick={() => navigate("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
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
