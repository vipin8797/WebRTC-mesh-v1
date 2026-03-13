

 const callState = {
  localStream:null,
  peers:{},
  remoteStreams:{},
  dataChannels:{},
  candidateQueue:{},
  currentTarget: {},  // temporary fix jugad

};


export default callState;






export const getPeerObj = (socketId)=>{
    if(peers[socketId]){
        return peers[socketId];
    }else{
        return null;
    }
}


export const getRemoteStream = (socketId)=>{

}


// peers: {
//     'B': {
//         connection: RTCPeerConnection,
//         remoteStream: MediaStream,
//         username: 'Rahul'
//     }
// }
// Ek jagah sab kuch, getter bhi simple
