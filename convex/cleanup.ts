import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id, TableNames } from './_generated/dataModel'
import { internalMutation, type MutationCtx } from './_generated/server'
import { deleteUserAndAuth } from './lib/accounts'

const BATCH = 100
const TEAMS_PER_PASS = 5

async function deleteAll(ctx: MutationCtx, docs: { _id: Id<TableNames> }[]) {
  for (const doc of docs) await ctx.db.delete(doc._id)
}

// Runs after an event has been deleted. The explicit return type avoids a
// circular-inference error from scheduling itself through `internal`.
export const deleteEventData = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }): Promise<void> => {
    let more = false

    // manager accounts, including their sessions
    const managers = await ctx.db
      .query('users')
      .withIndex('by_event', (q) => q.eq('managerOfEventId', eventId))
      .take(BATCH)
    for (const manager of managers) await deleteUserAndAuth(ctx, manager._id)
    if (managers.length === BATCH) more = true

    // teams and everything that hangs off them
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .take(TEAMS_PER_PASS)
    for (const team of teams) {
      const presses = await ctx.db
        .query('lockPresses')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .take(BATCH)
      const progress = await ctx.db
        .query('teamChallenges')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .take(BATCH)
      const submissions = await ctx.db
        .query('submissions')
        .withIndex('by_team_and_challenge', (q) => q.eq('teamId', team._id))
        .take(BATCH)
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .take(BATCH)
      const members = await ctx.db
        .query('teamMembers')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .take(BATCH)

      await deleteAll(ctx, presses)
      await deleteAll(ctx, progress)
      await deleteAll(ctx, submissions)
      await deleteAll(ctx, messages)
      await deleteAll(ctx, members)

      const drained = [presses, progress, submissions, messages, members].every(
        (docs) => docs.length < BATCH,
      )
      if (drained) await ctx.db.delete(team._id)
      else more = true
    }
    if (teams.length === TEAMS_PER_PASS) more = true

    // Challenges live in the creator's library and are linked to events via
    // eventChallenges. Delete each link; only delete the underlying challenge
    // (and any stored file) when no other event still uses it.
    const links = await ctx.db
      .query('eventChallenges')
      .withIndex('by_event_and_order', (q) => q.eq('eventId', eventId))
      .take(BATCH)
    for (const link of links) {
      const challenge = await ctx.db.get(link.challengeId)
      if (challenge !== null) {
        const otherLinks = await ctx.db
          .query('eventChallenges')
          .withIndex('by_challenge', (q) => q.eq('challengeId', challenge._id))
          .collect()
        const usedElsewhere = otherLinks.some((l) => l.eventId !== eventId)
        if (!usedElsewhere) {
          if (challenge.scout.fileId !== undefined) {
            await ctx.storage.delete(challenge.scout.fileId)
          }
          await ctx.db.delete(challenge._id)
        }
      }
      await ctx.db.delete(link._id)
    }
    if (links.length === BATCH) more = true

    const feedback = await ctx.db
      .query('feedback')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .take(BATCH)
    await deleteAll(ctx, feedback)
    if (feedback.length === BATCH) more = true

    // players, and their certificates
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_event_and_handle', (q) => q.eq('eventId', eventId))
      .take(BATCH)
    for (const participant of participants) {
      const certificates = await ctx.db
        .query('certificates')
        .withIndex('by_participant', (q) => q.eq('participantId', participant._id))
        .take(BATCH)
      await deleteAll(ctx, certificates)
    }
    await deleteAll(ctx, participants)
    if (participants.length === BATCH) more = true

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.deleteEventData, { eventId })
    }
  },
})
