
# Cuffless Blood Pressure Monitor with ECG/PPG and LSTM

## Project Overview

This project is an innovative, non-invasive blood pressure monitoring system that leverages a combination of biomedical sensors and a machine learning model for continuous estimation. By analyzing Electrocardiogram (ECG) and Photoplethysmography (PPG) signals, the system provides blood pressure readings without the need for a traditional cuff. The device is cloud-connected, allowing for real-time data logging and remote monitoring capabilities.

## System Architecture

The system is composed of three primary stages: data acquisition, processing, and connectivity.

1.  **Data Acquisition:**
    *   **ECG Sensor (AD8232):** Captures the electrical activity of the heart.
    *   **PPG Sensor (SEN-11574):** Measures volumetric changes in blood circulation using an optical sensor.

2.  **Processing and Prediction:**
    *   The raw ECG and PPG signals are processed to extract relevant features.
    *   A **Long Short-Term Memory (LSTM) neural network** is implemented to analyze the time-series data and estimate systolic and diastolic blood pressure values.

3.  **Connectivity:**
    *   The device is engineered to be cloud-connected, enabling data to be securely stored and accessed remotely.

## Technology Stack

*   **Primary Language:** Python, JavaScript, C
*   **Hardware:**
    *   Microcontroller (ESP32)
    *   AD8232 ECG Sensor Module
    *   SEN-11574 PPG Sensor Module
*   **Machine Learning:** Long Short-Term Memory (LSTM) Neural Network
