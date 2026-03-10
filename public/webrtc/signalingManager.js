import callState from "./state.js"
import { ringAnswer,setAnswer } from "./negotiationManager.js"







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





console.log("singaling file loaded");

}