import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Calendar } from "lucide-react";
import type { Trainer } from "../../Types/Trainer";
import { Link } from "react-router";

interface TrainerCardProps {
    trainer: Trainer;
    onFollowToggle?: (trainerId: string, isFollowing: boolean) => void;
    isFollowing?: boolean;
}

const TrainerCard = ({ trainer, onFollowToggle, isFollowing }: TrainerCardProps) => {
    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onFollowToggle) {
            onFollowToggle(trainer.id, isFollowing || false);
        }
    };

    return (
        <Link to={`/trainers/${trainer.id}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full bg-card border-border dark:hover:border-indigo-500/30">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl text-foreground">
                                {trainer.first_name} {trainer.last_name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">{trainer.email}</CardDescription>
                        </div>
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                            {trainer.role}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex flex-col items-center p-3 bg-muted/50 dark:bg-muted/10 rounded-lg border border-border/50">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                            <span className="font-semibold text-foreground">{trainer._count?.followers || 0}</span>
                            <span className="text-muted-foreground text-xs uppercase tracking-tighter">Followers</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 dark:bg-muted/10 rounded-lg border border-border/50">
                            <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                            <span className="font-semibold text-foreground">{trainer._count?.videos || 0}</span>
                            <span className="text-muted-foreground text-xs uppercase tracking-tighter">Videos</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 dark:bg-muted/10 rounded-lg border border-border/50">
                            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                            <span className="font-semibold text-foreground">{trainer._count?.workshops || 0}</span>
                            <span className="text-muted-foreground text-xs uppercase tracking-tighter">Workshops</span>
                        </div>
                    </div>

                    {onFollowToggle && (
                        <Button
                            onClick={handleFollowClick}
                            variant={isFollowing ? "outline" : "default"}
                            className="w-full"
                        >
                            {isFollowing ? "Unfollow" : "Follow"}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};

export default TrainerCard;
