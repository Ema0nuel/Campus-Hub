<script>
  export let value = "";
  export let region = "+234";
  export let disabled = false;
  export let error = "";

  $: fullPhoneNumber = region + value;

  function formatInput(e) {
    const input = e.target.value.replace(/\D/g, "");
    value = input.slice(0, 11);
    e.target.value = value;
  }

  function handleKeypress(e) {
    if (
      !/\d/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  function clearPhone() {
    value = "";
    const inputEl = document.getElementById("phone");
    if (inputEl) inputEl.focus();
  }
</script>

<div class="phone-input">
  <label for="phone" class="label">Phone Number</label>
  <div class="input-wrapper" class:error={!!error}>
    <div class="full-number">{region}</div>
    <input
      id="phone"
      type="tel"
      inputmode="numeric"
      placeholder="80123456789"
      bind:value
      on:input={formatInput}
      on:keypress={handleKeypress}
      on:focus
      on:blur
      on:keypress
      {disabled}
      maxlength="11"
      class="input-field"
      aria-label="Phone number"
      aria-invalid={!!error}
    />
    {#if value}
      <button
        type="button"
        class="clear-btn"
        on:click={clearPhone}
        {disabled}
        aria-label="Clear phone number"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    {/if}
  </div>
  {#if error}
    <div class="error-hint">{error}</div>
  {/if}
  {#if value && !error}
    <div class="phone-preview">
      Complete: <strong>{fullPhoneNumber}</strong>
    </div>
  {/if}
</div>

<style>
  .phone-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.04);
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    transition: all 0.2s ease;
    overflow: hidden;
    padding: 0 12px;
  }

  .input-wrapper:focus-within {
    border-color: #0084ff;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
  }

  .input-wrapper.error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.04);
  }

  .input-wrapper.error:focus-within {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
  }

  .full-number {
    font-size: 14px;
    font-weight: 600;
    color: #0084ff;
    margin-right: 4px;
    flex-shrink: 0;
    letter-spacing: 0.5px;
  }

  .input-field {
    flex: 1;
    padding: 14px 8px;
    background: transparent;
    border: none;
    font-size: 16px;
    font-weight: 500;
    color: #000000;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
  }

  .input-field::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  .input-field:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .clear-btn:active {
    background: rgba(0, 0, 0, 0.08);
    color: rgba(0, 0, 0, 0.6);
  }

  .clear-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .error-hint {
    font-size: 12px;
    color: #ef4444;
    margin-top: 4px;
  }

  .phone-preview {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin-top: 4px;
  }

  .phone-preview strong {
    color: #0084ff;
    font-weight: 600;
  }

  @media (prefers-color-scheme: dark) {
    .label {
      color: rgba(255, 255, 255, 0.8);
    }

    .input-wrapper {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .input-wrapper:focus-within {
      border-color: #0084ff;
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.15);
    }

    .input-wrapper.error {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.08);
    }

    .full-number {
      color: #32a0ff;
    }

    .input-field {
      color: #ffffff;
    }

    .input-field::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .clear-btn {
      color: rgba(255, 255, 255, 0.4);
    }

    .clear-btn:active {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
    }

    .error-hint {
      color: #ff6b6b;
    }

    .phone-preview {
      color: rgba(255, 255, 255, 0.6);
    }

    .phone-preview strong {
      color: #32a0ff;
    }
  }
</style>
