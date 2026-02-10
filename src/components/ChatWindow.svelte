<script>
  // @ts-nocheck
  import { onMount, onDestroy, tick } from "svelte";
  import {
    getUnifiedMessagesFromSupabase,
    sendMessageDirect,
    getBothConversationIdsFromSupabase,
    markConversationAsRead,
    getOrCreateConversation,
    setTypingIndicator,
    subscribeToTypingIndicators,
  } from "../lib/messageService.js";
  import {
    getSupabaseUserId,
    subscribeToConversation,
    unsubscribeFromChannel,
  } from "../lib/supabaseClient.js";
  import { currentUserId } from "../store/authStore.js";
  import MessageBubble from "./MessageBubble.svelte";
  import ChatInput from "./ChatInput.svelte";
  import ChatHeader from "./ChatHeader.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let participantId = "";
  export let participantName = "User";
  export let participantPhone = "";

  let currentUser = "";
  let messages = [];
  let isLoading = false;
  let isReady = false;
  let messagesContainer;
  let userConversationId = "";
  let participantConversationId = "";
  let error = "";
  let isSending = false;
  let subscriptions = [];
  let isTyping = false;
  let typingTimeout;

  // Subscribe to current user
  const unsubscribeUser = currentUserId.subscribe((id) => {
    currentUser = id;
  });

  async function validatePreconditions() {
    if (!currentUser) {
      error = "User not authenticated";
      console.error("[ChatWindow] ❌ No user ID");
      return false;
    }

    if (!participantId?.trim()) {
      error = "Invalid participant";
      console.error("[ChatWindow] ❌ No participant ID");
      return false;
    }

    return true;
  }

  async function loadMessages() {
    messages = [];
    error = "";

    if (!(await validatePreconditions())) {
      return;
    }

    try {
      isLoading = true;
      console.log("[ChatWindow] 🚀 Loading with:", participantId.slice(0, 8));

      // Get conversation IDs or create if not exists
      const convIds = await getBothConversationIdsFromSupabase(
        participantId,
        currentUser,
      );
      userConversationId = convIds.userConversationId;
      participantConversationId = convIds.participantConversationId;

      // If no conversation exists, create one
      if (!userConversationId && !participantConversationId) {
        console.log("[ChatWindow] 📝 Creating conversation");
        userConversationId = await getOrCreateConversation(
          participantId,
          currentUser,
        );
      }

      // Fetch messages
      const msgs = await getUnifiedMessagesFromSupabase(
        participantId,
        currentUser,
      );
      // Ensure deduplicated list
      messages = Array.from(
        new Map((msgs || []).map((m) => [m.id, m])).values(),
      );

      // Mark as read
      if (userConversationId) {
        await markConversationAsRead(userConversationId, currentUser);
      }

      // Subscribe to realtime updates
      await setupRealtimeSubscriptions();

      isReady = true;
      console.log("[ChatWindow] ✅ Ready");

      await tick();
      scrollToBottom();
    } catch (err) {
      console.error("[ChatWindow] ❌", err.message);
      error = err.message;
      isReady = false;
    } finally {
      isLoading = false;
    }
  }

  async function setupRealtimeSubscriptions() {
    try {
      console.log("[ChatWindow] 📡 Setting up realtime subscriptions");

      const onMessagePayload = (payload) => {
        // payload.type: "INSERT" | "UPDATE"
        // payload.message: enriched message object
        const newMsg = payload.message;

        if (!newMsg?.id) return;

        // Check if message already exists
        if (messages.some((m) => m.id === newMsg.id)) {
          // Update if it's an UPDATE event (e.g., read receipt)
          if (payload.type === "UPDATE") {
            messages = messages.map((m) => (m.id === newMsg.id ? newMsg : m));
          }
          return;
        }

        // Add new message
        messages = [...messages, newMsg];
        // Deduplicate by id to avoid duplicates from optimistic add + realtime insert
        messages = Array.from(new Map(messages.map((m) => [m.id, m])).values());
        tick().then(() => scrollToBottom());

        // Mark as read if from participant
        if (newMsg.sender_id === participantId && userConversationId) {
          markConversationAsRead(userConversationId, currentUser);
        }
      };

      const subs = [];

      // Subscribe to both conversation IDs
      if (userConversationId) {
        try {
          const sub = await subscribeToConversation(
            userConversationId,
            onMessagePayload,
          );
          subs.push(sub);
          console.log("[ChatWindow] ✅ Subscribed to user conversation");
        } catch (e) {
          console.warn("[ChatWindow] ⚠️ User conv sub failed:", e.message);
        }
      }

      if (participantConversationId) {
        try {
          const sub = await subscribeToConversation(
            participantConversationId,
            onMessagePayload,
          );
          subs.push(sub);
          console.log("[ChatWindow] ✅ Subscribed to participant conversation");
        } catch (e) {
          console.warn(
            "[ChatWindow] ⚠️ Participant conv sub failed:",
            e.message,
          );
        }
      }

      // Subscribe to typing indicators
      if (userConversationId) {
        try {
          const typingChannel = subscribeToTypingIndicators(
            userConversationId,
            (payload) => {
              console.log("[ChatWindow] 🔔 Typing event:", payload.eventType);
              // Update typing status for participant
              // This is where you'd show "User is typing..."
            },
          );
          if (typingChannel) subs.push(typingChannel);
        } catch (e) {
          console.warn(
            "[ChatWindow] ⚠️ Typing subscription failed:",
            e.message,
          );
        }
      }

      subscriptions = subs;
      console.log("[ChatWindow] ✅ Subscribed to", subs.length, "channels");
    } catch (err) {
      console.warn("[ChatWindow] ⚠️ Realtime setup failed:", err.message);
    }
  }

  function handleTyping() {
    if (!userConversationId) return;

    clearTimeout(typingTimeout);

    if (!isTyping) {
      isTyping = true;
      setTypingIndicator(userConversationId, true, currentUser);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeout = setTimeout(() => {
      isTyping = false;
      setTypingIndicator(userConversationId, false, currentUser);
    }, 3000);
  }

  async function handleSendMessage(event) {
    const content = event.detail;

    if (!content?.trim()) return;

    if (!(await validatePreconditions())) {
      return;
    }

    if (!userConversationId) {
      error = "Conversation not ready";
      return;
    }

    try {
      isSending = true;
      error = "";

      // Stop typing indicator
      isTyping = false;
      await setTypingIndicator(userConversationId, false, currentUser);
      clearTimeout(typingTimeout);

      // Send message
      const sentMsg = await sendMessageDirect(
        userConversationId,
        participantId,
        content,
        currentUser,
      );

      // Add to local list
      messages = [...messages, sentMsg];
      // Deduplicate by id in case subscription also emits the same insert
      messages = Array.from(new Map(messages.map((m) => [m.id, m])).values());
      console.log("[ChatWindow] ✅ Sent:", sentMsg.id.slice(0, 8));

      await tick();
      scrollToBottom();
    } catch (err) {
      console.error("[ChatWindow] ❌", err.message);
      error = err.message;
    } finally {
      isSending = false;
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 0);
    }
  }

  function handleBack() {
    dispatch("back");
  }

  onMount(() => {
    console.log("[ChatWindow] 🎬 Mounted");
    if (currentUser && participantId?.trim()) {
      loadMessages();
    }
  });

  onDestroy(() => {
    console.log("[ChatWindow] 🧹 Cleanup");

    // Stop typing indicator
    if (isTyping && userConversationId) {
      setTypingIndicator(userConversationId, false, currentUser);
    }
    clearTimeout(typingTimeout);

    // Unsubscribe from channels
    subscriptions.forEach((sub) => unsubscribeFromChannel(sub));
    unsubscribeUser();
  });

  $: if (currentUser && participantId?.trim() && !isLoading) {
    loadMessages();
  }
</script>

<div class="chat-window-fullscreen">
  <ChatHeader
    name={participantName}
    phone={participantPhone}
    onlineStatus={true}
    on:back={handleBack}
  />

  <div class="messages-container" bind:this={messagesContainer}>
    {#if error}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{error}</p>
        {#if !error.includes("not authenticated")}
          <button on:click={loadMessages}>Retry</button>
        {/if}
      </div>
    {:else if isLoading && messages.length === 0}
      <div class="loading">
        <div class="spinner" />
        <p>Loading...</p>
      </div>
    {:else if messages.length === 0 && isReady}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>No messages yet</p>
        <span>Start a conversation with {participantName}</span>
      </div>
    {:else if messages.length > 0}
      <div class="messages-list">
        {#each messages as msg, idx (msg.id)}
          <MessageBubble
            message={msg}
            showTime={!messages[idx - 1] ||
              new Date(messages[idx - 1].created_at).getTime() -
                new Date(msg.created_at).getTime() >
                5 * 60 * 1000}
          />
        {/each}
      </div>
    {/if}
  </div>

  <ChatInput
    disabled={isSending || !isReady}
    on:send={handleSendMessage}
    on:typing={handleTyping}
  />
</div>

<style>
  .chat-window-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: #fff;
    color: #000;
    z-index: 1000;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    background: linear-gradient(to bottom, #f5f5f5, #fafafa);
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
  }

  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: #999;
  }

  .loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e0e0e0;
    border-top-color: #0084ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #d32f2f;
  }

  .error-icon {
    font-size: 48px;
  }

  .error-state p {
    font-size: 14px;
    max-width: 300px;
    text-align: center;
  }

  .error-state button {
    padding: 10px 20px;
    background: #0084ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .error-state button:hover {
    background: #0073e6;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #999;
  }

  .empty-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 16px;
    font-weight: 500;
  }

  .empty-state span {
    font-size: 13px;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  @media (prefers-color-scheme: dark) {
    .chat-window-fullscreen {
      background: #111;
      color: #fff;
    }

    .messages-container {
      background: linear-gradient(to bottom, #1a1a1a, #0d0d0d);
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #444;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #666;
    }
  }
</style>
