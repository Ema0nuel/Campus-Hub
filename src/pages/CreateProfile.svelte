<script>
  // @ts-nocheck

  import { createEventDispatcher } from "svelte";
  import TopBar from "../components/TopBar.svelte";
  import TextInput from "../components/TextInput.svelte";
  import PrimaryButton from "../components/PrimaryButton.svelte";
  import { updateProfile } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let name = "";
  let bio = "";
  let avatarUrl = "";
  let loading = false;
  let error = "";
  let nameError = "";

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function handleNameChange(e) {
    name = e.detail;
    nameError = !name.trim() ? "Name is required" : "";
  }

  function handleBioChange(e) {
    bio = e.detail;
  }

  function handleAvatarChange(e) {
    avatarUrl = e.detail;
  }

  async function handleSubmit() {
    // Validate
    nameError = !name.trim() ? "Name is required" : "";
    error = "";

    if (nameError) {
      vibrate([0, 10, 5, 10]);
      return;
    }

    loading = true;
    vibrate([0, 30]);

    try {
      console.log("[CreateProfile] Updating profile with name:", name);

      // Update profile via Supabase
      await updateProfile({
        name: name.trim(),
        email: avatarUrl || undefined,
        avatar_url: avatarUrl || null,
        status: "online",
      });

      console.log("[CreateProfile] ✅ Profile updated successfully");

      vibrate([0, 30, 50, 30]);
      dispatch("complete");
    } catch (err) {
      console.error("[CreateProfile] ❌ Error:", err.message);
      error = err.message || "Failed to update profile";
      loading = false;
      vibrate([0, 10, 5, 10]);
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !loading && name && !nameError) {
      handleSubmit();
    }
  }
</script>

<div class="profile-container">
  <TopBar title="Complete Your Profile" />

  <form on:submit|preventDefault={handleSubmit} class="profile-form">
    <div class="form-content">
      <!-- Avatar Preview -->
      <div class="avatar-section">
        <div class="avatar-placeholder">
          {#if avatarUrl}
            <img src={avatarUrl} alt="Your avatar" class="avatar-image" />
          {:else}
            <div class="avatar-default">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                />
              </svg>
            </div>
          {/if}
        </div>
        <input
          type="text"
          placeholder="Avatar URL (optional)"
          bind:value={avatarUrl}
          class="avatar-input"
          disabled={loading}
        />
      </div>

      <!-- Name Input (Required) -->
      <TextInput
        label="Full Name"
        placeholder="Enter your name"
        value={name}
        error={nameError}
        disabled={loading}
        on:change={handleNameChange}
        on:keypress={handleKeyPress}
      />

      <!-- Bio Input (Optional) -->
      <div class="bio-input-wrapper">
        <label for="bio" class="label">Bio (Optional)</label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself..."
          bind:value={bio}
          disabled={loading}
          class="bio-textarea"
          rows="3"
        />
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="error-message" role="alert">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          {error}
        </div>
      {/if}

      <!-- Submit Button -->
      <PrimaryButton
        label={loading ? "Saving..." : "Complete Profile"}
        {loading}
        disabled={loading || !name || !!nameError}
        on:click={handleSubmit}
      />
    </div>

    <div class="form-footer">
      <p class="footer-text">
        You can update your profile anytime. Your information helps other users
        connect with you.
      </p>
    </div>
  </form>
</div>

<style>
  .profile-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: #fff;
    overflow: hidden;
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .avatar-default {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .avatar-input:focus {
    border-color: #0084ff;
  }

  .avatar-input:disabled {
    background: rgba(0, 0, 0, 0.05);
    cursor: not-allowed;
  }

  :global(.label) {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.8);
    margin-bottom: 8px;
  }

  .bio-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bio-textarea {
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
  }

  .bio-textarea:focus {
    border-color: #0084ff;
  }

  .bio-textarea:disabled {
    background: rgba(0, 0, 0, 0.05);
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  }

  .form-footer {
    padding: 16px 24px 32px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .footer-text {
    margin: 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
    line-height: 1.5;
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

  @media (prefers-color-scheme: dark) {
    .profile-container {
      background: #0a0a0a;
    }

    .avatar-input,
    .bio-textarea {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .avatar-input:focus,
    .bio-textarea:focus {
      border-color: #0084ff;
    }

    .avatar-input:disabled,
    .bio-textarea:disabled {
      background: rgba(255, 255, 255, 0.02);
    }

    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
    }

    .form-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    .footer-text {
      color: rgba(255, 255, 255, 0.6);
    }

    :global(.label) {
      color: rgba(255, 255, 255, 0.9);
    }
  }
</style>
