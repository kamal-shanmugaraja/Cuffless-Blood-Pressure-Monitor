import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './MeasurementComponent.css'; // Import CSS file

const MeasurementComponent = () => {
  const [message, setMessage] = useState('');
  const [startFlag, setStartFlag] = useState(false);
  const { patientId } = useParams();

  useEffect(() => {
    // Fetch patient data or perform other operations based on patientId
  }, [patientId]);

  const handleMeasureStart = async () => {
    try {
       
        setMessage("Measuring Starting Do not Remove Your finger!");
        await new Promise(resolve => setTimeout(resolve, 4000));
        await axios.get('http://127.0.0.1:80/measure');
        await axios.post(`http://127.0.0.1:80/patient_id_api/${patientId}`);
        setStartFlag(true);
        setMessage('Measuring started');
    } catch (error) {
        console.error('Error starting measure:', error);
        setMessage(`Error starting measure: ${error.message}`);
    }
};

  const handleMeasureStop = async () => {
    try {
      
      setMessage("Measuring Stopping. Do not remove your finger!");
      await new Promise(resolve => setTimeout(resolve, 3000));
      await axios.get('http://127.0.0.1:80/stop');
      // Define a function to check the status repeatedly until conditions are satisfied
      const checkStatus = async () => {
        try {
          // Call the API endpoint to check status
          const statusResponse = await axios.get('http://127.0.0.1:80/status_stop');
          const { check_stop_flag } = statusResponse.data;
          // If check_stop_flag is true, update message and set start flag to false
          if (check_stop_flag) {
            setMessage('Measuring Stopped');
            setStartFlag(false);
          } else {
            // If check_stop_flag is false, wait for 1 second and check again
            setTimeout(checkStatus, 1000); // Wait for 1 second before checking again
          }
        } catch (error) {
          console.error('Error checking measure status:', error);
          setMessage(`Error checking measure status: ${error.message}`);
        }
      };
      // Start checking status
      await checkStatus();
    } catch (error) {
      console.error('Error stopping measure:', error);
      setMessage(`Error stopping measure: ${error.message}`);
    }
  };

  const checkStatus = async () => {
    try {
      // Call the API endpoint to check status
      const response = await axios.get('http://127.0.0.1:80/status');
      setStartFlag(response.data.start_flag);
    } catch (error) {
      console.error('Error checking status:', error);
      setMessage(`Error checking status: ${error.message}`);
    }
  };

  const navigateTo = (path) => {
    window.location.href = path;
  };

  return (
    <div className="measurement-container">
      <div className="button-measurement-container">
        <button onClick={() => navigateTo(`/ecg-data/${patientId}`)}>ECG</button>
        <button onClick={() => navigateTo(`/ppg-data/${patientId}`)}>PPG</button>
        <button onClick={() => navigateTo(`/bp-data/${patientId}`)}>BP</button>
        <button onClick={handleMeasureStart}>Start Measure</button>
        <button onClick={handleMeasureStop}>Stop Measure</button>
      </div>

      {/* Additional rendering based on conditions */}
      {message && <p className="message">{message}</p>}

      {/* Button for navigating to home page */}
      <button onClick={() => navigateTo("/")} className="home-link">Home page</button>
    </div>
  );
};

export default MeasurementComponent;
