
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


class ScatterPlot {
	
	constructor(data, div_id, name, is_one) {
		this.is_one = (is_one == undefined) ? true : is_one;
		this.name = name;
		this.data = data;
		this.div_id = div_id;
		this.margin = {
				top:  5,
				right:  5,
				bottom:  5,
				left: 5,
			};
		this.width = 700;
		this.height = 650;
		this.vis_width = this.width - this.margins.left - this.margins.right;
		this.vis_height = this.height - this.margins.top - this.margins.bottom;
	}
	
	color_scale(x) {
		let sc = d3.scaleLinear().domain([-1,1]).range([0,1]);
		return d3.interpolateBrBG(sc(x));
	}
	
	prep_data_for_vis() {
		
	}  
	
	draw() {		
		
		
}
