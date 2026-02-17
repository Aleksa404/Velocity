import { useEffect, useState } from "react";
import { getMyWorkshops, deleteWorkshop } from "../../api/workshopApi";
import type { Workshop } from "../../Types/Workshop";
import WorkshopCard from "../../components/Workshop/WorkshopCard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useUserStore } from "../../stores/userStore";

const MyWorkshopsPage = () => {
    const user = useUserStore((state) => state.user);
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isTrainer = user?.role === "TRAINER";

    useEffect(() => {
        if (isTrainer) {
            fetchWorkshops();
        }
    }, [isTrainer]);

    const fetchWorkshops = async () => {
        setIsLoading(true);
        try {
            const response = await getMyWorkshops();
            setWorkshops(response.data);
        } catch (error) {
            toast.error("Failed to load your courses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (workshopId: string) => {
        try {
            await deleteWorkshop(workshopId);
            setWorkshops((prev) => prev.filter((w) => w.id !== workshopId));
            toast.success("Course deleted successfully");
        } catch (error) {
            toast.error("Failed to delete course");
        }
    };

    if (!isTrainer) {
        return <Navigate to="/course/enrolled" replace />;
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="ml-3 text-muted-foreground">Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Managed Courses</h1>
                    </div>
                    <p className="text-muted-foreground ml-12">
                        Create and manage your course content, sections, and student progress.
                    </p>
                </div>
                <Link to="/course/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                    </Button>
                </Link>
            </div>

            {workshops.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border shadow-sm flex flex-col items-center">
                    <div className="bg-indigo-50/10 p-4 rounded-full mb-4">
                        <Plus className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">No courses created</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any courses yet. Start sharing your knowledge with the world.
                    </p>
                    <Link to="/course/create" className="mt-6">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">Create Your First Course</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workshops.map((workshop) => (
                        <WorkshopCard
                            key={workshop.id}
                            workshop={workshop}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWorkshopsPage;
