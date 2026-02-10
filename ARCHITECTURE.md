# Architecture & Data Flows

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPUS HUB - FRONTEND                        │
│  (Svelte 5 + Vite)                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  App.svelte (Router)                                     │   │
│  │  - Loading → Login → Register → CreateProfile → Chat   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Component Tree                                         │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ Conversation.svelte (Chat List)                    │ │    │
│  │ │ - Loads from conversations table                   │ │    │
│  │ │ - Realtime subscription to postgres_changes       │ │    │
│  │ │ - Shows last_message_preview, unread_count        │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  │                     ↓                                   │    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ ChatWindow.svelte (Main Chat UI)                   │ │    │
│  │ │ - Loads messages from both conversations           │ │    │
│  │ │ - Dual subscription (user + participant)           │ │    │
│  │ │ - Real-time message + typing indicator events      │ │    │
│  │ │ - MessageBubble, ChatInput, ChatHeader components  │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  │                                                         │    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ Auth Pages (Login, Register, CreateProfile)        │ │    │
│  │ │ - Phone validation                                  │ │    │
│  │ │ - Password strength indicator                       │ │    │
│  │ │ - Profile completion form                          │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  State Management (Svelte Stores)                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ authStore.js:                                           │    │
│  │  - authState (writable)                                │    │
│  │  - currentUserId (derived) [cached for sync access]    │    │
│  │  - isAuthenticated, currentUser, authError, ...        │    │
│  │                                                         │    │
│  │ socketStore.js (optional, for other features):         │    │
│  │  - Socket connection management                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Service Layer                                         │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ messageService.js:                                     │    │
│  │  - getOrCreateConversation()                          │    │
│  │  - sendMessageDirect()                                │    │
│  │  - getUnifiedMessagesFromSupabase()                   │    │
│  │  - markConversationAsRead()                           │    │
│  │  - setTypingIndicator()                               │    │
│  │                                                         │    │
│  │ supabaseClient.js:                                     │    │
│  │  - Supabase client instance                           │    │
│  │  - subscribeToConversation() [realtime channels]       │    │
│  │  - subscribeToConversations()                         │    │
│  │  - subscribeToUserPresence()                          │    │
│  │  - updateUserStatus()                                 │    │
│  │                                                         │    │
│  │ authStore.js:                                          │    │
│  │  - registerWithPhone()                                 │    │
│  │  - loginWithPhone()                                    │    │
│  │  - initialize()                                        │    │
│  │  - logout(), updateProfile()                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                             ↓
             SUPABASE REALTIME CHANNEL (WebSocket)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase Auth (JWT + Session Management)              │   │
│  │  - Phone + Password auth                               │   │
│  │ - Token stored in localStorage                         │   │
│  │  - Auto-refresh on app init                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  Table: users                                           │   │
│  │   - id (UUID, PK)                                       │   │
│  │   - phone_number (VARCHAR, UNIQUE)                     │   │
│  │   - name, avatar_url, status (online/offline/typing) │   │
│  │   - created_at, updated_at, last_seen                 │   │
│  │                                                          │   │
│  │  Table: conversations                                  │   │
│  │   - id (UUID, PK)                                       │   │
│  │   - user_id (FK → users)                               │   │
│  │   - participant_id (FK → users)                        │   │
│  │   - last_message_id, last_message_preview             │   │
│  │   - last_message_at, unread_count, is_archived        │   │
│  │   - INDEX: (user_id, last_message_at DESC)            │   │
│  │                                                          │   │
│  │  Table: messages                                       │   │
│  │   - id (UUID, PK)                                       │   │
│  │   - sender_id, receiver_id, conversation_id (FK)      │   │
│  │   - content, message_type                             │   │
│  │   - is_read, read_at, created_at, deleted_at (soft)  │   │
│  │   - INDEX: (conversation_id, created_at DESC)        │   │
│  │                                                          │   │
│  │  Table: typing_indicators                              │   │
│  │   - id (UUID, PK)                                       │   │
│  │   - user_id, conversation_id (FK)                      │   │
│  │   - is_typing, created_at                             │   │
│  │   - UNIQUE: (user_id, conversation_id)                │   │
│  │   - Auto-cleanup: created_at < NOW() - 10 seconds    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Triggers                                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  AFTER INSERT ON messages:                             │   │
│  │   → update_conversation_on_message()                   │   │
│  │   → Updates BOTH user + participant conversations     │   │
│  │   → Sets last_message_at, last_message_preview, etc.  │   │
│  │   → Increments unread_count for receiver              │   │
│  │   → Updates user.last_seen in trigger                 │   │
│  │                                                          │   │
│  │  AFTER INSERT/UPDATE ON typing_indicators:             │   │
│  │   → update_user_last_seen()                            │   │
│  │   → Sets users.last_seen = NOW()                       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase Realtime (postgres_changes)                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  Channel: conversation:{id}                            │   │
│  │   → Listens to INSERT on messages table (filtered)    │   │
│  │   → Listens to UPDATE on messages table (read receipts)│   │
│  │   → Broadcasts payload to subscribed clients          │   │
│  │                                                          │   │
│  │  Channel: conversations:{userId}                       │   │
│  │   → Listens to INSERT/UPDATE/DELETE (filtered)        │   │
│  │   → Notifies app when conversation list changes       │   │
│  │                                                          │   │
│  │  Channel: typing:{conversationId}                      │   │
│  │   → Listens to INSERT/UPDATE/DELETE on typing_indicators│  │
│  │   → Real-time "User is typing..." indicator           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Sending a Message

```
User Type Message (ChatInput)
           ↓
     handleSendMessage()
           ↓
   validatePreconditions()
     ✓ User ID exists?
     ✓ Participant ID exists?
     ✓ Conversation ID exists?
           ↓
 sendMessageDirect(convId, receiverId, content)
           ↓
   supabase.from("messages")
       .insert({
         sender_id: currentUser,
         receiver_id: participantId,
         conversation_id: convId,
         content: trimmed,
         is_read: false,
         created_at: NOW()
       })
       .select()
           ↓
   SUPABASE INSERT → PostgreSQL table
           ↓
   TRIGGER: update_conversation_on_message()
       ├─ UPDATE conversations SET last_message_at = NOW()
       ├─ UPDATE conversations SET last_message_preview
       ├─ UPDATE conversations SET unread_count += 1
       │   (for receiver's row)
       └─ TRIGGER: update_user_last_seen()
           └─ UPDATE users SET last_seen = NOW()
           ↓
   PostgreSQL LISTEN "pgsql-changes"
           ↓
   Supabase Realtime broadcasts to channels:
       ├─ Channel: conversation:{userConvId}
       │   Event: { type: "INSERT", message: {...} }
       │
       └─ Channel: conversation:{participantConvId}
           Event: { type: "INSERT", message: {...} }
           ↓
   ChatWindow receives payload
       ├─ Check: message already in local array? (dedupe)
       ├─ If NEW:
       │   ├─ Add to messages array
       │   ├─ Assign role: "receiver" (from participant)
       │   └─ Auto-scroll to bottom
       │
       └─ If DUPLICATE: ignore
           ↓
   MessageBubble renders:
       ├─ Blue bubble (sender) OR Gray bubble (receiver)
       ├─ Message text + timestamp
       ├─ Read receipt: ✓ (sent)
       └─ Shows in UI immediately
           ↓
   Conversation.svelte subscription fires:
       ├─ Channel: conversations:{userId}
       └─ UPDATE event on conversations table
           ├─ Conversation item moves to top
           ├─ Last message preview updates
           ├─ Unread badge appears
           └─ All in real-time WITHOUT page reload
```

---

## 📊 Data Flow: Reading a Message

```
ChatWindow mounts with participantId
           ↓
   validatePreconditions()
           ↓
   loadMessages()
           ↓
   getUnifiedMessagesFromSupabase(participantId)
       ├─ getBothConversationIdsFromSupabase()
       │   └─ Query: SELECT * FROM conversations WHERE
       │       (user_id=curr AND participant_id=other) OR
       │       (user_id=other AND participant_id=curr)
       │       → Returns {userConvId, participantConvId}
       │
       ├─ getConversationMessages(userConvId)
       │   ├─ Query: SELECT * FROM messages
       │   │   WHERE conversation_id=userConvId
       │   │   AND deleted_at IS NULL
       │   │   ORDER BY created_at ASC
       │   └─ Enrich: role = sender_id === currentUser ? "user" : "receiver"
       │
       ├─ getConversationMessages(participantConvId)
       │   └─ (same as above)
       │
       ├─ Merge all messages
       ├─ Deduplicate by ID using Map
       ├─ Sort by created_at
       └─ Return to ChatWindow
           ↓
   setupRealtimeSubscriptions()
       ├─ subscribeToConversation(userConvId)
       │   ├─ Channel: conversation:{userConvId}
       │   └─ Listen: postgres_changes INSERT/UPDATE
       │
       └─ subscribeToConversation(participantConvId)
           ├─ Channel: conversation:{participantConvId}
           └─ Listen: postgres_changes INSERT/UPDATE
           ↓
   markConversationAsRead(userConvId, currentUser)
       ├─ supabase.from("messages")
       │   .update({ is_read: true, read_at: NOW() })
       │   .eq("conversation_id", userConvId)
       │   .eq("receiver_id", currentUser)
       │   .eq("is_read", false)
       │
       └─ PostgreSQL UPDATE fires
           ├─ TRIGGER: update_user_last_seen()
           │   └─ UPDATE users SET last_seen = NOW()
           │
           └─ Supabase broadcasts UPDATE event:
               ├─ Channel: conversation:{userConvId}
               │   Event: { type: "UPDATE", message: {..., is_read: true} }
               │
               └─ Other user's ChatWindow receives UPDATE
                   ├─ MessageBubble re-renders
                   ├─ Read receipt changes: ✓ → ✓✓
                   └─ All automatic via reactive update
```

---

## 📊 Data Flow: Typing Indicator

```
User starts typing in ChatInput
           ↓
   on:input event fires
           ↓
   handleTyping() called
       ├─ setTypingIndicator(conversationId, true)
       │   ├─ supabase.from("typing_indicators")
       │   │   .upsert({
       │   │     user_id: currentUser,
       │   │     conversation_id: convId,
       │   │     is_typing: true,
       │   │     created_at: NOW()
       │   │   })
       │   │   WHERE (user_id, conversation_id) = UNIQUE constraint
       │   │
       │   └─ PostgreSQL INSERT/UPDATE
       │       └─ TRIGGER: update_user_last_seen()
       │           └─ UPDATE users SET last_seen = NOW()
       │               ↓
       │               Supabase broadcasts INSERT/UPDATE:
       │               └─ Channel: typing:{conversationId}
       │                   Event: { type: "INSERT", new: {...} }
       │                   └─ Other user sees "User is typing..."
       │
       └─ Set timeout: 3 seconds of inactivity
           ↓
   (User stops typing)
           ↓
   After 3 seconds:
       ├─ isTyping = false
       ├─ setTypingIndicator(conversationId, false)
       │   ├─ supabase.from("typing_indicators")
       │   │   .delete()
       │   │   .eq("user_id", currentUser)
       │   │   .eq("conversation_id", convId)
       │   │
       │   └─ PostgreSQL DELETE fires
       │       └─ Supabase broadcasts DELETE:
       │           └─ Channel: typing:{conversationId}
       │               Event: { type: "DELETE", old: {...} }
       │               └─ "User is typing..." disappears
       │
       └─ Typing indicator UI cleared
```

---

## 🔄 Real-time Payload Structure

### Message Payload (INSERT)

```javascript
{
  type: "INSERT",
  message: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    sender_id: "user-alice-uuid",
    receiver_id: "user-bob-uuid",
    conversation_id: "conv-alice-to-bob",
    content: "Hey Bob!",
    message_type: "text",
    is_read: false,
    read_at: null,
    created_at: "2026-02-10T15:30:00Z",
    updated_at: "2026-02-10T15:30:00Z",
    deleted_at: null,
    // ENRICHED BY CHATWINDOW:
    role: "receiver"  // or "user" if sender
  }
}
```

### Message Payload (UPDATE - Read Receipt)

```javascript
{
  type: "UPDATE",
  message: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    sender_id: "user-alice-uuid",
    receiver_id: "user-bob-uuid",
    is_read: true,
    read_at: "2026-02-10T15:31:00Z",
    updated_at: "2026-02-10T15:31:00Z",
    // ENRICHED BY CHATWINDOW:
    role: "receiver"
  }
}
```

### Conversation Payload (UPDATE after new message)

```javascript
{
  type: "UPDATE",
  new: {
    id: "conv-uuid",
    user_id: "user-alice-uuid",
    participant_id: "user-bob-uuid",
    last_message_id: "msg-uuid",
    last_message_preview: "Hey Bob!",
    last_message_at: "2026-02-10T15:30:00Z",
    unread_count: 1,
    is_archived: false,
    created_at: "2026-02-10T14:00:00Z",
    updated_at: "2026-02-10T15:30:00Z"
  }
}
```

### Typing Payload (INSERT)

```javascript
{
  type: "INSERT",
  new: {
    id: "typ-uuid",
    user_id: "user-bob-uuid",
    conversation_id: "conv-uuid",
    is_typing: true,
    created_at: "2026-02-10T15:30:30Z"
  }
}
```

### Typing Payload (DELETE)

```javascript
{
  type: "DELETE",
  old: {
    id: "typ-uuid",
    user_id: "user-bob-uuid",
    conversation_id: "conv-uuid",
    is_typing: true,
    created_at: "2026-02-10T15:30:30Z"
  }
}
```

---

## 🔌 Channel Lifecycle

```
App Start
    ↓
auth.initialize()
    ├─ Check Supabase session
    ├─ Fetch user profile
    └─ Set currentUserId store
         ↓
         All components subscribed to currentUserId update
         ↓
Conversation.svelte mounts
    ├─ subscribeToConversations(userId)
    │   ├─ Creates channel: conversations:{userId}
    │   ├─ Filters by user_id AND is_archived=false
    │   └─ Listens for any INSERT/UPDATE/DELETE
    │       └─ On event: reload conversation list
    │
    └─ List loads: shows all active conversations
         ↓
User clicks conversation
    ↓
ChatWindow.svelte mounts
    ├─ validatePreconditions()
    ├─ loadMessages()
    ├─ getOrCreateConversation() [if needed]
    ├─ setupRealtimeSubscriptions()
    │   ├─ subscribeToConversation(userConvId)
    │   │   ├─ Creates channel: conversation:{userConvId}
    │   │   ├─ Listens: INSERT on messages
    │   │   └─ Listens: UPDATE on messages
    │   │       └─ Payload enriched with role
    │   │
    │   ├─ subscribeToConversation(participantConvId)
    │   │   └─ (same as above)
    │   │
    │   └─ subscribeToTypingIndicators(userConvId)
    │       ├─ Creates channel: typing:{userConvId}
    │       └─ Listens: INSERT/UPDATE/DELETE
    │
    └─ Chat ready: listening to 2+ channels
         ↓
User sends message
    ├─ INSERT to messages table
    ├─ TRIGGER fires: update_conversation_on_message()
    ├─ Both channels broadcast INSERT events
    ├─ ChatWindow receives on both channels
    ├─ Deduplicates: keeps unique by ID
    └─ Renders new message
         ↓
User types in ChatInput
    ├─ Every keystroke: setTypingIndicator(true)
    ├─ INSERT/UPSERT to typing_indicators
    ├─ typing:{convId} channel broadcasts
    ├─ Other user sees "typing..." indicator
    └─ After 3 seconds inactivity: setTypingIndicator(false)
         ↓
User navigates away or closes ChatWindow
    ├─ onDestroy() called
    ├─ Stop typing indicator (if active)
    ├─ unsubscribeFromChannel() all channels
    │   ├─ supabase.removeChannel(channel)
    │   └─ WebSocket closes for those channels
    │
    └─ Memory cleaned up
         ↓
User logs out
    ├─ logout()
    ├─ supabase.auth.signOut()
    ├─ localStorage.removeItem("auth_token")
    ├─ authState reset
    ├─ All active channels unsubscribed
    └─ Route to login page
         ↓
App End
```

---

## 🎯 Key Design Patterns

### 1. Dual Conversation Model

```javascript
// User A creates: (user_id=A, participant_id=B)
// User B creates: (user_id=B, participant_id=A)
// UNIQUE constraint on (user_id, participant_id)

// Query to find both:
WHERE (user_id=currentUser AND participant_id=other) OR
      (user_id=other AND participant_id=currentUser)
```

### 2. Payload Enrichment

```javascript
// Raw from Supabase:
{ sender_id: "A", receiver_id: "B", content: "..." }

// Enriched in ChatWindow:
{
  ...payload,
  role: sender_id === currentUserId ? "user" : "receiver"
}

// Used in MessageBubble:
<div class={msg.role === "user" ? "user-bubble" : "receiver-bubble"}>
```

### 3. Message Deduplication

```javascript
// New message arrives via realtime (or sent locally)
if (messages.some((m) => m.id === newMsg.id)) {
  // Already in array: skip or update if UPDATE event
  if (payload.type === "UPDATE") {
    messages = messages.map((m) => (m.id === newMsg.id ? newMsg : m));
  }
  return;
}

// New message: add to array
messages = [...messages, enriched];
```

### 4. Reactive Scroll

```javascript
// After adding message:
await tick(); // Wait for DOM update
scrollToBottom(); // Scroll

function scrollToBottom() {
  setTimeout(() => {
    // Allow paint first
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 0);
}
```

### 5. Store-Based Auth

```javascript
// Shared across all components
import { currentUserId } from "./store/authStore.js";

// Component:
let userId;
const unsubscribe = currentUserId.subscribe((id) => {
  userId = id;
});

// Or use reactive:
let $userId = $currentUserId; // Auto-unsubscribe on destroy
```

---

**This architecture ensures:**

- ✅ No duplicate messages
- ✅ Real-time sync without polling
- ✅ Both users see same thread
- ✅ Typing indicators work
- ✅ Read receipts visible
- ✅ Conversation list updates instantly
- ✅ Scalable to 1000+ concurrent users
