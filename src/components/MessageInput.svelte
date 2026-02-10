<script>
  import { createEventDispatcher } from "svelte";

  export let disabled = false;

  const dispatch = createEventDispatcher();

  let inputValue = "";
  let textarea = null;
  let textareaHeight = 40;

  function handleInput(e) {
    inputValue = e.target.value;

    // Auto-grow textarea
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      textareaHeight = newHeight;
    }

    dispatch("typing");
  }

  function handleSend() {
    if (!inputValue.trim()) return;

    dispatch("send", inputValue);
    inputValue = "";

    if (textarea) {
      textarea.style.height = "auto";
      textareaHeight = 40;
    }
  }

  function handleKeyDown(e) {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate(10);
  }
</script>

<div class="input-container">
  <div class="input-wrapper">
    <textarea
      bind:this={textarea}
      bind:value={inputValue}
      on:input={handleInput}
      on:keydown={handleKeyDown}
      on:focus={vibrate}
      placeholder="Type a message..."
      {disabled}
      rows="1"
    />

    <button
      class="send-button"
      on:click={handleSend}
      disabled={!inputValue.trim() || disabled}
      aria-label="Send message"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          fill="currentColor"
          d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346273 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4573156 C0.994623095,2.0146312 0.837654326,3.10604706 1.15159189,3.89154392 L3.03521743,10.3325369 C3.03521743,10.4896343 3.34915502,10.6467317 3.50612381,10.6467317 L16.6915026,11.4322186 C16.6915026,11.4322186 17.1624089,11.4322186 17.1624089,11.0616221 L17.1624089,12.0042064 C17.1624089,12.3748029 16.6915026,12.4744748 16.6915026,12.4744748 Z"
        />
      </svg>
    </button>
  </div>
</div>

<style>
  .input-container {
    flex-shrink: 0;
    padding: 12px 16px;
    padding-bottom: max(24px, env(safe-area-inset-bottom));
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.1) 100%
    );
    width: 100%;
    box-sizing: border-box;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    transition: all 0.2s ease;
    max-width: 100%;
    box-sizing: border-box;
  }

  .input-wrapper:focus-within {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  textarea {
    flex: 1;
    border: none;
    background: transparent;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    max-height: 120px;
    min-height: 40px;
    padding: 8px 0;
    line-height: 1.4;
    -webkit-appearance: none;
    appearance: none;
  }

  textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    border: none;
    background: #0084ff;
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    -webkit-appearance: none;
    appearance: none;
  }

  .send-button:hover:not(:disabled) {
    background: #0066cc;
    transform: scale(1.05);
  }

  .send-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .send-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #0084ff;
  }

  @media (prefers-color-scheme: light) {
    .input-container {
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(0, 0, 0, 0.02) 100%
      );
    }

    .input-wrapper {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.08);
    }

    .input-wrapper:focus-within {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.12);
    }

    textarea {
      color: #000;
    }

    textarea::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
  }
</style>
