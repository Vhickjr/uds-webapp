from collections import defaultdict
from flask import Blueprint, Flask, session, request
from flask_socketio import emit
import base64
from .videorecorder import VideoRecorder, BufferedVideoRecorder

# from os.path import getsize

# Store connected users {socket_id: user_info}
active_sessions = {}


socket_bp = Blueprint("socket_bp", __name__)
socketio = None


def init_socket_routes(sio):
    global socketio
    socketio = sio

    @socketio.on("connect")
    def handle_connect():
        session_id = request.sid
        print(f"Client connected: {session_id}")

        # Create new recorder for this session
        active_sessions[session_id] = VideoRecorder(session_id)

        emit("server_message", "Connected to video stream server")
        emit("server_message", f"Session ID: {session_id}")

    @socketio.on("video_frame")
    def handle_video_frame(data):
        frame_data = base64.b64decode(data["frame"])
        frame_number = data["frameNumber"]

        # Process the frame (save, analyze, etc.)
        print(f"Received frame #{frame_number}")

        session_id = request.sid

        if session_id not in active_sessions:
            emit("error", "No active recording session")
            return

        recorder = active_sessions[session_id]
        frame_number = data.get("frameNumber", 0)
        frame_data = data.get("frame")

        # Update FPS if provided
        if recorder.frame_count == 0 and "fps" in data:
            recorder.fps = data["fps"]

        # Add frame to video
        success = recorder.add_frame(frame_data)

        if success:
            # Send acknowledgment every 30 frames to reduce overhead
            if frame_number % 30 == 0:
                emit(
                    "frame_received",
                    {"frameNumber": frame_number, "totalFrames": recorder.frame_count},
                )
        else:
            emit("error", f"Failed to process frame {frame_number}")

    @socketio.on("stop_stream")
    def handle_stop():
        session_id = request.sid
        print(f"Stream stopped by client: {session_id}")

        if session_id in active_sessions:
            recorder = active_sessions[session_id]
            output_path = recorder.finalize()

            if output_path:
                emit("server_message", f"Video saved: {output_path}")
                print(f"Saved video on stop: {output_path}")
                del active_sessions[session_id]

    @socketio.on("disconnect")
    def handle_disconnect():
        session_id = request.sid
        print(f"Client disconnected: {session_id}")

        if session_id in active_sessions:
            recorder = active_sessions[session_id]
            output_path = recorder.finalize()

            if output_path:
                print(f"Auto-saved video on disconnect: {output_path}")

            del active_sessions[session_id]
