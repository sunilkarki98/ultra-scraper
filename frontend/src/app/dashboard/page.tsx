"use client";

import { useEffect, useState } from "react";

interface User {
    id: string;
    email: string;
    name: string;
    plan: string;
    status: string;
    role: string;
}

interface ApiKey {
    key: string;
    name: string;
}

interface Usage {
    pagesScraped: number;
    aiExtractions: number;
    apiCalls: number;
    month: string;
}

interface Limits {
    pagesPerMonth: number;
    aiExtractionsPerMonth: number;
    requestsPerMinute: number;
}

interface UserData {
    user: User;
    limits: Limits;
    usage: Usage;
    percentage: {
        pages: string;
        ai: string;
    };
}

export default function UserDashboard() {
    const [token, setToken] = useState("");
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"login" | "register" | "dashboard">("login");
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");

    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Registration State
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regError, setRegError] = useState("");
    const [newKey, setNewKey] = useState<ApiKey | null>(null);

    useEffect(() => {
        // Check for token in URL (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        const errorFromUrl = urlParams.get('error');

        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            localStorage.setItem("authToken", tokenFromUrl);
            // Clean URL
            window.history.replaceState({}, document.title, "/dashboard");
            fetchUser(tokenFromUrl);
            return;
        }

        if (errorFromUrl) {
            setLoginError(`Authentication failed: ${errorFromUrl}`);
            setView("login");
            setLoading(false);
            return;
        }

        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
        } else {
            setLoading(false);
            setView("login");
        }
    }, []);

    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:3000/auth/google";
    };

    const handleGitHubSignIn = () => {
        window.location.href = "http://localhost:3000/auth/github";
    };

    const fetchUser = async (authToken: string) => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/users/me", {
                headers: { "Authorization": `Bearer ${authToken}` },
            });
            const data = await res.json();

            if (data.success) {
                setUserData(data);
                setView("dashboard");
                fetchApiKeys(authToken);
            } else {
                localStorage.removeItem("authToken");
                setToken("");
                setView("login");
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
            setView("login");
        } finally {
            setLoading(false);
        }
    };

    const fetchApiKeys = async (authToken: string) => {
        try {
            const res = await fetch("http://localhost:3000/users/keys", {
                headers: { "Authorization": `Bearer ${authToken}` },
            });
            const data = await res.json();
            if (data.success) setApiKeys(data.keys);
        } catch (error) {
            console.error("Failed to fetch keys", error);
        }
    };

    const createApiKey = async () => {
        try {
            const res = await fetch("http://localhost:3000/users/keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newKeyName }),
            });
            const data = await res.json();
            if (data.success) {
                setNewKey(data.apiKey); // Show the new key modal
                setShowKeyModal(false);
                setNewKeyName("");
                fetchApiKeys(token);
            }
        } catch (error) {
            console.error("Failed to create key", error);
        }
    };

    const revokeApiKey = async (keyToRevoke: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await fetch(`http://localhost:3000/users/keys/${keyToRevoke}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            fetchApiKeys(token);
        } catch (error) {
            console.error("Failed to revoke key", error);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await fetch("http://localhost:3000/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await res.json();

            if (data.success) {
                setToken(data.token);
                localStorage.setItem("authToken", data.token);
                fetchUser(data.token);
            } else {
                setLoginError(data.error || "Login failed");
            }
        } catch (error: any) {
            setLoginError(error.message);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError("");
        try {
            const res = await fetch("http://localhost:3000/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
            });
            const data = await res.json();

            if (data.success) {
                setToken(data.token);
                localStorage.setItem("authToken", data.token);
                setNewKey(data.apiKey);
                setUserData({
                    user: data.user,
                    limits: { pagesPerMonth: 1000, aiExtractionsPerMonth: 100, requestsPerMinute: 60 }, // Defaults for new user
                    usage: { pagesScraped: 0, aiExtractions: 0, apiCalls: 0, month: new Date().toISOString() },
                    percentage: { pages: "0", ai: "0" }
                });
                // Don't switch view yet, let them copy the key
            } else {
                setRegError(data.error || "Registration failed");
            }
        } catch (error: any) {
            setRegError(error.message);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (newKey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
                    <p className="mb-4 text-gray-600">Here is your first API Key. Please save it now, it will not be shown again.</p>
                    <div className="bg-gray-100 p-4 rounded mb-6 break-all font-mono text-sm border border-gray-300">
                        {newKey.key}
                    </div>
                    <button
                        onClick={() => {
                            setNewKey(null);
                            setView("dashboard");
                        }}
                        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (view === "login") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center">Login to Dashboard</h2>
                    {loginError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{loginError}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="********"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 mb-4">
                            Login
                        </button>
                    </form>

                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <button
                        onClick={handleGitHubSignIn}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white p-2 rounded hover:bg-gray-800 mb-4"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        Sign in with GitHub
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{" "}
                            <button onClick={() => setView("register")} className="text-indigo-600 hover:underline">
                                Register
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "register") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                    {regError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{regError}</div>}
                    <form onSubmit={handleRegister}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                            <input
                                type="text"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Your Name"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="********"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 mb-4">
                            Register
                        </button>
                    </form>

                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <button
                        onClick={handleGitHubSignIn}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white p-2 rounded hover:bg-gray-800 mb-4"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        Sign up with GitHub
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <button onClick={() => setView("login")} className="text-indigo-600 hover:underline">
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">UltraScraper Dashboard</h1>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">Welcome, {userData?.user.name}</span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("authToken");
                                    setToken("");
                                    setUserData(null);
                                    setView("login");
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {userData && (
                    <div className="px-4 py-6 sm:px-0 space-y-6">
                        {/* Usage Stats */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Current Usage</h3>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <dt className="text-sm font-medium text-gray-500 truncate">Pages Scraped</dt>
                                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{userData.usage.pagesScraped} / {userData.limits.pagesPerMonth}</dd>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${userData.percentage.pages}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <dt className="text-sm font-medium text-gray-500 truncate">AI Extractions</dt>
                                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{userData.usage.aiExtractions} / {userData.limits.aiExtractionsPerMonth}</dd>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${userData.percentage.ai}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <dt className="text-sm font-medium text-gray-500 truncate">Plan</dt>
                                        <dd className="mt-1 text-3xl font-semibold text-gray-900 capitalize">{userData.user.plan}</dd>
                                        <p className="text-sm text-gray-500 mt-1">Status: {userData.user.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* API Keys */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="sm:flex sm:items-center">
                                    <div className="sm:flex-auto">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">API Keys</h3>
                                        <p className="mt-1 text-sm text-gray-500">Manage your API keys for accessing the UltraScraper API.</p>
                                    </div>
                                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                                        <button
                                            onClick={() => setShowKeyModal(true)}
                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                                        >
                                            Create New Key
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-col">
                                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-300">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Key Prefix</th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
                                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                                <span className="sr-only">Revoke</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                        {apiKeys.map((key) => (
                                                            <tr key={key.id}>
                                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{key.name}</td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">{key.key}</td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                                    <button onClick={() => revokeApiKey(key.key)} className="text-red-600 hover:text-red-900">Revoke</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Key Modal */}
            {showKeyModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowKeyModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New API Key</h3>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded mb-4"
                                        placeholder="Key Name (e.g. Production)"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                                    onClick={createApiKey}
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={() => setShowKeyModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
