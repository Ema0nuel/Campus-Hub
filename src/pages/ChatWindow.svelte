<!-- filepath: c:\Users\emas0\OneDrive\Documents\practice\2026\Campus Hub\src\components\ChatWindow.svelte -->
<script>
  // @ts-nocheck
  import { onMount, tick } from "svelte";
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
  import MessageBubble from "../components/MessageBubble.svelte";
  import ChatInput from "../components/ChatInput.svelte";
  import ChatHeader from "../components/ChatHeader.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let participantId = "";
  export let participantName = "User";
  export let participantPhone = "";

  let currentUserId = "";
  let messages = [];
  let isLoading = false;
  let messagesContainer;
  let userConversationId = "";
  let participantConversationId = "";
  let error = "";
  let isSending = false;

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
      isSending = true;

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
    } finally {
      isSending = false;
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
    };
  });

  // Reload when participant changes
  $: if (participantId && currentUserId) {
    loadMessages();
  }
</script>

<div class="chat-window-fullscreen">
  <!-- Header -->
  <ChatHeader
    name={participantName}
    phone={participantPhone}
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
      </div>
    {/if}
  </div>

  <!-- Input - Always accessible -->
  <ChatInput disabled={isSending} on:send={handleSendMessage} />
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

  @media (prefers-color-scheme: dark) {
    .chat-window-fullscreen {
      background: #111;
      color: #fff;
    }

    .messages-container {
      background: linear-gradient(to bottom, #1a1a1a, #0d0d0d);
    }

    .loading p,
    .empty-state p,
    .empty-state span {
      color: #aaa;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #444;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #666;
    }
  }

  @media (max-width: 768px) {
    .chat-window-fullscreen {
      position: fixed;
    }
  }
</style>
