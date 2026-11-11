import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export async function findNextChallenge(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  teamChallenges: Doc<'teamChallenges'>[],
) {
  const links = await ctx.db
    .query('eventChallenges')
    .withIndex('by_event_and_order', (q) => q.eq('eventId', eventId))
    .collect()
  const done = new Set(teamChallenges.map((tc) => tc.challengeId))
  for (const link of links) {
    if (done.has(link.challengeId)) continue
    const challenge = await ctx.db.get(link.challengeId)
    if (challenge !== null) return { link, challenge }
  }
  return null
}

// Idempotent: returns the active teamChallenge if one exists, otherwise
// creates the next one in sequence. Returns null when the event is exhausted.
export async function startNextChallengeForTeam(
  ctx: MutationCtx,
  teamId: Id<'teams'>,
  eventId: Id<'events'>,
): Promise<Id<'teamChallenges'> | null> {
  const teamChallenges = await ctx.db
    .query('teamChallenges')
    .withIndex('by_team', (q) => q.eq('teamId', teamId))
    .collect()

  const active = teamChallenges.find((tc) => tc.status === 'active')
  if (active !== undefined) return active._id

  const next = await findNextChallenge(ctx, eventId, teamChallenges)
  if (next === null) return null

  return await ctx.db.insert('teamChallenges', {
    teamId,
    challengeId: next.challenge._id,
    eventId,
    rotation: teamChallenges.length,
    status: 'active',
    hintsUsed: 0,
    startedAt: Date.now(),
  })
}
