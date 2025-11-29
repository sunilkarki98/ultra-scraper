export const STORAGE_KEYS = {
    AUTH_TOKEN: "authToken",
    ADMIN_API_KEY: "admin_api_key",
} as const;

export const storage = {
    get: (key: string): string | null => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(key);
    },

    set: (key: string, value: string): void => {
        if (typeof window === "undefined") return;
        localStorage.setItem(key, value);
    },

    remove: (key: string): void => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(key);
    },

    clear: (): void => {
        if (typeof window === "undefined") return;
        localStorage.clear();
    },
};
