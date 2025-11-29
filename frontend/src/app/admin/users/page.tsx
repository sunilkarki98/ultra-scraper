"use client";

import { UserManagement } from "../../../components/dashboard/admin/settings/UserManagement";

export default function UsersPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                <p className="text-gray-500 mt-1">
                    Manage platform users and their access levels
                </p>
            </div>

            <UserManagement />
        </div>
    );
}
