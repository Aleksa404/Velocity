import { useEffect, useState } from "react";
import { getUserEnrollments, unenrollFromWorkshop } from "../api/workshopApi";
import type { WorkshopEnrollment } from "../Types/Workshop";
import WorkshopCard from "../components/Workshop/WorkshopCard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";

const EnrolledWorkshopsPage = () => {
    const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            const response = await getUserEnrollments();
            setEnrollments(response.data);
        } catch (error) {
            console.error("Error fetching enrollments:", error);
            toast.error("Failed to load your enrolled workshops");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnenroll = async (workshopId: string) => {
        try {
            await unenrollFromWorkshop(workshopId);
            toast.success("Unenrolled successfully");
            setEnrollments(enrollments.filter(e => e.workshopId !== workshopId));
        } catch (error) {
            console.error("Error unenrolling:", error);
            toast.error("Failed to unenroll");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="ml-3 text-muted-foreground">Loading your enrolled workshops...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <Link to="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        My Enrolled Workshops
                    </h1>
                </div>
                <p className="text-muted-foreground ml-12">
                    Access and track your progress in the workshops you've joined.
                </p>
            </div>

            {enrollments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">No enrollments yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't enrolled in any workshops. Browse our selection to find the right training for you.
                    </p>
                    <Link to="/workshops" className="mt-6">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Browse Workshops
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => (
                        <WorkshopCard
                            key={enrollment.id}
                            workshop={enrollment.workshop!}
                            enrollmentStatus={enrollment.status}
                            onDelete={handleUnenroll}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnrolledWorkshopsPage;
