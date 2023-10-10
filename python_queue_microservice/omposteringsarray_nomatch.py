import json
import redis
import time
import spacy
from joblib import load
import csv
import os

pipeline = spacy.load('da_core_news_md')
current_dir = os.getcwd()

model_fil_path = 'trained_model.joblib'
model_til_konteringsforslag = load(model_fil_path)

def preprocess_text(text):
    doc = pipeline(text.lower())
    tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]
    preprocessed_text = " ".join(tokens)
    return preprocessed_text

def transform(data):
    # Parse the JSON data
    bankposteringer = json.loads(data)
    data = []

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
        formateret_postering["Tekst"] = formateret_postering.get('narrative', '')
        formateret_postering["Beløb"] = formateret_postering.get('amount', '')
        formateret_postering["Artskonto"] = predicted_kontering[1]
        formateret_postering["PSP_element"] = predicted_kontering[2]
        formateret_postering["Sikkerhed"] = predicted_kontering.accuracy
    
        data.append(formateret_postering)
        print(formateret_postering)

    return data

# Connect to the Redis server using the correct hostname
r = redis.Redis(host='redis_microservice')

# Subscribe to the "data" topic
p = r.pubsub()
p.subscribe('data')

# Listen for new messages
while True:
    # Get a new message if one is available
    message = p.get_message()
    # If no message is available, sleep for a short time and try again
    if not message:
        time.sleep(0.001)
        continue
    # Ignore non-data messages
    if message['type'] != 'message':
        continue
    # Transform the data and Return the transformed data on the "results" topic
    r.publish('results', json.dumps(transform(message['data'])))