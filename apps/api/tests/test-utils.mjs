import assert from "node:assert/strict";

/**
 * Asserts that a promise rejects with a specific error message substring.
 * Accepts either a promise or a thunk (function returning a promise).
 * @param {Promise<unknown> | (() => Promise<unknown>)} promiseOrAction
 * @param {string} messageSubstring
 * @returns {Promise<void>}
 */
export async function assertRejectsWithMessage(promiseOrAction, messageSubstring) {
  try {
    await (typeof promiseOrAction === "function" ? promiseOrAction() : promiseOrAction);
    assert.fail("Expected promise to reject");
  } catch (error) {
    if (error?.message) {
      assert.ok(
        error.message.includes(messageSubstring),
        `Expected error message to include "${messageSubstring}", but got "${error.message}"`,
      );
    } else {
      throw error;
    }
  }
}
