import callState from "./state.js"
import { ringAnswer,setAnswer, handleOffer,
    handleAnswer, iceHandler
 } from "./negotiationManager.js"






export const startSignalling = async(socket)=>{


//Asking for answer accept or reject
socket.on("ringing-ask",({from})=>{
    console.log(from," ringing us");
    // console.log("from: ",from);
    // console.log("peers: ",callState.peers);
   
    if(callState.peers[from]){
        if(callState.peers[from].connectionState !== "connected"){
            console.warn('already connected to him');
            return;
        } 
    }
    ringAnswer({socket,targetSocketId:from})
       


});


//Got the choice off callee.
socket.on("ringing-answer",({accepted})=>{
   setAnswer({accepted});

});




// Offer Recived from server 
socket.on("offer",({from, offer})=>{
    // console.log("offer event triggered");
       if(!from || !offer){
        console.error("data is not recived");
        return;
       }else{
        console.log(`recived offer:${offer} from:${from}`);
       }
        
   handleOffer({socket,offer,from});

})


//Answer recived from Calleee 
socket.on("answer",({from , answer})=>{
    if(!from || !answer){
        console.errror("data is not found");
        return;
    }

   handleAnswer({socket,from,answer});
})






//ICE Candidate Listner 
socket.on("icecandidate", ({ from, candidate }) => {
    if(!from || !candidate){
        console.warn("no data recived");
        return;
    }

    iceHandler({socket, from ,candidate});
})
// socket.on("icecandidate", ({ from, candidate }) => {
    
//     const pc = callState.peers[from];
    
//     // Peer hi nahi hai
//     if(!pc) return;

//     // RemoteDescription set hai ya nahi?
//     if(pc.remoteDescription && pc.remoteDescription.type) {
//         // ✅ Set hai — seedha add karo
//         pc.addIceCandidate(new RTCIceCandidate(candidate));
//     } else {
//         // ⏳ Set nahi — queue mein daalo
//         if(!callState.candidateQueue[from]) {
//             callState.candidateQueue[from] = [];
//         }
//         callState.candidateQueue[from].push(candidate);
//     }
// });



console.log("singaling file loaded");

}