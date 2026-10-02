"""Minimal VM Hunter client: stream a raw PCM file as if it were a call.

    pip install websocket-client
    python3 vmhunter_min.py callee.raw

callee.raw: signed 16-bit little-endian PCM, mono, 8 kHz, no header.
Protocol reference: https://vmhunter.com/docs/api
"""
import json
import os
import sys
import time

from websocket import create_connection

API_KEY = os.environ.get("VMHUNTER_API_KEY", "")
WS_URL = os.environ.get("VMHUNTER_WS_URL", "ws://app.vmhunter.com:2701")

path = sys.argv[1] if len(sys.argv) > 1 else "callee.raw"
ws = create_connection(WS_URL, timeout=10)
ws.send(json.dumps({"config": {"vid": "example-1", "api_key": API_KEY,
                               "sample_rate": 8000, "bytes_per_sample": 2}}))

with open(path, "rb") as f:
    while chunk := f.read(320):      # 20 ms per frame
        ws.send_binary(chunk)
        time.sleep(0.02)             # pace it like a live call
ws.send(json.dumps({"eof": 1}))     # optional: "no more audio, decide now"

print(json.loads(ws.recv()))        # {"AMDSTATUS": "...", "AMDCAUSE": "..."}
ws.close()
