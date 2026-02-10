<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let label = "";
  export let type = "text";
  export let placeholder = "";
  export let value = "";
  export let error = "";
  export let disabled = false;

  function handleInput(e) {
    value = e.target.value;
    dispatch("change", value);
  }

  function handleKeypress(e) {
    dispatch("keypress", e);
  }

  function handleFocus() {
    dispatch("focus");
  }

  function handleBlur() {
    dispatch("blur");
  }
</script>

<div class="text-input">
  {#if label}
    <label for="text-field-{Math.random()}" class="label">{label}</label>
  {/if}
  <div class="input-wrapper" class:error={!!error}>
    <input
      id="text-field-{Math.random()}"
      {type}
      {placeholder}
      {value}
      {disabled}
      on:input={handleInput}
      on:keypress={handleKeypress}
      on:focus={handleFocus}
      on:blur={handleBlur}
      class="input-field"
      aria-invalid={!!error}
      aria-describedby={error ? "error-hint" : undefined}
    />
    {#if value}
      <button
        type="button"
        class="clear-btn"
        on:click={() => {
          value = "";
          dispatch("change", "");
        }}
        {disabled}
        aria-label="Clear input"
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
    <div id="error-hint" class="error-hint">{error}</div>
  {/if}
</div>

<style>
  .text-input {
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

  .input-field {
    flex: 1;
    padding: 14px 16px;
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
    margin-right: 4px;
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
  }
</style>
