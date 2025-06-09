from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
from starlette.websockets import WebSocketState
import jupedsim as jps
from shapely import Polygon, GeometryCollection
import pathlib
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_simulation():
    area = GeometryCollection(Polygon([(0, 0), (10, 0), (10, 10), (0, 10)]))

    simulation = jps.Simulation(
        model=jps.CollisionFreeSpeedModel(),
        geometry=area,
        trajectory_writer=jps.SqliteTrajectoryWriter(
            output_file=pathlib.Path("traj.sqlite"), every_nth_frame=1
        ),
    )

    stage_id = simulation.add_waiting_set_stage([(5, 5)])
    exit_id = simulation.add_exit_stage([(9, 4), (9, 6), (10, 6), (10, 4)])

    journey = jps.JourneyDescription([stage_id, exit_id])
    journey.set_transition_for_stage(
        stage_id, jps.Transition.create_fixed_transition(exit_id)
    )
    journey_id = simulation.add_journey(journey)

    agent_params = jps.CollisionFreeSpeedModelAgentParameters(
        journey_id=journey_id, stage_id=stage_id, radius=0.3
    )
    for pos in [(1, 1), (2, 2), (3, 3), (4, 4)]:
        agent_params.position = pos
        simulation.add_agent(agent_params)

    return simulation


def validate_data(data):
    required_keys = {"is_running", "speed"}
    if not isinstance(data, dict) or not required_keys.issubset(data.keys()):
        raise ValueError(f"Invalid data received: {data}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation = None
    speed = 100  # default max iterations
    is_running = False
    
    try:
        while True:
            # Check for incoming messages (non-blocking)
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.01)
                try:
                    validate_data(data)
                except ValueError as e:
                    logging.info(f"Data validation error: {e}")
                    continue  # Skip this iteration
                
                logging.info(f"Got data: {data}")

                # Handle reset
                if "reset" in data and data["reset"]:
                    simulation = create_simulation()
                    logging.info("Simulation reset")

                # Handle simulation start/stop
                if "is_running" in data:
                    is_running = data["is_running"]
                    if is_running and not simulation:
                        simulation = create_simulation()
                        logging.info(">> Init simulation object")
                    if "speed" in data:
                        speed = data["speed"]
                    
                    if is_running:
                        logging.info("Starting simulation")
                    else:
                        logging.info("Simulation paused")
                        
            except asyncio.TimeoutError:
                # No message received, continue with simulation if running
                pass

            # Run simulation iteration if conditions are met
            if (
                simulation
                and is_running
                and simulation.agent_count() > 0
                and simulation.iteration_count() < speed
            ):
                simulation.iterate()
                logging.info(
                    f"Simulation count {simulation.iteration_count() = } ({speed})"
                )

                agent_data = {
                    agent.id: {"x": agent.position[0], "y": agent.position[1]}
                    for agent in simulation.agents()
                }
                payload = {
                    "positions": agent_data,
                    "iteration_count": simulation.iteration_count(),
                    "remaining_agents": simulation.agent_count(),
                }
                
                await websocket.send_json(payload)
                
            # Small delay to prevent CPU spinning
            await asyncio.sleep(0.01)

    except WebSocketDisconnect:
        logging.info("WebSocket client disconnected")
    except ConnectionClosedError:
        logging.info("Connection closed with error")
    except ConnectionClosedOK:
        logging.info("Connection closed gracefully")
    except Exception as e:
        logging.info(f"WebSocket error: {e}")
    finally:
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
                logging.info("WebSocket connection closed")
        except Exception as e:
            logging.info(f"Error closing WebSocket: {e}")


@app.get("/")
async def root():
    return {"message": "JuPedSim WebSocket simulation running"}