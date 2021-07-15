
// see https://observablehq.com/@mbostock/the-impact-of-vaccines

function transform_data(data) {
	data.map(row => {
		row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens) : [];
		row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
		row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
		row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
		row.props = (row.props != undefined) ? to_array(row.props) : [];
		row.x = (row.x != undefined) ? Number(row.x) : 0;
		row.y = (row.y != undefined) ? Number(row.y) : 0;
		row.id = (row.id != undefined) ? Number(row.id) : -1;
	})
	console.log(data);
	return data;
}

async function load_pixel_vis_data(fi1, fi2) {
	const papa_config = {delimiter: ",", header: true};
	let data1 = await fetch(`/data/${fi1}`)
		.then(resp => resp.text())
		.then(t => Papa.parse(t, papa_config))
		.then(data1 => {
			console.log("pre trans ", data1);
    	return transform_data(data1.data);
  	});
  let data2 = await fetch(`/data/${fi2}`)
  	.then(resp => resp.text())
  	.then(t => Papa.parse(t, papa_config))
  	.then(data2 => {
    	return transform_data(data2.data);
  	});
  return { data1, data2 }
}

class PixelVis {
	
	constructor(data, div_id) {
		this.data = data;
		this.div_id = div_id;
		this.margin = {
				top: 20, 
				right: 40, 
				bottom: 100, 
				left: 40
			};
		this.width = 900;
		this.height = 1100;
		this.color_scale = d3.scaleLinear()
		  .range(["blue","white", "red"])
		  .domain([-1, 0, 1]);
	}
	
	prep_data_for_vis() {
		let matrix = [];
		let y_labels = [];
		let x_labels = [];
		this.data.slice(0, 100).forEach(row => {
			let y = row.id;
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
		const x_axis_labels = rd.x_labels;
		const y_axis_labels = rd.y_labels;
		
		// Build X scales and axis:
		const x = d3.scaleBand()
		  .range([ 0, this.width ])
		  .domain(x_axis_labels)
		  .padding(0.01);
		container.append("g")
		  .attr("transform", "translate(0," + this.height + ")")
		  .call(d3.axisBottom(x))

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
	      .html(`Tokens: ${d.token} <br> Saliency score: ${d.z} <br> Segment: ${d.segment}`)
	      .style("left", (d3.mouse(this)[0]+70) + "px")
	      .style("top", (d3.mouse(this)[1]) + "px")
	  }
		
	  let mouseleave = function(d) {
	    tooltip.style("opacity", 0)
	  }
		
		let click = function(d) {
			console.log(d);
		}
			
		container.selectAll()
      .data(vis_data, d => d.x+':'+d.y)
      .enter()
      .append("rect")
      .attr("x", d =>  x(d.x))
      .attr("y", d => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => this.color_scale(d.z))
			.on("click", click)
			.on("mousemove", mousemove)
			.on("mouseleave", mouseleave)
			.on("mouseover", mouseover)
	
	}
}
