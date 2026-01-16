import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router";
import { getTrainerProfile, followTrainer, unfollowTrainer } from "../../api/trainerApi";
import type { Trainer } from "../../Types/Trainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Calendar, Mail, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../../stores/userStore";

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

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-5xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading trainer profile...</p>
                </div>
            </div>
        );
    }

    if (!trainer) {
        return <Navigate to="/trainers" />;
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl">
                                    {trainer.first_name} {trainer.last_name}
                                </CardTitle>
                                <Badge className="bg-blue-100 text-blue-800">
                                    {trainer.role}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {trainer.email}
                            </CardDescription>
                        </div>
                        {user && user.id !== trainer.id && (
                            <Button
                                onClick={handleFollowToggle}
                                variant={isFollowing ? "outline" : "default"}
                                className="min-w-[120px]"
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
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Users className="w-6 h-6 text-indigo-600 mb-2" />
                            <span className="text-2xl font-bold">{trainer._count?.followers || 0}</span>
                            <span className="text-muted-foreground text-sm">Followers</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Video className="w-6 h-6 text-indigo-600 mb-2" />
                            <span className="text-2xl font-bold">{trainer._count?.videos || 0}</span>
                            <span className="text-muted-foreground text-sm">Videos</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-indigo-600 mb-2" />
                            <span className="text-2xl font-bold">{trainer._count?.workshops || 0}</span>
                            <span className="text-muted-foreground text-sm">Workshops</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workshops Section - Coming soon */}
            <Card>
                <CardHeader>
                    <CardTitle>Workshops</CardTitle>
                    <CardDescription>Upcoming and past workshops by this trainer</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Workshop details coming soon...
                    </p>
                </CardContent>
            </Card>

            {/* Videos Section - Coming soon */}
            <Card>
                <CardHeader>
                    <CardTitle>Videos</CardTitle>
                    <CardDescription>Recent videos from this trainer</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Video list coming soon...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default TrainerProfilePage;
