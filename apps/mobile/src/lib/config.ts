/**
 * App configuration
 * 
 * DEMO_MODE: When true, AI generation features are disabled but all other
 * features work normally. This is for testing/development without API keys.
 */
export const DEMO_MODE = true;

/**
 * Check if AI features are available
 * Returns false in demo mode
 */
export function isAIEnabled(): boolean {
  return !DEMO_MODE;
}
