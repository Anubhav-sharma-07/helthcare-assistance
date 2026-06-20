import os
import argparse
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

def generate_synthetic_dataset(num_samples: int = 1500) -> pd.DataFrame:
    """
    Generates a realistic clinical synthetic dataset mapping symptoms to diseases.
    """
    symptoms = [
        "itching", "skin_rash", "nodal_skin_eruptions", 
        "continuous_sneezing", "shivering", "chills",
        "stomach_pain", "acidity", "ulcers_on_tongue",
        "vomiting", "cough", "high_fever", "sweating",
        "headache", "yellowish_skin", "abdominal_pain",
        "loss_of_appetite", "joint_pain", "muscle_weakness"
    ]
    
    disease_rules = [
        {"disease": "Fungal infection", "symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"]},
        {"disease": "Allergy", "symptoms": ["continuous_sneezing", "shivering", "chills"]},
        {"disease": "Drug Reaction", "symptoms": ["stomach_pain", "acidity", "ulcers_on_tongue"]},
        {"disease": "Gastroenteritis", "symptoms": ["vomiting", "stomach_pain", "acidity"]},
        {"disease": "Bronchial Asthma", "symptoms": ["cough", "shivering", "chills"]},
        {"disease": "Malaria", "symptoms": ["high_fever", "sweating", "chills", "vomiting", "headache"]},
        {"disease": "Migraine", "symptoms": ["headache", "acidity", "vomiting"]},
        {"disease": "Jaundice", "symptoms": ["yellowish_skin", "abdominal_pain", "loss_of_appetite", "vomiting"]},
        {"disease": "Arthritis", "symptoms": ["joint_pain", "muscle_weakness"]}
    ]
    
    data = []
    np.random.seed(42)
    
    for _ in range(num_samples):
        rule = np.random.choice(disease_rules)
        disease = rule["disease"]
        active_symptoms = rule["symptoms"].copy()
        
        for s in symptoms:
            if s not in active_symptoms and np.random.rand() < 0.05:
                active_symptoms.append(s)
                
        row = {s: 1 if s in active_symptoms else 0 for s in symptoms}
        row["disease"] = disease
        data.append(row)
        
    return pd.DataFrame(data)

def load_custom_dataset(filepath: str) -> pd.DataFrame:
    """
    Loads and preprocesses a custom CSV dataset. Supports:
    1. Wide binary format: Columns are symptoms (0 or 1 values) and a 'disease' column.
    2. Sequential format: A 'disease' column and columns 'symptom_1', 'symptom_2', etc.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Custom dataset file not found at: {filepath}")
        
    print(f"Reading custom dataset from {filepath}...")
    df = pd.read_csv(filepath)
    
    # Standardize column headers
    df.columns = [c.strip().lower() for c in df.columns]
    
    if "disease" not in df.columns:
        # Check if 'disease' column exists with some other casing or plural name
        casing_match = [c for c in df.columns if c in ["disease", "diseases", "disease_name", "target", "label"]]
        if casing_match:
            df.rename(columns={casing_match[0]: "disease"}, inplace=True)
        else:
            raise ValueError("CSV dataset must contain a target column named 'disease', 'diseases', or 'Disease'.")
            
    # Check if sequential format is used (e.g. symptom_1, symptom_2, symptom_3)
    symptom_cols = [c for c in df.columns if c.startswith("symptom")]
    
    if len(symptom_cols) > 0:
        print(f"Detected sequential symptom list format ({len(symptom_cols)} symptom columns). Converting to wide binary format...")
        # Gather all unique symptoms
        all_symptoms = set()
        for col in symptom_cols:
            # Clean text entries
            df[col] = df[col].astype(str).str.strip().str.lower().str.replace(" ", "_")
            unique_in_col = df[col].dropna().unique()
            for s in unique_in_col:
                clean_s = s.strip()
                if clean_s and clean_s not in ["nan", "none", "null", ""]:
                    all_symptoms.add(clean_s)
                    
        sorted_symptoms = sorted(list(all_symptoms))
        print(f"Discovered {len(sorted_symptoms)} unique symptoms in dataset columns.")
        
        # Transform rows
        wide_rows = []
        for _, row in df.iterrows():
            disease = row["disease"]
            # Extract active symptoms for this specific record
            active_symptoms = []
            for col in symptom_cols:
                val = str(row[col]).strip()
                if val and val not in ["nan", "none", "null", ""]:
                    active_symptoms.append(val)
                    
            row_dict = {s: 1 if s in active_symptoms else 0 for s in sorted_symptoms}
            row_dict["disease"] = disease
            wide_rows.append(row_dict)
            
        return pd.DataFrame(wide_rows)
        
    else:
        print("Detected wide binary symptom format (columns represent individual symptoms).")
        return df

def main():
    parser = argparse.ArgumentParser(description="Train Symptom-Disease Classifier Model")
    parser.add_argument(
        "--dataset-path", 
        type=str, 
        default=None, 
        help="Path to custom symptom-disease CSV dataset file (loads synthetic data by default)"
    )
    args = parser.parse_args()
    
    if args.dataset_path:
        try:
            df = load_custom_dataset(args.dataset_path)
        except Exception as e:
            print(f"Error loading custom dataset: {e}")
            return
    else:
        print("No custom dataset provided. Generating synthetic dataset...")
        df = generate_synthetic_dataset(1500)
        
    # Extract features and targets
    X = df.drop(columns=["disease"])
    y = df["disease"]
    
    # Store feature names to indices mapping
    feature_mapping = {col: i for i, col in enumerate(X.columns)}
    
    # Split training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training Random Forest Classifier on {len(X_train)} samples with {len(X.columns)} features...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    
    # Predict and print report
    rf_preds = rf_model.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    print(f"\nRandom Forest Accuracy: {rf_acc:.4f}")
    print("\nRandom Forest Classification Report:")
    # print report handles target labels dynamically
    print(classification_report(y_test, rf_preds))
    
    # Save binaries
    bin_dir = Path(__file__).resolve().parent / "models_bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    
    model_out = bin_dir / "symptom_model.pkl"
    features_out = bin_dir / "symptom_features.pkl"
    
    print(f"Saving model to {model_out}...")
    with open(model_out, 'wb') as f:
        pickle.dump(rf_model, f)
        
    print(f"Saving feature list to {features_out}...")
    with open(features_out, 'wb') as f:
        pickle.dump(feature_mapping, f)
        
    print("\nTraining completed successfully! Model files written to disk.")

if __name__ == "__main__":
    main()
