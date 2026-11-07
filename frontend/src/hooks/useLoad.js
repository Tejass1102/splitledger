import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/client'

// Runs loader() whenever `key` changes. The stored result remembers which key it
// belongs to, so a result is only shown when it matches the current key; stale or
// slow responses for an old key are ignored.
export function useLoad(loader, key) {
    const [state, setState] = useState({ key: null, data: null, error: '' })
    const loaderRef = useRef(loader)

    // Always call the latest loader without making it a dependency of the load effect
    useEffect(() => {
        loaderRef.current = loader
    })

    useEffect(() => {
        let cancelled = false

        async function run() {
            try {
                const data = await loaderRef.current()
                if (!cancelled) setState({ key, data, error: '' })
            } catch (err) {
                if (!cancelled) setState({ key, data: null, error: describeError(err).message })
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [key])

    const loading = state.key !== key
    return {
        data: loading ? null : state.data,
        error: loading ? '' : state.error,
        loading,
    }
}