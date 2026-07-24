interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // seconds until the limit resets/allows next try
}

/**
 * Checks and records a rate limit attempt for a specific action key.
 *
 * @param key Unique key for the rate limited action (e.g. 'login', 'register')
 * @param limit Maximum number of attempts allowed within the window
 * @param windowSeconds Cooldown window duration in seconds
 */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  // Retrieve past attempts from localStorage
  let attempts: number[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      attempts = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse rate limit attempts', e);
  }

  // Filter out attempts older than the window
  const windowMs = windowSeconds * 1000;
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (attempts.length >= limit) {
    // Calculate when the oldest attempt in the current window will expire
    const oldestAttempt = attempts[0];
    const timePassedSinceOldest = now - oldestAttempt;
    const timeRemainingMs = windowMs - timePassedSinceOldest;
    const remainingSeconds = Math.ceil(timeRemainingMs / 1000);

    return {
      allowed: false,
      remaining: limit - attempts.length,
      resetTime: Math.max(1, remainingSeconds),
    };
  }

  // Record current attempt
  attempts.push(now);
  try {
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (e) {
    console.error('Failed to save rate limit attempts', e);
  }

  return {
    allowed: true,
    remaining: limit - attempts.length,
    resetTime: 0,
  };
}

/**
 * Helper to get the cooldown time remaining without registering a new attempt.
 */
export function getRateLimitCooldown(key: string, limit: number, windowSeconds: number): number {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  let attempts: number[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      attempts = JSON.parse(stored);
    }
  } catch (e) {
    return 0;
  }

  const windowMs = windowSeconds * 1000;
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (attempts.length >= limit) {
    const oldestAttempt = attempts[0];
    const timePassedSinceOldest = now - oldestAttempt;
    const timeRemainingMs = windowMs - timePassedSinceOldest;
    return Math.max(1, Math.ceil(timeRemainingMs / 1000));
  }

  return 0;
}
