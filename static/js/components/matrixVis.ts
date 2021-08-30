
class MatrixVis {
	
	constructor(data, div_id, name) {
		this.POS_TAGS = ['ADJ', 'ADV', 'INTJ', 'NOUN', 'PROPN', 'VERB', 'ADP', 'AUX', 'CONJ', 'DET', 'NUM', 'PART', 'PRON', 'SCONJ', 'PUNCT', 'SYM', 'X'];
		this.pos_classes_dict = {
		    "open": ["ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB"],
		    "closed": ["ADP", "AUX","CONJ","DET","NUM","PART","PRON","SCONJ"],
		    "other": ["PUNCT", "SYM", "X"]
		};
		
		this.data = data;
		this.div_id = div_id;
		this.one_hot_patterns = {};
		
		this.matrix = this.prep_data_for_vis();
		this.nodes = this.make_nodes();
		console.log("nodes: ", this.nodes);
		
		this.myGroups = this.POS_TAGS; // x
		this.myVars = Object.keys(this.one_hot_patterns);
		
		this.name = name;
		this.margin = {
			top: 80,
			right: 80,
			bottom: 0,
			left: 100
		};
		this.width = 600;
    this.height = this.nodes.length * 15;
		
		this.y = d3.scaleBand()
		  .range([ this.height, 0 ])
		  .domain(this.myVars)
		  .padding(0.3);
			
		this.x = d3.scaleBand()
		  .range([ 0, this.width ])
		  .domain(this.myGroups)
		  .padding(0.1);
					
		this.stats = this.compute_stats();
		console.log("stats", this.stats);
		this.cluster_sort = false;
	}
	
	compute_stats() {
		let no_pattern_count = this.one_hot_patterns["00000000000000000"].elements.length;
		let pattern_idx = Object.keys(this.one_hot_patterns).filter(key => key != "00000000000000000").map(key => this.one_hot_patterns[key].elements).flat();
		let pattern_found_count = pattern_idx.length;
		let wrongly_classified = pattern_idx.filter(i => this.data[i].truth_label != this.data[i].sentiment).length;
		let props = pattern_idx.map(i => {
			return {
				type: this.data[i].sentiment,
				value: d3.max(this.data[i].props)
			}			
		});
		let distr_pred_classes_list = pattern_idx.map(i => this.data[i].sentiment);
		let distr_pred_classes = {"positive": 0, "neutral": 0, "negative": 0};
		distr_pred_classes_list.forEach(el => distr_pred_classes[el] ++);
		// let saliency_scores = pattern_idx.map(i => this.data[i].saliency_score);
		let pattern_amount = Object.keys(this.one_hot_patterns).length -1;		
		let clusters_found = pattern_idx.map(i => this.data[i].one_hot_cluster).reduce(function (acc, curr) {
		  return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
		}, {});
		// console.log("cluster-found:", clusters_found)
		
		let stats_html = `<td>${Object.keys(clusters_found).length}</td>`
					+	`<td>${pattern_found_count}</td>`
					+ `<td>${no_pattern_count}</td>`
					+ `<td>${wrongly_classified}</td>`;
		
		let model_num = this.div_id.slice(-1);
		if (document.getElementById(`stats-table-row-model-${model_num}`) != undefined) {
			document.getElementById(`stats-table-row-model-${model_num}`).innerHTML = stats_html;
		}
		
		if (document.getElementById(`distribution_plot_${model_num}`) != undefined) {
			document.getElementById(`distribution_plot_${model_num}`).innerHTML = "";			
		}
		let distribution_plot = new DistributionPlot(props, `#distribution_plot_${this.div_id.slice(-1)}`, "distribution over predicted sentiments propabilities", model_num);		
		distribution_plot.draw();
		return {
			no_pattern_count,
			pattern_found_count,
			wrongly_classified,
			pattern_amount,
			props,
			// saliency_scores,
			distr_pred_classes
		}
	}
	
	make_nodes() {
		let nodes = [];
		// console.log(this.one_hot_patterns);
		Object.keys(this.one_hot_patterns).forEach(key => {
			if (key.length == 17) {				
				nodes.push({
					pattern: key,
					count: this.one_hot_patterns[key].elements.length,
				})
				// Object.keys(this.one_hot_patterns[key]).forEach(pi => {
				// 	console.log(pi);
				// 	this.one_hot_patterns[key].count = this.one_hot_patterns[key][pi].length;
				// });
			}
		});
		return nodes;
	}
	
	prep_data_for_vis(data) {
		let matrix = [];
		let vis_index = 0;
		this.data.forEach((row, row_i) => {
			// console.log(row);			
			let str_one_hot_pattern = row.one_hot.join("");
			if (str_one_hot_pattern.length == 17) {
				if (!this.one_hot_patterns.hasOwnProperty(str_one_hot_pattern)) {
					let row_matrix = [];
					row.one_hot.forEach((el, one_hot_i) => {
						// x: one_hot_i,
						// y: vis_index,
						row_matrix.push({							
							x: this.POS_TAGS[one_hot_i],
							y: str_one_hot_pattern,
							z: el,
							c: row.one_hot_cluster
							// pattern: str_one_hot_pattern,
						})
					});
					matrix.push(row_matrix);
					// vis_index ++;
					this.one_hot_patterns[str_one_hot_pattern] = {
						elements: [],
					};
				}
				this.one_hot_patterns[str_one_hot_pattern].elements.push(row_i);			
			}			
		});
		return matrix;		
	}  
	
	compute_stats_for_pixel_vis(data, pattern) {
		// let no_pattern_count = this.one_hot_patterns["00000000000000000"].elements.length;
		let pattern_idx = this.one_hot_patterns[pattern].elements;
		let pattern_found_count = pattern_idx.length;
		let wrongly_classified = pattern_idx.filter(i => this.data[i].truth_label != this.data[i].sentiment).length;
		let props = pattern_idx.map(i => {
			return {
				type: this.data[i].sentiment,
				value: d3.max(this.data[i].props)
			}			
		});
		let clusters_found = pattern_idx.map(i => this.data[i].one_hot_cluster).reduce(function (acc, curr) {
		  return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
		}, {});
		
		let stats_html = `<td>${Object.keys(clusters_found).length}</td>`
					+	`<td>${pattern_found_count}</td>`
					+ `<td>-</td>`
					+ `<td>${wrongly_classified}</td>`;
		
		if (document.getElementById(`stats-table-row-pixel-vis`) != undefined) {
			document.getElementById(`stats-table-row-pixel-vis`).innerHTML = stats_html;
		}
		
		// distribution_plot_pixel_vis
		// pred-sent-distr-abs-pixel-vis
		// stats-table-row-pixel-vis
		if (document.getElementById(`distribution_plot_pixel_vis`) != undefined) {
			document.getElementById(`distribution_plot_pixel_vis`).innerHTML = "";			
		}		
		let distribution_plot = new DistributionPlot(props, `#distribution_plot_pixel_vis`, "distribution over predicted sentiments propabilities", -1);
		distribution_plot.draw();
	}
	
	draw() {
		document.getElementById(this.div_id.slice(1)).innerHTML = "";
		
		this.container = d3.select(this.div_id)
			.append("svg")
			  .attr("width", this.width + this.margin.left + this.margin.right)
			  .attr("height", this.height + this.margin.top + this.margin.bottom)
			.append("g")
			  .attr("transform",
			        "translate(" + this.margin.left + "," + this.margin.top + ")")								
		
		const cluster_scale = d3.scaleOrdinal(d3.schemeCategory20);
	
		console.log("matrix", this.matrix);	
		
		// Build X scales and axis:		
		this.container.append("g")
			.attr("transform", "translate(0," + 0 + ")")
		  .call(d3.axisTop(this.x))
			.attr("class", "matrix-x-axis")
			
		this.container.select(".matrix-x-axis")
			.selectAll("text")
			// .attr("transform", "")
			.style("text-anchor", "start")
			.attr("transform", "rotate(-70) translate(" + (10) + "," + (10) + ")")
		
		// Build X scales and axis:		
		this.container.append("g")			
			.call(d3.axisLeft(this.y).tickFormat(d => {
				return this.one_hot_patterns[d].elements.length;
			}))
			
		let color_scale = d3.scaleLinear()
			.range(["white", "#353333"])
	  	.domain([0,1]);		

    let rows = this.container.selectAll(".matrix-row")
        .data(this.matrix)
      	.enter().append("g")
        .attr("class", "matrix-row")
				.attr("cluster", d => d[0].c)
				.on("mouseover", (d, p) => {
					let el = document.getElementById(`${this.div_id.slice(1)}`).getElementsByClassName("matrix-row")[p];
					el.style.opacity = "0.4";
				})
				.on("mouseout", (d, p) => {
					let el = document.getElementById(`${this.div_id.slice(1)}`).getElementsByClassName("matrix-row")[p];
					el.style.opacity = "1";
				})
				.on('click', (d, p) => {
					let model_num = this.div_id.slice(-1);
					let pattern = d[0].y;
					document.getElementById("sentence-select-info-matrix").innerHTML = `Sentences with pattern: <code>${pattern}</code> from <code>model ${model_num}</code>`;
						 
					let idx = this.one_hot_patterns[pattern].elements;
					// console.log("IDX", idx)
					let data1 = window.data1.filter((el, i) => idx.includes(i));
					let data2 = window.data2.filter((el, i) => idx.includes(i));
					document.getElementById("pixelVis1").innerHTML = "";
					document.getElementById("pixelVis2").innerHTML = "";
					document.getElementById("pixel-sentence-view").innerHTML = "";
					this.compute_stats_for_pixel_vis(data1, pattern);
					let pixelVis1 = new PixelVis(data1, "#pixelVis1", "Centralized Reports", true);
					window.pixelVis1 = pixelVis1;
					pixelVis1.draw();
					let pixelVis2 = new PixelVis(data2, "#pixelVis2", "Remove layer 9", false);
					window.pixelVis2 = pixelVis2;
					pixelVis2.draw();
					
					scatter_plot(data1, false, DATA_FILE_ONE, "#projection_model_1");
					scatter_plot(data2, false, DATA_FILE_TWO, "#projection_model_2");	
					d3.select("#patternProjectionSelection").html(`<code>${pattern}</code>`)
					d3.select("#resetSelectionCol").style("display", "block");
        })			 	 
		
		console.log("cluster_sort", this.cluster_sort)
    let cols = rows.selectAll(".cell")
  		.data(d => d)
      .enter().append("rect")
      .attr("class", "cell")
			.attr("x", d => this.x(d.x))
		  .attr("y", d => this.y(d.y))
			.attr("width",this.x.bandwidth())
	 	  .attr("height", this.y.bandwidth())
			.style("stroke", "grey")
       // .on('mouseover', function() {
       //    d3.select(this)
       //        .style('fill', '#0F0');
       // })
       // .on('mouseout', function() {
       //    d3.select(this)
       //        .style('fill', '#FFF');
       // })       
			 .style("fill", d => {				 
				 if (this.cluster_sort) {
					 if (d.z == 1) {
						 return cluster_scale(d.c);						 
					 }
				 }
				 return color_scale(d.z);			 
			 })
			
		// TODO: sort open/closed (alle von open/closed/mixed) + cluster				
		// create vis new everytime		
	}
	
	sort(type) {		
		this.cluster_sort = false;
		if (type == "cluster") {
			this.cluster_sort = true;			
		}
		let sorted_rows = [];
		let sorted_one_hots = {};
		this.container.selectAll(".matrix-row").sort( 
			(a, b) => {
				if (type == "cluster") {
					return d3.descending(Number(a[0].c), Number(b[0].c));					
				} else { // count == default
					return d3.descending(this.one_hot_patterns[a[0].y].elements.length, this.one_hot_patterns[b[0].y].elements.length);
				} 
				// sorted_rows = d3.ascending(Number(a[0].c), Number(b[0].c));
			}).attr("transform", d => {
				sorted_rows.push(d);
				sorted_one_hots[d[0].y] = this.one_hot_patterns[d[0].y];
				return "x";
			})
			// .attr("transform", (d, i) => {
			// 	let key = Object.keys(this.one_hot_patterns)[i];
			// 	console.log(d[0].y, key, i);
			// 	return "translate(0, " + (this.y(key)) + ")"; 
			// })
		console.log("sorted_rows", sorted_rows);
		this.matrix = sorted_rows;
		this.one_hot_patterns = sorted_one_hots;
		let sorted_vars = Object.keys(this.one_hot_patterns);
		this.y = d3.scaleBand()
		  .range([ this.height, 0 ])
		  .domain(sorted_vars)
		  .padding(0.3);
		this.draw();
	}
}
