import { useEffect, useState } from "react";
import { useUserStore } from "../../stores/userStore";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getPendingTrainerRequests, approveTrainerRequest, denyTrainerRequest } from "../../api/trainerRequestApi";
import type { TrainerRequest } from "../../Types/TrainerRequest";
import TrainerRequestCard from "./TrainerRequestCard";
import { Users, UserCheck, Clock, LayoutDashboard, Shield, ShieldCheck, User as UserIcon, ChevronDown, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SidebarManagementPage } from "@/pages/Admin/SidebarManagementPage";
import { getAllUsers, updateUserRole, deleteUser, type UserForAdmin } from "../../api/userApi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const AdminDashboard = () => {
  const user = useUserStore((state) => state.user);
  const [pendingRequests, setPendingRequests] = useState<TrainerRequest[]>([]);
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Search and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users when page or debounced search changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchQuery]);

  const fetchPendingRequests = async () => {
    try {
      const response = await getPendingTrainerRequests();
      setPendingRequests(response.data);
    } catch (error) {
      toast.error("Failed to load trainer requests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await getAllUsers(currentPage, itemsPerPage, debouncedSearchQuery);

      setUsers(response.data?.users || []);

      setTotalPages(response.data?.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
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

  const handleRoleChange = async (userId: string, newRole: "USER" | "TRAINER" | "ADMIN") => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId);
  };

  const confirmDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeletingUserId(null);
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "TRAINER":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <ShieldCheck className="w-3 h-3" />;
      case "TRAINER":
        return <Shield className="w-3 h-3" />;
      default:
        return <UserIcon className="w-3 h-3" />;
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-medium mt-1">
                    Manage all users on the platform. Click on a user's role to change it.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="font-medium italic">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border-dashed border-2 border-border/50">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <p className="text-foreground text-xl font-bold">
                    {debouncedSearchQuery ? "No matching users found" : "No users found"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.first_name} {u.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(u.role)} className="flex items-center gap-1 w-fit">
                                {getRoleIcon(u.role)}
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={updatingUserId === u.id || u.id === user.id}
                                    className="gap-1"
                                  >
                                    {updatingUserId === u.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    ) : (
                                      <>
                                        Change Role Or Delete
                                        <ChevronDown className="h-4 w-4" />
                                      </>
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(u.id, "USER")}
                                    disabled={u.role === "USER"}
                                    className="flex items-center gap-2"
                                  >
                                    <UserIcon className="w-4 h-4" />
                                    Set as User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(u.id, "TRAINER")}
                                    disabled={u.role === "TRAINER"}
                                    className="flex items-center gap-2"
                                  >
                                    <Shield className="w-4 h-4" />
                                    Set as Trainer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(u.id, "ADMIN")}
                                    disabled={u.role === "ADMIN"}
                                    className="flex items-center gap-2 text-red-500 focus:text-red-500"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Upgrade to Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={u.id === user.id}
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm font-medium text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletingUserId && confirmDeleteUser(deletingUserId)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="sidebar" className="outline-none">
          <SidebarManagementPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;


