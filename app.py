
import os
import time
from flask import Flask, render_template, request, redirect, url_for, Response, send_from_directory

app = Flask("TransformerViz", static_url_path='')
app.config['FLASK_SECRET'] = ';Orv=5Wt#pkueb9.'

# set timezone:
os.environ['TZ'] = 'Europe/Berlin'
time.tzset()

resource_path = os.path.join(app.root_path, 'data')


@app.route('/')
def index():
	return render_template("index.html")


@app.route('/data/<path:path>')
def send_js(path):
    """
    enable reading from data folder
    """
    return send_from_directory('data', path)


if __name__ == '__main__':
	app.run()
