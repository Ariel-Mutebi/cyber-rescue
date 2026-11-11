import { v } from 'convex/values'
import { ROLES } from './constants'

export function roleFor(seat: number, rotation: number) {
  return ROLES[(seat + rotation) % ROLES.length]
}

export const scout = v.object({
  title: v.string(), // e.g. 'Evidence'
  body: v.optional(v.string()), // markdown / raw text
  fileId: v.optional(v.id('_storage')), // image or file evidence
})

export const analyst = v.object({
  title: v.string(), // e.g. 'Briefing'
  body: v.string(), // markdown
})

export const operator = v.object({
  title: v.string(), // e.g. 'Toolbox'
  body: v.string(), // markdown briefing: tools, flag format hints
  startDir: v.string(), // cwd of the simulated shell
  files: v.array(v.object({ path: v.string(), content: v.string() })), // files in simulated shell
})

// hints a team can unlock, each costing points
export const hints = v.array(
  v.object({
    afterSeconds: v.number(), // earliest the hint can be requested
    text: v.string(),
    penalty: v.number(),
  }),
)
