// import { type ClassValue, clsx } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs: ClassValue[]) {
//     return twMerge(clsx(inputs));
// }

// Video Utility Functions

/**
 * Detects if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Extracts YouTube video ID from URL
 */
export function getYouTubeId(url: string | undefined | null): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(url: string | undefined | null): string | null {
    const id = getYouTubeId(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

/**
 * Construct full URL for local video streaming or return YouTube URL as is
 */
export function getFullVideoUrl(url: string): string {
    if (isYouTubeUrl(url)) return url;

    // If it's already a full URL, use it as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    // Otherwise, prepend the API base URL
    // Use the exact logic from previous VideoPlayer implementation but centralized
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");

    // Ensure url starts with /
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;

    return `${baseUrl}${cleanUrl}`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number | undefined): string {
    if (!seconds) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
