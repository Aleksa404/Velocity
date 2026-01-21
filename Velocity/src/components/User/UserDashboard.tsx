import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getUserEnrollments, unenrollFromWorkshop } from "../../api/workshopApi";
import { getFollowing, unfollowTrainer } from "../../api/trainerApi";
import type { WorkshopEnrollment } from "../../Types/Workshop";
import type { Follow } from "../../Types/Trainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import WorkshopCard from "../Workshop/WorkshopCard";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserDashboard = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
    const [following, setFollowing] = useState<Follow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [unfollowDialog, setUnfollowDialog] = useState<{ open: boolean; trainerId: string | null }>({
        open: false,
        trainerId: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [enrollmentsData, followingData] = await Promise.all([
                getUserEnrollments(),
                getFollowing()
            ]);
            setEnrollments(enrollmentsData.data);
            setFollowing(followingData.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnenroll = async (workshopId: string) => {
        try {
            setProcessingId(workshopId);
            await unenrollFromWorkshop(workshopId);
            toast.success("Unenrolled successfully");
            setEnrollments(enrollments.filter(e => e.workshopId !== workshopId));
        } catch (error) {
            console.error("Error unenrolling:", error);
            toast.error("Failed to unenroll");
        } finally {
            setProcessingId(null);
        }
    };

    const handleUnfollow = async (trainerId: string) => {
        try {
            setProcessingId(trainerId);
            await unfollowTrainer(trainerId);
            toast.success("Unfollowed successfully");
            setFollowing(following.filter(f => f.trainerId !== trainerId));
            setUnfollowDialog({ open: false, trainerId: null });
        } catch (error) {
            console.error("Error unfollowing:", error);
            toast.error("Failed to unfollow");
        } finally {
            setProcessingId(null);
        }
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Dashboard</h1>
                <p className="text-muted-foreground font-medium">Manage your courses and followed trainers.</p>
            </div>

            <Tabs defaultValue="courses" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 dark:border dark:border-white/5 shadow-inner">
                    <TabsTrigger value="courses" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
                        My Courses
                    </TabsTrigger>
                    <TabsTrigger value="following" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
                        Following
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="space-y-6 outline-none">
                    {enrollments.length === 0 ? (
                        <Card className="bg-muted/20 border-dashed border-2 border-border/50">
                            <CardContent className="flex flex-col items-center justify-center h-80 space-y-6">
                                <div className="p-4 bg-background rounded-full shadow-sm dark:shadow-none border border-border">
                                    <Loader2 className="w-8 h-8 text-muted-foreground opacity-20" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-foreground text-xl font-bold">No courses yet</p>
                                    <p className="text-muted-foreground font-medium">You haven't enrolled in any courses yet.</p>
                                </div>
                                <Button onClick={() => navigate("/course/all")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-indigo-500/20">
                                    Browse Courses
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment) => (
                                enrollment.workshop && (
                                    <WorkshopCard
                                        key={enrollment.id}
                                        workshop={enrollment.workshop}
                                        enrollmentStatus={enrollment.status}
                                        onDelete={handleUnenroll}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="following" className="space-y-6 outline-none">
                    {following.length === 0 ? (
                        <Card className="bg-muted/20 border-dashed border-2 border-border/50">
                            <CardContent className="flex flex-col items-center justify-center h-80 space-y-6">
                                <div className="p-4 bg-background rounded-full shadow-sm border border-border">
                                    <Loader2 className="w-8 h-8 text-muted-foreground opacity-20" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-foreground text-xl font-bold">No trainers followed</p>
                                    <p className="text-muted-foreground font-medium">You are not following any trainers yet.</p>
                                </div>
                                <Button onClick={() => navigate("/trainers")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-indigo-500/20">
                                    Find Trainers
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {following.map((follow) => (
                                <Card key={follow.id} className="bg-card border-border hover:shadow-lg dark:hover:ring-1 dark:hover:ring-white/10 transition-all duration-300 overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-foreground font-bold">{follow.trainer?.first_name} {follow.trainer?.last_name}</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium">{follow.trainer?.email}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2.5 pt-2 border-t border-border/50">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl h-10 border border-border/50"
                                                onClick={() => navigate(`/trainers/${follow.trainerId}`)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 font-bold rounded-xl h-10 border-border text-muted-foreground transition-all"
                                                onClick={() => setUnfollowDialog({ open: true, trainerId: follow.trainerId })}
                                                disabled={processingId === follow.trainerId}
                                            >
                                                {processingId === follow.trainerId ? "..." : "Unfollow"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Unfollow Confirmation Dialog */}
            <AlertDialog open={unfollowDialog.open} onOpenChange={(open) => setUnfollowDialog({ open, trainerId: null })}>
                <AlertDialogContent className="dark:border-white/10 dark:bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground font-bold">Unfollow Trainer?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                            Are you sure you want to unfollow this trainer? You can follow them again later if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-muted border-border text-foreground font-bold rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20"
                            onClick={() => unfollowDialog.trainerId && handleUnfollow(unfollowDialog.trainerId)}
                        >
                            Unfollow
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UserDashboard;
