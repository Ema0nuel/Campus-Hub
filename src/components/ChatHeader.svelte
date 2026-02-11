<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let name = "User";
  export let phone = "";
  export let onlineStatus = false;
  export let avatarUrl = "";

  function handleBack() {
    dispatch("back");
  }
</script>

<div class="chat-header">
  <div class="header-content">
    <button
      class="back-btn"
      on:click={handleBack}
      title="Back to conversations"
      aria-label="Back"
    >
      ←
    </button>

    {#if avatarUrl}
      <img src={avatarUrl} alt={name} class="avatar" />
    {:else}
      <div class="avatar-placeholder">{name.charAt(0)}</div>
    {/if}

    <div class="user-info">
      <h2 class="name">{name}</h2>
      <span class="status" class:online={onlineStatus}>
        {onlineStatus ? "Active now" : "Offline"}
      </span>
    </div>
  </div>

  <div class="header-actions">
    <button class="icon-btn more-btn" title="More options" aria-label="More"
      >⋮</button
    >
  </div>
</div>

<style>
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
    color: #0084ff;
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: #f0f2f5;
  }

  .back-btn:active {
    transform: scale(0.95);
  }

  .avatar {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .avatar-placeholder {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status {
    font-size: 12px;
    color: #999;
    transition: color 0.2s;
  }

  .status.online {
    color: #31a24c;
    font-weight: 500;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: #f0f2f5;
  }

  .icon-btn:active {
    transform: scale(0.95);
  }

  .more-btn {
    color: #0084ff;
  }

  @media (prefers-color-scheme: dark) {
    .chat-header {
      background: #1a1a1a;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .name {
      color: #fff;
    }

    .status {
      color: #aaa;
    }

    .status.online {
      color: #31a24c;
    }

    .back-btn:hover,
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  @media (max-width: 640px) {
    .chat-header {
      padding: 10px 12px;
    }

    .avatar,
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      min-width: 40px;
    }

    .back-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
    }

    .name {
      font-size: 15px;
    }

    .status {
      font-size: 11px;
    }
  }
</style>
