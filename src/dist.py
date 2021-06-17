
import numpy as np
import pandas as pd
from scipy.spatial import distance
from fastdist import fastdist


from config import (
    CLUSTER_DATASET_FILE, 
    NEW_EMBS_FILE
)


class Dist:
    """
    calculate dist matrix + get most similar sentences
    """

    def __init__(self, threshold = 10):
        self.DIST_THRESHOLD = threshold
        self.df = pd.read_csv(NEW_EMBS_FILE)
        self.dist_matrix = self.get_dist_matrix(self.df)
        self.similiar_sents = self.dist_matrix[self.dist_matrix < self.DIST_THRESHOLD].stack().reset_index()

    def get_dist_matrix(self, df):

        # embeddings = df.embeddings
        embeddings = df.cls_embs
        values = list(embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(",")))))
        values = np.array(list(map(lambda e: list(map(float, e)), values)))

        return pd.DataFrame(
            self.distance_matrix(values),
            index=embeddings.index,
            columns=embeddings.index
        )

    def update_df(self, dp):
        """
        Index(['segment', 'sentiment', 'embeddings', 'props', 'cls_embs', 'cluster',
       'x', 'y', 'id', 'mean_attention', 'tokens', 'saliency_score',
       'truth_label'],
        """
        self.df.loc[len(self.df)] = [dp["segment"], dp["sentiment"],
                                        [], dp["props"], dp["embeddings"], -1,
                                        dp["x"], dp["y"], dp["id"], [], 
                                        dp["tokens"], [], "not set", 
                                        dp["deRoseAttention"]
                                    ]

    def get_similar_sents_for(self, id=0, n=5, return_sents=False):
        # via head & tail cut of self-dist = 0
        sents_index = list(self.similiar_sents.query(f"level_0 == {id}").sort_values(by=0).head(n*2).level_1)
        # print(sents_index)
        all_segments = []
        if return_sents:
            full_sents = []
            for sent_index in sents_index:
                row = self.df.iloc[sent_index]
                if str(row["segment"]) in all_segments:
                    continue
                print(sent_index)
                all_segments.append(str(row["segment"]))
                full_sents.append({
                    "id": int(row["id"]),
                    "segment": row["segment"],
                    "sentiment": row["sentiment"],
                    "props": row["props"],
                    "saliency_score": row["saliency_score"],
                    "tokens": row["tokens"],
                    "mean_attention": row["mean_attention"],
                    "deRoseAttention": row["deRoseAttention"],
                    "truth_label": row["truth_label"],
                })
            return full_sents[:5]
        return sents_index[:5]


    def distance_matrix(self, values):
        dist_matrix = fastdist.matrix_pairwise_distance(values, fastdist.cosine, "cosine", return_matrix=True)
        return dist_matrix



# dist = Dist()
# dist.update_df({""})
# sents = dist.get_similar_sents_for(id=100, return_sents=True, n=10)
# sents2 = dist.get_similar_sents_for(id=1261, return_sents=False, n=15)
#
# print(sents)
# print(sents2)
