// Minimal VM Hunter client for Node.js: stream a raw PCM file as if it were a call.
//
//   npm install ws
//   VMHUNTER_API_KEY=... node vmhunter-min.js callee.raw
//
// callee.raw: signed 16-bit little-endian PCM, mono, 8 kHz, no header.
// Protocol reference: https://vmhunter.com/docs/api
const fs = require("fs");
const WebSocket = require("ws");

const API_KEY = process.env.VMHUNTER_API_KEY || "";
const WS_URL = process.env.VMHUNTER_WS_URL || "wss://app.vmhunter.com/ws";
const path = process.argv[2] || "callee.raw";

const ws = new WebSocket(WS_URL);
ws.on("open", () => {
  ws.send(JSON.stringify({ config: { vid: "example-1", api_key: API_KEY, sample_rate: 8000, bytes_per_sample: 2 } }));
  const pcm = fs.readFileSync(path);
  let offset = 0;
  const timer = setInterval(() => {             // 20 ms frames, paced like a live call
    if (offset >= pcm.length || ws.readyState !== WebSocket.OPEN) {
      clearInterval(timer);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ eof: 1 }));
      return;
    }
    ws.send(pcm.subarray(offset, offset + 320));
    offset += 320;
  }, 20);
});
ws.on("message", (data) => {                     // exactly one verdict, then the server closes
  console.log(JSON.parse(data.toString()));       // { AMDSTATUS: "...", AMDCAUSE: "..." }
  ws.close();
});
ws.on("error", (e) => { console.error("error:", e.message); process.exit(1); });
