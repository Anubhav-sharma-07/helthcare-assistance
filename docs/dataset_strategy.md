# Phase 7 — Dataset Collection: AI-Powered Smart Healthcare Assistant

This document identifies public data sources and provides the collection, augmentation, and curation strategy for the platform.

---

## 1. Primary Dataset Choices

### A. Kaggle Symptom-Disease Dataset
* **Source Link**: [Kaggle: Symptom-Severity & Disease Dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset)
* **Columns**: `Disease`, `Symptom_1`, `Symptom_2`, ... `Symptom_17`
* **Size**: 4,920 samples mapping 41 distinct diseases.
* **Advantages**: Clean structure, highly applicable for multi-hot symptom classification.
* **Disadvantages**: Lacks demographic attributes (age, gender); synthetic noise levels are low.

### B. MedlinePlus Medical OCR Datasets
* **Source Link**: [National Institutes of Health (NIH) Clinical Center](https://clinicaltables.nlm.nih.gov/apidoc/medlineplus/v3/html)
* **Columns**: `Title`, `Summary`, `Tags`, `Symptoms`
* **Size**: ~1,200 medical articles.
* **Advantages**: High-quality clinical vocabularies from official health portals.
* **Disadvantages**: Unstructured text format; requires advanced parsing/NLP models.

---

## 2. Dataset Curation Strategy
1. **Cleaning**: Normalize symptom casing, strip punctuation, map spelling variations (e.g. "high temperature" and "fever" to `high_fever`).
2. **Augmentation**: Add random synthetic symptom combinations representing noisy patient logs.
3. **Clinical Guardrails**: Maintain high-priority check mappings for life-threatening symptoms (e.g. chest pain, breathing difficulties) pointing immediately to emergency advice.
