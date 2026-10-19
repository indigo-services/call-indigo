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
  const [nonce, setNonce] = useState(0)

  // The identity of the read that is in flight. `loading` is DERIVED from it
  // rather than set at the top of the effect: a synchronous setState inside an
  // effect commits twice for every read (react-hooks/set-state-in-effect), and
  // deriving it also removes the one-frame window where a new key rendered
  // against the previous read's `loading: false`.
  const requestId = `${key}:${version}:${nonce}`
  const [settled, setSettled] = useState<{
    id: string
    data: T | null
    error: Error | null
  } | null>(null)

  // Keep the latest loader without making it an effect dependency. Declared
  // before the fetch effect so it is always current when that effect runs.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let cancelled = false
    loadRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ id: requestId, data, error: null })
      },
      (err: unknown) => {
        if (!cancelled) {
          setSettled({
            id: requestId,
            data: null,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
    // `requestId` is `key`, `version` (the global mutation counter) and
    // `nonce` (a manual reload) collapsed into one comparable string.
  }, [requestId])

  const loading = settled === null || settled.id !== requestId

  return {
    data: settled?.data ?? null,
    loading,
    // A stale error must not survive the start of the next read, which is what
    // the old `setState(prev => ({ ...prev, loading: true, error: null }))` did.
    error: loading ? null : (settled?.error ?? null),
    reload: () => setNonce((n) => n + 1),
  }
}
