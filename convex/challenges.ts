import { ConvexError, v } from 'convex/values'
import { mutation, query, type QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { getEventAccess } from './lib/auth'
import { getParticipant, requireParticipant } from './lib/participant'
import { getTeamMembership } from './lib/membership'
import { startNextChallengeForTeam } from './lib/challenge'
import { roleFor, operator, analyst, scout, hints } from './lib/roles'
import { TEAM_SIZE } from './lib/constants'

// Helpers
const MAX_FILES = 100
const MAX_FILES_BYTES = 100_000

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function validateOperator(operator: {
  startDir: string
  files: { path: string; content: string }[]
}) {
  if (!operator.startDir.startsWith('/')) {
    throw new ConvexError('startDir must be an absolute path')
  }
  if (operator.files.length > MAX_FILES) {
    throw new ConvexError(`Too many operator files (max ${MAX_FILES})`)
  }
  let total = 0
  for (const f of operator.files) {
    if (!f.path.startsWith('/')) {
      throw new ConvexError(`File path must be absolute: ${f.path}`)
    }
    total += f.content.length
  }
  if (total > MAX_FILES_BYTES) {
    throw new ConvexError(
      `Operator filesystem too large (max ${MAX_FILES_BYTES} bytes)`,
    )
  }
}

// MVP: every challenge belongs to exactly one event. Auth goes through the
// event's access check, so creators and managers share the same code path.
// Edits are locked once the event is live.
async function requireEditableChallenge(
  ctx: QueryCtx,
  challengeId: Id<'challenges'>,
) {
  const challenge = await ctx.db.get(challengeId)
  if (challenge === null) throw new ConvexError('Challenge not found')

  const link = await ctx.db
    .query('eventChallenges')
    .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
    .first()
  if (link === null) throw new ConvexError('Challenge not found')

  const access = await getEventAccess(ctx, link.eventId)
  if (access === null) throw new ConvexError('Challenge not found')
  if (access.event.status !== 'scheduled') {
    throw new ConvexError('Challenges can only be edited before the event starts')
  }
  return { challenge, link, access }
}

// Strip everything the participant's role may not see. Hint text is null
// until that slot has been unlocked, so the client cannot inspect future hints.
function projectForRole(
  challenge: Doc<'challenges'>,
  role: 'scout' | 'analyst' | 'operator',
  hintsUsed: number,
) {
  const base = {
    _id: challenge._id,
    title: challenge.title,
    story: challenge.story,
    difficulty: challenge.difficulty,
    points: challenge.points,
    flagFormat: challenge.flagFormat,
    hints: challenge.hints.map((h, i) => ({
      afterSeconds: h.afterSeconds,
      penalty: h.penalty,
      text: i < hintsUsed ? h.text : null,
    })),
  }
  if (role === 'scout') return { ...base, role, scout: challenge.scout }
  if (role === 'analyst') return { ...base, role, analyst: challenge.analyst }
  return {
    ...base,
    role,
    operator: challenge.operator,
  }
}

// --- admin -----------------------------------------------------------------

export const create = mutation({
  args: {
    eventId: v.id('events'),
    title: v.string(),
    story: v.string(),
    difficulty: v.union(v.literal(1), v.literal(2), v.literal(3)),
    points: v.number(),
    flagFormat: v.string(),
    flag: v.string(),
    scout,
    analyst,
    operator,
    hints,
    debrief: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await getEventAccess(ctx, args.eventId)
    if (access === null) throw new ConvexError('Event not found')
    if (access.event.status !== 'scheduled') {
      throw new ConvexError('Challenges can only be added before the event starts')
    }

    if (args.title.trim().length === 0) {
      throw new ConvexError('Title is required')
    }
    if (args.flag.trim().length === 0) {
      throw new ConvexError('Flag is required')
    }
    if (args.points < 0) throw new ConvexError('Points must be non-negative')
    validateOperator(args.operator)

    const flagHash = await sha256(args.flag.trim())

    const challengeId = await ctx.db.insert('challenges', {
      ownerId: access.event.creatorId,
      title: args.title.trim(),
      story: args.story,
      difficulty: args.difficulty,
      points: args.points,
      flagFormat: args.flagFormat,
      flagHash,
      scout: args.scout,
      analyst: args.analyst,
      operator: args.operator,
      hints: args.hints,
      debrief: args.debrief,
    })

    // Auto-link: appends to the end of the event's sequence.
    const existing = await ctx.db
      .query('eventChallenges')
      .withIndex('by_event_and_order', (q) => q.eq('eventId', args.eventId))
      .collect()
    const order =
      existing.length === 0 ? 0 : Math.max(...existing.map((e) => e.order)) + 1
    await ctx.db.insert('eventChallenges', {
      eventId: args.eventId,
      challengeId,
      order,
    })

    return challengeId
  },
})

export const update = mutation({
  args: {
    challengeId: v.id('challenges'),
    title: v.optional(v.string()),
    story: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    points: v.optional(v.number()),
    flagFormat: v.optional(v.string()),
    flag: v.optional(v.string()),
    scout: v.optional(scout),
    analyst: v.optional(analyst),
    operator: v.optional(operator),
    hints: v.optional(hints),
    debrief: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireEditableChallenge(ctx, args.challengeId)
    if (args.operator !== undefined) validateOperator(args.operator)

    const flagHash =
      args.flag !== undefined ? await sha256(args.flag.trim()) : undefined

    await ctx.db.patch(args.challengeId, {
      ...(args.title !== undefined && { title: args.title.trim() }),
      ...(args.story !== undefined && { story: args.story }),
      ...(args.difficulty !== undefined && { difficulty: args.difficulty }),
      ...(args.points !== undefined && { points: args.points }),
      ...(args.flagFormat !== undefined && { flagFormat: args.flagFormat }),
      ...(flagHash !== undefined && { flagHash }),
      ...(args.scout !== undefined && { scout: args.scout }),
      ...(args.analyst !== undefined && { analyst: args.analyst }),
      ...(args.operator !== undefined && { operator: args.operator }),
      ...(args.hints !== undefined && { hints: args.hints }),
      ...(args.debrief !== undefined && { debrief: args.debrief }),
    })
  },
})

export const remove = mutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const { challenge } = await requireEditableChallenge(ctx, challengeId)

    const started = await ctx.db
      .query('teamChallenges')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .take(1)

    if (started.length > 0) {
      throw new ConvexError('Teams have started this challenge')
    }

    const links = await ctx.db
      .query('eventChallenges')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .collect()
    for (const link of links) await ctx.db.delete(link._id)
    await ctx.db.delete(challenge._id)
  },
})

export const get = query({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const challenge = await ctx.db.get(challengeId)
    if (challenge === null) return null

    const link = await ctx.db
      .query('eventChallenges')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .first()
    if (link === null) return null

    const access = await getEventAccess(ctx, link.eventId)
    if (access === null) return null

    const { flagHash: _flagHash, ...safe } = challenge
    return safe
  },
})

export const listForEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const access = await getEventAccess(ctx, eventId)
    if (access === null) return null

    const links = await ctx.db
      .query('eventChallenges')
      .withIndex('by_event_and_order', (q) => q.eq('eventId', eventId))
      .collect()

    const challenges = await Promise.all(
      links.map((l) => ctx.db.get(l.challengeId)),
    )

    return links
      .map((link, i) => {
        const c = challenges[i]
        if (c === null) return null
        return {
          _id: c._id,
          order: link.order,
          title: c.title,
          difficulty: c.difficulty,
          points: c.points,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  },
})

// --- participant -----------------------------------------------------------

export const getCurrent = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const participant = await getParticipant(ctx, token)
    if (participant === null) return { status: 'no-session' as const }

    const membership = await getTeamMembership(ctx, participant)
    if (membership === null) return { status: 'no-team' as const }

    const [team, event] = await Promise.all([
      ctx.db.get(membership.teamId),
      ctx.db.get(participant.eventId),
    ])
    if (team === null) return { status: 'no-team' as const }
    if (event === null) return { status: 'ended' as const }

    if (event.status === 'ended') return { status: 'ended' as const }

    if (team.memberCount < TEAM_SIZE) {
      return {
        status: 'waiting-for-team' as const,
        memberCount: team.memberCount,
        capacity: TEAM_SIZE,
        eventStatus: event.status,
      }
    }

    if (event.status !== 'live') {
      return { status: 'waiting-for-event' as const, eventStatus: event.status }
    }

    if (team.unlockedAt === undefined) {
      const presses = await ctx.db
        .query('lockPresses')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .collect()
      const withHandles = await Promise.all(
        presses.map(async (p) => {
          const who = await ctx.db.get(p.participantId)
          return {
            participantId: p.participantId,
            handle: who?.handle ?? 'unknown',
            pressedAt: p.pressedAt,
          }
        }),
      )
      return {
        status: 'triple-lock' as const,
        windowMs: event.tripleLockWindowMs,
        myParticipantId: participant._id,
        presses: withHandles,
      }
    }

    const teamChallenges = await ctx.db
      .query('teamChallenges')
      .withIndex('by_team', (q) => q.eq('teamId', team._id))
      .collect()

    const active = teamChallenges.find((tc) => tc.status === 'active')
    if (active !== undefined) {
      const challenge = await ctx.db.get(active.challengeId)
      if (challenge === null) return { status: 'finished' as const }
      const role = roleFor(membership.seat, active.rotation)
      return {
        status: 'active' as const,
        teamChallengeId: active._id,
        rotation: active.rotation,
        hintsUsed: active.hintsUsed,
        startedAt: active.startedAt,
        challenge: projectForRole(challenge, role, active.hintsUsed),
      }
    }

    return { status: 'finished' as const }
  },
})

export const submitFlag = mutation({
  args: {
    token: v.string(),
    challengeId: v.id('challenges'),
    flag: v.string(),
  },
  handler: async (ctx, { token, challengeId, flag }) => {
    const participant = await requireParticipant(ctx, token)
    const membership = await getTeamMembership(ctx, participant)
    if (membership === null) throw new ConvexError('Join a team first')

    const team = await ctx.db.get(membership.teamId)
    if (team === null) throw new ConvexError('Team not found')
    if (team.unlockedAt === undefined) {
      throw new ConvexError('Complete the triple lock first')
    }

    const teamChallenge = await ctx.db
      .query('teamChallenges')
      .withIndex('by_team_and_challenge', (q) =>
        q.eq('teamId', team._id).eq('challengeId', challengeId),
      )
      .first()
    if (teamChallenge === null) {
      throw new ConvexError('This challenge is not active for your team')
    }
    if (teamChallenge.status === 'solved') {
      return { correct: true as const, alreadySolved: true as const }
    }

    const challenge = await ctx.db.get(challengeId)
    if (challenge === null) throw new ConvexError('Challenge not found')

    const hash = await sha256(flag.trim())
    const correct = hash === challenge.flagHash

    await ctx.db.insert('submissions', {
      teamId: team._id,
      challengeId,
      participantId: participant._id,
      correct,
      submittedAt: Date.now(),
    })

    if (!correct) return { correct: false as const }

    const penalties = challenge.hints
      .slice(0, teamChallenge.hintsUsed)
      .reduce((sum, h) => sum + h.penalty, 0)
    const points = Math.max(0, challenge.points - penalties)
    const now = Date.now()

    await ctx.db.patch(teamChallenge._id, {
      status: 'solved',
      solvedAt: now,
      pointsAwarded: points,
    })
    await ctx.db.patch(team._id, {
      score: team.score + points,
      lastSolvedAt: now,
    })

    const nextChallengeId = await startNextChallengeForTeam(
      ctx,
      team._id,
      participant.eventId,
    )

    return {
      correct: true as const,
      points,
      debrief: challenge.debrief,
      nextChallengeId,
    }
  },
})
