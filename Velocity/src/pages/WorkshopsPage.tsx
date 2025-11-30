import { useEffect, useState } from "react";
import { getAllWorkshops, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import WorkshopCard from "../components/Workshop/WorkshopCard";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus } from "lucide-react";

const WorkshopsPage = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        fetchWorkshops();
    }, []);

    const fetchWorkshops = async () => {
        try {
            const response = await getAllWorkshops();
            setWorkshops(response.data);
        } catch (error) {
            console.error("Error fetching workshops:", error);
            toast.error("Failed to load workshops");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async (workshopId: string) => {
        if (!user) {
            toast.error("Please log in to enroll in workshops");
            return;
        }

        try {
            await enrollInWorkshop(workshopId);
            toast.success("Enrollment request submitted! Waiting for trainer approval.");

            // Update workshop enrollment status
            setWorkshops(prev => prev.map(workshop => {
                if (workshop.id === workshopId) {
                    return {
                        ...workshop,
                        enrollmentStatus: "PENDING",
                        _count: workshop._count ? {
                            ...workshop._count,
                            enrollments: workshop._count.enrollments + 1
                        } : undefined
                    };
                }
                return workshop;
            }));
        } catch (error: any) {
            console.error("Error enrolling in workshop:", error);
            toast.error(error.response?.data?.message || "Failed to enroll in workshop");
        }
    };

    const filteredWorkshops = workshops.filter(workshop => {
        const workshopDate = new Date(workshop.date);
        const now = new Date();

        if (filter === "upcoming") return workshopDate >= now;
        if (filter === "past") return workshopDate < now;
        return true;
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading workshops...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Workshops</h1>
                    <p className="text-muted-foreground">
                        Browse and enroll in workshops led by professional trainers.
                    </p>
                </div>
                {user && (user.role === "TRAINER" || user.role === "ADMIN") && (
                    <Link to="/workshops/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workshop
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 font-medium transition-colors ${filter === "all"
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-muted-foreground hover:text-gray-900"
                        }`}
                >
                    All Workshops
                </button>
                <button
                    onClick={() => setFilter("upcoming")}
                    className={`px-4 py-2 font-medium transition-colors ${filter === "upcoming"
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-muted-foreground hover:text-gray-900"
                        }`}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setFilter("past")}
                    className={`px-4 py-2 font-medium transition-colors ${filter === "past"
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-muted-foreground hover:text-gray-900"
                        }`}
                >
                    Past
                </button>
            </div>

            {filteredWorkshops.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No workshops found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkshops.map((workshop) => (
                        <WorkshopCard
                            key={workshop.id}
                            workshop={workshop}
                            enrollmentStatus={workshop.enrollmentStatus}
                            onEnroll={user && user.role === "USER" ? handleEnroll : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkshopsPage;
