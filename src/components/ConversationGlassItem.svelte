<script>
  // @ts-nocheck

  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { onUserPresence } from "../lib/socket.js";

  export let conversation = null;

  const dispatch = createEventDispatcher();

  let isOnline = false;

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d`;
    return date.toLocaleDateString();
  }

  function handleSelect() {
    vibrate(10);
    dispatch("select");
  }

  onMount(() => {
    // Initialize online status from conversation data
    isOnline = conversation?.users?.online || false;
    console.log(
      `[ConversationItem] Mounted: ${conversation?.users?.name} - Online: ${isOnline}`,
    );

    // Subscribe to presence updates for THIS user
    const unsubscribePresence = onUserPresence((data) => {
      if (data.userId === conversation?.users?.id) {
        console.log(
          `[ConversationItem] Presence update for ${conversation?.users?.name}: ${data.online ? "online" : "offline"}`,
        );
        isOnline = data.online;
      }
    });

    return () => {
      unsubscribePresence?.();
    };
  });
</script>

<button class="conversation-item" on:click={handleSelect}>
  <div class="avatar-container">
    <img
      src={conversation?.users?.avatar_url}
      alt={conversation?.users?.name}
      class="avatar"
    />
    {#if isOnline}
      <div class="online-indicator" title="Online"></div>
    {/if}
  </div>

  <div class="conversation-details">
    <h3 class="conversation-name">{conversation?.users?.name}</h3>
    <p class="last-message">{conversation?.last_message_preview}</p>
  </div>

  <div class="conversation-meta">
    <time class="timestamp">{formatTime(conversation?.last_message_at)}</time>
    {#if conversation?.unread_count > 0}
      <span class="unread-badge">{conversation.unread_count}</span>
    {/if}
  </div>
</button>

<style>
  .conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    border: none;
    text-align: left;
  }

  .conversation-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .conversation-item:active {
    transform: scale(0.98);
  }

  .avatar-container {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .online-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 14px;
    height: 14px;
    background: #31a24c;
    border: 3px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: onlinePulse 2s ease-in-out infinite;
  }

  @keyframes onlinePulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(49, 162, 76, 0.7);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(49, 162, 76, 0.3);
    }
  }

  .conversation-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .conversation-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .last-message {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .conversation-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  .timestamp {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }

  .unread-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #0084ff;
    color: white;
    font-size: 11px;
    font-weight: 700;
    border-radius: 50%;
  }

  @media (prefers-color-scheme: light) {
    .conversation-item {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.08);
    }

    .conversation-item:hover {
      background: rgba(0, 0, 0, 0.06);
      border-color: rgba(0, 0, 0, 0.12);
    }

    .conversation-name {
      color: #000;
    }

    .last-message {
      color: rgba(0, 0, 0, 0.6);
    }

    .timestamp {
      color: rgba(0, 0, 0, 0.5);
    }

    .avatar {
      border-color: rgba(0, 0, 0, 0.1);
    }
  }
</style>
