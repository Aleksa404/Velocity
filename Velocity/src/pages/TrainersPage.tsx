import { useEffect, useState } from "react";
import { getAllTrainers, followTrainer, unfollowTrainer } from "../api/trainerApi";
import type { Trainer } from "../Types/Trainer";
import TrainerCard from "../components/Trainer/TrainerCard";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";

const TrainersPage = () => {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            const response = await getAllTrainers();
            setTrainers(response.data);

            // Initialize following map
            const map: Record<string, boolean> = {};
            response.data.forEach((trainer: Trainer) => {
                map[trainer.id] = trainer.isFollowing || false;
            });
            setFollowingMap(map);
        } catch (error) {
            console.error("Error fetching trainers:", error);
            toast.error("Failed to load trainers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async (trainerId: string, isCurrentlyFollowing: boolean) => {
        if (!user) {
            toast.error("Please log in to follow trainers");
            return;
        }

        try {
            if (isCurrentlyFollowing) {
                await unfollowTrainer(trainerId);
                setFollowingMap(prev => ({ ...prev, [trainerId]: false }));
                toast.success("Unfollowed trainer");
            } else {
                await followTrainer(trainerId);
                setFollowingMap(prev => ({ ...prev, [trainerId]: true }));
                toast.success("Following trainer");
            }

            // Update trainer follower count
            setTrainers(prev => prev.map(trainer => {
                if (trainer.id === trainerId && trainer._count) {
                    return {
                        ...trainer,
                        _count: {
                            ...trainer._count,
                            followers: trainer._count.followers + (isCurrentlyFollowing ? -1 : 1)
                        }
                    };
                }
                return trainer;
            }));
        } catch (error: any) {
            console.error("Error toggling follow:", error);
            toast.error(error.response?.data?.message || "Failed to update follow status");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading trainers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainers</h1>
                <p className="text-muted-foreground">
                    Discover and follow professional trainers to stay updated with their content.
                </p>
            </div>

            {trainers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No trainers found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map((trainer) => (
                        <TrainerCard
                            key={trainer.id}
                            trainer={trainer}
                            isFollowing={followingMap[trainer.id]}
                            onFollowToggle={user ? handleFollowToggle : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainersPage;
