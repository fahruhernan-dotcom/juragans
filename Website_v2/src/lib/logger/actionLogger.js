/**
 * TernakOS — Action Logger
 * Wraps async action handlers to catch and log errors without disrupting flow.
 */

import { logError } from './errorLogger'

/**
 * Wrap an async action handler with automatic error logging.
 *
 * @param {string} actionName - e.g. 'account.edit_profile.save'
 * @param {Function} handler - Async function to wrap
 * @param {object} [context]
 * @param {string} [context.component]
 * @returns {Function} Wrapped async function
 */
export function withActionLogging(actionName, handler, { component = null } = {}) {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (error) {
      logError({
        level: 'error',
        source: 'action',
        component,
        actionName,
        error,
        metadata: {},
      })
      // Re-throw so caller can still handle (show toast, etc.)
      throw error
    }
  }
}
