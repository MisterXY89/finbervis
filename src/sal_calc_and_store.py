
import sys
import pickle
import pandas as pd
from tqdm import tqdm

from interface import Interface
# from config import NEW_EMBS_FILE

FILE = "../data/drop_4_data.csv"

interface = Interface()

df = pd.read_csv(FILE)


tokens = []
saliency_scores = []
df["tokens"] = None
df["saliency_score"] = None

with open("../data/sal_scores/errors_layer_4.pk", "rb") as file:
    errors = pickle.load(file)
    
with open("../data/sal_scores/sal_scores_layer_4.pk", "rb") as file:
    sal_scores = pickle.load(file)


print(len(errors))
print(errors[0])

print(len(sal_scores))
print(df)

# error_ids_init = [50, 417, 3734, 4068, 4220, 5081, 2964, 1774, 1770, 1185, 691, 684]
error_ids_4 = []

for e in errors:
    print(type(e))
    d = interface.search(q=str(e))
    print(type(d))
    error_ids_4.append(str(d.id))
    # df.loc[d.index, "tokens"] = "ERROR"
    # df.loc[d.index, "saliency_score"] = "ERROR"

print(error_ids_4)

sys.exit()

sal_i = 0
for index, row in df.iterrows():
    # print(int(row.id))
    if not int(row.id) in error_ids:
        print(sal_scores[sal_i])
        if condition:
            pass
        if 1<2: break
        saliency_scores.append(sal_scores[sal_i][0])
        tokens.append(sal_scores[sal_i][1])
        sal_i += 1
    else:
        saliency_scores.append("ERROR")
        tokens.append("ERROR")
        
df["tokens"] = tokens
df["saliency_score"] = saliency_scores


df.to_csv(FILE, index=False)
