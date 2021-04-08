
import glob
import pandas as pd

from config import DATA_DIR

files = glob.glob(f"{DATA_DIR}/*.xlsx")

df = pd.read_excel(files[0])
df = df[["Code", "Segment"]]

for f in files[1:]:
    tmp_df = pd.read_excel(f)
    tmp_df = tmp_df[["Code", "Segment"]]
    df = df.append(tmp_df, ignore_index=True)
    
    
df.columns = ["sentiment", "segment"]
df.segment = df.segment.apply(lambda x: x.replace("\n", " "))
df.segment = df.segment.apply(lambda x: x.replace("  ", " "))
df.sentiment = df.sentiment.str.lower()

print(len(df.query('sentiment=="positive"')))
print(len(df.query('sentiment=="negative"')))
print(len(df.query('sentiment=="neutral"')))

df = df[df.sentiment.isin(["positive", "neutral", "negative"])] 
df["id"] = df.index

    
print(df)

df.to_csv(f"{DATA_DIR}/new_training_data.csv", index=False)


    