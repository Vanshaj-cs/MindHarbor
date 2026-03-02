from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()

model = joblib.load("emotion_model.pkl")

emotion_weights = {
    "joy": 2.0,
    "love": 1.5,
    "surprise": 0.5,
    "anger": -1.5,
    "fear": -1.8,
    "sadness": -2.0
}

class ChatInput(BaseModel):
    user_id: str
    timestamp: str
    message: str

def interpret_score(score):
    if score >= 1:
        return "Very Positive"
    elif score >= 0:
        return "Stable"
    elif score >= -1:
        return "Mild Distress"
    else:
        return "High Distress"

def analyze_message(text):
    probs = model.predict_proba([text])[0]
    classes = model.classes_

    emotion_probs = dict(zip(classes, probs))

    score = 0
    for emotion, prob in emotion_probs.items():
        score += prob * emotion_weights[emotion]

    dominant_emotion = max(emotion_probs, key=emotion_probs.get)
    confidence = emotion_probs[dominant_emotion]

    return score, dominant_emotion, confidence

@app.post("/predict")
def predict(data: ChatInput):

    score, dominant_emotion, confidence = analyze_message(data.message)

    return {
        "user_id": data.user_id,
        "timestamp": data.timestamp,
        "message": data.message,
        "mental_score": round(score, 4),
        "dominant_emotion": dominant_emotion,
        "confidence": round(float(confidence), 4),
        "status": interpret_score(score)
    }