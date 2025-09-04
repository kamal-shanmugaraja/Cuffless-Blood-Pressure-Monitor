import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
from kerastuner.tuners import RandomSearch
from kerastuner.engine.hyperparameters import HyperParameters
from sklearn.metrics import mean_absolute_error
from tensorflow.keras.callbacks import EarlyStopping

# Load and preprocess your data
ecg_data = pd.read_csv("F:\Phase-1\Model\cuff+less+blood+pressure+estimation\ECG.csv")
ppg_data = pd.read_csv("F:\Phase-1\Model\cuff+less+blood+pressure+estimation\PPG.csv")
bp_data = pd.read_csv("F:\Phase-1\Model\cuff+less+blood+pressure+estimation\BP.csv")

# Merge or concatenate the data
merged_data = pd.concat([ecg_data, ppg_data], axis=1)

# Split data into features (X) and target (y)
X = merged_data.values
y = bp_data.values

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the data
scaler = MinMaxScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Reshape the data for LSTM (assuming you have sequential data)
# LSTM input shape: (batch_size, timesteps, input_dim)
timesteps = 1  # Number of samples in training data

input_dim = X_train.shape[1]


X_train = X_train.reshape(-1, timesteps, input_dim)
X_test = X_test.reshape(-1, timesteps, input_dim)

# Define the model-building function for Keras Tuner
def build_model(hp):
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.LSTM(units=hp.Int('units', min_value=32, max_value=256, step=32), 
                                   input_shape=(timesteps, input_dim), 
                                   return_sequences=True))
    model.add(tf.keras.layers.LSTM(units=hp.Int('units', min_value=32, max_value=256, step=32)))
    model.add(tf.keras.layers.Dense(1))  # Output layer with a single neuron (BP prediction)

    model.compile(optimizer='adam', loss='mse')
    return model

# Instantiate the tuner and perform the hyperparameter search
tuner = RandomSearch(+
    build_model,
    objective='val_loss',
    max_trials=5,  # Adjust as needed
    executions_per_trial=1,
    directory='hyperparameter_tuning',
    project_name='lstm_hyperparameter_search')

tuner.search(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

# Get the optimal hyperparameters
best_hps = tuner.get_best_hyperparameters(num_trials=1)[0]

# Build the model with the optimal hyperparameters
model = tuner.hypermodel.build(best_hps)

early_stopping = EarlyStopping(monitor='val_loss', patience=10, verbose=1, restore_best_weights=True)

# Train the model with the optimal hyperparameters
history = model.fit(X_train, y_train, epochs=100, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stopping])

# Save the trained model
model.save("F:\Phase 2\model\\bp_model3.h5")

# Plot the loss over epochs
plt.figure(figsize=(12, 6))
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('Training and Validation Loss Over Epochs')
plt.legend()
plt.grid(True)
plt.show()

# Make predictions
y_pred = model.predict(X_test)

# Plot the actual vs predicted BP values
plt.figure(figsize=(12, 6))
plt.plot(y_test, label='Actual BP', color='blue')
plt.plot(y_pred, label='Predicted BP', color='red')
plt.xlabel('Sample')
plt.ylabel('Blood Pressure')
plt.title('Actual vs Predicted Blood Pressure')
plt.legend()
plt.grid(True)
plt.show()

# Plot the actual vs predicted BP values
plt.figure()
plt.plot(y_test, label='Actual BP', color='blue')
plt.plot(y_pred, label='Predicted BP', color='red')
plt.xlabel('Sample')
plt.ylabel('Blood Pressure')
plt.title('Actual vs Predicted Blood Pressure')
plt.legend()
plt.grid(True)
plt.show()

# Plot the actual vs predicted BP values
plt.figure()
plt.plot(y_test[0:5000], label='Actual BP', color='blue')
plt.plot(y_pred[0:5000], label='Predicted BP', color='red')
plt.xlabel('Sample')
plt.ylabel('Blood Pressure')
plt.title('Actual vs Predicted Blood Pressure')
plt.legend()
plt.grid(True)
plt.show()


# Calculate RMSE
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
print(f"RMSE: {rmse}")

# Calculate MAE
mae = mean_absolute_error(y_test, y_pred)
print(f"MAE: {mae}")
