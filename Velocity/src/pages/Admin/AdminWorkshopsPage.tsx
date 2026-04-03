import { useEffect, useState } from "react";
import { adminGetAllWorkshops, adminDeleteWorkshop } from "../../api/workshopApi";
import type { Workshop } from "../../Types/Workshop";
import WorkshopCard from "../../components/Workshop/WorkshopCard";
import { toast } from "sonner";
import { useUserStore } from "../../stores/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router";

const AdminWorkshopsPage = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const user = useUserStore((state) => state.user);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchWorkshops();
    }, [currentPage, debouncedSearch]);

    const fetchWorkshops = async () => {
        setIsLoading(true);
        try {
            const response: any = await adminGetAllWorkshops(currentPage, 20, debouncedSearch);
            setWorkshops(response.data);
            if (response.pagination) {
                setTotalPages(response.pagination.totalPages);
            }
        } catch (error) {
            toast.error("Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (workshopId: string) => {
        try {
            await adminDeleteWorkshop(workshopId);
            toast.success("Course deleted successfully");
            setWorkshops((prev) => prev.filter((w) => w.id !== workshopId));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete course");
        }
    };

    if (user?.role !== "ADMIN") {
        return <Navigate to="/" />;
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Management</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        View and manage all courses on the platform.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    type="text"
                    placeholder="Search all courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50 border-border focus:bg-background transition-all h-11 rounded-xl dark:placeholder:text-muted-foreground/50"
                />
                {isLoading && searchQuery && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                )}
            </div>

            {isLoading && !searchQuery ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading courses...</p>
                </div>
            ) : workshops.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {debouncedSearch
                            ? `No courses found matching "${debouncedSearch}"`
                            : "No courses found on the platform."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workshops.map((workshop) => (
                            <WorkshopCard
                                key={workshop.id}
                                workshop={workshop}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className="w-8 h-8 p-0"
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminWorkshopsPage;
