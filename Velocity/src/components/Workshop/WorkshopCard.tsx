import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Video, Trash2 } from "lucide-react";
import type { Workshop } from "../../Types/Workshop";
import { Link } from "react-router";
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

interface WorkshopCardProps {
    workshop: Workshop;
    onEnroll?: (workshopId: string) => void;
    enrollmentStatus?: string | null;
    onDelete?: (workshopId: string) => void;
}

const WorkshopCard = ({ workshop, onEnroll, enrollmentStatus, onDelete }: WorkshopCardProps) => {
    const [isEnrolling, setIsEnrolling] = useState(false);

    const getEnrollmentButton = () => {
        if (!onEnroll) return null;

        if (enrollmentStatus === "APPROVED") {
            return (
                <Badge className="bg-green-100 text-green-800 w-full justify-center py-2">
                    Enrolled
                </Badge>
            );
        }

        if (enrollmentStatus === "PENDING") {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 w-full justify-center py-2">
                    Pending Approval
                </Badge>
            );
        }

        if (enrollmentStatus === "DENIED") {
            return (
                <Badge className="bg-red-100 text-red-800 w-full justify-center py-2">
                    Request Denied
                </Badge>
            );
        }

        return (
            <Button
                onClick={async (e) => {
                    e.preventDefault();
                    setIsEnrolling(true);
                    await onEnroll(workshop.id);
                    setIsEnrolling(false);
                }}
                disabled={isEnrolling}
                className="w-full"
            >
                {isEnrolling ? "Requesting..." : "Request to Enroll"}
            </Button>
        );
    };

    return (
        <Card className="hover:shadow-lg transition-shadow bg-white h-full flex flex-col relative group">
            <Link to={`/workshops/${workshop.id}`} className="flex-1 flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl line-clamp-2 pr-8">{workshop.title}</CardTitle>
                            <CardDescription className="mt-1">
                                by {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {workshop.description}
                    </p>

                    <div className="mt-auto pt-4 space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-xs">
                                        {workshop._count?.enrollments || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Enrolled</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Video className="w-4 h-4" />
                                <span>{workshop._count?.videos || 0} videos</span>
                            </div>
                        </div>

                        {getEnrollmentButton()}
                    </div>
                </CardContent>
            </Link>

            {onDelete && (
                <div
                    className="absolute top-4 right-4 z-10"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{workshop.title}"? This action cannot be undone and will delete all associated videos.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onDelete(workshop.id);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </Card>
    );
};

export default WorkshopCard;
