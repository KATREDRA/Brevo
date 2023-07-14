jQuery.sap.declare("Brevo.BrevoDtree.util.reportchart");

Brevo.BrevoDtree.util.reportchart = {
	drawcharts: function (i, cardInfo, chartType, model, view, colorType, manualColors, filters, isPredictive) {
		/*
				if (colorType && colorType == "Semantic_Color")
					this.colorPalette = ['#d32030', '#e17b24', '#61a656', '#848f94'];
				else if (colorType && colorType == "Default_Color")
					this.colorPalette = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
				else if (colorType && colorType == "Manual_Color") {
					if (manualColors && manualColors.length > 0)
						this.colorPalette = manualColors;
				} else {
					this.colorPalette = ['#d32030', '#e17b24', '#61a656', '#848f94'];
				}
				if (typeof filters == "undefined" || filters)
					filters = [];
				if (cardInfo.isShowLabels == undefined)
					var showLabels = true
				else
					var showLabels = cardInfo.isShowLabels;
				var oVizFrame = view,
					secondAxisColor = [];
				var isPredictiveEnabled = isPredictive;
				oVizFrame.onAfterRendering = function() {
					try {
						this._render();
						if (isPredictiveEnabled) {
							d3.select("#" + oVizFrame.sId).select(".v-lines").attr("stroke-dasharray", "10,10");
						}
					} catch (e) {}
				}
				//var numContent = view;
				//var tileContent = view;
				//	tileContent.removeAllFeeds();

				oVizFrame.removeAllFeeds();

				var chartModel = model;
				//dynamicCards.util.CustomerFormatter.currencyCode = "EURO";
				var measures = [],
					measureValue = [];
				var dimensions = [];
				measures = cardInfo.measures;
				dimensions = cardInfo.dimension;
				if (chartType == "Dual Combination") {
					for (var j = 0; j < cardInfo.measures1.length; j++) {
						measures.push(cardInfo.measures1[j]);
					}
					for (var c = (this.colorPalette.length - 1); c >= 0; c--) {
						secondAxisColor.push(this.colorPalette[c]);
					}
				}
				var measuresObject = [];
				var dimensionsObject = [];
				var dataShapeForStackedCombination = [];
			//	var formatString = dynamicCards.util.CustomerFormatter.FIORI_LABEL_SHORTFORMAT_2;
				oVizFrame.setVizProperties({
					interaction: {
						selectability: {
							mode: "EXCLUSIVE"
						}
					},
					plotArea: {
						dataLabel: {
							visible: showLabels//,
						//	formatString: formatString

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
						}
					},
					categoryAxis: {
						title: {
							visible: true
						}
					},
					title: {
						visible: false,
						text: 'Profit and Cost and Revenue by Item Category'
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
						name: measures[i].value,
						value: "{path:'" + measures[i].property + "'}"
					});
					//,formatter:'dynamicCards.util.drawChartFormatter.valueFormatter'
					measureValue.push(measures[i].value);
				}
				if (!validMeasureType) {
					dataShapeForStackedCombination = ["bar", "bar", "line", "line", "line", "line"]
				}
				for (var i = 0; i < dimensions.length; i++) {
					dimensionsObject.push({
						name: dimensions[i].value,
						value: "{" + dimensions[i].property + "}"
					});
				}
				oVizFrame.setUiConfig({
					"applicationSet": "fiori"
				});
				var oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: dimensionsObject,
					measures: measuresObject,
					data: {
						path: "/",
						filters: filters
					}
				});
				oVizFrame.setModel(chartModel);
				oVizFrame.setDataset(oDataset);
				switch (chartType) {
				
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
								*/
	},

	addLinechart: function (view, model) {
		var oVizFrame = view;
		oVizFrame.removeAllFeeds();
		oVizFrame.setVizType('column');
		oVizFrame.setUiConfig({
			"applicationSet": "fiori"
		});
		//	var comodel = sap.ui.getCore().getModel("detailModel");
		var oDataset = new sap.viz.ui5.data.FlattenedDataset({
			dimensions: [{
				name: "Departments",
				value: "{Departments}"
			}],
			measures: [{
				name: "Rate",
				value: "{Price}"
			}],
			data: {
				path: "/Items"
			}
		});
		oVizFrame.setModel(comodel);
		oVizFrame.setDataset(oDataset);
		var feedvalueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "valueAxis",
				'type': "Measure",
				'values': ["Rate"]
			}),
			feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "categoryAxis",
				'type': "Dimension",
				'values': ["Departments"]
			});

		oVizFrame.addFeed(feedvalueAxis);
		oVizFrame.addFeed(feedCategoryAxis);

		oVizFrame.setVizProperties({

			title: {
				visible: true,
				text: 'Corrective Actions Completion Rate'
			},
			plotArea: {
				colorPalette: ['#4682B4'],
				dataShape: {
					primaryAxis: ["bullet"]
				}

			},
			valueAxis: {
				title: {
					visible: false,
					text: "Value Axis Value"
				}
			},
			categoryAxis: {
				title: {
					visible: false,
					text: "Category Axis Value"
				}
			},
			dataLabel: {
				visible: true,
				type: "value"
			}

		});
		/*	var oPopOver = this.getView().byId("idPopOver");
			oPopOver.connect(oVizFrame.getVizUid());*/

	}
};