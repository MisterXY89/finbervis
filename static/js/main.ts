
const PLOT_ID:string = "#plot";
const DATA_DIR:string = "./data";
const CLUSTER_FILE:string = `${DATA_DIR}/cluster_segments.csv`;

const COLORS = ["#440154", "#26828e", "#1f9e89", "#3e4989", "#6ece58",
								"#fde725", "#482878", "#DD2378", "#67001F", "#424047"];

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


d3.csv(CLUSTER_FILE, (data) => {
    // X-AXIS
    var x = d3.scaleLinear()
      .domain([-10, 20])
      .range([0, width]);
    container.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Y-AXIS
    var y = d3.scaleLinear()
      .domain([-15, 20])
      .range([height, 0]);
    container.append("g")
      .call(d3.axisLeft(y));

		// TOOL-TIP & MOUSE EVENTS
		var Tooltip = d3.select(PLOT_ID)
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "2px")
	    .style("border-radius", "5px")
	    .style("padding", "5px");

	    // Three function that change the tooltip when user hover / move / leave a cell
	    var mouseover = (_d: any) => {
	      Tooltip
	        .style("opacity", 1);
	    }
	    var mousemove = (d: any) => {
	      Tooltip
	        .html(
						`${'<table style="width:100%">'
                + '<tr>'
                    + '<th>Class</th>'
                    + '<td>'}${d.cluster}</td>`
                + '</tr>'
                + '<tr>'
                    + '<th>Datapoint</th>'
                    + `<td>(${d.x},${d.y})</td>`
                + '</tr>'
								+ '<tr>'
                    + '<th>Sentiment</th>'
                    + `<td>${d.sentiment}</td>`
                + '</tr>'
            + '</table>',
					)
	        .style("left", `${d3.event.pageX-width}px`)
	        .style("top", `${d3.event.pageY-height/2+70}px`)
					.style('border-color', COLORS[d.cluster]);
	    }
	    var mouseleave = (_d: any) => {
	      Tooltip
	        .style("opacity", 0)
	    }

		// DATA-POINTS
    container.append('g')
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d: any) => x(d.x))
      .attr("cy", (d: any) => y(d.y))
      .attr("r", 2.5)
			.style('fill', (d:any) => COLORS[d.cluster])
			.on('mouseover', mouseover)
			.on('mousemove', mousemove)
			.on('mouseleave', mouseleave);

  });
