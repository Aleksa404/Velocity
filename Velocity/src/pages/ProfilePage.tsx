import { useEffect, useState } from "react";
import { useUserStore } from "../stores/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createTrainerRequest, getUserTrainerRequest } from "../api/trainerRequestApi";
import type { TrainerRequest } from "../Types/TrainerRequest";
import { User, Mail, Shield, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Navigate } from "react-router";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
    const user = useUserStore((state) => state.user);
    const [trainerRequest, setTrainerRequest] = useState<TrainerRequest | null>(null);
    const [requestMessage, setRequestMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'USER') {
            fetchTrainerRequest();

        }
    }, []);

    const fetchTrainerRequest = async () => {
        try {
            const response = await getUserTrainerRequest();
            setTrainerRequest(response.data);
        } catch (error) {
            console.error("Error fetching trainer request:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!requestMessage.trim()) {
            toast.error("Please provide a message with your request");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createTrainerRequest(requestMessage);
            setTrainerRequest(response.data);
            setRequestMessage("");
            toast.success("Trainer request submitted successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit trainer request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <Navigate to="/login" />;
    }

    const getRoleBadge = (role: string) => {
        const roleColors: Record<string, string> = {
            USER: "bg-muted text-muted-foreground border-border",
            TRAINER: "bg-indigo-100/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/20",
            ADMIN: "bg-purple-100/10 text-purple-600 dark:text-purple-400 border-purple-200/20",
        };

        return (
            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-semibold", roleColors[role] || roleColors.USER)}>
                {role}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactElement }> = {
            PENDING: {
                color: "bg-yellow-500/10 text-yellow-600 border-yellow-200/20",
                icon: <Clock className="w-3.5 h-3.5 mr-1" />,
            },
            APPROVED: {
                color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/20",
                icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
            },
            DENIED: {
                color: "bg-rose-500/10 text-rose-600 border-rose-200/20",
                icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
            },
        };

        const config = statusConfig[status] || statusConfig.PENDING;

        return (
            <Badge variant="outline" className={cn(config.color, "flex items-center w-fit px-2.5 py-0.5 font-semibold")}>
                {config.icon}
                {status}
            </Badge>
        );
    };

    const canRequestTrainer = user.role === "USER" && (!trainerRequest || trainerRequest.status === "DENIED");

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
                <p className="text-muted-foreground font-medium">Manage your account information and settings.</p>
            </div>

            {/* User Information Card */}
            <Card className="bg-card border-border shadow-sm dark:shadow-none">
                <CardHeader>
                    <CardTitle className="text-foreground">Personal Information</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Your account details and role information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/10">
                                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Full Name</p>
                                <p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/10">
                                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                                <p className="font-semibold text-foreground">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/10">
                                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Role</p>
                                <div className="mt-1">
                                    {getRoleBadge(user.role as string)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/10">
                                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Member Since</p>
                                <p className="font-semibold text-foreground">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trainer Request Card */}
            {user.role === "USER" && (
                <Card className="bg-card border-border shadow-sm dark:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-foreground">Become a Trainer</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Request to upgrade your account to a trainer role to share content with the community.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <p className="text-muted-foreground italic">Loading request status...</p>
                        ) : trainerRequest ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border space-y-4">
                                    <div className="flex items-center justify-between border-b border-border pb-3">
                                        <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Request Status</p>
                                        {getStatusBadge(trainerRequest.status)}
                                    </div>
                                    {trainerRequest.message && (
                                        <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Your Message:</p>
                                            <p className="text-sm text-foreground italic">"{trainerRequest.message}"</p>
                                        </div>
                                    )}
                                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Submitted on {new Date(trainerRequest.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {trainerRequest.status === "PENDING" && (
                                    <p className="text-sm text-muted-foreground bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 italic">
                                        Your request is being reviewed by an administrator. You'll be notified once it's processed.
                                    </p>
                                )}

                                {trainerRequest.status === "DENIED" && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                            Your previous request was denied. You can submit a new request with additional information.
                                        </p>
                                    </div>
                                )}

                                {trainerRequest.status === "APPROVED" && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 animate-pulse">
                                        Congratulations! Your request has been approved. Please refresh the page to see your new role.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">You haven't submitted a trainer request yet.</p>
                        )}

                        {canRequestTrainer && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Message to Admin</Label>
                                    <Input
                                        id="message"
                                        placeholder="Tell us why you want to become a trainer..."
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        disabled={isSubmitting}
                                        className="bg-muted/50 border-border h-12 rounded-xl focus:bg-background transition-all"
                                    />
                                    <p className="text-xs text-muted-foreground font-medium italic">
                                        Explain your qualifications and why you'd like to become a trainer.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSubmitRequest}
                                    disabled={isSubmitting || !requestMessage.trim()}
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-indigo-500/20"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Trainer Request"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {(user.role === "TRAINER" || user.role === "ADMIN") && (
                <Card className="border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5 backdrop-blur-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <CardContent className="pt-6 relative">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-foreground">
                                    {user.role === "ADMIN" ? "Administrator Access" : "Verified Trainer"}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {user.role === "ADMIN"
                                        ? "You have full administrative control over the platform."
                                        : "Your profile is verified. You can now create workshops and manage students."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProfilePage;
