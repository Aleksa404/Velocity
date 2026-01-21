import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Check, Users, X } from "lucide-react";
import type { Workshop } from "@/Types/Workshop";
import { useEffect, useState } from "react";
import { approveEnrollment, denyEnrollment, getTrainerPendingEnrollments } from "@/api/workshopApi";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";

const TrainerDashboard = () => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [workshopsWithPending, setWorkshopsWithPending] = useState<Workshop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            console.log("Fetching data...");

            const response = await getTrainerPendingEnrollments();

            setWorkshopsWithPending(response.data);
        } catch (error: any) {
            console.error("Error fetching data:", error.response?.data?.message);
            toast.error(error.response?.data?.message || "Failed to load enrollment requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (enrollmentId: string) => {
        try {
            await approveEnrollment(enrollmentId);
            toast.success("Enrollment approved");
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Failed to approve enrollment");
        }
    };

    const handleDeny = async (enrollmentId: string) => {
        try {
            await denyEnrollment(enrollmentId);
            toast.success("Enrollment denied");
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Failed to deny enrollment");
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Trainer Dashboard</h1>
                <p className="text-muted-foreground font-medium">Manage your Courses and content.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5 backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />
                    <CardHeader className="relative">
                        <CardTitle className="text-foreground font-bold">Create Course</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Create a new course and start accepting enrollments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-indigo-500/20" onClick={() => navigate("/course/create")}>
                            Create Course
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg dark:hover:ring-1 dark:hover:ring-white/10 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-foreground font-bold">Manage Courses</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            View your courses, approve enrollments, and add videos to each course.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl h-11 border border-border/50" onClick={() => navigate("/course/my")}>
                            View My Courses
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <Card className="bg-card border-border shadow-sm dark:shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Enrollment Requests
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">
                        Manage user enrollments for this course.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {workshopsWithPending.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-2xl border-dashed border-2 border-border/50">
                            <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground font-bold italic">No enrollment requests yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {workshopsWithPending.map((workshop) => (
                                <div key={workshop.id} className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{workshop.title}</h3>
                                        <Badge variant="secondary" className="ml-auto bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                            {workshop.enrollments?.length} Pending
                                        </Badge>
                                    </div>
                                    <div className="grid gap-3">
                                        {workshop.enrollments?.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/10 border border-border/50 rounded-2xl transition-all hover:border-indigo-500/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                                                        {enrollment.user?.first_name?.charAt(0)}{enrollment.user?.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">
                                                            {enrollment.user?.first_name} {enrollment.user?.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-medium">{enrollment.user?.email}</p>
                                                        <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold uppercase tracking-wider">
                                                            Requested: {new Date(enrollment.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl h-9 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 font-bold"
                                                        onClick={() => handleApprove(enrollment.id)}
                                                    >
                                                        <Check className="w-4 h-4 mr-1.5" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl h-9 border-rose-500/20 text-rose-600 hover:bg-rose-500/10 font-bold"
                                                        onClick={() => handleDeny(enrollment.id)}
                                                    >
                                                        <X className="w-4 h-4 mr-1.5" />
                                                        Deny
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TrainerDashboard;
