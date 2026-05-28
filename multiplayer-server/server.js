const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 9000;
const pathName = process.env.PATH_NAME || '/';

// 1. Initialize Socket.io Server with CORS enabled
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 2. Initialize PeerJS Signaling Server Middleware
const peerServer = ExpressPeerServer(server, {
    path: '/',
    allow_discovery: true
});

// Mount PeerJS on pathName (default is '/')
app.use(pathName, peerServer);

// 3. Memory store for active matchmaking challenges
const activeChallenges = new Map();

// 4. Main Chat Socket Namespace (Direct Messages and Group Chats)
io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join personal room for background notifications
    socket.on('join_user_room', (username) => {
        if (!username) return;
        const roomName = `user_${username}`;
        socket.join(roomName);
        console.log(`[Socket.io] Client ${socket.id} joined personal room: ${roomName}`);
    });

    // Join active conversation room (DM or Group)
    socket.on('join_chat_room', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`[Socket.io] Client ${socket.id} joined conversation room: ${roomId}`);
    });

    // Leave conversation room
    socket.on('leave_chat_room', (roomId) => {
        if (!roomId) return;
        socket.leave(roomId);
        console.log(`[Socket.io] Client ${socket.id} left conversation room: ${roomId}`);
    });

    // Handle incoming messages
    socket.on('send_message', (data, callback) => {
        if (!data || !data.room_id) {
            if (typeof callback === 'function') callback({ success: false, error: 'Invalid message payload' });
            return;
        }

        console.log(`[Socket.io] Message received in room ${data.room_id} from ${data.sender}`);

        // Broadcast the message to everyone in the room (including the sender if they listen)
        socket.to(data.room_id).emit('message', data);

        // If it's a Direct Message, also send it as a background notification to the receiver
        if (data.receiver && data.receiver !== data.sender) {
            const receiverRoom = `user_${data.receiver}`;
            socket.to(receiverRoom).emit('notification', {
                type: 'dm',
                target: data.sender, // The sender is the one B needs to display notifications for
                msg: {
                    username: data.sender,
                    text: data.text,
                    time: data.time,
                    isChallenge: data.isChallenge,
                    gameType: data.gameType,
                    roomId: data.roomId
                }
            });
        }

        // For group chats, other members will get notified via the group room if they don't have it active
        if (data.isGroup && data.group_id) {
            // Emits notification to everyone in the group room except the sender
            socket.to(data.room_id).emit('notification', {
                type: 'group',
                target: data.group_id,
                groupName: data.groupName || 'Group',
                msg: {
                    username: data.sender,
                    text: data.text,
                    time: data.time,
                    isChallenge: data.isChallenge,
                    gameType: data.gameType,
                    roomId: data.roomId
                }
            });
        }

        if (typeof callback === 'function') {
            callback({ success: true });
        }
    });

    // Custom connection heartbeat ping/pong listener
    socket.on('ping', () => {
        socket.emit('pong');
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});

// 5. Matchmaking / Challenge Socket Namespace
const challengeNamespace = io.of('/chess-challenges');
challengeNamespace.on('connection', (socket) => {
    console.log(`[Matchmaker] Client connected: ${socket.id}`);

    // Create a challenge lobby in memory
    socket.on('create_challenge_room', (data, callback) => {
        if (!data || !data.challenger || !data.opponent || !data.gameType) {
            if (typeof callback === 'function') callback({ success: false, error: 'Invalid challenge metadata' });
            return;
        }

        // Generate clean random 6-character room ID
        const challengeRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        activeChallenges.set(challengeRoomId, {
            roomId: challengeRoomId,
            gameType: data.gameType,
            challenger: data.challenger,
            opponent: data.opponent,
            status: 'waiting',
            createdAt: Date.now()
        });

        socket.join(challengeRoomId);
        console.log(`[Matchmaker] Challenge created. Room ID: ${challengeRoomId} [${data.gameType}] for ${data.challenger} -> ${data.opponent}`);

        if (typeof callback === 'function') {
            callback({ success: true, roomId: challengeRoomId });
        }
    });

    // Join challenge lobby (opponent joining)
    socket.on('join_challenge_room', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`[Matchmaker] Client ${socket.id} joined challenge room: ${roomId}`);
    });

    // Cancel challenge invitation
    socket.on('cancel_challenge', (data) => {
        if (!data || !data.roomId) return;
        console.log(`[Matchmaker] Challenge cancelled for room: ${data.roomId}`);
        activeChallenges.delete(data.roomId);
        socket.to(data.roomId).emit('challenge_cancelled', data);
    });

    // Decline challenge invitation
    socket.on('decline_challenge', (data) => {
        if (!data || !data.roomId) return;
        console.log(`[Matchmaker] Challenge declined for room: ${data.roomId}`);
        activeChallenges.delete(data.roomId);
        socket.to(data.roomId).emit('challenge_declined', data);
    });

    // Accept challenge / Start Game session
    socket.on('accept_challenge', (data) => {
        if (!data || !data.roomId) return;
        console.log(`[Matchmaker] Challenge accepted for room: ${data.roomId}`);
        
        const challenge = activeChallenges.get(data.roomId);
        if (challenge) {
            challenge.status = 'playing';
            activeChallenges.set(data.roomId, challenge);
        }
        socket.to(data.roomId).emit('challenge_accepted', data);
    });

    socket.on('disconnect', () => {
        console.log(`[Matchmaker] Client disconnected: ${socket.id}`);
    });
});

// 6. Start the unified server
server.listen(port, () => {
    console.log(`================================================================`);
    console.log(`  Unified PeerJS & Socket.io Server running on port ${port}`);
    console.log(`  PeerJS Signaling mounted on path: ${pathName}`);
    console.log(`  Websocket Chat listening on default namespace`);
    console.log(`  Websocket Matchmaker listening on /chess-challenges namespace`);
    console.log(`================================================================`);
});
