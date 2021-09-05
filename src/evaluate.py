"""
@author: Tilman Kerl
@version: 2021.09.04
---
Evaluate patterns
"""

import json
import numpy as np
import pandas as pd

from cluster_one_hot_vectors import cluster_one_hot
from create_one_hot_vector import make_one_hot


files = ["../data/drop_from_3_data.csv", 
		"../data/drop_8_data.csv", 
		"../data/data_copy.csv"
  ]

dfs = [pd.read_csv(file) for file in files]

def eval():
	all_results = []
	for df in dfs:
		# exclude with more than one 1
		# count num of function words + content words
		results = {
			"accuracy": len(df.query("sentiment == truth_label"))/len(df)
		}
		for t in np.arange(0.3, 1, 0.05):
			vecs, oh_df = make_one_hot(df, is_df = True, threshold=t)
			num_with_one = len([v for v in vecs if v.count(1) == 1])
			anti_num = len(vecs) - num_with_one
			vecs = [*filter(lambda x: x.count(1) == 1, vecs)]
			# for sample_size in range(10, 200, 10):
			cluster_dict = {}
			for epsilon in np.arange(0.05, 2.5, 0.05):				
				cluster_list, df, no_clusters, no_noise, clusters = cluster_one_hot(df, epsilon = epsilon, min_samples = 3, is_df = True)
				cluster_dict[str(epsilon)] = {
					"no_clusters": float(no_clusters),
					"no_noise": float(no_noise)
				}
				
			results[str(t)] = {
				"vecs": vecs,
				"with_one": num_with_one,
				"anti_num": anti_num, 
				"cluster": cluster_dict
			}
			
		all_results.append(results)
	
	return all_results
			
			
res = eval()
with open("evaluate_2_result.json", "w") as file:
	json.dump(res, file)
