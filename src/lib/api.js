// @ts-nocheck
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('🔗 API initialized -', { API_BASE_URL, SOCKET_URL });

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORE API HANDLER
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Core fetch wrapper with token, error handling, and 401 logout
 * @param {string} endpoint - API endpoint (e.g., '/auth/register')
 * @param {object} options - Fetch options (method, body, headers)
 * @returns {object} - Response data with success, user, conversation, etc.
 * @throws {Error} - If request fails or response.success is false
 */
export async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add Bearer token if available (for auth-required endpoints)
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const method = options.method || 'GET';
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            method,
            headers,
        });

        const data = await response.json();

        // Handle HTTP errors
        if (!response.ok) {
            console.error(`❌ [${method} ${endpoint}] HTTP ${response.status}`, data);

            // 401 = Invalid/expired token → logout
            if (response.status === 401) {
                console.warn('⚠️ Token invalid, logging out...');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('phone_number');
                // Redirect to login (works in browser)
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
                throw new Error('Unauthorized. Please login again.');
            }

            const errorMessage = data.message || data.error || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        // Check backend success flag
        if (data.success !== true) {
            console.error(`❌ [${method} ${endpoint}] Backend error`, data);
            throw new Error(data.message || data.error || 'Unknown error');
        }

        console.log(`✅ [${method} ${endpoint}]`);
        return data;
    } catch (error) {
        console.error(`❌ API Call Failed [${method} ${endpoint}]:`, error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTH ENDPOINTS (1-4)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 1. POST /api/auth/register
 * Register/login with phone number
 * @param {string} phone_number - Phone number with country code (e.g., '+11234567890')
 * @returns {object} - { token, user }
 */
export async function registerWithPhone(phone_number) {
    // Validate input
    if (!phone_number || typeof phone_number !== 'string') {
        throw new Error('Phone number must be a non-empty string');
    }

    const trimmedPhone = phone_number.trim();
    if (trimmedPhone.length < 10) {
        throw new Error('Phone number must be at least 10 digits');
    }

    const payload = { phone_number: trimmedPhone };

    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Validate response structure
        const { token, user } = response;
        if (!token || !user || !user.id) {
            throw new Error('Invalid response: missing token or user data');
        }

        // Save to localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('phone_number', trimmedPhone);

        console.log('✅ Login successful:', { userId: user.id, isNewUser: !user.name });

        return { token, user };
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        throw error;
    }
}

/**
 * 2. GET /api/auth/validate
 * Validate token validity with backend
 * @returns {boolean} - True if token valid, false otherwise
 */
export async function validateToken() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        console.warn('⚠️ No token found in localStorage');
        return false;
    }

    try {
        const response = await apiCall('/auth/validate', {
            method: 'GET',
        });

        if (response.success !== true) {
            throw new Error('Token validation failed');
        }

        console.log('✅ Token is valid');
        return true;
    } catch (error) {
        console.error('❌ Token validation error:', error.message);
        // Clear invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('phone_number');
        return false;
    }
}

/**
 * 3. GET /api/auth/profile/{userId}
 * Fetch user profile by ID
 * @param {string} userId - User UUID from localStorage
 * @returns {object} - User object { id, name, email, avatar_url, phone_number, ... }
 */
export async function getUserProfile(userId) {
    // Validate input
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be a non-empty string');
    }

    try {
        const response = await apiCall(`/auth/profile/${userId}`, {
            method: 'GET',
        });

        const { user } = response;

        // Validate response
        if (!user || !user.id) {
            throw new Error('No user data in response');
        }

        console.log(`✅ Profile loaded for user ${user.id}`);
        return user;
    } catch (error) {
        console.error(`❌ Failed to load profile for ${userId}:`, error.message);
        throw error;
    }
}

/**
 * 4. PUT /api/auth/profile
 * Update user profile (name, email, avatar)
 * @param {object} profileData - { name, email, avatar_url }
 * @returns {object} - Updated user object
 */
export async function updateUserProfile(profileData) {
    // Validate input
    if (!profileData || typeof profileData !== 'object') {
        throw new Error('Profile data must be an object');
    }

    const { name, email, avatar_url } = profileData;

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new Error('Name is required and must be a non-empty string');
    }

    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Email is required and must be valid');
    }

    const payload = {
        name: name.trim(),
        email: email.trim(),
        avatar_url: avatar_url ? avatar_url.trim() : null,
    };

    try {
        const response = await apiCall('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        const { user } = response;

        if (!user || !user.id) {
            throw new Error('Invalid response: missing user data');
        }

        console.log('✅ Profile updated:', { userId: user.id, name: user.name });
        return user;
    } catch (error) {
        console.error('❌ Profile update failed:', error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONVERSATION ENDPOINTS (5-6)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 5. GET /api/conversations
 * Fetch all conversations for current user
 * @returns {array} - Array of conversation objects
 */
export async function getConversations() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/conversations`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        // Validate and normalize the response
        if (!Array.isArray(data.conversations)) {
            console.error("[API] Invalid response structure:", data);
            throw new Error("Expected conversations array in response");
        }

        return data.conversations;
    } catch (error) {
        console.error("[API] getConversations failed:", error);
        throw error;
    }
}

/**
 * 6. POST /api/conversations
 * Create new conversation with another user
 * @param {string} participant_id - UUID of user to chat with
 * @returns {object} - Conversation object { id, participant, ... }
 */
export async function createConversation(participant_id) {
    // Validate input
    if (!participant_id || typeof participant_id !== 'string') {
        throw new Error('Participant ID is required');
    }

    const payload = { participant_id };

    try {
        const response = await apiCall('/conversations', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const { conversation } = response;

        if (!conversation || !conversation.id) {
            throw new Error('Invalid conversation response');
        }

        console.log(`✅ Conversation created: ${conversation.id}`);
        return conversation;
    } catch (error) {
        console.error('❌ Failed to create conversation:', error.message);
        throw error;
    }
}

/**
 * DELETE /api/conversations/{conversationId}
 * Delete entire conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {object} - { success: true }
 */
export async function deleteConversation(conversationId) {
    if (!conversationId || typeof conversationId !== 'string') {
        throw new Error('Conversation ID is required');
    }

    try {
        const response = await apiCall(`/conversations/${conversationId}`, {
            method: 'DELETE',
        });

        console.log(`✅ Conversation deleted: ${conversationId}`);
        return response;
    } catch (error) {
        console.error('❌ Failed to delete conversation:', error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MESSAGE ENDPOINTS (7-9)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 7. GET /api/messages/{conversationId}
 * Fetch all messages in a conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {array} - Array of message objects
 */
export async function getMessages(conversationId) {
    // Validate input
    if (!conversationId || typeof conversationId !== 'string') {
        throw new Error('Conversation ID is required');
    }

    try {
        const response = await apiCall(`/messages/${conversationId}`, {
            method: 'GET',
        });

        const { messages } = response;

        // Validate response
        if (!Array.isArray(messages)) {
            console.warn('⚠️ Invalid messages response, defaulting to empty array');
            return [];
        }

        console.log(`✅ Loaded ${messages.length} messages from ${conversationId}`);
        return messages;
    } catch (error) {
        console.error(`❌ Failed to load messages for ${conversationId}:`, error.message);
        throw error;
    }
}

/**
 * 8. POST /api/messages/send
 * Send message to another user
 * @param {string} conversationId - Conversation UUID
 * @param {string} receiverId - Receiver user UUID
 * @param {string} content - Message text (non-empty)
 * @returns {object} - Message object { id, content, created_at, ... }
 */
export async function sendMessage(conversationId, receiverId, content) {
    if (!conversationId || !conversationId.trim()) {
        throw new Error('Conversation ID is required');
    }
    if (!receiverId || !receiverId.trim()) {
        throw new Error('Receiver ID is required');
    }
    if (!content || !content.trim()) {
        throw new Error('Message content is required');
    }

    try {
        const response = await apiCall('/messages/send', {
            method: 'POST',
            body: JSON.stringify({
                conversation_id: conversationId, // Match backend snake_case
                receiver_id: receiverId,         // Match backend snake_case
                content: content.trim(),
            }),
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to send message');
        }

        return response.message || response.data;
    } catch (error) {
        console.error('[API] sendMessage error:', error);
        throw error;
    }
}

/**
 * 9. PUT /api/messages/read
 * Mark messages as read
 * @param {array} messageIds - Array of message UUIDs
 * @returns {object} - { success: true/false }
 */
export async function markMessagesAsRead(messageIds) {
    // Early return if empty
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return { success: true };
    }

    // Validate array contains strings
    if (!messageIds.every((id) => typeof id === 'string')) {
        console.warn('⚠️ Invalid message IDs, skipping mark as read');
        return { success: false };
    }

    const payload = { message_ids: messageIds };

    try {
        const response = await apiCall('/messages/read', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        console.log(`✅ Marked ${messageIds.length} messages as read`);
        return { success: response.success === true };
    } catch (error) {
        console.error('⚠️ Failed to mark messages as read (non-critical):', error.message);
        // Non-critical error, don't throw
        return { success: false };
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEARCH ENDPOINTS (Optional)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Search user by phone number
 * @param {string} phone_number - Phone number to search
 * @returns {object} - User object or null
 */
export async function searchUserByPhone(phone_number) {
    if (!phone_number || typeof phone_number !== 'string') {
        throw new Error('Phone number is required');
    }

    try {
        const encoded = encodeURIComponent(phone_number.trim());
        const response = await apiCall(`/users/search?phone_number=${encoded}`, {
            method: 'GET',
        });

        const { user } = response;

        if (!user) {
            console.log(`ℹ️ User not found: ${phone_number}`);
            return null;
        }

        console.log(`✅ Found user: ${user.name || user.phone_number}`);
        return user;
    } catch (error) {
        console.error('❌ User search failed:', error.message);
        throw error;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    return !!(token && userId);
}

/**
 * Get current user ID from localStorage
 * @returns {string|null}
 */
export function getCurrentUserId() {
    return localStorage.getItem('user_id');
}

/**
 * Get current auth token
 * @returns {string|null}
 */
export function getAuthToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('phone_number');
    console.log('✅ Auth cleared');
}

/**
 * Check if user profile is complete
 * @param {object} user - User object
 * @returns {boolean} - True if name, email, avatar_url all exist
 */
export function isProfileComplete(user) {
    if (!user) return false;
    return !!(user.name && user.email && user.avatar_url);
}

/**
 * Get all conversation IDs involving current user + participant
 * Handles dual-conversation model where each user creates their own conv_id
 * 
 * @param {string} participantId - The other user's ID
 * @returns {array} - Array of conversation IDs that include both users
 */
export async function getConversationIdsByParticipant(participantId) {
    if (!participantId || typeof participantId !== 'string') {
        throw new Error('Participant ID is required');
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        throw new Error('Current user ID not found');
    }

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
            `${API_BASE_URL}/conversations?participant_id=${encodeURIComponent(participantId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const convList = Array.isArray(data.conversations) ? data.conversations : data;

        // Filter conversations where BOTH users are involved
        // Logic: 
        // - (receiver_id = participant AND sender_id = current) = User's conversation
        // - (sender_id = participant AND receiver_id = current) = Participant's conversation
        const relevantConvIds = convList
            .filter(conv => {
                const isUserConv =
                    (conv.sender_id === currentUserId && conv.receiver_id === participantId) ||
                    (conv.receiver_id === currentUserId && conv.sender_id === participantId);

                return isUserConv;
            })
            .map(conv => conv.id);

        // Remove duplicates
        const uniqueConvIds = [...new Set(relevantConvIds)];

        console.log(
            `[API] Found ${uniqueConvIds.length} conversation(s) with ${participantId}:`,
            uniqueConvIds
        );

        return uniqueConvIds;
    } catch (error) {
        console.error('[API] getConversationIdsByParticipant error:', error.message);
        throw error;
    }
}

/**
 * Get all messages from a participant across all conversation IDs
 * Merges messages from dual conversations into single thread
 * 
 * @param {string} participantId - The other user's ID
 * @returns {array} - Merged & sorted messages
 */
export async function getMessagesWithParticipant(participantId) {
    if (!participantId || typeof participantId !== 'string') {
        throw new Error('Participant ID is required');
    }

    const currentUserId = getCurrentUserId();

    try {
        // Step 1: Get all conversation IDs
        const conversationIds = await getConversationIdsByParticipant(participantId);

        if (conversationIds.length === 0) {
            console.warn('[API] No conversations found with this participant');
            return [];
        }

        console.log(`[API] Fetching messages from ${conversationIds.length} conversation(s)`);

        // Step 2: Fetch messages from ALL conversation IDs
        const allMessages = [];

        for (const convId of conversationIds) {
            try {
                const messages = await getMessages(convId);
                const enriched = messages.map(msg => ({
                    ...msg,
                    conversationId: convId,
                    role: msg.sender_id === currentUserId ? 'user' : 'receiver',
                }));
                allMessages.push(...enriched);
                console.log(`[API] ✅ Fetched ${messages.length} messages from ${convId}`);
            } catch (err) {
                console.warn(`[API] ⚠️ Failed to fetch from ${convId}:`, err.message);
            }
        }

        // Step 3: Sort by created_at (oldest first)
        allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        console.log(`[API] ✅ Total messages with ${participantId}: ${allMessages.length}`);
        return allMessages;
    } catch (error) {
        console.error('[API] getMessagesWithParticipant error:', error.message);
        throw error;
    }
}

/**
 * Get BOTH conversation IDs: user's conversation + participant's conversation
 * Handles dual-conversation model where each user creates their own conv_id
 * 
 * Logic:
 * 1. Find user's conversation: user_id = current, participant_id = participant
 * 2. Find participant's conversation: user_id = participant, participant_id = current
 * 
 * @param {string} participantId - The other user's ID
 * @returns {object} - { userConversationId, participantConversationId }
 */
export async function getBothConversationIds(participantId) {
    if (!participantId || typeof participantId !== 'string') {
        throw new Error('Participant ID is required');
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        throw new Error('Current user ID not found');
    }

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
            `${API_BASE_URL}/conversations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const convList = Array.isArray(data.conversations) ? data.conversations : data;

        console.log('[API] All conversations:', convList.map(c => ({
            id: c.id,
            sender_id: c.sender_id?.slice(0, 8),
            receiver_id: c.receiver_id?.slice(0, 8),
        })));

        // Step 1: Find USER's conversation
        // Logic: sender_id = current user AND receiver_id = participant
        const userConv = convList.find(conv =>
            conv.sender_id === currentUserId && conv.receiver_id === participantId
        );

        const userConversationId = userConv?.id || null;

        console.log(`[API] ✅ User conversation (${currentUserId} → ${participantId}):`,
            userConversationId ? userConversationId.slice(0, 12) : 'NOT FOUND'
        );

        // Step 2: Find PARTICIPANT's conversation
        // Logic: sender_id = participant AND receiver_id = current user
        const participantConv = convList.find(conv =>
            conv.sender_id === participantId && conv.receiver_id === currentUserId
        );

        const participantConversationId = participantConv?.id || null;

        console.log(`[API] ✅ Participant conversation (${participantId} → ${currentUserId}):`,
            participantConversationId ? participantConversationId.slice(0, 12) : 'NOT FOUND'
        );

        // Return both IDs
        return {
            userConversationId,
            participantConversationId,
            currentUserId,
            participantId,
        };
    } catch (error) {
        console.error('[API] getBothConversationIds error:', error.message);
        throw error;
    }
}

/**
 * Get all messages from BOTH conversations and merge them
 * 
 * @param {string} participantId - The other user's ID
 * @returns {array} - Merged & sorted messages with role assignment
 */
export async function getUnifiedMessages(participantId) {
    if (!participantId || typeof participantId !== 'string') {
        throw new Error('Participant ID is required');
    }

    const currentUserId = getCurrentUserId();

    try {
        console.log('[API] 🔄 Fetching unified messages with:', participantId);

        // Step 1: Get both conversation IDs
        const { userConversationId, participantConversationId } =
            await getBothConversationIds(participantId);

        console.log('[API] 📋 Conversation IDs:', {
            userConversationId: userConversationId?.slice(0, 12),
            participantConversationId: participantConversationId?.slice(0, 12),
        });

        const allMessages = [];

        // Step 2: Fetch messages from USER's conversation
        if (userConversationId) {
            try {
                console.log(`[API] 📥 Fetching from user conversation: ${userConversationId.slice(0, 12)}`);
                const userMsgs = await getMessages(userConversationId);
                const enriched = userMsgs.map(msg => ({
                    ...msg,
                    conversationId: userConversationId,
                    role: msg.sender_id === currentUserId ? 'user' : 'receiver',
                }));
                allMessages.push(...enriched);
                console.log(`[API] ✅ Fetched ${userMsgs.length} messages from user conversation`);
            } catch (err) {
                console.warn(`[API] ⚠️ Failed to fetch from user conversation:`, err.message);
            }
        } else {
            console.warn('[API] ⚠️ No user conversation found');
        }

        // Step 3: Fetch messages from PARTICIPANT's conversation
        if (participantConversationId) {
            try {
                console.log(`[API] 📥 Fetching from participant conversation: ${participantConversationId.slice(0, 12)}`);
                const participantMsgs = await getMessages(participantConversationId);
                const enriched = participantMsgs.map(msg => ({
                    ...msg,
                    conversationId: participantConversationId,
                    role: msg.sender_id === currentUserId ? 'user' : 'receiver',
                }));
                allMessages.push(...enriched);
                console.log(`[API] ✅ Fetched ${participantMsgs.length} messages from participant conversation`);
            } catch (err) {
                console.warn(`[API] ⚠️ Failed to fetch from participant conversation:`, err.message);
            }
        } else {
            console.warn('[API] ⚠️ No participant conversation found');
        }

        // Step 4: Remove duplicates (by message ID) and sort by timestamp
        const uniqueMessages = Array.from(
            new Map(allMessages.map(msg => [msg.id, msg])).values()
        );

        uniqueMessages.sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );

        console.log(`[API] ✅ Total unified messages: ${uniqueMessages.length}`);
        return uniqueMessages;
    } catch (error) {
        console.error('[API] getUnifiedMessages error:', error.message);
        throw error;
    }
}
