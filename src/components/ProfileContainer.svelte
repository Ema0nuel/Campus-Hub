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

<div class="profile-container" class:mobile={isMobile}>
  <div class="profile-card">
    <slot />
  </div>
</div>

<style>
  .profile-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%);
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  .profile-card {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    overflow: hidden;
  }

  .profile-container.mobile .profile-card {
    border-radius: 0;
    box-shadow: none;
  }

  /* Desktop layout */
  @media (min-width: 768px) {
    .profile-container {
      padding: 24px;
    }

    .profile-card {
      width: 100%;
      max-width: 480px;
      height: auto;
      max-height: 90vh;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.06);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .profile-container {
      background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    }

    .profile-card {
      background: #111111;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  /* Prevent layout shift on scrollbar appearance */
  @media (min-width: 768px) {
    .profile-card {
      scrollbar-gutter: stable;
    }
  }
</style>
