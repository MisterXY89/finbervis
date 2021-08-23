
// see https://observablehq.com/@mbostock/the-impact-of-vaccines

// async function load_pixel_vis_data(fi1, fi2) {
// 	const papa_config = {delimiter: ",", header: true};
// 	let data1 = await fetch(`/data/${fi1}`)
// 		.then(resp => resp.text())
// 		.then(t => Papa.parse(t, papa_config))
// 		.then(data1 => {
// 			console.log("pre trans ", data1);
//     	return transform_data(data1.data);
//   	});
//   let data2 = await fetch(`/data/${fi2}`)
//   	.then(resp => resp.text())
//   	.then(t => Papa.parse(t, papa_config))
//   	.then(data2 => {
//     	return transform_data(data2.data);
//   	});
//   return { data1, data2 }
// }

function create_sentence_view(data, is_one) {
	console.log("create_sentence_view", data);
	let div_id = "#pixel-sentence-view";
	// document.getElementById(div_id.slice(1)).innerHTML = "";
	// if (is_one) {
	// 	let data1 = data;
	// 	let data2 = window.pixelVis2.data[data.y];
	// 	console.log("data2", data2);
	// } else {
	// 	let data1 = window.pixelVis1.data[data.y];
	// 	let data2 = data;
	// 	console.log("data1", data1);
	// }
	let data1 = window.pixelVis1.data[data.y];
	let data2 = window.pixelVis2.data[data.y];
	data = [data1, data2];
	console.log("- data - ", data);
	let dims = {
		height: 600,
		width: 300
	}
	let sentence_pixel_vis = new PixelVis(data, div_id, "Sentence View", false, dims);
	sentence_pixel_vis.draw();
}

class PixelVis {
	
	constructor(data, div_id, name, is_one, dims) {
		console.log(dims);
		this.sentence_view = (div_id == "#pixel-sentence-view") ? true : false;		
		this.dims = (dims == undefined) ? {} : dims;
		this.is_one = (is_one == undefined) ? true : is_one;
		this.name = name;
		this.data = data;
		this.div_id = div_id;
		this.margin = {
				top: 20, 
				right: 20, 
				bottom: 120, 
				left: 0
			};
		console.log(this.sentence_view);
		console.log(this.dims);
		this.width = (this.dims.width == undefined) ? 600 : this.dims.width;
		this.height = (this.dims.height == undefined) ? 600 : this.dims.height;
		// this.color_scale = d3.scaleLinear()
		//   .range(["blue","white", "red"])
		//   .domain([-1, 0, 1]);
	}
	
	color_scale(x) {
		let sc = d3.scaleLinear().domain([-1,1]).range([0,1]);
		return d3.interpolateBrBG(sc(x));
	}
	
	prep_data_for_vis() {
		let matrix = [];
		let y_labels = [];
		let x_labels = [];
		let to_value = this.data.length == 2 ? 2 : 100;
		this.data.slice(0, to_value).forEach((row, index)  => {
			// let y = (row.id == undefined) ? index : row.id;
			let y = index;
			y_labels.push(y);
			// console.log(row.saliency_score);
			row.saliency_score.forEach((score, i) => {
				if (!x_labels.includes(i)) {
					x_labels.push(i);
				}
				// console.log(score, i, y)
				matrix.push({
					x: i,
					y: y,
					z: score,
					token: row.tokens[i],
					segment: row.segment,
					sentiment: row.sentiment,
					tokens: row.tokens,
					saliency_score: row.saliency_score, 
					truth_label: row.truth_label,
					sentiment: row.sentiment
				})
			});			
		});
		return { matrix, x_labels, y_labels };
	}  
	
	draw() {		
		
		// append the svg object to the body of the page
		let container = d3.select(this.div_id)
		.append("svg")
		  .attr("width", this.width + this.margin.left + this.margin.right)
		  .attr("height", this.height + this.margin.top + this.margin.bottom)
		.append("g")
		  .attr("transform",
		        "translate(" + this.margin.left + "," + this.margin.top + ")");
		
		let rd = this.prep_data_for_vis();
		console.log(rd);
		const vis_data = rd.matrix;
		// Labels of row and columns
		console.log(this.sentence_view);
		if (this.sentence_view) {
			const x_axis_labels = rd.matrix[0].tokens;
		} else {
			const x_axis_labels = rd.x_labels;			
		}
		const x_axis_labels_domain = rd.x_labels;
		const y_axis_labels = rd.y_labels;
		
		
		// Build X scales and axis:
		const x = d3.scaleBand()
		  .range([ 0, this.width ])
		  .domain(x_axis_labels_domain)
		  .padding(0.01)
			// .tickFormat(function(d) { console.log("dd", d)})
			
		container.append("g")
		  .attr("transform", "translate(0," + this.height + ")")
			.style("text-anchor", "start")
			.attr("class", "x-axis")
		  .call(d3.axisBottom(x)
							.tickFormat(d => {
								// console.log(d);
								if (this.sentence_view) {
									return x_axis_labels[d];
								} else {
									return d;
								}
								// transform: translate(-90)
							})	
						)
						
		if (this.sentence_view) {			
			container.select(".x-axis")
			.selectAll("text")
			// .attr("transform", "")
			.style("text-anchor", "end")
			.attr("transform", "rotate(-70) translate(" + (-10) + "," + (-10) + ")")
		}
			

		// Build X scales and axis:
		const y = d3.scaleBand()
		  .range([ this.height, 0 ])
		  .domain(y_axis_labels)
		  .padding(0.01);
		container.append("g")
		  .call(d3.axisLeft(y))	
			
		let tooltip = d3.select(this.div_id)
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "2px")
	    .style("border-radius", "5px")
	    .style("padding", "5px")
			
		let mouseover = function(d) {		
	    tooltip.style("opacity", 1)
	  }
		
	  let mousemove = function(d) {
	    tooltip
	      .html(`Tokens: ${d.token} <br> Saliency score: ${d.z} <br> Segment: ${d.segment} <br> truth_label: ${d.truth_label} <br> sentiment: ${d.sentiment}`)
	      .style("left", (d3.mouse(this)[0]+70) + "px")
	      .style("top", (d3.mouse(this)[1]) + "px")
	  }
		
	  let mouseleave = function(d) {
	    tooltip.style("opacity", 0)
	  }
		
		let click = function(d) {
			console.log(d);
			create_sentence_view(d, this.is_one);
		}
			
		container.selectAll()
      .data(vis_data, d => d.x+':'+d.y)
      .enter()
      .append("rect")
      .attr("x", d =>  x(d.x))
			// .attr("class", `row_${d.y}`)
      .attr("y", d => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => this.color_scale(d.z))
			.on("click", click)
			.on("mousemove", mousemove)
			.on("mouseleave", mouseleave)
			.on("mouseover", mouseover)
			
		container.append("text")
			.attr("class", "pixelVisHeader")
			.attr("x", 0)
			.attr("y", -65)
			.attr("text-anchor", "left")
			.style("font-size", "22px")
			.text(this.name);
			
			
		// #saliency-filter-value-range
		
		if (!$("#saliency-filter-value-range").is(":visible")) {
			const slider_data_vals = [0, 0.25, 0.5, 0.75, 0.8, 0.9, 0.95, 1]
			const saliencySliderRange = d3
				.sliderBottom()
				.min(d3.min(slider_data_vals))
				.max(d3.max(slider_data_vals))
				.width(600)
				.tickFormat(d3.format('.2%'))
				.ticks(5)
				.default(0.70)
				.fill('#2196f3')
				.on('onchange', val => {
					console.log(val);
					d3.select('p#saliency-filter-value-range').text(d3.format('.1%')(val));
				});

			const saliency_gRange = d3
				.select('div#saliency-filter-slider-range')
				.append('svg')
				.attr('width', 700)
				.attr('height', 100)
				.append('g')
				.attr('transform', 'translate(30,30)');

			saliency_gRange.call(saliencySliderRange);
			d3.select('p#saliency-filter-value-range').text(
				d3.format('.1%')(
				saliencySliderRange
					.value()
				)
			);
		}	
	
	}	
}
