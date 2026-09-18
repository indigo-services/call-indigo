/**
 * Data-loading hooks for the dashboard.
 *
 * `useApiData(key, load)` is the single way a page reads from the API. It
 * re-runs whenever the global API version changes, which is what makes a
 * mutation on one page (submitting the inquiry form, changing a status) repaint
 * every other page that shows the same data.
 *
 * `key` is an explicit cache/test identity rather than a dependency array: it
 * keeps the effect's dependencies lint-checkable and makes it obvious what a
 * given read is keyed on.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { getVersion, subscribeToChanges } from "@/lib/data/api"

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface UseApiDataResult<T> extends AsyncState<T> {
  reload: () => void
}

export function useApiData<T>(key: string, load: () => Promise<T>): UseApiDataResult<T> {
  const version = useSyncExternalStore(subscribeToChanges, getVersion, getVersion)
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  // Keep the latest loader without making it an effect dependency. Declared
  // before the fetch effect so it is always current when that effect runs.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      },
      (err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
    // `version` is the global mutation counter; `nonce` is a manual reload.
  }, [key, version, nonce])

  return { ...state, reload: () => setNonce((n) => n + 1) }
}
