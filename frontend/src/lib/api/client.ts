import { storage, STORAGE_KEYS } from "../storage";
import { API_BASE_URL } from "./endpoints";

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
    requiresAuth?: boolean;
    isAdmin?: boolean;
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

async function client<T>(endpoint: string, { body, ...customConfig }: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (customConfig.isAdmin) {
        const adminKey = storage.get(STORAGE_KEYS.ADMIN_API_KEY);
        if (adminKey) {
            headers["x-api-key"] = adminKey;
        }
    } else if (customConfig.requiresAuth !== false) {
        const token = storage.get(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const config: RequestInit = {
        method: body ? "POST" : "GET",
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    // Handle dynamic endpoints (functions) or string endpoints
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            throw new ApiError(response.status, data.error || data.message || "Something went wrong");
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new Error(error instanceof Error ? error.message : "Network error");
    }
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => client<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body: any, options?: RequestOptions) => client<T>(endpoint, { ...options, method: "POST", body }),
    put: <T>(endpoint: string, body: any, options?: RequestOptions) => client<T>(endpoint, { ...options, method: "PUT", body }),
    delete: <T>(endpoint: string, options?: RequestOptions) => client<T>(endpoint, { ...options, method: "DELETE" }),
    patch: <T>(endpoint: string, body: any, options?: RequestOptions) => client<T>(endpoint, { ...options, method: "PATCH", body }),
};
