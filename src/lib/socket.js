// @ts-nocheck

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let socketConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function initSocket() {
    if (socket && socketConnected) {
        console.log('ℹ️  [Socket] Already connected, returning existing instance');
        return socket;
    }

    const token = localStorage.getItem('auth_token');

    if (!token) {
        console.error('❌ [Socket] Cannot initialize: no auth token in localStorage');
        return null;
    }

    try {
        console.log('🔌 [Socket] Initializing with auth handshake...');
        connectionAttempts = 0;

        socket = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            socketConnected = true;
            connectionAttempts = 0;
            console.log(`✅ [Socket] Connected - ID: ${socket.id}, Auth: Valid`);
        });

        socket.on('connect_error', (error) => {
            socketConnected = false;
            console.error(`❌ [Socket] Connection error:`, error.message);

            if (
                error.message.includes('401') ||
                error.message.includes('Unauthorized') ||
                error.message.includes('auth')
            ) {
                console.error('🔴 [Socket] Auth failed - token invalid or expired');
                import('../store/authStore.js').then(({ forceLogout }) => {
                    forceLogout();
                });
                return;
            }

            connectionAttempts++;
            if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error(
                    `❌ [Socket] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`
                );
                socketConnected = false;
            }
        });

        socket.on('disconnect', (reason) => {
            socketConnected = false;
            console.warn(`⚠️  [Socket] Disconnected - Reason: ${reason}`);
        });

        socket.on('error', (error) => {
            console.error('❌ [Socket] Error:', error);
        });

        return socket;
    } catch (error) {
        console.error('❌ [Socket] Initialization failed:', error.message);
        socket = null;
        socketConnected = false;
        return null;
    }
}

export function getSocket() {
    return socket;
}

export function isSocketConnected() {
    return !!(socket && socketConnected && socket.connected);
}

export function getSocketId() {
    return socket?.id || null;
}

export function disconnectSocket() {
    if (socket) {
        console.log('🔌 [Socket] Disconnecting...');
        socket.disconnect();
        socket = null;
        socketConnected = false;
        connectionAttempts = 0;
        console.log('✅ [Socket] Disconnected');
    }
}

export function joinConversation(conversationId) {
    return new Promise((resolve, reject) => {
        if (!isSocketConnected()) {
            console.error('❌ [Socket] Cannot join conversation: socket not connected');
            reject(new Error('Socket not connected'));
            return;
        }

        console.log(`📍 [Socket] Joining conversation: ${conversationId}`);

        socket.emit('conversation:join', { conversationId }, (response) => {
            if (response?.error) {
                console.error(`❌ [Socket] Join failed: ${response.error}`);
                reject(new Error(response.error));
                return;
            }

            console.log(`✅ [Socket] Joined conversation: ${conversationId}`);
            resolve(response);
        });
    });
}

export function leaveConversation(conversationId) {
    if (!isSocketConnected()) {
        console.warn('⚠️  [Socket] Cannot leave conversation: socket not connected');
        return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
        console.log(`📍 [Socket] Leaving conversation: ${conversationId}`);

        socket.emit('conversation:leave', { conversationId }, (response) => {
            if (response?.error) {
                console.error(`❌ [Socket] Leave failed: ${response.error}`);
                reject(new Error(response.error));
                return;
            }

            console.log(`✅ [Socket] Left conversation: ${conversationId}`);
            resolve(response);
        });
    });
}

export function emitMessage(conversationId, receiverId, content) {
    return new Promise((resolve, reject) => {
        if (!isSocketConnected()) {
            reject(new Error('Socket not connected'));
            return;
        }

        if (!content?.trim()) {
            reject(new Error('Message content cannot be empty'));
            return;
        }

        console.log(`💬 [Socket] Sending message via socket`);

        socket.emit(
            'message:send',
            {
                conversationId,
                receiverId,
                content: content.trim(),
            },
            (response) => {
                if (response?.error) {
                    console.error(`❌ [Socket] Message send failed: ${response.error}`);
                    reject(new Error(response.error));
                    return;
                }

                console.log(`✅ [Socket] Message sent: ${response.messageId}`);
                resolve(response);
            }
        );
    });
}

export function onMessageReceived(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (message) => {
        console.log(`📨 [Socket] Message received: ${message.id}`);
        callback(message);
    };

    socket.on('message:received', handler);

    return () => {
        console.log('[Socket] Unsubscribing from message:received');
        socket.off('message:received', handler);
    };
}

export function emitTypingStart(conversationId) {
    if (!isSocketConnected()) {
        console.warn('⚠️  [Socket] Cannot emit typing: socket not connected');
        return;
    }

    console.log(`🖊️  [Socket] Emitting typing:start for conversation: ${conversationId}`);
    socket.emit('typing:start', {
        conversationId,
        userId: socket.id,
    });
}

export function emitTypingStop(conversationId) {
    if (!isSocketConnected()) {
        console.warn('⚠️  [Socket] Cannot emit typing stop: socket not connected');
        return;
    }

    console.log(`⏹️  [Socket] Emitting typing:stop for conversation: ${conversationId}`);
    socket.emit('typing:stop', {
        conversationId,
        userId: socket.id,
    });
}

export function onTypingStart(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        if (data.userId !== socket.id) {
            console.log(`🖊️  [Socket] Remote user typing: ${data.userId}`);
            callback(data);
        }
    };

    socket.on('typing:start', handler);

    return () => {
        console.log('[Socket] Unsubscribing from typing:start');
        socket.off('typing:start', handler);
    };
}

export function onTypingStop(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        if (data.userId !== socket.id) {
            console.log(`⏹️  [Socket] Remote user stopped typing: ${data.userId}`);
            callback(data);
        }
    };

    socket.on('typing:stop', handler);

    return () => {
        console.log('[Socket] Unsubscribing from typing:stop');
        socket.off('typing:stop', handler);
    };
}

export function onUserPresence(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        console.log(
            `[Socket] Presence: ${data.userId} is ${data.online ? 'online' : 'offline'}`
        );
        callback(data);
    };

    socket.on('user:presence', handler);

    return () => {
        console.log('[Socket] Unsubscribing from user:presence');
        socket.off('user:presence', handler);
    };
}

export function onUserOnline(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        console.log(`🟢 [Socket] User online: ${data.userId}`);
        callback(data);
    };

    socket.on('user:online', handler);

    return () => {
        console.log('[Socket] Unsubscribing from user:online');
        socket.off('user:online', handler);
    };
}

export function onUserOffline(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        console.log(`⚫ [Socket] User offline: ${data.userId}`);
        callback(data);
    };

    socket.on('user:offline', handler);

    return () => {
        console.log('[Socket] Unsubscribing from user:offline');
        socket.off('user:offline', handler);
    };
}

export function onConversationDeleted(callback) {
    if (!socket) {
        console.warn('⚠️  [Socket] Socket not initialized');
        return () => { };
    }

    const handler = (data) => {
        console.log(`🗑️  [Socket] Conversation deleted: ${data.conversationId}`);
        callback(data);
    };

    socket.on('conversation:deleted', handler);

    return () => {
        console.log('[Socket] Unsubscribing from conversation:deleted');
        socket.off('conversation:deleted', handler);
    };
}

export default {
    initSocket,
    getSocket,
    isSocketConnected,
    getSocketId,
    disconnectSocket,
    joinConversation,
    leaveConversation,
    emitMessage,
    onMessageReceived,
    emitTypingStart,
    emitTypingStop,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onUserPresence,
    onConversationDeleted,
};