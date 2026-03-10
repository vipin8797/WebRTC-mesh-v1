import callState from "./state.js";
import { startMedia } from "./mediaManager.js";
import { createPeer } from "./peerManager.js";
import { startSignalling } from "./signalingManager.js";


export const startWebRTC = async({socket ,onLocalStream})=>{
     
       await startMedia();
       console.log("media started");

      createPeer(socket.id,{
        onLocalStream
      });
   
       startSignalling(socket);

}