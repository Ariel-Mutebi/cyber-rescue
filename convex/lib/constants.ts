export const DEFAULT_TRIPLE_LOCK_WINDOW_MS = 30_000
export const MAX_MANAGERS_PER_EVENT = 10
export const MAX_TEAMS_PER_EVENT = 100
const MANAGER_GRACE_MS = 24 * 60 * 60 * 1000

export const TEAM_SIZE = 3
export const ROLES = ['scout', 'analyst', 'operator'] as const

// temporary accounts die a day after the event's scheduled start
export function managerExpiry(scheduledAt: number) {
  return scheduledAt + MANAGER_GRACE_MS
}
