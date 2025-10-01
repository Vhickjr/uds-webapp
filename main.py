import eventlet

eventlet.monkey_patch()

from website import create_app
from flask_socketio import SocketIO
from website.websocket import socket
from pathlib import Path

# web app here
app = create_app()
app.register_blueprint(socket.socket_bp)

# to allow websocksts from JS later on
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")
socket.init_socket_routes(socketio)

# should be fixed up in prod
if __name__ == "__main__":
    # app.run(debug=True) # default flask method to start app - obsolete when using socketio
    print(f"Recordings will be saved to: {Path.absolute(Path('recordings'))}")
    socketio.run(app, host="0.0.0.0", port=5000)
