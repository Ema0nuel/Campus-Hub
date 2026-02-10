<script>
  // @ts-nocheck
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import ChatListContainer from "../components/ChatListContainer.svelte";
  import TopBar from "../components/TopBar.svelte";
  import ConversationGlassItem from "../components/ConversationGlassItem.svelte";
  import FloatingActionButton from "../components/FloatingActionButton.svelte";
  import NewConversationModal from "../components/NewConversationModal.svelte";
  import {
    supabase,
    subscribeToConversations,
    unsubscribeFromChannel,
  } from "../lib/supabaseClient.js";
  import { currentUserId, logout } from "../store/authStore.js";

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

      // Query conversations table directly from Supabase
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select(
          `
          id,
          user_id,
          participant_id,
          last_message_preview,
          last_message_at,
          unread_count,
          is_archived
        `,
        )
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch participant details for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: participant, error: partError } = await supabase
            .from("users")
            .select("id, name, phone_number, avatar_url, status")
            .eq("id", conv.participant_id)
            .maybeSingle();

          if (partError) {
            console.warn(
              "[Conversation] ⚠️ Participant fetch error:",
              partError.message,
            );
          }

          return {
            id: conv.id,
            participant_id: conv.participant_id,
            participant_name: participant?.name || "User",
            participant_phone: participant?.phone_number || "",
            participant_avatar: participant?.avatar_url || null,
            participant_status: participant?.status || "offline",
            last_message_preview: conv.last_message_preview || "",
            last_message_at: conv.last_message_at,
            unread_count: conv.unread_count || 0,
          };
        }),
      );

      conversations = conversationsWithDetails.map((conv) => ({
        ...conv,
        users: {
          id: conv.participant_id,
          name: conv.participant_name,
          avatar_url: conv.participant_avatar,
          status: conv.participant_status,
          phone_number: conv.participant_phone,
          online: conv.participant_status === "online",
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
      console.log("[Conversation] 📡 Subscribing to realtime updates");

      const onUpdate = (payload) => {
        console.log("[Conversation] 🔄 Update event:", payload.eventType);

        // Reload conversations when any update occurs
        loadConversations();
      };

      realtimeSubscription = await subscribeToConversations(userId, onUpdate);
      console.log("[Conversation] ✅ Realtime subscription active");
    } catch (err) {
      console.warn(
        "[Conversation] ⚠️ Realtime subscription failed:",
        err.message,
      );
    }
  }

  function handleConversationSelect(conv) {
    console.log("[Conversation] ✓ Selected:", conv.participant_name);
    dispatch("conversation-selected", conv);
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
        <span>⚠️ {error}</span>
        <button on:click={loadConversations}>Retry</button>
      </div>
    {:else if loading}
      <div class="loading-state">
        <div class="spinner" />
        <p>Loading conversations...</p>
      </div>
    {:else if conversations.length === 0}
      <div class="empty-state">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
          <path
            d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
          />
        </svg>
        <p>No conversations yet</p>
        <span>Create one to get started!</span>
      </div>
    {:else}
      <div class="conversation-list">
        {#each conversations as conv (conv.id)}
          <button
            class="conversation-item"
            on:click={() => handleConversationSelect(conv)}
            on:keydown={(e) =>
              e.key === "Enter" && handleConversationSelect(conv)}
            role="button"
            tabindex="0"
          >
            <ConversationGlassItem
              name={conv.participant_name}
              phone={conv.participant_phone}
              preview={conv.last_message_preview}
              timestamp={conv.last_message_at}
              unreadCount={conv.unread_count}
              avatar={conv.participant_avatar}
              status={conv.participant_status}
            />
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
    padding: 8px 0;
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
    backdrop-filter: blur(10px);
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
    width: 64px;
    height: 64px;
    color: #ddd;
    opacity: 0.5;
    margin-bottom: 8px;
  }

  .empty-state p {
    font-size: 16px;
    font-weight: 500;
    color: #999;
    margin: 0;
  }

  .empty-state span {
    font-size: 13px;
    color: #bbb;
  }

  .conversation-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .conversation-item {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
    margin: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s;
  }

  .conversation-item:hover {
    background: linear-gradient(90deg, rgba(100, 181, 246, 0.08), transparent);
  }

  .conversation-item:active {
    background: rgba(25, 103, 210, 0.06);
  }

  @media (prefers-color-scheme: dark) {
    .error-message {
      background: linear-gradient(
        135deg,
        rgba(244, 67, 54, 0.1),
        rgba(229, 57, 53, 0.05)
      );
      border-color: rgba(244, 67, 54, 0.2);
    }

    .empty-state p,
    .loading-state {
      color: #aaa;
    }

    .empty-icon {
      color: #444;
    }

    .conversation-item:hover {
      background: linear-gradient(
        90deg,
        rgba(100, 181, 246, 0.12),
        transparent
      );
    }

    .conversation-item:active {
      background: rgba(33, 150, 243, 0.1);
    }
  }
</style>
