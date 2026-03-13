import callState from "./state.js"
import { ringAnswer,setAnswer, handleOffer } from "./negotiationManager.js"






export const startSignalling = async(socket)=>{


//Asking for answer accept or reject
socket.on("ringing-ask",({from})=>{
    console.log("someone ringing us");

    if(callState.peers[socket.id]){

       if(callState.peers[socket.id].connectionState !== "connected"){

          ringAnswer({socket,targetSocketId:from})

       } 
    }
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

    console.log("answer recived now going forward");
})




console.log("singaling file loaded");

}