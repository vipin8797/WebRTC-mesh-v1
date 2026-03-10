import callState from "./state.js";

let isTargetAvailable = null;
let ringResolve = null;



//Ringing answer
// export const ringAnswer = async({socket,targetSocketId})=>{
//     console.log("ring answering true")
//   socket.emit("ringing-answer",({to:targetSocketId}));
// }

export const ringAnswer = async({socket,targetSocketId})=>{
    console.log("ring answering true")
   const result =  confirm("Accept the call");
            // console.log("alert result: ",result);
    socket.emit("ringing-answer",{
        to:targetSocketId,
        accepted:result,
    });
}

export const setAnswer = ({accepted})=>{
    if(accepted){
        ringResolve({accepted});
        console.log("answer set");
    }else{
        ringResolve({accepted});
        // console.log("call rejected");
    }

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
        console.error("Our peer obj is not found for",socketId);
        return;
    }
    
    console.log("calling:",targetSocketId);


 //Ringing Feature
    //   if(ringing){
    //     console.log("target is ringing");

    //     socket.emit("ringing-ask",({from:socket.id, to:targetSocketId}));

    //   }  

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











      }else{
        console.log("call rejected ",isTargetAvailable);
      }
       
}//if no ringing



}









console.log("negotiationManager loaded.");