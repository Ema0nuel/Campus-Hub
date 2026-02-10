<script>
  // @ts-nocheck
  import { onDestroy } from "svelte";
  import { currentUser } from "../store/authStore.js";

  export let message = null;
  export let showTime = false;

  let user = null;
  const unsubscribe = currentUser.subscribe((u) => (user = u));

  onDestroy(() => {
    unsubscribe && unsubscribe();
  });

  function formatTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }
</script>

<div
  class={"message-bubble " +
    (message?.role === "user" ? "outgoing" : "incoming")}
>
  <div class="bubble-content">{message?.content}</div>
  {#if showTime}
    <div class="bubble-time">{formatTime(message?.created_at)}</div>
  {/if}
</div>

<style>
  .message-bubble {
    max-width: 72%;
    padding: 10px 12px;
    border-radius: 18px;
    display: inline-block;
    margin: 6px 0;
  }

  .message-bubble.incoming {
    background: #f1f0f0;
    align-self: flex-start;
    color: #111;
  }

  .message-bubble.outgoing {
    background: linear-gradient(135deg, #0084ff, #006edc);
    color: white;
    align-self: flex-end;
  }

  .bubble-time {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 6px;
    text-align: right;
  }
</style>
