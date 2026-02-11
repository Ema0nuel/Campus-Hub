<script>
  // @ts-nocheck
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import ChatListContainer from "../components/ChatListContainer.svelte";
  import TopBar from "../components/TopBar.svelte";
  import ConversationGlassItem from "../components/ConversationGlassItem.svelte";
  import FloatingActionButton from "../components/FloatingActionButton.svelte";
  import NewConversationModal from "../components/NewConversationModal.svelte";
  import {
    subscribeToConversations,
    unsubscribeFromChannel,
  } from "../lib/supabaseClient.js";
  import { getUserConversations } from "../services/supabaseService.js";
  import { currentUserId, logout } from "../store/authStore.js";
  import { getRelativeTime } from "../lib/timeUtils.js";

  const dispatch = createEventDispatcher();

  let conversations = [];
  let loading = true;
  let error = "";
  let showNewConversationModal = false;
  let userId = "";
  let realtimeSubscription = null;

  // Subscribe to current user ID
  const unsubscribeUserId = currentUserId.subscribe((id) => {
    userId = id;
  });

  async function loadConversations() {
    if (!userId) {
      console.warn("[Conversation] User ID not available");
      return;
    }

    try {
      loading = true;
      error = "";
      console.log(
        "[Conversation] 📥 Loading conversations for:",
        userId.slice(0, 8),
      );

      // Fetch all conversations with participant details from Supabase
      const conversationsList = await getUserConversations(userId);

      // Transform data for display
      conversations = conversationsList.map((conv) => ({
        id: conv.id,
        participant_id: conv.participant_id,
        participant_name: conv.participant_name || "Unknown",
        participant_phone: conv.participant_phone || "",
        participant_avatar: conv.participant_avatar || null,
        participant_status: conv.participant_status || "offline",
        last_message_preview: conv.last_message_preview || "No messages yet",
        last_message_at: conv.last_message_at,
        unread_count: conv.unread_count || 0,
        is_archived: conv.is_archived || false,
        created_at: conv.created_at,
        users: {
          name: conv.participant_name || "Unknown",
          phone: conv.participant_phone || "",
          avatar_url: conv.participant_avatar || null,
          online: conv.participant_status === "online",
          id: conv.participant_id,
        },
      }));

      console.log(
        "[Conversation] ✅ Loaded",
        conversations.length,
        "conversations",
      );

      // Subscribe to realtime updates
      await subscribeToRealtimeUpdates();
    } catch (err) {
      console.error("[Conversation] ❌", err.message);
      error = err.message || "Failed to load conversations";
    } finally {
      loading = false;
    }
  }

  async function subscribeToRealtimeUpdates() {
    if (!userId) return;

    try {
      console.log("[Conversation] 📡 Subscribing to realtime updates (silent)");

      const onUpdate = (payload) => {
        console.log(
          "[Conversation] 🔄 Real-time event (silent update):",
          payload.eventType,
        );
        // Silently reload conversations WITHOUT showing spinner
        loadConversationsQuiet();
      };

      realtimeSubscription = await subscribeToConversations(userId, onUpdate);
      console.log(
        "[Conversation] ✅ Realtime subscription active (silent mode)",
      );
    } catch (err) {
      console.warn(
        "[Conversation] ⚠️ Realtime subscription failed (continuing offline):",
        err.message,
      );
    }
  }

  /**
   * Load conversations silently without showing spinner
   */
  async function loadConversationsQuiet() {
    try {
      console.log("[Conversation] 🔄 Silently updating conversation list");
      const conversationsList = await getUserConversations(userId);

      conversations = conversationsList.map((conv) => ({
        id: conv.id,
        participant_id: conv.participant_id,
        participant_name: conv.participant_name || "Unknown",
        participant_phone: conv.participant_phone || "",
        participant_avatar: conv.participant_avatar || null,
        participant_status: conv.participant_status || "offline",
        last_message_preview: conv.last_message_preview || "No messages yet",
        last_message_at: conv.last_message_at,
        unread_count: conv.unread_count || 0,
        is_archived: conv.is_archived || false,
        created_at: conv.created_at,
        users: {
          name: conv.participant_name || "Unknown",
          phone: conv.participant_phone || "",
          avatar_url: conv.participant_avatar || null,
          online: conv.participant_status === "online",
          id: conv.participant_id,
        },
      }));

      console.log(
        "[Conversation] ✅ Updated (silent):",
        conversations.length,
        "conversations",
      );
    } catch (err) {
      console.error("[Conversation] ❌ Silent update failed:", err.message);
    }
  }

  function handleConversationSelect(conv) {
    console.log("[Conversation] ✓ Selected:", conv.participant_name);
    dispatch("conversation-selected", {
      participant_id: conv.participant_id,
      participant_name: conv.participant_name,
      participant_phone: conv.participant_phone,
      participant_avatar: conv.participant_avatar,
    });
  }

  function handleNewConversation() {
    showNewConversationModal = true;
  }

  function handleModalClose() {
    showNewConversationModal = false;
  }

  async function handleConversationCreated() {
    showNewConversationModal = false;
    await loadConversations();
  }

  function handleLogout() {
    logout();
  }

  function handleSettings() {
    console.log("[Conversation] Settings clicked");
    dispatch("open-settings");
  }

  onMount(() => {
    console.log("[Conversation] 🎬 Mounted");
    if (userId) {
      loadConversations();
    }
  });

  onDestroy(async () => {
    console.log("[Conversation] 🧹 Cleanup");
    if (realtimeSubscription) {
      await unsubscribeFromChannel(realtimeSubscription);
    }
    unsubscribeUserId();
  });
</script>

<ChatListContainer>
  <TopBar on:logout={handleLogout} on:settings={handleSettings} />

  <div class="chat-list-wrapper">
    {#if error}
      <div class="error-message">
        <span>{error}</span>
        <button on:click={loadConversations}>Retry</button>
      </div>
    {:else if loading}
      <div class="loading-state">
        <div class="spinner" />
        <p>Loading conversations...</p>
      </div>
    {:else if conversations.length === 0}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>No conversations yet</p>
        <span>Start a new chat to begin messaging</span>
      </div>
    {:else}
      <div class="conversation-list">
        {#each conversations as conversation (conversation.id)}
          <button
            class="conversation-item"
            on:click={() => handleConversationSelect(conversation)}
          >
            <div class="avatar-container">
              {#if conversation.users.avatar_url}
                <img
                  src={conversation.users.avatar_url}
                  alt={conversation.users.name}
                  class="avatar"
                />
              {:else}
                <div class="avatar-placeholder">
                  {conversation.users.name.charAt(0).toUpperCase()}
                </div>
              {/if}
              {#if conversation.users.online}
                <div class="online-indicator" title="Online" />
              {/if}
            </div>

            <div class="conversation-content">
              <div class="conversation-header">
                <h3 class="conversation-name">{conversation.users.name}</h3>
                <time class="timestamp">
                  {getRelativeTime(conversation.last_message_at)}
                </time>
              </div>
              <p class="last-message">{conversation.last_message_preview}</p>
            </div>

            {#if conversation.unread_count > 0}
              <div class="unread-badge">{conversation.unread_count}</div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if showNewConversationModal}
    <NewConversationModal
      on:close={handleModalClose}
      on:created={handleConversationCreated}
    />
  {/if}

  <FloatingActionButton on:click={handleNewConversation} />
</ChatListContainer>

<style>
  .chat-list-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 0;
    background: #fff;
  }

  .error-message {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px;
    padding: 16px;
    background: linear-gradient(
      135deg,
      rgba(212, 47, 47, 0.1),
      rgba(229, 57, 53, 0.05)
    );
    border: 1px solid rgba(244, 67, 54, 0.15);
    border-radius: 12px;
    gap: 12px;
  }

  .error-message span {
    color: #d32f2f;
    font-size: 13px;
    flex: 1;
  }

  .error-message button {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .error-message button:hover {
    background: #c62828;
  }

  .loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 132, 255, 0.2);
    border-top-color: #0084ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    font-size: 14px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    opacity: 0.6;
    margin-bottom: 8px;
  }

  .empty-state p {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 0;
  }

  .empty-state span {
    font-size: 13px;
    color: #999;
  }

  .conversation-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .conversation-item {
    background: none;
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    padding: 12px 16px;
    text-align: left;
    margin: 0;
    transition: background-color 0.2s;
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
  }

  .conversation-item:hover {
    background: linear-gradient(90deg, rgba(100, 181, 246, 0.08), transparent);
  }

  .conversation-item:active {
    background: rgba(25, 103, 210, 0.06);
  }

  .avatar-container {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 20px;
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #31a24c;
    border: 3px solid #fff;
  }

  .conversation-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .conversation-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .timestamp {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .last-message {
    margin: 0;
    font-size: 13px;
    color: #65676b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unread-badge {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #0084ff;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .realtime-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(0, 132, 255, 0.1);
    border-bottom: 1px solid rgba(0, 132, 255, 0.2);
    color: #0084ff;
    font-size: 13px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  }

  .realtime-status.updating .spinner-icon {
    width: 14px;
    height: 14px;
    display: inline-block;
    animation: spin 0.8s linear infinite;
  }

  .realtime-status span {
    flex: 1;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-color-scheme: dark) {
    .realtime-status {
      background: rgba(0, 132, 255, 0.15);
      border-bottom-color: rgba(0, 132, 255, 0.25);
      color: #0084ff;
    }
  }

  @media (prefers-color-scheme: dark) {
    .chat-list-wrapper {
      background: #0a0a0a;
    }

    .error-message {
      background: linear-gradient(
        135deg,
        rgba(212, 47, 47, 0.15),
        rgba(229, 57, 53, 0.08)
      );
      border-color: rgba(244, 67, 54, 0.2);
    }

    .empty-state p {
      color: #aaa;
    }

    .empty-state span {
      color: #666;
    }

    .loading-state {
      color: #aaa;
    }

    .conversation-item {
      border-bottom-color: rgba(255, 255, 255, 0.05);
    }

    .conversation-item:hover {
      background: linear-gradient(90deg, rgba(8, 132, 255, 0.08), transparent);
    }

    .conversation-item:active {
      background: rgba(8, 132, 255, 0.1);
    }

    .conversation-name {
      color: #fff;
    }

    .last-message {
      color: #aaa;
    }

    .timestamp {
      color: #666;
    }
  }

  @media (max-width: 640px) {
    .conversation-item {
      padding: 10px 12px;
      gap: 10px;
    }

    .avatar,
    .avatar-placeholder {
      width: 48px;
      height: 48px;
      font-size: 18px;
    }

    .conversation-name {
      font-size: 14px;
    }

    .last-message {
      font-size: 12px;
    }

    .timestamp {
      font-size: 11px;
    }

    .unread-badge {
      width: 18px;
      height: 18px;
      font-size: 11px;
    }
  }
</style>
