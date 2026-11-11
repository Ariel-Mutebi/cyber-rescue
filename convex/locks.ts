import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireParticipant } from './lib/participant'
import { getTeamMembership } from './lib/membership'
import { startNextChallengeForTeam } from './lib/challenge'
import { TEAM_SIZE } from './lib/constants'

export const press = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const participant = await requireParticipant(ctx, token)
    const membership = await getTeamMembership(ctx, participant)
    if (membership === null) throw new ConvexError('Join a team first')

    const [team, event] = await Promise.all([
      ctx.db.get(membership.teamId),
      ctx.db.get(participant.eventId),
    ])
    if (team === null) throw new ConvexError('Team not found')
    if (event === null) throw new ConvexError('Event not found')

    if (team.unlockedAt !== undefined) {
      return { status: 'already-unlocked' as const }
    }
    if (event.status !== 'live') {
      throw new ConvexError('Event is not live')
    }
    if (team.memberCount < TEAM_SIZE) {
      throw new ConvexError('Team is not full yet')
    }

    const now = Date.now()
    const existing = await ctx.db
      .query('lockPresses')
      .withIndex('by_team_and_participant', (q) =>
        q.eq('teamId', team._id).eq('participantId', participant._id),
      )
      .unique()
    if (existing !== null) {
      await ctx.db.patch(existing._id, { pressedAt: now })
    } else {
      await ctx.db.insert('lockPresses', {
        teamId: team._id,
        participantId: participant._id,
        pressedAt: now,
      })
    }

    const presses = await ctx.db
      .query('lockPresses')
      .withIndex('by_team', (q) => q.eq('teamId', team._id))
      .collect()

    if (presses.length < TEAM_SIZE) {
      return {
        status: 'waiting' as const,
        pressCount: presses.length,
        required: TEAM_SIZE,
      }
    }

    const times = presses.map((p) => p.pressedAt).sort((a, b) => a - b)
    const span = times[times.length - 1] - times[0]

    if (span > event.tripleLockWindowMs) {
      // Out of sync — clear so everyone can retry from a clean slate.
      for (const p of presses) await ctx.db.delete(p._id)
      return { status: 'out-of-sync' as const, spanMs: span }
    }

    // Success. Lock the team and auto-start the first challenge.
    await ctx.db.patch(team._id, { unlockedAt: now })
    for (const p of presses) await ctx.db.delete(p._id)

    const firstChallengeId = await startNextChallengeForTeam(
      ctx,
      team._id,
      participant.eventId,
    )

    return { status: 'unlocked' as const, firstChallengeId }
  },
})
