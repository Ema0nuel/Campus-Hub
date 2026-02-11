<script>
  // @ts-nocheck

  import { onMount, createEventDispatcher } from "svelte";
  import ProfileContainer from "../components/ProfileContainer.svelte";
  import TopBar from "../components/TopBar.svelte";
  import TextInput from "../components/TextInput.svelte";
  import PrimaryButton from "../components/PrimaryButton.svelte";
  import {
    updateUserProfile,
    getUserById,
  } from "../services/supabaseService.js";
  import {
    uploadAvatarToStorage,
    deleteAvatarFromStorage,
    fileToBase64,
  } from "../hook/storeData.js";
  import { currentUserId, currentUser } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let name = "";
  let email = "";
  let avatarUrl = "";
  let oldAvatarUrl = "";
  let avatarFile = null;
  let avatarPreview = "";
  let loading = false;
  let initialLoading = true;
  let error = "";
  let success = "";
  let nameError = "";
  let emailError = "";
  let hasChanges = false;
  let userId = "";

  // Subscribe to user ID
  const unsubscribeUserId = currentUserId.subscribe((id) => {
    userId = id;
  });

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

      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      console.log("[UpdateProfile] Loading profile for:", userId.slice(0, 8));

      const user = await getUserById(userId);

      name = user.name || "";
      email = user.email || "";
      avatarUrl = user.avatar_url || "";
      avatarPreview = user.avatar_url || "";
      oldAvatarUrl = user.avatar_url || "";

      console.log("[UpdateProfile] ✅ Profile loaded:", {
        userId: user.id?.slice(0, 8),
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      error = "Only JPEG, PNG, and WebP images are supported";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error = "Image must be smaller than 5MB";
      return;
    }

    avatarFile = file;
    error = "";

    // Create preview
    fileToBase64(file).then((preview) => {
      avatarPreview = preview;
    });

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

      // Handle avatar upload/delete
      if (avatarFile) {
        console.log("[UpdateProfile] Uploading new avatar...");
        const { url, error: uploadError } = await uploadAvatarToStorage(
          avatarFile,
          userId,
        );

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError}`);
        }

        finalAvatarUrl = url;

        // Delete old avatar if it exists and is different
        if (oldAvatarUrl && oldAvatarUrl !== finalAvatarUrl) {
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

      // Update profile in Supabase
      console.log("[UpdateProfile] Updating user profile...");
      const updatedUser = await updateUserProfile(userId, {
        name: name.trim(),
        email: email.trim(),
        avatar_url: finalAvatarUrl,
      });

      if (updatedUser && updatedUser.id) {
        console.log("[UpdateProfile] ✅ Profile updated successfully");

        // Clear avatar file to prevent re-upload
        avatarFile = null;
        success = "Profile updated successfully!";
        vibrate([0, 30, 50, 30]);

        // Wait a moment before closing
        setTimeout(() => {
          dispatch("close");
        }, 1500);
      } else {
        throw new Error("Update failed: no user data returned");
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
    dispatch("close");
    vibrate(8);
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
    console.log("[UpdateProfile] 🎬 Mounted");
    if (userId) {
      loadUserProfile();
    }

    return () => {
      unsubscribeUserId();
    };
  });
</script>

<ProfileContainer>
  <div class="profile-wrapper">
    <TopBar title="Edit Profile" onLogout={handleLogout} />

    {#if initialLoading}
      <div class="loading-state">
        <div class="spinner" />
        <p>Loading profile...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="profile-form">
        <div class="form-content">
          <!-- Avatar Section -->
          <div class="avatar-section">
            <div class="avatar-placeholder">
              {#if avatarPreview}
                <img src={avatarPreview} alt="Your avatar" class="avatar-image" />
              {:else}
                <div class="avatar-default">👤</div>
              {/if}
            </div>
            <button
              type="button"
              class="upload-btn"
              on:click={() => document.querySelector(".avatar-input")?.click()}
              disabled={loading}
            >
              {avatarPreview || avatarUrl ? "Change Photo" : "Add Photo"}
            </button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              on:change={handleAvatarSelect}
              disabled={loading}
              class="avatar-input"
              hidden
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

          <!-- Email Input (Required) -->
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            error={emailError}
            disabled={loading}
            on:change={handleEmailChange}
            on:keypress={handleKeyPress}
          />

          <!-- Error Message -->
          {#if error}
            <div class="error-message" role="alert">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M12 8v4m0 4v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              {error}
            </div>
          {/if}

          <!-- Success Message -->
          {#if success}
            <div class="success-message" role="status">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M9 16.2L4.8 12m0 0-1.4-1.4m1.4 1.4L9 19m7-7v7a2 2 0 01-2 2H7a2 2 0 01-2-2V9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              {success}
            </div>
          {/if}
        </div>

        <div class="form-footer">
          <div class="button-group">
            <button
              type="button"
              class="secondary-button"
              on:click={handleBack}
              disabled={loading}
            >
              Cancel
            </button>
            <PrimaryButton
              label={loading ? "Saving..." : "Save Changes"}
              {loading}
              disabled={loading || !hasChanges || !!nameError || !!emailError}
              on:click={handleSubmit}
            />
          </div>
          <p class="footer-text">
            Changes are saved to your profile and will be visible to other users.
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

  .avatar-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .avatar-placeholder {
    width: 120px;
    height: 120px;
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
    font-size: 48px;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-btn {
    padding: 10px 24px;
    background: #0084ff;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn:hover:not(:disabled) {
    background: #0073e6;
  }

  .upload-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .upload-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .avatar-input {
    display: none;
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

  .form-footer {
    padding: 16px 24px 32px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .button-group {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .secondary-button {
    flex: 1;
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

  .secondary-button:hover:not(:disabled) {
    border-color: rgba(0, 0, 0, 0.4);
    background: rgba(0, 0, 0, 0.02);
  }

  .secondary-button:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
    transform: scale(0.98);
  }

  .secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    .secondary-button:hover:not(:disabled) {
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.02);
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

  @media (max-width: 640px) {
    .form-content {
      padding: 24px 16px 20px;
      gap: 20px;
    }

    .avatar-placeholder {
      width: 100px;
      height: 100px;
    }

    .avatar-default {
      font-size: 40px;
    }

    .avatar-section {
      gap: 12px;
    }

    .upload-btn {
      width: 100%;
    }

    .button-group {
      gap: 10px;
    }

    .form-footer {
      padding: 12px 16px 24px;
      gap: 12px;
    }

    .footer-text {
      font-size: 11px;
    }
  }
</style>
