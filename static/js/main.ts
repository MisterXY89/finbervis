
// function click_point(point_id) {
// 	$(`#${id}`).click();
// }

function toggle_ents () {
	console.log("click");
	let seq_id = d3.select("#point_id").text();
	let url: string = `/get_entities?seq_id=${seq_id}`;
	console.log(url);
	fetch(url)
	.then(resp => resp.json())
	.then(json => {
		console.log(json);
		// let res = json.result;
		let ents_html = json.result;
		d3.select("#selected-segment-ents").html(ents_html);
		$("#selected-segment-ents").toggle();
		$("#selected-segment").toggle();
	});
}

function get_segment_html(seg) {
	// type="button" class="btn btn-secondary"
	return `<div title="${seg}">
  	${seg.slice(0,50)}...
	</div>`;
}

function prep_search_vis(res) {
	let html = "";
	// .slice(0,10)
	window.search_result_data = [];
	res.forEach((element, i) => {
		window.search_result_data.push(element);
		html += '<div class="card" style="width: 100%;">'
	  	+ '<div class="card-body">'
	    + `<h5 class="card-title">Result #${i+1}</h5>`
	    + `<p class="card-text">`
			+ `<strong>ID</strong><br>${element.id}<hr>`
			+ `<strong>Segment</strong><br>${get_segment_html(element.segment)}<br>`
			+ `<strong>Sentiment</strong><br>${get_sentiment_html(element.sentiment)}`
			+ '</p>'
			+  `<a href="#" class="btn btn-primary" onclick='click_point(${i});'>Select Point</a>`
	  	+ '</div>'
			+ '</div><br>';
	});
	return html;
}

function visualize_saliency(res, el) {
	let tokens = res.tokens;
	let scores = res.scores;
	let token_html = "<div class='sal-text'>";
	tokens.forEach((tok, i) => {
		let opacity = Math.abs(scores[i]);
		let token_grad_color = "158,100,229";
		if (scores[i] > 0) { // check what is what
			token_grad_color = "171,229,100";
		} 
		let color = `rgba(${token_grad_color}, ${opacity})`;
		token_html += `<span style="background-color: ${color};">${tok} </span>`;
	});
	token_html += "</div>";
	console.log(token_html);
	console.log(el.parentElement.parentElement.getElementsByTagName("div")[0]);
	el.parentElement.parentElement.getElementsByTagName("div")[0].innerHTML += token_html;
	
	let parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
	let sal_div = parent.getElementsByClassName("sal-text")[0];
	let plain_div = parent.getElementsByClassName("plain-text")[0];
	
	sal_div.style.display == "block";
	plain_div.style.display == "none";
	// toggle_sal_plain(el);	
	// return token_html;
}

function get_sal_div(el) {
	return el.parentElement.parentElement.getElementsByClassName("sal-text")[0];
}

function toggle_sal_plain(el) {
	let parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
	console.log(parent);
	let sal_div = parent.getElementsByClassName("sal-text")[0];
	let plain_div = parent.getElementsByClassName("plain-text")[0];
	
	if (sal_div.style.display == "block") {
		sal_div.style.display == "none";
		plain_div.style.display == "block";
	} else {
		sal_div.style.display == "block";
		plain_div.style.display == "none";
	}
}

function saliecy_is_computed(el) {	
	return el.parentElement.parentElement.getElementsByTagName("div")[0].getElementsByClassName("sal-text")[0] !== undefined;
}

function get_saliency_scores(el, seg_id) {
	if (saliecy_is_computed(el)) {
		console.log("SAL IS COMPUTED")
		toggle_sal_plain(el);
		return 1;
	}
	// console.log(el);
	let spinner = el.getElementsByClassName("saliency-calc-spinner")[0];
	let img = el.getElementsByTagName("img")[0];
	spinner.style.display = "block";
	img.style.display = "none";
	let url = `/get_scores?seg_id=${seg_id}`;
	fetch(url)
	.then(resp => resp.json())
	.then(json => {
		let res = json.result;
		img.style.display = "block";
		spinner.style.display = "none";
		visualize_saliency(res, el);
	});
	return 1;
}

document.addEventListener("DOMContentLoaded", () => {

	scatter_plot({});

	const test_sent = "Joseph Robinette Biden Jr. was sworn in as the 46th president of the United States."
	// "taking office at a moment of profound economic, health and political crises with a promise to seek unity after a tumultuous four years that tore at the fabric of American society.";
	console.log(test_sent);

	const spinner = d3.select("#spinning-overlay");
	const test_rule_button = d3.select("#test-rule");
	const test_rule_segment_field = d3.select("#test-rule-segment");
	const segment_attention_button = d3.select("#segment-attention");
	const explore_neighbours_button = d3.select("#explore-neighbours");
	const hide_heatmap_button = d3.select("#hide-heatmap");
	const layer_input = d3.select("#layer_input");
	const head_input = d3.select("#head_input");
	const layer_input_neighbours = d3.select("#layer_input_neighbours");
	const head_input_neighbours = d3.select("#head_input_neighbours");
	const attention_interaction_group = d3.select("#self-attention-interaction");
	const user_classification_select = d3.select("#sentiment-classes-user-classification");
	const confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");
	const similar_sents_display = d3.select("#similar-sents-display");
	const similar_sents_display_plain = d3.select("#similar_sents_display_plain");
	const show_similar_sents_button = d3.select("#show-similar");
	const toggle_ents_sim_sents_button = d3.select("#toggle_ents_sim_sents");
	const toggle_ents = d3.select("#toggle-ents");
	const search_button = d3.select("#searchButton");
	const search_input = d3.select("#searchInput");
	const search_results = d3.select("#search-results");
	const toggle_identical_words_sim_sents_button = d3.select("#toggle_identical_words_sim_sents_button");
	const split_rule_button = d3.select("#split-rule");


	test_rule_button.on("click", () => {
		attention_interaction_group.style("opacity", 1);
		spinner.style("display", "block");
		let segment = test_rule_segment_field.property("value");
		console.log(segment);
		let url: string = "/test_user_data"
										+ `?segment=${segment}`;
		fetch(url)
		.then(response => response.json())
		.then(json => {
			console.log(json);
			// add_datapoint(json);
			scatter_plot(json);
			spinner.style("display", "none");
			user_classification_select.style("display", "block");
		});

	});

	show_similar_sents_button.on("click", () => {
		let id = d3.select("#point_id").text();
		let url: string = `/get_similar_segments?seg_id=${id}&return_sents=True`;
		console.log(url);
		// TODO: disable button & add loading cirlcle next to it
		$("#sim-sent-spinner").toggle();
		document.getElementById("show-similar").disabled = true;
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			let res = json.result;
			// let plain_sents = res.map(el => el.segment);
			let sents_html = json.ent_html;
			let new_origin = json.origin_sent_ent_html;
			let plain_sents_html = "";
			let img_filename = "icons8-flächendiagramm-100.png";
			let spinner_html = `<div class="spinner-border text-secondary text-center saliency-calc-spinner" role="status">
				<span class="sr-only">Loading...</span>
			</div>`;
			let img_html = (seg_id) => `<a href="#saliency_calc" onclick="get_saliency_scores(this, ${seg_id});">${spinner_html}<img src="img/${img_filename}" width="45px" alt="Saliency calc"/></a><br>`;
			res.forEach((s) => {
				plain_sents_html+= `<div class="row"><div class="col-10"><div class="plain-text">${s.segment}</div></div><div class="col-2">${img_html(s.id)}${get_sentiment_html(s.sentiment)}</div></div><hr>`;
			});
			$("#toggle_ents_sim_sents").show();
			$("#toggle_identical_words_sim_sents_button").show();
			d3.select("#selected-segment-ents").html(new_origin);
			similar_sents_display.html(sents_html);
			similar_sents_display_plain.html(plain_sents_html);
			
			similar_sents_display.style("display", "none");
			similar_sents_display_plain.style("display", "block");
			
			$("#sim-sent-spinner").hide();
			document.getElementById("show-similar").disabled = false;
			
		});
	});

	toggle_ents_sim_sents_button.on("click", () => {
		$("#similar-sents-display").toggle();
		$("#similar_sents_display_plain").toggle();
	});

	toggle_identical_words_sim_sents_button.on("click", () => {
		let segment_select_display = window.segment.toLowerCase();
		let active_dispaly;
		if ($("#similar-sents-display").css("display") == "block") {
			active_dispaly = $("#similar-sents-display");
		} else {
			active_dispaly = $("#similar_sents_display_plain");
		}

		if (active_dispaly.html().includes("identical-token")) {
			console.log("EXISTING")
			// toggle & return
			console.log($(".identical-token").first().css("background-color"));
			let bg_color = $(".identical-token").first().css("background-color");
			if (bg_color != "rgba(0, 0, 0, 0)") {
				$(".identical-token").css("background-color", "transparent");
			} else {
				$(".identical-token").css("background-color", "yellow");
			}
			return 1;
		}

		let segment_select_tokens = segment_select_display.split(" ");
		let similiar_sents = active_dispaly.html().split("<hr>")

		let check = (sent) => {
		  return sent.split(" ").map(token => {
				let token_low = token.toLowerCase();
				if (segment_select_tokens.includes(token_low)) {
					let class_name = "identical-token";
					if (stop_words.includes(token_low)) {
							class_name += ` ${class_name}-stopword`;
					}
					return `<span class='${class_name}'>${token}</span>`;
				}
				return token;
			}).join(" ");
		}

		similiar_sents = similiar_sents.map(sent => check(sent));
		active_dispaly.html(similiar_sents.join("<hr>"))

	});


	segment_attention_button.on("click", () => {
		// show heatmap for selected node
		let layer = Number(layer_input.property("value"))-1;
		let head = Number(head_input.property("value"))-1;
		create_heatmap(window.segment, layer, head);
	});

	explore_neighbours_button.on("click", () => {
		let layer = Number(layer_input_neighbours.property("value"))-1;
		let head = Number(head_input_neighbours.property("value"))-1;
		create_heatmap(window.segment, layer, head);
	});

	hide_heatmap_button.on("click", () => {
		d3.select("#attention-heatmap").select("svg").remove();
	});

	confirm_user_classification_sentiment_button.on("click", evt => {
		console.log("clicked");
		let correct_sentiment = user_classification_select.property("value");
		let model_sentiment = d3.select("#model-sentiment").text();
		let selected_segement = d3.select("#selected-segment").text();
		console.log(correct_sentiment);
		console.log(model_sentiment);
		if (window.added_segment == selected_segement) {
			alert("You already added this segment.");
		}
		if (correct_sentiment == model_sentiment) {
			alert("Your choosen sentiment and the predicted sentiment are identical.")
		}
		if (correct_sentiment != model_sentiment && window.added_segment != selected_segement) {
			add_labeled_record(correct_sentiment, selected_segement);
		}
	});

	search_button.on("click", () => {
		let search_q = search_input.property("value");
		let params = "";
		if (search_q[0] == "#") {
			params = `?seg_id=${search_q.slice(1)}` : "";
		} else {
			params = `?q=${search_q}`;
		}
		let url = `/search${params}`;
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			let res = json.result;
			console.log(res);
			$("#search_results-wrapper").show();
			search_results.html(prep_search_vis(res));
			d3.select("#total-results").text(res.length);
		});
	});

	split_rule_button.on("click", () => {
		let seg_id = Number(d3.select("#point_id").text());
		let url = `/split_rule?seg_id=${seg_id}`;
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			let split_points = json.result;
			console.log(split_points);
		});
	});

});
