
// see https://observablehq.com/@mbostock/the-impact-of-vaccines

function transform_data_hm(data) {
	console.log("hm transform_data: ", data);
	data.map(row => {
		row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens) : [];
		row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
		row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
		row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
		row.props = (row.props != undefined) ? to_array(row.props) : [];
		row.x = (row.x != undefined) ? Number(row.x) : 0;
		row.y = (row.y != undefined) ? Number(row.y) : 0;
		row.id = (row.id != undefined) ? Number(row.id) : -1;
		row.tokens.map(el => el == "," ? "COMMA" : el);			
	})
	console.log(data);
	return data;
}

function hide_heatmap(hm_id) {
	$(`#${hm_id}`).hide();
	if (Array.from($("#self-attention-heatmap g")).length <= 0) {
		$(".modal").first().modal("hide");
	}
}


async function load_attention_heatmap_data(segment, layer, head) {
	let csv_url = `/get-attention?layer=${layer}&head=${head}&segment=${segment}`;
	const papa_config = {delimiter: ",", header: true};
	let data = await fetch(csv_url)
		.then(resp => resp.text())
		.then(t => Papa.parse(t, papa_config))
		.then(data => {			
			return transform_data_hm(data.data);
		});	
	return {
		data, 
		layer,
		head
	};
}

class Heatmap {
	
	constructor(data, div_id) {		
		this.data = data.data;
		this.layer = data.layer;
		this.head = data.head;
		this.div_id = div_id;
		this.margin = {
			top: 125, 
			right: 30, 
			bottom: 80, 
			left: 80
		},
		this.width = 650;
		this.height = 650;		
		this.vis_width = this.width - this.margin.left - this.margin.right;
		this.vis_height = this.height - this.margin.top - this.margin.bottom;
	}
	
	color_scale(x) {
		let sc = d3.scaleLinear().domain([-1,1]).range([0,1]);
		return d3.interpolateBrBG(sc(x));
	}
	  
	
	draw() {
		const svg = d3.select(this.div_id)
		.append("svg")
		  .attr("width", this.width + this.margin.left + this.margin.right)
		  .attr("height", this.height + this.margin.top + this.margin.bottom)
			.attr("id", `hm${d.id}`)
		.append("g")
		  .attr("transform",
		        "translate(" + this.margin.left + "," + this.margin.top + ")");
						
		let token_data = this.data.map(e => e.token_x);
		let b_tokens = token_data.slice(0, token_data.indexOf("[SEP]")+1);
		var token_xs = b_tokens;
		var token_ys = b_tokens;
	  
	  // var token_xs = segment_tokens;
	  // var token_ys = segment_tokens;
		
		console.log(token_xs);
		console.log(token_ys);

	  // Build X scales and axis:
	  var x = d3.scaleBand()
	    .range([ 0, width ])
	    .domain(token_xs)
			.padding(0.02);
			
	  svg.append("g")			
	    .style("font-size", 15)
	    .attr("transform", "translate(0," + this.height + ")")
	    .call(d3.axisBottom(x).tickSize(0))	   
		.selectAll("text")
     	.style("text-anchor", "end")
     	.attr("dx", "-.8em")
     	.attr("dy", ".15em")
     	.attr("transform", "rotate(-65)")
			.style("padding-bottom", "2em");
		
		
		var y = d3.scaleBand()
	    .range([ this.height, 0 ])
	    .domain(token_ys)
			.padding(0.02);
	  svg.append("g")
	    .style("font-size", 15)
	    .call(d3.axisLeft(y).tickSize(0))
	    .select(".domain").remove()

	  // Build color scale
	  var heatmap_get_color = d3.scaleSequential()
	    .interpolator(d3.interpolateInferno)
	    .domain([0,1])
		

	  // create a tooltip
	  // var tooltip = d3.select("#my_dataviz")
	  //   .append("div")
	  //   .style("opacity", 0)
	  //   .attr("class", "tooltip")
	  //   .style("background-color", "white")
	  //   .style("padding", "5px")
	

	  // add the squares
	  svg.selectAll()
	    .data(this.data, d => d.token_x+':'+d.token_y)
	    .enter()
	    .append("rect")
	      .attr("x", d => x(d.token_x) )
	      .attr("y", d => y(d.token_y) )
	      .attr("width", x.bandwidth() )
	      .attr("height", y.bandwidth() )
	      .style("fill", d => {
					return heatmap_get_color(Number(d.value));
				});

		// Add title to graph
		svg.append("text")
      .attr("x", 0)
      .attr("y", -65)
      .attr("text-anchor", "left")
      .style("font-size", "22px")
      .text(`Self-Attention: Layer ${this.layer+1}, head ${this.head+1}`);

		// Add subtitle to graph
		svg.append("text")
      .attr("x", 0)
      .attr("y", -35)
      .attr("text-anchor", "left")
      .style("font-size", "14px")
      .style("fill", "grey")	        
			.html(`Self-Attention heatmap of the respective token, in layer ${this.layer+1} and head ${this.head+1}.`)
		svg.append("text")
      .attr("x", 0)
      .attr("y", -15)
      .attr("text-anchor", "left")
      .style("font-size", "14px")
      .style("fill", "grey")					
			.html(`Y-Axis tokens attend to X-Axis tokens, Scale from black to blue to yellow. <a href='#hide-heatmap' onclick='hide_heatmap("hm${d.id}")'>Hide</a>`);
		
		
}
