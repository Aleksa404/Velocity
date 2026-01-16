import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import { getWorkshopById, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Video as VideoIcon, Play, Check, Circle, BookOpen, Clock, ChevronRight, Lock, ListVideo } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Link } from "react-router";
import VideoPlayer from "../components/Video/VideoPlayer";
import { getYouTubeThumbnail, isYouTubeUrl, formatDuration } from "@/lib/videoUtils";

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
        if (!selectedVideoId) {
            if (workshop?.videos && workshop.videos.length > 0) {
                setSelectedVideoId(workshop.videos[0].id);
            } else if (workshop?.sections && workshop.sections.length > 0) {
                const firstSectionWithVideos = workshop.sections.find(s => s.videos && s.videos.length > 0);
                if (firstSectionWithVideos && firstSectionWithVideos.videos) {
                    setSelectedVideoId(firstSectionWithVideos.videos[0].id);
                }
            }
        }
    }, [workshop, selectedVideoId]);

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
            <div className="container mx-auto p-6 max-w-7xl animate-pulse">
                <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
                <div className="flex gap-8">
                    <div className="w-1/3 h-96 bg-gray-200 rounded-2xl"></div>
                    <div className="w-2/3 h-96 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!workshop) {
        return <Navigate to="/workshops" />;
    }

    const isOwner = user && user.id === workshop.trainerId;

    // Get all videos for progress calculation
    const allVideos = [
        ...(workshop.videos || []),
        ...(workshop.sections?.flatMap(s => s.videos || []) || [])
    ];

    const selectedVideo = allVideos.find(v => v.id === selectedVideoId);
    const completedCount = allVideos.filter(v => v.watchProgress?.[0]?.isCompleted).length || 0;
    const totalVideosCount = allVideos.length || 0;
    const overallProgress = totalVideosCount > 0 ? Math.round((completedCount / totalVideosCount) * 100) : 0;

    const getEnrollmentButton = () => {
        if (!user) {
            return (
                <Button
                    onClick={() => navigate("/login")}
                    className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    size="lg"
                >
                    Log in to Enroll
                </Button>
            );
        }

        if (user.role !== "USER") return null;

        if (workshop.enrollmentStatus === "APPROVED") {
            return (
                <div className="flex items-center gap-2 bg-green-500/20 text-green-100 px-4 py-2 rounded-full backdrop-blur-sm border border-green-500/30">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Enrolled</span>
                </div>
            );
        }

        if (workshop.enrollmentStatus === "PENDING") {
            return (
                <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-100 px-4 py-2 rounded-full backdrop-blur-sm border border-yellow-500/30">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Pending Approval</span>
                </div>
            );
        }

        if (workshop.enrollmentStatus === "DENIED") {
            return (
                <Badge className="bg-red-500/20 text-red-100 px-4 py-2 rounded-full backdrop-blur-sm border border-red-500/30">
                    Denied
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
                className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                size="lg"
            >
                {isEnrolling ? "Requesting..." : "Start Learning Now"}
            </Button>
        );
    };

    // Helper for rendering video placeholder
    const renderVideoPlaceholder = () => {
        if (!selectedVideo) return null;

        const isYouTube = isYouTubeUrl(selectedVideo.url);
        const thumbnailUrl = isYouTube ? getYouTubeThumbnail(selectedVideo.url) : null;

        return (
            <div
                className={`w-full h-full relative cursor-pointer group flex items-center justify-center ${!isYouTube ? "bg-gradient-to-br from-indigo-900 to-purple-900" : ""
                    }`}
                onClick={() => setIsPlaying(true)}
            >
                {isYouTube && thumbnailUrl ? (
                    <>
                        <img
                            src={thumbnailUrl}
                            alt={selectedVideo.title}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    </>
                ) : (
                    <div className="text-white/20 text-9xl font-bold select-none">▶</div>
                )}

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/30">
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-indigo-600 ml-1" fill="currentColor" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderVideoItem = (video: any) => {
        const progress = video.watchProgress?.[0];
        const isCompleted = progress?.isCompleted;
        const isSelected = video.id === selectedVideoId;
        const percentageWatched = progress?.percentWatched || 0;
        const isEnrolled = workshop.enrollmentStatus === "APPROVED";
        const canWatch = isOwner || isEnrolled;

        return (
            <button
                key={video.id}
                onClick={() => handleVideoSelect(video.id)}
                className={`w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-gray-50 focus:outline-none group relative overflow-hidden ${isSelected ? 'bg-indigo-50/60' : ''}`}
            >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />}

                <div className="flex-shrink-0">
                    {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                    ) : !canWatch ? (
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5" />
                        </div>
                    ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
                            <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 text-transparent group-hover:border-gray-400 transition-colors">
                            <Circle className="w-full h-full" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {video.title}
                    </p>
                    {percentageWatched > 0 && !isCompleted && canWatch && (
                        <p className="text-xs text-indigo-600 mt-0.5 font-medium">In Progress</p>
                    )}
                </div>

                <div className="text-xs text-gray-400 font-medium tabular-nums group-hover:text-gray-600">
                    {formatDuration(video.duration)}
                </div>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white pb-12 pt-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full blur-3xl mix-blend-overlay"></div>
                    <div className="absolute top-1/2 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl mix-blend-overlay"></div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                        <div className="space-y-4 max-w-3xl">
                            <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium tracking-wide uppercase">
                                <BookOpen className="w-4 h-4" />
                                <span>Workshop</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                                {workshop.title}
                            </h1>
                            <div className="flex items-center gap-6 text-indigo-100 text-sm md:text-base">
                                <Link
                                    to={`/trainers/${workshop.trainer?.id}`}
                                    className="flex items-center gap-2 hover:text-white transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500 group-hover:ring-white transition-all">
                                        {workshop.trainer?.first_name?.[0]}{workshop.trainer?.last_name?.[0]}
                                    </div>
                                    <span>{workshop.trainer?.first_name} {workshop.trainer?.last_name}</span>
                                </Link>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 opacity-70" />
                                    {workshop._count?.enrollments || 0} Students
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <VideoIcon className="w-4 h-4 opacity-70" />
                                    {totalVideosCount} Lessons
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {getEnrollmentButton()}
                            {isOwner && (
                                <Button
                                    variant="outline"
                                    className="border-indigo-400 bg-indigo-900/50 text-indigo-100 hover:bg-indigo-800 hover:text-white"
                                    onClick={() => navigate(`/workshops/${workshop.id}/manage`)}
                                >
                                    Manage Workshop
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar in Hero */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10 mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Course Progress</h3>
                                <p className="text-indigo-200 text-sm">{completedCount} of {totalVideosCount} lessons completed</p>
                            </div>
                            <span className="text-2xl font-bold text-white">{overallProgress}%</span>
                        </div>
                        <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-500 ease-out"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl -mt-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Content List */}
                    <div className="lg:order-2 lg:w-96 flex-shrink-0">
                        <div className="sticky top-6 space-y-6">
                            <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden ring-1 ring-black/5 bg-white">
                                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        Course Contents
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-gray-400 transform rotate-90" />
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {/* Unsectioned Videos */}
                                    {workshop.videos && workshop.videos.length > 0 && (
                                        <div className="divide-y divide-gray-100">
                                            {workshop.videos.map((video) => renderVideoItem(video))}
                                        </div>
                                    )}

                                    {/* Sectioned Videos */}
                                    {workshop.sections && workshop.sections.length > 0 && (
                                        <Accordion type="multiple" className="w-full" defaultValue={workshop.sections.map(s => s.id)}>
                                            {workshop.sections.map((section) => (
                                                <AccordionItem key={section.id} value={section.id} className="border-none">
                                                    <AccordionTrigger className="px-4 py-3 bg-gray-50/50 hover:bg-gray-100/50 hover:no-underline text-left border-y border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                                <ListVideo className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="font-bold text-gray-800 text-sm uppercase tracking-tight">{section.title}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-0">
                                                        <div className="divide-y divide-gray-100 bg-white">
                                                            {section.videos && section.videos.length > 0 ? (
                                                                section.videos.map((video) => renderVideoItem(video))
                                                            ) : (
                                                                <div className="p-4 text-xs text-gray-400 italic text-center">No lessons in this section</div>
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    )}

                                    {totalVideosCount === 0 && (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            No lessons available yet.
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="border-none shadow-lg shadow-gray-100/50 p-6 bg-white/80 backdrop-blur-sm">
                                <h3 className="font-bold text-gray-900 mb-3">About this Workshop</h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    {workshop.description}
                                </p>

                            </Card>
                        </div>
                    </div>

                    {/* Video Player */}
                    <div className="flex-1 lg:order-1 min-w-0 space-y-6" ref={videoSectionRef}>
                        {selectedVideo ? (
                            // Check if user has access to watch
                            (isOwner || workshop.enrollmentStatus === "APPROVED") ? (
                                <div className="space-y-6">
                                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video ring-1 ring-black/10">
                                        {isPlaying ? (
                                            <VideoPlayer
                                                key={selectedVideo.id}
                                                videoUrl={selectedVideo.url}
                                                dbVideoId={selectedVideo.id}
                                                initialProgress={selectedVideo.watchProgress?.[0]?.isCompleted ? 0 : (selectedVideo.watchProgress?.[0]?.watchedSeconds || 0)}
                                                onComplete={handleVideoComplete}
                                                onProgressUpdate={(seconds, percent) =>
                                                    handleProgressUpdate(selectedVideo.id, seconds, percent)
                                                }
                                            />
                                        ) : (
                                            renderVideoPlaceholder()
                                        )}
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                                        <div className="flex justify-between items-start gap-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                                    {selectedVideo.title}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                    <span>Lesson {allVideos.findIndex(v => v.id === selectedVideoId)! + 1}</span>
                                                    <span>•</span>
                                                    <span className={selectedVideo.watchProgress?.[0]?.isCompleted ? "text-emerald-600 font-medium" : ""}>
                                                        {selectedVideo.watchProgress?.[0]?.isCompleted ? "Completed" : "Unwatched"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedVideo.description && (
                                            <div className="prose prose-indigo max-w-none text-gray-600">
                                                <p>{selectedVideo.description}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-100">
                                            <Button
                                                variant="ghost"
                                                className="text-gray-500 hover:text-indigo-600 pl-0 hover:bg-transparent transition-colors"
                                                disabled={allVideos.findIndex(v => v.id === selectedVideoId) === 0}
                                                onClick={() => {
                                                    const currentIndex = allVideos.findIndex(v => v.id === selectedVideoId);
                                                    if (currentIndex > 0) {
                                                        handleVideoSelect(allVideos[currentIndex - 1].id);
                                                    }
                                                }}
                                            >
                                                < ChevronRight className="w-5 h-5 mr-1 transform rotate-180" />
                                                Previous Lesson
                                            </Button>

                                            <Button
                                                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                                                disabled={allVideos.findIndex(v => v.id === selectedVideoId) === allVideos.length - 1}
                                                onClick={() => {
                                                    const currentIndex = allVideos.findIndex(v => v.id === selectedVideoId);
                                                    if (currentIndex < allVideos.length - 1) {
                                                        handleVideoSelect(allVideos[currentIndex + 1].id);
                                                    }
                                                }}
                                            >
                                                Next Lesson
                                                <ChevronRight className="w-5 h-5 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative aspect-video ring-1 ring-black/10 flex items-center justify-center">
                                        <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                                <Lock className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Locked Content</h3>
                                            <p className="text-indigo-200 mb-6 font-medium">
                                                {user ? "Enroll in this workshop to watch the lessons." : "Log in and enroll to watch the lessons."}
                                            </p>
                                            {getEnrollmentButton()}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 opacity-60 pointer-events-none select-none grayscale">
                                        <div className="flex justify-between items-start gap-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                                    {selectedVideo.title}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                    <span>Lesson {allVideos.findIndex(v => v.id === selectedVideoId)! + 1}</span>
                                                    <span>•</span>
                                                    <span>Locked</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedVideo.description && (
                                            <div className="prose prose-indigo max-w-none text-gray-600">
                                                <p>{selectedVideo.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            <Card className="h-96 flex items-center justify-center border-dashed">
                                <div className="text-center text-muted-foreground">
                                    <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Select a lesson to start</p>
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
