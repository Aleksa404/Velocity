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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">
                                {trainer.first_name} {trainer.last_name}
                            </CardTitle>
                            <CardDescription>{trainer.email}</CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                            {trainer.role}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600 mb-1" />
                            <span className="font-semibold">{trainer._count?.followers || 0}</span>
                            <span className="text-muted-foreground text-xs">Followers</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                            <Video className="w-5 h-5 text-indigo-600 mb-1" />
                            <span className="font-semibold">{trainer._count?.videos || 0}</span>
                            <span className="text-muted-foreground text-xs">Videos</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600 mb-1" />
                            <span className="font-semibold">{trainer._count?.workshops || 0}</span>
                            <span className="text-muted-foreground text-xs">Workshops</span>
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
