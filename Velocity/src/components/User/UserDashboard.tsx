import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getUserEnrollments, unenrollFromWorkshop } from "../../api/workshopApi";
import { getFollowing, unfollowTrainer } from "../../api/trainerApi";
import type { WorkshopEnrollment } from "../../Types/Workshop";
import type { Follow } from "../../Types/Trainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Calendar, User, X, Video } from "lucide-react";
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
    const [unenrollDialog, setUnenrollDialog] = useState<{ open: boolean; workshopId: string | null }>({
        open: false,
        workshopId: null
    });
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
            setUnenrollDialog({ open: false, workshopId: null });
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Enrolled</Badge>;
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
            case "DENIED":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Denied</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
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
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Dashboard</h1>
                <p className="text-muted-foreground">Manage your workshops and followed trainers.</p>
            </div>

            <Tabs defaultValue="workshops" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="workshops">My Workshops</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                </TabsList>

                <TabsContent value="workshops" className="space-y-6">
                    {enrollments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
                                <p className="text-muted-foreground text-lg">You haven't enrolled in any workshops yet.</p>
                                <Button onClick={() => navigate("/workshops")}>Browse Workshops</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment) => (
                                <Card key={enrollment.id} className="overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl truncate pr-2" title={enrollment.workshop?.title}>
                                                {enrollment.workshop?.title}
                                            </CardTitle>
                                            {getStatusBadge(enrollment.status)}
                                        </div>
                                        <CardDescription className="flex items-center mt-2">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {enrollment.workshop?.date && new Date(enrollment.workshop.date).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <User className="h-4 w-4 mr-2" />
                                                Trainer: {enrollment.workshop?.trainer?.first_name} {enrollment.workshop?.trainer?.last_name}
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => navigate(`/workshops/${enrollment.workshopId}`)}
                                                >
                                                    <Video className="h-4 w-4 mr-2" />
                                                    View Videos
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="default"
                                                    title="Unenroll"
                                                    disabled={processingId === enrollment.workshopId}
                                                    onClick={() => setUnenrollDialog({ open: true, workshopId: enrollment.workshopId })}
                                                >
                                                    {processingId === enrollment.workshopId ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <p>Unenroll</p>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="following" className="space-y-6">
                    {following.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
                                <p className="text-muted-foreground text-lg">You are not following any trainers yet.</p>
                                <Button onClick={() => navigate("/trainers")}>Find Trainers</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {following.map((follow) => (
                                <Card key={follow.id}>
                                    <CardHeader>
                                        <CardTitle>{follow.trainer?.first_name} {follow.trainer?.last_name}</CardTitle>
                                        <CardDescription>{follow.trainer?.email}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => navigate(`/trainers/${follow.trainerId}`)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button

                                                variant="destructive"
                                                onClick={() => setUnfollowDialog({ open: true, trainerId: follow.trainerId })}
                                                disabled={processingId === follow.trainerId}
                                            >
                                                {processingId === follow.trainerId ? "Processing..." : "Unfollow"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Unenroll Confirmation Dialog */}
            <AlertDialog open={unenrollDialog.open} onOpenChange={(open) => setUnenrollDialog({ open, workshopId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unenroll from Workshop?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unenroll from this workshop? This action cannot be undone, and you'll need to request enrollment again if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => unenrollDialog.workshopId && handleUnenroll(unenrollDialog.workshopId)}
                            className="bg-destructive text-amber-50 hover:bg-destructive/90"
                        >
                            Unenroll
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unfollow Confirmation Dialog */}
            <AlertDialog open={unfollowDialog.open} onOpenChange={(open) => setUnfollowDialog({ open, trainerId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unfollow Trainer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unfollow this trainer? You can follow them again later if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-amber-50 hover:bg-destructive/90"
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
