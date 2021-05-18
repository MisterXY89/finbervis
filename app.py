
import os
import time
import json
from flask import Flask, render_template, request, redirect, url_for, Response, send_from_directory, jsonify, make_response

from src import interface

COLLECTED_LABELD_DATA_FILE = "data/COLLECTED_LABELD_DATA.csv"

app = Flask("TransformerViz", static_url_path='')
app.config['FLASK_SECRET'] = ';Orv=5Wt#pkueb9.'

# set timezone:
os.environ['TZ'] = 'Europe/Berlin'
time.tzset()

resource_path = os.path.join(app.root_path, 'data')

interface = interface.Interface()

@app.route('/')
def index():
	return render_template("index.html")


@app.route('/data/<path:path>')
def send_data(path):
    """
    enable reading from data folder
    """
    response = send_from_directory('data', path)
    # response.cache_control.max_age = 120
    return response

@app.route("/split_rule")
def split_rule():
	req_data = request.args
	result = []
	if not "seg_id" in req_data:
		success = False
	else:
		seg_id = int(req_data["seg_id"])
		splits = interface.get_splits(seg_id)
		result = interface.pred_split(splits)		
		# print(result)
		success = True
		
		
	return jsonify({
		"success": success,
		"result": result,
	})

@app.route("/get-attention")
def attention():
	req_data = request.args
	if not "layer" in req_data and not "head" in req_data and not "segment" in req_data:
		return False

	head = int(req_data["head"])
	layer = int(req_data["layer"])
	segment = req_data["segment"]

	attention = interface.get_attention_for_segment(segment, layer, head)

	resp = make_response(interface.prep_for_d3_plot(attention, segment))
	resp.headers["Content-Disposition"] = "attachment; filename=attention-export.csv"
	resp.headers["Content-Type"] = "text/csv"

	return resp



@app.route("/test_user_data")
def test_user_data():
    req_data = request.args
    segment = req_data["segment"]
    props = interface.sent_pred.predict([segment], pretty=False)
    prediction_label = interface.sent_pred._prettify_probabilities(props, shorten=False)[0]
    embs_solo = np.array(interface.get_embeddings(segment))
    embs = np.array([embs_solo, embs_solo, embs_solo, embs_solo])
    trans_embs = interface.update_UMAP(embs)
    x = float(trans_embs[0][0])
    y = float(trans_embs[0][1])
    new_tokens= interface.get_tokens(segment)
    embs_solo = list(map(float, list(embs_solo)))
    props = list(map(float, list(props)))
    dict = {
        "embeddings": embs_solo,
        "x": x,
        "y": y,
		"tokens": new_tokens,
        "sentiment": prediction_label,
		"segment": segment,
		"new": True,
		"id": len(interface.dist.df),
		"props": props
	}
    interface.dist.update_df({
		"segment": segment,
		"sentiment": prediction_label,
		"embeddings": embs,
		"x": x,
		"y": y,
		"id": len(interface.dist.df),
		"props": props,
		"tokens": new_tokens,
    })
    # print(dict)
    return jsonify(dict)


@app.route("/add_labeled_record", methods=["POST"])
def add_labeled_record():
	req_data = json.loads(request.form["json"])
	print(req_data)
	segment = req_data["segment"]
	sentiment = req_data["sentiment"]
	if not sentiment or not segment:
		status = False
	else:
		data_line = f"{segment},{sentiment}"
		with open(COLLECTED_LABELD_DATA_FILE, "a") as file:
			file.write(data_line)
		status = True

	return jsonify({
		"status": status
	})


@app.route("/get_similar_segments")
def get_similar_segments():
	print("sim")
	req_data = request.args
	# if 2<3:
	# 	time.sleep(2)
	# 	return jsonify({
	# 		"test": 123
	# 	})
	if not "seg_id" in req_data:
		status = False
		result = "Error: 'seq_id' not in req_data."
	else:
		seq_id = req_data["seg_id"]
		n = int(req_data["n"]) if "n" in req_data else 5
		return_sents = req_data["return_sents"] if "return_sents" in req_data else False
		if return_sents and return_sents == "True":
			return_sents = True
		else:
			return_sents = False
		result = interface.get_similar_sents(id=seq_id,n=n,return_sents=return_sents)
		ent_html = interface.get_ents_vis(result)		
		
		print(result)
		
		status = True

	return jsonify({
		"status": status,
		"result": result,
		"ent_html": ent_html,
		"origin_sent_ent_html": interface.get_ents_vis([interface.get_text_by_id(seq_id).replace("<hr>","")], dict=False)
	})
	
	
@app.route("/get_scores")
def get_scores():
	req_data = request.args
	print(req_data)
	if not "seg_id" in req_data:
		status = False
		result = "Error: 'seq_id' not in req_data."
	else:
		seg_id = req_data["seg_id"]
		
		segment = list(interface.search(seg_id=seg_id)["segment"])[0]
		print(segment)
		output = interface.get_gradient_scores([segment])[0]
		print(output)
		print(type(output))
		print(type(output[0]))
		print(type(output[0][0]))
		result = {
			"scores": output[0],
			"tokens": output[1],
		}
		status = True
	
	return jsonify({
		"status": status,
		"result": result,
	})

@app.route("/get_entities")
def get_entities():
	req_data = request.args
	if not "seq_id" in req_data:
		status = False
		result = f"Error: 'seq_id' not in \n{req_data=}"
	else:
		seq_id = req_data["seq_id"]
		result = interface.get_ents_vis([interface.get_text_by_id(seq_id).replace("<hr>","")], dict=False)
		status = True

	return jsonify({
		"status": status,
		"result": result,
	})


@app.route("/search")
def search():
	req_data = request.args
	if not "seg_id" in req_data and not "q" in req_data:
		status = False
		result = f"Error: 'not <seg_id> or <q> in req_data'\n{req_data=}"
	else:		
		seg_id = int(req_data["seg_id"]) if ("seg_id" in req_data) else None
		q = req_data["q"] if ("q" in req_data) else None
		# if q == "=all":
		# 	return render_template("includes/all_search.html")
		result = interface.search(seg_id=seg_id, q=q)
		status = True

	result_l = []
	for index, row in result.iterrows():
		result_l.append({
			"id": int(row.id),
			"segment": str(row.segment),
			"sentiment": str(row.sentiment),
			"x": float(row.x),
			"y": float(row.y),
			"props": str(row.props),
			"tokens": row.tokens,
			"saliency_score": row.saliency_score,
			"mean_attention": row.mean_attention
			# "embeddings": row.embeddings,,
		})
	return jsonify({
		"status": status,
		"result": result_l,
	})

if __name__ == '__main__':
	app.run()
