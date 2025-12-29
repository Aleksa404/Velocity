import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const TrainerDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainer Dashboard</h1>
                <p className="text-muted-foreground">Manage your workshops and content.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Workshops</CardTitle>
                        <CardDescription>
                            View your workshops, approve enrollments, and add videos to each workshop.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => navigate("/workshops/my")}>
                            View My Workshops
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TrainerDashboard;
