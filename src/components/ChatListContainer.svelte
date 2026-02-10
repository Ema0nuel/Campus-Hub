<script>
  import { onMount } from "svelte";

  let isMobile = false;

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  });
</script>

<div
  class="chat-list-container"
  class:mobile={isMobile}
  style="background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000')"
>
  <div class="chat-card">
    <slot />
  </div>
</div>

<style>
  .chat-list-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding: 0;
    margin: 0;
    position: relative;
  }

  .chat-list-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 0;
  }

  .chat-card {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .chat-list-container.mobile .chat-card {
    border-radius: 0;
  }

  @media (min-width: 768px) {
    .chat-list-container {
      padding: 12px;
    }

    .chat-card {
      width: 100%;
      max-width: 480px;
      height: auto;
      max-height: 92vh;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
  }

  @media (prefers-color-scheme: dark) {
    .chat-card {
      background: rgba(17, 17, 17, 0.98);
      color: #ffffff;
    }
  }
</style>
