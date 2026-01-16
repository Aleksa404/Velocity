import { useEffect, useState } from "react";
import { useUserStore } from "../../stores/userStore";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getPendingTrainerRequests, approveTrainerRequest, denyTrainerRequest } from "../../api/trainerRequestApi";
import type { TrainerRequest } from "../../Types/TrainerRequest";
import TrainerRequestCard from "./TrainerRequestCard";
import { Users, UserCheck, Clock, LayoutDashboard } from "lucide-react";
import { SidebarManagementPage } from "@/pages/Admin/SidebarManagementPage";

export const AdminDashboard = () => {
  const user = useUserStore((state) => state.user);
  const [pendingRequests, setPendingRequests] = useState<TrainerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await getPendingTrainerRequests();
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error("Failed to load trainer requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await approveTrainerRequest(requestId);
      toast.success("Trainer request approved successfully!");
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await denyTrainerRequest(requestId);
      toast.success("Trainer request denied");
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, trainer requests, and platform settings.</p>
      </div>

      <Tabs defaultValue="trainer-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trainer-requests" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Trainer Requests
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Sidebar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainer-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Trainer Requests
              </CardTitle>
              <CardDescription>
                Review and manage requests from users who want to become trainers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading requests...
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-muted-foreground">No pending trainer requests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    New requests will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((request) => (
                    <TrainerRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      onDeny={handleDeny}
                      isProcessing={processingId === request.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebar">
          <SidebarManagementPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
