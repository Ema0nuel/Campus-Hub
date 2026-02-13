<!-- filepath: c:\Users\emas0\OneDrive\Documents\practice\2026\Campus Hub\src\components\ChatWindow.svelte -->
<script>
  // @ts-nocheck
  import { onMount, tick, onDestroy } from "svelte";
  import {
    getUnifiedMessages,
    getCurrentUserId,
    sendMessage,
    getBothConversationIds,
  } from "../lib/api.js";
  import {
    loadConversationMessages,
    messages as messagesStore,
  } from "../stores/socketStore.js";
  import { on as socketOn, off as socketOff } from "../lib/socketClient.js";
  import {
    subscribeToTypingIndicators,
    unsubscribeFromChannel,
  } from "../lib/supabaseClient.js";
  import { supabase } from "../lib/supabaseClient.js";
  import { formatAdjustedTime } from "../lib/timeUtils.js";
  import MessageBubble from "../components/MessageBubble.svelte";
  import ChatInput from "../components/ChatInput.svelte";
  import ChatHeader from "../components/ChatHeader.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let participantId = "";
  export let participantName = "User";
  export let participantPhone = "";
  export let participantAvatar = "";

  let currentUserId = "";
  let messages = [];
  let isLoading = false;
  let messagesContainer;
  let userConversationId = "";
  let participantConversationId = "";
  let error = "";
  let isParticipantTyping = false;
  let typingTimeoutId = null;
  let typingSubscription = null;
  let subscriptionAttempts = 0;
  const MAX_SUBSCRIPTION_ATTEMPTS = 3;

  /**
   * Load unified messages from BOTH conversations
   */
  async function loadMessages() {
    try {
      isLoading = true;
      error = "";

      console.log(
        "[ChatWindow] 🚀 Loading unified messages with:",
        participantId,
      );

      // Get both conversation IDs
      const convIds = await getBothConversationIds(participantId);
      userConversationId = convIds.userConversationId;
      participantConversationId = convIds.participantConversationId;

      console.log("[ChatWindow] 📋 Conversation IDs loaded:", {
        user: userConversationId?.slice(0, 12),
        participant: participantConversationId?.slice(0, 12),
      });

      // Fetch unified messages
      const msgs = await getUnifiedMessages(participantId);

      messages = msgs;

      console.log("[ChatWindow] ✅ Loaded", messages.length, "messages");
      console.log("[ChatWindow] 📊 Message breakdown:", {
        sent: messages.filter((m) => m.role === "user").length,
        received: messages.filter((m) => m.role === "receiver").length,
      });

      // Silently activate typing subscription after loading conversation IDs
      subscribeToConversationTyping();

      // Scroll to bottom after render
      await tick();
      scrollToBottom();
    } catch (err) {
      console.error("[ChatWindow] ❌ Failed to load messages:", err);
      error = err.message || "Failed to load messages";
    } finally {
      isLoading = false;
    }
  }

  /**
   * Send message to participant
   */
  async function handleSendMessage(event) {
    const content = event.detail;

    if (!content.trim()) {
      console.warn("[ChatWindow] Empty message, skipping");
      return;
    }

    if (!userConversationId) {
      console.error("[ChatWindow] ❌ No conversation ID available");
      error = "Cannot send: conversation not initialized";
      return;
    }

    try {
      console.log("[ChatWindow] 📤 Sending message to", participantId);
      console.log(
        "[ChatWindow] Using conversation:",
        userConversationId.slice(0, 12),
      );

      // Send via USER's conversation ID
      const sentMsg = await sendMessage(
        userConversationId,
        participantId,
        content,
      );

      // Enrich message with metadata
      const enrichedMsg = {
        ...sentMsg,
        conversationId: userConversationId,
        role: "user",
      };

      // Add to messages array
      messages = [...messages, enrichedMsg];

      console.log("[ChatWindow] ✅ Message sent:", sentMsg.id.slice(0, 8));

      await tick();
      scrollToBottom();
    } catch (err) {
      console.error("[ChatWindow] ❌ Failed to send message:", err);
      error = err.message || "Failed to send message";
    }
  }

  /**
   * Receive message via socket
   */
  function setupSocketListeners() {
    console.log("[ChatWindow] 🔌 Setting up socket listeners");

    socketOn("message:received", (messageData) => {
      console.log(
        "[ChatWindow] 💬 Message received via socket:",
        messageData.id?.slice(0, 8),
      );

      // Only add if from this participant
      if (messageData.sender_id === participantId) {
        const enrichedMsg = {
          ...messageData,
          conversationId: participantConversationId,
          role: "receiver",
        };

        messages = [...messages, enrichedMsg];
        tick().then(() => scrollToBottom());
      }
    });

    // Listen for typing indicator events
    socketOn("typing_indicator", (data) => {
      console.log("[ChatWindow] ✏️ Typing indicator received:", data);
      if (data.userId !== currentUserId) {
        setParticipantTyping(true);
      }
    });

    socketOn("typing_stop", (data) => {
      console.log("[ChatWindow] ✋ Typing stopped:", data);
      if (data.userId !== currentUserId) {
        setParticipantTyping(false);
      }
    });
  }

  /**
   * Subscribe to real-time typing indicators from typing_indicators table
   */
  function subscribeToConversationTyping() {
    console.log("[ChatWindow] 📡 Initializing typing subscription");

    try {
      if (!userConversationId || !participantConversationId) {
        console.warn("[ChatWindow] ⚠️ Conversation IDs not ready");
        return;
      }

      // Clean up previous subscription if exists
      if (typingSubscription) {
        console.log("[ChatWindow] 🧹 Cleaning up old subscription");
        unsubscribeFromChannel(typingSubscription);
        typingSubscription = null;
      }

      // Always create fresh subscription with unique channel name
      const channelName = `typing:${userConversationId}:${participantConversationId}:${Date.now()}`;
      const channel = supabase
        .channel(channelName, { config: { broadcast: { self: false } } })
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "typing_indicators",
            filter: `conversation_id=eq.${userConversationId}`,
          },
          (payload) => handleTypingIndication(payload),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "typing_indicators",
            filter: `conversation_id=eq.${participantConversationId}`,
          },
          (payload) => handleTypingIndication(payload),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[ChatWindow] ✅ Typing subscription ready");
            subscriptionAttempts = 0;
          } else if (status === "CHANNEL_ERROR") {
            if (subscriptionAttempts < MAX_SUBSCRIPTION_ATTEMPTS) {
              subscriptionAttempts++;
              console.log(
                `[ChatWindow] 🔄 Retry (${subscriptionAttempts}/${MAX_SUBSCRIPTION_ATTEMPTS})`,
              );
              setTimeout(() => subscribeToConversationTyping(), 1000);
            }
          }
        });

      typingSubscription = channel;
    } catch (err) {
      console.error("[ChatWindow] ❌ Subscription error:", err.message);
    }
  }

  function handleTypingIndication(payload) {
    const { new: newData, old: oldData, eventType } = payload;
    const typingData = newData || oldData;

    if (!typingData || typingData.user_id === currentUserId) {
      return; // Ignore own typing
    }

    if (
      eventType === "INSERT" ||
      (eventType === "UPDATE" && newData?.is_typing)
    ) {
      console.log("[ChatWindow] ✏️ Participant typing...");
      setParticipantTyping(true);
    } else if (eventType === "UPDATE" && !newData?.is_typing) {
      console.log("[ChatWindow] ✋ Participant stopped typing");
      setParticipantTyping(false);
    } else if (eventType === "DELETE") {
      console.log("[ChatWindow] ✋ Typing indicator removed");
      setParticipantTyping(false);
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 0);
    }
  }

  function handleTypingStart(event) {
    const { conversationId } = event.detail;
    console.log("[ChatWindow] ✏️ User typing...");
    // Emit to parent or handle locally
  }

  function handleTypingStop(event) {
    const { conversationId } = event.detail;
    console.log("[ChatWindow] ✋ User stopped typing");
  }

  function setParticipantTyping(isTyping) {
    isParticipantTyping = isTyping;

    if (isTyping) {
      if (typingTimeoutId) clearTimeout(typingTimeoutId);
      // Auto-hide typing indicator after 5 seconds
      typingTimeoutId = setTimeout(() => {
        isParticipantTyping = false;
      }, 5000);
    } else {
      if (typingTimeoutId) clearTimeout(typingTimeoutId);
    }
  }

  function handleBack() {
    dispatch("back");
  }

  onMount(() => {
    currentUserId = getCurrentUserId();

    console.log("[ChatWindow] 🎬 Component mounted with:", {
      participantId,
      participantName,
      currentUserId: currentUserId?.slice(0, 8),
    });

    loadMessages();
    setupSocketListeners();

    // Cleanup listeners on unmount
    return () => {
      socketOff("message:received");
      socketOff("typing_indicator");
      socketOff("typing_stop");
      if (typingSubscription) {
        unsubscribeFromChannel(typingSubscription);
      }
      if (typingTimeoutId) clearTimeout(typingTimeoutId);
    };
  });

  onDestroy(() => {
    socketOff("message:received");
    socketOff("typing_indicator");
    socketOff("typing_stop");
    if (typingSubscription) {
      unsubscribeFromChannel(typingSubscription);
    }
    if (typingTimeoutId) clearTimeout(typingTimeoutId);
  });

  // Reload when participant changes
  $: if (participantId && currentUserId) {
    loadMessages();
  }

  // Ensure typing subscription is re-activated when conversation IDs are available
  $: if (
    userConversationId &&
    participantConversationId &&
    !typingSubscription
  ) {
    console.log(
      "[ChatWindow] 📡 Silently ensuring typing subscription is active",
    );
    subscribeToConversationTyping();
  }
</script>

<div class="chat-window-fullscreen">
  <!-- Header -->
  <ChatHeader
    name={participantName}
    phone={participantPhone}
    avatarUrl={participantAvatar}
    onlineStatus={true}
    on:back={handleBack}
  />

  <!-- Messages Container -->
  <div class="messages-container" bind:this={messagesContainer}>
    {#if error}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{error}</p>
        <button on:click={loadMessages} class="retry-btn">Retry</button>
      </div>
    {:else if isLoading && messages.length === 0}
      <div class="loading">
        <div class="spinner" />
        <p>Loading messages...</p>
      </div>
    {:else if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>No messages yet</p>
        <span>Start a conversation with {participantName}</span>
      </div>
    {:else}
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
        {#if isParticipantTyping}
          <div class="typing-indicator">
            <div class="typing-bubble">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p class="typing-text">{participantName} is typing...</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Input - Always Active -->
  <ChatInput
    conversationId={userConversationId}
    userId={currentUserId}
    on:send={handleSendMessage}
    on:typing-start={handleTypingStart}
    on:typing-stop={handleTypingStop}
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
    overflow-x: hidden;
    background: linear-gradient(to bottom, #f5f5f5, #fafafa);
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
  }

  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: #999;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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

  .loading p {
    font-size: 14px;
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: #d32f2f;
  }

  .error-icon {
    font-size: 48px;
  }

  .error-text {
    font-size: 14px;
    text-align: center;
    max-width: 300px;
    margin: 0;
  }

  .retry-btn {
    padding: 10px 20px;
    background: #0084ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s;
  }

  .retry-btn:hover {
    background: #0073e6;
  }

  .retry-btn:active {
    transform: scale(0.95);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    margin-top: 8px;
  }

  .typing-bubble {
    display: flex;
    gap: 4px;
    background: #e5e5ea;
    border-radius: 18px;
    padding: 12px 16px;
    min-height: 20px;
  }

  .typing-bubble span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s infinite;
  }

  .typing-bubble span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-bubble span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }

  .typing-text {
    font-size: 12px;
    color: #666;
    margin: 0;
    font-weight: 500;
  }

  @media (prefers-color-scheme: dark) {
    .messages-list {
      gap: 4px;
    }

    .typing-bubble {
      background: #2c2c2e;
    }

    .typing-bubble span {
      background: #8e8e93;
    }

    .typing-text {
      color: #aaa;
    }
  }

  @media (max-width: 768px) {
    .chat-window-fullscreen {
      position: fixed;
    }
  }
</style>
