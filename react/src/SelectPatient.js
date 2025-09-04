// SelectPatient.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import MeasurementComponent from './MeasurementComponent';
import './SelectPatient.css'; // Import the CSS file

function SelectPatient() {
  const [patientId, setPatientId] = useState('');
  const [verificationResult, setVerificationResult] = useState('');
  const navigate = useNavigate(); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:80/verify_patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          navigate(`/measurement/${patientId}`);
        } else {
          setVerificationResult('Patient does not exist');
        }
      } else {
        throw new Error('Failed to verify patient');
      }
    } catch (error) {
      console.error('Error verifying patient:', error);
      setVerificationResult('Error verifying patient. Please try again.');
    }
  };

  const handleChange = (event) => {
    setPatientId(event.target.value);
    setVerificationResult('');
  };

  return (
    <div className="ap-container">
      <h2>Select Patient</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <label htmlFor="patientId" className="label">Enter Patient ID:</label>
        <input type="text" id="patientId" name="patientId" value={patientId} onChange={handleChange} className="input" />
        <button type="submit" className="button">Submit</button>
      </form>
      
      {verificationResult && <p className="verification">{verificationResult}</p>}
    </div>
  );
}

export default SelectPatient;
