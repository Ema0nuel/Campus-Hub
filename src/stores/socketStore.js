import { writable } from "svelte/store";
import {
    initSocket,
    joinConversation,
    leaveConversation,
    emitTyping,
    stopTyping,
    markAsRead as socketMarkAsRead,
    on,
    off,
} from "../lib/socketClient.js";

// Core stores
export const messages = writable({});
export const typingUsers = writable(new Set());
export const onlineUsers = writable(new Set());
export const connectionStatus = writable("disconnected");
export const currentConversationId = writable(null);

/**
 * Initialize socket and setup event listeners
 */
export const initializeSocket = async (token, serverUrl) => {
    try {
        const result = await initSocket(token, serverUrl);
        connectionStatus.set("connected");
        setupSocketListeners();
        return result;
    } catch (error) {
        connectionStatus.set("error");
        console.error("[Store] Socket init failed:", error);
        throw error;
    }
};

/**
 * Setup all socket event listeners
 * Matches backend schema: is_read, created_at, sender_id, receiver_id
 */
const setupSocketListeners = () => {
    // ─────────────────────────────────────────
    // MESSAGE EVENTS
    // ─────────────────────────────────────────

    // New message received from participant
    on("message:received", (message) => {
        console.log("[Store] Message received from participant:", message.id);

        messages.update((msgs) => {
            const convId = message.conversation_id;
            if (!msgs[convId]) msgs[convId] = [];

            // Avoid duplicates
            if (!msgs[convId].find((m) => m.id === message.id)) {
                // Normalize: is_read → read
                msgs[convId].push({
                    ...message,
                    read: message.is_read || false,
                });
            }
            return msgs;
        });
    });

    // Message read receipt from participant
    on("message:read", (data) => {
        console.log("[Store] Message read receipt:", data.message_ids);

        messages.update((msgs) => {
            const convMessages = msgs[data.conversation_id] || [];
            convMessages.forEach((msg) => {
                if (data.message_ids.includes(msg.id)) {
                    msg.read = true;
                }
            });
            return msgs;
        });
    });

    // ─────────────────────────────────────────
    // TYPING EVENTS
    // ─────────────────────────────────────────

    // Participant started typing
    on("typing:start", (data) => {
        console.log("[Store] Participant typing:", data.user_id);

        typingUsers.update((users) => {
            users.add(data.user_id);
            return users;
        });
    });

    // Participant stopped typing
    on("typing:stop", (data) => {
        console.log("[Store] Participant stopped typing:", data.user_id);

        typingUsers.update((users) => {
            users.delete(data.user_id);
            return users;
        });
    });

    // ─────────────────────────────────────────
    // PRESENCE EVENTS
    // ─────────────────────────────────────────

    // Participant came online
    on("user:online", (data) => {
        console.log("[Store] User online:", data.user_id);

        onlineUsers.update((users) => {
            users.add(data.user_id);
            return users;
        });
    });

    // Participant went offline
    on("user:offline", (data) => {
        console.log("[Store] User offline:", data.user_id);

        onlineUsers.update((users) => {
            users.delete(data.user_id);
            return users;
        });
    });

    // Participant is typing (status update)
    on("user:typing", (data) => {
        console.log("[Store] User status typing:", data.user_id);

        // Could update user model if needed
    });

    // ─────────────────────────────────────────
    // CONNECTION EVENTS
    // ─────────────────────────────────────────

    on("connect", () => {
        console.log("[Store] Socket connected");
        connectionStatus.set("connected");
    });

    on("disconnect", (reason) => {
        console.log("[Store] Socket disconnected:", reason);
        connectionStatus.set("disconnected");
    });

    on("reconnect", () => {
        console.log("[Store] Socket reconnected");
        connectionStatus.set("connected");
    });

    on("error", (error) => {
        console.error("[Store] Socket error:", error);
        connectionStatus.set("error");
    });
};

/**
 * Join conversation socket room
 */
export const enterConversation = async (conversationId) => {
    try {
        await joinConversation(conversationId);
        currentConversationId.set(conversationId);
        console.log("[Store] Entered conversation:", conversationId);
    } catch (error) {
        console.error("[Store] Failed to enter conversation:", error);
        throw error;
    }
};

/**
 * Leave conversation socket room
 */
export const exitConversation = async (conversationId) => {
    try {
        await leaveConversation(conversationId);
        currentConversationId.set(null);
        console.log("[Store] Left conversation:", conversationId);
    } catch (error) {
        console.error("[Store] Failed to leave conversation:", error);
        throw error;
    }
};

/**
 * Emit typing start event to participants
 */
export const startTyping = (conversationId, userId) => {
    if (!conversationId || !userId) {
        console.warn("[Store] Cannot start typing: missing IDs");
        return;
    }
    emitTyping(conversationId, userId);
};

/**
 * Emit typing stop event to participants
 */
export const endTyping = (conversationId, userId) => {
    if (!conversationId || !userId) {
        console.warn("[Store] Cannot stop typing: missing IDs");
        return;
    }
    stopTyping(conversationId, userId);
};

/**
 * Mark messages as read (tell participants)
 */
export const markMessagesRead = async (conversationId, messageIds) => {
    try {
        if (!conversationId || !messageIds || messageIds.length === 0) {
            console.warn("[Store] Cannot mark as read: missing data");
            return;
        }

        console.log("[Store] Marking as read:", messageIds);
        await socketMarkAsRead(conversationId, messageIds);
    } catch (error) {
        console.error("[Store] Failed to mark as read:", error.message);
    }
};

/**
 * Load messages into store from API
 */
export const loadConversationMessages = (conversationId, initialMessages = []) => {
    messages.update((msgs) => {
        msgs[conversationId] = initialMessages.map((msg) => ({
            ...msg,
            read: msg.is_read !== undefined ? msg.is_read : msg.read || false,
        }));
        return msgs;
    });

    // ✅ DEBUG: Log immediately
    messages.subscribe((allMsgs) => {
        console.log(
            `[STORE] Loaded ${allMsgs[conversationId]?.length || 0} messages:`,
            allMsgs[conversationId]
        );
    })();

    console.log("[Store] Loaded", initialMessages.length, "messages for:", conversationId);
};

/**
 * Clear all data
 */
export const clearAllMessages = () => {
    messages.set({});
    typingUsers.set(new Set());
    onlineUsers.set(new Set());
    connectionStatus.set("disconnected");
};