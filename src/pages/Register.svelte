<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import { registerWithPhone } from "../store/authStore.js";
  import { isLoading, authError } from "../store/authStore.js";

  const dispatch = createEventDispatcher();

  let phoneNumber = "";
  let password = "";
  let confirmPassword = "";
  let localError = "";
  let showPassword = false;
  let showConfirmPassword = false;

  async function handleRegister() {
    localError = "";

    // Validation
    if (!phoneNumber.trim()) {
      localError = "Phone number is required";
      return;
    }

    if (!password.trim()) {
      localError = "Password is required";
      return;
    }

    if (password.length < 8) {
      localError = "Password must be at least 8 characters";
      return;
    }

    if (password !== confirmPassword) {
      localError = "Passwords do not match";
      return;
    }

    // Validate phone format (basic)
    if (
      !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(
        phoneNumber,
      )
    ) {
      localError = "Invalid phone number format";
      return;
    }

    try {
      await registerWithPhone(phoneNumber, password);
      console.log("[Register] ✅ Success");
      dispatch("success");
    } catch (error) {
      localError = error.message || "Registration failed";
      console.error("[Register] ❌", error);
    }
  }

  function handleKeydown(event) {
    if (event.key === "Enter") {
      handleRegister();
    }
  }
</script>

<div class="register-container">
  <div class="register-card">
    <!-- Header -->
    <div class="register-header">
      <h1>Create Account</h1>
      <p>Join Campus Hub today</p>
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
    <form on:submit|preventDefault={handleRegister} class="register-form">
      <!-- Phone Number -->
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
        />
        <span class="input-hint">We'll use this to verify your account</span>
      </div>

      <!-- Password -->
      <div class="form-group">
        <label for="password">Password</label>
        <div class="password-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            bind:value={password}
            disabled={$isLoading}
            on:keydown={handleKeydown}
            aria-label="Password"
          />
          <button
            type="button"
            class="toggle-password"
            on:click={() => (showPassword = !showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <div class="password-wrapper">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            bind:value={confirmPassword}
            disabled={$isLoading}
            on:keydown={handleKeydown}
            aria-label="Confirm password"
          />
          <button
            type="button"
            class="toggle-password"
            on:click={() => (showConfirmPassword = !showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <!-- Password Strength Indicator -->
      {#if password}
        <div class="password-strength">
          <div
            class="strength-bar"
            style="width: {Math.min((password.length / 2) * 100, 100)}%"
          />
          <span class="strength-text">
            {password.length < 8
              ? "Weak"
              : password.length < 12
                ? "Good"
                : "Strong"}
          </span>
        </div>
      {/if}

      <!-- Submit Button -->
      <button
        type="submit"
        class="register-button"
        disabled={$isLoading}
        aria-busy={$isLoading}
      >
        {#if $isLoading}
          <span class="spinner" />
          <span>Creating account...</span>
        {:else}
          <span>Create Account</span>
        {/if}
      </button>
    </form>

    <!-- Footer -->
    <div class="register-footer">
      <p>Already have an account? <a href="#login">Sign in</a></p>
    </div>
  </div>

  <div class="background-gradient" />
</div>

<style>
  .register-container {
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
    overflow: auto;
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

  .register-card {
    position: relative;
    width: 100%;
    max-width: 420px;
    padding: 40px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    z-index: 1;
    my: auto;
  }

  .register-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .register-header h1 {
    font-size: 28px;
    font-weight: 600;
    color: #000;
    margin: 0 0 8px 0;
  }

  .register-header p {
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

  .register-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  .password-strength {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -8px;
  }

  .strength-bar {
    height: 4px;
    background: linear-gradient(90deg, #d32f2f, #ff9800, #4caf50);
    border-radius: 2px;
    transition: width 0.2s;
    flex: 1;
  }

  .strength-text {
    font-size: 11px;
    color: #666;
    font-weight: 500;
  }

  .register-button {
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

  .register-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 132, 255, 0.3);
  }

  .register-button:disabled {
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

  .register-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: #666;
  }

  .register-footer a {
    color: #0084ff;
    text-decoration: none;
    font-weight: 600;
  }

  .register-footer a:hover {
    color: #0073e6;
  }

  @media (prefers-color-scheme: dark) {
    .register-container {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    }

    .register-card {
      background: #111;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    .register-header h1 {
      color: #fff;
    }

    .register-header p {
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

    .register-footer {
      color: #aaa;
    }
  }
</style>
