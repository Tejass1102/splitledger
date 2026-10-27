import { Component } from 'react'

// Catches errors thrown while a page renders, so one broken page shows a message instead
// of a blank screen. compact = inside the app layout (the navbar stays usable);
// otherwise the message fills the screen.
export default class ErrorBoundary extends Component {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(error, info) {
        console.error('Unexpected error while showing the page:', error, info.componentStack)
    }

    render() {
        if (!this.state.failed) return this.props.children

        const card = (
            <div
                role="alert"
                className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
            >
                <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
                <p className="mt-2 text-sm text-slate-500">
                    This page ran into an unexpected problem. Nothing you saved has been lost. Reloading
                    usually fixes it.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Reload page
                    </button>
                    <a
                        href="/"
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Go to the dashboard
                    </a>
                </div>
            </div>
        )

        if (this.props.compact) return <div className="flex justify-center">{card}</div>
        return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">{card}</div>
    }
}