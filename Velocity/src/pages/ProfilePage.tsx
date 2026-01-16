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
            USER: "bg-gray-100 text-gray-800",
            TRAINER: "bg-blue-100 text-blue-800",
            ADMIN: "bg-purple-100 text-purple-800",
        };

        return (
            <Badge className={roleColors[role] || roleColors.USER}>
                {role}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactElement }> = {
            PENDING: {
                color: "bg-yellow-100 text-yellow-800",
                icon: <Clock className="w-3 h-3 mr-1" />,
            },
            APPROVED: {
                color: "bg-green-100 text-green-800",
                icon: <CheckCircle className="w-3 h-3 mr-1" />,
            },
            DENIED: {
                color: "bg-red-100 text-red-800",
                icon: <XCircle className="w-3 h-3 mr-1" />,
            },
        };

        const config = statusConfig[status] || statusConfig.PENDING;

        return (
            <Badge className={`${config.color} flex items-center w-fit`}>
                {config.icon}
                {status}
            </Badge>
        );
    };

    const canRequestTrainer = user.role === "USER" && (!trainerRequest || trainerRequest.status === "DENIED");

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
                <p className="text-muted-foreground">Manage your account information and settings.</p>
            </div>

            {/* User Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your account details and role information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Full Name</p>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Mail className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Shield className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <div className="mt-1">
                                    {getRoleBadge(user.role as string)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Member Since</p>
                                <p className="font-medium">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trainer Request Card */}
            {user.role === "USER" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Become a Trainer</CardTitle>
                        <CardDescription>
                            Request to upgrade your account to a trainer role to share content with the community.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <p className="text-muted-foreground">Loading request status...</p>
                        ) : trainerRequest ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">Request Status</p>
                                        {getStatusBadge(trainerRequest.status)}
                                    </div>
                                    {trainerRequest.message && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Your Message:</p>
                                            <p className="text-sm">{trainerRequest.message}</p>
                                        </div>
                                    )}
                                    <div className="text-sm text-muted-foreground">
                                        Submitted on {new Date(trainerRequest.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {trainerRequest.status === "PENDING" && (
                                    <p className="text-sm text-muted-foreground">
                                        Your request is being reviewed by an administrator. You'll be notified once it's processed.
                                    </p>
                                )}

                                {trainerRequest.status === "DENIED" && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            Your previous request was denied. You can submit a new request with additional information.
                                        </p>
                                    </div>
                                )}

                                {trainerRequest.status === "APPROVED" && (
                                    <p className="text-sm text-green-600 font-medium">
                                        Congratulations! Your request has been approved. Please refresh the page to see your new role.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">You haven't submitted a trainer request yet.</p>
                        )}

                        {canRequestTrainer && (
                            <div className="space-y-3 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message to Admin</Label>
                                    <Input
                                        id="message"
                                        placeholder="Tell us why you want to become a trainer..."
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Explain your qualifications and why you'd like to become a trainer.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSubmitRequest}
                                    disabled={isSubmitting || !requestMessage.trim()}
                                    className="w-full md:w-auto"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Trainer Request"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {(user.role === "TRAINER" || user.role === "ADMIN") && (
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-900">
                                    {user.role === "ADMIN" ? "You're an Administrator" : "You're a Trainer"}
                                </p>
                                <p className="text-sm text-green-700">
                                    {user.role === "ADMIN"
                                        ? "You have full access to manage the platform."
                                        : "You can create and share content with the community."}
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
