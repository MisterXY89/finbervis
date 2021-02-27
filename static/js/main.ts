

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
	const show_similar_sents_button = d3.select("#show-similar");
	// const selected_segement_field = d3.select("#selected-segment");
	const prop_slider = d3.select("#prop-slider").node();
	const prop_slider_output = d3.select('#prop-slider-output').node();
	prop_slider_output.innerHTML = prop_slider.value;

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
		let id = d3.select("#point_id").property("value");
		let url: string = `/get_similar_segments?seg_id=${id}&return_sents=True`;
		console.log(url);
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			console.log(json);
			// let res = json.result;
			let sents_html = json.ent_html;
			let new_origin = json.origin_sent_ent_html;
			console.log(new_origin);
			console.log(d3.select("#selected-segment"));
			d3.select("#selected-segment").html(new_origin);
			similar_sents_display.html(sents_html);
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

	prop_slider.oninput = function() {
		let slider_val = this.value;
    prop_slider_output.innerHTML = slider_val;
		// console.log(this.value);
		// let all_els = document.getElementsByTagName("circle");
		// console.log(all_els):
    // let all_ids = Array.from(all_els).map(c => c.id);
		d3.selectAll("circle").transition()
			 .filter(function() {
				 // console.log(Number(this.style.opacity));
				 return Number(this.style.opacity) <= slider_val;
			 })
			 .duration(200)
			 .style("opacity", 0.2);

		 // d3.selectAll("circle").transition()
 			//  .filter(function() {
 			// 	 // console.log(Number(this.style.opacity));
 			// 	 return Number(this.style.opacity) > slider_val;
 			//  })
 			//  .duration(50)
 			//  .style("opacity", 1);

	}


});
