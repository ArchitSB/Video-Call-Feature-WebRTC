import React, { useEffect, useCallback, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const navigate = useNavigate();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  // Mute/unmute audio
  const handleToggleAudio = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled((prev) => !prev);
    }
  };

  // Turn on/off video
  const handleToggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled((prev) => !prev);
    }
  };

  // Leave call handler
  const handleLeaveCall = () => {
    // Stop all local tracks
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }
    setMyStream(null);
    setRemoteStream(null);

    // Notify others in the room
    socket.emit("user:leave");

    // Navigate back to lobby
    navigate("/");
  };

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    const handleUserLeft = () => {
        setRemoteStream(null);
        setRemoteSocketId(null);
    };

    socket.on("user:left", handleUserLeft);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("user:left", handleUserLeft);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>
        {remoteSocketId ? (
          <span style={{ color: "#61dafb" }}>Connected</span>
        ) : (
          <span style={{ color: "#ff7675" }}>No one in room</span>
        )}
      </h4>
      <div style={{ margin: "18px 0" }}>
        {myStream && (
          <>
            <button onClick={sendStreams} style={{ marginRight: 12 }}>
              Send Stream
            </button>
            <button
              onClick={handleToggleAudio}
              style={{
                marginRight: 12,
                background: audioEnabled
                  ? "linear-gradient(90deg, #61dafb 0%, #1e90ff 100%)"
                  : "linear-gradient(90deg, #ff7675 0%, #d63031 100%)",
              }}
              title={audioEnabled ? "Mute" : "Unmute"}
            >
              {audioEnabled ? "Mute" : "Unmute"}
            </button>
            <button
              onClick={handleToggleVideo}
              style={{
                marginRight: 12,
                background: videoEnabled
                  ? "linear-gradient(90deg, #61dafb 0%, #1e90ff 100%)"
                  : "linear-gradient(90deg, #ff7675 0%, #d63031 100%)",
              }}
              title={videoEnabled ? "Turn Off Video" : "Turn On Video"}
            >
              {videoEnabled ? "Video Off" : "Video On"}
            </button>
            <button
              onClick={handleLeaveCall}
              style={{
                marginRight: 12,
                background: "linear-gradient(90deg, #ff7675 0%, #d63031 100%)",
              }}
              title="Leave Call"
            >
              Leave Call
            </button>
          </>
        )}
        {remoteSocketId && (
          <button onClick={handleCallUser} style={{ marginLeft: 12 }}>
            CALL
          </button>
        )}
      </div>
      <div className="stream-section">
        {myStream && (
          <div className="stream-box">
            <h2 style={{ color: "#61dafb" }}>My Stream</h2>
            <ReactPlayer
              className="react-player"
              playing
              muted
              height="140px"
              width="240px"
              url={myStream}
            />
          </div>
        )}
        {remoteStream && (
          <div className="stream-box">
            <h2 style={{ color: "#1e90ff" }}>Remote Stream</h2>
            <ReactPlayer
              className="react-player"
              playing
              muted={false}
              height="140px"
              width="240px"
              url={remoteStream}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
