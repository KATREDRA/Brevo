var templateCard;
var trendsBullView;
sap.ui.controller("dynamicCards.cards.bullsEye", {
	onInit: function()
	{
		trendsBullView = this;	
		var bullsEyeModel =new sap.ui.model.json.JSONModel("model/bullsEye.json");
		sap.ui.getCore().setModel(bullsEyeModel, "bullsEyeModel");
		window.setTimeout(function(){
			var oVbox = trendsBullView.getView().byId("bullsEyeBoxId");
			MainView.navToCardTemplate(oVbox);
			trendsBullView.drawtreeMap();
		},1000)
		//trendsBullView.getView().byId("regionAccountsList").setModel(bullsEyeModel);
	},
	/*onAfterRendering : function(){
		window.setTimeout(function(){
			
		},100)
	},*/

	drawtreeMap:function(){
		var w = 300,
		h = 300,
		x = d3.scale.linear().range([0, w]),
		y = d3.scale.linear().range([0, h]),
		color = d3.scale.ordinal().range([' #00B300', '#f0453b','#3b48f0','#e5f03b']),
		root,
		node;

		var treemap = d3.layout.treemap()
		.round(false)
		.size([w, h])
		.sticky(true)

		.value(function(d) { return d.total; });
		var id = "#" + trendsBullView.getView().byId("bullchartContainer").sId;
		d3.select(id).select("div").remove();
		var svg = d3.select(id).append("div")
		.attr("class", "chart")
		.style("width", w + "px")
		.style("height", h + "px")
		.append("svg:svg")
		.attr("width", w)
		.attr("height", h)
		.append("svg:g")
		.attr("transform", "translate(.5,.5)");

		//d3.json("kinoko_takenoko.json", function(data) {
		d3.json("model/bullsEye.json", function(data) {
			node = root = data;
			console.log(data);
			var nodes = treemap.nodes(root)
			.filter(function(d) {return !d.children; });

			var cell = svg.selectAll("g")
			.data(nodes)
			.enter().append("svg:g")
			.attr("class", "cell")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

			cell.append("svg:rect")
			.attr("width", function(d) { return d.dx - 1; })
			.attr("height", function(d) { return d.dy - 1; })
			.style("fill", function(d) {return color(d.parent.name); });

			cell.append("svg:text")
			.attr("x", function(d) { return d.dx / 2; })
			.attr("y", function(d) { return d.dy / 2; })
			.attr("dy", "0.75rem")
			.attr("text-anchor", "middle").style("font-size", "0.7rem")
			.text(function(d) { return d.name; })
			.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

			d3.select(window).on("click", function() { zoom(root); });

			d3.select("select").on("change", function() {
				// treemap.value(this.value == "total" ? total : total).nodes(root);
				treemap.value((this.value == "total") ? total : (this.value == "building") ? building : (this.value == "ground") ? ground : cash).nodes(root);
				zoom(node);
			});
		});

		function size(d) {
			return d.size;
		}

		function total(d) {
			return d.total;
		}

		function building(d) {
			return d.building;
		}

		function ground(d) {
			return d.ground;
		}

		function cash(d) {
			return d.cash;
		}

		function count(d) {
			return 1;
		}

		function zoom(d) {
			var kx = w / d.dx, ky = h / d.dy;
			x.domain([d.x, d.x + d.dx]);
			y.domain([d.y, d.y + d.dy]);

			var t = svg.selectAll("g.cell").transition()
			.duration(d3.event.altKey ? 7500 : 750)
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

			t.select("rect")
			.attr("width", function(d) { return kx * d.dx - 1; })
			.attr("height", function(d) { return ky * d.dy - 1; });

			t.select("text")
			.attr("x", function(d) { return kx * d.dx / 2; })
			.attr("y", function(d) { return ky * d.dy / 2; })
			.style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

			node = d;
			d3.event.stopPropagation();
		}
	},

	onDeletePress : function(evt)
	{
		MainView.deleteCard(evt);
	}

});