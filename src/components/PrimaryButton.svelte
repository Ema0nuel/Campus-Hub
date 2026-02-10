<script>
  export let label = "Button";
  export let loading = false;
  export let disabled = false;
</script>

<button
  type="button"
  class="primary-btn"
  class:loading
  {disabled}
  on:click
  aria-busy={loading}
>
  {#if loading}
    <span class="spinner"></span>
    <span class="loading-text">Signing in...</span>
  {:else}
    <span class="label-text">{label}</span>
    <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  {/if}
</button>

<style>
  .primary-btn {
    padding: 14px 20px;
    background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 48px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 132, 255, 0.3);
  }

  .primary-btn:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 132, 255, 0.2);
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .label-text {
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .arrow-icon {
    transition: transform 0.3s ease;
  }

  .primary-btn:active:not(:disabled) .arrow-icon {
    transform: translateX(2px);
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-color-scheme: dark) {
    .primary-btn {
      background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
      box-shadow: 0 2px 8px rgba(0, 132, 255, 0.4);
    }

    .primary-btn:active:not(:disabled) {
      box-shadow: 0 1px 4px rgba(0, 132, 255, 0.3);
    }
  }
</style>
