import { createAccount, getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { action, internalQuery, query, mutation } from './_generated/server'
import { requireEventOwner } from './lib/auth'
import { MAX_MANAGERS_PER_EVENT, managerExpiry } from './lib/constants'

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/

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
  args: { userId: v.id('users'), eventId: v.id('events'), username: v.string() },
  handler: async (ctx, { userId, eventId, username }) => {
    const [user, event] = await Promise.all([ctx.db.get(userId), ctx.db.get(eventId)])
    if (user?.accountType !== 'creator' || event === null || event.creatorId !== userId) {
      throw new ConvexError('Event not found')
    }
    if (event.status === 'ended') throw new ConvexError('This event has ended')

    const taken = await ctx.db
      .query('authAccounts')
      .withIndex('providerAndAccountId', (q) =>
        q.eq('provider', 'manager').eq('providerAccountId', username),
      )
      .unique()
    if (taken !== null) throw new ConvexError('That username is taken')

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

export const createManager = action({
  args: { eventId: v.id('events'), username: v.string() },
  handler: async (
    ctx,
    { eventId, username: rawUsername },
  ): Promise<{ userId: Id<'users'>; username: string; password: string }> => {
    const creatorId = await getAuthUserId(ctx)
    if (creatorId === null) throw new ConvexError('Not signed in')

    // lowercase so "Sam" and "sam" can't both exist
    const username = rawUsername.trim().toLowerCase()
    if (!USERNAME_PATTERN.test(username)) {
      throw new ConvexError('Username must be 3-30 characters: letters, numbers, - or _')
    }

    const { expiresAt } = await ctx.runQuery(internal.users.checkManagerCreation, {
      userId: creatorId,
      eventId,
      username,
    })

    const password = randomString(8)

    try {
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
    } catch {
      // two creators picking the same username at the same instant
      throw new ConvexError('That username may have just been taken. Try another.')
    }
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

export const revokeManager = mutation({
  args: { managerId: v.id('users') },
  handler: async (ctx, { managerId }) => {
    const manager = await ctx.db.get(managerId)
    if (manager?.accountType !== 'manager' || manager.managerOfEventId === undefined) {
      throw new ConvexError('Manager not found')
    }
    // throws unless the caller is the creator who owns this manager's event
    await requireEventOwner(ctx, manager.managerOfEventId)

    // Convex Auth keeps the credentials and sessions in its own tables
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', managerId))
      .collect()
    for (const account of accounts) await ctx.db.delete(account._id)

    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', managerId))
      .collect()
    for (const session of sessions) {
      const tokens = await ctx.db
        .query('authRefreshTokens')
        .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
        .collect()
      for (const token of tokens) await ctx.db.delete(token._id)
      await ctx.db.delete(session._id)
    }

    await ctx.db.delete(managerId)
  },
})
