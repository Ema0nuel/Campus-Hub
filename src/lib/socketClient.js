import io from 'socket.io-client';

let socket = null;
const listeners = new Map();

export const initSocket = (token, serverUrl = 'https://campus-hangout.onrender.com') => {
    return new Promise((resolve, reject) => {
        if (socket && socket.connected) {
            console.log('[Socket] Already connected');
            resolve({ connected: true, socket, socketId: socket.id });
            return;
        }

        socket = io(serverUrl, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected with ID:', socket.id);
            resolve({ connected: true, socket, socketId: socket.id });
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            reject(error);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('reconnect', () => {
            console.log('[Socket] Reconnected');
        });

        socket.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed');
        });
    });
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initSocket() first.');
    }
    return socket;
};

export const joinConversation = (conversationId) => {
    if (!socket) return Promise.reject(new Error('Socket not initialized'));

    return new Promise((resolve, reject) => {
        socket.emit(
            'conversation:join',
            { conversation_id: conversationId },
            (response) => {
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    console.log(`[Socket] Joined conversation: ${conversationId}`);
                    resolve(response);
                }
            }
        );
    });
};

export const leaveConversation = (conversationId) => {
    if (!socket) return Promise.reject(new Error('Socket not initialized'));

    return new Promise((resolve, reject) => {
        socket.emit(
            'conversation:leave',
            { conversation_id: conversationId },
            (response) => {
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    console.log(`[Socket] Left conversation: ${conversationId}`);
                    resolve(response);
                }
            }
        );
    });
};

/**
 * DO NOT USE for sending messages – use REST API /messages/send instead
 * Socket schema mismatch; kept for backwards compatibility only
 */
export const sendMessage = (conversationId, receiverId, content) => {
    console.warn(
        '[Socket] sendMessage is deprecated. Use REST API sendMessage() instead.'
    );
    if (!socket) return Promise.reject(new Error('Socket not initialized'));

    return Promise.reject(
        new Error('Use REST API sendMessage() instead of socket emit')
    );
};

export const emitTyping = (conversationId, userId) => {
    if (!socket || !conversationId || !userId) return;
    socket.emit('typing:start', { conversation_id: conversationId, user_id: userId });
};

export const stopTyping = (conversationId, userId) => {
    if (!socket || !conversationId || !userId) return;
    socket.emit('typing:stop', { conversation_id: conversationId, user_id: userId });
};

export const markAsRead = (conversationId, messageIds) => {
    if (!socket) return Promise.reject(new Error('Socket not initialized'));

    if (!conversationId || !messageIds || messageIds.length === 0) {
        return Promise.reject(new Error('Missing conversation_id or message_ids'));
    }

    return new Promise((resolve, reject) => {
        socket.emit(
            'message:read',
            { conversation_id: conversationId, message_ids: messageIds },
            (response) => {
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    console.log('[Socket] Messages marked as read');
                    resolve(response);
                }
            }
        );
    });
};

export const on = (eventName, callback) => {
    if (!socket) {
        console.warn('[Socket] Cannot register listener: socket not initialized');
        return;
    }

    if (!listeners.has(eventName)) {
        listeners.set(eventName, []);
    }
    listeners.get(eventName).push(callback);

    socket.on(eventName, callback);
};

export const off = (eventName, callback) => {
    if (!socket) return;

    socket.off(eventName, callback);

    if (listeners.has(eventName)) {
        const callbacks = listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
};

export const disconnect = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        listeners.clear();
        console.log('[Socket] Disconnected and cleaned up');
    }
};