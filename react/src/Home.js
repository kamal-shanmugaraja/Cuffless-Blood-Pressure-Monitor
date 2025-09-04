// Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Cuffless Blood Pressure Monitoring System</h1>
      <Link to="/register">
        <button className="home-button">Register Patient Details</button>
      </Link>
      <Link to="/select-patient">
        <button className="home-button">View Patient Data</button>
      </Link>
    </div>
  );
}

export default Home;
