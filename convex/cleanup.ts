// convex/cleanup.ts
import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { deleteUserAndAuth } from './lib/accounts'

// Runs after the event document has already been deleted.
export const deleteEventData = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    // managers
    const managers = await ctx.db
      .query('users')
      .withIndex('by_event', (q) => q.eq('managerOfEventId', eventId))
      .collect()
    for (const manager of managers) await deleteUserAndAuth(ctx, manager._id)

    // teams and their children
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
    for (const team of teams) {
      const [presses, members, messages, progress] = await Promise.all([
        ctx.db
          .query('lockPresses')
          .withIndex('by_team', (q) => q.eq('teamId', team._id))
          .collect(),
        ctx.db
          .query('teamMembers')
          .withIndex('by_team', (q) => q.eq('teamId', team._id))
          .collect(),
        ctx.db
          .query('messages')
          .withIndex('by_team', (q) => q.eq('teamId', team._id))
          .collect(),
        ctx.db
          .query('teamChallenges')
          .withIndex('by_team', (q) => q.eq('teamId', team._id))
          .collect(),
      ])
      for (const doc of presses) await ctx.db.delete(doc._id)
      for (const doc of members) await ctx.db.delete(doc._id)
      for (const doc of messages) await ctx.db.delete(doc._id)
      for (const doc of progress) await ctx.db.delete(doc._id)
      await ctx.db.delete(team._id)
    }

    // challenges + their files, then the links
    const links = await ctx.db
      .query('eventChallenges')
      .withIndex('by_event_and_order', (q) => q.eq('eventId', eventId))
      .collect()
    for (const link of links) {
      const challenge = await ctx.db.get(link.challengeId)
      if (challenge !== null) {
        if (challenge.scout.fileId !== undefined) {
          await ctx.storage.delete(challenge.scout.fileId)
        }
        await ctx.db.delete(challenge._id)
      }
      await ctx.db.delete(link._id)
    }

    // feedback
    const feedback = await ctx.db
      .query('feedback')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
    for (const doc of feedback) await ctx.db.delete(doc._id)

    // participants, their certificates, and their submissions
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_event_and_handle', (q) => q.eq('eventId', eventId))
      .collect()
    for (const participant of participants) {
      const [certs, subs] = await Promise.all([
        ctx.db
          .query('certificates')
          .withIndex('by_participant', (q) =>
            q.eq('participantId', participant._id),
          )
          .collect(),
        ctx.db
          .query('submissions')
          .withIndex('by_participant', (q) =>
            q.eq('participantId', participant._id),
          )
          .collect(),
      ])
      for (const doc of certs) await ctx.db.delete(doc._id)
      for (const doc of subs) await ctx.db.delete(doc._id)
    }
    for (const doc of participants) await ctx.db.delete(doc._id)
  },
})
