import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import { UserData } from "../../../types/user";

interface AuthResponse {
    success: boolean;
    token: string;
    user: UserData;
}

export const authService = {
    login: async (email: string, password: string) => {
        return api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, { email, password }, { requiresAuth: false });
    },

    signup: async (name: string, email: string, password: string) => {
        return api.post<AuthResponse>(ENDPOINTS.AUTH.SIGNUP, { name, email, password }, { requiresAuth: false });
    },

    getProfile: async () => {
        return api.get<UserData>(ENDPOINTS.AUTH.ME);
    },
};
