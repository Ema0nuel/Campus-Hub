// @ts-nocheck

import { supabase, getSupabaseUserId } from "./supabaseClient.js";
import { get } from "svelte/store";
import { currentUserId } from "../store/authStore.js";

/**
 * Get or create conversation between two users
 */
export async function getOrCreateConversation(participantId, userId = null) {
    const currUserId = userId || getSupabaseUserId();
    if (!currUserId || !participantId) {
        throw new Error("User IDs required");
    }

    try {
        // Check if conversation exists from either perspective
        const { data: existing, error: queryError } = await supabase
            .from("conversations")
            .select("id, user_id, participant_id")
            .or(
                `and(user_id.eq.${currUserId},participant_id.eq.${participantId}),and(user_id.eq.${participantId},participant_id.eq.${currUserId})`
            );

        if (queryError) throw queryError;

        // Find from current user's perspective
        const userConv = existing?.find(
            (c) => c.user_id === currUserId && c.participant_id === participantId
        );

        if (userConv) {
            console.log("[MessageService] 🔄 Conversation exists:", userConv.id.slice(0, 8));
            return userConv.id;
        }

        // Create new conversation from current user's perspective
        console.log("[MessageService] ✨ Creating conversation");
        const { data: newConv, error: createError } = await supabase
            .from("conversations")
            .insert({
                user_id: currUserId,
                participant_id: participantId,
                last_message_preview: "Conversation started",
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (createError) throw createError;

        console.log("[MessageService] ✅ Conversation created:", newConv.id.slice(0, 8));
        return newConv.id;
    } catch (error) {
        console.error("[MessageService] ❌ Conversation error:", error.message);
        throw error;
    }
}

/**
 * Fetch all messages from a conversation (unified from both perspectives)
 */
export async function getConversationMessages(conversationId, userId = null) {
    if (!conversationId) throw new Error("Conversation ID required");

    const currUserId = userId || getSupabaseUserId();
    if (!currUserId) throw new Error("User not authenticated");

    try {
        console.log("[MessageService] 📥 Fetching:", conversationId.slice(0, 12));

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Enrich with role and read status
        const enriched = (data || []).map((msg) => ({
            ...msg,
            role: msg.sender_id === currUserId ? "user" : "receiver",
        }));

        console.log("[MessageService] ✅ Fetched", enriched.length, "messages");
        return enriched;
    } catch (error) {
        console.error("[MessageService] ❌", error.message);
        throw error;
    }
}

/**
 * Send message via Supabase
 */
export async function sendMessageDirect(conversationId, receiverId, content, userId = null) {
    const senderId = userId || getSupabaseUserId();

    if (!conversationId || !receiverId || !content?.trim()) {
        throw new Error("All fields required");
    }

    if (!senderId) {
        throw new Error("User not authenticated");
    }

    try {
        console.log("[MessageService] 📤 Sending message");

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                conversation_id: conversationId,
                content: content.trim(),
                message_type: "text",
                is_read: false,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        console.log("[MessageService] ✅ Sent:", data.id.slice(0, 8));
        return { ...data, role: "user" };
    } catch (error) {
        console.error("[MessageService] ❌", error.message);
        throw error;
    }
}

/**
 * Mark messages as read in a conversation
 */
export async function markConversationAsRead(conversationId, currentUserId) {
    if (!conversationId || !currentUserId) return;

    try {
        await supabase
            .from("messages")
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq("conversation_id", conversationId)
            .eq("receiver_id", currentUserId)
            .eq("is_read", false);

        console.log("[MessageService] ✓ Marked read:", conversationId.slice(0, 12));
    } catch (error) {
        console.warn("[MessageService] ⚠️", error.message);
    }
}

/**
 * Get both conversation IDs for a participant
 */
export async function getBothConversationIdsFromSupabase(participantId, userId = null) {
    if (!participantId) throw new Error("Participant ID required");

    const currUserId = userId || getSupabaseUserId();
    if (!currUserId) throw new Error("User not authenticated");

    try {
        console.log("[MessageService] 🔍 Querying conversations");

        const { data, error } = await supabase
            .from("conversations")
            .select("id, user_id, participant_id")
            .or(
                `and(user_id.eq.${currUserId},participant_id.eq.${participantId}),and(user_id.eq.${participantId},participant_id.eq.${currUserId})`
            );

        if (error) throw error;

        const userConv = data?.find(
            (c) => c.user_id === currUserId && c.participant_id === participantId
        );
        const participantConv = data?.find(
            (c) => c.user_id === participantId && c.participant_id === currUserId
        );

        return {
            userConversationId: userConv?.id || null,
            participantConversationId: participantConv?.id || null,
        };
    } catch (error) {
        console.error("[MessageService] ❌", error.message);
        throw error;
    }
}

/**
 * Fetch unified messages from both conversation perspectives
 */
export async function getUnifiedMessagesFromSupabase(participantId, userId = null) {
    if (!participantId) throw new Error("Participant ID required");

    try {
        const currUserId = userId || getSupabaseUserId();
        const { userConversationId, participantConversationId } =
            await getBothConversationIdsFromSupabase(participantId, currUserId);

        const allMessages = [];

        if (userConversationId) {
            const userMsgs = await getConversationMessages(userConversationId, currUserId);
            allMessages.push(...userMsgs);
        }

        if (participantConversationId) {
            const participantMsgs = await getConversationMessages(participantConversationId, currUserId);
            allMessages.push(...participantMsgs);
        }

        // Deduplicate by ID
        const uniqueMsgs = Array.from(
            new Map(allMessages.map((m) => [m.id, m])).values()
        );

        // Sort by timestamp
        uniqueMsgs.sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        console.log("[MessageService] ✅ Total unified messages:", uniqueMsgs.length);
        return uniqueMsgs;
    } catch (error) {
        console.error("[MessageService] ❌", error.message);
        throw error;
    }
}

/**
 * Set typing indicator
 */
export async function setTypingIndicator(conversationId, isTyping, userId = null) {
    if (!conversationId) return;

    const currUserId = userId || getSupabaseUserId();
    if (!currUserId) return;

    try {
        if (isTyping) {
            await supabase.from("typing_indicators").upsert(
                {
                    user_id: currUserId,
                    conversation_id: conversationId,
                    is_typing: true,
                    created_at: new Date().toISOString(),
                },
                { onConflict: "user_id, conversation_id" }
            );
            console.log("[MessageService] ✏️ Typing...");
        } else {
            await supabase
                .from("typing_indicators")
                .delete()
                .eq("user_id", currUserId)
                .eq("conversation_id", conversationId);
            console.log("[MessageService] 🤐 Stopped typing");
        }
    } catch (error) {
        console.warn("[MessageService] ⚠️ Typing error:", error.message);
    }
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTypingIndicators(conversationId, onTypingChange) {
    if (!conversationId) return null;

    console.log("[MessageService] 📡 Subscribing to typing indicators");

    const channel = supabase.channel(`typing:${conversationId}`);

    channel
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "typing_indicators",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                console.log("[MessageService] 🔔 Typing event:", payload.eventType);
                onTypingChange(payload);
            }
        )
        .subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("[MessageService] ✅ Typing subscription active");
            }
        });

    return channel;
}