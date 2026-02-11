// @ts-nocheck
import { supabase } from "../lib/supabaseClient.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USER SERVICE - Direct Supabase Queries
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Search users by phone number (direct Supabase query)
 * @param {string} phoneNumber - Phone number to search
 * @returns {Promise<Object>} - User object or null
 */
export async function getUserByPhone(phoneNumber) {
    try {
        if (!phoneNumber || typeof phoneNumber !== "string") {
            throw new Error("Phone number is required");
        }

        const { data, error } = await supabase
            .from("users")
            .select(
                "id, phone_number, name, email, avatar_url, status, last_seen, created_at",
            )
            .eq("phone_number", phoneNumber.trim())
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows found (not an error)
            throw error;
        }

        if (!data) {
            console.log("[Supabase] User not found:", phoneNumber);
            return null;
        }

        console.log("[Supabase] ✅ Found user:", data.id);
        return data;
    } catch (error) {
        console.error("[Supabase] getUserByPhone error:", error.message);
        throw error;
    }
}

/**
 * Get user by ID (full profile)
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} - User object
 */
export async function getUserById(userId) {
    try {
        if (!userId || typeof userId !== "string") {
            throw new Error("User ID is required");
        }

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error("User not found");
        }

        console.log("[Supabase] ✅ Loaded user:", userId.slice(0, 8));
        return data;
    } catch (error) {
        console.error("[Supabase] getUserById error:", error.message);
        throw error;
    }
}

/**
 * Create new user in database
 * @param {Object} userData - { phone_number, name, email, avatar_url, status }
 * @returns {Promise<Object>} - Created user object
 */
export async function createUser(userData) {
    try {
        const { phone_number, name, email, avatar_url, status = "online" } =
            userData;

        if (!phone_number || typeof phone_number !== "string") {
            throw new Error("Phone number is required");
        }

        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    phone_number: phone_number.trim(),
                    name: name?.trim() || null,
                    email: email?.trim() || null,
                    avatar_url: avatar_url || null,
                    status,
                    is_active: true,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        console.log("[Supabase] ✅ User created:", data.id);
        return data;
    } catch (error) {
        console.error("[Supabase] createUser error:", error.message);
        throw error;
    }
}

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {Object} updates - { name, email, avatar_url, status }
 * @returns {Promise<Object>} - Updated user object
 */
export async function updateUserProfile(userId, updates) {
    try {
        if (!userId || typeof userId !== "string") {
            throw new Error("User ID is required");
        }

        const updatePayload = {
            updated_at: new Date().toISOString(),
            ...updates,
        };

        const { data, error } = await supabase
            .from("users")
            .update(updatePayload)
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;

        console.log("[Supabase] ✅ User updated:", userId.slice(0, 8));
        return data;
    } catch (error) {
        console.error("[Supabase] updateUserProfile error:", error.message);
        throw error;
    }
}

/**
 * Update user status (online/offline/typing)
 * @param {string} userId - User UUID
 * @param {string} status - Status string
 * @returns {Promise<Object>} - Updated user object
 */
export async function updateUserStatus(userId, status) {
    try {
        if (!userId || !status) {
            throw new Error("User ID and status are required");
        }

        const { data, error } = await supabase
            .from("users")
            .update({
                status,
                last_seen: new Date().toISOString(),
            })
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("[Supabase] updateUserStatus error:", error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONVERSATION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Get all conversations for user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} - Array of conversations with participant details
 */
export async function getUserConversations(userId) {
    try {
        if (!userId || typeof userId !== "string") {
            throw new Error("User ID is required");
        }

        const { data, error } = await supabase
            .from("conversations")
            .select(
                `
        id,
        user_id,
        participant_id,
        last_message_id,
        last_message_preview,
        last_message_at,
        unread_count,
        is_archived,
        created_at,
        updated_at
      `,
            )
            .eq("user_id", userId)
            .eq("is_archived", false)
            .order("last_message_at", { ascending: false });

        if (error) throw error;

        // Fetch participant details for each conversation
        const conversationsWithParticipants = await Promise.all(
            (data || []).map(async (conv) => {
                try {
                    const participant = await getUserById(conv.participant_id);
                    return {
                        ...conv,
                        participant_name: participant.name,
                        participant_phone: participant.phone_number,
                        participant_avatar: participant.avatar_url,
                        participant_status: participant.status,
                    };
                } catch (err) {
                    console.warn("[Supabase] Failed to fetch participant:", err.message);
                    return conv;
                }
            }),
        );

        console.log("[Supabase] ✅ Loaded", conversationsWithParticipants.length, "conversations");
        return conversationsWithParticipants;
    } catch (error) {
        console.error("[Supabase] getUserConversations error:", error.message);
        throw error;
    }
}

/**
 * Get or create conversation with another user (TWO-SIDED)
 * Creates conversations for BOTH users (A→B and B→A)
 * @param {string} userId - Current user UUID
 * @param {string} participantId - Participant UUID
 * @returns {Promise<Object>} - User's conversation object
 */
export async function getOrCreateConversation(userId, participantId) {
    try {
        if (!userId || !participantId) {
            throw new Error("User ID and participant ID are required");
        }

        if (userId === participantId) {
            throw new Error("Cannot create conversation with yourself");
        }

        // Check if USER's conversation exists (user_id → participant_id)
        const { data: existingConv, error: fetchError } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", userId)
            .eq("participant_id", participantId)
            .maybeSingle();

        if (fetchError) {
            console.warn("[Supabase] Fetch error (non-critical):", fetchError.message);
        }

        if (existingConv) {
            console.log("[Supabase] ✅ User conversation exists:", existingConv.id.slice(0, 8));
            return existingConv;
        }

        // Create TWO-SIDED conversations
        console.log("[Supabase] 🔄 Creating bidirectional conversations...");

        const now = new Date().toISOString();

        // Conversation 1: Current user→ participant
        const convData1 = {
            user_id: userId,
            participant_id: participantId,
            last_message_at: now,
            created_at: now,
        };

        // Conversation 2: Participant→ current user (reverse perspective)
        const convData2 = {
            user_id: participantId,
            participant_id: userId,
            last_message_at: now,
            created_at: now,
        };

        // Insert both conversations
        const { data: insertedConvs, error: insertError } = await supabase
            .from("conversations")
            .insert([convData1, convData2])
            .select();

        if (insertError) throw insertError;

        if (!insertedConvs || insertedConvs.length === 0) {
            throw new Error("Failed to create conversations");
        }

        // Return the user's conversation (first one)
        const userConv = insertedConvs.find(c => c.user_id === userId) || insertedConvs[0];

        console.log("[Supabase] ✅ Bidirectional conversations created:", {
            user: userConv.id.slice(0, 8),
            participant: insertedConvs.find(c => c.user_id === participantId)?.id.slice(0, 8),
        });

        return userConv;
    } catch (error) {
        console.error("[Supabase] getOrCreateConversation error:", error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MESSAGE SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Get messages in conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<Array>} - Array of messages
 */
export async function getConversationMessages(conversationId) {
    try {
        if (!conversationId || typeof conversationId !== "string") {
            throw new Error("Conversation ID is required");
        }

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;

        console.log("[Supabase] ✅ Loaded", data?.length || 0, "messages");
        return data || [];
    } catch (error) {
        console.error("[Supabase] getConversationMessages error:", error.message);
        throw error;
    }
}

/**
 * Send message
 * @param {Object} messageData - { sender_id, receiver_id, conversation_id, content }
 * @returns {Promise<Object>} - Created message object
 */
export async function sendMessageToUser(messageData) {
    try {
        const {
            sender_id,
            receiver_id,
            conversation_id,
            content,
            message_type = "text",
        } = messageData;

        if (!sender_id || !receiver_id || !conversation_id || !content) {
            throw new Error("Missing required fields: sender_id, receiver_id, conversation_id, content");
        }

        const { data, error } = await supabase
            .from("messages")
            .insert([
                {
                    sender_id,
                    receiver_id,
                    conversation_id,
                    content: content.trim(),
                    message_type,
                    is_read: false,
                    created_at: new Date().toISOString(),
                },
            ])
            .select()
            .single();

        if (error) throw error;

        console.log("[Supabase] ✅ Message sent:", data.id.slice(0, 8));
        return data;
    } catch (error) {
        console.error("[Supabase] sendMessageToUser error:", error.message);
        throw error;
    }
}

/**
 * Mark messages as read
 * @param {Array<string>} messageIds - Message UUIDs
 * @returns {Promise<Object>}
 */
export async function markMessagesRead(messageIds) {
    try {
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return { success: true };
        }

        const { error } = await supabase
            .from("messages")
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .in("id", messageIds);

        if (error) throw error;

        console.log("[Supabase] ✅ Marked", messageIds.length, "messages as read");
        return { success: true };
    } catch (error) {
        console.error("[Supabase] markMessagesRead error:", error.message);
        return { success: false };
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TYPING INDICATORS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Set typing indicator
 * @param {string} userId - User UUID
 * @param {string} conversationId - Conversation UUID
 * @param {boolean} isTyping - Typing status
 * @returns {Promise<Object>}
 */
export async function setTypingIndicator(userId, conversationId, isTyping) {
    try {
        if (!userId || !conversationId) {
            throw new Error("User ID and conversation ID are required");
        }

        if (isTyping) {
            // Insert or update typing indicator
            const { error } = await supabase
                .from("typing_indicators")
                .upsert(
                    [
                        {
                            user_id: userId,
                            conversation_id: conversationId,
                            is_typing: true,
                            created_at: new Date().toISOString(),
                        },
                    ],
                    { onConflict: "user_id,conversation_id" },
                );

            if (error) throw error;
            console.log("[Supabase] 📝 User typing");
        } else {
            // Delete typing indicator
            const { error } = await supabase
                .from("typing_indicators")
                .delete()
                .eq("user_id", userId)
                .eq("conversation_id", conversationId);

            if (error && error.code !== "PGRST116") throw error;
            console.log("[Supabase] ✅ Typing stopped");
        }

        return { success: true };
    } catch (error) {
        console.error("[Supabase] setTypingIndicator error:", error.message);
        return { success: false };
    }
}

/**
 * Subscribe to typing indicators
 * @param {string} conversationId - Conversation UUID
 * @param {Function} onTyping - Callback function
 * @returns {Promise<Object>} - Channel subscription
 */
export async function subscribeToTypingIndicators(conversationId, onTyping) {
    try {
        if (!conversationId) {
            throw new Error("Conversation ID is required");
        }

        console.log("[Supabase] 📡 Subscribing to typing indicators");

        const channel = supabase.channel(`typing:${conversationId}`);

        channel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "typing_indicators",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                console.log("[Supabase] Typing event:", payload.eventType);
                onTyping(payload);
            },
        );

        return new Promise((resolve, reject) => {
            channel.subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[Supabase] ✅ Typing subscription active");
                    resolve(channel);
                } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    reject(new Error(`Subscription failed: ${status}`));
                }
            });
        });
    } catch (error) {
        console.error("[Supabase] subscribeToTypingIndicators error:", error.message);
        throw error;
    }
}
