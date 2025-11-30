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
}

export interface Follow {
    id: string;
    userId: string;
    trainerId: string;
    createdAt: string;
    trainer?: Trainer;
}
