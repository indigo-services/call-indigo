/**
 * useDraft — an editable copy of a value loaded from the API.
 *
 * Every dashboard settings page follows the same shape: load a record, edit it
 * locally, save it back. Two things are easy to get wrong there, and this hook
 * exists to get both right.
 *
 * 1. **Do not clobber unsaved edits.** The API notifies every page whenever
 *    *anything* is written, so a background refresh can deliver a fresh copy of
 *    the record while the user is mid-edit. Resetting on object identity would
 *    silently discard their typing. This resets on the record's *contents*, so a
 *    refresh that returns what we already had leaves the draft alone.
 *
 * 2. **Dirty tracking that means something.** `dirty` compares the draft against
 *    the last value received from the API, so a Save button can disable itself
 *    when there is genuinely nothing to save.
 *
 * `JSON.stringify` is used for both because the records here are small, flat and
 * JSON-shaped — the same things the store already round-trips through.
 */
import { useEffect, useRef, useState } from "react"

export interface UseDraftResult<T> {
  draft: T | null
  setDraft: (updater: T | ((prev: T) => T)) => void
  /** True when the draft differs from the last value loaded from the API. */
  dirty: boolean
  /** Discards local edits and returns to the loaded value. */
  reset: () => void
}

export function useDraft<T>(source: T | null): UseDraftResult<T> {
  const serialized = source === null ? null : JSON.stringify(source)
  const [draft, setDraftState] = useState<T | null>(null)
  const baseRef = useRef<string | null>(null)

  useEffect(() => {
    if (serialized === null) return
    baseRef.current = serialized
    setDraftState(JSON.parse(serialized) as T)
  }, [serialized])

  const dirty = draft !== null && baseRef.current !== null && JSON.stringify(draft) !== baseRef.current

  return {
    draft,
    setDraft: (updater) =>
      setDraftState((prev) => {
        if (prev === null) return prev
        return typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater
      }),
    dirty,
    reset: () => {
      if (baseRef.current !== null) setDraftState(JSON.parse(baseRef.current) as T)
    },
  }
}
