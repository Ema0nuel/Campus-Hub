<!-- filepath: c:\Users\emas0\OneDrive\Documents\practice\2026\Campus Hub\src\components\ChatInput.svelte -->
<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let disabled = false;

  let messageText = "";
  let inputElement;

  function handleSend() {
    if (!messageText.trim() || disabled) return;
    dispatch("send", messageText);
    messageText = "";
    inputElement?.focus();
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }
</script>

<div class="chat-input-container">
  <div class="input-wrapper">
    <textarea
      bind:this={inputElement}
      bind:value={messageText}
      on:keydown={handleKeydown}
      on:input={handleInput}
      placeholder="Type a message..."
      {disabled}
      rows="1"
      aria-label="Message input"
    />
    <button
      on:click={handleSend}
      disabled={disabled || !messageText.trim()}
      class="send-btn"
      title="Send (Enter)"
      aria-label="Send message"
    >
      ✈️
    </button>
  </div>
  <p class="hint">Enter to send · Shift+Enter for line break</p>
</div>

<style>
  .chat-input-container {
    background: linear-gradient(180deg, #ffffff, #fbfbfb);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 10px 12px;
    box-sizing: border-box;
  }

  .input-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  textarea {
    flex: 1;
    min-height: 44px;
    max-height: 140px;
    padding: 10px 14px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: #f7f7f8;
    font-size: 15px;
    line-height: 1.2;
    font-family: inherit;
    resize: none;
    outline: none;
    transition: border-color 0.15s;
  }

  textarea:focus {
    border-color: #0b84ff;
    background: #fff;
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 999px;
    border: none;
    background: #0b84ff;
    color: white;
    display: inline-grid;
    place-items: center;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .send-btn:hover:not(:disabled) {
    background: #0a73d8;
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 6px;
    margin-left: 14px;
  }

  /* Mobile: pin input to bottom, reserve space in messages */
  @media (max-width: 640px) {
    .chat-input-container {
      position: fixed;
      left: 0;
      right: 0;
      bottom: env(safe-area-inset-bottom, 0);
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0));
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(4px);
    }

    .hint {
      display: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    .chat-input-container {
      background: linear-gradient(180deg, #111, #0b0b0b);
      border-top-color: rgba(255, 255, 255, 0.03);
    }

    textarea {
      background: #121212;
      color: #eee;
      border-color: rgba(255, 255, 255, 0.04);
    }

    textarea:focus {
      background: #1a1a1a;
    }

    .hint {
      color: rgba(255, 255, 255, 0.55);
    }
  }
</style>
