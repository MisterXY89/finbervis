
import sys
import pickle
import pandas as pd
from tqdm import tqdm

from interface import Interface

interface = Interface()

def calc_sal(df):
    tokens = []
    saliency_scores = []
    df["tokens"] = None
    df["saliency_score"] = None

    print(df.head(5))

    error_ids = [50, 417, 3734, 4068, 4220, 5081, 2964, 1774, 1770, 1185, 691, 684]

    for e in error_ids:
        d = interface.search(seg_id=e)    
        df.loc[d.index, "tokens"] = "ERROR"
        df.loc[d.index, "saliency_score"] = "ERROR"


    sal_i = 0
    for index, row in df.iterrows():
        print(int(row.id))
        if not int(row.id) in error_ids:
            sal_scores = interface.get_gradient_scores(str(row.segment))
            saliency_scores.append(sal_scores[sal_i][0])
            tokens.append(sal_scores[sal_i][1])
            sal_i += 1
        else:
            saliency_scores.append("ERROR")
            tokens.append("ERROR")            
            
    df["tokens"] = tokens
    df["saliency_score"] = saliency_scores


    df.to_csv(NEW_EMBS_FILE, index=False)


df = pd.read_csv("drop_4_data.csv")
sal_calc(df)