<script>
  export let isOutgoing = false;
  export let content = "";
  export let timestamp = "";
  export let isSending = false;
  export let read = false;
</script>

<div class="message-group" class:outgoing={isOutgoing}>
  <div class="message-bubble" class:sending={isSending}>
    <p class="message-content">{content}</p>
    <div class="message-footer">
      <span class="timestamp">{timestamp}</span>
      {#if isOutgoing}
        <svg
          class="read-receipt"
          class:read
          viewBox="0 0 24 24"
          width="12"
          height="12"
        >
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      {/if}
    </div>
  </div>
</div>

<style>
  .message-group {
    display: flex;
    gap: 8px;
    margin-bottom: 2px;
    animation: fadeIn 0.3s ease-out;
  }

  .message-group.outgoing {
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    word-wrap: break-word;
    transition: all 0.2s ease;
  }

  .message-group.outgoing .message-bubble {
    background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%);
    border-color: rgba(0, 132, 255, 0.3);
  }

  .message-bubble.sending {
    opacity: 0.7;
  }

  .message-content {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: #fff;
  }

  .message-footer {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    justify-content: flex-end;
  }

  .timestamp {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .read-receipt {
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }

  .read-receipt.read {
    color: #4fc3f7;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-color-scheme: light) {
    .message-bubble {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .message-content {
      color: #000;
    }

    .timestamp {
      color: rgba(0, 0, 0, 0.5);
    }

    .read-receipt {
      color: rgba(0, 0, 0, 0.3);
    }

    .read-receipt.read {
      color: #0084ff;
    }
  }

  @media (min-width: 640px) {
    .message-bubble {
      max-width: 50%;
    }
  }
</style>
