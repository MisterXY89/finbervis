
class MatrixVis {
	
	constructor(data, div_id, name) {		
		this.data = data;
		this.div_id = div_id;
		this.name = name;
		this.margin = {
			top: 80,
			right: 100,
			bottom: 0,
			left: 40
		};
		this.width = 770;
    this.height = 800;
		this.POS_TAGS = ['ADJ', 'ADV', 'INTJ', 'NOUN', 'PROPN', 'VERB', 'ADP', 'AUX', 'CONJ', 'DET', 'NUM', 'PART', 'PRON', 'SCONJ', 'PUNCT', 'SYM', 'X'];
		this.pos_classes_dict = {
		    "open": ["ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB"],
		    "closed": ["ADP", "AUX","CONJ","DET","NUM","PART","PRON","SCONJ"],
		    "other": ["PUNCT", "SYM", "X"]
		};
		this.one_hot_patterns = {};
		this.matrix = this.prep_data_for_vis();
		this.nodes = this.make_nodes();
		console.log("nodes: ", this.nodes);
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
					vis_index ++;
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
						
		let myGroups = this.POS_TAGS; // x
		let myVars = Object.keys(this.one_hot_patterns);
		
		const cluster_scale = d3.scaleOrdinal(d3.schemeCategory20);
	
		console.log("matrix", this.matrix);	
		
		// Build X scales and axis:
		let x = d3.scaleBand()
		  .range([ 0, width ])
		  .domain(myGroups)
		  .padding(0.1);
		this.container.append("g")
			.attr("transform", "translate(0," + 0 + ")")
		  .call(d3.axisTop(x))		
			.attr("class", "matrix-x-axis")
			
		this.container.select(".matrix-x-axis")
			.selectAll("text")
			// .attr("transform", "")
			.style("text-anchor", "start")
			.attr("transform", "rotate(-70) translate(" + (10) + "," + (10) + ")")

		// Build X scales and axis:
		let y = d3.scaleBand()
		  .range([ this.height, 0 ])
		  .domain(myVars)
		  .padding(0.02);
		// this.container.append("g")
		//   .call(d3.axisLeft(y));
			
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
			.attr("x", d => x(d.x))
		  .attr("y", d => y(d.y))
			.attr("width", x.bandwidth())
	 	  .attr("height", y.bandwidth())
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
			 
		// TODO: sort open/closed (alle von open/closed/mixed) + cluster				
		// create vis new everytime
		this.sort("cluster");
	}
	
	sort(type) {
		// Features of the annotation
		// let annotations = [
		//   {
		//     note: {
		//       label: "Here is the annotation label",
		//       title: "Annotation title",
		// 			padding: 10,
		// 			wrap: 200
		//     },
		// 		type: d3.annotationCalloutRect,
		//     x: 600,
		//     y: 100,
		//     dy: 100,
		//     dx: 100
		//   }
		// ]
		// 
		// // Add annotation to the chart
		// let makeAnnotations = d3.annotation()
		//   .annotations(annotations)
		// this.container
		//   .append("g")
		//   .call(makeAnnotations)
				
		this.container.selectAll(".matrix-row").sort( 
			(a, b) => {
				if (type == "cluster") {
					return d3.ascending(Number(a[0].c), Number(b[0].c));
				}
				return d3.ascending(Number(a[0].c), Number(b[0].c));
			})
			.attr("transform", (d, i) => {
				return "translate(0, " + y(i) + ")"; 
			})
	}
}
