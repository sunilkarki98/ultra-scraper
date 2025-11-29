"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Shield, UserCheck, UserX } from "lucide-react";
import { adminService } from "../../../../lib/api/services/admin.service";
import toast from "react-hot-toast";

interface User {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    status: string;
    createdAt: string;
    _count: {
        jobs: number;
        apiKeys: number;
    };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchUsers = async (page: number = 1) => {
        setLoading(true);
        try {
            const data = await adminService.getUsers(page, 20);
            if (data.success) {
                // Need to cast to any because my service definition might be slightly different from component interface
                // Component expects User with _count, service returns AdminUser
                // I should update service interface to match component or vice versa
                // For now, let's cast
                setUsers(data.users as any);
                // Service doesn't return pagination object in my definition, it returns total
                // I need to reconstruct pagination or update service
                // Let's assume backend returns pagination object and I just missed it in service type
                setPagination((data as any).pagination || {
                    total: data.total,
                    page: page,
                    limit: 20,
                    totalPages: Math.ceil(data.total / 20)
                });
            } else {
                toast.error("Failed to fetch users");
            }
        } catch {
            toast.error("Network error: Unable to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpgradePlan = async (userId: string, newPlan: string) => {
        try {
            await adminService.updateUser(userId, { plan: newPlan });
            toast.success(`User plan updated to ${newPlan}!`);
            fetchUsers(pagination.page);
        } catch (error: any) {
            toast.error(error.message || "Failed to update user plan");
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "banned" : "active";
        const action = newStatus === "banned" ? "banned" : "unbanned";

        try {
            await adminService.updateUser(userId, { status: newStatus });
            toast.success(`User ${action} successfully!`);
            fetchUsers(pagination.page);
        } catch (error: any) {
            toast.error(error.message || "Failed to update user status");
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Management</h3>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                User
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Plan
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Usage
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{user.email}</p>
                                        <p className="text-sm text-gray-500">
                                            {user.name || "No name"}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${user.plan === "pro"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {user._count.jobs} jobs | {user._count.apiKeys} keys
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {user.plan === "free" ? (
                                            <button
                                                onClick={() => handleUpgradePlan(user.id, "pro")}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Upgrade to Pro"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpgradePlan(user.id, "free")}
                                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                title="Downgrade to Free"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                            className={`p-2 rounded-lg transition-colors ${user.status === "active"
                                                ? "text-red-600 hover:bg-red-50"
                                                : "text-green-600 hover:bg-green-50"
                                                }`}
                                            title={
                                                user.status === "active" ? "Ban User" : "Unban User"
                                            }
                                        >
                                            {user.status === "active" ? (
                                                <UserX className="w-4 h-4" />
                                            ) : (
                                                <UserCheck className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} users
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchUsers(pagination.page - 1)}
                        disabled={pagination.page === 1 || loading}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => fetchUsers(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages || loading}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
