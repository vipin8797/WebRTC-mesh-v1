import callState from "./state.js";
import { startMedia } from "./mediaManager.js";
import { createPeer } from "./peerManager.js";
import { startSignalling } from "./signalingManager.js";



// let _socket = null;
let _onLocalStream = null;
let _onRemoteStream = null;




//Funtion to create PeerObj with all Event Listners 
export const setupPeer = async(socketId)=>{
         
    //creating peerObj wiht socket id 
    createPeer(socketId);

    if(!callState.peers[socketId]){
       console.log("peer obj does not exit ");
       return;
    }

    //Adding all Events for Peer Objec 

  // adding Local Tracks to peerObje
     if(callState.localStream){
        callState.localStream.getTracks().forEach((track) =>{
         callState.peers[socketId].addTrack(track, callState.localStream);
        });
        if (_onLocalStream) _onLocalStream(callState.localStream);
     }
  
 //adding remote stream to peer 
     callState.peers[socketId].ontrack = (event)=>{
            const stream = event.streams[0];
            callState.remoteStreams[socketId] = stream;
          if (_onRemoteStream) _onRemoteStream(socketId, stream);
     };
    
    
    
    }    












export const startWebRTC = async({socket ,onLocalStream ,onRemoteStream})=>{
    //storing varaibles and callback globally in file 
    // _socket = socket;
    _onLocalStream = onLocalStream;
    _onRemoteStream = onRemoteStream;



       await startMedia();
       console.log("media started");

    //   createPeer(socket.id,{
    //     onLocalStream
    //   });
    setupPeer(socket.id);
   
       startSignalling(socket);

}