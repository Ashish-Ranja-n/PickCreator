
export interface Profile {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    location: string;
    isVerified: boolean;
    followers: number;
    engagement: number;
    averageLikes: number;
    averageComments: number;
    averageReelPlays: number;
  }