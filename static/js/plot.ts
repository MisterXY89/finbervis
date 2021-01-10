

const DATA_DIR:string = "./data";
const CLUSTER_FILE:string = `${DATA_DIR}/cluster_segments.csv`;

// const COLORS = ["#440154", "#3CBB75", "#DCE319"];
const COLORS = ['#64abe5', '#9e64e5', '#abe564'];


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

function get_color(el: string|number) {
	if (typeof el == "string") {
		return COLORS[SENTIMENT_CLASSES.indexOf(el)];
	}
	return COLORS[el];
}

// set the dimensions and margins of the graph
const margins = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 50
};

// type aliases
type SVGSelect = d3.Selection<SVGElement, any, HTMLElement, any> ;

const width:number = 700;
const height:number = 700;
const visWidth:number = width - margins.left - margins.right;
const visHeight:number = height - margins.top - margins.bottom;


// append the svg object to the body of the page
var container: SVGSelect = d3.select(PLOT_ID)
  .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margins.left + "," + margins.top + ")");

console.log(`> Loading file: ${CLUSTER_FILE}`);


const x = d3.scaleLinear()
	.domain([-10, 20])
	.range([0, width]);

const y = d3.scaleLinear()
	.domain([-15, 20])
	.range([height, 0]);

d3.csv(CLUSTER_FILE, (data) => {
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
      .attr("cx", (d: any) => x(d.x))
      .attr("cy", (d: any) => y(d.y))
      .attr("r", RADIUS)
			.style('fill', (d:any) => get_color(d.sentiment))
			// .style('fill', (d:any) => get_color(d.cluster))
			.on('mouseover', mouseover)
			.on('mousemove', mousemove)
			.on('mouseleave', mouseleave)
			.on('click', click);

});


function add_datapoint(json) {

	let mouse_events 	= get_mouse_events(json);
	const mouseover 	= mouse_events[0];
	const mousemove 	= mouse_events[1];
	const mouseleave	= mouse_events[2];
	const click 			= mouse_events[3];

	container.append('g')
			.selectAll("dot")
			.data(json)
			.enter()
			.append("circle")
			.attr("cx", (d: any) => x(d.x))
			.attr("cy", (d: any) => y(d.y))
			.attr("r", 20)
			.style('fill', (d: any) => "#000")
			.on('mouseover', mouseover)
			.on('mousemove', mousemove)
			.on('mouseleave', mouseleave)
			.on('click', click);
}
