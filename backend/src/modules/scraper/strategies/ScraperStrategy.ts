export interface WorkerResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ScraperStrategy {
    name: string;
    priority: number;
    canHandle(url: string, options: any): Promise<boolean>;
    execute(url: string, options: any): Promise<WorkerResult>;
}
