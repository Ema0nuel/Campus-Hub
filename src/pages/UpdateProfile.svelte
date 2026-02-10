<script>
  // @ts-nocheck

  import { onMount, createEventDispatcher } from "svelte";
  import ProfileContainer from "../components/ProfileContainer.svelte";
  import TopBar from "../components/TopBar.svelte";
  import AvatarPicker from "../components/AvatarPicker.svelte";
  import TextInput from "../components/TextInput.svelte";
  import PrimaryButton from "../components/PrimaryButton.svelte";
  import {
    updateUserProfile,
    getUserProfile,
    getCurrentUserId,
  } from "../lib/api.js";
  import {
    uploadAvatarToStorage,
    deleteAvatarFromStorage,
  } from "../hook/storeData.js";
  import { currentUser } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let name = "";
  let email = "";
  let avatarUrl = "";
  let oldAvatarUrl = "";
  let avatarFile = null;
  let loading = false;
  let initialLoading = true;
  let error = "";
  let success = "";
  let nameError = "";
  let emailError = "";
  let hasChanges = false;

  // Auto-subscription to store
  $: currentUserData = $currentUser;

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  async function loadUserProfile() {
    try {
      initialLoading = true;
      error = "";
      const userId = getCurrentUserId();

      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      const user = await getUserProfile(userId);

      name = user.name || "";
      email = user.email || "";
      avatarUrl = user.avatar_url || "";
      oldAvatarUrl = user.avatar_url || "";

      console.log("[UpdateProfile] Loaded user data:", {
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      error = err.message || "Failed to load profile";
      console.error("[UpdateProfile] Load error:", err);
    } finally {
      initialLoading = false;
    }
  }

  function handleNameChange(e) {
    name = e.detail;
    nameError = !name.trim() ? "Name is required" : "";
    checkForChanges();
  }

  function handleEmailChange(e) {
    email = e.detail;
    emailError = !validateEmail(email) ? "Enter a valid email" : "";
    checkForChanges();
  }

  function handleAvatarSelect(e) {
    const file = e.detail.file;
    const preview = e.detail.preview;
    avatarFile = file;
    avatarUrl = preview;
    vibrate([0, 15, 10, 15]);
    checkForChanges();
  }

  function checkForChanges() {
    const nameChanged = name.trim() !== (currentUserData?.name || "");
    const emailChanged = email.trim() !== (currentUserData?.email || "");
    const avatarChanged = !!avatarFile;

    hasChanges = nameChanged || emailChanged || avatarChanged;
  }

  async function handleSubmit() {
    nameError = !name.trim() ? "Name is required" : "";
    emailError = !validateEmail(email) ? "Enter a valid email" : "";
    error = "";
    success = "";

    if (nameError || emailError) {
      vibrate([0, 10, 5, 10]);
      return;
    }

    loading = true;
    vibrate([0, 30]);

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const userId = getCurrentUserId();
        const { url, error: uploadError } = await uploadAvatarToStorage(
          avatarFile,
          userId,
        );

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError}`);
        }

        finalAvatarUrl = url;

        if (oldAvatarUrl && oldAvatarUrl !== url) {
          try {
            await deleteAvatarFromStorage(oldAvatarUrl, userId);
            console.log("[UpdateProfile] Old avatar deleted");
          } catch (deleteErr) {
            console.warn(
              "[UpdateProfile] Failed to delete old avatar:",
              deleteErr,
            );
          }
        }
      }

      const updatedUser = await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        avatar_url: finalAvatarUrl,
      });

      if (updatedUser && updatedUser.id) {
        const userData = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar_url: updatedUser.avatar_url,
          phone_number: updatedUser.phone_number,
        };

        // WORKAROUND: Update localStorage directly, then reload currentUser from store
        localStorage.setItem("user", JSON.stringify(userData));

        // Force store re-subscription by reading fresh from localStorage
        const stored = JSON.parse(localStorage.getItem("user"));
        currentUser.set(stored);

        oldAvatarUrl = finalAvatarUrl;
        avatarFile = null;
        hasChanges = false;
        loading = false;

        success = "Profile updated successfully!";
        vibrate([0, 30, 50, 30]);

        console.log("[UpdateProfile] Profile updated successfully:", userData);

        setTimeout(() => {
          dispatch("close");
        }, 1500);
      } else {
        throw new Error("Profile update failed: Invalid response");
      }
    } catch (err) {
      error = err.message || "Profile update failed";
      loading = false;
      console.error("[UpdateProfile] Update error:", err);
      vibrate([0, 10, 5, 10]);
    }
  }

  function handleLogout() {
    vibrate(8);
    dispatch("logout");
  }

  function handleBack() {
    window.location.href = "/conversations";
    vibrate(8);
    dispatch("close");
  }

  function handleKeyPress(e) {
    if (
      e.key === "Enter" &&
      !loading &&
      name &&
      email &&
      !nameError &&
      !emailError &&
      hasChanges
    ) {
      handleSubmit();
    }
  }

  onMount(() => {
    loadUserProfile();
  });
</script>

<ProfileContainer>
  <div class="profile-wrapper">
    <TopBar title="Edit Profile" onLogout={handleLogout} />

    {#if initialLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="profile-form">
        <div class="form-content">
          <AvatarPicker {avatarUrl} on:avatarSelect={handleAvatarSelect} />

          <TextInput
            label="Full Name"
            placeholder="John Doe"
            value={name}
            error={nameError}
            disabled={loading}
            on:change={handleNameChange}
            on:focus={() => vibrate(10)}
            on:keypress={handleKeyPress}
          />

          <TextInput
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={email}
            error={emailError}
            disabled={loading}
            on:change={handleEmailChange}
            on:focus={() => vibrate(10)}
            on:keypress={handleKeyPress}
          />

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

          {#if success}
            <div class="success-message" role="status">
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
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {success}
            </div>
          {/if}

          <PrimaryButton
            label={loading ? "Updating..." : "Save Changes"}
            {loading}
            disabled={loading ||
              !name ||
              !email ||
              !!nameError ||
              !!emailError ||
              !hasChanges}
            on:click={handleSubmit}
          />

          <button
            type="button"
            class="secondary-button"
            disabled={loading}
            on:click={handleBack}
          >
            Cancel
          </button>
        </div>

        <div class="form-footer">
          <p class="footer-text">
            Keep your profile up to date so other users can better understand
            who you are.
          </p>
        </div>
      </form>
    {/if}
  </div>
</ProfileContainer>

<style>
  .profile-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex: 1;
    padding: 32px 24px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #0084ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    margin: 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0;
    margin: 0;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;
    padding: 32px 24px 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
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

  .success-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 8px;
    color: #22c55e;
    font-size: 13px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  }

  .secondary-button {
    padding: 12px 24px;
    background: transparent;
    border: 2px solid rgba(0, 0, 0, 0.2);
    color: #000000;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .secondary-button:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
    transform: scale(0.98);
  }

  .secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
    }
    .success-message {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
    }
    .secondary-button {
      border-color: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    .secondary-button:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
    }
    .form-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
    .footer-text {
      color: rgba(255, 255, 255, 0.6);
    }
    .loading-state p {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  @media (min-width: 768px) {
    .form-content {
      padding: 40px 32px 32px;
      max-width: 400px;
      margin: 0 auto;
      width: 100%;
    }
    .form-footer {
      padding: 24px 32px 40px;
      max-width: 400px;
      margin: 0 auto;
      width: 100%;
      border-top: none;
    }
  }
</style>
