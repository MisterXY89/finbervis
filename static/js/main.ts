
// function click_point(point_id) {
// 	$(`#${id}`).click();
// }

function edit_sentiment() {
	let correct_sentiment = d3.select("#sentiment-classes-user-classification").property("value");
	let model_sentiment = d3.select("#model-sentiment").text();
	let selected_segement = d3.select("#selected-segment").text();
		
	if (window.added_segment == selected_segement) {
		alert("You already added this segment.");
	}
	if (correct_sentiment == model_sentiment) {
		alert("Your choosen sentiment and the predicted sentiment are identical.")
	}
	if (correct_sentiment != model_sentiment && window.added_segment != selected_segement) {
		add_labeled_record(correct_sentiment, selected_segement);
	}
}

function toggle_attention_select() {
	
	$("#selected-segment").hide();
	$("#selected-segment-ents").hide();
	$("#selected-segment-tokens").show();
	
	let sent = document.getElementById("selected-segment-tokens");
	// let sent_attention = to_array(window.d["mean_attention"]);
	let sent_attention = to_array(window.d["deRoseAttention"]);		
	Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
		
		if (span.style.borderTop == "" || span.style.borderTop == undefined || span.style.borderTop == "unset") {
			
			$("#attention-info").show();
			
			let max_val = d3.max(sent_attention);
			let min_val = d3.min(sent_attention);
			
			var color = d3.scaleLinear()
				.domain([min_val, max_val])
				.range(["#d9d9d9", "#ff5921"]); 
				
			// var color = d3.scaleLinear()
			// 	.domain([0, 1])
			// 	.range(["#ffd6a1", "#e35f00"]);   // output for opacity between .3 and 1 %
				// white edf6f9
				// ffb600 - warm yellow
				// ff4800 - warm orange			
			let color_val = color(sent_attention[span_i]);
			span.style.borderTop = `3px ${color_val} solid`;
		} else {
			span.style.borderTop = "unset";
			$("#attention-info").hide();
		}
				
			
	});
	
}

function split_select_sentence() {
	
	if ($("#select-splits").is(":visible")) {
		
		$("#select-splits").hide();
		
	} else {
		
		$("#select-splits").show();
		
		if ($("#splits-spinner").is(":visible")) {
				
			let seg_id = Number(d3.select("#point_id").text());
			let url = `/split_rule?seg_id=${seg_id}`;
			fetch(url)
			.then(resp => resp.json())
			.then(json => {
				let split_points = json.result;
				console.log(split_points);
				if (!split_points) {
					toast_msg("No splits found!")
					$("#select-splits").hide();
				}	else {
					let split_html = "<div> <strong>Splits</strong><br><small>Splits can be toggled by clicking again on 'Split'</small><hr>";
					split_points.forEach(el => {
						split_html += `<div class="row">
							<div class="col-10">${el.segment}</div>
							<div class='col-2'>
								<span class='text-muted'>ID: #${el.id}</span> <br>
								${get_sentiment_html(el.sentiment)} <br>
								<span class='text-muted'>${get_max_value(el.props, true)}</span> <br>								
							</div>
						</div><hr><br>`;
						// ${get_sentiment_html(el.truth_label)} <br>
					});
					split_html += "</div></hr>";
					$("#select-splits").html(split_html);
					$("#select-splits").show();
				}
			});
			
		}		
		
	}
}

function toggle_ents() {
	
	$("#grad-info").hide();
	$("#attention-info").hide();	
	
	if ($("#selected-segment-ents").text() != "Loading" && !$("#selected-segment-ents").is(":visible")) {
		$("#selected-segment-ents").show();
		$("#selected-segment").hide();
		$("#selected-segment-tokens").hide();
		console.log("not visible but calculated")
		return 1;
	} else if ($("#selected-segment-ents").is(":visible")) {
		$("#selected-segment-ents").hide();
		$("#selected-segment-tokens").show();
		
	} else {
		let seq_id = d3.select("#point_id").text();
		let url: string = `/get_entities?seq_id=${seq_id}`;
		fetch(url)
		.then(resp => resp.json())
		.then(json => {
			// let res = json.result;
			let ents_html = json.result;
			if (ents_html.indexOf("<mark") == -1) {
				toast_msg("No entities found");
			}
			d3.select("#selected-segment-ents").html(ents_html);
			$("#selected-segment").hide();
			$("#selected-segment-tokens").hide();
			$("#selected-segment-ents").show();
			// $("#selected-segment-ents").toggle();
			// $("#selected-segment").toggle();
		});
	}
		
}

function get_segment_html(seg) {
	// type="button" class="btn btn-secondary"
	return `<div class="search-seg" title="${seg}">
  	${seg.slice(0,120)}...
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
				+ `<div class="card-title row">`
					+ `<div class="col-8">`				
						// + `<h5>Result #${i+1}</h5>`
							+ `<strong>Segment</strong> <span class="text-muted">#${element.id}</span><br>`
					+ `</div>`
					+ `<div class="col-4">`
						+ `<a href="#" class="btn btn-primary" onclick='click_point(${i});'>Select</a>`
					+ `</div>`
				+ `</div>`
	    	+ `<p class="card-text">`
					// + `<strong>ID</strong> ${element.id}<hr>`
					+ `${get_segment_html(element.segment)}<br>`
					+ `<div class="row">`
						+ `<div class="col-8">`
							+ `<strong>Sentiment</strong>`
						+ `</div>`
						+ `<div class="col-4">`			
							+ `${get_sentiment_html(element.sentiment)}`
						+ `</div>`
					+ `</div>`
				+ '</p>'
	  	+ '</div>'
		+ '</div><br>';
	});
	return html;
}

// todo rem
function visualize_saliency(res, el) {
	let tokens = res.tokens;
	let scores = res.scores;
	let label = res.sentiment;
	let token_html = "<div class='sal-text'>";
	tokens.forEach((tok, i) => {
		let opacity = Math.abs(scores[i]);
		// todo: scale change
		let token_grad_color = "58,100,229"; // negative values
		if (scores[i] > 0) {			
			token_grad_color = "221,89,100";
		}
		let color = `rgba(${token_grad_color}, ${opacity})`;
		token_html += `<span style="background-color: ${color};">${tok} </span>`;
	});
	token_html += "</div>";
	// console.log(token_html);
	// console.log(el.parentElement.parentElement.getElementsByTagName("div")[0]);
	el.parentElement.parentElement.getElementsByTagName("div")[0].innerHTML += token_html;
	
	let parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
	let sal_div = parent.getElementsByClassName("sal-text")[0];
	let plain_div = parent.getElementsByClassName("plain-text")[0];
	
	sal_div.style.display == "block";
	plain_div.style.display == "none";
	// toggle_sal_plain(el);	
	// return token_html;
}

function toggle_sal_plain(el) {
	let parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
	// console.log(parent);
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


function get_saliency_scores(el, seg_id) {
	// console.log(el);
	let spinner = el.getElementsByClassName("saliency-calc-spinner")[0];
	// let graph_icon = el.getElementById("graph_icon")[0];
	spinner.style.display = "block";
	// graph_icon.style.display = "none";
	let url = `/get_scores?seg_id=${seg_id}`;
	fetch(url)
	.then(resp => resp.json())
	.then(json => {
		let res = json.result;
		console.log(res);
		// graph_icon.style.display = "block";
		spinner.style.display = "none";
		// visualize_saliency(res, el);	
	});
	return 1;
}

function get_mean_attention_html(tokens, attention, sent) {
	// tokens = ("[CLS]" + sent).split(" ");
	let att_html = "";
	tokens.forEach((tok, i) => {
		tok = tok.replace("##", "");
		// let color_val = attention[i];
		// border-top: 3px and map value to color
		var color = d3.scaleLinear()
      .domain([0, 0.9])
      .range(["#ddd", "#540012"]);   // output for opacity between .3 and 1 %
			// white edf6f9
			// ffb600 - warm yellow
			// ff4800 - warm orange
		// console.log(attention[i]);
		let color_val = color(attention[i]);
		att_html += `<span style="border-top: 3px ${color_val} solid;">${tok} </span>`;

	});
	return att_html;
}

function search_data(search_q) {
	let params = "";	
	if (search_q[0] == "#") {
		params = `?seg_id=${search_q.slice(1)}` : "";
	} else {
		params = `?q=${search_q}`;
	}
	let url = `/search${params}`;
	
	
	fetch(url)
	.then(resp => {
		if (search_q == ")()UJIH=all") {
			return resp.text();
		} 
		return resp.json();
	})
	.then(json => {
		console.log(json);
		$("#search_results-wrapper").show();
		if (search_q == "OJOJOJOO =all") {
			alert("=all");
			$("#search-header").html("All Segments");
			$("#search-results").html(json);
			$("#search-results").show();
		} else {
			let res = json.result;
			// console.log(res);
			d3.select("#search-results").html(prep_search_vis(res));
			d3.select("#total-results").text(res.length);
		}			
	});
}


function toggle_grads() {
	
	$("#selected-segment").hide();
	$("#selected-segment-ents").hide();	
		
	let sent = document.getElementById("selected-segment-tokens");
	Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
		let sal_scores = window.d["saliency_score"];
		sal_scores = to_array(sal_scores);
		let opacity = Math.abs(sal_scores[span_i]);
		let token_grad_color = "252,186,3"; // negative values
		if (sal_scores[span_i] > 0) {			
			token_grad_color = "221,89,100";
		}
		let color = `rgba(${token_grad_color}, ${opacity})`;
		
		// if (span.classList.contains("identical-token")) {
		// 	span.classList.remove("identical-token");
		// }
		
		// if (span.classList.contains("identical-token-stopword")) {
		// 	span.classList.remove("identical-token-stopword");
		// }
				
		if (span.classList.contains("saliency-active") && $("#selected-segment-tokens").is(":visible")) {
			span.style.backgroundColor = "transparent";
			span.classList.remove("saliency-active");
			$("#grad-info").hide();
		} else {
			$("#grad-info").show();
			span.style.backgroundColor = color;		
			span.classList.add("saliency-active");			
		}		
			
	});
	$("#selected-segment-tokens").show();
	// sent += '<span id="info-grad"><br /> <i class="material-icons">info_outline</i> Red indicated importance for predicted label</span>';
}

function toggle_plain_sent() {
	if ($("#selected-segment").is(':visible')) {		
		$("#selected-segment-ents").hide();
		$("#selected-segment").hide();
		$("#selected-segment-tokens").show();
	} else {
		$("#selected-segment-tokens").hide();
		$("#selected-segment-ents").hide();
		$("#selected-segment").show();
		$("#info-grad").hide();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	
	load_data("data_copy.csv", "drop_8_data.csv").then(data => {
		window.data1 = data.data1;
		window.data2 = data.data2;
		// load_data("data_copy.csv", false).then(data => {		
		// -------------------------------
		scatter_plot(data.data1, false, DATA_FILE_ONE, "#projection_model_1");
		scatter_plot(data.data2, false, DATA_FILE_TWO, "#projection_model_2");	
		let matrix_vis_1 = new MatrixVis(data.data1, "#matrix_vis_1", "MatrixVis 1");
		window.matrix_vis_1 = matrix_vis_1;
		matrix_vis_1.draw();
		
		let matrix_vis_2 = new MatrixVis(data.data2, "#matrix_vis_2", "MatrixVis 2");
		window.matrix_vis_2 = matrix_vis_2;
		matrix_vis_2.draw();
	})
	
	document.getElementById("show-similar").disabled = true;
	document.getElementById("self-attention-collapse-btn").disabled = true;		
		
	// search_data("=all");
	$('.toast').toast({
		delay: 12500
	});
		
	// $('#toast').toast('hide');	

	// const test_sent = "Joseph Robinette Biden Jr. was sworn in as the 46th president of the United States."
	// // "taking office at a moment of profound economic, health and political crises with a promise to seek unity after a tumultuous four years that tore at the fabric of American society.";
	// console.log(test_sent);

	const spinner = d3.select("#spinning-overlay");
	const test_rule_button = d3.select("#test-rule");
	const test_rule_segment_field = d3.select("#segmentInput");
	const segment_attention_button = d3.select("#segment-attention");
	const explore_neighbours_button = d3.select("#explore-neighbours");
	const hide_heatmap_button = d3.select("#hide-heatmap");
	const layer_input = d3.select("#layer_input");
	const head_input = d3.select("#head_input");
	const layer_input_neighbours = d3.select("#layer_input_neighbours");
	const head_input_neighbours = d3.select("#head_input_neighbours");
	const attention_interaction_group = d3.select("#self-attention-interaction");
	const confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");
	const similar_sents_display = d3.select("#similar-sents-display");
	const similar_sents_display_plain = d3.select("#similar_sents_display_plain");
	const show_similar_sents_button = d3.select("#show-similar");
	const toggle_ents_sim_sents_button = d3.select("#toggle_ents_sim_sents");
	const toggle_ents = d3.select("#toggle-ents");
	const search_button = d3.select("#searchButton");
	const search_input = d3.select("#searchInput");
	const toggle_identical_words_sim_sents_button = d3.select("#toggle_identical_words_sim_sents_button");
	const split_rule_button = d3.select("#split-rule");
	const toggle_mean_attention_button = d3.select("#toggle_mean_attention");
	const similar_sents_display_attention = d3.select("#similar_sents_display_attention");
	const toggle_gradients_button = d3.select("#toggle_gradients");
	const cluster_button = d3.select("#cluster_button");
	const epsilon_input = d3.select("#epsilonInput");
	
	const create_one_hot = d3.select("#create_one_hot");
	const threshold_input = d3.select("#saliencyThreshold");	
	
	const matrix_sort_select = d3.select("#matrixSort");
	matrix_sort_select.on("change", (evt, d) => {
		console.log(evt, d)
	});
	
	cluster_button.on("click", () => {
		// let file = data_filename_1;
		let epsilon = Number(epsilon_input.property("value"));
		let threshold = Number(threshold_input.property("value"));
		let min_samples = 2;
			
		let url_1 = `/get_clusters?file=${data_filename_1}&epsilon=${epsilon}&min_samples=${min_samples}&threshold=${threshold}`;
		fetch(url_1)
		.then(resp => resp.json())
		.then(obj => {
			// window.stats = obj.result;
			load_data(data_filename_1, false).then(data => {
				window.data1 = data.data1;
				document.getElementById("matrix_vis_1").innerHTML = "";
				let matrix_vis_1 = new MatrixVis(data.data1, "#matrix_vis_1", "MatrixVis 1");
				matrix_vis_1.draw();					
			})
		})
		
		let url_2 = `/get_clusters?file=${data_filename_2}&epsilon=${epsilon}&min_samples=${min_samples}&threshold=${threshold}`;
		fetch(url_2)
		.then(resp => resp.json())
		.then(obj => {
			load_data(data_filename_2, false).then(data => {
				window.data2 = data.data1;
				document.getElementById("matrix_vis_2").innerHTML = "";
				let matrix_vis_2 = new MatrixVis(data.data1, "#matrix_vis_2", "MatrixVis 2");
				matrix_vis_2.draw();					
			})
		})
	});


	test_rule_button.on("click", () => {
		attention_interaction_group.style("opacity", 1);
		spinner.style("display", "block");
		let segment = test_rule_segment_field.property("value");
		// console.log(segment);
		let url: string = "/test_user_data"
										+ `?segment=${segment}`;
		fetch(url)
		.then(response => response.json())
		.then(json => {	
			console.log(json);
			// add_datapoint(json);
			spinner.style("display", "none");	
			scatter_plot(json, true);
			// click_point(json);
			// user_classification_select.style("display", "block");
		});

	});
	
	toggle_gradients_button.on("click", () => {
		
		$("#show-simmilar").show();
				
		$("#similar-sents-ents-display").hide();
		
		Array.from(document.getElementsByClassName("sim-sentence")).forEach((sent, sent_i) => {
			Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
				let sal_scores = window.sim_res[sent_i]["saliency_score"];
				sal_scores = to_array(sal_scores);
				let opacity = Math.abs(sal_scores[span_i]);
				let token_grad_color = "252,186,3"; // negative values
				if (sal_scores[span_i] > 0) {			
					token_grad_color = "221,89,100";
				}
				let color = `rgba(${token_grad_color}, ${opacity})`;
				
				if (span.classList.contains("identical-token")) {
					span.classList.remove("identical-token");
				}
				
				if (span.classList.contains("identical-token-stopword")) {
					span.classList.remove("identical-token-stopword");
				}
				
				if (span.classList.contains("saliency-active") && $("#similar-sents-display").is(":visible")) {
					span.style.backgroundColor = "transparent";
					span.classList.remove("saliency-active");
					$("#grad-info").hide();
				} else {					
					span.style.backgroundColor = color;		
					span.classList.add("saliency-active");
					$("#grad-info").show();
				}
			});
		});
		$("#similar-sents-display").show();
	});


	show_similar_sents_button.on("click", () => {
		
		$("#show-simmilar").show();
		
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
			res = res.map(el => {
				return {
					id: el.id, 
					mean_attention: el.mean_attention, 
					deRoseAttention: el.deRoseAttention,
					props: el.props,
					saliency_score: el.saliency_score,
					segment: el.segment,
					sentiment: el.sentiment,
					tokens: tok_to_array(el.tokens),
					entities: el.entities,
					truth_label: el.truth_label
				}
			});
			
			window.sim_res = res;
			// console.log(res);
			
			if (!res.length == 0) {
				let ents_html = json.ent_html;
				// let ents_json = extract_ents_json(ents_html, res);
				// console.log(ents_json);
				
				let new_origin = json.origin_sent_ent_html;			
				let sim_sent_html = "";
				
				res.forEach(el => {
					console.log(el);
					sim_sent_html += `<div class='row'>
					<div class='sim-sentence col-10'> 
						${el.tokens.map(tok => `<span>${tok}</span> `).join(" ")} 
					</div>
					<div class='col-2'>
						<span class='text-muted'>ID: #${el.id}</span> <br>
						${get_sentiment_html(el.sentiment)} <br>
						<span class='text-muted'>${get_max_value(el.props, true)}</span> <br>
						${get_sentiment_html(el.truth_label)} <br>
					</div>
				</div>
				<hr/>`;
				});
											
				
				$("#similar-sents-display").html(sim_sent_html);
				$("#selected-segment-ents").html(new_origin);
				$("#similar-sents-ents-display").html(ents_html);
				
				$("#toggle_ents_sim_sents").show();
				$("#toggle_mean_attention").show();
				$("#toggle_identical_words_sim_sents_button").show();
				$("#toggle_gradients").show();
								
			} else {
				$("#similar-sents-display").html("No similiar sentences below the similiarity threshold (10) could be found.");
			}
			
			$("#similar-sents-display").css("opacity", 1);
			$("#similar-sents-ents-display").css("opacity", 1);
			$("#sim-sent-spinner").toggle();
			document.getElementById("show-similar").disabled = false;
			
		});
	});

	toggle_ents_sim_sents_button.on("click", () => {
		
		$("#show-simmilar").show();
		$("#grad-info").hide();
		$("#attention-info").hide();
		$("#similar-sents-display").toggle();
		$("#similar-sents-ents-display").toggle();
		

	});
	
	toggle_mean_attention_button.on("click", () => {
		
		$("#show-simmilar").show();
		
		$("#similar-sents-display").show();
		$("#similar-sents-ents-display").hide();
		
		Array.from(document.getElementsByClassName("sim-sentence")).forEach((sent, sent_i) => {
			let deRose_attention = window.sim_res[sent_i]["deRoseAttention"];
			deRose_attention = to_array(deRose_attention);
			let max_val = d3.max(deRose_attention);
			let min_val = d3.min(deRose_attention);
			// let mean_attention = window.sim_res[sent_i]["mean_attention"];			
			Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
				// console.log(deRose_attention[span_i]);
				// var scale = d3.scale.linear().domain([0, max]).range([0, 100]);
				var color = d3.scaleLinear()
					.domain([min_val, max_val])
					.range(["#d9d9d9", "#ff5921"]);
				
				let color_val = color(deRose_attention[span_i]);
				// console.log(color_val);
				// console.log(color_val);
				if (span.style.borderTop == "none" || span.style.borderTop == "") {
					$("#attention-info").show();
					span.style.borderTop = `3px solid ${color_val}`;					
				} else {
					span.style.borderTop = "none";
					$("#attention-info").hide();
				}
				
			});
		});
	});
	
	toggle_identical_words_sim_sents_button.on("click", () => {
		
		$("#show-simmilar").show();
		
		// let segment_select_display = window.tokens.toLowerCase();
		let segment_select_tokens = tok_to_array(window.d.tokens).slice(1, -1);
		
		Array.from(document.getElementsByClassName("sim-sentence")).forEach((sent, sent_i) => {
			Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
				let token_low = span.textContent;
				if (span.backgroundColor != "") {						
					span.style.backgroundColor = "";
					span.classList.remove("saliency-active");
				}
				if (segment_select_tokens.includes(token_low)) {
					let class_name = "identical-token";					
					if (stop_words.includes(token_low)) {
							class_name += ` ${class_name}-stopword`;
					}
					if (span.classList.contains("identical-token")) {
						span.classList.remove("identical-token");
						if (span.classList.contains("identical-token-stopword")) {
							span.classList.remove("identical-token-stopword");
						}
					} else {
						class_name.split(" ").forEach(n => span.classList.add(n));
					}
				}
			});
		});
		

	});
	
	
	$("#toggle-ente").on("click", () => {
		
		$("#show-simmilar").show();
		
		// let segment_select_display = window.tokens.toLowerCase();
		let segment_select_tokens = tok_to_array(window.d.tokens).slice(1, -1);
		
		Array.from(document.getElementsByClassName("sim-sentence")).forEach((sent, sent_i) => {
			let index = 0;
			let element = window.sim_res[sent_i];
			let ents = element["entities"];
			Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
				
				let el_entity = ents[span_i];
				// console.log(el_entity);
				// let ent_type = el_entity
				
				if (span.backgroundColor != "") {
					span.style.backgroundColor = "";
					span.classList.remove("saliency-active");
				}
				
				
				if (span.classList.contains("saliency-active")) {
					span.style.backgroundColor = "transparent";
					span.classList.remove("entity");
					span.classList.remove(`entity entity-${ent_type}`);
				} else {
					span.classList.remove("entity");
				}
				
			});
		});

	});	


	segment_attention_button.on("click", () => {
		// show heatmap for selected node
		let layer = Number(layer_input.property("value"))-1;
		let head = Number(head_input.property("value"))-1;
		create_heatmap(window.segment, layer, head, "#self-attention-heatmap");
	});

	explore_neighbours_button.on("click", () => {
		let layer = Number(layer_input_neighbours.property("value"))-1;
		let head = Number(head_input_neighbours.property("value"))-1;
		create_heatmap(window.segment, layer, head, "#self-attention-heatmap");
	});

	hide_heatmap_button.on("click", () => {
		d3.select("#attention-heatmap").select("svg").remove();
	});

	confirm_user_classification_sentiment_button.on("click", evt => {
		console.log("clicked");
		edit_sentiment();
	});

	search_button.on("click", () => {
		let search_q = search_input.property("value");		
		search_data(search_q);
	});

	split_rule_button.on("click", () => {
		
		// old split rule 
	});

});
