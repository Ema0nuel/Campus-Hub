<script>
  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function handleClick() {
    vibrate([0, 20, 10, 20]);
    dispatch("click");
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

<button class="fab" on:click={handleClick} aria-label="New conversation">
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
  </svg>
</button>

<style>
  .fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 132, 255, 0.4);
    transition: all 0.2s ease;
    z-index: 99;
  }

  .fab:active {
    transform: scale(0.92);
    box-shadow: 0 2px 8px rgba(0, 132, 255, 0.3);
  }

  @media (prefers-color-scheme: dark) {
    .fab {
      box-shadow: 0 4px 16px rgba(0, 132, 255, 0.5);
    }

    .fab:active {
      box-shadow: 0 2px 8px rgba(0, 132, 255, 0.4);
    }
  }
</style>
