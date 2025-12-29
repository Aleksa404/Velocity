import { useLocation, useNavigate } from "react-router";
import { useUserStore } from "../stores/userStore";
import {
    Home,
    Users,
    BookOpen,
    UserCircle,
    Settings,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    roles?: string[];
}

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useUserStore((state) => state.user);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!user) return null;

    const navItems: NavItem[] = [
        {
            label: "Dashboard",
            icon: <Home className="w-5 h-5" />,
            path: "/",
        },
        {
            label: "Browse Trainers",
            icon: <Users className="w-5 h-5" />,
            path: "/trainers",
        },
        {
            label: "Workshops",
            icon: <BookOpen className="w-5 h-5" />,
            path: "/workshops",
        },
    ];

    // Add trainer-specific items
    if (user.role === "TRAINER" || user.role === "ADMIN") {
        navItems.push({
            label: "My Workshops",
            icon: <FolderOpen className="w-5 h-5" />,
            path: "/workshops/my",
            roles: ["TRAINER", "ADMIN"],
        });
    }

    const bottomItems: NavItem[] = [
        {
            label: "Profile",
            icon: <UserCircle className="w-5 h-5" />,
            path: "/profile",
        },
        {
            label: "Settings",
            icon: <Settings className="w-5 h-5" />,
            path: "/settings",
        },
    ];

    const NavButton = ({ item }: { item: NavItem }) => {
        const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

        const button = (
            <button
                onClick={() => navigate(item.path)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-indigo-50 hover:text-indigo-600",
                    isActive
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "text-gray-600",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <span className={cn(isActive && "text-indigo-600")}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <span className="text-sm truncate">{item.label}</span>
                )}
            </button>
        );

        if (isCollapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return button;
    };

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    "hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Main Navigation */}
                <div className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavButton key={item.path} item={item} />
                    ))}
                </div>

                {/* Divider */}
                <div className="px-3">
                    <div className="border-t border-gray-200" />
                </div>

                {/* Bottom Navigation */}
                <div className="px-3 py-4 space-y-1">
                    {bottomItems.map((item) => (
                        <NavButton key={item.path} item={item} />
                    ))}
                </div>

                {/* Collapse Button */}
                <div className="px-3 pb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "w-full flex items-center gap-2 text-gray-500 hover:text-gray-700",
                            isCollapsed && "justify-center"
                        )}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <>
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-xs">Collapse</span>
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
