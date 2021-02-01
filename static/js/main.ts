

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

	test_rule_button.on("click", () => {
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
		});

	});


	segment_attention_button.on("click", () => {
		// show heatmap for selected node
		create_heatmap(window.segment, 11, 11);
	});

	explore_neighbours_button.on("click", () => {
		// let segment = test_rule_segment_field.property("value");
		// create_heatmap(window.segment, 11, 11);
	});

	hide_heatmap_button.on("click", () => {
		d3.select("#attention-heatmap").select("svg").remove();
	});


});
