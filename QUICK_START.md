# Quick Start Guide - Campus Hub

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Verify `.env` has:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

Run the schema SQL in Supabase Studio (SQL Editor):

```sql
-- Provided in the rebuild request
-- Creates: users, conversations, messages, typing_indicators tables
-- Creates: Triggers for auto-update on new message
-- Creates: Indexes for performance
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 📱 Test Scenario

### Test Case 1: Basic Registration & Login

**User A**:

```
1. Click "Create one" (register link)
2. Enter phone: +1 (555) 123-4567
3. Enter password: Password123!
4. Verify password strength indicator turns green
5. Confirm password matches
6. Click "Create Account"
7. See success message
8. Automatically directed to Create Profile page
```

**Expected**:

- User A account created in Supabase
- Redirected to Create Profile

**Create Profile**:

```
1. Enter name: "Alice Smith"
2. Leave avatar blank (optional)
3. Leave bio blank (optional)
4. Click "Complete Profile"
5. Directed to Conversations page
```

**Expected**:

- Profile saved to users table
- Conversations list empty (no contacts yet)

---

### Test Case 2: Second User Registration

**User B** (Same browser, incognito/Private mode):

```
1. Register with phone: +1 (555) 987-6543
2. Password: SecurePass456!
3. Complete profile: "Bob Johnson"
4. See empty conversations list
```

**Expected**: Two separate accounts in database

---

### Test Case 3: Send First Message

**User A (Original Tab)**:

```
1. Click "+" (FloatingActionButton)
2. NewConversationModal appears
3. Enter User B's phone: +1 (555) 987-6543
4. Click "Start Conversation"
5. ChatWindow opens
```

**Expected**:

- Conversation automatically created
- Empty chat with "No messages yet"
- ChatInput ready for typing

**User A Sends Message**:

```
1. Type: "Hey Bob! 👋"
2. Press Enter (or Shift+Enter for newline)
3. Message appears immediately on left (gray bubble, role="receiver")
4. Sent with ✓ (single checkmark)
```

**Expected in Logs**:

```
[MessageService] 📤 Sending message
[MessageService] ✅ Sent: abc12345...
[Supabase] 💬 New message: abc12345...
```

---

### Test Case 4: Receive Message in Real-time

**User B (Incognito Tab)**:

```
1. Conversations page shows 1 conversation
2. Item shows: "Bob Johnson" | "Alice Smith" | "Hey Bob! 👋" | "just now" | "1" (unread)
3. Click conversation
4. ChatWindow opens with Alice's message
5. Message automatically marked as read (✓ → ✓✓)
```

**Expected Logs**:

```
[Supabase] 💬 New message: abc12345...
[ChatWindow] 💬 New message received: abc12345...
[MessageService] ✓ Marked read: conv-id...
```

---

### Test Case 5: Typing Indicator

**User B Types**:

```
1. Focus on ChatInput
2. Type: "Hey Alice, how are you?"
3. Watch console: Should see `[MessageService] ✏️ Typing...`
4. Stop typing, wait 3 seconds
5. Console should show: `[MessageService] 🤐 Stopped typing`
```

**Future**: When implemented, User A would see "Bob is typing..." beneath input

---

### Test Case 6: Reply & Read Receipts

**User A Receives Message**:

```
1. In ChatWindow, new message appears immediately
2. Shows as left bubble (gray, role="receiver")
3. Has ✓ (unread)
```

**User B Marks Read**:

```
1. Call `markConversationAsRead()` when ChatWindow loads
2. User A sees ✓✓ on their message
3. Unread badge goes from "1" → "0" in conversation list
```

**Expected Flow**:

```
User B opens chat
  ↓
ChatWindow calls markConversationAsRead()
  ↓
UPDATE messages SET is_read=true
  ↓
Supabase sends UPDATE event
  ↓
User A ChatWindow receives UPDATE payload
  ↓
MessageBubble re-renders with ✓✓
```

---

### Test Case 7: Offline → Online Sync

**User A (Sends messages while disconnected)**:

```
1. Open DevTools → Network → Offline (simulate)
2. Type and send message
3. Should fail gracefully with error banner (future)
4. Go back online
5. Retry button resends
```

**Expected**:

- Error handling prevents duplicate sends
- Realtime subscription resumes

---

### Test Case 8: Conversation List Real-time

**Both Users Online, Chat Open**:

**User A Sends Message**:

```
Message appears in A's chat window immediately
```

**User B's Conversation List (Background)**:

```
1. Alice's conversation moves to top
2. Last message preview updates to new message
3. Timestamp shows "just now"
4. Unread badge appears or increments
5. All without page reload
```

**Expected**:

- Realtime subscription on conversations table fires
- Conversation list refreshes automatically

---

## 🧪 Console Debug Output

Watch for these patterns during testing:

### Successful Message Flow

```
[MessageService] 📤 Sending message
[MessageService] ✅ Sent: abc123ab
[Supabase] 💬 New message: abc123ab
[ChatWindow] 💬 New message received: abc123ab
[MessageService] ✓ Marked read: conv-id
```

### Realtime Subscription

```
[Supabase] ✅ Initialized
[ChatWindow] 📡 Setting up realtime subscriptions
[ChatWindow] ✅ Subscribed to 2 channels (user + participant conversations)
[ChatWindow] ✅ Typing subscription active
```

### Auth Flow

```
[Auth] Registering with phone: +1 (555) 123-4567
[Auth] ✅ User created: user1234ab
[Auth] ✅ Profile created
[Auth] ✅ Init complete – User: user1234ab
```

### Error States

```
[ChatWindow] ❌ No conversation ID available
[MessageService] ❌ Conversation error: ...
[Supabase] ⚠️ User ID not available
```

---

## 🔍 Testing Tools

### Supabase Studio

1. Open `https://app.supabase.com`
2. Go to SQL Editor
3. Run queries to spy on tables:

```sql
-- Check newly created user
SELECT * FROM users WHERE phone_number = '+1 (555) 123-4567';

-- Check conversations for user
SELECT * FROM conversations WHERE user_id = '{user-id}';

-- Check messages in conversation
SELECT * FROM messages WHERE conversation_id = '{conv-id}' ORDER BY created_at DESC LIMIT 10;

-- Check typing indicators
SELECT * FROM typing_indicators WHERE conversation_id = '{conv-id}';

-- Monitor triggers firing
SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 5;
```

### Browser DevTools

**Console Tab**:

- Filter by `[ChatWindow]`, `[MessageService]`, `[Supabase]`
- Clear and watch real-time log updates

**Network Tab**:

- Should see WebSocket connections to Supabase
- No HTTP calls to custom API (only Supabase endpoints)

**Application Tab**:

- Check localStorage: `auth_token` should exist after login
- Check IndexedDB: Supabase stores cached auth there

---

## ✅ Success Criteria

**All Passed** = Production Ready:

- [ ] Registration works without errors
- [ ] Login persists session
- [ ] Profile completion required before messaging
- [ ] First message creates conversation automatically
- [ ] Messages appear in real-time (<100ms)
- [ ] Read receipts (✓ → ✓✓) update in real-time
- [ ] Typing indicator activates on text input
- [ ] Conversation list shows all conversations
- [ ] Last message preview truncates to ~100 chars
- [ ] Unread badge updates without page reload
- [ ] Both users see same message thread
- [ ] ChatWindow handles `participantId` being null gracefully
- [ ] Logout clears session + auth token
- [ ] Can re-login to same account
- [ ] Dark mode toggle works (if implemented)
- [ ] No JavaScript errors in console

---

## 🐛 Common Issues & Fixes

### "User not authenticated"

- **Cause**: `currentUserId` store hasn't populated yet
- **Fix**: Wait for auth.initialize() to complete
- **See**: App.svelte loading screen

### "No conversation found"

- **Cause**: First message scenario, no conversation created yet
- **Fix**: `getOrCreateConversation()` auto-creates on first send
- **Should**: Send message → conversation appears

### Messages not appearing in real-time

- **Cause**: Supabase channel not subscribed
- **Check**: Browser console for subscription errors
- **Fix**: Check Supabase API keys in .env

### Duplicate messages

- **Cause**: Realtime arrives before local optimistic add
- **Fix**: Deduplication via Map<id, message> in ChatWindow
- **Should**: Never see same message twice

### Profile not saving

- **Cause**: updateProfile() called with wrong schema
- **Fix**: Ensure `name` field is updated (triggers profileComplete check)

---

## 📊 Performance Targets

- **Message send-to-receive**: < 150ms
- **Conversation list load**: < 500ms
- **Real-time update latency**: < 100ms
- **First paint**: < 2s

Monitor with DevTools Performance tab during testing.

---

**Ready to Test!** Open two browser tabs/windows and verify the checklist above.
