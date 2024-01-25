"""Import of relevant modules"""
import os
import time
import json
import redis
import spacy
from joblib import load

print("Hello World")

pipeline = spacy.load('da_core_news_md')
current_dir = os.getcwd()

MODEL_FIL_PATH = 'python_queue_microservice/trained_model.joblib'

if os.path.exists(MODEL_FIL_PATH):
    model_til_konteringsforslag = load(MODEL_FIL_PATH)
else:
    print("Model file not found.")

def preprocess_text(text):
    """Tokenization"""
    doc = pipeline(text.lower())
    tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]
    preprocessed_text = " ".join(tokens)
    return preprocessed_text

def transform(data_in):
    """Datatransformation"""
    bankposteringer = json.loads(data_in)
    print(bankposteringer)
    new_data = []

    for postering in bankposteringer:
        formateret_postering = {
            'transaction_id': postering['transaction_id'],
            'amount': postering.get('amount'),
            'narrative': preprocess_text(postering.get('narrative', "")),
            'message': preprocess_text(postering.get('message', "")),
            'booking_date': postering.get('booking_date'),
            'type_description': preprocess_text(postering.get('type_description')),
            'counterparty_name': preprocess_text(postering.get('counterparty_name', ""))
        }
        # Foretag forudsigelsen
        predicted_kontering = model_til_konteringsforslag.predict([formateret_postering])
        # Udfyld felter med forudsigelser
        formateret_postering["artskonto"] = predicted_kontering[1]
        formateret_postering["psp"] = predicted_kontering[2]
        formateret_postering["sikkerhed"] = predicted_kontering.accuracy

        new_data.append(formateret_postering)
        print(formateret_postering)

    return new_data

# Connect to the Redis server using the correct hostname
r = redis.Redis(host='redis_microservice')

# Subscribe to the "data" topic
p = r.pubsub()
p.subscribe('data')

# Listen for new messages
while True:
    # Get a new message if one is available
    message = p.get_message()
    print(f"Received message: {message['data']}")

    # If no message is available, sleep for a short time and try again
    if not message:
        time.sleep(0.001)
        continue
    # Ignore non-data messages
    if message['type'] != 'message':
        continue
    # Parse again
    preprocessed_data = message['data'].decode('utf-8')
    print(f"Message processed: {preprocessed_data}")

    data_out = transform(preprocessed_data)
    print(f"Data out: {data_out}")

    # Transform the data and Return the transformed data on the "results" topic
    r.publish('results', json.dumps(data_out))
