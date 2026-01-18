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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground font-medium">Manage users, trainer requests, and platform settings.</p>
      </div>

      <Tabs defaultValue="trainer-requests" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 dark:border dark:border-white/5 shadow-inner">
          <TabsTrigger value="trainer-requests" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
            <UserCheck className="w-4 h-4" />
            Trainer Requests
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
            <LayoutDashboard className="w-4 h-4" />
            Sidebar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainer-requests" className="space-y-6 outline-none">
          <Card className="bg-card border-border shadow-sm dark:shadow-none">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                <Clock className="w-5 h-5 text-indigo-500" />
                Pending Trainer Requests
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Review and manage requests from users who want to become trainers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="font-medium italic">Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border-dashed border-2 border-border/50">
                  <UserCheck className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <p className="text-foreground text-xl font-bold">No pending requests</p>
                  <p className="text-muted-foreground font-medium mt-1">
                    New requests will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <TabsContent value="users" className="outline-none">
          <Card className="bg-card border-border shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-foreground font-bold">User Management</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="py-12 flex flex-col items-center justify-center bg-muted/20 rounded-xl border-dashed border-2 border-border/50 m-6">
              <Users className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground font-bold italic">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebar" className="outline-none">
          <SidebarManagementPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
