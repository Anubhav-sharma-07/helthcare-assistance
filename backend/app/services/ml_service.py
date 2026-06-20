import os
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")

# Reference mapping of symptoms to diseases (fallback clinical logic)
FALLBACK_DISEASE_RULES = {
    "itching": "Fungal infection",
    "skin_rash": "Fungal infection",
    "nodal_skin_eruptions": "Fungal infection",
    "continuous_sneezing": "Allergy",
    "shivering": "Allergy",
    "chills": "Allergy",
    "stomach_pain": "Drug Reaction",
    "acidity": "Drug Reaction",
    "ulcers_on_tongue": "Drug Reaction",
    "vomiting": "Gastroenteritis",
    "cough": "Bronchial Asthma",
    "high_fever": "Malaria",
    "sweating": "Malaria",
    "headache": "Migraine",
    "yellowish_skin": "Jaundice",
    "abdominal_pain": "Jaundice",
    "loss_of_appetite": "Jaundice",
    "joint_pain": "Arthritis",
    "muscle_weakness": "Arthritis"
}

CARE_GUIDANCE_MAP = {
    "Fungal infection": "Apply topical antifungal creams. Keep skin clean and dry. Avoid sharing personal items.",
    "Allergy": "Identify and avoid allergen triggers. Consider over-the-counter antihistamines. Consult an allergist if symptoms persist.",
    "Drug Reaction": "Stop the suspected medication immediately and contact your prescribing physician or seek emergency medical care.",
    "Gastroenteritis": "Stay hydrated with oral rehydration solutions. Eat a bland diet (BRAT diet). Avoid dairy and fatty foods.",
    "Bronchial Asthma": "Use prescribed rescue inhalers if needed. Avoid smoke and air pollution. Seek emergency help if breathing becomes labored.",
    "Malaria": "Consult a healthcare provider immediately. Antimalarial medications are required. Rest and keep hydrated.",
    "Migraine": "Rest in a quiet, dark room. Apply cold compresses. Over-the-counter or prescription pain relievers may help.",
    "Jaundice": "Consult a doctor for diagnostic tests. Get plenty of rest, stay hydrated, and follow a low-fat diet.",
    "Arthritis": "Perform gentle stretching, apply hot/cold packs, and use anti-inflammatory pain relievers as directed by a doctor.",
    "General / Unknown": "Monitor symptoms closely. If symptoms worsen, persist, or cause concern, please consult a medical professional."
}

class MLService:
    def __init__(self):
        self.model_path = Path(__file__).resolve().parent.parent / "models_bin" / "symptom_model.pkl"
        self.encoder_path = Path(__file__).resolve().parent.parent / "models_bin" / "symptom_features.pkl"
        self.model = None
        self.features = None
        self.load_model()

    def load_model(self):
        try:
            if self.model_path.exists() and self.encoder_path.exists():
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.encoder_path, 'rb') as f:
                    self.features = pickle.load(f)
                logger.info("ML Models successfully loaded from local binaries.")
            else:
                logger.info("ML Model binaries not found yet. Running in clinical rule-based fallback mode.")
        except Exception as e:
            logger.error(f"Error loading ML model components: {e}. Defaulting to fallback mode.")

    def predict(self, symptoms: List[str]) -> Dict[str, Any]:
        if not symptoms:
            return {
                "results": [{"disease": "General / Unknown", "confidence": 1.0}],
                "guidance": CARE_GUIDANCE_MAP["General / Unknown"]
            }

        # If ML model binary exists, perform standard vectorized evaluation
        if self.model is not None and self.features is not None:
            try:
                # Build input vector of length matching feature size
                vector = np.zeros(len(self.features))
                for s in symptoms:
                    clean_s = s.strip().lower()
                    if clean_s in self.features:
                        vector[self.features[clean_s]] = 1
                
                # Reshape for single sample input
                vector = vector.reshape(1, -1)
                
                # Get probability predictions
                probs = self.model.predict_proba(vector)[0]
                classes = self.model.classes_
                
                # Sort predictions in descending order of confidence
                ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
                top_results = [{"disease": item[0], "confidence": float(item[1])} for item in ranked[:3] if item[1] > 0.05]
                
                if not top_results:
                    return {
                        "results": [{"disease": "General / Unknown", "confidence": 1.0}],
                        "guidance": CARE_GUIDANCE_MAP["General / Unknown"]
                    }
                
                primary_disease = top_results[0]["disease"]
                guidance = CARE_GUIDANCE_MAP.get(primary_disease, CARE_GUIDANCE_MAP["General / Unknown"])
                
                return {"results": top_results, "guidance": guidance}
                
            except Exception as e:
                logger.error(f"Error during ML vectorized inference: {e}. Executing fallback logic.")
        
        # Rule-based fallback: look up matching diseases based on input symptoms
        matches = {}
        for sym in symptoms:
            clean_sym = sym.strip().lower().replace(" ", "_")
            if clean_sym in FALLBACK_DISEASE_RULES:
                disease = FALLBACK_DISEASE_RULES[clean_sym]
                matches[disease] = matches.get(disease, 0) + 1
        
        # Compute confidence scores based on matching weights
        total_matches = sum(matches.values())
        if total_matches == 0:
            return {
                "results": [{"disease": "General / Unknown", "confidence": 1.0}],
                "guidance": CARE_GUIDANCE_MAP["General / Unknown"]
            }
            
        top_results = []
        for disease, count in sorted(matches.items(), key=lambda x: x[1], reverse=True):
            top_results.append({
                "disease": disease,
                "confidence": round(count / total_matches, 2)
            })
            
        primary_disease = top_results[0]["disease"]
        guidance = CARE_GUIDANCE_MAP.get(primary_disease, CARE_GUIDANCE_MAP["General / Unknown"])
        
        return {"results": top_results, "guidance": guidance}

ml_service = MLService()
