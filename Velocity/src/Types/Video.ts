export interface VideoWatchProgress {
    id: string;
    userId: string;
    videoId: string;
    watchedSeconds: number;
    totalDuration: number;
    percentWatched: number;
    isCompleted: boolean;
    lastWatchedAt: string;
}

export interface Video {
    id: string;
    title: string;
    description?: string;
    url: string;
    storageType: "LOCAL" | "YOUTUBE";
    duration?: number;
    uploadedAt: string;
    trainerId: string;
    workshopId?: string;
    sectionId?: string | null;
    trainer: {
        id?: string;
        first_name: string;
        last_name: string;
    };
    workshop?: {
        id: string;
        title: string;
    };
    watchProgress?: VideoWatchProgress[]; // Array from backend, usually contains 0 or 1 item for current user
}
