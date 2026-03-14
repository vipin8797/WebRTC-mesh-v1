import callState from "./state.js";
import { setupPeer } from "./index.js";
// import { startWebRTC } from "./index.js";

let isTargetAvailable = null;
let ringResolve = null;



//Ringing answer

//Function Send Ring Answer to calller
export const ringAnswer = async({socket,targetSocketId})=>{
    const result =  confirm("Accept the call");
    // console.log("alert result: ",result);
    if(result){
        await setupPeer(targetSocketId);

    }
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



//Function to creat offer if Not on Any call already
const createOffer = async(socket,targetSocketId)=>{
     if(!socket || !targetSocketId){
        console.error("no data found");
        return;
     }
    //checking if peer exists
    if(!callState.peers[targetSocketId]){
        console.error("Peer not found");
        return;
    }

   //checking if we are not on any call
   if(callState.peers[targetSocketId].connectionState === "connected" || 
      callState.peers[targetSocketId].connectionState === "connecting"){
        //   createOfferWhileBusy(socket, targetSocketId);

        console.warn("already on a call");
        return;
   }

   //creating offer
   console.log("allPeers: ",callState.peers);
   const offer = await callState.peers[targetSocketId].createOffer();
   if(!offer){
    console.warn("offer does not exist");
    return;
   }

   //Setting offer to localDescription
   await callState.peers[targetSocketId].setLocalDescription(offer);

   //Emmmiting Offer to calee 
   socket.emit("offer",({to:targetSocketId,from:socket.id, offer:offer}));

//    console.log("local offer created and sent",offer);
   console.log(`local offer created ${offer} from: ${socket.id} send to:${targetSocketId}`);
   console.log("existed peers: ",callState.peers);
    
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
        if(!callState.peers[from]){
        //   console.error("peer is not exist yet for ",socket.id);
        //   console.log("no peer found for ",socket.id, "  all:",callState.peers);
          callState.peers[from] = setupPeer(from);
          console.log("creating peer for caller: ",callState.peers[from]);
          console.log("all Peers: ",callState.peers);
          
        }else{
            // console.log("Have current peer obje:",callState.peers);
            //  console.log("creating peer for caller: ",callState.peers[from]);
          console.log("all Peers: ",callState.peers);
        }

  
   
    //checking connection signalling state 
      if(callState.peers[from].signalingState !== "stable"){
        // console.log("fist call: ",callState.peers[from]);
        console.warn("signalingState is not stable of ",callState.peers[from]);
        return;
      }
        
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
   
    //   callState.currentTarget[socket.id] = from; //updating target socket id
      console.log(`offer accepted, answer created ${answer} and sent ${from}`)  

}



//Function to handle answer from Calleee
export const handleAnswer = async({socket,from ,answer})=>{
    if(!socket || !from || !answer){
        console.error("data is not found");
        return;
    }

     console.log(`got answer ${answer} from: ${from}`);
     console.log("all existed peer: ",callState.peers);
     


        //checkin if our initial peer obj exist
        if(!callState.peers[from]){
             console.error("target peer is not found");
             return
        }
        
       //checking signallingstate whether we have offer or not
         if(callState.peers[from].signalingState !== "have-local-offer"){
            console.error("we must have local offer before we accept answer");
            return;
         }  
        //Set remote description from answer
        await callState.peers[from].setRemoteDescription(answer);

        //Flush queued ICE candidates
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

        //   callState.currentTarget[socket.id] = from; //updating target socket id

        console.log("answer accepted:,",callState.peers[from]);



    
}









//Function to handle ICE Candiates 
export const iceHandler = async({socket, from ,candidate})=>{
    if(!from || !candidate || !socket){
        console.error("data not found");
        return;
    }

    console.log("getting ice candidates: ",candidate, "from: ",from);
    console.log("current Peers: ",callState.peers);

   
      const pc = callState.peers[from];

        if(!pc){
            console.error("peer obj not found");
            return;
        }

   
        // RemoteDescription set hai ya nahi?
    if(pc.remoteDescription && pc.remoteDescription.type) {
        //  Set hai — seedha add karo
        pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        //  Set nahi — queue mein daalo
        if(!callState.candidateQueue[from]) {
            callState.candidateQueue[from] = [];
        }
        callState.candidateQueue[from].push(candidate);
        console.log(`pushing candidate in queue in ${pc}`);
    }



}

     









//StartCall function
export const startCall = async({targetSocketId,socket,ringing})=>{
       console.log("startCall function is callled");
  
        if(!targetSocketId || !socket ){
            console.error("no data found");
            return;
        }


 //Ringing Feature
    if (ringing) {

        isTargetAvailable = await new Promise((resolve) => {
            ringResolve = resolve;
            socket.emit(
                "ringing-ask",
                { from: socket.id, to: targetSocketId },
                (response) => {
                    resolve(response.accepted)
                }

            )

        })

        if (isTargetAvailable.accepted) {
            console.log("we can call ", isTargetAvailable);

            //Ringing and Call accepted
        
             //creating peer for target in our side  and storing in callState
         await setupPeer(targetSocketId);




            if (!callState.peers[targetSocketId]) {
                console.warn("peer for target does not exist yet.");
                return;
            }
            console.log("calling:", targetSocketId);

              await createOffer(socket, targetSocketId);

        } else {
            console.log("call rejected ", isTargetAvailable);
        }

    }//if no ringing




}









console.log("negotiationManager loaded.");