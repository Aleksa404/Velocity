import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router";
import { getTrainerProfile, followTrainer, unfollowTrainer } from "../../api/trainerApi";
import { enrollInWorkshop } from "../../api/workshopApi";
import type { Trainer } from "../../Types/Trainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Calendar, Mail, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../../stores/userStore";
import { cn } from "@/lib/utils";
import WorkshopCard from "../../components/Workshop/WorkshopCard";

const TrainerProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        if (id) {
            fetchTrainerProfile();
        }
    }, [id]);

    const fetchTrainerProfile = async () => {
        try {
            const response = await getTrainerProfile(id!);
            setTrainer(response.data);
            setIsFollowing(response.data.isFollowing || false);
        } catch (error) {
            console.error("Error fetching trainer profile:", error);
            toast.error("Failed to load trainer profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!user) {
            toast.error("Please log in to follow trainers");
            return;
        }

        if (!id) return;

        try {
            if (isFollowing) {
                await unfollowTrainer(id);
                setIsFollowing(false);
                toast.success("Unfollowed trainer");

                // Update follower count
                if (trainer && trainer._count) {
                    setTrainer({
                        ...trainer,
                        _count: {
                            ...trainer._count,
                            followers: trainer._count.followers - 1
                        }
                    });
                }
            } else {
                await followTrainer(id);
                setIsFollowing(true);
                toast.success("Following trainer");

                // Update follower count
                if (trainer && trainer._count) {
                    setTrainer({
                        ...trainer,
                        _count: {
                            ...trainer._count,
                            followers: trainer._count.followers + 1
                        }
                    });
                }
            }
        } catch (error: any) {
            console.error("Error toggling follow:", error);
            toast.error(error.response?.data?.message || "Failed to update follow status");
        }
    };

    const handleEnroll = async (workshopId: string) => {
        if (!user) {
            toast.error("Please log in to enroll in workshops");
            return;
        }

        try {
            await enrollInWorkshop(workshopId);
            toast.success("Enrollment request submitted! Waiting for trainer approval.");

            // Update trainer workshops list with pending status
            if (trainer && trainer.workshops) {
                setTrainer({
                    ...trainer,
                    workshops: trainer.workshops.map(w =>
                        w.id === workshopId
                            ? { ...w, enrollmentStatus: "PENDING" }
                            : w
                    )
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
                    <p className="text-muted-foreground font-medium">Loading trainer profile...</p>
                </div>
            </div>
        );
    }

    if (!trainer) {
        return <Navigate to="/trainers" />;
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-8">
            {/* Header Card */}
            <Card className="bg-card border-border shadow-sm dark:shadow-none overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                <CardHeader className="relative pb-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                                    {trainer.first_name} {trainer.last_name}
                                </CardTitle>
                                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-semibold px-2.5 py-0.5">
                                    {trainer.role}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-muted-foreground font-medium">
                                <Mail className="w-4 h-4" />
                                {trainer.email}
                            </CardDescription>
                        </div>
                        {user && user.id !== trainer.id && (
                            <Button
                                onClick={handleFollowToggle}
                                variant={isFollowing ? "outline" : "default"}
                                className={cn(
                                    "min-w-[140px] rounded-xl h-11 font-bold transition-all shadow-lg",
                                    !isFollowing
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                                        : "bg-muted/50 dark:bg-muted/10 border-border text-foreground hover:bg-muted"
                                )}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Following
                                    </>
                                ) : (
                                    "Follow"
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-6 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-border/50 group hover:border-indigo-500/30 transition-all duration-300">
                            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-3xl font-bold text-foreground">{trainer._count?.followers || 0}</span>
                            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Followers</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-border/50 group hover:border-indigo-500/30 transition-all duration-300">
                            <Video className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-3xl font-bold text-foreground">{trainer._count?.videos || 0}</span>
                            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Videos</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-border/50 group hover:border-indigo-500/30 transition-all duration-300">
                            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-3xl font-bold text-foreground">{trainer._count?.workshops || 0}</span>
                            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Workshops</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workshops Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Workshops</h2>
                        <p className="text-muted-foreground font-medium">Courses and programs created by this trainer</p>
                    </div>
                </div>

                {!trainer.workshops || trainer.workshops.length === 0 ? (
                    <Card className="bg-card border-border shadow-sm dark:shadow-none border-dashed">
                        <CardContent className="p-12">
                            <div className="text-center">
                                <Calendar className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground font-bold italic">
                                    No workshops available from this trainer yet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trainer.workshops.map((workshop) => (
                            <WorkshopCard
                                key={workshop.id}
                                workshop={{
                                    ...workshop,
                                    trainer: {
                                        id: trainer.id,
                                        first_name: trainer.first_name,
                                        last_name: trainer.last_name,
                                        email: trainer.email
                                    }
                                }}
                                enrollmentStatus={workshop.enrollmentStatus}
                                onEnroll={user && user.role === "USER" ? handleEnroll : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerProfilePage;
