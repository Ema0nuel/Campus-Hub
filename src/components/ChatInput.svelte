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

  function expandTextarea(element) {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 100) + "px";
  }

  function handleInput(e) {
    expandTextarea(e.target);
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
    />
    <button
      on:click={handleSend}
      disabled={disabled || !messageText.trim()}
      class="send-btn"
      title="Send message (Enter)"
      aria-label="Send message"
    >
      ✈️
    </button>
  </div>
  <p class="hint">Press Enter to send, Shift+Enter for new line</p>
</div>

<style>
  .chat-input-container {
    background: #fff;
    border-top: 1px solid #e5e5e5;
    padding: 12px 16px;
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  textarea {
    flex: 1;
    border: 1px solid #e5e5ea;
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 15px;
    font-family: inherit;
    resize: none;
    max-height: 100px;
    outline: none;
    transition: border-color 0.2s;
    background: #f0f0f0;
    color: #000;
  }

  textarea::placeholder {
    color: #999;
  }

  textarea:focus {
    border-color: #0084ff;
    background: #fff;
  }

  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f5f5f5;
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #0084ff;
    color: #fff;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    background: #0073e6;
    transform: scale(1.08);
    box-shadow: 0 2px 8px rgba(0, 132, 255, 0.3);
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    font-size: 11px;
    color: #999;
    margin: 4px 16px 0 16px;
  }

  @media (prefers-color-scheme: dark) {
    .chat-input-container {
      background: #222;
      border-top-color: #333;
    }

    textarea {
      background: #333;
      color: #fff;
      border-color: #444;
    }

    textarea::placeholder {
      color: #666;
    }

    textarea:focus {
      border-color: #0084ff;
      background: #2a2a2a;
    }

    .hint {
      color: #666;
    }
  }
</style>
