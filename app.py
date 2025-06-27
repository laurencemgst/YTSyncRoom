from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
socketio = SocketIO(app)

current_video = {
    "video_id": "vtJEEL1sspA",  # default video
    "is_playing": False,
    "timestamp": 0
}

@app.route("/")
def index():
    # pass `is_host` via query param ?host=1
    # is_host = request.args.get("host") == "1"
    is_host = True
    return render_template("index.html", is_host=is_host)

@socketio.on("connect")
def handle_connect():
    emit("load_video", current_video)

@socketio.on("load_video")
def handle_load_video(data):
    print("Received load_video:", data)
    video_id = data.get("video_id")
    emit("load_video", {"video_id": video_id}, broadcast=True)

@socketio.on("play")
def handle_play(data):
    current_video["is_playing"] = True
    current_video["timestamp"] = data["time"]
    emit("play", data, broadcast=True)

@socketio.on("pause")
def handle_pause(data):
    current_video["is_playing"] = False
    current_video["timestamp"] = data["time"]
    emit("pause", data, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True)
