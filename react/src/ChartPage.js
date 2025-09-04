import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { useParams, Link } from 'react-router-dom'; // Import Link
import './PatientRegistration.css';

function ChartPage() {
  const { patientId } = useParams(); // Extract patientId from URL params
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [chartLabel, setChartLabel] = useState('');
  const [renderChartFlag, setRenderChartFlag] = useState(false); // Flag to control chart rendering
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [startFlag, setStartFlag] = useState(false);

  useEffect(() => {
    // Only render the chart if data is available and the component has mounted
    if (data.length > 0 && chartRef.current && renderChartFlag) {
      renderChart();
    }
  }, [data, renderChartFlag]);

  const fetchData = async (endpoint) => {
    if (!patientId) return; // Check if patientId is undefined
    try {
      const response = await axios.get(`http://127.0.0.1:80/api/${endpoint}/${patientId}`);
      setData(response.data);
      setMessage(''); // Clear any previous message
      setRenderChartFlag(true); // Set the flag to render the chart
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage(`Error fetching data: ${error.message}`);
    }
  };

  const fetchAverageAndPredictedBPData = async () => {
    try {
      const averageBPResponse = await axios.get(`http://127.0.0.1:80/api/average_bp/${patientId}`);
      const { average_systolic, average_diastolic } = averageBPResponse.data;

      const predictedBPResponse = await axios.get(`http://127.0.0.1:80/api/calculated_bp/${patientId}`);

      // Set the message to be displayed on the website
      setMessage(`Calculated Average Systolic Pressure is ${average_systolic} and Calculated Average Diastolic Pressure is ${average_diastolic}`);
      setData(predictedBPResponse.data);
      setChartLabel('Predicted Blood Pressure Data');
      setRenderChartFlag(true); // Set renderChartFlag to true after fetching both average and predicted BP data
    } catch (error) {
      console.error('Error fetching average and predicted BP data:', error);
      setMessage(`Error fetching average and predicted BP data: ${error.message}`);
    }
  };
  
  const renderChart = () => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartData = {
      labels: data.map((_, index) => index + 1),
      datasets: [
        {
          label: chartLabel,
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          pointStyle: 'hidden'
        },
      ],
    };

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        elements: {
          point: {
            radius: 0 
          }
        }
      }
    });
  };

  const handleBack = () => {
    // Clear the chart and data
    setData([]);
    setMessage(''); // Clear any previous message
    setChartLabel('');
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    // Reset the flag to false when going back
    setRenderChartFlag(false);
  };

  const handleMeasureStart = async () => {
    try {
       
        setMessage("Measuring Starting Do not Remove Your finger!");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Call the API endpoint to start measure
        await axios.get('http://127.0.0.1:80/measure');

        // Call the API endpoint to send data
        await axios.post(`http://127.0.0.1:80/patient_id_api/${patientId}`);
        
        // Update start flag
        setStartFlag(true);

        // Print "Measuring started"
        setMessage('Measuring started');
    } catch (error) {
        console.error('Error starting measure:', error);
        setMessage(`Error starting measure: ${error.message}`);
    }
};

const handleMeasureStop = async () => {
  try {
    // Print "Measuring Starting Do not Remove Your finger" immediately
    setMessage("Measuring Stopping Do not Remove Your finger!");

    // Delay the execution of the rest of the code for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Call the API endpoint to stop measure
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

  return (
    <div className="app-container">
      <div className="button-container">
        <button onClick={() => {
          fetchData('ppg'); // Pass the endpoint and patientId to fetchData
          setChartLabel('PPG Data');
        }}>Plot PPG Data</button>
        <button onClick={() => {
          fetchData('ecg'); // Pass the endpoint and patientId to fetchData
          setChartLabel('ECG Data');
        }}>Plot ECG Data</button>
        <button onClick={fetchAverageAndPredictedBPData}>Calculated Blood Pressure Data</button>
        <button onClick={handleBack}>Back</button>
      </div>

      {/* Buttons for measure, stop, and status */}
      <div className="button-container">
        <button onClick={handleMeasureStart}>Start Measure</button>
        <button onClick={handleMeasureStop}>Stop Measure</button>
        
      </div>

      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
      
      {renderChartFlag && <canvas id="myChart" width="400" height="200" ref={chartRef}></canvas>}
     
      <Link to="/">
        <button className="button-container">Home page</button>
      </Link>
    </div>
  );
}

export default ChartPage;