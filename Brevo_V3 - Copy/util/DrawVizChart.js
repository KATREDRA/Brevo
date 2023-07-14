sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";
	return {
		getDefaultMeasureSetting: function (chartType, i) {
			switch (chartType) {
			case "Stacked Combination":
				var defaultValues = ["bar", "bar", "line", "line", "line", "line", "line", "line", "line"];
				return defaultValues[i];
			case "Bubble Chart":
			case "Bullet":
				return true;
			case "Column Chart":
			case "Stacked Column":
			case "Block Matrix":
			case "Stacked Area":
			case "Grouped Step Line":
			case "Heat Map":
			case "Scatter Chart":
			case "Line Chart":
			case "Bubble Ring":
			case "Vertical Floating Bars":
			case "Horiz Grouped Lolli Pie":
			case "Waterfall":
			default:
				return false;

			}
		},

		// draw D3  charts
		drawdonutChart: function (id, chartSelected, cardInfo, cardModel) {
			id = "#" + id;
			d3.select(id).select("svg").remove();
			var svg = dimple.newSvg(id, 450, 450);
			var myChart = new dimple.chart(svg, cardModel.oData);
			var dimensionLength = cardInfo.dimension.length;
			var measureLength = cardInfo.measures.length;

			if (jQuery.device.is.phone) {
				myChart.setBounds(60, 60, 200, 280);
				//  myChart.addLegend(30, 10, 310, 450, "left");
			} else {
				myChart.setBounds(60, 60, 250, 280);
				//  myChart.addLegend(30, 10, 350, 450, "left");
			}

			if (chartSelected == "StackedArea")
				chartSelected = "Stacked Area";
			switch (chartSelected) {
			case "Stacked Area":
				var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
				x.addOrderRule("Date");
				for (var i = 0; i < measureLength; i++) {
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var s = myChart.addSeries("as", dimple.plot.area);
					/*var s = myChart.addSeries(cardInfo.measures[i].property, dimple.plot.area, [x, y]);
          s.stacked = true;*/
				}
				break;
			case "Vertical Bar":
				var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
				x.addOrderRule("Date");
				for (var i = 0; i < measureLength; i++) {
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bar, [x, y]);
					myChart.assignColor("", "blue", "green", 1);
				}
				//myChart.addMeasureAxis("y", measureValue.getSelectedKeys()[0]);
				//myChart.addSeries(measureValue.getSelectedKeys()[0], dimple.plot.bar);

				break;
			case "Block Matrix":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", [cardInfo.dimension[0].property, cardInfo.measures[0].property]);
					var y = myChart.addCategoryAxis("y", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bar, [x, y]);
				}
				break;
			case "Vertical Floating Bars":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					x.addOrderRule("Date");
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var s = myChart.addSeries(cardInfo.measures[i].property, dimple.plot.area, [x, y]);
					s.stacked = false;
				}
				//myChart.addMeasureAxis("y", measureValue.getSelectedKeys()[0]);
				//var s = myChart.addSeries(measureValue.getSelectedKeys()[0], dimple.plot.bar);
				//s.stacked = false;
				break;
			case "Vertical Stacked Bar":
				var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
				x.addOrderRule("Date");
				for (var i = 0; i < measureLength; i++) {
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bar, [x, y]);
				}
				//myChart.addMeasureAxis("y", measureValue.getSelectedKeys()[0]);
				//myChart.addSeries(measureValue.getSelectedKeys()[0], dimple.plot.bar);
				break;
			case "Horizontal Bubble Lollipop":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					var y = myChart.addMeasureAxis("y", [cardInfo.dimension[0].property, cardInfo.measures[i].property]);
					var z = myChart.addMeasureAxis("z", cardInfo.measures[i + 1].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bubble, [x, y, z]);
				}
				break;
			case "Vertical Grouped Bubblepop":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", [cardInfo.dimension[0].property, cardInfo.measures[0].property]);
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var z = myChart.addMeasureAxis("z", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bubble, [x, y, z]);
				}
				break;
			case "Grouped Multiple Line":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					x.addGroupOrderRule("Date");
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var s = myChart.addSeries([cardInfo.measures[i].property], dimple.plot.line, [x, y]);
					s.barGap = 0.05;
				}
				break;
			case "Horiz Grouped Lolli Pie":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var p = myChart.addMeasureAxis("p", cardInfo.measures[i].property);
					var pies = myChart.addSeries(cardInfo.measures[i].property, dimple.plot.pie, [x, y, p]);
					pies.radius = 20;
				}
				break;
			case "Pie Chart":
				myChart.addMeasureAxis("p", cardInfo.dimension[0].property);
				myChart.addSeries(cardInfo.dimension[0].property, dimple.plot.pie);

				break;
			case "Ring Chart":
				myChart.addMeasureAxis("p", cardInfo.dimension[0].property);
				var ring = myChart.addSeries(cardInfo.measures[0].property, dimple.plot.pie);
				ring.innerRadius = "50%";
				break;
			case "Concentric Ring Chart":
				myChart.addMeasureAxis("p", cardInfo.dimension[0].property);
				var outerRing = myChart.addSeries(cardInfo.dimension[0].property, dimple.plot.pie);
				var innerRing = myChart.addSeries(cardInfo.measures[0].property, dimple.plot.pie);
				// Negatives are calculated from outside edge, positives from center
				outerRing.innerRadius = "-30px";
				innerRing.outerRadius = "-40px";
				innerRing.innerRadius = "-70px";
				break;
			case "Bubble Ring":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					x.addOrderRule("Date");
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bubble, [x, y]);
				}
				break;
			case "Vertical Lollipop":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					//myChart.addMeasureAxis("p", dimensionValue.getSelectedKeys()[0]);
					//myChart.addMeasureAxis("z", measureValue.getSelectedKeys()[i]);
					var rings = myChart.addSeries(cardInfo.measures[i].property, dimple.plot.pie, [x, y]);
					rings.innerRadius = "80%";
				}
				break;
			case "Horizontal Grouped Lollipop":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					myChart.addSeries(cardInfo.measures[i].property, dimple.plot.bubble, [x, y]);
				}
				break;
			case "Grouped Step Line":
				for (var i = 0; i < measureLength; i++) {
					var x = myChart.addCategoryAxis("x", cardInfo.dimension[0].property);
					x.addGroupOrderRule("Date");
					var y = myChart.addMeasureAxis("y", cardInfo.measures[i].property);
					var s = myChart.addSeries(cardInfo.measures[i].property, dimple.plot.line, [x, y]);
					s.interpolation = "step";
					s.barGap = 0.05;
				}
				break;
			}
			myChart.defaultColors = [
				new dimple.color("#90EE90", "#90EE90", 1), // green
				new dimple.color("#ADD8E6", "#ADD8E6", 1), // blue
				new dimple.color("#FC5A5E", "#FC5A5E", 1), // red

			];
			var textLabels = svg.append('text').attr("x", function (d) {
					return "360";
				}).attr("y", function (d) {
					return "360";
				}).text(function (d) {
					return "";
				}).attr("font-family", "sans-serif").attr("font-size", "12px")
				.attr("fill", "red");
			return myChart;

		},
		//To draw the Google Maps
		loadGeoMap: function (model, view) {
			var data = model.getData().data;
			var regionDimension = model.getData().dimension;
			var regionmeasures = model.getData().measures;
			if (regionDimension && regionDimension.length > 0)
				regionDimension = regionDimension[0].property;
			else
				return;
			if (regionmeasures && regionmeasures.length > 0)
				regionmeasures = regionmeasures[0].property;
			else
				return;
			var mapData = [
				[regionDimension, regionmeasures]
			];
			for (var i = 0; i < data.length; i++) {
				mapData.push([data[i][regionDimension], data[i][regionmeasures]])
			}
			var mapData = google.visualization.arrayToDataTable(mapData);
			var colorType = model.getData().selectedChartColor;
			var color = '#154360';
			if (colorType && colorType == "Semantic_Color")
				color = '#154360';
			else if (colorType && colorType == "Default_Color")
				color = "#748CB2";
			else if (colorType && colorType == "Manual_Color") {
				if (cardInfo.manualColors && cardInfo.manualColors.length > 0)
					color = cardInfo.manualColors[0];
			}
			var options = {
				colorAxis: {
					colors: [color]
				},
				animation: {
					"startup": true
				}
			};
			window.setTimeout(function () {
				var chart = new google.visualization.GeoChart(document.getElementById(view.sId));
				chart.draw(mapData, options);
			}, 1000);
		},
		valueFormatter: function (num) {
			if (num && num != null) {
				try {
					num = parseFloat(num);
				} catch (E) {
					return num;
				}
				var digits = 2;
				var si = [{
						value: 1E18,
						symbol: "E"
					}, {
						value: 1E15,
						symbol: "P"
					}, {
						value: 1E12,
						symbol: "T"
					}, {
						value: 1E9,
						symbol: "G"
					}, {
						value: 1E6,
						symbol: "M"
					}, {
						value: 1E3,
						symbol: "k"
					}],
					rx = /\.0+$|(\.[0-9]*[1-9])0+$/,
					i;
				for (i = 0; i < si.length; i++) {
					if (num >= si[i].value) {
						return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
					}
				}
				return num.toFixed(digits).replace(rx, "$1");
			} else {
				return num;
			}
		},

		abbreviateNumber: function (number) {
			var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
			// what tier? (determines SI symbol)
			var tier = Math.log10(number) / 3 | 0;

			// if zero, we don't need a suffix
			if (tier == 0) return number;

			// get suffix and determine scale
			var suffix = SI_SYMBOL[tier];
			var scale = Math.pow(10, tier * 3);

			// scale the number
			var scaled = number / scale;

			// format number and add suffix
			return scaled.toFixed(2) + suffix;
		},
		drawNumericCharts: function (cardModel, view) {
			var cardInfo = cardModel.getData();
			var measures = cardInfo.measures;
			var value1 = cardInfo["data"][0][measures[0].property];
			view.getItems()[0].setValue(this.abbreviateNumber(value1));
			if (measures.length > 1) {
				view.getItems()[1].setVisible(true);
				var value2 = cardInfo["data"][0][measures[1].property];
				view.getItems()[1].setValue(this.abbreviateNumber(value2));
			} else {
				view.getItems()[1].setVisible(false);
			}
		},
		//To draw the Viz charts
		colorPalette: ['#00537e', '#537f9f', '#7da4c3', '#a7cae7', '#bddefa'],
		drawVizCharts: function (cardModel, view) {
			var cardInfo = cardModel.getData();
			var chartType = cardInfo.cardType;
			var colorType = cardInfo.selectedChartColor;
			var filters = cardInfo.filters;
			var isPredictive = cardInfo.isPredictive;

			if (colorType && colorType == "Semantic_Color")
				this.colorPalette = ['#00537e', '#537f9f', '#7da4c3', '#a7cae7', '#bddefa'];
			else if (colorType && colorType == "Default_Color")
				this.colorPalette = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
			else if (colorType && colorType == "Manual_Color") {
				if (cardInfo.manualColors && cardInfo.manualColors.length > 0)
					this.colorPalette = cardInfo.manualColors;
			} else {
				this.colorPalette = ['#00537e', '#537f9f', '#7da4c3', '#a7cae7', '#bddefa'];
			}
			if (typeof filters == "undefined" || filters)
				filters = [];
			if (cardInfo.isShowLabels == undefined)
				var showLabels = true;
			else
				var showLabels = cardInfo.isShowLabels;
			var oVizFrame = view;
			if (cardInfo.decimalValue)
				this.decimalValue = cardInfo.decimalValue;
			else
				this.decimalValue = 0;
			var formatString = "",
				popOverFormat = "#,##,###",
				valueString = "0u"; // DashboardBuilder.util.CustomerFormatter.FIORI_LABEL_SHORTFORMAT_2;
			if (false && chartType == "Donut Chart" || chartType == "Pie Chart") {
				//formatString = dynamicCards.util.CustomerFormatter.FIORI_PERCENTAGE_FORMAT_2;
			} else {
				if (false && cardInfo.measureFormat == "short") {
					//	formatString = dynamicCards.util.drawChartFormatter.formatValueDecimal(cardInfo.decimalValue) + "u";
				} else if (false && cardInfo.measureFormat == "percent") {
					//	formatString = dynamicCards.util.drawChartFormatter.formatValueDecimal(cardInfo.decimalValue) + "%";
					//	popOverFormat = dynamicCards.util.drawChartFormatter.formatValueDecimal(cardInfo.decimalValue) + "%";
					//	valueString = "0%"
				} else {
					//	formatString = "";
				}
			}
			var isPredictiveEnabled = isPredictive;
			oVizFrame.onAfterRendering = function () {
				try {
					this._render();
					if (isPredictiveEnabled) {
						d3.select("#" + oVizFrame.sId).select(".v-lines").attr("stroke-dasharray", "10,10");
					}
				} catch (e) {}
			}
			oVizFrame.removeAllFeeds();
			var measures = [],
				measureValue = [];
			var dimensions = [];
			var measuresObject = [];
			var dimensionsObject = [];
			measures = cardInfo.measures;
			dimensions = cardInfo.dimension;

			var dataShapeForStackedCombination = [];
			try {
				if (cardInfo.customMeasures.length > 0) {
					for (var c = 0; c < cardInfo.customMeasures.length; c++) {
						measures.push(cardInfo.customMeasures[c]);
					}
				}
			} catch (e) {}
			var measureSelected = "",
				dimensionSelected = "";
			for (var i = 0; i < measures.length; i++) {
				if (i == 0)
					measureSelected = measures[i].COLUMN_NAME ? measures[i].COLUMN_NAME : measures[i].property;
				else
					measureSelected += " & " + measures[i].COLUMN_NAME ? measures[i].COLUMN_NAME : measures[i].property;
			}
			if (!validMeasureType) {
				dataShapeForStackedCombination = ["bar", "bar", "line"]
			}
			for (var i = 0; i < dimensions.length; i++) {
				if (i == 0)
					dimensionSelected = dimensions[i].COLUMN_NAME ? dimensions[i].COLUMN_NAME : dimensions[i].property;
				else
					dimensionSelected += " & " + dimensions[i].COLUMN_NAME ? dimensions[i].COLUMN_NAME : dimensions[i].property;
			}

			if (cardInfo.xAxisLabel) {
				var categoryAxisLabel = {
					visible: true,
					text: cardInfo.xAxisLabel
				};
			} else {
				var categoryAxisLabel = {
					visible: true,
					text: dimensionSelected
				};
			}
			if (cardInfo.yAxisLabel) {
				var valueAxisLabel = {
					visible: true,
					text: cardInfo.yAxisLabel
				};
			} else {
				var valueAxisLabel = {
					visible: true,
					text: measureSelected
				};
			}
			oVizFrame.setVizProperties({
				general: {
					layout: {
						padding: 5
					}
				},
				interaction: {
					selectability: {
						mode: "EXCLUSIVE"
					}
				},
				plotArea: {
					window: {
						start: {
							valueAxis: null,
							valueAxis2: null
						},
						end: {
							valueAxis: null,
							valueAxis2: null
						}
					},
					dataLabel: {
						visible: showLabels,
						formatString: formatString
					},
					background: {
						drawingEffect: "glossy"
					},
					gridline: {
						visible: false
					},
					colorPalette: this.colorPalette
				},
				legendGroup: {
					layout: {
						position: "bottom"
					}
				},
				legend: {
					title: {
						visible: false
					},
					ignoreNoValue: true,
					isScrollable: false
				},
				categoryAxis: {
					title: categoryAxisLabel
				},
				valueAxis: {
					label: {
						formatString: valueString,
						unitFormatType: "FinancialUnits"
					},
					title: valueAxisLabel
				},
				/*categoryAxis: {
					title: {
						visible: true
					}
				},*/
				title: {
					visible: false,
				}
			});
			var validMeasureType = true;
			for (var i = 0; i < measures.length; i++) {
				if (measures[i].measureType && measures[i].measureType.length > 0) {
					dataShapeForStackedCombination.push(measures[i].measureType)
				} else {
					validMeasureType = false;
				}
				measuresObject.push({
					name: measures[i].LABEL ? measures[i].LABEL : measures[i].value,
					value: "{path:'" + (measures[i].COLUMN_NAME ? measures[i].COLUMN_NAME : measures[i].property) + "'}",
					//formatter: formatter
				});
				measureValue.push(measures[i].LABEL ? measures[i].LABEL : measures[i].value, );
			}
			if (!validMeasureType) {
				dataShapeForStackedCombination = ["bar", "bar", "line"];
			}
			var dateFields = [];
			for (var i = 0; i < dimensions.length; i++) {
				if (dimensions[i].COLUMN_NAME && dimensions[i].COLUMN_NAME.toUpperCase().indexOf("DATE") > -1) {
					for (var j = 0; j < cardModel.oData["data"].length; j++) {
						var d = cardModel.oData["data"][j][dimensions[i].COLUMN_NAME];
						if (d) {
							d = d.replace("/", "").replace("Date", "").replace("(", "").replace(")", "").replace("/", "");
							d = parseInt(d);
							var date = new Date(d);
							var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
								format: "MMMd"
							});
							if (!isNaN(date.getTime()))
								d = oDateFormat.format(new Date(d));
							else
								d = d;
							cardModel.oData["data"][j][dimensions[i].COLUMN_NAME] = d;
						}
					}
				}
				dimensionsObject.push({
					name: dimensions[i].LABEL,
					value: "{" + (dimensions[i].COLUMN_NAME ? dimensions[i].COLUMN_NAME : dimensions[i].property) + "}"
				});
			}
			oVizFrame.setUiConfig({
				"applicationSet": "fiori"
			});

			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: dimensionsObject,
				measures: measuresObject,
				data: {
					path: "/data",
					filters: filters
				}
			});
			oVizFrame.setModel(cardModel);
			oVizFrame.setDataset(oDataset);

			switch (chartType) {
			case "Heat Map":
				oVizFrame.setVizType('heatmap');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "color",
						'type': "Measure",
						'values': [measuresObject[0].name]
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					}),
					feedValueAxis2 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis2",
						'type': "Dimension",
						'values': [dimensionsObject[1].name]
					});
				oVizFrame.addFeed(feedValueAxis1);
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis2);

				break;
			case "Waterfall":
				oVizFrame.setVizType('waterfall');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': [measuresObject[0].name]
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					}),
					feedValueAxis2 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "waterfallType",
						'type': "Dimension",
						'values': [dimensionsObject[1].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				oVizFrame.addFeed(feedValueAxis2);
				break;
			case "Bullet":
				oVizFrame.setVizType('vertical_bullet');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "actualValues",
						'type': "Measure",
						'values': [measuresObject[0].name]
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "targetValues",
						'type': "Measure",
						'values': [measuresObject[1].name]
					}),
					feedValueAxis2 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				oVizFrame.addFeed(feedValueAxis2);
				break;
			case "Column Chart":
				oVizFrame.setVizType('column');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Bar Chart":
				oVizFrame.setVizType('bar');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Stacked Column":
				oVizFrame.setVizType('stacked_column');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Stacked Bar":
				oVizFrame.setVizType('stacked_bar');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Stacked Combination":
				oVizFrame.setVizType('stacked_combination');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				oVizFrame.setVizProperties({
					plotArea: {
						dataShape: {
							primaryAxis: dataShapeForStackedCombination

						}
					}
				});

				break;
			case "Scatter Chart":
				oVizFrame.setVizType('scatter');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': [measuresObject[0].name]
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis2",
						'type': "Measure",
						'values': [measuresObject[1].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Bubble Chart":
				oVizFrame.setVizType('bubble');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': [measuresObject[0].name]
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis2",
						'type': "Measure",
						'values': [measuresObject[1].name]
					}),
					feedValueAxis2 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "bubbleWidth",
						'type': "Measure",
						'values': [measuresObject[2].name]
					});

				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				oVizFrame.addFeed(feedValueAxis2);
				break;
			case "Line Chart":
				oVizFrame.setVizType('line');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "valueAxis",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "categoryAxis",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Donut Chart":
				oVizFrame.setVizType('donut');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "size",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "color",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			case "Pie Chart":
				oVizFrame.setVizType('pie');
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "size",
						'type': "Measure",
						'values': measureValue
					}),
					feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': "color",
						'type': "Dimension",
						'values': [dimensionsObject[0].name]
					});
				oVizFrame.addFeed(feedColor);
				oVizFrame.addFeed(feedValueAxis1);
				break;
			}

			var oPopOver = new sap.viz.ui5.controls.Popover({});

			oPopOver.connect(oVizFrame.getVizUid());
			if (oPopOver)
				oPopOver.addStyleClass("sapContrastPlus");
			//oPopOver.setFormatString(popOverFormat);
			var children = [{
				type: 'action',
				text: "Drilldown By :"
			}];

			for (var i = 0; i < cardInfo.measures.length; i++) {

				children.push({
					type: 'action',
					text: cardInfo.measures[i].value,
					press: function (evt) {

					}
				});

			}
			oPopOver.setActionItems(children);

		},
		formatValueDecimal: function (value) {
			if (value === undefined) return "0";
			else {
				var decimal = parseInt(value),
					format = "#";
				if (decimal === 0) return format;
				else {
					//for (var i = 0; i < decimal.length; i++) {
					for (var i = 0; i < (decimal - 1); i++) {
						format += "#";
					}
					return "#." + format;
				}
			}
		}
	}
});