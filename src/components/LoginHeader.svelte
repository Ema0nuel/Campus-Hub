<script>
  import TelegramIcon from "./icons/TelegramIcon.svelte";
</script>

<div class="header">
  <div class="header-content">
    <div class="logo">
      <TelegramIcon />
    </div>
    <div class="text-content">
      <h1 class="title">Campus Hub</h1>
      <p class="subtitle">Sign in to your account</p>
    </div>
  </div>
</div>

<style>
  .header {
    padding: 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: #ffffff;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #0084ff 0%, #0084ff 100%);
    border-radius: 12px;
    flex-shrink: 0;
    color: white;
  }

  .text-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #000000;
    letter-spacing: -0.3px;
  }

  .subtitle {
    margin: 0;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 400;
  }

  @media (min-width: 768px) {
    .header {
      padding: 32px;
      border-bottom: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .logo {
      width: 56px;
      height: 56px;
    }

    .title {
      font-size: 20px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  @media (prefers-color-scheme: dark) {
    .header {
      background: #111111;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .title {
      color: #ffffff;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.6);
    }
  }
</style>
