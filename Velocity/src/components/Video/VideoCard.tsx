import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Check } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import type { Video } from "../../Types/Video";
import { getYouTubeThumbnail, isYouTubeUrl } from "@/lib/videoUtils";

interface VideoCardProps {
    video: Video;
    isPlaying: boolean;
    onPlay: () => void;
    onComplete?: () => void;
    onProgressUpdate?: (watchedSeconds: number, percent: number) => void;
}

const VideoCard = ({ video, isPlaying, onPlay, onComplete, onProgressUpdate }: VideoCardProps) => {
    const progress = video.watchProgress && video.watchProgress.length > 0
        ? video.watchProgress[0]
        : null;

    const isCompleted = progress?.isCompleted;
    const percentWatched = progress?.percentWatched || 0;

    // Determine thumbnail logic
    const isYouTube = isYouTubeUrl(video.url);
    const thumbnailUrl = isYouTube ? getYouTubeThumbnail(video.url) : null;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="aspect-video w-full relative bg-black group">
                {isPlaying ? (
                    <VideoPlayer
                        videoUrl={video.url}
                        dbVideoId={video.id}
                        initialProgress={progress?.watchedSeconds || 0}
                        onComplete={onComplete}
                        onProgressUpdate={onProgressUpdate}
                    />
                ) : (
                    <div
                        className={`w-full h-full cursor-pointer relative flex items-center justify-center ${!isYouTube ? "bg-gradient-to-br from-indigo-600 to-purple-700" : ""
                            }`}
                        onClick={onPlay}
                    >
                        {isYouTube && thumbnailUrl ? (
                            <>
                                <img
                                    src={thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                            </>
                        ) : (
                            <div className="text-white/30 text-6xl font-bold">▶</div>
                        )}

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {percentWatched > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700">
                                <div
                                    className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-green-400'}`}
                                    style={{ width: `${percentWatched}%` }}
                                />
                            </div>
                        )}

                        {/* Completed Badge */}
                        {isCompleted && (
                            <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                                <Check className="w-3 h-3 mr-1" /> Watched
                            </Badge>
                        )}
                    </div>
                )}
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1" title={video.title}>{video.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 mt-auto">
                {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2" title={video.description}>
                        {video.description}
                    </p>
                )}
                <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-muted-foreground">
                        {new Date(video.uploadedAt).toLocaleDateString()}
                    </div>
                    {percentWatched > 0 && !isCompleted && (
                        <div className="text-xs font-medium text-primary">
                            {percentWatched}% completed
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default VideoCard;
