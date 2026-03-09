

// ─── Socket Instance ──────────────────────────────
export const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});


// ─── Initialize Socket ────────────────────────────
// Registers user on server and handles incoming events
export function initSocket(username, { updateOnlineUsers }) {

    if (!username) {
        console.error("initSocket: username not received");
        return;
    }

    if (!socket) {
        console.error("initSocket: socket instance not found");
        return;
    }




   


 if(socket.connected){
        console.log("connected: ",socket.id);
        socket.emit('user-joined',(username));

    }



    socket.on("updated-users",(allUsers)=>{
       if(!allUsers){
        console.error("did not get updated users");
        return;
       }
      updateOnlineUsers(allUsers,username);
       console.log("udpated users: ",allUsers);
    })



    socket.on('forced-relode',()=>{
        window.location.reload();
    });



      socket.on("disconnect", (reason) => {

        console.warn("Socket disconnected:", reason);

    });

}