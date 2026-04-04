import os
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model

# -------------------------------
# Load Trained Model
# -------------------------------

def load_trained_model(model_path="model/emergency_model.h5"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")
    return load_model(model_path)

# -------------------------------
# Preprocess Image
# -------------------------------

def preprocess_image(img_path, target_size=(224, 224)):
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image not found: {img_path}")
    
    img = image.load_img(img_path, target_size=target_size)
    img_array = image.img_to_array(img)
    
    # Normalize (same as training)
    img_array = img_array / 255.0
    
    # Expand dims for model input
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

# -------------------------------
# Predict Class
# -------------------------------

def predict_class(model, img_array, class_labels):
    prediction = model.predict(img_array)
    class_index = np.argmax(prediction)
    
    return class_labels[class_index], float(np.max(prediction))

# -------------------------------
# Validate Image File
# -------------------------------

def is_valid_image(file_path):
    valid_extensions = (".jpg", ".jpeg", ".png")
    return file_path.lower().endswith(valid_extensions)

# -------------------------------
# Create Required Folders
# -------------------------------

def create_project_dirs():
    folders = [
        "model",
        "outputs"
    ]
    
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
        
    print("Project directories checked/created.")
