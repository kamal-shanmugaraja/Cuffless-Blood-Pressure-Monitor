import React, { useState } from 'react';
import axios from 'axios';
import './PatientRegistration.css'; // Import CSS file for styling

function PatientRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:80/api/new_patient', formData);
      setMessage(`Patient ID: ${response.data.patient_id}. Patient details added successfully.`);
    } catch (error) {
      setMessage(`Error adding patient details: ${error.response.data}`);
    }
  };

  return (
    <div className="registration-container">
      <h2>Patient Registration</h2>
      <form onSubmit={handleSubmit} className="registration-form">
        <label className="form-label">
          Name  :
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <br />
        <label className="form-label">
          Age   :
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </label>
        <br />
        <label className="form-label">
          Gender :
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <br />
        <div className="button-container">
          <button type="submit">Register</button>
          <button type="button" onClick={() => window.history.back()}>Back</button> {/* Back button */}
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default PatientRegistration;
