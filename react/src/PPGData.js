import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import './PatientRegistration.css';
import './ButtonContainer.css'; 

function PPGData() {
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
  
  const navigate = useNavigate();
  
  const handleButtonClick = () => {
    fetchData('ppg');
    setChartLabel('PPG Data');
    const id = setInterval(() => {
      fetchData('ppg');
    }, 5000);
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
        <button className="button-container" onClick={handleButtonClick}>Plot PPG Data</button>
        <button className="button-container" onClick={handleBack}>Back</button>
        <Link to="/">
          <button className="button-container">Home page</button>
        </Link>
      </div>

      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
      
      {renderChartFlag && <canvas id="myChart" width="400" height="200" ref={chartRef}></canvas>}
     

    </div>
  );
}

export default PPGData;
