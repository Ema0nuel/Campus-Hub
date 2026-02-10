<script>
  export let title = "Campus Hub";
  export let avatarUrl = "";
  import { createEventDispatcher } from "svelte";

  export let onSettings = () => {};
  export let onLogout = () => {};

  const dispatch = createEventDispatcher();

  let showMenu = false;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleSettings() {
    showMenu = false;
    try {
      onSettings && onSettings();
    } catch (e) {
      console.warn("TopBar onSettings handler error:", e);
    }
    dispatch("settings");
  }

  function handleLogout() {
    showMenu = false;
    try {
      onLogout && onLogout();
    } catch (e) {
      console.warn("TopBar onLogout handler error:", e);
    }
    dispatch("logout");
  }

  function handleMenuMouseLeave() {
    showMenu = false;
  }
</script>

<div class="topbar">
  <div class="topbar-content">
    <div class="left-section">
      {#if avatarUrl}
        <img src={avatarUrl} alt="Profile" class="avatar" />
      {:else}
        <div class="avatar-placeholder">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill="currentColor"
            />
          </svg>
        </div>
      {/if}
      <h1 class="title">{title}</h1>
    </div>

    <div class="right-section">
      <button
        class="icon-btn settings-btn"
        on:click={toggleMenu}
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>

      {#if showMenu}
        <div class="dropdown-menu" on:mouseleave={handleMenuMouseLeave}>
          <button class="menu-item" on:click={handleSettings}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.16.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.52l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.48.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.16-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.34.24.52.49.52h4c.25 0 .46-.18.49-.52l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.48-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
                fill="currentColor"
              />
            </svg>
            Settings
          </button>
          <button class="menu-item logout-item" on:click={handleLogout}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                fill="currentColor"
              />
            </svg>
            Logout
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .topbar {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: #ffffff;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .topbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .left-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid #0084ff;
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 132, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0084ff;
    flex-shrink: 0;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #000000;
    letter-spacing: -0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .icon-btn:active {
    background: rgba(0, 0, 0, 0.05);
  }

  .settings-btn.active {
    background: rgba(0, 132, 255, 0.1);
    color: #0084ff;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    min-width: 160px;
    z-index: 20;
    margin-top: 4px;
    overflow: hidden;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    color: #000000;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
  }

  .menu-item:active {
    background: rgba(0, 0, 0, 0.04);
  }

  .menu-item.logout-item {
    color: #ef4444;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 768px) {
    .topbar {
      padding: 20px 24px;
    }

    .title {
      font-size: 20px;
    }
  }

  @media (prefers-color-scheme: dark) {
    .topbar {
      background: #111111;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .title {
      color: #ffffff;
    }

    .icon-btn {
      color: rgba(255, 255, 255, 0.6);
    }

    .icon-btn:active {
      background: rgba(255, 255, 255, 0.08);
    }

    .dropdown-menu {
      background: #222222;
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .menu-item {
      color: #ffffff;
    }

    .menu-item:active {
      background: rgba(255, 255, 255, 0.08);
    }

    .menu-item.logout-item {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
  }
</style>
