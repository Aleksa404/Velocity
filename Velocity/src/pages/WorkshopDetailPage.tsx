import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import { getWorkshopById, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
// Video type is inferred from Workshop.videos
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Video as VideoIcon, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Link } from "react-router";
import VideoCard from "../components/Video/VideoCard";

const WorkshopDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
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

                });
            }
        } catch (error: any) {
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

    const handleProgressUpdate = (videoId: string, watchedSeconds: number, percent: number) => {
        if (!workshop || !workshop.videos) return;

        setWorkshop(prev => {
            if (!prev || !prev.videos) return prev;

            const updatedVideos = prev.videos.map(v => {
                if (v.id === videoId) {
                    const currentProgress = v.watchProgress?.[0] || {
                        id: "temp", // Temporary ID until refresh
                        userId: user?.id || "",
                        videoId: videoId,
                        watchedSeconds: 0,
                        totalDuration: 0,
                        percentWatched: 0,
                        isCompleted: false,
                        lastWatchedAt: new Date().toISOString()
                    };

                    return {
                        ...v,
                        watchProgress: [{
                            ...currentProgress,
                            watchedSeconds,
                            percentWatched: percent,
                            lastWatchedAt: new Date().toISOString()
                        }]
                    };
                }
                return v;
            });

            return {
                ...prev,
                videos: updatedVideos
            };
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8">
            {/*Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <Badge className={`text-sm px-3 py-1 ${isUpcoming ? "bg-green-400/20 text-green-50 border-green-400/30" : "bg-white/20 text-white border-white/20"}`}>
                                    {isUpcoming ? "Upcoming Workshop" : "Past Workshop"}
                                </Badge>
                                {workshop.capacity && (
                                    <Badge variant="outline" className="text-white border-white/30">
                                        {workshop.capacity - (workshop._count?.enrollments || 0)} spots left
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                                {workshop.title}
                            </h1>

                            <div className="flex items-center gap-2 text-indigo-100 text-lg">
                                <User className="w-5 h-5" />
                                <span>Led by</span>
                                <Link
                                    to={`/trainers/${workshop.trainer?.id}`}
                                    className="font-semibold hover:text-white underline-offset-4 hover:underline transition-colors"
                                >
                                    {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                                </Link>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {getEnrollmentButton()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/*Description */}
                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <span>About this Workshop</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                    {workshop.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Videos Section - Larger Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Workshop Videos</h2>
                                <p className="text-muted-foreground mt-1">
                                    {workshop.videos && workshop.videos.length > 0
                                        ? "Watch the sessions and materials included in this workshop."
                                        : "No videos have been added yet."}
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {workshop._count?.videos || 0} Videos
                            </Badge>
                        </div>

                        {workshop.videos && workshop.videos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-8">
                                {workshop.videos.map((video) => (
                                    <div key={video.id} className="group">
                                        <VideoCard
                                            video={video}
                                            isPlaying={playingVideoId === video.id}
                                            onPlay={() => setPlayingVideoId(video.id)}
                                            onComplete={() => fetchWorkshop()}
                                            onProgressUpdate={(seconds, percent) =>
                                                handleProgressUpdate(video.id, seconds, percent)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <VideoIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No videos available yet</p>
                                    <p className="text-sm text-muted-foreground/80">Check back later for content updates.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Workshop Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-muted-foreground">Date</p>
                                    <p className="font-semibold text-gray-900">{workshopDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-muted-foreground">Time</p>
                                    <p className="font-semibold text-gray-900">{workshopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-pink-50 text-pink-600 rounded-lg">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-muted-foreground">Enrollment</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">
                                            {workshop._count?.enrollments || 0} enrolled
                                        </p>
                                        {workshop.capacity && (
                                            <span className="text-xs text-muted-foreground">
                                                (Cap: {workshop.capacity})
                                            </span>
                                        )}
                                    </div>
                                    {workshop.capacity && (
                                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                                                style={{ width: `${Math.min(((workshop._count?.enrollments || 0) / workshop.capacity) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isOwner && (
                                <div className="pt-6 border-t mt-6">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate(`/workshops/${workshop.id}/manage`)}
                                    >
                                        Manage Workshop
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WorkshopDetailPage;
