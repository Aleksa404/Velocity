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

            <Tabs defaultValue="videos" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="workshops">Workshops</TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Post Video Section */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Post New Video</CardTitle>
                                    <CardDescription>Share a workout or tip with your trainees.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => navigate("/trainer/post-video")}>
                                        Create New Post
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Video List Section */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Recent Videos</h2>
                            </div>
                            <VideoList />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="workshops">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workshops</CardTitle>
                            <CardDescription>Manage your upcoming workshops here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Workshop management coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TrainerDashboard;
