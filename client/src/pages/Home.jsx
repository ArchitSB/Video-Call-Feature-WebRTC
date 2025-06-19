import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {useSocket} from "../providers/Socket";

const Homepage = () => {
    const {socket} = useSocket();
    const [email, setEmail] = useState();
    const [roomId, setRoomId] = useState();

    const handleRoomJoined = useCallback(({roomId}) => {
        Navigate(`/room/${roomId}`);
    },[Navigate]);

    useEffect(() => {
        socket.on('joined-room', handleRoomJoined);
        return () => {
            socket.off('joined-room', handleRoomJoined);
        }
    }, [handleRoomJoined, socket])
    
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