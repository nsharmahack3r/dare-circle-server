const socket = io();

let currentRoom = null;
let playerId = null;

// 🔥 LISTEN FOR STATE SYNC
socket.on("room:update", (room) => {
  console.log("ROOM UPDATE", room);

  // 👉 render UI from this
  renderRoom(room);
});

socket.on("error", (msg) => {
  alert(msg);
});

function renderRoom(room) {
  document.body.innerHTML = `
    <h2>Room: ${room.code}</h2>
    <p>Status: ${room.status}</p>

    <h3>Players:</h3>
    <ul>
      ${room.players
        .map(
          (p) => `
        <li>
          ${p.name} 
          ${p.id === room.players[room.currentPlayerIndex]?.id ? "👈 TURN" : ""}
          ${p.hasPlayed ? "✅" : ""}
        </li>
      `,
        )
        .join("")}
    </ul>

    ${
      room.status === "waiting"
        ? `<button onclick="startGame()">Start Game</button>`
        : ""
    }

    ${
      room.status === "playing"
        ? `
        <button onclick="choose('truth')">Truth</button>
        <button onclick="choose('dare')">Dare</button>
        <button onclick="completeTurn()">Done</button>
      `
        : ""
    }
  `;
}

function startGame() {
  socket.emit("start-game", {
    code: currentRoom,
    playerId,
  });
}

function choose(choice) {
  socket.emit("choose", {
    code: currentRoom,
    playerId,
    choice,
  });
}

function completeTurn() {
  socket.emit("complete-turn", {
    code: currentRoom,
    playerId,
  });
}

async function createRoom() {
  const name = document.getElementById("name").value;

  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const room = await res.json();

  currentRoom = room.code;
  playerId = room.players[0].id;

  socket.emit("join-room", { code: currentRoom });

  console.log("Created room:", room);
}

async function joinRoom() {
  const name = document.getElementById("name").value;
  const code = document.getElementById("code").value;

  const res = await fetch(`/api/rooms/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const player = await res.json();

  currentRoom = code;
  playerId = player.id;

  socket.emit("join-room", { code });

  console.log("Joined room:", code);
}
