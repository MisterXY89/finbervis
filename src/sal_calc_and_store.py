
import sys
import pickle
from tqdm import tqdm

from interface import Interface
from config import NEW_EMBS_FILE

interface = Interface()

df = interface.dist.df


tokens = []
saliency_scores = []
df["tokens"] = None
df["saliency_score"] = None

with open("../data/errors.pk", "rb") as file:
    errors = pickle.load(file)
    
with open("../data/sal_scores.pk", "rb") as file:
    sal_scores = pickle.load(file)


print(len(sal_scores))
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
        saliency_scores.append(sal_scores[sal_i][0])
        tokens.append(sal_scores[sal_i][1])
        sal_i += 1
    else:
        saliency_scores.append("ERROR")
        tokens.append("ERROR")            
        
df["tokens"] = tokens
df["saliency_score"] = saliency_scores


df.to_csv(NEW_EMBS_FILE, index=False)
