"""
@author: Tilman Kerl
@version: 2020.11.18
---
Descripton of explore.py
"""

from config import *
import pandas as pd


def reduce_df(df):
    return df[["segment", "sentiment"]]


def get_distribution(df):
    """
	print value distribution for quick check
	"""
    values = ["positive", "neutral", "negative"]
    for value in values:
        length = len(df.query(f"sentiment == '{value}'"))
        print(f"amount({value}) = {length}")


def clean_dataset(df):
    """
	expected: df is smaller & now new line can be found
	"""
    df = df.rename({'Segment': 'segment'}, axis=1)
    df_slim = reduce_df(df)
    # getting rid of newlines and multiple spaces
    df_slim = df_slim.replace('(\r|\n)', ' ', regex=True)
    df_slim = df_slim.replace('\s+', ' ', regex=True)
    return df_slim


def flag_sentences(df):
    """
	there are matches in col, ther may be a wrong sentence up front or at the end
	"""
    sentence_regex = "[A-Z]+[a-zA-Z|\s|,|0-9]+[?|\!|.]+"
    df["isSentence"] = df.segment.str.contains(sentence_regex,
                                               regex=True,
                                               na=False)
    return df


def cleanSentences(df):
    df = df.query(f"isSentence == True")


# basic loading & cleaning
df = pd.read_csv(DATASET_FILE)
df_slim = clean_dataset(df)
getDistribution(df_slim)
df_slim = flag_sentences(df_slim)

print(30 * "-")

# cut of isSentence flag & store cleaned df
df_slim_clean = df_slim.query(f"isSentence == True")
df_slim_clean = reduce_df(df_slim_clean)
getDistribution(df_slim_clean)
df_slim_clean.to_csv(CLEANED_DATASET_FILE, index=False)
