import callState from "./state.js";
import { setupPeer } from "./index.js";

let isTargetAvailable = null;
let ringResolve = null;



//Ringing answer

//Function Send Ring Answer to calller
export const ringAnswer = async({socket,targetSocketId})=>{
    const result =  confirm("Accept the call");
    // console.log("alert result: ",result);
    console.log("ring answering ",result);
    socket.emit("ringing-answer",{
        to:targetSocketId,
        accepted:result,
    });
}

//Function to Accept Ring Answer from calee
export const setAnswer = ({accepted})=>{
    if(accepted){
        ringResolve({accepted});
        console.log("answer set Promise resolves to ",accepted);
    }else{
        ringResolve({accepted});
        // console.log("call rejected");
    }

}



//Function to create Offer If we already on another call
const createOfferWhileBusy = async(socket, targetSocketId)=>{

    //creating a new peer obj for target
     setupPeer(targetSocketId);


     //creating offer to other peper
     const offer = await callState.peers[targetSocketId].createOffer();

     if(!offer){
        console.error("ofer not created");
        return;
     }

     //setting offer to localDescription 
     await callState.peers[targetSocketId].setLocalDescription(offer);

     //Emmiting offer 
     socket.emit("offer",({to:targetSocketId, from:socket.id, offer:offer}));

     console.log("Local offer created and sent while busy",offer);


}

//Function to creat offer if Not on Any call already
const createOffer = async(socket,targetSocketId)=>{
    
    //checking if peer exists
    if(!callState.peers[socket.id]){
        console.error("Peer not found");
        return;
    }

   //checking if we are not on any call
   if(callState.peers[socket.id].connectionState === "connected" || 
      callState.peers[socket.id].connectionState === "connecting"){
          createOfferWhileBusy(socket, targetSocketId);
   }

   //creating offer
   const offer = await callState.peers[socket.id].createOffer();
   if(!offer){
    console.warn("offer does not exist");
    return;
   }

   //Setting offer to localDescription
   await callState.peers[socket.id].setLocalDescription(offer);

   //Emmmiting Offer to calee 
   socket.emit("offer",({to:targetSocketId,from:socket.id, offer:offer}));

//    console.log("local offer created and sent",offer);
   console.log(`local offer created ${offer} from: ${socket.id} send to:${targetSocketId}`)
    
}







//Function to handle incoming Offer from Caller 
export const handleOffer = async({socket, from,offer})=>{
    if(!socket || !from || !offer){
        console.error("data is not found");
        return;
    }else{
        console.log(`handleOffer called socket:${socket}, from:${from} offer:${offer}`)
    } 


     //checking current peer Obj 
        if(!callState.peers[socket.id]){
          console.error("peer is not exist yet for ",socket.id);
          console.log("no peer found for ",socket.id, "  all:",callState.peers);
          return;
        }else{
            console.log("Have current peer obje:",callState.peers);
        }

  
 //CASE 1 --    Not on Any Other Calll   
    //checking connection signalling state 
      if(callState.peers[socket.id].signalingState === "stable"){
        console.log("fist call: ",callState.peers[socket.id]);
        
        
       //Set remote description
     await callState.peers[socket.id].setRemoteDescription(offer);


       //Flush any queued ICE candidates  if candidates already arrived
      //check if ice candidate already arrived
         if(callState.candidateQueue[socket.id]){ 
        for(const candidate of callState.candidateQueue[socket.id]){
            try{
              await callState.peers[socket.id].addIceCandidate(candidate);
              console.log("flusshing candidate Quueue");
            }catch(err){
                console.error("Error while flushing ICE from queue ",err);
            }
        }
        delete callState.candidateQueue[socket.id];
             }

         // Create and send answer
    const answer = await callState.peers[socket.id].createAnswer();


     //saving answer 
    await callState.peers[socket.id].setLocalDescription(answer);


    //Emmmiting answer to server 
    socket.emit("answer",({from:socket.id, to:from, answer:answer}));
   

      console.log(`offer accepted, answer created ${answer} and sent ${from}`)  

}else if(callState.peers[socket.id].signalingState !== "stable"){
 // CASE 2 -- Alredy on Another Call
      
       //PeerObj for caller does not exit create it 
       if(callState.peers[from]){
        console.log("already have peer obj for caller");
        return;
       }
        
       //Creating peer obj for caller 
       setupPeer(from);
 
     //Set remote description
     await callState.peers[from].setRemoteDescription(offer);


       //Flush any queued ICE candidates  if candidates already arrived
      //check if ice candidate already arrived 
      if(callState.candidateQueue[from]){ 
        for(const candidate of callState.candidateQueue[from]){
            try{
              await callState.peers[from].addIceCandidate(candidate);
              console.log("flusshing candidate Quueue");
            }catch(err){
                console.error("Error while flushing ICE from queue ",err);
            }
        }
        delete callState.candidateQueue[from];
    }

         // Create and send answer
    const answer = await callState.peers[from].createAnswer();


     //saving answer 
    await callState.peers[from].setLocalDescription(answer);


    //Emmmiting answer to server 
    socket.emit("answer",({from:socket.id, to:from, answer:answer}));
    
    console.log(`offer accepted while on another call, answer created ${answer} and sent ${from}`);
}else{
    console.log("case does not match");
    return;
}

    
}



//Function to handle answer from Calleee
export const handleAnswer = async({socket,from ,answer})=>{
    if(!socket || !from || !answer){
        console.error("data is not found");
        return;
    }

    //checking signallingstate whether we have offer or not 

    //Set remote description from answer

    //Flush queued ICE candidates

    
    console.log("answer accepted");
}
















//StartCall function
export const startCall = async({targetSocketId,socket,ringing})=>{

    if(!targetSocketId){
        console.error("target socket id not found");
        return;
    }

    if(!callState.localStream){
        console.warn("local media must before calling others");
        return;
    }

    if(!callState.peers[socket.id]){
        console.error("Our peer obj is not found for",socket.id);
        return;
    }
    
   

    console.log("calling:",targetSocketId);


 //Ringing Feature
     if(ringing){

    isTargetAvailable = await new Promise((resolve)=>{
          ringResolve  = resolve;
   socket.emit(
      "ringing-ask",
      { from: socket.id, to: targetSocketId },
      (response)=>{
         resolve(response.accepted)
      }

   )

})

      if(isTargetAvailable.accepted){
        console.log("we can call ",isTargetAvailable);

//Ringing and Call accepted
      
      await createOffer(socket, targetSocketId);

      }else{
        console.log("call rejected ",isTargetAvailable);
      }
       
}//if no ringing



}









console.log("negotiationManager loaded.");