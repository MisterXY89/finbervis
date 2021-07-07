
import pandas as pd
from predict import SentimentPredictor

df = pd.read_csv("../data/decentralized_data.csv")
pred = SentimentPredictor()

true_labels = list(df.sentiment)
pred_labels = []
for index, row in df.iterrows():
    try:
        pred_label = pred.predict([row.segment], pretty=True)
    except Exception as e:
        pred_label = "error"
    pred_labels.append(pred_label[0])
    
print(pred_labels)

matches = [i for i, j in zip(true_labels, pred_labels) if i == j]
print(matches)
print(len(matches)/len(df))
