<script>
  // @ts-nocheck

  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import TopBar from "../components/TopBar.svelte";
  import TextInput from "../components/TextInput.svelte";
  import PrimaryButton from "../components/PrimaryButton.svelte";
  import {
    updateUserProfile,
    createUser,
  } from "../services/supabaseService.js";
  import { uploadAvatarToStorage, fileToBase64 } from "../hook/storeData.js";
  import {
    currentUserId,
    currentUserPhone,
    setAuthUser,
  } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let name = "";
  let email = "";
  let avatarFile = null;
  let avatarPreview = "";
  let loading = false;
  let error = "";
  let success = "";
  let nameError = "";
  let emailError = "";
  let userId = "";
  let userPhone = "";

  // Subscribe to user ID and phone
  const unsubscribeUserId = currentUserId.subscribe((id) => {
    userId = id;
  });

  const unsubscribePhone = currentUserPhone.subscribe((phone) => {
    userPhone = phone;
  });

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  function handleNameChange(e) {
    name = e.detail;
    nameError = !name.trim() ? "Name is required" : "";
  }

  function handleEmailChange(e) {
    email = e.detail;
    emailError = !validateEmail(email) ? "Enter a valid email" : "";
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
  }

  async function handleSubmit() {
    // Validate
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
      console.log("[CreateProfile] Starting profile creation with:", {
        name,
        email,
        userId,
        userPhone,
      });

      let currentUserId = userId;

      // If no userId, create user in database first
      if (!currentUserId && userPhone) {
        console.log("[CreateProfile] Creating new user with phone:", userPhone);
        const newUser = await createUser({
          phone_number: userPhone,
          name: name.trim(),
          email: email.trim(),
          status: "online",
        });

        currentUserId = newUser.id;
        console.log(
          "[CreateProfile] 🎉 New user created with ID:",
          currentUserId.slice(0, 8),
        );

        // Update auth store with new user
        setAuthUser(newUser);
      }

      if (!currentUserId) {
        throw new Error("Failed to get or create user ID");
      }

      let finalAvatarUrl = null;

      // Upload avatar if selected
      if (avatarFile) {
        console.log(
          "[CreateProfile] Uploading avatar for:",
          currentUserId.slice(0, 8),
        );
        const { url, error: uploadError } = await uploadAvatarToStorage(
          avatarFile,
          currentUserId,
        );

        if (uploadError) {
          throw new Error(uploadError);
        }

        finalAvatarUrl = url;
      }

      // Update profile in Supabase with avatar URL
      const updatedUser = await updateUserProfile(currentUserId, {
        name: name.trim(),
        email: email.trim(),
        avatar_url: finalAvatarUrl,
        is_active: true,
      });

      // Update auth store with updated user
      setAuthUser(updatedUser);

      console.log("[CreateProfile] ✅ Profile created successfully");

      success = "Profile created successfully!";
      vibrate([0, 30, 50, 30]);

      // Wait a moment before redirecting
      setTimeout(() => {
        dispatch("complete");
      }, 500);
    } catch (err) {
      console.error("[CreateProfile] ❌ Error:", err.message);
      error = err.message || "Failed to create profile";
      loading = false;
      vibrate([0, 10, 5, 10]);
    }
  }

  function handleKeyPress(e) {
    if (
      e.key === "Enter" &&
      !loading &&
      name &&
      email &&
      !nameError &&
      !emailError
    ) {
      handleSubmit();
    }
  }

  onMount(() => {
    console.log(
      "[CreateProfile] Mounted with user:",
      userId?.slice(0, 8),
      "phone:",
      userPhone?.slice(0, 5),
    );
  });

  onDestroy(() => {
    unsubscribeUserId();
    unsubscribePhone();
  });
</script>

<div class="profile-container">
  <TopBar title="Complete Your Profile" />

  <form on:submit|preventDefault={handleSubmit} class="profile-form">
    <div class="form-content">
      <!-- Avatar Upload -->
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
          {avatarPreview ? "Change Photo" : "Add Photo"}
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
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M12 8v4m0 4v.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
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

      <!-- Submit Button -->
      <PrimaryButton
        label={loading ? "Saving..." : "Complete Profile"}
        {loading}
        disabled={loading ||
          !name ||
          !email ||
          !!nameError ||
          !!emailError ||
          (!userId && !userPhone)}
        on:click={handleSubmit}
      />
    </div>

    <div class="form-footer">
      <p class="footer-text">
        Complete your profile to start chatting with other users. You can update
        your information anytime.
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
    position: relative;
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

    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
    }

    .success-message {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
    }

    .form-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    .footer-text {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  @media (max-width: 640px) {
    .form-content {
      padding: 24px 16px;
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

    .form-footer {
      padding: 12px 16px 24px;
    }

    .footer-text {
      font-size: 11px;
    }
  }
</style>
