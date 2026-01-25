import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, BookOpen } from "lucide-react";
import type { Trainer } from "../../Types/Trainer";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TrainerCardProps {
    trainer: Trainer;
    onFollowToggle?: (trainerId: string, isFollowing: boolean) => void;
    isFollowing?: boolean;
}

const TrainerCard = ({ trainer, onFollowToggle, isFollowing }: TrainerCardProps) => {
    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onFollowToggle) {
            onFollowToggle(trainer.id, isFollowing || false);
        }
    };

    const initials = `${trainer.first_name?.[0] || ""}${trainer.last_name?.[0] || ""}`.toUpperCase();

    return (
        <Link to={`/trainers/${trainer.id}`}>
            <Card className="group relative overflow-hidden bg-card border-border hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl h-full flex flex-col">
                {/* Decorative Header Background */}
                <div className="h-8 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-indigo-600/20 relative">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                    <Badge className="absolute top-2.5 right-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-semibold uppercase tracking-wider text-[9px] px-2 py-0">
                        {trainer.role}
                    </Badge>
                </div>

                <CardContent className="px-4 pb-4 -mt-8 flex flex-col flex-1 relative z-10">
                    {/* Profile Header*/}
                    <div className="flex flex-col items-center text-center space-y-2 mb-4">
                        <div className="relative">
                            <Avatar className="h-16 w-16 border-4 border-card shadow-md ring-1 ring-indigo-500/20">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="space-y-0.5">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {trainer.first_name} {trainer.last_name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium line-clamp-1">{trainer.email}</p>
                        </div>
                    </div>

                    {/* Stats Grid*/}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/40 dark:bg-muted/10 border border-border/50 hover:border-indigo-500/30 transition-colors group/stat">
                            <Users className="w-3.5 h-3.5 text-indigo-500 mb-1 transition-transform group-hover/stat:scale-110" />
                            <span className="text-xs font-bold text-foreground leading-none">{trainer._count?.followers || 0}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Followers</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/40 dark:bg-muted/10 border border-border/50 hover:border-indigo-500/30 transition-colors group/stat">
                            <Video className="w-3.5 h-3.5 text-purple-500 mb-1 transition-transform group-hover/stat:scale-110" />
                            <span className="text-xs font-bold text-foreground leading-none">{trainer._count?.videos || 0}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Videos</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/40 dark:bg-muted/10 border border-border/50 hover:border-indigo-500/30 transition-colors group/stat">
                            <BookOpen className="w-3.5 h-3.5 text-pink-500 mb-1 transition-transform group-hover/stat:scale-110" />
                            <span className="text-xs font-bold text-foreground leading-none">{trainer._count?.workshops || 0}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Courses</span>
                        </div>
                    </div>

                    {/* Action Row - Compact */}
                    <div className="mt-auto pt-1">
                        {onFollowToggle && (
                            <Button
                                onClick={handleFollowClick}
                                variant={isFollowing ? "destructive" : "default"}
                                className={`w-full h-9 rounded-xl font-bold text-sm transition-all ${isFollowing
                                    ? "hover:bg-red-100 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20"
                                    }`}
                            >
                                {isFollowing ? "Unfollow" : "Follow"}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default TrainerCard;
