

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
        // //checking for duplicte socketId
        // if(allUsers[socket.id]){
        //     console.warn("dublicate socket id is found");
        //     socket.emit('forced-relode');
        // }

        allUsers[socket.id]= {username:username};
        console.log("joined,",username);

        io.emit("updated-users",(allUsers));
    })




   socket.on("disconnect", (reason) => {
        console.log("Disconnected:", socket.id, "Reason:", reason);
        delete allUsers[socket.id];
        io.emit("updated-users", (allUsers));
    });



});


// ─── Start Server ─────────────────────────────────
const PORT=3000;
server.listen(PORT, () => {
    console.log(`listenig at ${PORT}`);
});