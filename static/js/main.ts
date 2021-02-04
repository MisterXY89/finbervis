

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
	const user_classification_select = d3.select("#user-classification");
	const confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");

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
		console.log(correct_sentiment);
		console.log(model_sentiment);
		if (correct_sentiment != model_sentiment) {
			let datapoint_id = "";
			// add_new_sentiment(correct_sentiment, datapoint_id);
		}
	});


});
