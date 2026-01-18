import type { Workshop } from "./Workshop";
import type { Video } from "./Video";

export interface Trainer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    createdAt: string;
    _count?: {
        followers: number;
        videos: number;
        workshops: number;
    };
    isFollowing?: boolean;
    workshops?: Workshop[];
    videos?: Video[];
}

export interface Follow {
    id: string;
    userId: string;
    trainerId: string;
    createdAt: string;
    trainer?: Trainer;
}
