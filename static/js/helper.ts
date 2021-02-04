
const PLOT_ID:string = "#plot";
const SELECT_COLOR:string = "#ce0c0f";
const SELECT_RADIUS:number = 8;

function get_mouse_events(data) {

	// TOOL-TIP & MOUSE EVENTS
	const SideBar = d3.select("#point-data");
	const Tooltip = d3.select(PLOT_ID)
		.append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("background-color", "white")
		.style("border", "solid")
		.style("border-width", "2px")
		.style("border-radius", "0px")
		.style("padding", "5px");

	// Three function that change the tooltip when user hover / move / leave a cell
	var mouseover = () => {
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
								+ `<td>(${d.x},<br>${d.y})</td>`
						+ '</tr>'
						+ '<tr>'
								+ '<th>Sentiment</th>'
								+ `<td id='model-sentiment'>${d.sentiment}</td>`
						+ '</tr>'
				+ '</table>',
			)
			// .style("left", `${d3.event.pageX+90-width}px`)
			.style("top", `${d3.event.pageY-height/2}px`)
			.style("left", `${d3.event.pageX-70}px`)
			// .style("top", `${d3.event.pageY+70}px`)
			// .style('border-color', get_color(d.sentiment))
			.style('border-color', get_color(d.sentiment));
			// .style('border-color', get_color(d.cluster));
	}
	var mouseleave = () => {
		Tooltip.style("opacity", 0)
	}
	var click = (d: any) => {
		const attention_interaction_group = d3.select("#self-attention-interaction");
		attention_interaction_group.style("opacity", 1);
		d3.select("#user-classification").style("display", "block");
		SideBar
			.html(
				`${'<table style="width:100%">'
						+ '<tr>'
								+ '<th>Class</th>'
								+ '<td>'}${d.cluster}</td>`
						+ '</tr>'
						+ '<tr>'
								+ '<th>Datapoint</th>'
								+ `<td>(${d.x},<br>${d.y})</td>`
						+ '</tr>'
						+ '<tr>'
								+ '<th>Sentiment</th>'
								+ `<td>${d.sentiment}</td>`
						+ '</tr>'
				+ '</table>'
				+ '<hr />'
				+ `<strong>Segment:</strong><p>${d.segment}</p>`,
			)
		window.segment = d.segment;
		if (window.last_target != undefined) {
				d3.select(window.last_target)
					.attr("r", RADIUS)
					.style("fill", get_color(Number(window.last_cluster)));
		}
		window.last_target = d3.event.currentTarget
		window.last_cluster = Number(d.cluster)
		d3.select(d3.event.currentTarget)
			.attr("r", SELECT_RADIUS)
			.style("fill", SELECT_COLOR).raise();
	}

	return [
		mouseover,
		mousemove,
		mouseleave,
		click
	]
}
