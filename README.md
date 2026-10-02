# VM Hunter API examples

Minimal clients for the [VM Hunter](https://vmhunter.com) WebSocket API, for building your own integration with a dialer or platform that the bundled clients do not cover.

Protocol reference: https://vmhunter.com/docs/api

## The protocol in four steps

1. Open a WebSocket to `ws://app.vmhunter.com:2701`. One connection per call.
2. Send one text frame: `{"config": {"vid": "<your call id>", "api_key": "<key>", "sample_rate": 8000, "bytes_per_sample": 2}}`
3. Send the callee's audio as binary frames: signed 16-bit little-endian PCM, mono, 8 kHz, no headers. 20 ms (320 bytes) frames as they arrive from the call are ideal.
4. Read one text frame: `{"AMDSTATUS": "HUMAN" | "MACHINE" | "CALLGUARD" | "FAILED", "AMDCAUSE": "<reason>"}`. The server then closes the socket. Stop sending audio as soon as it arrives.

`{"eof": 1}` tells the server you have no more audio. It is optional; the server decides on its own when audio stops.

## Examples

| Folder | Language | Install |
|---|---|---|
| `python/` | Python 3 | `pip install websocket-client` |
| `node/` | Node.js | `npm install ws` |

Both read a raw PCM file and stream it at real-time pace. To make one from a WAV: `sox call.wav -r 8000 -c 1 -b 16 -e signed-integer -t raw callee.raw`

In a real integration, read the socket while you stream and stop as soon as the verdict arrives, as the [Asterisk client](https://github.com/vmhunterhq/vmhunter-asterisk) does.

## Timing

The engine decides on roughly the first 2 seconds of audio and may listen up to 3 seconds while the callee is still talking. Start streaming the moment the call is answered; anything buffered before the first frame pushes the verdict later. Send only the far end.

## Get a key

Free tier: 5,000 calls a month, no card: https://vmhunter.com/register

## License

MIT. See `LICENSE`.
