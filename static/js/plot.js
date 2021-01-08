"use strict";
var DATA_DIR = "./data";
var CLUSTER_FILE = DATA_DIR + "/cluster_segments.csv";
var COLORS = ["#482878", "#6ece58", "#e8d635"];
// "#67001F" = dark red
// "#6ece58" = april green
// "#440154" = dark purple
// "#fde725" = yellow
// "#3e4989" = medium sea blue
// "#26828e" = more turqoise medium sea blue
// "#1f9e89" = turqoise
// "#482878" = light purple
// "#424047" = gray
var SENTIMENT_CLASSES = ["positive", "neutral", "negative"];
var RADIUS = 3.5;
function get_color(el) {
    if (typeof el == "string") {
        return COLORS[SENTIMENT_CLASSES.indexOf(el)];
    }
    return COLORS[el];
}
// set the dimensions and margins of the graph
var margins = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 50
};
var width = 700;
var height = 700;
var visWidth = width - margins.left - margins.right;
var visHeight = height - margins.top - margins.bottom;
// append the svg object to the body of the page
var container = d3.select(PLOT_ID)
    .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    .append("g")
    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
console.log("> Loading file: " + CLUSTER_FILE);
var x = d3.scaleLinear()
    .domain([-10, 20])
    .range([0, width]);
var y = d3.scaleLinear()
    .domain([-15, 20])
    .range([height, 0]);
d3.csv(CLUSTER_FILE, function (data) {
    // X-AXIS
    container.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    // Y-AXIS
    container.append("g")
        .call(d3.axisLeft(y));
    var mouse_events = get_mouse_events(data);
    var mouseover = mouse_events[0];
    var mousemove = mouse_events[1];
    var mouseleave = mouse_events[2];
    var click = mouse_events[3];
    // DATA-POINTS
    container.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.x); })
        .attr("cy", function (d) { return y(d.y); })
        .attr("r", RADIUS)
        .style('fill', function (d) { return get_color(d.sentiment); })
        // .style('fill', (d:any) => get_color(d.cluster))
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
        .on('click', click);
});
function add_datapoint(json) {
    var mouse_events = get_mouse_events(json);
    var mouseover = mouse_events[0];
    var mousemove = mouse_events[1];
    var mouseleave = mouse_events[2];
    var click = mouse_events[3];
    container.append('g')
        .selectAll("dot")
        .data(json)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.x); })
        .attr("cy", function (d) { return y(d.y); })
        .attr("r", 20)
        .style('fill', function (d) { return "#000"; })
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
        .on('click', click);
}
