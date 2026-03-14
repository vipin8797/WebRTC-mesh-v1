import callState from "./state.js"
import { ringAnswer,setAnswer, handleOffer,
    handleAnswer, iceHandler, joinRoom
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




//ROOM Meembers lists listner
socket.on("existing-users",(data)=>{
    console.log("Other room Mememeber: ",data);

    //We have to call users in the data 
    joinRoom({socket,data});
    console.log("Users in rooms: ", data);
})

















console.log("singaling file loaded");

}