

import callState from "./state.js";


// ─── ICE Server Config ────────────────────────────
const ICE_CONFIG = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ],
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
};


// =====================================================
// createPeer(socketId, config)
// =====================================================
// Ek naya RTCPeerConnection banata hai ek peer ke liye.
// Singleton nahi — har socketId ke liye alag instance.
// =====================================================

export function createPeer(socketId,{onLocalStream}) {

    // Already hai to wahi return karo
    if (callState.peers[socketId]) {
        console.warn("createPeer: peer already exists for", socketId);
        return callState.peers[socketId];
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);

    // STEP 1: Local tracks add karo
    if (callState.localStream) {
        callState.localStream.getTracks().forEach((track) => {
            pc.addTrack(track, callState.localStream);
        });
        if (onLocalStream) onLocalStream(callState.localStream);
    }

    // STEP 2: Remote stream aane pe — socketId se identify karo
    // pc.ontrack = (event) => {
    //     const stream = event.streams[0];
    //     callState.remoteStreams[socketId] = stream;
    //     if (onRemoteStream) onRemoteStream(socketId, stream);
    // };

    // // STEP 3: Data channel receive karo (callee side)
    // pc.ondatachannel = (event) => {
    //     if (!event?.channel) return;
    //     callState.dataChannels[socketId] = event.channel;
    //     callState.dataChannels[socketId].binaryType = "arraybuffer";
    //     callState.dataChannels[socketId].onmessage = (e) =>
    //         handleIncomingMessage(e, socketId);
    // };

    // STEP 4: ICE candidate bhejo — socketId se pata hai kisko bhejna hai
    // pc.onicecandidate = (event) => {
    //     if (!event.candidate) return;
    //     socket.emit("icecandidate", {
    //         to: socketId,
    //         from: socket.id,
    //         candidate: event.candidate,
    //     });
    // };

    // STEP 5: Connection state monitor karo
    // pc.onconnectionstatechange = () => {
    //     const state = pc.connectionState;
    //     console.log(`Peer [${socketId}] state:`, state);

    //     if (state === "failed" || state === "disconnected" || state === "closed") {
    //         setTimeout(() => {
    //             if (
    //                 pc.connectionState === "failed"     ||
    //                 pc.connectionState === "disconnected" ||
    //                 pc.connectionState === "closed"
    //             ) {
    //                 console.warn(`Peer [${socketId}] lost — cleaning up`);
    //                 destroyPeer(socketId);
    //                 if (onRemoteStream) onRemoteStream(socketId, null);
    //             }
    //         }, 5000);
    //     }
    // };

    // STEP 6: State mein save karo
    callState.peers[socketId] = pc;

    if(callState.peers[socketId]){
        console.log("Peer created for:", callState.peers[socketId]);
    }

    return pc;
}


// // =====================================================
// // getPeer(socketId)
// // =====================================================
// // Existing peer return karta hai.
// // Nahi hai to null.
// // =====================================================

// export function getPeer(socketId) {
//     return callState.peers[socketId] || null;
// }


// // =====================================================
// // destroyPeer(socketId)
// // =====================================================
// // Ek specific peer aur uska saara data clean karta hai.
// // Remote disconnect ya call end pe call karo.
// // =====================================================

// export function destroyPeer(socketId) {
//     const pc = callState.peers[socketId];
//     if (!pc) return;

//     pc.close();

//     // Candidate queue clear
//     delete callState.peers[socketId];
//     delete callState.remoteStreams[socketId];
//     delete callState.dataChannels[socketId];
//     delete callState.candidateQueue[socketId];

//     console.log("Peer destroyed for:", socketId);
// }


// // =====================================================
// // destroyAllPeers()
// // =====================================================
// // Saare peers destroy karo — call end ya page close pe.
// // =====================================================

// export function destroyAllPeers() {
//     Object.keys(callState.peers).forEach(destroyPeer);

//     // Local stream bhi band karo
//     if (callState.localStream) {
//         callState.localStream.getTracks().forEach((t) => t.stop());
//         callState.localStream = null;
//     }

//     console.log("All peers destroyed");
// }