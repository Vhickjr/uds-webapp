from collections import defaultdict
from flask import Blueprint, Flask, session, request
from flask_socketio import emit, join_room, leave_room, disconnect

# Store connected users {socket_id: user_info}
connected_users = {}
# Alternative: Track users by user_id {user_id: [socket_ids]}
users_sockets = defaultdict(list)

socket_bp = Blueprint('socket_bp', __name__)
socketio = None

def init_socket_routes(sio):
    global socketio
    socketio = sio
    
    @socketio.on('connect')
    def handle_connect():
        print('Connected')
        emit('connection_response', {'status': 'connected'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Disconnected')


