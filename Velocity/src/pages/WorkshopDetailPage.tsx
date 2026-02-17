import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import { getWorkshopById, enrollInWorkshop } from "../api/workshopApi";
import type { Workshop } from "../Types/Workshop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Video as VideoIcon, Play, Check, Circle, BookOpen, Clock, ChevronRight, Lock, ListVideo, Settings } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Link } from "react-router";
import VideoPlayer from "../components/Video/VideoPlayer";
import { VideoShell } from "../components/Video/VideoShell";
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

    // Reset selected video when ID changes
    useEffect(() => {
        setSelectedVideoId(null);
        setIsPlaying(false);
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
            if (id) {
                const response = await getWorkshopById(id);
                setWorkshop(response.data);
            }
        } catch (error) {
            toast.error("Failed to load course");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            toast.error("Please log in to enroll in courses");
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
            toast.error(error.response?.data?.message || "Failed to enroll in course");
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
        if (!workshop) return;

        setWorkshop(prev => {
            if (!prev) return prev;

            const updateVideoInList = (videos?: any[]) => {
                if (!videos) return videos;
                return videos.map(v => {
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
            };

            // Update top-level videos
            const updatedTopVideos = updateVideoInList(prev.videos);

            // Update section videos
            const updatedSections = prev.sections?.map(section => ({
                ...section,
                videos: updateVideoInList(section.videos)
            }));

            return {
                ...prev,
                videos: updatedTopVideos,
                sections: updatedSections
            };
        });
    };

    const handleVideoComplete = () => {
        fetchWorkshop();
        // Auto-play next video
        if (allVideos.length > 0 && selectedVideoId) {
            const currentIndex = allVideos.findIndex(v => v.id === selectedVideoId);
            if (currentIndex !== -1 && currentIndex < allVideos.length - 1) {
                const nextVideo = allVideos[currentIndex + 1];
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
        return <Navigate to="/course/all" />;
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
                    className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-indigo-600 dark:hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 border border-indigo-500/20 dark:border-transparent"
                    size="lg"
                >
                    Log in to Enroll
                </Button>
            );
        }

        if (user.role !== "USER") return null;

        if (workshop.enrollmentStatus === "APPROVED") {
            return (
                <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-green-500/20 text-emerald-700 dark:text-green-100 px-4 py-2 rounded-full backdrop-blur-sm border border-emerald-500/20 dark:border-green-500/30 shadow-sm">
                    <Check className="w-4 h-4" />
                    <span className="font-bold text-sm">Enrolled</span>
                </div>
            );
        }

        if (workshop.enrollmentStatus === "PENDING") {
            return (
                <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-100 px-4 py-2 rounded-full backdrop-blur-sm border border-amber-500/20 dark:border-yellow-500/30 shadow-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-sm">Poslat zahtev</span>
                </div>
            );
        }

        if (workshop.enrollmentStatus === "DENIED") {
            return (
                <Badge className="bg-rose-500/10 dark:bg-red-500/20 text-rose-700 dark:text-red-100 px-4 py-2 rounded-full backdrop-blur-sm border border-rose-500/20 dark:border-red-500/30 font-bold">
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
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-indigo-600 dark:hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 border border-indigo-500/20 dark:border-transparent"
                size="lg"
            >
                {isEnrolling ? "Requesting..." : "Prijavite se"}
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
                className={`w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-gray-50 dark:hover:bg-muted focus:outline-none group relative overflow-hidden ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
            >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />}

                <div className="flex-shrink-0">
                    {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                    ) : !canWatch ? (
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-muted text-gray-400 dark:text-gray-500 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5" />
                        </div>
                    ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
                            <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 text-transparent group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                            <Circle className="w-full h-full" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {video.title}
                    </p>
                    {percentageWatched > 0 && !isCompleted && canWatch && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">In Progress</p>
                    )}
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium tabular-nums group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {formatDuration(video.duration)}
                </div>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-indigo-500/30 text-foreground transition-colors duration-300">
            {/* Top Navigation Bar - Glassmorphism */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/course/all">
                            <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all rounded-full px-4">
                                <ChevronRight className="w-4 h-4 rotate-180 mr-1" />

                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border hidden md:block" />
                        <h1 className="font-bold text-foreground truncate max-w-[200px] md:max-w-md text-lg tracking-tight" title={workshop.title}>
                            {workshop.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {workshop.enrollmentStatus === "APPROVED" && (
                            <div className="hidden md:flex flex-col items-end mr-2 group cursor-help">
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {Math.round(overallProgress)}% Complete
                                </div>
                                <div className="w-36 h-1.5 bg-gray-200 dark:bg-muted rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {(user?.role === 'TRAINER' && isOwner) && (
                            <Button
                                onClick={() => navigate(`/course/${id}/manage`)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-9 px-4 shadow-sm flex items-center gap-2"
                                size="sm"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Manage Course</span>
                            </Button>
                        )}
                        {getEnrollmentButton()}
                    </div>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 py-8 max-w-[1600px]">
                <div className="flex flex-col lg:flex-row gap-8 h-full">
                    {/* Main Content Area (Video) */}
                    <div className="flex-1 min-w-0 flex flex-col gap-8" ref={videoSectionRef}>
                        {selectedVideo ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* MEDIA AREA */}
                                {(isOwner || workshop.enrollmentStatus === "APPROVED") ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                                        <VideoShell>
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
                                        </VideoShell>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl aspect-video flex flex-col items-center justify-center text-center p-8 relative ring-1 ring-white/10 group">
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

                                        <div className="bg-white/10 backdrop-blur-2xl p-6 md:p-10 rounded-[2.5rem] border border-white/20 max-w-lg w-full relative z-10 shadow-3xl">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner border border-white/10">
                                                <Lock className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 tracking-tight">Zakljucan sadrzaj</h3>
                                            <p className="text-indigo-100/80 mb-8 md:mb-10 text-base md:text-lg leading-relaxed">
                                                Prijavite se za {workshop.title} da bi ste otkljucali sve lekcije i sadrzaj.
                                            </p>
                                            <div className="flex justify-center scale-110">
                                                {getEnrollmentButton()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* METADATA AREA (Always Visible) */}
                                <div className="space-y-8 px-2">
                                    <div className="border-b border-border pb-8">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
                                                    {selectedVideo.title}
                                                </h2>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-400/20">
                                                        Lekcija {allVideos.findIndex(v => v.id === selectedVideoId)! + 1}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDuration(selectedVideo.duration)}
                                                    </span>
                                                    {!isOwner && workshop.enrollmentStatus !== "APPROVED" && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                                                <Lock className="w-3.5 h-3.5" />
                                                                Zakljucano
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-card border-border hover:bg-muted hover:text-indigo-600 transition-all shadow-sm"
                                                    disabled={allVideos.findIndex(v => v.id === selectedVideoId) === 0}
                                                    onClick={() => {
                                                        const currentIndex = allVideos.findIndex(v => v.id === selectedVideoId);
                                                        if (currentIndex > 0) {
                                                            handleVideoSelect(allVideos[currentIndex - 1].id);
                                                        }
                                                    }}
                                                >
                                                    <ChevronRight className="w-4 h-4 rotate-180 mr-1.5" />
                                                    Prethodna Lekcija
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300"
                                                    disabled={allVideos.findIndex(v => v.id === selectedVideoId) === allVideos.length - 1}
                                                    onClick={() => {
                                                        const currentIndex = allVideos.findIndex(v => v.id === selectedVideoId);
                                                        if (currentIndex < allVideos.length - 1) {
                                                            handleVideoSelect(allVideos[currentIndex + 1].id);
                                                        }
                                                    }}
                                                >
                                                    Sledeca Lekcija
                                                    <ChevronRight className="w-4 h-4 ml-1.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {(isOwner || workshop.enrollmentStatus === "APPROVED") ? (
                                            selectedVideo.description && (
                                                <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed bg-muted/30 p-6 rounded-2xl border border-border shadow-sm">
                                                    <p>{selectedVideo.description}</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="bg-muted/10 p-6 rounded-2xl border border-dashed border-border flex items-center gap-4 text-muted-foreground italic">
                                                <Lock className="w-5 h-5 opacity-40" />
                                                <p>Prijavite se za ovaj kurs da biste videli kompletan sadrzaj i lekcije.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted/20 rounded-2xl flex items-center justify-center border-2 border-dashed border-border shadow-inner">
                                <div className="text-center text-muted-foreground">
                                    <div className="bg-card p-4 rounded-full shadow-sm inline-flex mb-4 border border-border">
                                        <VideoIcon className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium">Izaberite lekciju da biste poceli da gledate</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Course Content) */}
                    <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-6">
                        {/* About this Workshop Area */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                Detalji o kursu
                            </h3>
                            <div className="flex items-center gap-4 mb-4">
                                <Link
                                    to={`/trainers/${workshop.trainer?.id}`}
                                    className="flex items-center gap-3 hover:bg-muted p-2 -ml-2 rounded-xl transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        {workshop.trainer?.first_name?.[0]}{workshop.trainer?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground group-hover:text-indigo-600 transition-colors text-sm">
                                            {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            Instruktor
                                            <Badge variant="secondary" className="text-[8px] bg-muted text-muted-foreground px-1 h-3 flex items-center">Verified</Badge>
                                        </p>
                                    </div>
                                </Link>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-sm line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                                {workshop.description}
                            </p>
                        </div>
                        <div className="bg-card rounded-2xl border border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden flex flex-col max-h-[calc(100vh-140px)] sticky top-24 ring-1 ring-black/5 dark:ring-white/5">
                            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between backdrop-blur-sm">
                                <h3 className="font-bold text-foreground text-lg">Sadržaj Kursa</h3>
                                <Badge variant="secondary" className="bg-card border-border text-muted-foreground shadow-sm">
                                    {totalVideosCount} Lekcije
                                </Badge>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 bg-card">
                                {workshop.videos && workshop.videos.length > 0 && (
                                    <div className="divide-y divide-border/50">
                                        {workshop.videos.map((video) => renderVideoItem(video))}
                                    </div>
                                )}

                                {workshop.sections && workshop.sections.length > 0 && (
                                    <Accordion type="multiple" className="w-full" defaultValue={workshop.sections.map(s => s.id)}>
                                        {workshop.sections.map((section) => (
                                            <AccordionItem key={section.id} value={section.id} className="border-b border-border last:border-0 overflow-hidden">
                                                <AccordionTrigger className="px-5 py-4 bg-muted/20 hover:bg-muted/40 transition-colors hover:no-underline group border-none">
                                                    <div className="flex items-center gap-3 text-left w-full">
                                                        <div className="w-8 h-8 rounded-lg bg-card border border-border text-muted-foreground flex items-center justify-center shadow-sm group-hover:border-indigo-100 dark:group-hover:border-indigo-900 group-hover:text-indigo-500 transition-all">
                                                            <ListVideo className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="font-bold text-foreground text-sm">{section.title}</span>
                                                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                                {section.videos?.length || 0} lekcija
                                                            </p>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-0">
                                                    <div className="divide-y divide-border/30 bg-card">
                                                        {section.videos && section.videos.length > 0 ? (
                                                            section.videos.map((video) => renderVideoItem(video))
                                                        ) : (
                                                            <div className="p-8 text-center bg-muted/10">
                                                                <p className="text-sm text-muted-foreground italic">Nema lekcija u ovoj sekciji</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}

                                {totalVideosCount === 0 && (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                                            <BookOpen className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">Jos uvek nema dostupnog materijala</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Progress (shown only on mobile below content) */}
                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm md:hidden">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm font-bold text-foreground">Progres</span>
                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{overallProgress}%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkshopDetailPage;
