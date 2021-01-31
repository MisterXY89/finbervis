
import os
import time
import json
from flask import Flask, render_template, request, redirect, url_for, Response, send_from_directory, jsonify, make_response

from src import interface

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
def send_js(path):
    """
    enable reading from data folder
    """
    return send_from_directory('data', path)

@app.route("/split_rule")
def split_rule():
	req_data = request.args

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
    sentiment = interface.get_sentiment(segment)[0]
    print(f"{sentiment=}")
    embs = list(interface.get_embeddings(segment))
    print(f"{embs=}")
    trans_embs = interface.make2D(embs)
    print(f"{trans_embs=}")
    x = float(trans_embs[0].view())
    y = float(trans_embs[1].view())
    dict = {
        "embeddings": list(map(lambda x: float(x.view()), list(embs))),
        "x": x,
        "y": y,
        "sentiment": sentiment,
		"segment": segment,
		"new": True
    }
    print(dict)
    return jsonify(dict)




if __name__ == '__main__':
	app.run()
