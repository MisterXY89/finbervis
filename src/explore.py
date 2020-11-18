"""
@author: Tilman Kerl
@version: 2020.11.18
---
Descripton of explore.py
"""

import re
import spacy
import pandas as pd
from tqdm import tqdm
from config import DATASET_FILE, CLEANED_DATASET_FILE

sentence_regex = r"^[A-Z][A-Za-z,;'\"\s&%0-9-():‘“]+[.?!]"
# sentence_regex = r"[A-Z]+[a-zA-Z|\s|,|&|%|0-9|(|)|;|-|:|‘|'|\"]+[?|\!|.]+"
nlp = spacy.load("en_core_web_sm") 

def reduce_df(to_be_reduced_df):
    """
    reduce the df to the needed dims & lowers column header
    """
    reduced_df = to_be_reduced_df.rename({'Segment': 'segment'}, axis=1)
    return reduced_df[["segment", "sentiment"]]


def get_distribution(distr_df):
    """
	print value distribution for quick check
	"""
    values = ["positive", "neutral", "negative"]
    for value in values:
        length = len(distr_df.query(f"sentiment == '{value}'"))
        print(f"amount({value}) = {length}")
    return True


def clean_dataset(to_be_cleaned_df):
    """
	expected: df is smaller & now new line can be found
	"""
    df_reduced = reduce_df(to_be_cleaned_df)
    # getting rid of newlines and multiple spaces
    df_slim = df_reduced.replace(r'(\r|\n)', ' ', regex=True)
    df_slim = df_slim.replace(r'\s+', ' ', regex=True)
    return df_slim


# def flag_sentences(sent_df):
#     """
# 	adds flag where ever a sentece is detected - the regex finds a match
# 	"""    
#     sent_df["isSentence"] = sent_df.segment.str.contains(sentence_regex,
#                                                regex=True,
#                                                na=False)
#     return sent_df


def flag_sentences(to_be_cleaned_sent_df):
    """
    there are matches in col, ther may be a wrong sentence up front or at the end
    this func cleanes this up
    """
    # sentences_df = to_be_cleaned_sent_df.query("isSentence == True")
    print("Flagging sentences...")
    for index, row in tqdm(to_be_cleaned_sent_df.iterrows()):
        # test = re.search(sentence_regex, row.segment)
        # print(re.compile(sentence_regex).groups)
        seg = str(row.segment)
        doc = nlp(seg)
        sentences_in_segment = [str(el) for el in list(doc.sents) if re.match(sentence_regex, str(el)) != None]

        if len(sentences_in_segment) > 0:
            to_be_cleaned_sent_df.at[index,'segment'] = "~".join(sentences_in_segment)            
            to_be_cleaned_sent_df.at[index,'isSentence'] = True
        else:
            to_be_cleaned_sent_df.at[index,'isSentence'] = False
    return to_be_cleaned_sent_df



# basic loading & cleaning
data_frame = pd.read_csv(DATASET_FILE)
df_clean = clean_dataset(data_frame)
get_distribution(df_clean)
df_clean = flag_sentences(df_clean)

print(30 * "-")

# df_sent_clean = clean_sentences(df_clean)
df_clean = df_clean.query("isSentence == True")
df_clean.to_csv(CLEANED_DATASET_FILE, index=False)
get_distribution(df_clean)

# cut of isSentence flag & store cleaned data_frame
# df_slim_clean = df_clean.query("isSentence == True")
# df_slim_clean = reduce_df(df_slim_clean)
# get_distribution(df_slim_clean)
# df_slim_clean.to_csv(CLEANED_DATASET_FILE, index=False)
