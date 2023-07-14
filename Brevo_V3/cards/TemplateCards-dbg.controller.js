var templateCard;
var count =0;
sap.ui.controller("dynamicCards.cards.TemplateCards", {
	onAfterRendering: function()
	{
		templateCard = this;
		var oVbox = this.getView().byId("templateCardVBox");
		MainView.navToCardTemplate(oVbox);
		var chartSelected = cardTemplateThis.getView().byId("masterListId").getSelectedItem().getTitle();
		/*window.setTimeout(function() {*/
		//	var id = "#" + templateCard.getView().byId("chartContainerId").sId;
			id = "#" + templateCard.getView().getContent()[0].getItems()[2].sId;
			templateCard.drawdonutChart(id,chartSelected);
		/*},2000);*/
	},
	onDeletePress : function(evt)
	{
		MainView.deleteCard(evt);
	},

	drawdonutChart : function(id,chartSelected) {
		/*id = "#" + templateCard.getView().getContent()[0].getItems()[2].sId;
		templateCard.drawdonutChart(id,chartSelected);*/
		d3.select(id).select("svg").remove();
		var svg = dimple.newSvg(id, 400, 450);
		var myChart = new dimple.chart(svg, sap.ui.getCore().getModel("previewChartModel").oData.d.results);
		myChart.setBounds(30, 20, 250, 300);
		//var chartSelected = cardTemplateThis.getView().byId("masterListId").getSelectedItem().getTitle();
		switch(chartSelected){
		case "Stacked Area":
			var x = myChart.addCategoryAxis("x", "Sum_of_UnitCount");
			x.addOrderRule("Date");
			myChart.addMeasureAxis("y", "SumUnitCount");
			var s = myChart.addSeries("as", dimple.plot.area);
			break;
		case "Vertical Bar":
			var x = myChart.addCategoryAxis("x", "Sum_of_UnitCount");
			x.addOrderRule("Date");
			myChart.addMeasureAxis("y", "SumUnitCount");
			myChart.addSeries("SumUnitCount", dimple.plot.bar);
			break;
		case "Block Matrix":
			myChart.addCategoryAxis("x", ["Sum_of_UnitCount", "SumUnitCount"]);
			myChart.addCategoryAxis("y", "Owner");
			myChart.addSeries("SumUnitCount", dimple.plot.bar);
			break;
		case "Vertical Floating Bars":
			var x = myChart.addCategoryAxis("x", "Sum_of_UnitCount");
			x.addOrderRule("Date");
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			var s = myChart.addSeries("SumUnitCount", dimple.plot.bar);
			s.stacked = false;
			break;
		case "Vertical Stacked Bar":
			var x = myChart.addCategoryAxis("x", "SumUnitCount");
			x.addOrderRule("Date");
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			myChart.addSeries("SumUnitCount", dimple.plot.bar);
			break;
		case "Horizontal Bubble Lollipop":
			myChart.addMeasureAxis("x", "Sum_of_UnitCount");
			myChart.addCategoryAxis("y", ["Sum_of_UnitCount", "SumUnitCount"]);
			myChart.addMeasureAxis("z", "Operating Profit");
			myChart.addSeries("SumUnitCount", dimple.plot.bubble);
			break;
		case "Vertical Grouped Bubblepop":
			myChart.addCategoryAxis("x", ["Sum_of_UnitCount", "SumUnitCount"]);
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			myChart.addMeasureAxis("z", "Operating Profit");
			myChart.addSeries("SumUnitCount", dimple.plot.bubble);
			break;
		case "Grouped Multiple Line":
			var x = myChart.addCategoryAxis("x", ["Sum_of_UnitCount", "SumUnitCount"]);
			x.addGroupOrderRule("Date");
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			var s = myChart.addSeries(["SumUnitCount"], dimple.plot.line);
			s.barGap = 0.05;
			break;
		case "Horiz Grouped Lolli Pie":
			myChart.addCategoryAxis("x", ["Sum_of_UnitCount", "SumUnitCount"]);
			myChart.addMeasureAxis("y", "SumUnitCount");
			myChart.addMeasureAxis("p", "Sum_of_UnitCount");
			var pies = myChart.addSeries("SumUnitCount", dimple.plot.pie);
			pies.radius = 20;
			break;
		case "Pie Chart":
			myChart.addMeasureAxis("p", "Sum_of_UnitCount");
			myChart.addSeries("Owner", dimple.plot.pie);
			break;
		case "Ring Chart":
			myChart.addMeasureAxis("p", "Sum_of_UnitCount");
			var ring = myChart.addSeries("SumUnitCount", dimple.plot.pie);
			ring.innerRadius = "50%";
			break;
		case "Concentric Ring Chart":
			myChart.addMeasureAxis("p", "Sum_of_UnitCount");
			var outerRing = myChart.addSeries("Channel", dimple.plot.pie);
			var innerRing = myChart.addSeries("SumUnitCount", dimple.plot.pie);
			// Negatives are calculated from outside edge, positives from center
			outerRing.innerRadius = "-30px";
			innerRing.outerRadius = "-40px";
			innerRing.innerRadius = "-70px";
			break;
		case "Bubble Ring":
			var x = myChart.addCategoryAxis("x", "Month");
			x.addOrderRule("Date");
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			myChart.addSeries("SumUnitCount", dimple.plot.bubble);
			break;
		case "Vertical Lollipop":
			myChart.addMeasureAxis("x", "Sum_of_UnitCount");
			myChart.addMeasureAxis("y", "Price Monthly Change");
			myChart.addMeasureAxis("p", "Operating Profit");
			myChart.addMeasureAxis("z", "Operating Profit");
			var rings = myChart.addSeries(["Sum_of_UnitCount", "SumUnitCount"], dimple.plot.pie);
			rings.innerRadius = "80%";
			break;
		case "Horizontal Grouped Lollipop":
			myChart.addMeasureAxis("x", "Sum_of_UnitCount");
			myChart.addCategoryAxis("y", ["Sum_of_UnitCount", "SumUnitCount"]);
			myChart.addSeries("Channel", dimple.plot.bubble);
			break;
		case "Grouped Step Line":
			var x = myChart.addCategoryAxis("x", ["Sum_of_UnitCount", "SumUnitCount"]);
			x.addGroupOrderRule("Date");
			myChart.addMeasureAxis("y", "Sum_of_UnitCount");
			var s = myChart.addSeries("SumUnitCount", dimple.plot.line);
			s.interpolation = "step";
			s.barGap = 0.05;
			break;
		}

		myChart.addLegend(60, 10, 510, 20, "right");
		myChart.defaultColors = [
		                         new dimple.color("#2ecc71", "#27ae60", 1), // green
		                         new dimple.color("#3498db", "#2980b9", 1), // blue
		                         new dimple.color("#e74c3c", "#c0392b", 1), // red

		                         ];
		var textLabels = svg.append('text').attr("x", function(d) {
			return "360";
		}).attr("y", function(d) {
			return "360";
		}).text(function(d) {
			return "";
		}).attr("font-family", "sans-serif").attr("font-size", "12px")
		.attr("fill", "red");
		myChart.draw();
	},
});