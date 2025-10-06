import React from "react";
import { Link } from "react-router-dom";
import './Navbar.css'
import logWhite from '../assets/logoWhite.png'

function Navbar() {

    const handleLogout = () => {
        localStorage.clear();
        // localStorage.removeItem("token");
        alert("You have been logged out.");
      };


    return (
        <>
            <div className="topNav">
                <p>Welcome,Admin</p>
                <Link  to='/login' onClick={handleLogout}>LogOut</Link>
            </div>

            <div className="navMain">
                <Link to='/' id="logoCon">
                    <img src={logWhite} alt="logo" className="logo" />
                </Link>

                <Link to='/' >
                    Home
                </Link>
                <Link to="/aboutus">About Us</Link>
                <Link to="/services">Services</Link>
                <Link to="/gallery">Gallery</Link>
                <Link to="/upcomingEvents">Upcoming Events</Link>
                <Link to="/sponsorConferences">Conferences List</Link>
                <Link to="/sponsorList">Sponsor List</Link>
                <Link to="/adminContact">Contact Form</Link>
                <Link to="/newsletterList">Newsletter List</Link>
                
                {/* <Link to="/pastEvent">Add PastEvents</Link> */}
                {/* <Link to="/pastEventsList">PastEvents List</Link> */}
            </div>
        </>
    )
}

export default Navbar