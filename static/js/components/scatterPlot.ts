
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
