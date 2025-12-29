import { useEffect, useState } from "react";
import { getMyWorkshops, deleteWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import WorkshopCard from "../components/Workshop/WorkshopCard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus, ArrowLeft } from "lucide-react";

const MyWorkshopsPage = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWorkshops();
    }, []);

    const fetchWorkshops = async () => {
        setIsLoading(true);
        try {
            const response = await getMyWorkshops();
            setWorkshops(response.data);
        } catch (error) {
            console.error("Error fetching workshops:", error);
            toast.error("Failed to load your workshops");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (workshopId: string) => {
        try {
            await deleteWorkshop(workshopId);
            setWorkshops((prev) => prev.filter((w) => w.id !== workshopId));
            toast.success("Workshop deleted successfully");
        } catch (error) {
            console.error("Error deleting workshop:", error);
            toast.error("Failed to delete workshop");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading your workshops...</p>
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
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Workshops</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your workshops, enrollments, and content.
                    </p>
                </div>
                <Link to="/workshops/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Workshop
                    </Button>
                </Link>
            </div>

            {workshops.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        You haven't created any workshops yet.
                    </p>
                    <Link to="/workshops/create" className="mt-4 inline-block">
                        <Button>Create Your First Workshop</Button>
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
