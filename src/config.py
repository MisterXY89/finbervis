"""
@author: Tilman Kerl
@version: 2020.11.18
---
specifying constants and som general config
"""
import os
import pandas as pd

# FILE CONSTANTS
WORKING_DIR = os.getcwd()
BASE_DIR = WORKING_DIR if not "src" in WORKING_DIR else WORKING_DIR.split("/src")[0]
DATA_DIR = BASE_DIR + "/data"


DATASET_FILENAME = "hand_coded_text_segments.csv"
DATASET_FILE = f"{DATA_DIR}/{DATASET_FILENAME}"
CLEANED_DATASET_FILENAME = "text_segments_cleaned.csv"
CLEANED_DATASET_FILE = f"{DATA_DIR}/{CLEANED_DATASET_FILENAME}"

# TESTING DATA
test_df = pd.read_csv(DATASET_FILE)
