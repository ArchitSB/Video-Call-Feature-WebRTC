import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {useSocket} from "../providers/Socket";

const Homepage = () => {
    const {socket} = useSocket();
    const [email, setEmail] = useState();
    const [roomId, setRoomId] = useState();

    const handleRoomJoined = ({roomId}) => {
        Navigate(`/room/${roomId}`);
    }

    useEffect(() => {
        socket.on('joined-room', handleRoomJoined);
    }, [socket])
    
    const handleJoinRoom = () => {
        socket.emit("join-room", {
            roomId,
            emailId: email
        });
    }
    return(
        <div className = 'homepage-container'>
            <div className = "input-container"> 
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                <input value={roomId} onChange={e => setEmail(e.target.value)} type="text"/>
                <button onClick={handleJoinRoom}>Enter Room</button>
            </div>
        </div>
    )
};

export default Homepage;