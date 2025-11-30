import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Video, Clock } from "lucide-react";
import type { Workshop } from "../../Types/Workshop";
import { Link } from "react-router";

interface WorkshopCardProps {
    workshop: Workshop;
    onEnroll?: (workshopId: string) => void;
    enrollmentStatus?: string | null;
}

const WorkshopCard = ({ workshop, onEnroll, enrollmentStatus }: WorkshopCardProps) => {
    const workshopDate = new Date(workshop.date);
    const isPast = workshopDate < new Date();
    const isUpcoming = !isPast;

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

        // Check if workshop is full
        const isFull = workshop.capacity && workshop._count && workshop._count.enrollments >= workshop.capacity;

        return (
            <Button
                onClick={async (e) => {
                    e.preventDefault();
                    setIsEnrolling(true);
                    await onEnroll(workshop.id);
                    setIsEnrolling(false);
                }}
                disabled={isFull || isPast || isEnrolling}
                className="w-full"
            >
                {isEnrolling ? "Requesting..." : isFull ? "Workshop Full" : isPast ? "Past Workshop" : "Request to Enroll"}
            </Button>
        );
    };

    return (
        <Link to={`/workshops/${workshop.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <CardTitle className="text-xl line-clamp-2">{workshop.title}</CardTitle>
                            <CardDescription className="mt-1">
                                by {workshop.trainer?.first_name} {workshop.trainer?.last_name}
                            </CardDescription>
                        </div>
                        <Badge className={isUpcoming ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {isUpcoming ? "Upcoming" : "Past"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {workshop.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <div className="flex flex-col">
                                <span className="font-medium text-xs">
                                    {workshopDate.toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {workshopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <div className="flex flex-col">
                                <span className="font-medium text-xs">
                                    {workshop._count?.enrollments || 0}
                                    {workshop.capacity ? `/${workshop.capacity}` : ""}
                                </span>
                                <span className="text-xs text-muted-foreground">Enrolled</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <span>{workshop._count?.videos || 0} videos</span>
                    </div>

                    {getEnrollmentButton()}
                </CardContent>
            </Card>
        </Link>
    );
};

export default WorkshopCard;
