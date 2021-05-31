
const PLOT_ID:string = "#plot";
// const SELECT_COLOR:string = "#ce0c0f"; // red
const SELECT_COLOR:string = "rgb(255, 108, 0)";
const SELECT_RADIUS:number = 8;


function toast_msg(msg) {
	$("#toast-msg").html(msg);
	$('.toast').toast("show");
}

function unzoom() {
	window.zoom = false;
	// click_point(window.d);
}


function get_sentiment_html(sent, truth_label, is_truth_label) {
	truth_label = truth_label == undefined ? "" : truth_label;
	is_truth_label = is_truth_label == undefined ? false : is_truth_label;
	let truth_label_sentiment_class = "";
	if (is_truth_label && truth_label != sent) {
		console.log(truth_label);
		console.log(sent);
		truth_label_sentiment_class = "truth-label-sentiment";
		sent = truth_label;
	}
	return `<span class="badge badge-pill class-${sent} ${truth_label_sentiment_class}" style="line-height:1.5em;">${sent}</span>`;
}

function get_max_value(str_props, pretty) {
	pretty = pretty == undefined ? false : pretty;
	if (str_props == "NaN" || str_props == "Na" || str_props == undefined) {
		console.log(str_props);
		return (pretty) ? "-" : 0;
	}
	let max_val:number|string;
	if (typeof str_props == "object" && str_props.length == 3) {
		console.log("str_props", str_props);
		max_val = d3.max(str_props);
	} else {		
		max_val = Number(d3.max(str_props.slice(1,-1).replace(" ", "").split(",").map(el => Number(el))));
	}
	if (pretty) {
			max_val = (""+max_val*100).slice(0,4) + "%";
	}
	return max_val;
}

function tok_to_array(string) {
	if (string == undefined) {
		return [];
	}
	if (typeof string == "object") {
		if (string.tokens != undefined) {
			return string.tokens;
		}
		return string;
	}
	// return string.replaceAll("', '##", "").slice(2, -1).split(", '").map(el => el.slice(0, -1))	
	string = string.split("', '");
	string[0] = "[CLS]";
	string[string.length-1] = "[SEP]";
	return string;
}

function click_point(d: any) {
	
	$("#self-attention-heatmap svg").remove();
	document.getElementById("show-similar").disabled = false;
	document.getElementById("self-attention-collapse-btn").disabled = false;
	$("#similar-sents-display").css("opacity", 0.5);
	$("#similar-sents-ents-display").css("opacity", 0.5);	
	$("#select-splits").hide();
	
	console.log(d);

	let current_target;
	if (typeof d == "number" || d3.event == null) {
		if (window.search_result_data[d] != undefined) {
			d = window.search_result_data[d];
		} 
		console.log("d.id", d.id);
		current_target = document.getElementById(`${d.id}`);
		// current_target = d3.selectAll('circle')._groups[0][d.id];		
	} else {
		current_target = d3.event.currentTarget;
	}
	console.log(current_target);
	// console.log(window.d);
	const SideBar = d3.select("#point-data");
	const attention_interaction_group = d3.select("#self-attention-interaction");
	attention_interaction_group.style("opacity", 1);
	d3.select("#user-classification").style("display", "block");
	d3.select("#point_id_display").html(`#<span id='point_id'>${d.id}</span>`);
	
	let split_html = '<span> | <span href="#split" id="split-rule" onclick="split_select_sentence()" class="text-info">Split</span></span>';
	let sal_html = '<span> | <a href="#toggleGrads" id="saliency-show-selected-segment" onclick="toggle_grads()">Integrated Gradients</a></span>';
	let plain_sent_html = '<span> | <a href="#plainSent" id="show-plain-selected-sent" onclick="toggle_plain_sent()">Toggle Plain/Token</a></span>';
	let attention_sent_html = '<span> | <a href="#toggle-attention-select" id="toggle-attention-select" onclick="toggle_attention_select()">Toggle Attention</a></span>';
	SideBar
		.html(
			'<table style="width:100%">'
					// + '<tr>'
					// 		+ '<th>Class</th>'
					// 		+ '<td>'}${d.cluster}</td>`
					// + '</tr>'
					// + '<tr>'
					// 		+ '<th>Datapoint</th>'
					// 		+ `<td>(${d.x},<br>${d.y})</td>`
					// + '</tr>'
					// + `<input type="hidden" value="${d.id}" id="point_id"/>`
					+ '<tr>'
							+ '<th>Sentiment</th>'
							+ `<td id="model-sentiment"><div class="row">${get_sentiment_html(d.sentiment)} <i class="material-icons" data-toggle="modal" data-target="#userClassificationModal" id="confirm-user-classification-sentiment">edit</i></div></td>`
					+ '</tr>'
					+ '<tr>'
							+ '<th>Probability</th>'
							+ `<td>${get_max_value(d.props, true)}</td>`
					+ '</tr>'
					+ '<tr>'
							+ '<th>True label</th>'
							+ `<td>${get_sentiment_html(d.sentiment, d.truth_label, true)}</td>`
					+ '</tr>'
			+ '</table>'
			+ '<hr />'
			+ `<strong>Segment:</strong><span clas='right text-right'><a href='#selected_segement' onclick="toggle_ents();">Toggle Entities</a></span> ${sal_html} ${attention_sent_html} ${plain_sent_html} ${split_html}<br /> <hr>` 			
			+ `<span id="grad-info" class="text-muted"><i class="material-icons small">info_outline</i> 
				Color indicates importance for classification of predicted class, with <span class="color-grad-positive"></span> 
				corresponding to predicted class and <span class="color-grad-negative"></span> to the other classes.<br></span>` 
			+ `<span id="attention-info" class="text-muted"><i class="material-icons small">info_outline</i> 
				Color indicates influence of a token 'w' with <span class="color-attention-max"></span> 
				representing a high incluence.<br></span>`
			+ `<p id='selected-segment'>${d.segment}</p>`
			+ `<p id='selected-segment-tokens'>${tok_to_array(d.tokens).map(tok => `<span>${tok}</span> `).join(" ")} </p>`
			+ `<p id='selected-segment-ents'>Loading</p>`,
		)
	window.d = d;
	window.segment = d.segment;
	let rad = RADIUS;
	let select_rad = SELECT_RADIUS;
	if (window.zoom) {
		rad = ZOOM_RADIUS;
		select_rad += 5;
	}
	if (window.last_target != undefined) {
			d3.select(window.last_target)
				.attr("r", rad)
				.style("fill", window.last_color);
	}
	window.last_target = current_target
	window.last_color = get_color(d.sentiment)
	d3.select(current_target)
		.attr("r", select_rad)
		.style("fill", SELECT_COLOR).raise();
}

function get_mouse_events(data) {

	// TOOL-TIP & MOUSE EVENTS
	const Tooltip = d3.select(PLOT_ID)
		.append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("background-color", "white")
		.style("border", "solid")
		.style("border-width", "2px")
		.style("border-radius", "0px")
		.style("padding", "5px");

	// Three function that change the tooltip when user hover / move / leave a cell
	var mouseover = (d: any) => {
		// console.log(d);
		Tooltip
			.style("opacity", 1);
	}
	var mousemove = (d: any) => {
		Tooltip
			.html(
				'<table style="width:100%">'
						+ '<tr>'
								+ '<th>Datapoint</th>'
								+ `<td>(${Number(d.x).toFixed(2)}, ${Number(d.y).toFixed(2)})</td>`
						+ '</tr>'
						+ '<tr>'
								+ '<th>Sentiment</th>'
								+ `<td>${d.sentiment}</td>`
						+ '</tr>'
						// + '<tr>'
						// 		+ '<th>Propability</th>'
						// 		+ `<td>${get_max_value(d.props, true)}</td>`
						// + '</tr>'
				+ '</table>',
			)
			// .style("left", `${d3.event.pageX+90-width}px`)
			.style("top", `${d3.event.pageY-height}px`)
			.style("left", `${d3.event.pageX-70}px`)
			// .style("top", `${d3.event.pageY+70}px`)
			// .style('border-color', get_color(d.sentiment))
			.style('border-color', get_color(d.sentiment));
			// .style('border-color', get_color(d.cluster));
	}
	var mouseleave = () => {
		Tooltip.style("opacity", 0)
	}

	var click = click_point;

	return [
		mouseover,
		mousemove,
		mouseleave,
		click
	]
}


function add_labeled_record(sentiment: string, segment: string) {
	console.log("add_label");
	let data = new FormData();
	let json_string: string = JSON.stringify( {sentiment, segment});
	console.log(json_string);
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
