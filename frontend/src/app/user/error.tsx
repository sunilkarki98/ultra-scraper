'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        console.error('User dashboard error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-500/20">
                <div className="text-center">
                    <div className="text-5xl mb-4">🔧</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Dashboard Error
                    </h2>
                    <p className="text-slate-300 mb-6">
                        We couldn't load your dashboard. This might be a temporary issue.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={reset}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all"
                        >
                            Try again
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-slate-700 text-white p-3 rounded-lg hover:bg-slate-600 font-semibold transition-all"
                        >
                            Go back home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
