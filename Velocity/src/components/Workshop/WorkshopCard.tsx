import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trash2, Layers, PlayCircle, Settings } from "lucide-react";
import type { Workshop } from "../../Types/Workshop";
import { Link, useNavigate } from "react-router";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserStore } from "@/stores/userStore";

interface WorkshopCardProps {
    workshop: Workshop;
    onEnroll?: (workshopId: string) => void;
    enrollmentStatus?: string | null;
    onDelete?: (workshopId: string) => void;
}

const WorkshopCard = ({ workshop, onEnroll, enrollmentStatus, onDelete }: WorkshopCardProps) => {
    const [isEnrolling, setIsEnrolling] = useState(false);
    const user = useUserStore((state) => state.user);
    const navigate = useNavigate();

    // Calculate progress based on watched videos
    const calculateProgress = () => {
        if (!workshop.videos || workshop.videos.length === 0) return 0;

        const completedVideos = workshop.videos.filter(video =>
            video.watchProgress && video.watchProgress[0]?.isCompleted
        ).length;

        return Math.round((completedVideos / workshop.videos.length) * 100);
    };

    const progress = enrollmentStatus === "APPROVED" ? calculateProgress() : 0;
    const isEnrolled = enrollmentStatus === "APPROVED";
    const isPending = enrollmentStatus === "PENDING";
    const isDenied = enrollmentStatus === "DENIED";

    const getEnrollmentButton = () => {
        if (!onEnroll) return null;

        if (isEnrolled) return null;

        if (isPending) {
            return (
                <Button
                    disabled
                    className="w-full bg-card text-amber-600 dark:text-yellow-400 border  h-10 rounded-xl font-medium"
                >
                    Enrollment Pending
                </Button>
            );
        }

        if (isDenied) {
            return (
                <Button
                    disabled
                    className="w-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 h-10 rounded-xl font-medium"
                >
                    Enrollment Denied
                </Button>
            );
        }

        return (
            <Button
                onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEnrolling(true);
                    await onEnroll(workshop.id);
                    setIsEnrolling(false);
                }}
                disabled={isEnrolling}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 rounded-xl font-medium shadow-sm hover:shadow-indigo-500/10 transition-all"
            >
                {isEnrolling ? "Requesting..." : "Enroll in Course"}
            </Button>
        );
    };

    const handleDelete = async (e: React.MouseEvent) => {
        if (onDelete) {
            e.preventDefault();
            e.stopPropagation();
            await onDelete(workshop.id)
        }
    };


    return (
        <Card className="group relative overflow-hidden  bg-card shadow-sm hover:shadow-xl dark:shadow-none dark:hover:ring-1 dark:hover:ring-white/10 transition-all duration-300 rounded-2xl flex flex-col h-full border border-border">
            {/* Action Overlay (Delete) */}
            {onDelete && (
                <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-card/80 dark:bg-muted/80 backdrop-blur shadow-sm text-muted-foreground hover:text-red-500 hover:bg-card transition-colors border border-border"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()} className="dark:border-white/10">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">{user?.role == 'USER' ? 'Unenroll' : 'Delete course'}</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                    {user?.role == 'USER' ? 'Are you sure you want to unenroll from this course?' :
                                        'Are you sure you want to delete ' + workshop.title + '? This action cannot be undone.'}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="dark:bg-muted dark:text-foreground">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        handleDelete(e)

                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {user?.role == 'USER' ? 'Unenroll' : 'Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            <Link to={`/course/${workshop.id}`} className="flex flex-col h-full">
                {/* Image Area */}
                <div className="relative aspect-[16/9] overflow-hidden">
                    {workshop.imageUrl ? (
                        <img
                            src={`${import.meta.env.VITE_API_URL}${workshop.imageUrl}`}
                            alt={workshop.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-orange-50 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-8 transition-transform duration-500 group-hover:scale-105">
                            {/* Placeholder for real images - using a styled text design as fallback */}
                            <div className="text-center font-serif">
                                <h4 className="text-2xl font-bold text-gray-800 dark:text-slate-200 leading-tight uppercase tracking-tighter opacity-80 decoration-indigo-500/30 underline decoration-4">
                                    {workshop.title.split(' ').slice(0, 3).join('\n')}
                                </h4>
                            </div>
                            {/* Decorative pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 dark:opacity-20 pointer-events-none">
                                <Layers className="w-full h-full text-indigo-500" />
                            </div>
                        </div>
                    )}

                    {/* Badge Overlay */}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                        {isEnrolled && (
                            <Badge className="bg-green-500/90 text-white border-0 shadow-sm backdrop-blur-sm">
                                Enrolled
                            </Badge>
                        )}
                        {isPending && (
                            <Badge className="bg-yellow-500/90 text-white border-0 shadow-sm backdrop-blur-sm">
                                Pending
                            </Badge>
                        )}
                    </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                    {/* Title and Badge Row */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {workshop.title}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            by {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                        </p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-[13px] text-muted-foreground border-t border-border pt-4">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{workshop._count?.sections || 0} Sections</span>
                            <span className="mx-0.5 opacity-50">•</span>
                            <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{workshop._count?.videos || 0} Lessons</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium italic opacity-80">
                            <Users className="w-3.5 h-3.5" />
                            <span>{workshop._count?.enrollments || 0} students</span>
                        </div>
                    </div>

                    {/* Kurs / Description */}
                    <div className="flex-1">

                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {workshop.description}
                        </p>
                    </div>

                    {/* Progress Bar or Action */}
                    <div className="mt-auto pt-2 space-y-3">
                        {isEnrolled ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                    <span>PROGRESS</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            getEnrollmentButton()
                        )}

                        {(user?.role === 'ADMIN' || (user?.role === 'TRAINER' && user?.id === workshop.trainerId)) && (
                            <Button
                                variant="secondary"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 border border-border/100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/course/${workshop.id}/manage`);
                                }}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Course
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};

export default WorkshopCard;
