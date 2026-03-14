

// =====================================================
//   SERVER — MAIN ENTRY POINT
// =====================================================
// Express + Socket.IO server.
// Serves static files and forwards WebRTC signals.
//
//  Handles: user registration, signaling, disconnection
//  No WebRTC logic here — only signal forwarding
// =====================================================


// ─── Dependencies ────────────────────────────────
import express          from "express";
import path             from "path";
import { createServer } from "node:http";
import { Server }       from "socket.io";
import { fileURLToPath } from "url";


// ─── App Setup ────────────────────────────────────
const app        = express();
const server     = createServer(app);
const io         = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


// ─── Middleware ───────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));


// ─── Routes ───────────────────────────────────────
app.get("/", (req, res) => {
    res.sendFile("index.html");
});


// ─── Online Users Store ───────────────────────────
// { socketId: { username } }
let allUsers = {};
let rooms = {};
let userRooms = {};

// =====================================================
// SOCKET.IO — SIGNALING SERVER
// =====================================================
// Only forwards signals between peers.
// No peer connection logic here.
// =====================================================

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);


    socket.on("user-joined",(username)=>{
        if(!username){
            console.error("usernmae is not found in backend event");
            return;
        }


        allUsers[socket.id]= {username:username};
        console.log("joined,",username);

        io.emit("updated-users",(allUsers));
    })




   socket.on("disconnect", (reason) => {
        console.log("Disconnected:", socket.id, "Reason:", reason);
        delete allUsers[socket.id];
        io.emit("updated-users", (allUsers));
    });






//Ringing Event 
socket.on("ringing-ask", ({ to, from }, callback) => {
   console.log("forwarding ringing ask");
    socket.to(to).emit("ringing-ask", { from });
});

//Ringing answer
socket.on("ringing-answer",({to,accepted})=>{
    console.log("forwarding ringing answer",accepted);
    socket.to(to).emit("ringing-answer",{accepted});
})




//Offer Forwarding 
socket.on("offer",({to, from ,offer})=>{
    if(!to || !from || !offer){
        console.log("data not recived");
        return;
    }
   socket.to(to).emit("offer", {from:from, offer:offer});
    console.log(`offer: ${offer} forwarded from:${from} to:${to}`);
})

//Answer Forwarding 
socket.on("answer",({to, from ,answer})=>{
    if(!to || !from || !answer){
        console.log("data is not found");
        return;
    }
    socket.to(to).emit("answer",({from,answer}));
    console.log(`answer: ${answer} forwarded from:${from} to:${to}`);
})


//ICE candidate forwarding 
socket.on("icecandidate",({to, from ,candidate})=>{
    if(!to || !from || !candidate){
        console.log("data not found");
        return;
    }

socket.to(to).emit("icecandidate", ({from ,candidate}));
console.log("ice candate forwarding");
})







//Room Update Handler
socket.on("room-update", ({ me, to }) => {
    if(!me || !to) return;

    const existingRoomId = userRooms[me] || userRooms[to];

    if(existingRoomId) {
        // Pehle se room hai → C aa raha hai
        rooms[existingRoomId].add(me);
        rooms[existingRoomId].add(to);
        userRooms[me] = existingRoomId;
        userRooms[to] = existingRoomId;

        // Existing users — me aur to dono hatao
        const existingUsers = Array.from(rooms[existingRoomId])
            .filter(id => id !== me)
            .filter(id => id !== to);

        if(existingUsers.length > 0) {
            //  C ko existing users ki list bhejo
            io.to(to).emit("existing-users", existingUsers);

            // //  Existing users (A, B) ko batao C aaya
            // existingUsers.forEach(userId => {
            //     io.to(userId).emit("new-user-joined", { socketId: to });
            // });
        }

    } else {
        // Pehli baar A + B → naya room, kisi ko kuch mat bhejo
        const roomId = `room_${Date.now()}`;
        rooms[roomId] = new Set([me, to]);
        userRooms[me] = roomId;
        userRooms[to] = roomId;
    }

    console.log("rooms:", rooms);
    console.log("userRooms:", userRooms);
});








});


// ─── Start Server ─────────────────────────────────
const PORT=3000;
server.listen(PORT, () => {
    console.log(`listenig at ${PORT}`);
});