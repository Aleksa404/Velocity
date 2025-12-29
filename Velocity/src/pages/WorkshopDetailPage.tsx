import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import { getWorkshopById, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import type { Video } from "../Types/Video";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video as VideoIcon, User, Play, Check, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Link } from "react-router";
import VideoPlayer from "../components/Video/VideoPlayer";

const WorkshopDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const user = useUserStore((state) => state.user);
    const videoSectionRef = useRef<HTMLDivElement>(null);

    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        if (id) {
            fetchWorkshop();
        }
    }, [id]);

    // Auto-select first video when workshop loads
    useEffect(() => {
        if (workshop?.videos && workshop.videos.length > 0 && !selectedVideoId) {
            setSelectedVideoId(workshop.videos[0].id);
        }
    }, [workshop?.videos, selectedVideoId]);

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

    const handleVideoSelect = (videoId: string) => {
        setSelectedVideoId(videoId);
        setIsPlaying(true);
        // Scroll to video player on mobile
        if (window.innerWidth < 1024) {
            videoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleProgressUpdate = (videoId: string, watchedSeconds: number, percent: number) => {
        if (!workshop || !workshop.videos) return;

        setWorkshop(prev => {
            if (!prev || !prev.videos) return prev;

            const updatedVideos = prev.videos.map(v => {
                if (v.id === videoId) {
                    const currentProgress = v.watchProgress?.[0] || {
                        id: "temp",
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
                            isCompleted: percent >= 95,
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

    const handleVideoComplete = () => {
        fetchWorkshop();
        // Auto-play next video
        if (workshop?.videos && selectedVideoId) {
            const currentIndex = workshop.videos.findIndex(v => v.id === selectedVideoId);
            if (currentIndex < workshop.videos.length - 1) {
                const nextVideo = workshop.videos[currentIndex + 1];
                setSelectedVideoId(nextVideo.id);
                toast.success("Moving to next video!");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading workshop...</p>
                </div>
            </div>
        );
    }

    if (!workshop) {
        return <Navigate to="/workshops" />;
    }

    const isOwner = user && user.id === workshop.trainerId;
    const selectedVideo = workshop.videos?.find(v => v.id === selectedVideoId);
    const completedCount = workshop.videos?.filter(v => v.watchProgress?.[0]?.isCompleted).length || 0;
    const totalVideos = workshop.videos?.length || 0;
    const overallProgress = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

    const getEnrollmentButton = () => {
        if (!user || user.role !== "USER") return null;

        if (workshop.enrollmentStatus === "APPROVED") {
            return (
                <Badge className="bg-green-100 text-green-800 text-sm px-4 py-2">
                    ✓ Enrolled
                </Badge>
            );
        }

        if (workshop.enrollmentStatus === "PENDING") {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2">
                    ⏳ Pending
                </Badge>
            );
        }

        if (workshop.enrollmentStatus === "DENIED") {
            return (
                <Badge className="bg-red-100 text-red-800 text-sm px-4 py-2">
                    ✗ Denied
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
                disabled={isEnrolling}
                size="sm"
            >
                {isEnrolling ? "Requesting..." : "Enroll"}
            </Button>
        );
    };

    const getYoutubeId = (url: string) => url.split("v=")[1];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
                <div className="container mx-auto px-4 py-4 max-w-7xl">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold truncate">
                                {workshop.title}
                            </h1>
                            <Link
                                to={`/trainers/${workshop.trainer?.id}`}
                                className="text-indigo-100 text-sm hover:text-white transition-colors"
                            >
                                by {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            {getEnrollmentButton()}
                            {isOwner && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/workshops/${workshop.id}/manage`)}
                                >
                                    Manage
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - workshop Content */}

                    <div className="lg:w-80 xl:w-96 flex-shrink-0 order-2 lg:order-1">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">About this Workshop</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 whitespace-pre-wrap">
                                    {workshop.description}
                                </p>
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {workshop._count?.enrollments || 0} enrolled
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <VideoIcon className="w-4 h-4" />
                                        {totalVideos} videos
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="sticky top-4">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Workshop Content
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-xs">
                                        {completedCount}/{totalVideos}
                                    </Badge>
                                </div>
                                {/* Overall Progress Bar */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>{overallProgress}% complete</span>
                                        <span>{completedCount} of {totalVideos} sections</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                                            style={{ width: `${overallProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {workshop.videos && workshop.videos.length > 0 ? (
                                    <div className="divide-y">
                                        {workshop.videos.map((video, index) => {
                                            const progress = video.watchProgress?.[0];
                                            const isCompleted = progress?.isCompleted;
                                            const percentWatched = progress?.percentWatched || 0;
                                            const isSelected = video.id === selectedVideoId;

                                            return (
                                                <button
                                                    key={video.id}
                                                    onClick={() => handleVideoSelect(video.id)}
                                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Section Number / Status */}
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : isSelected
                                                                ? 'bg-indigo-500 text-white'
                                                                : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {isCompleted ? (
                                                                <Check className="w-4 h-4" />
                                                            ) : (
                                                                <span className="text-sm font-medium">{index + 1}</span>
                                                            )}
                                                        </div>

                                                        {/* Video Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium line-clamp-2 ${isSelected ? 'text-indigo-700' : 'text-gray-900'
                                                                }`}>
                                                                {video.title}
                                                            </p>

                                                            {/* Progress indicator */}
                                                            {percentWatched > 0 && !isCompleted && (
                                                                <div className="mt-2">
                                                                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-indigo-400"
                                                                            style={{ width: `${percentWatched}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground mt-1">
                                                                        {percentWatched}% watched
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {isCompleted && (
                                                                <span className="text-xs text-green-600 mt-1 inline-block">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Play indicator */}
                                                        {isSelected && isPlaying && (
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <VideoIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No videos yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content - Video Player */}
                    <div className="flex-1 order-1 lg:order-2 min-w-0" ref={videoSectionRef}>
                        {selectedVideo ? (
                            <div className="space-y-4">
                                {/* Video Player */}
                                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg">
                                    {isPlaying && getYoutubeId(selectedVideo.url) ? (
                                        <VideoPlayer
                                            key={selectedVideo.id}
                                            videoId={getYoutubeId(selectedVideo.url)}
                                            dbVideoId={selectedVideo.id}
                                            initialProgress={selectedVideo.watchProgress?.[0]?.watchedSeconds || 0}
                                            onComplete={handleVideoComplete}
                                            onProgressUpdate={(seconds, percent) =>
                                                handleProgressUpdate(selectedVideo.id, seconds, percent)
                                            }
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full relative cursor-pointer group"
                                            onClick={() => setIsPlaying(true)}
                                        >
                                            <img
                                                src={`https://img.youtube.com/vi/${getYoutubeId(selectedVideo.url)}/maxresdefault.jpg`}
                                                alt={selectedVideo.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${getYoutubeId(selectedVideo.url)}/hqdefault.jpg`;
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                                    <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Video Details */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {selectedVideo.title}
                                                </h2>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Section {(workshop.videos?.findIndex(v => v.id === selectedVideoId) || 0) + 1} of {totalVideos}
                                                </p>
                                            </div>
                                            {selectedVideo.watchProgress?.[0]?.isCompleted && (
                                                <Badge className="bg-green-100 text-green-700">
                                                    <Check className="w-3 h-3 mr-1" /> Completed
                                                </Badge>
                                            )}
                                        </div>

                                        {selectedVideo.description && (
                                            <div className="mt-4">


                                                <p className="mt-3 text-gray-600 whitespace-pre-wrap">
                                                    {selectedVideo.description}
                                                </p>

                                            </div>
                                        )}

                                        {/* Navigation Buttons */}
                                        <div className="flex justify-between mt-6 pt-6 border-t">
                                            <Button
                                                variant="outline"
                                                disabled={!workshop.videos || workshop.videos.findIndex(v => v.id === selectedVideoId) === 0}
                                                onClick={() => {
                                                    const currentIndex = workshop.videos?.findIndex(v => v.id === selectedVideoId) || 0;
                                                    if (workshop.videos && currentIndex > 0) {
                                                        handleVideoSelect(workshop.videos[currentIndex - 1].id);
                                                    }
                                                }}
                                            >
                                                ← Previous
                                            </Button>
                                            <Button
                                                disabled={!workshop.videos || workshop.videos.findIndex(v => v.id === selectedVideoId) === workshop.videos.length - 1}
                                                onClick={() => {
                                                    const currentIndex = workshop.videos?.findIndex(v => v.id === selectedVideoId) || 0;
                                                    if (workshop.videos && currentIndex < workshop.videos.length - 1) {
                                                        handleVideoSelect(workshop.videos[currentIndex + 1].id);
                                                    }
                                                }}
                                            >
                                                Next →
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>



                            </div>
                        ) : (
                            <Card className="h-96 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No videos available</p>
                                    <p className="text-sm mt-1">Check back later for content updates.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkshopDetailPage;
