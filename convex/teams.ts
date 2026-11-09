import { ConvexError, v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { getEventAccess } from './lib/auth'
import { MAX_TEAMS_PER_EVENT } from './lib/constants'
import { randomString } from './lib/random'
import { TEAM_SIZE } from './schema'

const NAME_MAX = 40

async function uniqueJoinCode(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomString(8)
    const clash = await ctx.db
      .query('teams')
      .withIndex('by_join_code', (q) => q.eq('joinCode', code))
      .first()
    if (clash === null) return code
  }
  throw new ConvexError('Could not generate a join code. Try again.')
}

// Creator or manager of the event
export const create = mutation({
  args: { eventId: v.id('events'), name: v.string() },
  handler: async (ctx, { eventId, name: rawName }) => {
    const access = await getEventAccess(ctx, eventId)
    if (access === null) throw new ConvexError('Event not found')
    if (access.event.status === 'ended') throw new ConvexError('This event has ended')

    const name = rawName.trim()
    if (name.length === 0 || name.length > NAME_MAX) {
      throw new ConvexError(`Team name must be 1-${NAME_MAX} characters`)
    }

    const existing = await ctx.db
      .query('teams')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .take(MAX_TEAMS_PER_EVENT)
    if (existing.length >= MAX_TEAMS_PER_EVENT) {
      throw new ConvexError(`An event can have at most ${MAX_TEAMS_PER_EVENT} teams`)
    }
    if (existing.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      throw new ConvexError('A team with that name already exists')
    }

    return await ctx.db.insert('teams', {
      eventId,
      name,
      createdBy: access.user._id,
      joinCode: await uniqueJoinCode(ctx),
      memberCount: 0,
      score: 0,
    })
  },
})

// Null if the caller has no access to this event
export const listForEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const access = await getEventAccess(ctx, eventId)
    if (access === null) return null

    const teams = await ctx.db
      .query('teams')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .take(MAX_TEAMS_PER_EVENT)

    return teams.map((t) => ({
      _id: t._id,
      name: t.name,
      joinCode: t.joinCode,
      memberCount: t.memberCount,
      capacity: TEAM_SIZE,
    }))
  },
})

export const remove = mutation({
  args: { teamId: v.id('teams') },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId)
    if (team === null) throw new ConvexError('Team not found')

    // same error for "missing" and "not yours" so ids can't be probed
    const access = await getEventAccess(ctx, team.eventId)
    if (access === null) throw new ConvexError('Team not found')

    if (team.memberCount > 0) {
      throw new ConvexError('Only empty teams can be deleted')
    }

    await ctx.db.delete(teamId)
  },
})
