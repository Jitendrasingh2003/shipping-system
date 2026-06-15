import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Create ml-service directory structure if not exists
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)

# 1. Setup coordinates for Indian hubs to simulate realistic distances
CITIES = {
    'Mumbai': (19.0760, 72.8777),
    'Delhi': (28.7041, 77.1025),
    'Bangalore': (12.9716, 77.5946),
    'Chennai': (13.0827, 80.2707),
    'Kolkata': (22.5726, 88.3639),
    'Hyderabad': (17.3850, 78.4867),
    'Pune': (18.5204, 73.8567),
    'Ahmedabad': (23.0225, 72.5714),
    'Jaipur': (26.9124, 75.7873),
    'Surat': (21.1702, 72.8311)
}

SHIPMENT_TYPES = ['Standard', 'Express', 'Air', 'Ocean']

def haversine_distance(coord1, coord2):
    # Radius of the Earth in km
    R = 6371.0
    lat1, lon1 = np.radians(coord1[0]), np.radians(coord1[1])
    lat2, lon2 = np.radians(coord2[0]), np.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat / 2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    
    return R * c

def generate_synthetic_data(num_records=5000):
    np.random.seed(42)
    
    data = []
    city_list = list(CITIES.keys())
    
    for _ in range(num_records):
        origin = np.random.choice(city_list)
        # Ensure destination is different from origin
        destination = np.random.choice([c for c in city_list if c != origin])
        
        weight = np.random.uniform(0.5, 150.0) # in kg
        shipment_type = np.random.choice(SHIPMENT_TYPES, p=[0.4, 0.3, 0.2, 0.1])
        day_of_week = np.random.randint(0, 7) # 0 = Monday, 6 = Sunday
        
        # Calculate distance
        dist = haversine_distance(CITIES[origin], CITIES[destination])
        
        # Calculate base delivery days
        if shipment_type == 'Air':
            base_days = (dist / 350.0) / 24.0 + 0.5 # Fast travel, processing overhead
        elif shipment_type == 'Express':
            base_days = (dist / 80.0) / 24.0 + 1.0 # Highway travel, minor overhead
        elif shipment_type == 'Ocean':
            base_days = (dist / 25.0) / 24.0 + 3.0 # Slow water transit, custom clearing
        else: # Standard
            base_days = (dist / 50.0) / 24.0 + 2.0 # Rail/truck travel, standard dispatch
            
        # Add factor for weight (heavier packages take longer handling time)
        weight_factor = weight * 0.008
        
        # Add factor for weekend shipment start (shipments starting near Sunday face delays)
        weekend_delay = 1.2 if day_of_week in [4, 5] else 0.2 # Fri, Sat
        
        # Add random noise/weather/traffic (variance in delivery times)
        noise = np.random.normal(0, 0.4)
        
        # Total delivery days (minimum 1 day)
        delivery_days = max(1.0, base_days + weight_factor + weekend_delay + noise)
        # Round to 1 decimal place
        delivery_days = round(delivery_days, 1)
        
        data.append({
            'origin': origin,
            'destination': destination,
            'weight': weight,
            'shipment_type': shipment_type,
            'day_of_week': day_of_week,
            'delivery_days': delivery_days
        })
        
    return pd.DataFrame(data)

def main():
    print("Generating synthetic shipment historical data...")
    df = generate_synthetic_data()
    
    # Save a CSV for training transparency
    df.to_csv(os.path.join(os.path.dirname(__file__), 'shipping_historical_data.csv'), index=False)
    print("CSV saved. Training model...")
    
    # Preprocess categorical features
    encoders = {}
    for col in ['origin', 'destination', 'shipment_type']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    X = df[['origin', 'destination', 'weight', 'shipment_type', 'day_of_week']]
    y = df['delivery_days']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train RandomForestRegressor
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=12)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Model trained successfully!")
    print(f"Train R^2 Score: {train_score:.4f}")
    print(f"Test R^2 Score: {test_score:.4f}")
    
    # Save model and encoders
    joblib.dump(model, os.path.join(os.path.dirname(__file__), 'model.pkl'))
    joblib.dump(encoders, os.path.join(os.path.dirname(__file__), 'encoders.pkl'))
    print("Saved 'model.pkl' and 'encoders.pkl' to ml-service folder.")

if __name__ == '__main__':
    main()
