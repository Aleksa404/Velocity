import { useEffect, useState } from "react";
import { getVideos } from "../../api/videoApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Video {
    id: string;
    title: string;
    url: string;
    uploadedAt: string;
    trainer: {
        first_name: string;
        last_name: string;
    };
}

const VideoList = ({ refreshTrigger = 0 }: { refreshTrigger?: number }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            const result = await getVideos();
            if (result.success) {
                setVideos(result.data);
            }
            setLoading(false);
        };

        fetchVideos();
    }, [refreshTrigger]);

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    if (loading) {
        return <div className="text-center py-10">Loading videos...</div>;
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No videos posted yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
                const videoId = getYouTubeId(video.url);
                return (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video w-full">
                            {videoId ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    Invalid Video URL
                                </div>
                            )}
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xs">
                                        {video.trainer.first_name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span>
                                    {video.trainer.first_name} {video.trainer.last_name}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {new Date(video.uploadedAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default VideoList;
