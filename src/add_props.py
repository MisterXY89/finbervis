
import numpy as np
import pandas as pd

from config import MODEL_DIR, DATA_DIR
from predict import SentimentPredictor

FILENAME = "drop_8_data.csv"
FILE = f"{DATA_DIR}/{FILENAME}"

sent_pred = SentimentPredictor()
sent_pred.load_model()

df = pd.read_csv(FILE)
df["props"] = list(range(0, len(df)))

ds = 0
ec = 0

prop_list = []
prediction_label_list = []
df["props"] = None
df["sentiment"] = None
for index, row in df.iterrows():
    print(f"{index=}")
    segment = row["segment"]
    print(segment)
    try:
        props = sent_pred.predict([segment], pretty=False, shorten=False)
    except Exception as e:
        print(40*"-")
        print(e)
        ec += 1
        prop_list.append(None)
        prediction_label_list.append(None)
        print(40*"-")
        # row["props"] = None
        continue

    prediction_label = sent_pred._prettify_probabilities([props], shorten=False)[0]

    if prediction_label != row["sentiment"]:
        print(f"### DIFFERENT SENTIMENT ###")
        ds += 1
        print(f">: {segment=}")
        print(f"> OLD: {row['sentiment']}")
        print(f"> NEW: {prediction_label}")
    # row["sentiment"] = prediction_label
    print(list(props))
    prop_list.append(list(props))
    prediction_label_list.append(prediction_label)

print(len(prop_list))
df.loc[:, "props"] = prop_list
df.loc[:, "sentiment"] = prediction_label_list
df.to_csv(FILE, index=False)

print(f"{ec=}")
print(f"{ds=}")
