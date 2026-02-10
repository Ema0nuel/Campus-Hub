<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import { checkPhoneAndLogin } from "../store/authStore.js";
  import { isLoading, authError } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let phoneNumber = "";
  let localError = "";

  async function handleLogin() {
    localError = "";

    if (!phoneNumber.trim()) {
      localError = "Phone number is required";
      return;
    }

    try {
      const result = await checkPhoneAndLogin(phoneNumber);
      console.log("[Login] ✅ Success", result);
      dispatch("success", result);
    } catch (error) {
      localError = error.message || "Login failed";
      console.error("[Login] ❌", error);
    }
  }

  function handleKeydown(event) {
    if (event.key === "Enter") {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <!-- Header -->
    <div class="login-header">
      <h1>Welcome Back</h1>
      <p>Enter your phone number to get started</p>
    </div>

    <!-- Error Messages -->
    {#if localError}
      <div class="error-banner" role="alert">
        <span class="error-icon">⚠️</span>
        <span>{localError}</span>
      </div>
    {/if}

    {#if $authError}
      <div class="error-banner" role="alert">
        <span class="error-icon">⚠️</span>
        <span>{$authError}</span>
      </div>
    {/if}

    <!-- Form -->
    <form on:submit|preventDefault={handleLogin} class="login-form">
      <!-- Phone Number Input -->
      <div class="form-group">
        <label for="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          bind:value={phoneNumber}
          disabled={$isLoading}
          on:keydown={handleKeydown}
          aria-label="Phone number"
          aria-invalid={localError ? "true" : "false"}
        />
        <span class="input-hint">Enter your phone number to continue</span>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="login-button"
        disabled={$isLoading}
        aria-busy={$isLoading}
      >
        {#if $isLoading}
          <span class="spinner" />
          <span>Checking...</span>
        {:else}
          <span>Continue</span>
        {/if}
      </button>
    </form>
  </div>

  <!-- Background Gradient -->
  <div class="background-gradient" />
</div>

<style>
  .login-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
    padding: 20px;
    overflow: hidden;
  }

  .background-gradient {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(0, 132, 255, 0.1) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .login-card {
    position: relative;
    width: 100%;
    max-width: 420px;
    padding: 40px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    z-index: 1;
  }

  @media (max-width: 640px) {
    .login-card {
      padding: 20px;
      margin: 16px;
      border-radius: 12px;
    }
    .login-header h1 {
      font-size: 22px;
    }
    .login-header p {
      font-size: 13px;
    }
    .login-button {
      padding: 12px;
    }
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-header h1 {
    font-size: 28px;
    font-weight: 600;
    color: #000;
    margin: 0 0 8px 0;
  }

  .login-header p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 20px;
    background: linear-gradient(
      135deg,
      rgba(244, 67, 54, 0.1),
      rgba(229, 57, 53, 0.05)
    );
    border: 1px solid rgba(244, 67, 54, 0.15);
    border-radius: 8px;
    color: #d32f2f;
    font-size: 13px;
  }

  .error-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }

  .form-group input {
    padding: 12px 16px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #0084ff;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.1);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .input-hint {
    font-size: 12px;
    color: #999;
  }

  .password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-wrapper input {
    width: 100%;
    padding-right: 45px;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    padding: 4px;
  }

  .toggle-password:hover {
    opacity: 1;
  }

  .login-button {
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 132, 255, 0.3);
  }

  .login-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .login-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: #666;
  }

  .login-footer a {
    color: #0084ff;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }

  .login-footer a:hover {
    color: #0073e6;
  }

  @media (prefers-color-scheme: dark) {
    .login-container {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    }

    .login-card {
      background: #111;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    .login-header h1 {
      color: #fff;
    }

    .login-header p {
      color: #aaa;
    }

    .form-group label {
      color: #ddd;
    }

    .form-group input {
      background: #1a1a1a;
      border-color: #333;
      color: #fff;
    }

    .form-group input:focus {
      border-color: #0084ff;
      background: #222;
    }

    .login-footer {
      color: #aaa;
    }
  }
</style>
