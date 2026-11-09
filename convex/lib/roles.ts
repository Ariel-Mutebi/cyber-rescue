import { ROLES } from '../schema'

export function roleFor(seat: number, rotation: number) {
  return ROLES[(seat + rotation) % ROLES.length]
}
