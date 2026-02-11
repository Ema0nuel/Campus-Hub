<!-- filepath: c:\Users\emas0\OneDrive\Documents\practice\2026\Campus Hub\src\components\ChatInput.svelte -->
<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { setTypingIndicator } from "../services/supabaseService.js";

  const dispatch = createEventDispatcher();

  export let disabled = false;
  export let conversationId = "";
  export let userId = "";

  let messageText = "";
  let inputElement;
  let isTyping = false;
  let typingTimeoutId = null;

  async function handleSend() {
    if (!messageText.trim() || disabled) return;

    // Stop typing indicator before sending
    await stopTyping();

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
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";

    // Trigger typing indicator
    startTyping();
  }

  async function startTyping() {
    if (!conversationId || !userId) return;

    try {
      if (!isTyping) {
        isTyping = true;
        // Write to typing_indicators table
        await setTypingIndicator(userId, conversationId, true);
        console.log("[ChatInput] ✏️ Marked as typing");
      }

      // Reset timeout for typing indicator (stop after 3 seconds of inactivity)
      clearTimeout(typingTimeoutId);
      typingTimeoutId = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (err) {
      console.error("[ChatInput] Failed to set typing indicator:", err);
    }
  }

  async function stopTyping() {
    if (!conversationId || !userId) return;

    try {
      if (isTyping) {
        isTyping = false;
        // Remove typing indicator from table
        await setTypingIndicator(userId, conversationId, false);
        console.log("[ChatInput] ✋ Marked as not typing");
      }
      clearTimeout(typingTimeoutId);
    } catch (err) {
      console.error("[ChatInput] Failed to clear typing indicator:", err);
    }
  }

  async function handleBlur() {
    await stopTyping();
  }

  onDestroy(async () => {
    await stopTyping();
  });
</script>

<div class="chat-input-container">
  <div class="input-wrapper">
    <textarea
      bind:this={inputElement}
      bind:value={messageText}
      on:keydown={handleKeydown}
      on:input={handleInput}
      on:blur={handleBlur}
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
      <span class="send-icon">➜</span>
    </button>
  </div>
</div>

<style>
  .chat-input-container {
    background: linear-gradient(180deg, #ffffff, #fbfbfb);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 12px 12px;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  textarea {
    flex: 1;
    min-height: 44px;
    max-height: 140px;
    padding: 11px 16px;
    border-radius: 22px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #f0f2f5;
    font-size: 15px;
    line-height: 1.4;
    font-family: inherit;
    resize: none;
    outline: none;
    transition: all 0.15s ease;
    color: #000;
  }

  textarea:focus {
    border-color: #0b84ff;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(11, 132, 255, 0.1);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.05);
  }

  textarea::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }

  .send-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    flex-shrink: 0;
    border-radius: 50%;
    border: none;
    background: #0b84ff;
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
  }

  .send-btn:hover:not(:disabled) {
    background: #0a73d8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(11, 132, 255, 0.3);
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.95);
    box-shadow: 0 2px 8px rgba(11, 132, 255, 0.2);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #ccc;
  }

  .send-icon {
    display: inline-block;
    transition: transform 0.2s ease;
  }

  .send-btn:hover:not(:disabled) .send-icon {
    transform: translateX(2px);
  }

  /* Mobile: Optimize for small screens */
  @media (max-width: 640px) {
    .chat-input-container {
      padding: 8px 8px;
      position: sticky;
      bottom: 0;
      z-index: 100;
    }

    textarea {
      padding: 10px 14px;
      font-size: 14px;
      min-height: 40px;
      border-radius: 20px;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .chat-input-container {
      background: linear-gradient(180deg, #1a1a1a, #0f0f0f);
      border-top-color: rgba(255, 255, 255, 0.05);
    }

    textarea {
      background: #2a2a2a;
      color: #e8e8e8;
      border-color: rgba(255, 255, 255, 0.06);
    }

    textarea:focus {
      background: #333;
      border-color: #0b84ff;
      box-shadow: 0 0 0 2px rgba(11, 132, 255, 0.15);
    }

    textarea:disabled {
      background: rgba(255, 255, 255, 0.02);
    }

    textarea::placeholder {
      color: rgba(255, 255, 255, 0.45);
    }

    .send-btn:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(11, 132, 255, 0.25);
    }
  }
</style>
