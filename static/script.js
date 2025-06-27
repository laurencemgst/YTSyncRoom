let player;
let playerReady = false;
const socket = io();

// YouTube IFrame API will call this when it's ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: "",
    events: {
      onReady: () => {
        console.log("YouTube Player Ready");
        playerReady = true;
      },
      onStateChange: onPlayerStateChange,
    },
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Extract YouTube video ID from a full URL or use raw ID
function extractVideoId(input) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]+)/;
  const match = input.match(regex);
  return match ? match[1] : input;
}

// Only host can trigger this
function loadVideo() {
  const input = document.getElementById("videoInput").value.trim();
  const videoId = extractVideoId(input);
  if (videoId) {
    console.log("Emitting load_video with", videoId);
    socket.emit("load_video", { video_id: videoId });
  } else {
    alert("Invalid YouTube link or ID.");
  }
}

function onPlayerStateChange(event) {
  if (!player || !isHost) return;

  const time = player.getCurrentTime();

  if (event.data === YT.PlayerState.PLAYING) {
    socket.emit("play", { time });
  } else if (event.data === YT.PlayerState.PAUSED) {
    socket.emit("pause", { time });
  }
}

// SOCKET EVENTS
socket.on("load_video", (data) => {
  const videoId = data.video_id;
  const timestamp = data.timestamp || 0;

  const tryLoad = () => {
    if (playerReady && player && typeof player.loadVideoById === "function") {
      console.log("Loading video:", videoId);
      player.loadVideoById(videoId, timestamp);
    } else {
      console.warn("Player not ready, retrying...");
      setTimeout(tryLoad, 500);
    }
  };

  tryLoad();
});

socket.on("play", (data) => {
  if (!player) return;
  const t = Math.abs(player.getCurrentTime() - data.time);
  if (t > 1) player.seekTo(data.time, true);
  player.playVideo();
});

socket.on("pause", (data) => {
  if (!player) return;
  player.pauseVideo();
});
