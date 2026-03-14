import callState from "./state.js"







//Function To Start Media stream
export const startMedia = async({onLocalStream})=>{

    try{
      const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: "user",
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
            },
        });

   
        if(!stream){
            console.warn("mediaStreawm is not found");
            return;
        }
        
        callState.localStream = stream;
        console.log("mediaStream accessed: ",callState.localStream);
        console.log("localTracks: ",callState.localStream.getTracks());
        onLocalStream(callState.localStream);
        
    }catch(err){
        console.error(err);
    }
}