from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load model and encoders
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'model.pkl')
encoders_path = os.path.join(current_dir, 'encoders.pkl')

model = None
encoders = None

def load_ml_resources():
    global model, encoders
    if os.path.exists(model_path) and os.path.exists(encoders_path):
        try:
            model = joblib.load(model_path)
            encoders = joblib.load(encoders_path)
            print("Successfully loaded model and encoders.")
        except Exception as e:
            print(f"Error loading model resources: {str(e)}")
    else:
        print("Model assets do not exist yet. Please run train.py first.")

# Initial load attempt
load_ml_resources()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'encoders_loaded': encoders is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    global model, encoders
    if model is None or encoders is None:
        # Try to reload just in case
        load_ml_resources()
        if model is None or encoders is None:
            return jsonify({'success': False, 'message': 'ML Model not trained or loaded.'}), 500
            
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No input data provided'}), 400
            
        origin = data.get('origin')
        destination = data.get('destination')
        weight = data.get('weight')
        shipment_type = data.get('shipment_type')
        day_of_week = data.get('day_of_week')
        
        # Validation
        if None in [origin, destination, weight, shipment_type, day_of_week]:
            return jsonify({'success': False, 'message': 'Missing required fields: origin, destination, weight, shipment_type, day_of_week'}), 400
            
        try:
            weight = float(weight)
            day_of_week = int(day_of_week)
        except ValueError:
            return jsonify({'success': False, 'message': 'Weight must be float, day_of_week must be integer'}), 400
            
        # Check encoder categories & map
        try:
            encoded_origin = encoders['origin'].transform([origin])[0]
            encoded_destination = encoders['destination'].transform([destination])[0]
            encoded_type = encoders['shipment_type'].transform([shipment_type])[0]
        except ValueError as ve:
            return jsonify({
                'success': False, 
                'message': f'Invalid category provided. Please use standard Indian hubs and shipment types: {str(ve)}'
            }), 400
            
        # Construct prediction input
        # Feature order: ['origin', 'destination', 'weight', 'shipment_type', 'day_of_week']
        features = np.array([[encoded_origin, encoded_destination, weight, encoded_type, day_of_week]])
        
        prediction = model.predict(features)[0]
        # Return predicted delivery days (rounded to 1 decimal place)
        predicted_days = round(float(prediction), 1)
        
        return jsonify({
            'success': True,
            'predicted_delivery_days': predicted_days,
            'details': {
                'origin': origin,
                'destination': destination,
                'weight': weight,
                'shipment_type': shipment_type,
                'day_of_week': day_of_week
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    # Flask service runs on port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
