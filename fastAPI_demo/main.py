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


def get_geometry_data():
    """Return geometry data for frontend visualization"""
    return {
        "boundary": [(0, 0), (10, 0), (10, 10), (0, 10)],
        "obstacle": [(4, 4), (6, 4), (6, 6), (4, 6)],
        "exit": [(6, 8), (7, 8), (7, 9), (6, 9)],
        "dist_area": [(0, 0), (4, 0), (4, 4), (0, 4)],
    }


def create_simulation():
    geometry_data = get_geometry_data()

    # Extract geometry components
    boundary_coords = geometry_data["boundary"]
    obstacle_coords = geometry_data["obstacle"]
    exit_coords = geometry_data["exit"]
    dist_area = geometry_data["dist_area"]

    main_area = Polygon(boundary_coords)
    obstacle = Polygon(obstacle_coords)

    walkable_area = main_area.difference(obstacle)
    area = GeometryCollection([walkable_area])

    simulation = jps.Simulation(
        model=jps.CollisionFreeSpeedModel(),
        geometry=area,
        trajectory_writer=jps.SqliteTrajectoryWriter(
            output_file=pathlib.Path("traj.sqlite"), every_nth_frame=1
        ),
    )

    exit_id = simulation.add_exit_stage(exit_coords)

    journey = jps.JourneyDescription([exit_id])
    journey_id = simulation.add_journey(journey)

    # Add agents with the journey
    agent_params = jps.CollisionFreeSpeedModelAgentParameters(
        journey_id=journey_id, stage_id=exit_id, radius=0.3
    )
    positions = jps.distribute_by_number(
        polygon=Polygon(dist_area),
        number_of_agents=5,
        distance_to_agents=0.4,
        distance_to_polygon=0.2,
        seed=1234,
    )
    for pos in positions:
        agent_params.position = pos
        simulation.add_agent(agent_params)

    return simulation


def validate_data(data):
    required_keys = {"is_running", "count"}
    if not isinstance(data, dict) or not required_keys.issubset(data.keys()):
        raise ValueError(f"Invalid data received: {data}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation = None
    count = 100  # default max iterations
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
                    is_running = False  # Reset running state
                    logging.info("Simulation reset")

                    # Send geometry data when simulation is reset/created
                    geometry_payload = {
                        "type": "geometry",
                        "geometry": get_geometry_data(),
                    }
                    try:
                        await websocket.send_json(geometry_payload)
                    except Exception as e:
                        logging.error(f"Error sending geometry data: {e}")
                        break

                # Handle simulation start/stop
                if "is_running" in data:
                    is_running = data["is_running"]
                    if is_running and not simulation:
                        simulation = create_simulation()
                        logging.info(">> Init simulation object")

                        # Send geometry data when simulation is first created
                        geometry_payload = {
                            "type": "geometry",
                            "geometry": get_geometry_data(),
                        }
                        try:
                            await websocket.send_json(geometry_payload)
                        except Exception as e:
                            logging.error(f"Error sending geometry data: {e}")
                            break

                    if "count" in data:
                        count = data["count"]

                    if is_running:
                        logging.info("Starting simulation")
                    else:
                        logging.info("Simulation paused")

            except asyncio.TimeoutError:
                # No message received, continue with simulation if running
                pass
            except Exception as e:
                logging.error(f"Error receiving WebSocket message: {e}")
                break

            # Run simulation iteration if conditions are met
            if (
                simulation
                and is_running
                and simulation.agent_count() > 0
                and simulation.iteration_count() < count
            ):
                simulation.iterate()
                logging.info(
                    f"Simulation count {simulation.iteration_count() = } ({count})"
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

                try:
                    await websocket.send_json(payload)
                except Exception as e:
                    logging.error(f"Error sending WebSocket message: {e}")
                    break

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
