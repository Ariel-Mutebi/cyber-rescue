import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getEventAccess, requireCreator, requireEventOwner } from './lib/auth'
import {
  DEFAULT_TRIPLE_LOCK_WINDOW_MS,
  MAX_MANAGERS_PER_EVENT,
  managerExpiry,
} from './lib/constants'
import { internal } from './_generated/api'

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

// Public: events that are running or still to come, kept apart
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const [live, upcoming] = await Promise.all([
      ctx.db
        .query('events')
        .withIndex('by_status_and_scheduled_at', (q) => q.eq('status', 'live'))
        .take(50),
      ctx.db
        .query('events')
        .withIndex('by_status_and_scheduled_at', (q) => q.eq('status', 'scheduled'))
        .take(50),
    ])

    // creatorId stays private
    const toPublic = (e: Doc<'events'>) => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      scheduledAt: e.scheduledAt,
      startedAt: e.startedAt,
    })

    return { live: live.map(toPublic), upcoming: upcoming.map(toPublic) }
  },
})

export const remove = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventOwner(ctx, eventId)
    if (event.status === 'live') {
      throw new ConvexError('End the event before deleting it')
    }

    // gone immediately: nobody can reach it and every list updates live
    await ctx.db.delete(eventId)
    // teams, players, managers and the rest are cleaned up in the background
    await ctx.scheduler.runAfter(0, internal.cleanup.deleteEventData, { eventId })
  },
})

export const start = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const access = await getEventAccess(ctx, eventId)
    if (access === null) throw new ConvexError('Event not found')
    if (access.event.status !== 'scheduled') {
      throw new ConvexError('Event has already started or ended')
    }

    const links = await ctx.db
      .query('eventChallenges')
      .withIndex('by_event_and_order', (q) => q.eq('eventId', eventId))
      .take(1)
    if (links.length === 0) {
      throw new ConvexError('Add at least one challenge before starting')
    }

    await ctx.db.patch(eventId, { status: 'live', startedAt: Date.now() })
  },
})

export const end = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const access = await getEventAccess(ctx, eventId)
    if (access === null) throw new ConvexError('Event not found')
    if (access.event.status !== 'live') {
      throw new ConvexError('Event is not live')
    }
    await ctx.db.patch(eventId, { status: 'ended', endedAt: Date.now() })
  },
})
