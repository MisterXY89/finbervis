"""
@author: Tilman Kerl
@version: 2020.11.23
---
Explore the dataset and clean the set for later ussage in bert_preprocess
"""

import re
import spacy
import pandas as pd
from tqdm import tqdm
from config import DATASET_FILE, CLEANED_DATASET_FILE, LABEL_VALUES

SENTENCE_REGEX = r"^[A-Z][A-Za-z,;'\"\s&%0-9-():‘“]+[.?!]"
nlp = spacy.load("en_core_web_sm")

print(DATASET_FILE)
print(CLEANED_DATASET_FILE)

def reduce_df(to_be_reduced_df: pd.DataFrame) -> pd.DataFrame:
    """
    reduce the df to the needed dims & lowers column header
    """
    reduced_df = to_be_reduced_df.rename({'Segment': 'segment'}, axis=1)
    return reduced_df[["segment", "sentiment"]]


def get_distribution(distr_df: pd.DataFrame) -> pd.DataFrame:
    """
	print value distribution for quick check
	"""
    for value in LABEL_VALUES:
        length = len(distr_df.query(f"sentiment == '{value}'"))
        print(f"amount({value}) = {length}")
    return True


def clean_dataset(to_be_cleaned_df: pd.DataFrame) -> pd.DataFrame:
    """
	expected: df is smaller & no new line can be found
	"""
    print("Basic cleaning...")
    df_reduced = reduce_df(to_be_cleaned_df)
    # getting rid of newlines and multiple spaces
    df_slim = df_reduced.replace(r'(\r|\n)', ' ', regex=True)
    df_slim = df_slim.replace(r'\s+', ' ', regex=True)
    return df_slim


def parse_sentences(to_be_cleaned_sent_df: pd.DataFrame) -> pd.DataFrame:
    """
    uses spacy & regex to get all valid sentences and add them to df seperatly
    """
    print("Flagging sentences...")
    for index, row in tqdm(to_be_cleaned_sent_df.iterrows(),
                           desc='Progress',
                           total=len(to_be_cleaned_sent_df.index)):
        seg = str(row.segment)
        doc = nlp(seg)
        sentences_in_segment = [
            str(el) for el in list(doc.sents)
            if re.match(SENTENCE_REGEX, str(el)) is not None
        ]

        if len(sentences_in_segment) > 0:
            to_be_cleaned_sent_df.at[index,
                                     'segment'] = sentences_in_segment[0]
            if len(sentences_in_segment) > 1:
                for sentence in sentences_in_segment:
                    to_be_cleaned_sent_df.loc[len(
                        to_be_cleaned_sent_df.index)] = [
                            sentence,
                            to_be_cleaned_sent_df.at[index, 'sentiment'], True
                        ]
            to_be_cleaned_sent_df.at[index, 'isSentence'] = True
        else:
            to_be_cleaned_sent_df.at[index, 'isSentence'] = False
    return to_be_cleaned_sent_df


# # basic loading & cleaning
# data_frame = pd.read_csv(DATASET_FILE)
# df_clean = clean_dataset(data_frame)
#
# # parse all sentences & save reduced df
# df_clean = parse_sentences(df_clean)
# df_clean = df_clean.query("isSentence == True")
# df_clean_slim = reduce_df(df_clean)
# df_clean.to_csv(CLEANED_DATASET_FILE, index=False)
# get_distribution(df_clean)
