"use client";

import { useAuth } from "../../../hooks/user/useAuth";
import { LogOut } from "lucide-react";

export function Settings() {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Account Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              👤 Account Settings
            </h3>
            <p className="text-gray-600 text-sm mt-2">
              Manage your account and subscription
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Plan Information */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900">Free Starter</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Usage this month</p>
                <p className="text-lg font-semibold text-blue-600">0 / 50 scrapes</p>
              </div>
            </div>
            <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold">
              ⚡ Upgrade to Pro - Unlimited Scrapes
            </button>
          </div>

          {/* Account Actions */}
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">user@example.com</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Member since</p>
                  <p className="text-sm text-gray-600">November 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Danger Zone</h4>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

              <button className="w-full px-6 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-gray-200">
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}