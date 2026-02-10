<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let name = "User";
  export let phone = "";
  export let onlineStatus = false;

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
    >
      ←
    </button>
    <div class="user-info">
      <h2 class="name">{name}</h2>
      <p class="phone">{phone || "No phone"}</p>
      <span class="status" class:online={onlineStatus}>
        {onlineStatus ? "Active now" : "Offline"}
      </span>
    </div>
  </div>
  <div class="header-actions">
    <button class="icon-btn" title="Call">☎️</button>
    <button class="icon-btn" title="Video call">📹</button>
    <button class="icon-btn" title="More">⋮</button>
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
  }

  .back-btn {
    width: 36px;
    height: 36px;
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
  }

  .back-btn:hover {
    background: #f0f2f5;
  }

  .back-btn:active {
    transform: scale(0.95);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #000;
  }

  .phone {
    margin: 0;
    font-size: 12px;
    color: #65676b;
  }

  .status {
    font-size: 12px;
    color: #999;
  }

  .status.online {
    color: #31a24c;
    font-weight: 500;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #f0f2f5;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: #e4e6eb;
  }

  .icon-btn:active {
    transform: scale(0.95);
  }

  @media (prefers-color-scheme: dark) {
    .chat-header {
      background: #222;
      border-bottom-color: #333;
    }

    .name {
      color: #fff;
    }

    .phone {
      color: #999;
    }

    .icon-btn {
      background: #333;
    }

    .icon-btn:hover {
      background: #444;
    }
  }
</style>
