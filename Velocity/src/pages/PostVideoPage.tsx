import { useNavigate } from "react-router";
import VideoForm from "../components/Video/VideoForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PostVideoPage = () => {
    const navigate = useNavigate();

    const handleVideoPosted = () => {
        navigate("/dashboard");
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-8">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Post New Content</h1>
                <p className="text-muted-foreground">
                    Upload a new video to share with your trainees.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Video Details</CardTitle>
                    <CardDescription>
                        Upload your video file. It will be automatically hosted on our platform channel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VideoForm onVideoPosted={handleVideoPosted} />
                </CardContent>
            </Card>
        </div>
    );
};

export default PostVideoPage;
