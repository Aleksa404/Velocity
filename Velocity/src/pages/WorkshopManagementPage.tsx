import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getWorkshopById, getWorkshopEnrollments, approveEnrollment, denyEnrollment } from "../api/workshopApi";
import { deleteVideo } from "../api/videoApi";
import type { Workshop, WorkshopEnrollment } from "../Types/Workshop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Video as VideoIcon, Users, Trash } from "lucide-react";
import VideoForm from "../components/Video/VideoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const WorkshopManagementPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; videoId: string | null }>({
        open: false,
        videoId: null
    });

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [workshopRes, enrollmentsRes] = await Promise.all([
                getWorkshopById(id!),
                getWorkshopEnrollments(id!)
            ]);
            setWorkshop(workshopRes.data);
            setEnrollments(enrollmentsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load workshop data");
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

    const handleVideoPosted = () => {
        fetchData(); // Refresh to show new video count/list
    };

    const handleDeleteVideo = async (videoId: string) => {
        try {
            const result = await deleteVideo(videoId);
            if (result.success) {
                toast.success("Video deleted successfully");
                fetchData(); // Refresh list
            } else {
                toast.error(result.message || "Failed to delete video");
            }
        } catch (error) {
            toast.error("Failed to delete video");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!workshop) {
        return <div className="p-8 text-center">Workshop not found</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <Button variant="ghost" onClick={() => navigate(`/workshops/${id}`)} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workshop
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{workshop.title}</h1>
                    <p className="text-muted-foreground">Management Dashboard</p>
                </div>
            </div>

            <Tabs defaultValue="enrollments" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                    <TabsTrigger value="content">Content & Videos</TabsTrigger>
                </TabsList>

                <TabsContent value="enrollments">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Enrollment Requests
                            </CardTitle>
                            <CardDescription>
                                Manage user enrollments for this workshop.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollments.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No enrollment requests yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {enrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    {enrollment.user?.first_name} {enrollment.user?.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{enrollment.user?.email}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Requested: {new Date(enrollment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {enrollment.status === "PENDING" ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleApprove(enrollment.id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeny(enrollment.id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Deny
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant={enrollment.status === "APPROVED" ? "default" : "destructive"}>
                                                        {enrollment.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <VideoIcon className="w-5 h-5" />
                                    Add New Video
                                </CardTitle>
                                <CardDescription>
                                    Upload a video specifically for this workshop. Only enrolled users will see it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <VideoForm onVideoPosted={handleVideoPosted} workshopId={id || ""} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Your Videos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {workshop.videos && workshop.videos.length > 0 ? (
                                    <div className="space-y-4">
                                        {workshop.videos.map((video) => (
                                            <div key={video.id} className="p-4 border rounded-lg flex justify-between items-center">
                                                <span className="font-medium">{video.title}</span>
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={video.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-indigo-600 hover:underline"
                                                    >
                                                        View
                                                    </a>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setRemoveDialog({ open: true, videoId: video.id })}
                                                    >
                                                        <p>Remove</p>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No videos added yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <AlertDialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, videoId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this video? You can add it again later if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-amber-50 hover:bg-destructive/90"
                            onClick={() => removeDialog.videoId && handleDeleteVideo(removeDialog.videoId)}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default WorkshopManagementPage;
