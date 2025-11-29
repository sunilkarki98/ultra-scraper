'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-500/20">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-slate-300 mb-6">
                        We encountered an unexpected error. Please try again.
                    </p>
                    <button
                        onClick={reset}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all"
                    >
                        Try again
                    </button>
                    <a
                        href="/"
                        className="block mt-4 text-purple-400 hover:text-purple-300 text-sm"
                    >
                        Go back home
                    </a>
                </div>
            </div>
        </div>
    )
}
