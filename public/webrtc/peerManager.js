
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



//Function to create Peer Obj only and storing it in callState
 export const createPeer = async(socketId)=>{
     if(!socketId){
        console.error("socket is not found");
        return;
     }

    //check if already an peer exist byt this socketId
    if(callState.peers[socketId]){
        console.warn("already peerObj exist for this socket");
        return callState.peers[socketId];
    }

    //Iff not create another one 
   const pc = new RTCPeerConnection(ICE_CONFIG);

   //storing it in global variable 
   callState.peers[socketId] = pc;

    if(!callState.peers[socketId]){
        console.error("not createed yet");
        return;
    }
    console.log("peer obj created: ",callState.peers);
    
 
}






















