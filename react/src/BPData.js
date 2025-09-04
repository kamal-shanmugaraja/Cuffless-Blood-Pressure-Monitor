import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import './PatientRegistration.css';
import './ButtonContainer.css'; 

function BPData() {
  const { patientId } = useParams(); 
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [chartLabel, setChartLabel] = useState('');
  const [renderChartFlag, setRenderChartFlag] = useState(false); 
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [startFlag, setStartFlag] = useState(false);
  const [intervalId, setIntervalId] = useState(null); 

  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  useEffect(() => {
    if (data.length > 0 && chartRef.current && renderChartFlag) {
      renderChart();
    }
  }, [data, renderChartFlag]);

  const fetchData = async (endpoint) => {
    if (!patientId) return; 
    try {
      const response = await axios.get(`http://127.0.0.1:80/api/${endpoint}/${patientId}`);
      setData(response.data);
      setMessage(''); 
      setRenderChartFlag(true); 
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

      setMessage(`Calculated Average Systolic Pressure is ${average_systolic} and Calculated Average Diastolic Pressure is ${average_diastolic}`);
      setData(predictedBPResponse.data);
      setChartLabel('Predicted Blood Pressure Data');
      setRenderChartFlag(true); 
    } catch (error) {
      console.error('Error fetching average and predicted BP data:', error);
      setMessage(`Error fetching average and predicted BP data: ${error.message}`);
    }
  };

  const handleButtonClick = () => {
    fetchAverageAndPredictedBPData();
    const id = setInterval(fetchAverageAndPredictedBPData, 5000);
    setIntervalId(id);
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
  
  const navigate = useNavigate();
  
  const handleBack = () => {
    setData([]);
    setMessage(''); 
    setChartLabel('');
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    setRenderChartFlag(false);
    clearInterval(intervalId);
    navigate(-1);
  };

  return (
    <div className="app-container">
      <div className="button-container">
        <button onClick={handleButtonClick}>Calculated Blood Pressure Data</button>
        <button onClick={handleBack}>Back</button>
        <Link to="/">
          <button className="button-container">Home page</button>
        </Link>
      </div>

      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
      
      {renderChartFlag && <canvas id="myChart" width="400" height="200" ref={chartRef}></canvas>}
     
      
    </div>
  );
}

export default BPData;
