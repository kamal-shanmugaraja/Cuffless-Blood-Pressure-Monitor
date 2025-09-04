from flask import Flask, request, jsonify, render_template
import json
from flask_cors import CORS 
import sqlite3
import random
import string
import pandas as pd
import tensorflow as tf
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from scipy.signal import find_peaks
from scipy.signal import argrelextrema

app = Flask(__name__)
start_flag = False
check_stop_flag = False
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

model = tf.keras.models.load_model("F:\Phase 2\model\\bp_model_optimized.h5") 
patient_id_s=''

def fetch_sensor_data(patient_id, column_name):
    try:
        # Connect to the SQLite database
        db_path = 'PPG_ECG_Data.db'  # Replace with the actual path
        connection = sqlite3.connect(db_path)

        cursor = connection.cursor()


        cursor.execute(f"SELECT {column_name} FROM sensor_values_{patient_id} ORDER BY id DESC LIMIT 250;")

        rows = cursor.fetchall()

        cursor.close()
        connection.close()

        sensor_values = [row[0] for row in rows]
        return jsonify(sensor_values)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def fetch_average_values(patient_id):
    try:
      
        db_path = 'PPG_ECG_Data.db'  
        connection = sqlite3.connect(db_path)

        cursor = connection.cursor()

        
        table_name = f'average_values_{patient_id}'

        cursor.execute(f"SELECT average_systolic, average_diastolic FROM {table_name} ORDER BY id DESC LIMIT 1;")

        row = cursor.fetchone()
        cursor.close()
        connection.close()

        if row:
            average_values = {'average_systolic': row[0], 'average_diastolic': row[1]}
            return jsonify(average_values)
        else:
            return jsonify({'error': 'No data available'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_patient_id():
    return 'PSG' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def process_and_predict(ecg_data, ppg_data):
    timesteps = 1 
    ecg_data = np.array(ecg_data).reshape(-1, 1)
    ppg_data = np.array(ppg_data).reshape(-1, 1)

    scaler = MinMaxScaler()
    merged_data = np.concatenate([ecg_data, ppg_data], axis=1)
    scaler.fit(merged_data)
    merged_data = scaler.transform(merged_data)
    merged_data = merged_data.reshape(-1, timesteps, merged_data.shape[1])

    predicted_bp = model.predict(merged_data)
    predicted_bp = predicted_bp.astype(int)
    predicted_bp = predicted_bp.reshape(-1)
    print(predicted_bp)
    return predicted_bp

def sys(predicted_bp):
    highest_amplitude = max(predicted_bp)
    peaks, _ = find_peaks(predicted_bp, height=highest_amplitude - 10)    
    systolic_values = predicted_bp[peaks]
    average_systolic = np.mean(systolic_values)
    return average_systolic

def dia(predicted_bp):
        while(True):
            count=0
            diaarray=[]
            minval=min(predicted_bp)
            for i in predicted_bp:
                if i>minval and i<=minval+7:
                    count=count+1
                    diaarray.append(i)
            if count>3:
                average_diastolic=sum(diaarray)/len(diaarray)
                return average_diastolic
            else:
                predicted_bp.remove(minval)
                count=0
                diaarray=[]

def patient_exists(patient_id):
    conn = sqlite3.connect('PPG_ECG_Data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM patient_details WHERE patient_id = ?", (patient_id,))
    result = cursor.fetchone()[0]
    conn.close()
    return result > 0

def create_table():
    conn = sqlite3.connect('PPG_ECG_Data.db')
    cursor = conn.cursor()
    cursor.execute('''
                    CREATE TABLE IF NOT EXISTS patient_details (
                        patient_id TEXT PRIMARY KEY,
                        name TEXT,
                        age INTEGER,
                        gender TEXT
                    )
                ''')
    conn.commit()
    conn.close()

create_table()
@app.route('/api/new_patient', methods=['POST'])
def add_patient_details():
    global patient_id_s
    if request.method == 'POST':
        try:
            # Get JSON data from the request body
            data = request.get_json()
            print("Patient Details Received ")

            if data is not None and all(key in data for key in ['age', 'gender', 'name']):
                age = data['age']
                gender = data['gender']
                name = data['name']
                patient_id = generate_patient_id()

                # Connect to the database
                conn = sqlite3.connect('PPG_ECG_Data.db')
                cursor = conn.cursor()

                # Insert the patient details into the database
                cursor.execute('INSERT INTO patient_details (patient_id, name, age, gender) VALUES (?, ?, ?, ?)',
                               (patient_id, name, age, gender))

                # Create sensor_values table for the patient
                cursor.execute(f"CREATE TABLE IF NOT EXISTS sensor_values_{patient_id} (id INTEGER PRIMARY KEY AUTOINCREMENT, ecg_value INTEGER, ppg_value INTEGER, predicted_bp INTEGER)")
                
                # Create average_values table for the patient
                cursor.execute(f"CREATE TABLE IF NOT EXISTS average_values_{patient_id} (id INTEGER PRIMARY KEY AUTOINCREMENT, average_diastolic INTEGER, average_systolic INTEGER)")

                conn.commit()
                conn.close()
                patient_id_s=patient_id
                return jsonify({'patient_id': patient_id}), 200
            else:
                return 'Invalid JSON format. Missing age, gender, or name.', 400
        except Exception as e:
            return f'Error adding patient details: {str(e)}', 400
    else:
        return 'Method not allowed', 405

    
@app.route('/api/edit_patient', methods=['PUT'])
def edit_patient_details():
    global patient_id_s
    if request.method == 'PUT':
        try:
            # Get JSON data from the request body
            data = request.get_json()
            print("Patient Details Received ")

            if data is not None and all(key in data for key in ['patient id', 'age', 'gender', 'name']):
                age = data['age']
                gender = data['gender']
                name = data['name']
                
                patient_id = data['patient id']
                patient_id_s=patient_id
                conn = sqlite3.connect('PPG_ECG_Data.db')
                cursor = conn.cursor()

                # Check if the patient ID exists in the database
                cursor.execute('SELECT * FROM patient_details WHERE patient_id = ?', (patient_id,))
                existing_patient = cursor.fetchone()
                if existing_patient:
                    # Update patient details
                    cursor.execute('UPDATE patient_details SET name = ?, age = ?, gender = ? WHERE patient_id = ?',
                                   (name, age, gender, patient_id))
                    conn.commit()
                    conn.close()
                    return jsonify({'message': 'Patient details updated successfully'}), 200
                else:
                    conn.close()
                    return jsonify({'error': 'Patient does not exist'}), 404
            else:
                return 'Invalid JSON format. Missing a Required Field', 400
        except Exception as e:
            return f'Error editing patient details: {str(e)}', 400
    else:
        return 'Method not allowed', 405

@app.route('/verify_patient', methods=['POST'])
def verify_patient():
    if request.method == 'POST':
        try:
            data = request.get_json()
            if 'patient_id' in data:
                patient_id = data['patient_id']
                if patient_exists(patient_id):
                    return jsonify({'exists': True}), 200
                else:
                    return jsonify({'exists': False}), 200
            else:
                return 'Invalid JSON format. Missing patient_id.', 400
        except Exception as e:
            return f'Error verifying patient: {str(e)}', 400
    else:
        return 'Method not allowed', 405

@app.route('/send_data', methods=['POST'])
def receive_data():
    global patient_id_s
    patient_id=patient_id_s
    print(patient_id)
    if request.method == 'POST':
        try:
            # Get JSON data from the request body
            data = request.get_json()
            print("Data Received ")

            if data is not None and 'ecg_data' in data and 'ppg_data' in data:
                ecg_values = data['ecg_data']
                ppg_values = data['ppg_data']
                predicted_bp_group = process_and_predict(ecg_values, ppg_values)
                
                conn = sqlite3.connect('PPG_ECG_Data.db')
                cursor = conn.cursor()
                print("BP Prediction Done")
            
                # Create a new sensor_values table for the patient if it doesn't exist
                cursor.execute(f"CREATE TABLE IF NOT EXISTS sensor_values_{patient_id} (id INTEGER PRIMARY KEY AUTOINCREMENT, ecg_value INTEGER, ppg_value INTEGER, predicted_bp INTEGER)")
                
                print("Table Created")

                # Insert data into the patient-specific table
                for ecg_value, ppg_value, pred_bp in zip(ecg_values, ppg_values, predicted_bp_group):
                    #print(f"Inserting data: ecg_value={ecg_value}, ppg_value={ppg_value}, pred_bp={pred_bp}")
                    cursor.execute(f'INSERT INTO sensor_values_{patient_id} (ecg_value, ppg_value, predicted_bp) VALUES (?, ?, ?)', (ecg_value, ppg_value, int(pred_bp)))
                    #print("Data inserted successfully!")

                conn.commit()

                average_systolic=sys(predicted_bp_group)
                average_diastolic=dia(list(predicted_bp_group))

                print(f"Average Systolic BP : {average_systolic}")
                print(f"Average Diastolic BP : {average_diastolic}")
                cursor.execute(f'INSERT INTO average_values_{patient_id} (average_diastolic, average_systolic) VALUES (?, ?)', (int(average_diastolic), int(average_systolic)))

               
                conn.commit()
                conn.close()
                return 'Data received and processed successfully'
            else:
                return 'Invalid JSON format. Missing patient_id, ecg_data, or ppg_data.', 400
        except Exception as e:
            return f'Error processing data: {str(e)}', 400
    else:
        return 'Method not allowed', 405
    
@app.route('/patient_id_api/<patient_id>', methods=['POST'])
def set_patient_id(patient_id):
    global patient_id_s
    patient_id_s = patient_id
    print("Patient ID received:", patient_id_s)
    return jsonify({'message': 'Patient ID set successfully'}), 200

@app.route('/measure')
def measure():
    global start_flag
    global check_stop_flag
    check_stop_flag = False
    start_flag = True
    return jsonify({'status': 'success', 'message': 'measure started'})

@app.route('/status')
def status():
    return jsonify({'start_flag': start_flag})

@app.route('/stop')
def stop():
    global start_flag
    start_flag = False
    return jsonify({'status': 'success', 'message': 'measure stopped'})

@app.route('/check_stop', methods=['POST'])
def checkstop():
    global check_stop_flag
    check_stop_flag = True
    return jsonify({'check_stop_flag': check_stop_flag})
    #return jsonify({'status': 'success', 'message': 'measure started'})


@app.route('/status_stop')
def statusstop():
    global check_stop_flag
    return jsonify({'check_stop_flag': check_stop_flag})


@app.route('/api/average_bp/<patient_id>', methods=['GET'])
def get_latest_average_values(patient_id):
    try:
        response = fetch_average_values(patient_id)
        return response
    except Exception as e:
        print(f"Error in get_latest_average_values: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ppg/<patient_id>', methods=['GET'])
def get_ppg_data(patient_id):
    try:
        response = fetch_sensor_data(patient_id, 'ppg_value')  
        return response
    except Exception as e:
        print(f"Error in get_ppg_data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ecg/<patient_id>', methods=['GET'])
def get_ecg_data(patient_id):
    try:
        response = fetch_sensor_data(patient_id, 'ecg_value')  
        return response
    except Exception as e:
        print(f"Error in get_ecg_data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculated_bp/<patient_id>', methods=['GET'])
def get_calculated_bp_data(patient_id):
    try:
        response = fetch_sensor_data(patient_id, 'predicted_bp')  
        return response
    except Exception as e:
        print(f"Error in get_calculated_bp_data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
