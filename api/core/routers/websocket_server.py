from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import websockets
from core.config import os

router = APIRouter()

AVSS_SERVER = os.getenv("AVSS_SERVER_ENDPOINT")
ACCESS_TOKEN = os.getenv("FOREVER_TOKEN_ACCESS")
HEADERS = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

async def forward_avss_to_client(avss_ws, client_ws: WebSocket, stop_event: asyncio.Event):
    try:
        while not stop_event.is_set():
            msg = await avss_ws.recv()
            try:
                # đảm bảo là string, nếu bytes thì decode
                if isinstance(msg, bytes):
                    msg = msg.decode("utf-8")
                await client_ws.send_text(msg)
            except Exception as e:
                stop_event.set()
                break
    except websockets.exceptions.ConnectionClosed:
        print("[AVSS] closed connection.")
        stop_event.set()
    except Exception as e:
        print(f"[Forward AVSS->Client] recv error: {repr(e)}")
        stop_event.set()


async def forward_client_to_avss(client_ws: WebSocket, avss_ws, stop_event: asyncio.Event):
    try:
        while not stop_event.is_set():
            msg = await client_ws.receive_text()
            await avss_ws.send(msg)
    except WebSocketDisconnect:
        print("[Client] disconnected.")
        stop_event.set()
    except Exception as e:
        print(f"[Forward Client->AVSS] error: {repr(e)}")
        stop_event.set()


@router.websocket("/")
async def websocket_server(client_ws: WebSocket):
    await client_ws.accept()
    # await client_ws.send_json({
    #     "type": "websocket.connection.established",
    #     "message": "WebSocket connection established successfully."
    # })

    stop_event = asyncio.Event()
    try:
        async with websockets.connect(
            AVSS_SERVER, 
            additional_headers=HEADERS,
            max_size=None
        ) as avss_ws:
            print("[AVSS] Connected.")

            # chạy song song 2 task forward
            task1 = asyncio.create_task(forward_avss_to_client(avss_ws, client_ws, stop_event))
            task2 = asyncio.create_task(forward_client_to_avss(client_ws, avss_ws, stop_event))

            # chờ một trong hai kết thúc
            _, pending = await asyncio.wait(
                [task1, task2],
                return_when=asyncio.FIRST_COMPLETED
            )
            stop_event.set()

            # cancel task còn lại
            for task in pending:
                task.cancel()
    finally:
        try:
            await client_ws.close()
        except:
            pass
