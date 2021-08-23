
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
			left: 40
		};
		this.width = 600;
    this.height = this.nodes.length * 15;
		
		this.y = d3.scaleBand()
		  .range([ this.height, 0 ])
		  .domain(this.myVars)
		  .padding(0.1);
			
		this.x = d3.scaleBand()
		  .range([ 0, this.width ])
		  .domain(this.myGroups)
		  .padding(0.1);
					
		this.stats = this.compute_stats();
		console.log(this.stats);
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
		let saliency_scores = pattern_idx.map(i => this.data[i].saliency_score);
		let pattern_amount = Object.keys(this.one_hot_patterns).length -1;		
		let clusters_found = pattern_idx.map(i => this.data[i].one_hot_cluster).reduce(function (acc, curr) {
		  return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
		}, {});
		console.log("cluster-found:", clusters_found)
		
		// <th> No. of clusters </th>
		// <th> Sentences with patterns </th>
		// <th> Sentences <strong>without</strong> patterns </th>
		// <th> Wrongly predicted </th>
		
		let stats_html = `<td>${Object.keys(clusters_found).length}</td>`
					+	`<td>${pattern_found_count}</td>`
					+ `<td>${no_pattern_count}</td>`
					+ `<td>${wrongly_classified}</td>`;
		
		document.getElementById("stats-table-row").innerHTML = stats_html;			
		
		if (document.getElementById(`distribution_plot_${this.div_id.slice(-1)}`) != undefined) {
			document.getElementById(`distribution_plot_${this.div_id.slice(-1)}`).innerHTML = "";			
		}
		let distribution_plot = new DistributionPlot(props, `#distribution_plot_${this.div_id.slice(-1)}`, "distribution over predicted sentiments propabilities");
		distribution_plot.draw();
		// let avg_saliency = 
		return {
			no_pattern_count,
			pattern_found_count,
			wrongly_classified,
			pattern_amount,
			props,
			saliency_scores,
			distr_pred_classes
		}
	}
	
	make_nodes() {
		let nodes = [];
		console.log(this.one_hot_patterns);
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
	
	// color_scale(x) {
	// 	let sc = d3.scaleLinear().domain([-1,1]).range([0,1]);
	// 	return d3.interpolateBrBG(sc(x));
	// }
	
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
	
	draw() {
		// this.container.append("rect")
	  //   .attr("class", "matrix-background")
	  //   .attr("width", this.width)
	  //   .attr("height", this.height);
		
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
		// this.container.append("g")
		//   .call(d3.axisLeft(this.y));
			
		let color_scale = d3.scaleLinear()
			.range(["white", "#50514F"])
	  	.domain([0,1]);		

    let rows = this.container.selectAll(".matrix-row")
        .data(this.matrix)
      	.enter().append("g")
        .attr("class", "matrix-row")
				.attr("cluster", d => d[0].c);

    let cols = rows.selectAll(".cell")
  		.data(d => d)
      .enter().append("rect")
      .attr("class", "cell")
			.attr("x", d => this.x(d.x))
		  .attr("y", d => this.y(d.y))
			.attr("width",this.x.bandwidth())
	 	  .attr("height", this.y.bandwidth())
       // .on('mouseover', function() {
       //    d3.select(this)
       //        .style('fill', '#0F0');
       // })
       // .on('mouseout', function() {
       //    d3.select(this)
       //        .style('fill', '#FFF');
       // })       
			 // .style("fill", d => color_scale(d.z))
       .style("fill", d => {
				 if (d.z == 1) {
					 if (d.c == -1) {
						 return "black";
					 }
					 return cluster_scale(d.c);
				 }
				 return color_scale(d.z);
			 })			 
       // .style("stroke", '#555');
			 .on('click', function(d, p) {
				 console.log(d, p);
				 console.log(d3.select(this));
       })			 	 
		
		let annotations = [
	 		  {
	 		    note: {
	 		      // label: "Here is the annotation label",
						label: "",
	 		      title: "Closed class",
	 					padding: 10,
	 					wrap: 100
	 		    },
					subject: {
						width: 245,
						height: 50
					},
	 				type: d3.annotationCalloutRect,
	 		    x: 0,
	 		    y: -50,
	 		    dy: 50,
	 		    dx: -40
	 		  },
				{
	 		    note: {
						// label: "based on the universal dependencies .org",
	 		      label: "",
	 		      title: "Open class",
	 					padding: 10,
	 					wrap: 100
	 		    },
					subject: {
						width: 360,
						height: 50
					},
	 				type: d3.annotationCalloutRect,
	 		    x: 260,
	 		    y: -50,
	 		    dy: 50,
	 		    dx: 400
	 		  }
	 		]
	 		
 		// // Add annotation to the chart
 		// let makeAnnotations = d3.annotation()
 		//   .annotations(annotations)
 		// this.container
 		//   .append("g")
 		//   .call(makeAnnotations)
		// TODO: sort open/closed (alle von open/closed/mixed) + cluster				
		// create vis new everytime
		// this.sort("cluster");
	}
	
	sort(type) {
		// Features of the annotation		
				
		this.container.selectAll(".matrix-row").sort( 
			(a, b) => {
				console.log("sort!", type);
				if (type == "cluster") {					
					return d3.ascending(Number(a[0].c), Number(b[0].c));
				}
				return d3.ascending(Number(a[0].c), Number(b[0].c));
			})
			.attr("transform", (d, i) => {
				console.log(d, i);
				console.log(this.y(this.one_hot_patterns[d[0].y]));
				
				return "translate(0, " + (this.y(this.one_hot_patterns[d[0].y])) + ")"; 
			})
	}
}
