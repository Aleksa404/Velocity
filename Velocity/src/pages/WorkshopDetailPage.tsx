import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import { getWorkshopById, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Video, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Link } from "react-router";

const WorkshopDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const user = useUserStore((state) => state.user);

    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        if (id) {
            fetchWorkshop();
        }
    }, [id]);

    const fetchWorkshop = async () => {
        try {
            const response = await getWorkshopById(id!);
            setWorkshop(response.data);
        } catch (error) {
            console.error("Error fetching workshop:", error);
            toast.error("Failed to load workshop");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            toast.error("Please log in to enroll in workshops");
            return;
        }

        if (!id) return;

        try {
            await enrollInWorkshop(id);
            toast.success("Enrollment request submitted! Waiting for trainer approval.");

            // Update workshop enrollment status
            if (workshop) {
                setWorkshop({
                    ...workshop,
                    enrollmentStatus: "PENDING",
                    _count: workshop._count ? {
                        ...workshop._count,
                        enrollments: workshop._count.enrollments + 1
                    } : undefined
                });
            }
        } catch (error: any) {
            console.error("Error enrolling in workshop:", error);
            toast.error(error.response?.data?.message || "Failed to enroll in workshop");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-5xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading workshop...</p>
                </div>
            </div>
        );
    }

    if (!workshop) {
        return <Navigate to="/workshops" />;
    }

    const workshopDate = new Date(workshop.date);
    const isPast = workshopDate < new Date();
    const isUpcoming = !isPast;
    const isFull = workshop.capacity && workshop._count && workshop._count.enrollments >= workshop.capacity;
    const isOwner = user && user.id === workshop.trainerId;

    const getEnrollmentButton = () => {
        if (!user || user.role !== "USER") return null;

        if (workshop.enrollmentStatus === "APPROVED") {
            return (
                <Badge className="bg-green-100 text-green-800 text-base px-6 py-3">
                    ✓ You are enrolled
                </Badge>
            );
        }

        if (workshop.enrollmentStatus === "PENDING") {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 text-base px-6 py-3">
                    ⏳ Pending Approval
                </Badge>
            );
        }

        if (workshop.enrollmentStatus === "DENIED") {
            return (
                <Badge className="bg-red-100 text-red-800 text-base px-6 py-3">
                    ✗ Request Denied
                </Badge>
            );
        }

        return (
            <Button
                onClick={async () => {
                    setIsEnrolling(true);
                    await handleEnroll();
                    setIsEnrolling(false);
                }}
                disabled={isFull || isPast || isEnrolling}
                size="lg"
            >
                {isEnrolling ? "Requesting..." : isFull ? "Workshop Full" : isPast ? "Past Workshop" : "Request to Enroll"}
            </Button>
        );
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl">{workshop.title}</CardTitle>
                                <Badge className={isUpcoming ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {isUpcoming ? "Upcoming" : "Past"}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Led by{" "}
                                <Link
                                    to={`/trainers/${workshop.trainer?.id}`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                                </Link>
                            </CardDescription>
                        </div>
                        {getEnrollmentButton()}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                            <span className="font-semibold text-sm">
                                {workshopDate.toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">Date</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-600 mb-2" />
                            <span className="font-semibold text-sm">
                                {workshopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-muted-foreground">Time</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600 mb-2" />
                            <span className="font-semibold text-sm">
                                {workshop._count?.enrollments || 0}
                                {workshop.capacity ? `/${workshop.capacity}` : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">Enrolled</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Video className="w-5 h-5 text-indigo-600 mb-2" />
                            <span className="font-semibold text-sm">{workshop._count?.videos || 0}</span>
                            <span className="text-xs text-muted-foreground">Videos</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{workshop.description}</p>
                    </div>

                    {isOwner && (
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/workshops/${workshop.id}/manage`)}
                            >
                                Manage Enrollments
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Videos Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Workshop Videos</CardTitle>
                    <CardDescription>
                        {workshop.videos && workshop.videos.length > 0
                            ? "Videos included in this workshop"
                            : "No videos have been added to this workshop yet"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {workshop.videos && workshop.videos.length > 0 ? (
                        <div className="space-y-4">
                            {workshop.videos.map((video) => (
                                <div key={video.id} className="p-4 border rounded-lg">
                                    <h4 className="font-medium">{video.title}</h4>
                                    <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-600 hover:underline"
                                    >
                                        Watch on YouTube →
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            No videos available yet
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default WorkshopDetailPage;
