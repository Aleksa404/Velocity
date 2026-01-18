import { useLocation, useNavigate } from "react-router";
import { useUserStore } from "../stores/userStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ICON_LIST, ICON_MAP, type IconName } from "@/lib/icons";


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

    const { sections, fetchSidebar } = useSidebarStore();

    // Initial fetch
    useEffect(() => {
        const load = async () => {
            if (sections.length === 0) {
                await fetchSidebar();
            }
        };
        load();
    }, [fetchSidebar, sections.length]);

    // Icon mapper using dynamic Lucide icons
    const getIcon = (iconName?: string) => {
        if (!iconName) return <ICON_MAP.Home className="w-5 h-5" />;
        const Icon = ICON_MAP[iconName as IconName] ?? ICON_MAP.Home;
        return Icon ? <Icon className="w-5 h-5" /> : <ICON_MAP.Home className="w-5 h-5" />;
    };

    const NavButton = ({ item }: { item: NavItem }) => {
        const isActive = location.pathname === item.path

        const button = (
            <button
                onClick={() => navigate(item.path)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-indigo-50 hover:text-indigo-600",
                    isActive
                        ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800",
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
                    "hidden md:flex flex-col bg-white dark:bg-sidebar border-r border-gray-200 dark:border-border transition-all duration-300",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Main Navigation */}
                <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                    {/* Dynamic Sections */}
                    {sections.map((section) => {
                        // Section Role Access
                        if (section.roles && section.roles.length > 0 && user.role && !section.roles.includes(user.role)) {
                            return null;
                        }

                        return (
                            <div key={section.id} className="space-y-1">
                                {section.title && !isCollapsed && (
                                    <div className="flex items-center gap-2 mb-2 px-3">
                                        {section.icon && (
                                            <span className="text-gray-400 dark:text-gray-500">
                                                {getIcon(section.icon)}
                                            </span>
                                        )}
                                        {section.path ? (

                                            <button
                                                onClick={() => navigate(section.path as string)

                                                }
                                                className={cn(
                                                    "text-xs font-semibold uppercase tracking-wider transition-colors",
                                                    location.pathname === section.path
                                                        ? "text-indigo-600"
                                                        : "text-gray-400 hover:text-indigo-500"
                                                )}
                                            >
                                                {section.title}
                                            </button>
                                        ) : (
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                {section.title}
                                            </h3>
                                        )}
                                    </div>
                                )}
                                {section.items.map((item) => {
                                    // Item Role Access
                                    if (item.roles && item.roles.length > 0 && user.role && !item.roles.includes(user.role)) {
                                        return null;
                                    }

                                    return (
                                        <NavButton
                                            key={item.id}
                                            item={{
                                                label: item.label,
                                                icon: getIcon(item.icon),
                                                path: item.path,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>


                {/* Footer Actions */}
                <div className="px-3 pb-4 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "flex-1 flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
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
