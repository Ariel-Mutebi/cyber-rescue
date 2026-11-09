import { useCallback, useState } from 'react'

const key = (eventId: string) => `participant-token:${eventId}`

function read(eventId: string | undefined) {
  if (eventId === undefined) return null
  try {
    return localStorage.getItem(key(eventId))
  } catch {
    return null
  }
}

export function useParticipantToken(eventId: string | undefined) {
  const [token, setTokenState] = useState<string | null>(() => read(eventId))
  const [seenEventId, setSeenEventId] = useState(eventId)

  // eventId can arrive late (join page), so re-read when it changes
  if (eventId !== seenEventId) {
    setSeenEventId(eventId)
    setTokenState(read(eventId))
  }

  const setToken = useCallback(
    (value: string) => {
      if (eventId !== undefined) {
        localStorage.setItem(key(eventId), value)
      }
      setTokenState(value)
    },
    [eventId],
  )

  return [token, setToken] as const
}
