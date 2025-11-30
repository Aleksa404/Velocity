import VideoList from "../Video/VideoList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const TrainerDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainer Dashboard</h1>
                <p className="text-muted-foreground">Manage your content and workshops.</p>
            </div>

            <Tabs defaultValue="workshops" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="workshops">My Workshops</TabsTrigger>
                    <TabsTrigger value="videos">Recent Videos</TabsTrigger>
                </TabsList>

                <TabsContent value="workshops" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-indigo-50 border-indigo-100">
                            <CardHeader>
                                <CardTitle className="text-indigo-900">Create Workshop</CardTitle>
                                <CardDescription className="text-indigo-700">
                                    Schedule a new workshop and start accepting enrollments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" onClick={() => navigate("/workshops/create")}>
                                    Create Workshop
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Manage Workshops</CardTitle>
                                <CardDescription>
                                    View your workshops, approve enrollments, and add videos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" onClick={() => navigate("/workshops")}>
                                    View All Workshops
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Videos</h2>
                        <p className="text-sm text-muted-foreground">
                            Videos are now managed within specific workshops.
                        </p>
                    </div>
                    <VideoList />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TrainerDashboard;
