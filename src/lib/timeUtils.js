// @ts-nocheck

/**
 * Add 1 hour to Supabase timestamps (timezone offset)
 * @param {string|Date} timestamp - ISO timestamp from Supabase
 * @returns {Date} - Adjusted date object
 */
export function adjustSupabaseTime(timestamp) {
    if (!timestamp) return new Date();
    try {
        const date = new Date(timestamp);
        // Add 1 hour (3600000 milliseconds)
        return new Date(date.getTime() + 3600000);
    } catch (e) {
        console.warn("[TimeUtils] Invalid timestamp:", timestamp);
        return new Date();
    }
}

/**
 * Format time with 1-hour offset
 * @param {string|Date} timestamp - ISO timestamp
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time
 */
export function formatAdjustedTime(timestamp, options = {}) {
    try {
        const adjustedDate = adjustSupabaseTime(timestamp);
        const defaultOptions = { hour: "2-digit", minute: "2-digit" };
        return adjustedDate.toLocaleTimeString([], { ...defaultOptions, ...options });
    } catch (e) {
        console.warn("[TimeUtils] Format error:", e);
        return "";
    }
}

/**
 * Format date with 1-hour offset
 * @param {string|Date} timestamp - ISO timestamp
 * @returns {string} - Formatted date
 */
export function formatAdjustedDate(timestamp) {
    try {
        const adjustedDate = adjustSupabaseTime(timestamp);
        return adjustedDate.toLocaleDateString();
    } catch (e) {
        console.warn("[TimeUtils] Date format error:", e);
        return "";
    }
}

/**
 * Get relative time (now, 5m ago, 2h ago, etc) with 1-hour offset
 * @param {string|Date} timestamp - ISO timestamp
 * @returns {string} - Relative time string
 */
export function getRelativeTime(timestamp) {
    try {
        const adjustedDate = adjustSupabaseTime(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - adjustedDate) / (1000 * 60));

        if (diffMinutes < 1) return "now";
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
        return adjustedDate.toLocaleDateString();
    } catch (e) {
        console.warn("[TimeUtils] Relative time error:", e);
        return "unknown";
    }
}
