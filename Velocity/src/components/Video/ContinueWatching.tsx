import { useEffect, useState } from "react";
import { getContinueWatching } from "../../api/videoApi";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import type { VideoWatchProgress } from "../../Types/Video";

// Extended type for continue watching response which includes nested video data
interface ContinueWatchingItem extends VideoWatchProgress {
    video: {
        id: string;
        title: string;
        url: string;
        trainer: {
            id: string;
            first_name: string;
            last_name: string;
        };
        workshop?: {
            id: string;
            title: string;
        };
    };
}

const ContinueWatching = () => {
    const [items, setItems] = useState<ContinueWatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchContinueWatching = async () => {
            setLoading(true);
            const result = await getContinueWatching();
            if (result.success) {
                setItems(result.data);
            }
            setLoading(false);
        };

        fetchContinueWatching();
    }, []);

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    if (loading || items.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {items.map((item) => {
                    const youtubeId = getYouTubeId(item.video.url);

                    if (playingId === item.id) {
                        return (
                            <div key={item.id} className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px]">
                                <VideoPlayer
                                    videoId={youtubeId || ""}
                                    dbVideoId={item.video.id}
                                    initialProgress={item.watchedSeconds}
                                    className="rounded-lg overflow-hidden shadow-md"
                                />
                            </div>
                        );
                    }

                    return (
                        <Card
                            key={item.id}
                            className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px] cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
                            onClick={() => setPlayingId(item.id)}
                        >
                            <div className="aspect-video relative bg-black rounded-t-lg overflow-hidden group">
                                {youtubeId ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                        alt={item.video.title}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800" />
                                )}

                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play className="w-4 h-4 text-black ml-1" fill="currentColor" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${item.percentWatched}%` }}
                                    />
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <h3 className="font-semibold line-clamp-1 text-sm mb-1" title={item.video.title}>
                                    {item.video.title}
                                </h3>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{item.video.trainer.first_name} {item.video.trainer.last_name}</span>
                                    <span>{item.percentWatched}% left</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ContinueWatching;
