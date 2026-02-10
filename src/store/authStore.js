// @ts-nocheck

import { writable, derived } from "svelte/store";
import { supabase } from "../lib/supabaseClient.js";

const INITIAL_STATE = {
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    user: null,
    error: null,
    profileComplete: false,
};

export const authState = writable(INITIAL_STATE);

// Derived stores for reactive component binding
export const isAuthenticated = derived(authState, (s) => s.isAuthenticated);
export const isLoading = derived(authState, (s) => s.isLoading);
export const isInitializing = derived(authState, (s) => s.isInitializing);
export const currentUser = derived(authState, (s) => s.user);
export const currentUserId = derived(authState, (s) => s.user?.id);
export const authError = derived(authState, (s) => s.error);
export const isProfileComplete = derived(authState, (s) => s.profileComplete);

/**
 * Get current user ID synchronously
 */
export function getCurrentUserIdSync() {
    let userId = null;
    const unsubscribe = currentUserId.subscribe((id) => {
        userId = id;
    });
    unsubscribe();
    return userId;
}

/**
 * Simple phone lookup (no password, no auth)
 * Check if phone exists in users table
 * If exists: return user
 * If not: return null to trigger create-profile
 */
export async function checkPhoneAndLogin(phoneNumber) {
    try {
        authState.update((s) => ({ ...s, isLoading: true, error: null }));

        console.log("[Auth] Checking phone:", phoneNumber);

        // Check if user exists
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("phone_number", phoneNumber)
            .maybeSingle();

        if (error) throw error;

        if (user) {
            // User exists - log them in
            console.log("[Auth] ✅ User found:", user.id.slice(0, 8));
            authState.update((s) => ({
                ...s,
                isAuthenticated: true,
                user,
                profileComplete: !!user?.name,
            }));
            return { isNewUser: false, user };
        } else {
            // New user - create placeholder, go to profile
            console.log("[Auth] ℹ️ New user, phone:", phoneNumber);
            authState.update((s) => ({
                ...s,
                isAuthenticated: true,
                user: { phone_number: phoneNumber, id: null },
                profileComplete: false,
            }));
            return { isNewUser: true, phoneNumber };
        }
    } catch (error) {
        console.error("[Auth] ❌ Phone check error:", error.message);
        authState.update((s) => ({
            ...s,
            error: error.message,
            isAuthenticated: false,
        }));
        throw error;
    } finally {
        authState.update((s) => ({ ...s, isLoading: false }));
    }
}

/**
 * Initialize auth on app load (check localStorage for user)
 */
export async function initialize() {
    try {
        authState.update((s) => ({ ...s, isInitializing: true }));

        console.log("[Auth] Initializing...");

        // Check localStorage for cached user
        const cachedUser = localStorage.getItem("user_cache");
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            console.log("[Auth] ✅ User restored from cache:", user.id?.slice(0, 8));
            authState.update((s) => ({
                ...s,
                isAuthenticated: true,
                user,
                profileComplete: !!user?.name,
                isInitializing: false,
            }));
            return {
                valid: true,
                user,
                profileComplete: !!user?.name,
            };
        }

        console.log("[Auth] No cached user");
        authState.update((s) => ({ ...s, isInitializing: false }));
        return { valid: false };
    } catch (error) {
        console.error("[Auth] ❌ Init error:", error.message);
        authState.update((s) => ({
            ...s,
            isInitializing: false,
            error: error.message,
        }));
        return { valid: false };
    }
}

/**
 * Logout
 */
export async function logout() {
    try {
        authState.update((s) => ({ ...s, isLoading: true }));

        console.log("[Auth] Logging out");

        // Attempt Supabase sign-out if used; ignore errors if not configured
        try {
            await supabase?.auth?.signOut?.();
        } catch (e) {
            console.warn("[Auth] Supabase signOut skipped or failed:", e?.message || e);
        }

        // Clear local cached user used by our no-auth flow
        try {
            localStorage.removeItem("user_cache");
            localStorage.removeItem("auth_token");
        } catch (e) {
            console.warn("[Auth] localStorage cleanup failed:", e);
        }

        authState.set(INITIAL_STATE);

        console.log("[Auth] ✅ Logged out");

        // Reload the page to return to the main login view (non-routing flow)
        try {
            location.reload();
        } catch (e) {
            console.warn("[Auth] Could not reload page automatically:", e);
        }
    } catch (error) {
        console.error("[Auth] ❌ Logout error:", error.message);
    } finally {
        authState.update((s) => ({ ...s, isLoading: false }));
    }
}

/**
 * Create new user profile or update existing
 */
export async function updateProfile(updates) {
    try {
        authState.update((s) => ({ ...s, isLoading: true }));

        // Get current auth state
        let currentUserState = null;
        const unsubscribe = authState.subscribe((s) => {
            currentUserState = s;
        });
        unsubscribe();

        const userId = currentUserState?.user?.id;
        const phone = currentUserState?.user?.phone_number;

        if (!userId && !phone) {
            throw new Error("No user or phone found");
        }

        let finalUserId = userId;

        if (!userId && phone) {
            // New user - create them first
            console.log("[Auth] Creating new user:", phone);
            finalUserId = crypto.randomUUID();
            const { error: insertError } = await supabase
                .from("users")
                .insert({
                    id: finalUserId,
                    phone_number: phone,
                    status: "online",
                    ...updates,
                });

            if (insertError) throw insertError;
        } else if (userId) {
            // Existing user - update
            console.log("[Auth] Updating profile:", userId.slice(0, 8));
            const { error: updateError } = await supabase
                .from("users")
                .update(updates)
                .eq("id", userId);

            if (updateError) throw updateError;
        }

        // Fetch updated profile
        const { data: profile, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", finalUserId)
            .single();

        if (fetchError) throw fetchError;

        // Cache user in localStorage
        localStorage.setItem("user_cache", JSON.stringify(profile));

        authState.update((s) => ({
            ...s,
            user: profile,
            profileComplete: !!profile?.name,
        }));

        console.log("[Auth] ✅ Profile saved");

        return profile;
    } catch (error) {
        console.error("[Auth] ❌ Profile error:", error.message);
        authState.update((s) => ({
            ...s,
            error: error.message,
        }));
        throw error;
    } finally {
        authState.update((s) => ({ ...s, isLoading: false }));
    }
}