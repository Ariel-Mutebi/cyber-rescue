import { createAccount, getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { action, internalQuery, query } from './_generated/server'
import { requireEventOwner } from './lib/auth'
import { MAX_MANAGERS_PER_EVENT, managerExpiry } from './lib/constants'

// 32 characters (no l, o, 0, 1), so `byte & 31` has no modulo bias
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('')
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return null
    const user = await ctx.db.get(userId)
    if (user === null) return null
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      managerOfEventId: user.managerOfEventId,
    }
  },
})

export const checkManagerCreation = internalQuery({
  args: { userId: v.id('users'), eventId: v.id('events') },
  handler: async (ctx, { userId, eventId }) => {
    const [user, event] = await Promise.all([ctx.db.get(userId), ctx.db.get(eventId)])
    if (user?.accountType !== 'creator' || event === null || event.creatorId !== userId) {
      throw new ConvexError('Event not found')
    }
    if (event.status === 'ended') throw new ConvexError('This event has ended')

    const existing = await ctx.db
      .query('users')
      .withIndex('by_event', (q) => q.eq('managerOfEventId', eventId))
      .take(MAX_MANAGERS_PER_EVENT)
    if (existing.length >= MAX_MANAGERS_PER_EVENT) {
      throw new ConvexError(`An event can have at most ${MAX_MANAGERS_PER_EVENT} managers`)
    }

    return { expiresAt: managerExpiry(event.scheduledAt) }
  },
})

// The explicit return type avoids a circular-inference error with internal.users.*
export const createManager = action({
  args: { eventId: v.id('events') },
  handler: async (
    ctx,
    { eventId },
  ): Promise<{ userId: Id<'users'>; username: string; password: string }> => {
    const creatorId = await getAuthUserId(ctx)
    if (creatorId === null) throw new ConvexError('Not signed in')

    const { expiresAt } = await ctx.runQuery(internal.users.checkManagerCreation, {
      userId: creatorId,
      eventId,
    })

    const username = `mgr-${randomString(6)}`
    const password = randomString(12)

    const { user } = await createAccount(ctx, {
      provider: 'manager',
      account: { id: username, secret: password },
      profile: {
        name: username,
        accountType: 'manager',
        managerOfEventId: eventId,
        createdBy: creatorId,
        expiresAt,
      },
    })

    // The only time the plaintext password exists. Only a hash is stored.
    return { userId: user._id, username, password }
  },
})

export const listManagers = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    await requireEventOwner(ctx, eventId)
    const managers = await ctx.db
      .query('users')
      .withIndex('by_event', (q) => q.eq('managerOfEventId', eventId))
      .take(MAX_MANAGERS_PER_EVENT)
    return managers.map((m) => ({
      _id: m._id,
      username: m.name,
      expiresAt: m.expiresAt,
    }))
  },
})
