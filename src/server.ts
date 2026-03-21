import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import routes from "./routes";
import socketHandler from "./socketHandler";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api", routes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

socketHandler(io);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
