import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

// A MutationCtx satisfies QueryCtx, so these work in queries and mutations

export async function requireCreator(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new ConvexError('Not signed in')
  const user = await ctx.db.get(userId)
  if (user === null || user.accountType !== 'creator') {
    throw new ConvexError('Only event creators can do this')
  }
  return user
}

export async function requireEventOwner(ctx: QueryCtx, eventId: Id<'events'>) {
  const user = await requireCreator(ctx)
  const event = await ctx.db.get(eventId)
  // same error for "missing" and "not yours" so ids can't be probed
  if (event === null || event.creatorId !== user._id) {
    throw new ConvexError('Event not found')
  }
  return { user, event }
}

// The owning creator, or an unexpired manager assigned to this event; null otherwise
export async function getEventAccess(ctx: QueryCtx, eventId: Id<'events'>) {
  const userId = await getAuthUserId(ctx)
  if (userId === null) return null

  const [user, event] = await Promise.all([ctx.db.get(userId), ctx.db.get(eventId)])
  if (user === null || event === null) return null

  if (user.accountType === 'creator' && event.creatorId === user._id) {
    return { user, event, role: 'creator' as const }
  }

  const expired = user.expiresAt !== undefined && user.expiresAt < Date.now()
  if (user.accountType === 'manager' && user.managerOfEventId === event._id && !expired) {
    return { user, event, role: 'manager' as const }
  }
  return null
}
