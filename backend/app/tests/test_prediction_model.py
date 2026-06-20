import pytest
from app.services.ml_service import ml_service

def is_synthetic_model() -> bool:
    """
    Checks if the active model corresponds to the default synthetic symptom set (19 features).
    """
    return ml_service.features is not None and len(ml_service.features) == 19

def test_ml_fungal_infection_prediction():
    """
    Verifies fungal infection symptom classifications when using the default model,
    or falls back to general schema checks when custom models are loaded.
    """
    symptoms = ["itching", "skin_rash"]
    if is_synthetic_model():
        symptoms.append("nodal_skin_eruptions")
        prediction = ml_service.predict(symptoms)
        assert prediction is not None
        assert len(prediction["results"]) > 0
        assert prediction["results"][0]["disease"] == "Fungal infection"
        assert "antifungal" in prediction["guidance"].lower()
    else:
        prediction = ml_service.predict(symptoms)
        assert prediction is not None
        assert "results" in prediction
        assert "guidance" in prediction

def test_ml_allergy_prediction():
    """
    Verifies allergy symptom classifications when using the default model,
    or falls back to general schema checks when custom models are loaded.
    """
    symptoms = ["continuous_sneezing", "shivering", "chills"]
    if is_synthetic_model():
        prediction = ml_service.predict(symptoms)
        assert prediction is not None
        assert len(prediction["results"]) > 0
        assert prediction["results"][0]["disease"] == "Allergy"
        assert "allergen" in prediction["guidance"].lower()
    else:
        prediction = ml_service.predict(symptoms)
        assert prediction is not None
        assert "results" in prediction
        assert "guidance" in prediction

def test_ml_empty_symptoms_fallback():
    """
    Verifies that empty symptoms list falls back to General / Unknown regardless of model.
    """
    prediction = ml_service.predict([])
    
    assert prediction is not None
    assert len(prediction["results"]) == 1
    assert prediction["results"][0]["disease"] == "General / Unknown"
