from fastapi import FastAPI, File, UploadFile
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import cv2

app = FastAPI()

model = tf.keras.models.load_model("emotion_model.keras")

emotion_labels = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "neutral",
    "sad",
    "surprise"
]

face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

def detect_and_crop_face(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    image_np = np.array(image)

    gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5
    )

    if len(faces) == 0:
        return None

    (x, y, w, h) = faces[0]
    face = gray[y:y+h, x:x+w]

    face = cv2.resize(face, (48, 48))
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=-1)
    face = np.expand_dims(face, axis=0)

    return face

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    face = detect_and_crop_face(contents)

    if face is None:
        return {"error": "No face detected"}

    prediction = model.predict(face)
    predicted_class = np.argmax(prediction)
    confidence = float(np.max(prediction))

    return {
        "emotion": emotion_labels[predicted_class],
        "confidence": round(confidence, 3)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)