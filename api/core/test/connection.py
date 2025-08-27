import asyncio
import json
import base64
import websockets
import numpy as np
from contextlib import closing
from typing import List, AsyncIterator, Tuple
from core.config import STORE_DIR, os

# =========================
# CẤU HÌNH (chỉnh ở đây)
# =========================
WS_SERVER_URL = "ws://localhost:8080/ws/v1/translate/"
USER_ID = os.environ.get("USER_ADMIN_ID")
ACCESS_TOKEN = os.environ.get("FOREVER_TOKEN_ACCESS")
WAV_FILES = list(STORE_DIR.glob("*.wav"))
CHUNK_MS     = 20        # mỗi chunk 20ms
THRESHOLD    = 0.20      # ngưỡng similarity
LINGER_SEC   = 0.5       # chờ phản hồi muộn sau khi gửi xong

# =========================
# WAV utils
# =========================
def read_wav_int16(path) -> tuple[np.ndarray, int]:
    """
    Đọc WAV chuẩn (RIFF, 16-bit PCM). Trả về:
      - samples mono int16 shape [T]
      - sample_rate (int)
    """
    import wave

    filename = os.fspath(path)  # <-- ép Path/str về chuỗi hệ thống
    with closing(wave.open(filename, "rb")) as wf:
        n_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        if n_frames == 0:
            raise RuntimeError(f"{filename}: WAV rỗng.")
        if sample_width != 2:
            raise RuntimeError(f"{filename}: WAV không phải 16-bit PCM (sample_width={sample_width}).")
        raw = wf.readframes(n_frames)

    samples = np.frombuffer(raw, dtype="<i2")  # int16 little-endian
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)
        samples = np.clip(samples, -32768, 32767).astype(np.int16)
    return samples, sr

def chunk_int16(samples: np.ndarray, sr: int, chunk_ms: int) -> AsyncIterator[bytes]:
    """
    Cắt samples int16 mono thành các chunk (bytes) kích thước chunk_ms.
    """
    chunk_len = int(sr * chunk_ms / 1000)
    if chunk_len <= 0:
        raise ValueError("chunk_ms quá nhỏ.")
    samples = samples.reshape(-1)
    total = samples.shape[0]

    async def _gen():
        i = 0
        while i < total:
            j = min(i + chunk_len, total)
            yield samples[i:j].astype("<i2").tobytes()
            i = j
    return _gen()

# =========================
# Receiver
# =========================
async def wait_for_response(websocket: websockets.WebSocketClientProtocol, stop_event: asyncio.Event):
    """
    Nhận và in mọi message từ server cho đến khi stop_event được set hoặc WS đóng.
    """
    try:
        while not stop_event.is_set():
            msg = await websocket.recv()
            try:
                data = json.loads(msg)
            except json.JSONDecodeError:
                print(f"[Recv raw] {msg}")
                continue

            mtype = data.get("type")
            if mtype == "voice.classification.filter.response":
                print(f"[Recv] {mtype} | is_speaker={data.get('is_speaker')} | score={data.get('similarity_score')}")
            else:
                print(f"[Recv] {json.dumps(data, ensure_ascii=False)}")
    except websockets.exceptions.ConnectionClosedOK:
        print("[Recv] Connection closed OK.")
    except websockets.exceptions.ConnectionClosedError as e:
        print(f"[Recv] Closed with error: {e}")
    except websockets.exceptions.ConnectionClosed:
        print("[Recv] Connection closed.")
    except Exception as e:
        print(f"[Recv] Error: {e}")

# =========================
# Classification Sender
# =========================
async def rund_audio_classification_loop(
    websocket: websockets.WebSocketClientProtocol,
):
    # Đăng ký voice filter
    register_msg = {
        "type": "voice.classification.register",
        "user_id": USER_ID,
        "threshold": THRESHOLD,
    }
    await websocket.send(json.dumps(register_msg))
    
    print(f"[Send] register | user_id={USER_ID} | threshold={THRESHOLD}")

    print(WAV_FILES)
    await asyncio.sleep(1)
    # Lần lượt gửi từng file
    for path in WAV_FILES:
        path_str = os.fspath(path)
        print(f"[Audio] Loading {path} ...")
        try:
            samples, sr = read_wav_int16(path_str)
        except Exception as e:
            print(f"[Audio] Skip {path}: {e}")
            continue

        if sr != 16000:
            print(f"[Warn] {path}: sr={sr}Hz (khuyến nghị 16000Hz để khớp model).")

        buffer = bytearray()

        async for pcm_bytes in chunk_int16(samples, sr, CHUNK_MS):
            buffer.extend(pcm_bytes)
            # 3200 samples int16 = 6400 bytes
            while len(buffer) >= 6400:
                chunk_to_send = buffer[:6400]
                buffer = buffer[6400:]
                payload = {
                    "type": "voice.classification.filter",
                    "audio_str": base64.b64encode(chunk_to_send).decode("ascii"),
                }
                await websocket.send(json.dumps(payload))
                await asyncio.sleep(CHUNK_MS / 1000.0)

        # Gửi phần dư cuối cùng (nếu còn)
        if buffer:
            payload = {
                "type": "voice.classification.filter",
                "audio_str": base64.b64encode(buffer).decode("ascii"),
            }
            await websocket.send(json.dumps(payload))

        print(f"[Send] Finished {path}")


# =========================
# Flow tổng
# =========================
async def inference():
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    print(f"[WS] Connecting to {WS_SERVER_URL} ...")
    async with websockets.connect(WS_SERVER_URL, additional_headers=headers, max_size=None) as websocket:
        print("[WS] Connected.")

        stop_event = asyncio.Event()
        recv_task = asyncio.create_task(wait_for_response(websocket, stop_event))

        try:
            await rund_audio_classification_loop(websocket)
            await asyncio.sleep(60)  # đợi phản hồi muộn
        finally:
            stop_event.set()
            try:
                await websocket.close()
            except:
                pass
            await recv_task

async def main():
    print("-" * 24)
    print("Inference and test processing")
    print("-" * 24)
    await inference()
    print("-" * 24)

if __name__ == "__main__":
    asyncio.run(main())
