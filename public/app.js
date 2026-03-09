// =====================================================================
//  public/app.js — UI MASTER CONTROLLER
//
//  SIMPLE RULE:
//    - Sirf UI logic yahan hai
//    - WebRTC / Socket code NAHI hai
//    - Apna code sirf "🔌" wali jagah pe lagao
//    - UI control ke liye "📤" wali functions use karo (export hain)
//
//  REMOTE VIDEO DESIGN:
//    - Har peer ka apna <video> element dynamically banta hai
//    - setRemoteStream(socketId, stream) — peer ID se identify hota hai
//    - removeRemoteStream(socketId)      — peer disconnect pe cleanup
//    - 1 peer  → full speaker view
//    - 2+ peer → grid layout automatically
// =====================================================================


// =====================================================================
//  IMPORTS  — apne modules yahan uncomment / add karo
// =====================================================================

import { initSocket } from "./socket/socket.js";



// =====================================================================
//  DOM — HTML elements (IDs mat badlo)
// =====================================================================

console.log("app.js loaded");


const loginScreen      = document.getElementById('login-screen');
const mainApp          = document.getElementById('main-app');
const usernameInput    = document.getElementById('username-input');
const joinBtn          = document.getElementById('join-btn');
const navStatus        = document.getElementById('nav-status');
const participantsBtn  = document.getElementById('participants-btn');
const onlineMenu       = document.getElementById('online-menu');
const onlineList       = document.getElementById('online-list');
const onlineCountText  = document.getElementById('online-count-text');
const btnMic           = document.getElementById('btn-mic');
const btnVideo         = document.getElementById('btn-video');
const btnScreen        = document.getElementById('btn-screen');
const btnChat          = document.getElementById('btn-chat');
const btnEnd           = document.getElementById('btn-end');
const chatPanel        = document.getElementById('chat-panel');
const closeChatBtn     = document.getElementById('close-chat');
const chatInputField   = document.getElementById('chat-input-field');
const btnSend          = document.getElementById('btn-send');
const chatMessages     = document.getElementById('chat-messages');
const typingIndicator  = document.getElementById('typingIndicator');
const speakerView      = document.getElementById('speaker-view');     // remote videos yahan inject hote hain
const waitingOverlay   = document.getElementById('waiting-overlay');
const localPip         = document.getElementById('local-pip');
const pipLabel         = document.getElementById('pip-label');
const participantStrip = document.getElementById('participant-strip');

export const localVideoEl = document.getElementById('local-video-element');


// =====================================================================
//  LOGIN
// =====================================================================

async function handleLogin() {
    const username = usernameInput.value.trim();
    if (username.length < 3) {
        usernameInput.classList.add('error');
        usernameInput.focus();
        return;
    }
    usernameInput.classList.remove('error');

    // 🔌 apna startup code yahan lagao
    // initSocket(username, { updateOnlineUsers });
    // startWebRTC(socket, { onLocalStream: setLocalStream, onRemoteStream: setRemoteStream });

    
       initSocket(username,{updateOnlineUsers});
  


    setNavStatus(`You: <span class="highlight">${username}</span>`);
    loginScreen.classList.remove('active');
    setTimeout(() => mainApp.classList.add('active'), 300);
}


// =====================================================================
//  CALL CONTROLS
// =====================================================================

btnMic.addEventListener('click', () => {
    btnMic.classList.toggle('muted');
    const muted = btnMic.classList.contains('muted');
    btnMic.querySelector('.ctrl-label').textContent = muted ? 'Unmute' : 'Mute';
    // 🔌 toggleAudio();
});

btnVideo.addEventListener('click', () => {
    btnVideo.classList.toggle('off');
    const off = btnVideo.classList.contains('off');
    localPip.classList.toggle('cam-off', off);
    btnVideo.querySelector('.ctrl-label').textContent = off ? 'Start Video' : 'Camera';
    // 🔌 toggleVideo();
});

btnScreen.addEventListener('click', async () => {
    // 🔌 await toggleScreenShare({ onLocalStream: (s) => setLocalStream(s, { mirror: false }) });
    // 🔌 const sharing = isLocalScreenSharing();
    const sharing = btnScreen.classList.toggle('active');
    localPip.classList.toggle('is-sharing', sharing);
    btnScreen.querySelector('.ctrl-label').textContent = sharing ? 'Stop Share' : 'Share';
});

btnEnd.addEventListener('click', () => {
    // 🔌 callEnd();
    _resetCallUI();
});


// =====================================================================
//  CHAT
// =====================================================================

function handleSendMessage() {
    const text = chatInputField.value.trim();
    if (!text) return;
    const msg = { text, time: _time() };
    appendMessage(msg, 'sent');
    chatInputField.value = '';
    // 🔌 sendMessage(msg);
    clearTimeout(_typingTimer);
    // 🔌 sendTyping(false);
}

chatInputField.addEventListener('input', () => {
    // 🔌 sendTyping(true);
    clearTimeout(_typingTimer);
    _typingTimer = setTimeout(() => {
        // 🔌 sendTyping(false);
    }, 1000);
});

function toggleChat() {
    const open = chatPanel.classList.toggle('open');
    btnChat.classList.toggle('active', open);
    btnChat.querySelector('.ctrl-label').textContent = open ? 'Close' : 'Chat';
}


// =====================================================================
//  📤 PUBLIC FUNCTIONS — WebRTC / Socket layer yahan se call karta hai
// =====================================================================

/**
 * setLocalStream(stream, options?)
 * Local camera ya screen stream PiP mein lagao.
 *
 * options:
 *   mirror  — boolean           camera: true, screen: false   (default: true)
 *   fit     — 'cover'|'contain'                               (default: 'cover')
 *   label   — string            PiP ka label                  (default: 'You')
 *   opacity — number            0 to 1                        (default: 1)
 *
 * Usage:
 *   setLocalStream(stream)
 *   setLocalStream(stream, { mirror: false, label: 'Presenting' })
 */
export function setLocalStream(stream, options = {}) {
    const { mirror = true, fit = 'cover', label = 'You', opacity = 1 } = options;
    localVideoEl.srcObject       = stream;
    localVideoEl.style.transform = mirror ? 'scaleX(-1)' : 'none';
    localVideoEl.style.objectFit = fit;
    localVideoEl.style.opacity   = opacity;
    pipLabel.textContent         = label;
}

/**
 * setRemoteStream(socketId, stream, options?)
 * Remote peer ka stream video mein lagao.
 * Har peer ke liye automatically naya <video> element banta hai.
 * Agar socketId pehle se hai to stream update ho jaata hai.
 *
 * socketId — string  peer ka unique socket ID (video identify karne ke liye)
 *
 * options:
 *   mirror  — boolean                                         (default: false)
 *   fit     — 'cover'|'contain'  screen share pe 'contain'   (default: 'cover')
 *   label   — string             naam badge dikhega           (default: '')
 *   opacity — number             0 to 1                      (default: 1)
 *
 * Usage:
 *   setRemoteStream('abc123', stream)
 *   setRemoteStream('abc123', stream, { label: 'Rahul' })
 *   setRemoteStream('abc123', stream, { fit: 'contain' })   // screen share
 */
export function setRemoteStream(socketId, stream, options = {}) {
    const { mirror = false, fit = 'cover', label = '', opacity = 1 } = options;

    // Pehle se hai to sirf stream update karo
    let card = document.getElementById(`remote-${socketId}`);

    if (!card) {
        // Naya video card banao
        card = document.createElement('div');
        card.className = 'remote-card';
        card.id = `remote-${socketId}`;
        card.innerHTML = `
            <video class="video-el" autoplay playsinline></video>
            <div class="remote-label"></div>`;
        speakerView.appendChild(card);
        _updateGrid();
    }

    const video = card.querySelector('video');
    video.srcObject       = stream;
    video.style.transform = mirror ? 'scaleX(-1)' : 'none';
    video.style.objectFit = fit;
    video.style.opacity   = opacity;

    if (label) {
        card.querySelector('.remote-label').textContent = label;
        card.querySelector('.remote-label').classList.add('visible');
    }

    waitingOverlay.classList.add('hidden');
}

/**
 * removeRemoteStream(socketId)
 * Peer disconnect hone pe uska video card hatao.
 *
 * Usage:
 *   removeRemoteStream('abc123')
 */
export function removeRemoteStream(socketId) {
    document.getElementById(`remote-${socketId}`)?.remove();
    _updateGrid();
    // Agar koi nahi bacha to waiting overlay wapas dikhao
    if (speakerView.querySelectorAll('.remote-card').length === 0) {
        waitingOverlay.classList.remove('hidden');
    }
}

/**
 * appendMessage(data, type)
 * Chat mein message bubble add karo.
 *
 * data:
 *   text     — string   message text
 *   time     — string   "10:42 AM"
 *   fileUrl  — string   (optional) download link
 *   fileName — string   (optional) file naam
 *
 * type: 'sent' | 'received' | 'system'
 *
 * Usage:
 *   appendMessage({ text: 'Hello', time: '10:00 AM' }, 'received')
 *   appendMessage({ text: 'Call started' }, 'system')
 *   appendMessage({ fileUrl: url, fileName: 'doc.pdf', time: '10:00 AM' }, 'received')
 */
export function appendMessage(data, type) {
    const div = document.createElement('div');
    if (type === 'system') {
        div.className   = 'msg-system';
        div.textContent = data.text;
    } else {
        div.className = `msg ${type}`;
        div.innerHTML = data.fileUrl
            ? `<a class="msg-file" href="${data.fileUrl}" download="${data.fileName || 'file'}">
                   📎 ${data.fileName || 'Download File'}
               </a><span class="msg-time">${data.time}</span>`
            : `<span class="msg-text">${data.text}</span>
               <span class="msg-time">${data.time}</span>`;
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * showTyping(isTyping)
 * Typing indicator show/hide karo.
 *
 * Usage:
 *   showTyping(true)
 *   showTyping(false)
 */
export function showTyping(isTyping) {
    typingIndicator.style.display = isTyping ? 'block' : 'none';
}

/**
 * setNavStatus(html)
 * Top bar mein status text update karo.
 *
 * Span classes:
 *   .highlight  → white bold
 *   .connected  → green bold
 *
 * Usage:
 *   setNavStatus('Waiting…')
 *   setNavStatus(`You: <span class="highlight">Vipin</span>`)
 *   setNavStatus(`Connected to <span class="connected">Rahul</span>`)
 */
export function setNavStatus(html) {
    navStatus.innerHTML = html;
}

/**
 * updateOnlineUsers(allUsers, myUsername)
 * Participants dropdown populate karo.
 * Socket se list aane pe call karo.
 *
 * allUsers:  { socketId: { username: 'Rahul' }, ... }
 *
 * Usage (socket.js mein):
 *   socket.on('online-users', (users) => updateOnlineUsers(users, myName))
 */
export function updateOnlineUsers(allUsers, myUsername) {
    const others = Object.entries(allUsers)
        .filter(([, u]) => u.username !== myUsername);

    onlineCountText.textContent = `Participants (${others.length})`;
    onlineList.innerHTML = others.length === 0
        ? `<div class="dropdown-empty">No one else is online</div>`
        : '';

    others.forEach(([socketId, user]) => {
        const row = document.createElement('div');
        row.className = 'user-row';
        row.innerHTML = `
            <div class="user-info">
                <div class="avatar">${user.username[0].toUpperCase()}</div>
                <span class="user-name">${user.username}</span>
            </div>
            <button class="call-btn" data-id="${socketId}" data-name="${user.username}">Call</button>`;

        row.querySelector('.call-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const { id, name } = e.currentTarget.dataset;
            // 🔌 calling(id);
            setNavStatus(`Calling <span class="highlight">${name}</span>…`);
            onlineMenu.classList.remove('open');
        });

        onlineList.appendChild(row);
    });
}

/**
 * setUI_CallConnected(peerUsername)
 * Call connect hone pe call karo.
 *
 * Usage:
 *   setUI_CallConnected('Rahul')
 */
export function setUI_CallConnected(peerUsername) {
    setNavStatus(`Connected to <span class="connected">${peerUsername}</span>`);
    waitingOverlay.classList.add('hidden');
}

/**
 * setUI_CallEnded()
 * Remote peer ne call khatam ki tab call karo.
 *
 * Usage:
 *   setUI_CallEnded()
 */
export function setUI_CallEnded() {
    _resetCallUI();
}

/**
 * addParticipantThumb(stream, username, socketId, options?)
 * Participant strip mein thumbnail add karo. (Mesh ke liye)
 *
 * options:
 *   mirror        — boolean                          (default: false)
 *   fit           — 'cover'|'contain'                (default: 'cover')
 *   activeSpeaker — boolean  green border dikhao     (default: false)
 *
 * Usage:
 *   addParticipantThumb(stream, 'Rahul', 'abc123')
 *   addParticipantThumb(stream, 'Priya', 'xyz789', { activeSpeaker: true })
 */
export function addParticipantThumb(stream, username, socketId, options = {}) {
    const { mirror = false, fit = 'cover', activeSpeaker = false } = options;
    if (document.getElementById(`thumb-${socketId}`)) return;
    const el = document.createElement('div');
    el.className = `thumb${activeSpeaker ? ' active-speaker' : ''}`;
    el.id = `thumb-${socketId}`;
    el.innerHTML = `
        <video autoplay playsinline style="width:100%;height:100%;object-fit:${fit};transform:${mirror ? 'scaleX(-1)' : 'none'};display:block;"></video>
        <div class="thumb-label">${username}</div>`;
    el.querySelector('video').srcObject = stream;
    participantStrip.appendChild(el);
}

/**
 * removeParticipantThumb(socketId)
 * Participant disconnect hone pe thumbnail hatao.
 *
 * Usage:
 *   removeParticipantThumb('abc123')
 */
export function removeParticipantThumb(socketId) {
    document.getElementById(`thumb-${socketId}`)?.remove();
}


// =====================================================================
//  PRIVATE HELPERS
// =====================================================================

/**
 * _updateGrid()
 * Remote cards ki count ke hisaab se speaker-view ka grid update karta hai.
 *
 *   1 peer  → full area (1 column)
 *   2 peers → side by side (2 columns)
 *   3-4     → 2x2 grid
 *   5+      → 3 column grid
 */
function _updateGrid() {
    const count = speakerView.querySelectorAll('.remote-card').length;
    const cols = count <= 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 2 : 3;
    speakerView.style.display             = 'grid';
    speakerView.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

function _resetCallUI() {
    // Saare remote video cards hatao
    speakerView.querySelectorAll('.remote-card').forEach(c => c.remove());
    speakerView.style.gridTemplateColumns = '';

    waitingOverlay.classList.remove('hidden');
    setNavStatus('Waiting to connect…');

    btnMic.classList.remove('muted');
    btnVideo.classList.remove('off');
    btnScreen.classList.remove('active');
    localPip.classList.remove('is-sharing', 'cam-off');

    btnMic.querySelector('.ctrl-label').textContent    = 'Mute';
    btnVideo.querySelector('.ctrl-label').textContent  = 'Camera';
    btnScreen.querySelector('.ctrl-label').textContent = 'Share';
    btnChat.querySelector('.ctrl-label').textContent   = 'Chat';
}

function _time() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let _typingTimer = null;


// =====================================================================
//  EVENT LISTENERS
// =====================================================================

joinBtn.addEventListener('click', handleLogin);
usernameInput.addEventListener('keypress', (e) => {
    usernameInput.classList.remove('error');
    if (e.key === 'Enter') handleLogin();
});

participantsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onlineMenu.classList.toggle('open');
});
document.addEventListener('click', () => onlineMenu.classList.remove('open'));
onlineMenu.addEventListener('click', (e) => e.stopPropagation());

btnChat.addEventListener('click', toggleChat);
closeChatBtn.addEventListener('click', toggleChat);
btnSend.addEventListener('click', handleSendMessage);
chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

window.addEventListener('beforeunload', () => {
    // 🔌 callEnd();
    // 🔌 socket?.disconnect();
});