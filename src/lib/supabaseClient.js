// @ts-nocheck

import { createClient } from "@supabase/supabase-js";
import { get } from "svelte/store";
import { currentUserId } from "../store/authStore.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase environment variables");
}

console.log("[Supabase] ✅ Initialized");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Get current user ID from authStore
 */
export function getSupabaseUserId() {
    const userId = get(currentUserId);
    if (!userId) {
        console.warn("[Supabase] ⚠️ User ID not available");
        return null;
    }
    return userId;
}

/**
 * Subscribe to conversation realtime message updates (both INSERT and UPDATE)
 */
export async function subscribeToConversation(conversationId, onMessage) {
    if (!conversationId) throw new Error("Conversation ID required");

    console.log("[Supabase] 📡 Subscribing to messages:", conversationId.slice(0, 12));

    const channel = supabase.channel(`conversation:${conversationId}`);

    // Listen to INSERT events (new messages)
    channel.on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
            console.log("[Supabase] 💬 New message:", payload.new?.id?.slice(0, 8));
            const currentUserId = getSupabaseUserId();
            const enriched = {
                ...payload.new,
                role: payload.new.sender_id === currentUserId ? "user" : "receiver",
            };
            onMessage({ type: "INSERT", message: enriched });
        }
    );

    // Listen to UPDATE events (read receipts, edits)
    channel.on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
            console.log("[Supabase] 📝 Message updated:", payload.new?.id?.slice(0, 8));
            const currentUserId = getSupabaseUserId();
            const enriched = {
                ...payload.new,
                role: payload.new.sender_id === currentUserId ? "user" : "receiver",
            };
            onMessage({ type: "UPDATE", message: enriched });
        }
    );

    return new Promise((resolve, reject) => {
        channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("[Supabase] ✅ Message subscription active");
                resolve(channel);
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                reject(new Error(`Subscription failed: ${status}`));
            }
        });
    });
}

/**
 * Subscribe to conversations realtime updates
 */
export async function subscribeToConversations(userId, onUpdate) {
    if (!userId) throw new Error("User ID required");

    console.log("[Supabase] 📡 Subscribing to conversations for:", userId.slice(0, 8));

    const channel = supabase.channel(`conversations:${userId}`);

    channel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `user_id=eq.${userId}`,
        },
        (payload) => {
            console.log("[Supabase] 🔄 Conversation updated:", payload.eventType);
            onUpdate(payload);
        }
    );

    return new Promise((resolve, reject) => {
        channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("[Supabase] ✅ Conversation subscription active");
                resolve(channel);
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                reject(new Error(`Subscription failed: ${status}`));
            }
        });
    });
}

/**
 * Subscribe to user presence status updates
 */
export async function subscribeToUserPresence(userId, onPresenceChange) {
    if (!userId) throw new Error("User ID required");

    console.log("[Supabase] 📡 Subscribing to user presence:", userId.slice(0, 8));

    const channel = supabase.channel(`presence:${userId}`);

    channel.on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${userId}`,
        },
        (payload) => {
            console.log("[Supabase] 👤 Presence updated:", payload.new?.status);
            onPresenceChange(payload.new);
        }
    );

    return new Promise((resolve, reject) => {
        channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("[Supabase] ✅ Presence subscription active");
                resolve(channel);
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                reject(new Error(`Subscription failed: ${status}`));
            }
        });
    });
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeFromChannel(channel) {
    if (channel) {
        try {
            await supabase.removeChannel(channel);
            console.log("[Supabase] 🔌 Channel unsubscribed");
        } catch (error) {
            console.warn("[Supabase] ⚠️ Unsubscribe error:", error.message);
        }
    }
}

/**
 * Update user status (online/offline/typing)
 */
export async function updateUserStatus(userId, status) {
    if (!userId || !status) return;

    try {
        const { error } = await supabase
            .from("users")
            .update({ status, last_seen: new Date().toISOString() })
            .eq("id", userId);

        if (error) throw error;
        console.log("[Supabase] ✅ Status updated:", status);
    } catch (error) {
        console.warn("[Supabase] ⚠️ Status update error:", error.message);
    }
}