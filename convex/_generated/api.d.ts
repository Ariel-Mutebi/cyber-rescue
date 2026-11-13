/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as challenges from "../challenges.js";
import type * as cleanup from "../cleanup.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib_accounts from "../lib/accounts.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_challenge from "../lib/challenge.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_membership from "../lib/membership.js";
import type * as lib_participant from "../lib/participant.js";
import type * as lib_random from "../lib/random.js";
import type * as lib_roles from "../lib/roles.js";
import type * as locks from "../locks.js";
import type * as messages from "../messages.js";
import type * as participants from "../participants.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  challenges: typeof challenges;
  cleanup: typeof cleanup;
  events: typeof events;
  http: typeof http;
  "lib/accounts": typeof lib_accounts;
  "lib/auth": typeof lib_auth;
  "lib/challenge": typeof lib_challenge;
  "lib/constants": typeof lib_constants;
  "lib/membership": typeof lib_membership;
  "lib/participant": typeof lib_participant;
  "lib/random": typeof lib_random;
  "lib/roles": typeof lib_roles;
  locks: typeof locks;
  messages: typeof messages;
  participants: typeof participants;
  teams: typeof teams;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
