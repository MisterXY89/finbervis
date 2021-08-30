

import pandas as pd

df = pd.read_csv("../data/data_copy.csv")


def mk_list(s_arr, tok=False, spacy=False):
    if s_arr == "ERROR":
        return []
    if tok:
        arr = s_arr.split("', '")
    else:
        s_arr = s_arr[1:-1]
        arr = s_arr.split(", ")
    if tok:        
        arr[0] = "[CLS]"
        arr[-1] = "[SEP]"
    else:
        arr = [*map(float, arr)]
    return arr

def get_data_dict(id, title, note):
    data = []
    max_len = len(max(map(mk_list, list(df.saliency_score))))
    for index, row in df.iterrows():
        # [1928,21,401.944793]
        # x, y, z 
        element_length = 0
        for i, el in enumerate(mk_list(row.saliency_score)):
            data.append([i, index, el])
            element_length = i
        while i < max_len:
            data.append([i, index, -2])
            i += 1
    
    vis_data = [{
        "id": id,
        "title": title,
        "note": note,
        "data": {
            "chart_options": {},
            "values": {
                "data": data
            }
        }
    }]
    return vis_data

    

data_dict = get_data_dict("main_model_saliency_vis", "Centralized Model Saliency", "some description")
print(data_dict)