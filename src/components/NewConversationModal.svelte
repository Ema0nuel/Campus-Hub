<script>
  // @ts-nocheck

  import { createEventDispatcher } from "svelte";
  import { createConversation, searchUserByPhone } from "../lib/api.js";

  const dispatch = createEventDispatcher();

  let phoneInput = "";
  let searchedUser = null;
  let loading = false;
  let error = "";
  let searchError = "";
  let step = "search"; // 'search' | 'confirm'

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
    vibrate([0, 20]);

    try {
      const user = await searchUserByPhone(phoneInput);
      if (!user) {
        searchError = "User not found";
        searchedUser = null;
        vibrate([0, 10, 5, 10]);
      } else {
        searchedUser = user;
        step = "confirm";
        vibrate([0, 30, 50, 30]);
      }
    } catch (err) {
      searchError = err.message;
      vibrate([0, 10, 5, 10]);
    } finally {
      loading = false;
    }
  }

  async function handleCreateConversation() {
    if (!searchedUser?.id) {
      error = "Invalid user selection";
      return;
    }

    loading = true;
    error = "";
    vibrate([0, 20]);

    try {
      const conversation = await createConversation(searchedUser.id);
      if (!conversation?.id) {
        throw new Error("Failed to create conversation");
      }

      vibrate([0, 30, 50, 30]);
      dispatch("created", { conversation });
    } catch (err) {
      error = err.message;
      vibrate([0, 10, 5, 10]);
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
    dispatch("close");
  }
</script>

<div class="modal-overlay" on:click={handleClose}>
  <div class="modal-card" on:click|stopPropagation>
    <div class="modal-header">
      <h2>New Conversation</h2>
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
              disabled={loading}
              inputmode="numeric"
              class:error={!!searchError}
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
              <span class="spinner"></span>
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
                <svg viewBox="0 0 24 24" width="40" height="40">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            {/if}
            <div class="user-info">
              <h3>{searchedUser?.name || "Unknown"}</h3>
              <p>{searchedUser?.phone_number}</p>
            </div>
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
                <span class="spinner"></span>
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
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
    padding: 0;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-card {
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
    animation: slideUp 0.3s ease;
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

  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #000000;
  }

  .close-btn {
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

  .close-btn:active {
    background: rgba(0, 0, 0, 0.05);
  }

  .modal-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .step-description {
    margin: 0 0 24px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
    line-height: 1.5;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type="tel"] {
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.04);
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #000000;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  input[type="tel"]:focus {
    outline: none;
    border-color: #0084ff;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
  }

  input[type="tel"].error {
    border-color: #ef4444;
  }

  input[type="tel"]:disabled {
    opacity: 0.6;
  }

  .error-text {
    font-size: 12px;
    color: #ef4444;
  }

  .error-message {
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #ef4444;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(0, 132, 255, 0.08);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .user-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      rgba(0, 132, 255, 0.2),
      rgba(0, 115, 230, 0.2)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 132, 255, 0.6);
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
  }

  .user-info h3 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #000000;
  }

  .user-info p {
    margin: 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
  }

  .action-btn {
    width: 100%;
    padding: 14px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    min-height: 48px;
  }

  .primary-btn {
    background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
    color: white;
  }

  .primary-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary-btn {
    background: rgba(0, 0, 0, 0.04);
    color: #000000;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .secondary-btn:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
  }

  .button-group {
    display: flex;
    gap: 12px;
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
    animation: spin 0.8s linear infinite;
  }

  .secondary-btn .spinner {
    border-color: rgba(0, 0, 0, 0.3);
    border-top-color: #000000;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-color-scheme: dark) {
    .modal-card {
      background: #111111;
    }

    .modal-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
      color: #ffffff;
    }

    .close-btn {
      color: rgba(255, 255, 255, 0.6);
    }

    .close-btn:active {
      background: rgba(255, 255, 255, 0.08);
    }

    .step-description {
      color: rgba(255, 255, 255, 0.6);
    }

    .label {
      color: rgba(255, 255, 255, 0.8);
    }

    input[type="tel"] {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    input[type="tel"]:focus {
      background: rgba(255, 255, 255, 0.04);
      border-color: #0084ff;
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.15);
    }

    .user-card {
      background: rgba(0, 132, 255, 0.1);
    }

    .user-info h3 {
      color: #ffffff;
    }

    .user-info p {
      color: rgba(255, 255, 255, 0.6);
    }

    .secondary-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .secondary-btn:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  @media (min-width: 768px) {
    .modal-overlay {
      align-items: center;
      padding: 24px;
    }

    .modal-card {
      border-radius: 16px;
      max-height: 80vh;
    }
  }
</style>
