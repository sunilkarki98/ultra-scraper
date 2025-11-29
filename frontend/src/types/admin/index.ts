export interface QueueStats {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
}

export interface Job {
    id: string;
    name: string;
    data: { url?: string };
    progress: number;
    failedReason?: string;
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    attemptsMade: number;
}
