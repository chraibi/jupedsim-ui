from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK

import json
import asyncio
from typing import List, Dict
from dataclasses import dataclass, asdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Agent:
    id: int
    position: tuple[float, float]
    # Add other agent properties as needed


class Simulation:
    def __init__(self):
        self.reset_agents()
        self.speed = 0.1
        self.iteration_count = 0
        self.is_running = True

    def reset_agents(self):
        # Create agents in a more spread out pattern
        self.agents = [
            Agent(id=1, position=(0.4, 0.4)),
            Agent(id=2, position=(0.8, 0.2)),
            Agent(id=3, position=(0.2, 0.8)),
            Agent(id=4, position=(0.8, 0.8)),
            Agent(id=5, position=(0.55, 0.55)),
        ]

    def set_parameters(self, params: dict):
        if "is_running" in params:
            self.is_running = params["is_running"]

        self.reset_agents()
        logging.info(
            f"Parameters updated: count={self.iteration_count}, running={self.is_running}"
        )

    def agent_count(self) -> int:
        return len(self.agents)

    def iterate(self):
        self.iteration_count += 1
        for agent in self.agents:
            x, y = agent.position
            # Circular motion for better visualization
            new_x = x + self.speed * (0.5 - y)
            new_y = y + self.speed * (x - 0.5)

            # Keep within bounds
            new_x = max(0, min(1, new_x))
            new_y = max(0, min(1, new_y))

            agent.position = (new_x, new_y)

    def get_agent_positions(self) -> List[Dict]:
        return [asdict(agent) for agent in self.agents]


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_data(data):
    required_keys = {"is_running", "speed"}
    if not isinstance(data, dict) or not required_keys.issubset(data.keys()):
        raise ValueError(f"Invalid data received: {data}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation = None  # Initialize simulation object

    try:
        while True:  # Keep connection open
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                try:
                    validate_data(data)
                except ValueError as e:
                    logging.info(f"Data validation error: {e}")
                    continue  # Skip this iteration
                logging.info(f"Got data: {data}")
                if "reset" in data and data["reset"]:
                    simulation = Simulation()
                    logging.info("Simulation reset")

                if "is_running" in data and data["is_running"]:
                    if simulation is None:  # Initialize simulation if not already
                        simulation = Simulation()
                        logging.info(">> Init simulation object")
                        simulation.set_parameters(data)
                        logging.info(
                            f"Start simulation with iteration count: {data['speed']}"
                        )

                elif "is_running" in data and not data["is_running"]:
                    logging.info("Simulation paused")
                    break  # Stop if simulation is paused

            except asyncio.TimeoutError:
                pass  # No message received, continue

            # If the simulation is running, iterate and send positions
            if (
                simulation
                and simulation.is_running
                and simulation.iteration_count < data["speed"]
            ):
                simulation.iterate()
                logging.info(
                    f"Simulation count {simulation.iteration_count} ({data['speed']})\r"
                )
                positions = simulation.get_agent_positions()
                # Prepare the payload with additional information
                payload = {
                    "positions": simulation.get_agent_positions(),
                    "iteration_count": simulation.iteration_count,
                    "speed": data["speed"],
                }
                await websocket.send_json(payload)

                await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        logging.info("WebSocket client disconnected")
    except ConnectionClosedError:
        logging.info("Connection closed with error")
    except ConnectionClosedOK:
        logging.info("Connection closed gracefully")
    except Exception as e:
        logging.info(f"WebSocket error: {e}")

    finally:
        await websocket.close()
        logging.info("WebSocket connection closed")


@app.get("/")
async def root():
    return {"message": "Simulation API is running"}
