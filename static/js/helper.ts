

function toast_msg(msg) {
	$("#toast-msg").html(msg);
	$('.toast').toast("show");
}

function unzoom() {
	window.zoom = false;
	// click_point(window.d);
}

function to_array(string) {
	// console.log(string);
	if (typeof string == "object") {
		return string;
	}
	if (string == undefined) {
		return [];
	}
	let arr = string.slice(1, -1).split(", ");
	if (Number.isNaN(Number(arr[0]))) {
		if (arr[0][0] == "''") {
			return arr.map(el => el.slice(1, -1));
		}
		return arr;
	}
	return arr.map(Number);
}

async function load_data(files, mns) {
	let fi1 = files[0];
	const papa_config = {delimiter: ",", header: true};
	let data1 = await fetch(`/data/${fi1}`)
		.then(resp => resp.text())
		.then(t => Papa.parse(t, papa_config))
		.then(data1 => {
			console.log("pre trans ", data1);
			return transform_data(data1.data, mns[0]);
		});
	let fi2 = files[1];
	if (!fi2 || fi2 == undefined) {
		return {data1};
	}
	let data2 = await fetch(`/data/${fi2}`)
		.then(resp => resp.text())
		.then(t => Papa.parse(t, papa_config))
		.then(data2 => {
			return transform_data(data2.data, mns[1]);
		});
	return { data1, data2 }
}

function transform_data(data, mn) {
	data.map(row => {
		row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens, true) : [];
		row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
		row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
		row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
		row.props = (row.props != undefined) ? to_array(row.props) : [];
		row.x = (row.x != undefined) ? Number(row.x) : 0;
		row.y = (row.y != undefined) ? Number(row.y) : 0;
		row.id = (row.id != undefined) ? Number(row.id) : -1;
		row.one_hot_cluster = (row.one_hot_cluster != undefined) ? Number(row.one_hot_cluster) : -1;
		row.one_hot = (row.one_hot != undefined) ? to_array(row.one_hot, false) : [];
		row.pos_tag_classes = (row.pos_tag_classes != undefined) ? to_array(row.pos_tag_classes, false) : [];
		row.deRoseAttention = (row.deRoseAttention != undefined) ? to_array(row.deRoseAttention) : [];
		row.pos_tags = (row.pos_tags != undefined) ? to_array(row.pos_tags) : [];		
		row.model_num = mn;
	})
	console.log("transformed_data:", data);
	return data;
}

function get_sentiment_color(sentiment) {
	let color_sent_dict = {
		neutral: "#64abe5",
		negative: "#9e64e5",
		positive: "#abe564"
	}
	return color_sent_dict[sentiment];
}



function create_heatmap(segment, layer, head, div_id) {
	load_attention_heatmap_data(segment, layer, head).then(data => {
		new Heatmap(data, div_id)
	})
}

function get_sentiment_html(sent, truth_label, is_truth_label) {
	truth_label = truth_label == undefined ? "" : truth_label;
	is_truth_label = is_truth_label == undefined ? false : is_truth_label;
	let truth_label_sentiment_class = "";
	if (is_truth_label && truth_label != sent) {		
		truth_label_sentiment_class = "truth-label-sentiment";
		sent = truth_label;
	}
	return `<span class="badge badge-pill class-${sent} ${truth_label_sentiment_class}" style="line-height:1.5em;">${sent}</span>`;
}

function get_max_value(str_props, pretty) {
	pretty = pretty == undefined ? false : pretty;
	if (str_props == "NaN" || str_props == "Na" || str_props == undefined) {
		// console.log(str_props);
		return (pretty) ? "-" : 0;
	}
	let max_val:number|string;
	if (typeof str_props == "object" && str_props.length == 3) {
		// console.log("str_props", str_props);
		max_val = d3.max(str_props);
	} else {		
		max_val = Number(d3.max(str_props.slice(1,-1).replace(" ", "").split(",").map(el => Number(el))));
	}
	if (pretty) {
			max_val = (""+max_val*100).slice(0,4) + "%";
	}
	return max_val;
}

function tok_to_array(string, tok) {
	tok = (tok == undefined) ? true : tok;
	if (string == undefined) {
		return [];
	}
	if (typeof string == "object") {
		if (string.tokens != undefined) {
			return string.tokens;
		}
		return string;
	}
	if (!tok) {
			return string.slice(1,-1).split(",").map(Number);
	}
	// return string.replaceAll("', '##", "").slice(2, -1).split(", '").map(el => el.slice(0, -1))	
	string = string.split("', '");
	string[0] = "[CLS]";
	string[string.length-1] = "[SEP]";
	return string;
}

function get_color(el: string|number, new_point: boolean|undefined) {
	// console.log(new_point);
	if(new_point) {
		return SELECT_COLOR;
	}
	if (typeof el == "string") {
		return COLORS[SENTIMENT_CLASSES.indexOf(el)];
	}
	return COLORS[el];
}

function get_color_truth(d: any) {
	if (d.sentiment != d.truth_label) {
		return "black";
	}
	return get_color(d.sentiment, d.new);
}

function get_radius(new_point: boolean|undefined) {
	if (new_point) {
		return SELECT_RADIUS;
	}
	return RADIUS;
}


function add_labeled_record(sentiment: string, segment: string) {
	let data = new FormData();
	let json_string: string = JSON.stringify( {sentiment, segment});
	console.log("add_label", json_string);	
	data.append( "json", json_string );
	fetch("/add_labeled_record", {
		method: "POST",
		body: data
	}).then(resp => resp.json())
	.then(json => {
		if(json["status"]) {
			// alert("Entry added");
			toast_msg("New sentiment added!");
			$("#userClassificationModal").modal("hide");
			window.added_segment = segment;
		}
		// console.log(json);
	})
}
