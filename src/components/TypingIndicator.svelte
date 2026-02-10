<script>
  import { onMount } from "svelte";

  let dots = 0;

  onMount(() => {
    const interval = setInterval(() => {
      dots = (dots + 1) % 3;
    }, 400);

    return () => clearInterval(interval);
  });
</script>

<div class="typing-group">
  <div class="typing-bubble">
    <div class="typing-dots">
      <span class:active={dots >= 0}></span>
      <span class:active={dots >= 1}></span>
      <span class:active={dots >= 2}></span>
    </div>
  </div>
</div>

<style>
  .typing-group {
    display: flex;
    gap: 8px;
    margin-bottom: 2px;
  }

  .typing-bubble {
    max-width: 60px;
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    animation: typingPulse 1.4s infinite;
    opacity: 0.4;
  }

  .typing-dots span:nth-child(1) {
    animation-delay: 0s;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  .typing-dots span.active {
    opacity: 1;
  }

  @keyframes typingPulse {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-8px);
    }
  }

  @media (prefers-color-scheme: light) {
    .typing-bubble {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .typing-dots span {
      background: rgba(0, 0, 0, 0.3);
    }
  }
</style>
