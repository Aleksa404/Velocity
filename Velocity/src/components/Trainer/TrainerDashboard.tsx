import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const TrainerDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Trainer Dashboard</h1>
                <p className="text-muted-foreground font-medium">Manage your workshops and content.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5 backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />
                    <CardHeader className="relative">
                        <CardTitle className="text-foreground font-bold">Create Workshop</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Schedule a new workshop and start accepting enrollments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-indigo-500/20" onClick={() => navigate("/workshops/create")}>
                            Create Workshop
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg dark:hover:ring-1 dark:hover:ring-white/10 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-foreground font-bold">Manage Workshops</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            View your workshops, approve enrollments, and add videos to each workshop.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl h-11 border border-border/50" onClick={() => navigate("/workshops/my")}>
                            View My Workshops
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TrainerDashboard;
