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
        <Card className="bg-card border-border hover:shadow-lg dark:hover:ring-1 dark:hover:ring-white/10 transition-all duration-300 overflow-hidden relative">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-foreground">
                                {request.user?.first_name} {request.user?.last_name}
                            </h3>
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 font-semibold px-2.5 py-0.5">
                                {request.status}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-muted-foreground font-medium">
                            <Mail className="w-3.5 h-3.5" />
                            {request.user?.email}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {request.message && (
                    <div className="p-3.5 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border/50">
                        <div className="flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Message:</p>
                                <p className="text-sm text-foreground italic">"{request.message}"</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                </div>

                {request.status === "PENDING" && (
                    <div className="flex gap-2.5 pt-2">
                        <Button
                            onClick={() => onApprove(request.id)}
                            disabled={isProcessing}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold shadow-lg shadow-emerald-500/20"
                        >
                            {isProcessing ? "..." : "Approve"}
                        </Button>
                        <Button
                            onClick={() => onDeny(request.id)}
                            disabled={isProcessing}
                            variant="outline"
                            className="flex-1 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 border-border font-bold rounded-xl h-10 text-muted-foreground transition-all"
                        >
                            {isProcessing ? "..." : "Deny"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TrainerRequestCard;
