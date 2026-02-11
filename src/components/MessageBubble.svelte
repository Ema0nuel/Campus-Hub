<script>
  // @ts-nocheck
  import { onDestroy } from "svelte";
  import { currentUser } from "../store/authStore.js";
  import { formatAdjustedTime } from "../lib/timeUtils.js";

  export let message = null;
  export let showTime = true; // Always show time now

  let user = null;
  const unsubscribe = currentUser.subscribe((u) => (user = u));

  onDestroy(() => {
    unsubscribe && unsubscribe();
  });
</script>

<div
  class={"message-bubble " +
    (message?.role === "user" ? "outgoing" : "incoming")}
>
  <div class="bubble-wrapper">
    <div class="bubble-content">{message?.content}</div>
    {#if showTime}
      <div class="bubble-time">{formatAdjustedTime(message?.created_at)}</div>
    {/if}
  </div>
</div>

<style>
  .message-bubble {
    display: flex;
    margin: 4px 0;
    padding: 0 8px;
    width: 100%;
  }

  .message-bubble.incoming {
    justify-content: flex-start;
  }

  .message-bubble.outgoing {
    justify-content: flex-end;
  }

  .bubble-wrapper {
    max-width: min(calc(100% - 32px), 420px);
    padding: 10px 14px;
    border-radius: 18px;
    display: inline-flex;
    flex-direction: column;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
  }

  .message-bubble.incoming .bubble-wrapper {
    background: #f1f0f0;
    color: #111;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .message-bubble.outgoing .bubble-wrapper {
    background: linear-gradient(135deg, #0084ff, #006edc);
    color: white;
    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 132, 255, 0.2);
  }

  .bubble-content {
    font-size: 15px;
    margin-bottom: 4px;
    white-space: pre-wrap;
    min-height: 20px;
  }

  .bubble-time {
    font-size: 11px;
    opacity: 0.7;
    line-height: 1.2;
  }

  .message-bubble.incoming .bubble-time {
    color: #666;
  }

  .message-bubble.outgoing .bubble-time {
    color: rgba(255, 255, 255, 0.8);
    text-align: right;
  }

  @media (prefers-color-scheme: dark) {
    .message-bubble.incoming .bubble-wrapper {
      background: #333;
      color: #e8e8e8;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .message-bubble.incoming .bubble-time {
      color: #aaa;
    }

    .message-bubble.outgoing .bubble-wrapper {
      background: linear-gradient(135deg, #005fd9, #0050c0);
    }
  }

  @media (max-width: 768px) {
    .bubble-wrapper {
      max-width: min(calc(100% - 24px), 340px);
      padding: 9px 12px;
      font-size: 14px;
    }

    .bubble-content {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .bubble-wrapper {
      max-width: min(calc(100% - 16px), 280px);
      padding: 8px 11px;
      font-size: 13px;
    }

    .bubble-content {
      font-size: 13px;
    }

    .bubble-time {
      font-size: 10px;
    }
  }
</style>
