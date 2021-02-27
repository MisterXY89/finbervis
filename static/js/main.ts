
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
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			// let res = json.result;
			let plain_sents = json.result;
			let sents_html = json.ent_html;
			let new_origin = json.origin_sent_ent_html;
			let plain_sents_html = "";
			plain_sents.forEach((s:string) => plain_sents_html+= `${s}<hr>`);
			console.log(plain_sents_html);
			$("#toggle_ents_sim_sents").show();
			d3.select("#selected-segment-ents").html(new_origin);
			similar_sents_display.html(sents_html);
			similar_sents_display_plain.html(plain_sents_html);
		});
	});

	toggle_ents_sim_sents_button.on("click", () => {
		$("#similar-sents-display").toggle();
		$("#similar_sents_display_plain").toggle();
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
			console.log(json.result);
		});
	});

});
