import { ConvexError, v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { getEventAccess } from './lib/auth'
import { MAX_TEAMS_PER_EVENT } from './lib/constants'
import { randomString } from './lib/random'
import { TEAM_SIZE } from './schema'
import { getParticipant, requireParticipant } from './lib/participant'
import { roleFor } from './lib/roles'

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

// Public: resolves a shared link to a preview. Never reveals other teams.
export const getByJoinCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const team = await ctx.db
      .query('teams')
      .withIndex('by_join_code', (q) => q.eq('joinCode', code.trim().toLowerCase()))
      .unique()
    if (team === null) return null
    const event = await ctx.db.get(team.eventId)
    if (event === null) return null
    return {
      teamId: team._id,
      teamName: team.name,
      memberCount: team.memberCount,
      capacity: TEAM_SIZE,
      eventId: event._id,
      eventTitle: event.title,
      eventStatus: event.status,
    }
  },
})

// Public: unfilled rooms, fullest first so nearly-full teams get topped up.
// Join codes are deliberately not included.
export const listOpen = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_event_and_member_count', (q) =>
        q.eq('eventId', eventId).lt('memberCount', TEAM_SIZE),
      )
      .order('desc')
      .take(MAX_TEAMS_PER_EVENT)
    return teams.map((t) => ({
      _id: t._id,
      name: t.name,
      memberCount: t.memberCount,
      capacity: TEAM_SIZE,
    }))
  },
})

export const join = mutation({
  args: { token: v.string(), teamId: v.id('teams') },
  handler: async (ctx, { token, teamId }) => {
    const participant = await requireParticipant(ctx, token)

    const team = await ctx.db.get(teamId)
    if (team === null || team.eventId !== participant.eventId) {
      throw new ConvexError('Team not found')
    }
    const event = await ctx.db.get(team.eventId)
    if (event === null || event.status === 'ended') {
      throw new ConvexError('This event has ended')
    }

    const current = await ctx.db
      .query('teamMembers')
      .withIndex('by_event_and_participant', (q) =>
        q.eq('eventId', participant.eventId).eq('participantId', participant._id),
      )
      .unique()
    if (current !== null) {
      if (current.teamId === teamId) return { status: 'joined' as const }
      throw new ConvexError('You are already in a team')
    }

    const members = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', teamId))
      .take(TEAM_SIZE)
    if (members.length >= TEAM_SIZE) return { status: 'full' as const }

    // lowest free seat, so the three roles are always covered
    const taken = new Set(members.map((m) => m.seat))
    let seat = 0
    while (taken.has(seat)) seat++

    await ctx.db.insert('teamMembers', {
      teamId,
      eventId: team.eventId,
      participantId: participant._id,
      seat,
      joinedAt: Date.now(),
    })
    await ctx.db.patch(teamId, { memberCount: members.length + 1 })
    return { status: 'joined' as const }
  },
})

// The caller's team, teammates and role. Null if no session or no team yet.
// Only members ever get the join code.
export const getMine = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const participant = await getParticipant(ctx, token)
    if (participant === null) return null

    const membership = await ctx.db
      .query('teamMembers')
      .withIndex('by_event_and_participant', (q) =>
        q.eq('eventId', participant.eventId).eq('participantId', participant._id),
      )
      .unique()
    if (membership === null) return null

    const team = await ctx.db.get(membership.teamId)
    if (team === null) return null

    const members = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', team._id))
      .take(TEAM_SIZE)

    const teammates = await Promise.all(
      members.map(async (m) => {
        const p = await ctx.db.get(m.participantId)
        return {
          participantId: m.participantId,
          handle: p?.handle ?? 'unknown',
          seat: m.seat,
          role: roleFor(m.seat, 0), // rotation will come from the current teamChallenge
          isMe: m.participantId === participant._id,
        }
      }),
    )
    teammates.sort((a, b) => a.seat - b.seat)

    return {
      teamId: team._id,
      name: team.name,
      joinCode: team.joinCode,
      capacity: TEAM_SIZE,
      myRole: roleFor(membership.seat, 0),
      teammates,
    }
  },
})
