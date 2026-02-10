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

<div class="auth-container" class:mobile={isMobile}>
  <div class="auth-card">
    <slot />
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%);
    padding: 0;
    margin: 0;
  }

  .auth-card {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    overflow: hidden;
  }

  .auth-container.mobile .auth-card {
    border-radius: 0;
    box-shadow: none;
  }

  /* Desktop layout */
  @media (min-width: 768px) {
    .auth-container {
      padding: 24px;
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      height: auto;
      max-height: 90vh;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  @media (prefers-color-scheme: dark) {
    .auth-container {
      background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    }

    .auth-card {
      background: #111111;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }
</style>
