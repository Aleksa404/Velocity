import type { TrainerRequest } from "../../Types/TrainerRequest";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, MessageSquare } from "lucide-react";

interface TrainerRequestCardProps {
    request: TrainerRequest;
    onApprove: (requestId: string) => void;
    onDeny: (requestId: string) => void;
    isProcessing: boolean;
}

const TrainerRequestCard = ({ request, onApprove, onDeny, isProcessing }: TrainerRequestCardProps) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                                {request.user?.first_name} {request.user?.last_name}
                            </h3>
                            <Badge className="bg-yellow-100 text-yellow-800">
                                {request.status}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.user?.email}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {request.message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
                                <p className="text-sm text-gray-600">{request.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                </div>

                {request.status === "PENDING" && (
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={() => onApprove(request.id)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            Approve
                        </Button>
                        <Button
                            onClick={() => onDeny(request.id)}
                            disabled={isProcessing}
                            variant="destructive"
                            className="flex-1"
                        >
                            Deny
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TrainerRequestCard;
