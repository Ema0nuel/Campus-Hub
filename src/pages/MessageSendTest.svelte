<script>
  import { onMount } from "svelte";
  import {
    getMessages,
    sendMessage,
    getCurrentUserId,
    getMessagesWithParticipant,
  } from "../lib/api.js";
  import { getConversations } from "../lib/api.js";
  import { loadConversationMessages } from "../stores/socketStore.js";

  let currentUserId = "";
  let conversations = [];
  let selectedConversation = null;
  let selectedParticipant = null;
  let messageContent = "";
  let testLog = [];
  let sentMessages = [];
  let receivedMessages = [];
  let isLoading = false;

  function addLog(label, data, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      timestamp,
      label,
      data: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      type,
    };
    testLog = [entry, ...testLog];
    console.log(`[${timestamp}] ${label}:`, data);
  }

  async function loadConversations() {
    try {
      isLoading = true;
      addLog("FETCH", "Loading conversations...");
      const convs = await getConversations();

      conversations = convs.map((conv) => ({
        id: conv.id,
        participantId: conv.other_participant_id || conv.participant?.id,
        participantName:
          conv.other_participant_name || conv.participant?.name || "Unknown",
        participantPhone:
          conv.other_participant_phone ||
          conv.participant?.phone_number ||
          "N/A",
      }));

      addLog(
        "✅ SUCCESS",
        `Loaded ${conversations.length} conversations`,
        "success",
      );
    } catch (err) {
      addLog(
        "❌ ERROR",
        `Failed to load conversations: ${err.message}`,
        "error",
      );
    } finally {
      isLoading = false;
    }
  }

  async function selectConversation(conv) {
    try {
      isLoading = true;
      selectedConversation = conv;
      selectedParticipant = {
        id: conv.participantId,
        name: conv.participantName,
        phone: conv.participantPhone,
      };

      addLog(
        "📍 SELECTED",
        `Conversation with ${conv.participantName} (${conv.participantId})`,
        "info",
      );

      // ✅ FIXED: Fetch from ALL conversation IDs
      addLog(
        "📡 FETCH",
        `Getting ALL messages with participant ${conv.participantId}...`,
      );
      const msgs = await getMessagesWithParticipant(conv.participantId);

      receivedMessages = msgs;
      loadConversationMessages(conv.id, msgs);

      // Analyze which are yours vs theirs
      const yourMessages = msgs.filter((m) => m.sender_id === currentUserId);
      const theirMessages = msgs.filter((m) => m.receiver_id === currentUserId);

      addLog(
        "📊 ANALYSIS",
        {
          total: msgs.length,
          sentByYou: yourMessages.length,
          sentByThem: theirMessages.length,
          conversationIds: [...new Set(msgs.map((m) => m.conversation_id))],
          yourMessageIds: yourMessages.map((m) => ({
            id: m.id.slice(0, 8),
            conversationId: m.conversation_id.slice(0, 8),
            content: m.content,
            createdAt: m.created_at,
          })),
          theirMessageIds: theirMessages.map((m) => ({
            id: m.id.slice(0, 8),
            conversationId: m.conversation_id.slice(0, 8),
            content: m.content,
            createdAt: m.created_at,
          })),
        },
        "success",
      );
    } catch (err) {
      addLog("❌ ERROR", `Failed to load messages: ${err.message}`, "error");
    } finally {
      isLoading = false;
    }
  }

  async function sendTestMessage() {
    if (!messageContent.trim()) {
      addLog("⚠️ WARNING", "Message cannot be empty", "warning");
      return;
    }

    if (!selectedConversation) {
      addLog("⚠️ WARNING", "No conversation selected", "warning");
      return;
    }

    try {
      isLoading = true;

      const payload = {
        conversationId: selectedConversation.id,
        receiverId: selectedParticipant.id,
        content: messageContent.trim(),
      };

      addLog("📤 SEND", `Sending message to ${selectedParticipant.name}...`);
      addLog("DEBUG", `Payload: ${JSON.stringify(payload, null, 2)}`);

      const sentMsg = await sendMessage(
        payload.conversationId,
        payload.receiverId,
        payload.content,
      );

      addLog(
        "✅ MESSAGE SENT",
        {
          messageId: sentMsg.id,
          senderId: sentMsg.sender_id,
          receiverId: sentMsg.receiver_id,
          content: sentMsg.content,
          createdAt: sentMsg.created_at,
          senderMatch: sentMsg.sender_id === currentUserId ? "✅ YES" : "❌ NO",
          receiverMatch:
            sentMsg.receiver_id === selectedParticipant.id ? "✅ YES" : "❌ NO",
        },
        "success",
      );

      sentMessages = [sentMsg, ...sentMessages];
      messageContent = "";

      // Refresh messages after short delay
      setTimeout(() => selectConversation(selectedConversation), 1000);
    } catch (err) {
      addLog("❌ SEND FAILED", err.message, "error");
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    currentUserId = getCurrentUserId();
    addLog("👤 CURRENT USER", currentUserId, "info");
    loadConversations();
  });
</script>

<div class="test-container">
  <!-- HEADER -->
  <div class="header">
    <h1>📨 Message Send/Receive Test Suite</h1>
    <p>
      Test sending messages to verify they reach the correct user only. Run this
      on two separate browsers/ports with different user logins.
    </p>
  </div>

  <!-- USER INFO -->
  <div class="section info-section">
    <h2>👤 Current User</h2>
    <div class="user-info">
      <code>{currentUserId}</code>
      <button on:click={loadConversations} disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh Conversations"}
      </button>
    </div>
  </div>

  <!-- CONVERSATION SELECTOR -->
  <div class="section">
    <h2>💬 Available Conversations ({conversations.length})</h2>

    {#if conversations.length === 0}
      <p class="empty">
        No conversations yet. Create one by searching for another user.
      </p>
    {:else}
      <div class="conversation-grid">
        {#each conversations as conv (conv.id)}
          <button
            class="conv-card"
            class:active={selectedConversation?.id === conv.id}
            on:click={() => selectConversation(conv)}
          >
            <div class="conv-header">
              <span class="name">{conv.participantName}</span>
              {#if selectedConversation?.id === conv.id}
                <span class="badge">✓ Selected</span>
              {/if}
            </div>
            <div class="conv-meta">
              <code>{conv.participantPhone}</code>
            </div>
            <small class="conv-id">{conv.id.slice(0, 12)}...</small>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- SEND MESSAGE PANEL -->
  {#if selectedConversation}
    <div class="section send-section">
      <h2>
        📤 Send Message to {selectedParticipant.name}
      </h2>

      <div class="recipient-info">
        <div class="info-item">
          <span class="label">Recipient Name:</span>
          <code>{selectedParticipant.name}</code>
        </div>
        <div class="info-item">
          <span class="label">Recipient ID:</span>
          <code>{selectedParticipant.id}</code>
        </div>
        <div class="info-item">
          <span class="label">Conversation ID:</span>
          <code>{selectedConversation.id}</code>
        </div>
      </div>

      <div class="message-input-area">
        <textarea
          placeholder="Type your test message..."
          bind:value={messageContent}
          disabled={isLoading}
        />
        <button
          on:click={sendTestMessage}
          disabled={isLoading || !messageContent.trim()}
          class="send-btn"
        >
          {isLoading ? "Sending..." : "Send Test Message"}
        </button>
      </div>

      {#if sentMessages.length > 0}
        <div class="sent-messages">
          <h3>Messages You Sent in This Session:</h3>
          {#each sentMessages as msg}
            <div class="message-item">
              <div class="msg-header">
                <span class="time"
                  >{new Date(msg.created_at).toLocaleTimeString()}</span
                >
                <span class="id">ID: {msg.id.slice(0, 8)}</span>
              </div>
              <div class="msg-content">{msg.content}</div>
              <div class="msg-checks">
                <span class:ok={msg.sender_id === currentUserId}>
                  Sender = You: {msg.sender_id === currentUserId ? "✅" : "❌"}
                </span>
                <span class:ok={msg.receiver_id === selectedParticipant.id}>
                  Receiver = {selectedParticipant.name}:
                  {msg.receiver_id === selectedParticipant.id ? "✅" : "❌"}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- RECEIVED MESSAGES ANALYSIS -->
  {#if selectedConversation && receivedMessages.length > 0}
    <div class="section">
      <h2>📥 All Messages in This Conversation</h2>

      <div class="message-breakdown">
        <div class="breakdown-stat">
          <span class="number">{receivedMessages.length}</span>
          <span class="label">Total Messages</span>
        </div>
        <div class="breakdown-stat">
          <span class="number">
            {receivedMessages.filter((m) => m.sender_id === currentUserId)
              .length}
          </span>
          <span class="label">Sent by You</span>
        </div>
        <div class="breakdown-stat">
          <span class="number">
            {receivedMessages.filter((m) => m.receiver_id === currentUserId)
              .length}
          </span>
          <span class="label">Sent by Them</span>
        </div>
      </div>

      <div class="messages-display">
        {#each receivedMessages as msg}
          <div
            class="message-row"
            class:yours={msg.sender_id === currentUserId}
            class:theirs={msg.receiver_id === currentUserId}
          >
            <div class="msg-direction">
              {msg.sender_id === currentUserId
                ? "📤 YOU SENT"
                : "📥 YOU RECEIVED"}
            </div>
            <div class="msg-details">
              <div class="detail-row">
                <span class="label">From:</span>
                <code>{msg.sender_id.slice(0, 12)}</code>
              </div>
              <div class="detail-row">
                <span class="label">To:</span>
                <code>{msg.receiver_id.slice(0, 12)}</code>
              </div>
              <div class="detail-row">
                <span class="label">Content:</span>
                <span class="content">{msg.content}</span>
              </div>
              <div class="detail-row">
                <span class="label">Sent:</span>
                <span class="time"
                  >{new Date(msg.created_at).toLocaleString()}</span
                >
              </div>
              <div class="detail-row">
                <span class="label">ID:</span>
                <code>{msg.id.slice(0, 8)}</code>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- TEST LOG -->
  <div class="section log-section">
    <h2>📋 Test Log ({testLog.length} events)</h2>
    <div class="log-display">
      {#each testLog as entry, idx}
        <div
          class="log-line"
          class:log-error={entry.type === "error"}
          class:log-success={entry.type === "success"}
          class:log-warning={entry.type === "warning"}
        >
          <span class="log-num">{idx + 1}</span>
          <span class="log-time">{entry.timestamp}</span>
          <span class="log-label">{entry.label}</span>
          <pre class="log-data">{entry.data}</pre>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .test-container {
    padding: 20px;
    background: #0a0e27;
    color: #e0e0e0;
    font-family: "Courier New", monospace;
    min-height: 100vh;
  }

  .header {
    margin-bottom: 30px;
    padding: 25px;
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    border-radius: 8px;
    border-left: 4px solid #42a5f5;
  }

  .header h1 {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: #42a5f5;
  }

  .header p {
    margin: 0;
    font-size: 12px;
    color: #90caf9;
  }

  .section {
    margin-bottom: 25px;
    border: 1px solid #1e3a5f;
    padding: 20px;
    background: #0f1419;
    border-radius: 8px;
  }

  h2 {
    margin: 0 0 15px 0;
    color: #42a5f5;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid #1e3a5f;
    padding-bottom: 10px;
  }

  .info-section .user-info {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .user-info code {
    flex: 1;
    background: #000;
    padding: 10px;
    border-radius: 4px;
    color: #4fc3f7;
    font-size: 12px;
    word-break: break-all;
  }

  button {
    background: #1e3a5f;
    color: #42a5f5;
    border: 1px solid #42a5f5;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background: #42a5f5;
    color: #0f1419;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .conversation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .conv-card {
    text-align: left;
    padding: 15px;
    background: #1a1f2e;
    border: 2px solid #1e3a5f;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .conv-card:hover {
    border-color: #42a5f5;
    background: #252a37;
  }

  .conv-card.active {
    border-color: #4fc3f7;
    background: rgba(79, 195, 247, 0.1);
  }

  .conv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .name {
    font-weight: bold;
    color: #90caf9;
    font-size: 14px;
  }

  .badge {
    background: #4caf50;
    color: #000;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
  }

  .conv-meta {
    margin-bottom: 8px;
  }

  .conv-meta code {
    background: #000;
    padding: 4px 6px;
    border-radius: 3px;
    color: #4fc3f7;
    font-size: 11px;
    display: block;
    word-break: break-all;
  }

  .conv-id {
    color: #666;
    font-size: 10px;
  }

  .send-section {
    border: 2px solid #4fc3f7;
    background: rgba(79, 195, 247, 0.05);
  }

  .recipient-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .info-item {
    background: #1a1f2e;
    padding: 12px;
    border-radius: 4px;
    border-left: 3px solid #4fc3f7;
  }

  .info-item .label {
    display: block;
    font-size: 11px;
    color: #90caf9;
    margin-bottom: 5px;
  }

  .info-item code {
    display: block;
    color: #4fc3f7;
    font-size: 12px;
    word-break: break-all;
    background: #000;
    padding: 6px;
    border-radius: 3px;
  }

  .message-input-area {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  textarea {
    flex: 1;
    background: #1a1f2e;
    color: #e0e0e0;
    border: 1px solid #1e3a5f;
    padding: 12px;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    resize: vertical;
    min-height: 60px;
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .send-btn {
    background: #4caf50;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
  }

  .send-btn:hover:not(:disabled) {
    background: #66bb6a;
  }

  .sent-messages {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #1e3a5f;
  }

  .sent-messages h3 {
    margin: 0 0 10px 0;
    color: #90caf9;
    font-size: 13px;
  }

  .message-item {
    background: #1a1f2e;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 10px;
    border-left: 3px solid #4caf50;
  }

  .msg-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 11px;
  }

  .time {
    color: #90caf9;
  }

  .id {
    color: #666;
  }

  .msg-content {
    color: #e0e0e0;
    margin-bottom: 8px;
    padding: 8px;
    background: #000;
    border-radius: 3px;
    border-left: 2px solid #4fc3f7;
  }

  .msg-checks {
    display: flex;
    gap: 15px;
    font-size: 11px;
  }

  .msg-checks span {
    color: #ff9800;
  }

  .msg-checks span.ok {
    color: #4caf50;
  }

  .message-breakdown {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .breakdown-stat {
    background: #1a1f2e;
    padding: 15px;
    border-radius: 4px;
    text-align: center;
    border: 1px solid #1e3a5f;
  }

  .number {
    display: block;
    font-size: 28px;
    font-weight: bold;
    color: #42a5f5;
    margin-bottom: 5px;
  }

  .label {
    display: block;
    font-size: 11px;
    color: #90caf9;
  }

  .messages-display {
    max-height: 600px;
    overflow-y: auto;
  }

  .message-row {
    background: #1a1f2e;
    padding: 15px;
    margin-bottom: 12px;
    border-radius: 4px;
    border-left: 4px solid #1e3a5f;
  }

  .message-row.yours {
    border-left-color: #4caf50;
    background: rgba(76, 175, 80, 0.05);
  }

  .message-row.theirs {
    border-left-color: #4fc3f7;
    background: rgba(79, 195, 247, 0.05);
  }

  .msg-direction {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #90caf9;
  }

  .msg-details {
    font-size: 12px;
  }

  .detail-row {
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .detail-row .label {
    min-width: 60px;
    color: #90caf9;
    font-weight: bold;
  }

  .detail-row code {
    background: #000;
    padding: 2px 6px;
    border-radius: 3px;
    color: #4fc3f7;
    word-break: break-all;
  }

  .detail-row .content {
    color: #e0e0e0;
  }

  .detail-row .time {
    color: #666;
  }

  .empty {
    color: #666;
    padding: 20px;
    text-align: center;
  }

  .log-section {
    margin-top: 30px;
  }

  .log-display {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #1a1f2e;
    border-radius: 4px;
  }

  .log-line {
    padding: 10px;
    border-bottom: 1px solid #1a1f2e;
    background: #0f1419;
    font-size: 11px;
  }

  .log-line:hover {
    background: #1a1f2e;
  }

  .log-line.log-error {
    border-left: 3px solid #f44336;
    background: rgba(244, 67, 54, 0.05);
  }

  .log-line.log-success {
    border-left: 3px solid #4caf50;
    background: rgba(76, 175, 80, 0.05);
  }

  .log-line.log-warning {
    border-left: 3px solid #ff9800;
    background: rgba(255, 152, 0, 0.05);
  }

  .log-num {
    display: inline-block;
    width: 25px;
    color: #90caf9;
    font-weight: bold;
  }

  .log-time {
    color: #42a5f5;
    margin-right: 10px;
    font-weight: bold;
  }

  .log-label {
    color: #4fc3f7;
    margin-right: 10px;
    font-weight: bold;
  }

  .log-data {
    margin: 5px 0 0 25px;
    padding: 8px;
    background: #000;
    border-left: 2px solid #42a5f5;
    color: #4fc3f7;
    overflow-x: auto;
    line-height: 1.4;
  }

  code {
    font-family: "Courier New", monospace;
  }
</style>
