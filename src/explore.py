
from config import *
from pandas import pandas as pd


def reduceDF(df):
	return df[["Segment", "sentiment"]]

def getDistribution(df):
	values = ["positive", "neutral", "negative"]

	for value in values:
		length = len(df.query(f"sentiment == '{value}'"))
		print(f"amount({value}) = { length}")


data_frame = pd.read_csv(DATASET_FILE)
data_frame_slim = reduceDF(data_frame)


getDistribution(data_frame_slim)

# getting rid of newlines and multiple spaces
data_frame_slim = data_frame_slim.replace('(\r|\n)',' ', regex=True) 
data_frame_slim = data_frame_slim.replace('\s+',' ', regex=True) 

print(data_frame_slim)

# there are matches in col, ther may be a wrong sentence up front or at the end
sentence_regex = "[A-Z]+[a-zA-Z|\s|,|0-9]+[?|\!|.]+"
data_frame_slim["isSentence"] = data_frame_slim.Segment.str.contains(sentence_regex, regex= True, na=False)
print(data_frame_slim)

data_frame_slim_clean = data_frame_slim.query(f"isSentence == True")
data_frame_slim_clean = reduceDF(data_frame_slim_clean)
print(len(data_frame_slim_clean))
getDistribution(data_frame_slim_clean)

data_frame_slim_clean.to_csv(f"{DATA_DIR}/text_segments_cleaned.csv", index=False)

