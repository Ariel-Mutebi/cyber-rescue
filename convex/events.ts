import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getEventAccess, requireCreator, requireEventOwner } from './lib/auth'
import {
  DEFAULT_TRIPLE_LOCK_WINDOW_MS,
  MAX_MANAGERS_PER_EVENT,
  managerExpiry,
} from './lib/constants'

const TITLE_MAX = 100
const DESCRIPTION_MAX = 1000

function cleanTitle(raw: string) {
  const title = raw.trim()
  if (title.length === 0 || title.length > TITLE_MAX) {
    throw new ConvexError(`Title must be 1-${TITLE_MAX} characters`)
  }
  return title
}

function cleanDescription(raw: string) {
  const description = raw.trim()
  if (description.length > DESCRIPTION_MAX) {
    throw new ConvexError(`Description can be at most ${DESCRIPTION_MAX} characters`)
  }
  return description
}

function checkSchedule(scheduledAt: number) {
  if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) {
    throw new ConvexError('Schedule the event for a time in the future')
  }
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(), // ms since epoch
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx)
    checkSchedule(args.scheduledAt)

    return await ctx.db.insert('events', {
      creatorId: user._id,
      title: cleanTitle(args.title),
      description:
        args.description === undefined ? undefined : cleanDescription(args.description),
      scheduledAt: args.scheduledAt,
      status: 'scheduled',
      tripleLockWindowMs: DEFAULT_TRIPLE_LOCK_WINDOW_MS,
    })
  },
})

export const update = mutation({
  args: {
    eventId: v.id('events'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, { eventId, ...changes }) => {
    const { event } = await requireEventOwner(ctx, eventId)
    if (event.status !== 'scheduled') {
      throw new ConvexError('Only scheduled events can be edited')
    }

    const patch: Partial<Doc<'events'>> = {}
    if (changes.title !== undefined) patch.title = cleanTitle(changes.title)
    if (changes.description !== undefined) {
      patch.description = cleanDescription(changes.description)
    }

    const newTime = changes.scheduledAt
    if (newTime !== undefined) {
      checkSchedule(newTime)
      patch.scheduledAt = newTime
    }
    await ctx.db.patch(eventId, patch)

    // temporary manager accounts follow the event if it moves
    if (newTime !== undefined) {
      const managers = await ctx.db
        .query('users')
        .withIndex('by_event', (q) => q.eq('managerOfEventId', eventId))
        .take(MAX_MANAGERS_PER_EVENT)
      await Promise.all(
        managers.map((m) => ctx.db.patch(m._id, { expiresAt: managerExpiry(newTime) })),
      )
    }
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCreator(ctx)
    return await ctx.db
      .query('events')
      .withIndex('by_creator', (q) => q.eq('creatorId', user._id))
      .order('desc')
      .take(50)
  },
})

// Creator (owner) or one of the event's managers; null if neither
export const get = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const access = await getEventAccess(ctx, eventId)
    return access === null ? null : { ...access.event, role: access.role }
  },
})

export const getPublic = query({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const id = ctx.db.normalizeId('events', eventId)
    if (id === null) return null
    const event = await ctx.db.get(id)
    if (event === null) return null
    return {
      _id: event._id,
      title: event.title,
      scheduledAt: event.scheduledAt,
      status: event.status,
    }
  },
})
