<script>
  // @ts-nocheck

  import { createEventDispatcher } from "svelte";
  import { getUserByPhone, getOrCreateConversation } from "../services/supabaseService.js";
  import { currentUserId } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let phoneInput = "";
  let searchedUser = null;
  let loading = false;
  let error = "";
  let searchError = "";
  let step = "search"; // 'search' | 'confirm'
  let userId = "";

  // Subscribe to user ID
  const unsubscribeUserId = currentUserId.subscribe((id) => {
    userId = id;
  });

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  async function handleSearch() {
    if (!phoneInput.trim()) {
      searchError = "Enter a phone number";
      return;
    }

    loading = true;
    searchError = "";
    error = "";
    vibrate([0, 20]);

    try {
      console.log("[NewConversationModal] Searching for user:", phoneInput);

      const user = await getUserByPhone(phoneInput);

      if (!user) {
        searchError = "User not found with this phone number";
        searchedUser = null;
        vibrate([0, 10, 5, 10]);
        console.log("[NewConversationModal] User not found");
        return;
      }

      // Don't allow creating conversation with yourself
      if (user.id === userId) {
        searchError = "You cannot start a conversation with yourself";
        searchedUser = null;
        vibrate([0, 10, 5, 10]);
        console.log("[NewConversationModal] Cannot chat with yourself");
        return;
      }

      searchedUser = user;
      step = "confirm";
      vibrate([0, 30, 50, 30]);
      console.log("[NewConversationModal] ✅ User found:", user.name);
    } catch (err) {
      searchError = err.message || "Search failed";
      vibrate([0, 10, 5, 10]);
      console.error("[NewConversationModal] Search error:", err);
    } finally {
      loading = false;
    }
  }

  async function handleCreateConversation() {
    if (!searchedUser?.id) {
      error = "Invalid user selection";
      return;
    }

    if (!userId) {
      error = "User not authenticated";
      return;
    }

    loading = true;
    error = "";
    vibrate([0, 20]);

    try {
      console.log("[NewConversationModal] Creating conversation with:", searchedUser.id);

      const conversation = await getOrCreateConversation(userId, searchedUser.id);

      if (!conversation?.id) {
        throw new Error("Failed to create conversation");
      }

      console.log("[NewConversationModal] ✅ Conversation created:", conversation.id);

      vibrate([0, 30, 50, 30]);
      dispatch("created", { conversation });
    } catch (err) {
      error = err.message || "Failed to create conversation";
      vibrate([0, 10, 5, 10]);
      console.error("[NewConversationModal] Create error:", err);
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    step = "search";
    searchedUser = null;
    error = "";
    vibrate(8);
  }

  function handleClose() {
    vibrate(8);
    unsubscribeUserId();
    dispatch("close");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && step === "search" && !loading && phoneInput.trim()) {
      handleSearch();
    }
  }
</script>

<div class="modal-overlay" on:click={handleClose}>
  <div class="modal-card" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{step === "search" ? "New Conversation" : "Start Chat?"}</h2>
      <button class="close-btn" on:click={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="modal-content">
      {#if step === "search"}
        <div class="search-step">
          <p class="step-description">
            Enter the phone number of the person you want to chat with
          </p>

          <div class="input-group">
            <label for="phone-input" class="label">Phone Number</label>
            <input
              id="phone-input"
              type="tel"
              placeholder="+234 80123456789"
              bind:value={phoneInput}
              on:keypress={handleKeyPress}
              disabled={loading}
              inputmode="tel"
              class:error={!!searchError}
              aria-label="Phone number input"
            />
            {#if searchError}
              <div class="error-text">{searchError}</div>
            {/if}
          </div>

          <button
            class="action-btn primary-btn"
            on:click={handleSearch}
            disabled={loading || !phoneInput.trim()}
          >
            {#if loading}
              <span class="spinner" />
              Searching...
            {:else}
              Search User
            {/if}
          </button>
        </div>
      {:else if step === "confirm"}
        <div class="confirm-step">
          <div class="user-card">
            {#if searchedUser?.avatar_url}
              <img
                src={searchedUser.avatar_url}
                alt={searchedUser.name}
                class="user-avatar"
              />
            {:else}
              <div class="avatar-placeholder">
                {searchedUser?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            {/if}

            <h3 class="user-name">{searchedUser?.name || "Unknown"}</h3>
            <p class="user-phone">{searchedUser?.phone_number}</p>

            {#if searchedUser?.status}
              <span class="user-status" class:online={searchedUser.status === "online"}>
                {searchedUser.status === "online" ? "● Online" : "● Offline"}
              </span>
            {/if}
          </div>

          {#if error}
            <div class="error-message">{error}</div>
          {/if}

          <div class="button-group">
            <button
              class="action-btn secondary-btn"
              on:click={handleBack}
              disabled={loading}
            >
              Back
            </button>
            <button
              class="action-btn primary-btn"
              on:click={handleCreateConversation}
              disabled={loading}
            >
              {#if loading}
                <span class="spinner" />
                Creating...
              {:else}
                Start Chat
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 2000;
    backdrop-filter: blur(2px);
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(2px);
    }
  }

  .modal-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #000;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .close-btn:active {
    transform: scale(0.95);
  }

  .modal-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .search-step,
  .confirm-step {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .step-description {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input {
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  input:focus {
    border-color: #0084ff;
    box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
    background: #fff;
  }

  input.error {
    border-color: #ef4444;
  }

  input:disabled {
    background: rgba(0, 0, 0, 0.05);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .error-text {
    font-size: 12px;
    color: #ef4444;
    font-weight: 500;
  }

  .error-message {
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
  }

  .user-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 32px;
    font-weight: 600;
  }

  .user-name {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #000;
  }

  .user-phone {
    margin: 0;
    font-size: 13px;
    color: #666;
  }

  .user-status {
    font-size: 12px;
    color: #999;
    padding: 4px 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
  }

  .user-status.online {
    color: #31a24c;
    background: rgba(49, 162, 76, 0.1);
  }

  .action-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .primary-btn {
    background: #0084ff;
    color: white;
  }

  .primary-btn:hover:not(:disabled) {
    background: #0073e6;
  }

  .primary-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .secondary-btn {
    background: transparent;
    color: #0084ff;
    border: 2px solid #0084ff;
  }

  .secondary-btn:hover:not(:disabled) {
    background: rgba(0, 132, 255, 0.05);
  }

  .secondary-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .secondary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-group {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .button-group .action-btn {
    flex: 1;
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-color-scheme: dark) {
    .modal-card {
      background: #1a1a1a;
    }

    .modal-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
      color: #fff;
    }

    .close-btn {
      color: #aaa;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .step-description {
      color: #aaa;
    }

    .label {
      color: rgba(255, 255, 255, 0.7);
    }

    input {
      background: #2a2a2a;
      border-color: rgba(255, 255, 255, 0.1);
      color: #e8e8e8;
    }

    input:focus {
      border-color: #0084ff;
      background: #333;
    }

    input:disabled {
      background: rgba(255, 255, 255, 0.02);
    }

    .user-card {
      background: rgba(255, 255, 255, 0.05);
    }

    .user-name {
      color: #fff;
    }

    .user-phone {
      color: #aaa;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
    }
  }

  @media (max-width: 640px) {
    .modal-overlay {
      padding: 0;
      align-items: flex-end;
    }

    .modal-card {
      border-radius: 16px 16px 0 0;
      max-width: 100%;
      max-height: 90vh;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-content {
      padding: 20px;
    }

    .action-btn {
      width: 100%;
    }

    .button-group .action-btn {
      flex: 1;
    }
  }
</style>
