import { useEffect, useState } from "react";
import { getContinueWatching } from "../../api/videoApi";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import type { VideoWatchProgress } from "../../Types/Video";
import { getYouTubeThumbnail, isYouTubeUrl } from "@/lib/videoUtils";

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

    if (loading || items.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {items.map((item) => {
                    if (playingId === item.id) {
                        return (
                            <div key={item.id} className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px]">
                                <VideoPlayer
                                    videoUrl={item.video.url}
                                    dbVideoId={item.video.id}
                                    initialProgress={item.watchedSeconds}
                                    className="rounded-lg overflow-hidden shadow-md"
                                />
                            </div>
                        );
                    }

                    const isYouTube = isYouTubeUrl(item.video.url);
                    const thumbnailUrl = isYouTube ? getYouTubeThumbnail(item.video.url) : null;

                    return (
                        <Card
                            key={item.id}
                            className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px] cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
                            onClick={() => setPlayingId(item.id)}
                        >
                            <div className={`aspect-video relative rounded-t-lg overflow-hidden group ${!isYouTube ? "bg-gradient-to-br from-indigo-600 to-purple-700" : ""
                                }`}>
                                {isYouTube && thumbnailUrl ? (
                                    <>
                                        <img
                                            src={thumbnailUrl}
                                            alt={item.video.title}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl font-bold">
                                        ▶
                                    </div>
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
                                    <span>{100 - item.percentWatched}% left</span>
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
