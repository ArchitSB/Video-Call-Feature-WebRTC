import React from 'react';
import {useSocket} from "../providers/Socket";

const Homepage = () => {
    const {socket} = useSocket();
    socket.emit("join-room", {
        roomId: "1",
        emailId: "<email>"
    });
    return(
        <div className = 'homepage-container'>
            <div className = "input-container"> 
                <input type="email" placeholder="Enter your email here"/>
                <input type="text" placeholder="Enter Room Code"/>
                <button>Enter Room</button>
            </div>
        </div>
    )
};

export default Homepage;