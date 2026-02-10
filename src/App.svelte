<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { initialize } from "./store/authStore.js";
  import Login from "./pages/Login.svelte";
  import CreateProfile from "./pages/CreateProfile.svelte";
  import Conversation from "./pages/Conversation.svelte";
  import UpdateProfile from "./pages/UpdateProfile.svelte";
  import ChatWindow from "./components/ChatWindow.svelte";

  let currentPage = "loading";
  let selectedConversationData = null;
  let initError = "";

  onMount(async () => {
    try {
      const result = await initialize();

      if (!result.valid) {
        currentPage = "login";
      } else if (!result.profileComplete) {
        currentPage = "create-profile";
      } else {
        currentPage = "conversations";
      }
    } catch (error) {
      console.error("[App] Init failed:", error);
      initError = error.message;
      currentPage = "login";
    }
  });

  function handleLoginSuccess(event) {
    console.log("[App] Login success:", event.detail);
    const { isNewUser } = event.detail;

    if (isNewUser) {
      currentPage = "create-profile";
    } else {
      currentPage = "conversations";
    }
  }

  function handleConversationSelected(event) {
    console.log("[App] Conversation selected");
    selectedConversationData = event.detail;
    currentPage = "chat";
  }

  function handleChatClosed() {
    console.log("[App] Chat closed");
    selectedConversationData = null;
    currentPage = "conversations";
  }

  function handleLogout() {
    currentPage = "login";
    selectedConversationData = null;
  }

  function handleOpenSettings() {
    currentPage = "update-profile";
  }

  function handleCloseUpdateProfile() {
    currentPage = "conversations";
  }

  function handleProfileComplete() {
    currentPage = "conversations";
  }
</script>

<div class="app-container">
  {#if currentPage === "loading"}
    <div class="loading-screen">
      <div class="spinner" />
      <p>Initializing...</p>
    </div>
  {:else if currentPage === "login"}
    <Login on:success={handleLoginSuccess} />
  {:else if currentPage === "create-profile"}
    <CreateProfile on:complete={handleProfileComplete} />
  {:else if currentPage === "conversations"}
    <Conversation
      on:conversation-selected={handleConversationSelected}
      on:logout={handleLogout}
      on:open-settings={handleOpenSettings}
    />
  {:else if currentPage === "update-profile"}
    <UpdateProfile on:close={handleCloseUpdateProfile} />
  {:else if currentPage === "chat" && selectedConversationData}
    <ChatWindow
      participantId={selectedConversationData.participant_id}
      participantName={selectedConversationData.participant_name || "User"}
      participantPhone={selectedConversationData.participant_phone || ""}
      on:back={handleChatClosed}
    />
  {/if}

  {#if initError}
    <div class="error-banner">
      <p>⚠️ Error: {initError}</p>
      <button on:click={() => (window.location.href = "/")}>Reload</button>
    </div>
  {/if}
</div>

<style>
  .app-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #fff;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e0e0e0;
    border-top-color: #0084ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-screen p {
    margin-top: 16px;
    color: #666;
    font-size: 14px;
  }

  .auth-link {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 13px;
    color: #666;
    display: flex;
    gap: 6px;
    z-index: 500;
  }

  .link-button {
    background: none;
    border: none;
    color: #0084ff;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }

  .link-button:hover {
    color: #0073e6;
  }

  .error-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #d32f2f;
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 9999;
  }

  .error-banner p {
    margin: 0;
  }

  .error-banner button {
    background: white;
    color: #d32f2f;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }

  @media (prefers-color-scheme: dark) {
    .loading-screen {
      background: #0a0a0a;
    }

    .loading-screen p {
      color: #aaa;
    }

    .auth-link {
      color: #aaa;
    }
  }
</style>
