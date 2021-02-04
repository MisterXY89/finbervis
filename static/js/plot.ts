

const DATA_DIR:string = "./data";
const CLUSTER_FILE:string = `${DATA_DIR}/projection_with_full_sents.csv`;

// const COLORS = ["#440154", "#3CBB75", "#DCE319"];
const COLORS = ['#abe564', '#64abe5', '#9e64e5'];


// "#336338" = more medium sea blue
// "#67001F" = dark red
// "#6ece58" = april green
// "#440154" = dark purple
// "#fde725" = yellow
// "#3e4989" = medium sea blue
// "#26828e" = more turqoise medium sea blue
// "#1f9e89" = turqoise
// "#482878" = light purple
// "#424047" = gray


const SENTIMENT_CLASSES = ["positive", "neutral", "negative"];

const RADIUS = 3;

function get_color(el: string|number, new_point: boolean|undefined) {
	// console.log(new_point);
	if(new_point) {
		return SELECT_COLOR;
	}
	if (typeof el == "string") {
		return COLORS[SENTIMENT_CLASSES.indexOf(el)];
	}
	return COLORS[el];
}

function get_radius(new_point: boolean|undefined) {
	if (new_point) {
		return SELECT_RADIUS;
	}
	return RADIUS;
}

// set the dimensions and margins of the graph
const margins = {
    top: 20,
    right: 0,
    bottom: 75,
    left: 75
};

// type aliases
type SVGSelect = d3.Selection<SVGElement, any, HTMLElement, any> ;

const width:number = 900;
const height:number = 800;
const visWidth:number = width - margins.left - margins.right;
const visHeight:number = height - margins.top - margins.bottom;


// append the svg object to the body of the page

// console.log(`> Loading file: ${CLUSTER_FILE}`);


const x = d3.scaleLinear()
	.domain([-10, 20])
	.range([0, width]);

const y = d3.scaleLinear()
	.domain([-15, 20])
	.range([height, 0]);

function create_heatmap(segment: string, layer: number, head: number) {

	let csv_url = `/get-attention?layer=${layer}&head=${head}&segment=${segment}`;

	// set the dimensions and margins of the graph
	var margin = {top: 80, right: 25, bottom: 30, left: 40},
	  width = 450 - margin.left - margin.right,
	  height = 450 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	var svg = d3.select("#self-attention-heatmap")
	.append("svg")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
	.append("g")
	  .attr("transform",
	        "translate(" + margin.left + "," + margin.top + ")");

	//Read the data
	d3.csv(csv_url, function(data) {

		console.log(data);

	  // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
	  var token_xs = d3.map(data, function(d){return d.token_x;}).keys()
	  var token_ys = d3.map(data, function(d){return d.token_y;}).keys()

	  // Build X scales and axis:
	  var x = d3.scaleBand()
	    .range([ 0, width ])
	    .domain(token_xs)
	    .padding(0.05);
	  svg.append("g")
	    .style("font-size", 15)
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(x).tickSize(0))
	    .select(".domain").remove()

	  // Build Y scales and axis:
	  var y = d3.scaleBand()
	    .range([ height, 0 ])
	    .domain(token_ys)
	    .padding(0.05);
	  svg.append("g")
	    .style("font-size", 15)
	    .call(d3.axisLeft(y).tickSize(0))
	    .select(".domain").remove()

	  // Build color scale
	  var heatmap_get_color = d3.scaleSequential()
	    .interpolator(d3.interpolateInferno)
	    .domain([0,1])

		console.log(heatmap_get_color(0.3));

	  // create a tooltip
	  var tooltip = d3.select("#my_dataviz")
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "2px")
	    .style("border-radius", "5px")
	    .style("padding", "5px")

	  // Three function that change the tooltip when user hover / move / leave a cell
	  var mouseover = function(d) {
	    tooltip
	      .style("opacity", 1)
	    d3.select(this)
	      .style("stroke", "black")
	      .style("opacity", 1)
	  }
	  var mousemove = function(d) {
	    tooltip
	      .html("The exact value of<br>this cell is: " + Number(d.value))
	      .style("left", (d3.mouse(this)[0]+70) + "px")
	      .style("top", (d3.mouse(this)[1]) + "px")
	  }
	  var mouseleave = function(d) {
	    tooltip
	      .style("opacity", 0)
	    d3.select(this)
	      .style("stroke", "none")
	      .style("opacity", 0.8)
	  }

	  // add the squares
	  svg.selectAll()
	    .data(data, function(d) {return d.token_x+':'+d.token_y;})
	    .enter()
	    .append("rect")
	      .attr("x", function(d) { return x(d.token_x) })
	      .attr("y", function(d) { return y(d.token_y) })
	      .attr("rx", 4)
	      .attr("ry", 4)
	      .attr("width", x.bandwidth() )
	      .attr("height", y.bandwidth() )
	      .style("fill", function(d) {
					// console.log(Number(d.value));
					return heatmap_get_color(Number(d.value));
				})
	      .style("stroke-width", 4)
	      .style("stroke", "none")
	      .style("opacity", 0.8)
	    .on("mouseover", mouseover)
	    .on("mousemove", mousemove)
	    .on("mouseleave", mouseleave)
		})

	// Add title to graph
	svg.append("text")
	        .attr("x", 0)
	        .attr("y", -50)
	        .attr("text-anchor", "left")
	        .style("font-size", "22px")
	        .text(`Layer ${layer+1}, head ${head+1}`);

	// Add subtitle to graph
	svg.append("text")
	        .attr("x", 0)
	        .attr("y", -20)
	        .attr("text-anchor", "left")
	        .style("font-size", "14px")
	        .style("fill", "grey")
	        .style("max-width", 500)
					.style("min-height", 50)
	        .html(`Self-Attention heatmap of the respective token, in layer ${layer+1} and head ${head+1}.<br><a href='#hide-heatmap' id='hide-heatmap'>Hide</a>`);

}

function create_scatter_plot(data: Iterable<unknown>) {
	// d3.select(PLOT_ID).select("svg").remove();
	d3.select("svg").remove();

	const container: SVGSelect = d3.select(PLOT_ID)
	  .append("svg")
	    .attr("width", width + margins.left + margins.right)
	    .attr("height", height + margins.top + margins.bottom)
	  .append("g")
	    .attr("transform",
	          "translate(" + margins.left + "," + margins.top + ")");

	// X-AXIS
	container.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Y-AXIS
	container.append("g")
		.call(d3.axisLeft(y));

 let mouse_events = get_mouse_events(data);
 const mouseover 	= mouse_events[0];
 const mousemove 	= mouse_events[1];
 const mouseleave	= mouse_events[2];
 const click 			= mouse_events[3];

	// DATA-POINTS
	container.append('g')
		.selectAll("dot")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", (d: any) => {
			// console.log(d.x);
			return x(d.x);
		})
		.attr("cy", (d: any) => y(d.y))
		.attr("r", (d: any) => get_radius(d.new))
		.style('fill', (d:any) => {
			console.log(d.new);
			return get_color(d.sentiment, d.new);
		})
		// .style('fill', (d:any) => get_color(d.cluster))
		.on('mouseover', mouseover)
		.on('mousemove', mousemove)
		.on('mouseleave', mouseleave)
		.on('click', click);
}

function scatter_plot(custom_data) {
		custom_data = (custom_data == undefined) ? false : custom_data;
		d3.csv(CLUSTER_FILE, (data: any) => {
				if (custom_data != {}) {
						data.push(custom_data);
				}
				create_scatter_plot(data);
		});
}
