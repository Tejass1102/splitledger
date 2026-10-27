import { useEffect, useState } from 'react'
import { describeError } from '../api/client'

// Loads something for a group and reloads it whenever `version` changes.
// While it reloads, the previous data stays on screen, so numbers never flicker.
// `fetcher` must be a stable function, such as settlementsApi.balances.
export function useGroupResource(fetcher, groupId, version) {
    const [state, setState] = useState({ data: null, error: '', loaded: false })

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await fetcher(groupId)
                if (!cancelled) setState({ data, error: '', loaded: true })
            } catch (err) {
                if (!cancelled) {
                    // A failed reload keeps the last data and reports the error
                    setState((current) => ({ ...current, error: describeError(err).message, loaded: true }))
                }
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response that has been replaced by a newer request
        }
    }, [fetcher, groupId, version])

    return state
}