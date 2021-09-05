
import numpy as np
import pandas as pd
from sklearn.datasets import make_blobs
from sklearn.cluster import DBSCAN

import seaborn as sns
from matplotlib import pyplot
import matplotlib.pyplot as plt

def mk_list(s_arr, tok=False, spacy=False):
	if s_arr == None or not "," in s_arr:
		return []
	if isinstance(s_arr, list):
		return s_arr
	if tok:        
		arr = s_arr.split("', '")
	else:
		s_arr = s_arr[1:-1]
		arr = s_arr.split(", ")
	if tok and not spacy:
		arr[0] = "[CLS]"
		arr[-1] = "[SEP]"
	else:
		# arr = [*map(int, arr)]
		arr = np.array([*map(int, arr)])        
	return arr


def cluster_one_hot(file, epsilon = 1.0, min_samples = 13, store = False, is_df=False):
	
	if not is_df:
		print(file)
		df = pd.read_csv(file)
	else:
		df = file
	df["one_hot_cluster"] = list(range(0, len(df)))
	one_hot_vector_list = df.one_hot.apply(lambda x: mk_list(x)).values
	X = np.array(one_hot_vector_list, dtype=object)
	X = [np.array(x_) for x_ in X]

	# X = StandardScaler().fit_transform(X)

	# Compute DBSCAN
	db_model = DBSCAN(eps=epsilon, min_samples=min_samples)
	db = db_model.fit_predict(X)
	labels = db_model.labels_
	# print(labels)

	clusters = np.unique(db)
	no_clusters = len(np.unique(labels))
	no_noise = np.sum(np.array(labels) == -1, axis=0)
	
	print('Estimated no. of clusters: %d' % no_clusters)
	print('Estimated no. of noise points: %d' % no_noise)
	
	cluster_list = list(range(len(df)))
	for cluster in clusters:
		row_ix = np.where(db == cluster)[0]
		# print(row_ix)
		# print(len(row_ix))
		for ix in row_ix:
			cluster_list[ix] = cluster
		df["one_hot_cluster"].loc[row_ix] = cluster
	if store:
		df.to_csv(file, index=False)
	return cluster_list, df, no_clusters, no_noise, clusters

# cluster_one_hot("../data/drop_8_data.csv")
# for s in range(10, 200, 10):
#     print("min_samples: ", s)    
#     cluster_one_hot("../data/data_copy.csv", epsilon = 1.20, min_samples = s)
	
# cluster_one_hot("../data/drop_from_3_data.csv", epsilon = 2, min_samples = 25, store = True)
# cluster_one_hot("../data/data_copy.csv", epsilon = 2, min_samples = 25, store = True)
# cluster_one_hot("../data/drop_8_data.csv", epsilon = 2, min_samples = 25, store = True)