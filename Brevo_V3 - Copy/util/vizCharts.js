jQuery.sap.declare("dynamicCards.util.vizCharts");

dynamicCards.util.vizCharts = {
	//test
	onRouteMatched: function (oEvent) {
		var args = oEvent.getParameter('arguments');
		if (args.chartIndex) { // translate url parameters by type
			var parameters = args.chartIndex;
			var index = [0],
				temp = [];
			for (var i = 0; i < parameters.length; ++i) {
				if (parameters[i] == "&") {
					index.push(i);
				}
			}
			temp.push(parameters.substring(index[0] + 10, index[1])); // chartType
			temp.push(parameters.substring(index[1] + 7, index[2])); // color
			temp.push(parameters.substring(index[2] + 9, index[3])); // popover
			temp.push(parameters.substring(index[3] + 14)); // measuredrawdonutChart
		}

		var chartIndex = temp[0];
		var colorIndex = temp[1];
		var popoverIndex = temp[2];
		var measureIndex = temp[3];

		if (chartIndex) {
			this.switchChartByIndex(chartIndex);
		};
		if (colorIndex) {
			this.switchColorByColorIndex(colorIndex);
		};
		if (popoverIndex) {
			this.switchPopoverByIndex(popoverIndex);
		};
		if (measureIndex) {
			var parameters = measureIndex;
			var index = [],
				temp = [];
			for (var j = 0; j < parameters.length; ++j) {
				if (parameters[j].toLowerCase() != parameters[j]) {
					index.push(j);
				}
			}
			for (var k = 0; k < index.length; ++k) {
				temp.push(parameters.substring(index[k], index[k + 1]));
			}

			this.switchMeasuresByIndex(temp);
		};

	},
	switchChartByIndex: function (chartIndex) {

		if (chartIndex == "Bar") {

			this.oVizFrame.setVizType('bar');
		};
		if (chartIndex == "Line") {
			this.oVizFrame.setVizType('line');
		};
		if (chartIndex == "Column") {
			this.oVizFrame.setVizType("column")
		};
		if (chartIndex == "Stacked_Column") {
			this.oVizFrame.setVizType("stacked_column")
		};
	},
	switchColorByColorIndex: function (colorIndex) {
		if (colorIndex == "Default_Color") {
			this.oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: this.colorPalette
				}
			});
		};
		if (colorIndex == "Semantic_Color") {
			this.oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: ['#d32030', '#e17b24', '#61a656', '#848f94']
				}
			});
		};

	},
	switchPopoverByIndex: function (popoverIndex) {
		if (popoverIndex == "Customer_Popover") {
			var popoverProps = {};
			this.chartPopover = new sap.viz.ui5.controls.Popover(popoverProps);

			this.chartPopover.setActionItems([{
				type: 'navigation',
				text: 'Action Item 2',
				children: [{
					text: 'subActionItem 2 - 1',
					press: function () {
						console.log('Action Item 2 - 1');
					}
				}]
			}, {
				type: 'navigation',
				text: 'Action Item 3',
				children: [{
					text: 'subActionItem 3-1',
					press: function () {
						console.log('Action Item 3 - 1');
					}
				}, {
					text: 'subActionItem 3-2',
					press: function () {
						console.log('Action Item 3 - 2');
					}
				}]
			}]);
			this.oVizFrame.attachSelectData(this.fnSwitchPop, this);
		}

		if (popoverIndex == "Default") {
			var popoverProps = {};
			this.chartPopover = new sap.viz.ui5.controls.Popover(popoverProps);

			this.chartPopover.setActionItems();
			this.oVizFrame.attachSelectData(this.fnSwitchPop, this);
		}
	},
	fnSwitchPop: function () {
		this.chartPopover.connect(this.oVizFrame.getVizUid());
	},
	switchMeasuresByIndex: function (measureIndex) {
		this.oVizFrame.destroyDataset();
		this.oVizFrame.destroyFeeds();
		var feedPrimaryValues, oDataset;
		var title;
		if (measureIndex.length == 1) {
			switch (measureIndex[0]) {
			case "Profit":
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Profit"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
						name: 'Profit',
						value: '{Profit}'
					}],
					data: {
						path: "/book"
					}
				});
				title = 'Profit by Item Category';
				break;
			case "Revenue":
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Revenue"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
						name: "Revenue",
						value: '{Revenue}'
					}],
					data: {
						path: "/book"
					}
				});
				title = 'Revenue by Item Category';
				break;
			case "Cost":
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Cost"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
						name: "Cost",
						value: "{Cost}"
					}],
					data: {
						path: "/book"
					}
				});
				title = 'Cost by Item Category';
				break;
			}
		};

		if (measureIndex.length == 2) {
			if ((jQuery.inArray("Profit", measureIndex) + 1) && (jQuery.inArray("Revenue", measureIndex) + 1)) {
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Profit", "Revenue"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
						name: 'Profit',
						value: '{Profit}'
					}, {
						name: "Revenue",
						value: '{Revenue}'
					}],
					data: {
						path: "/book"
					}
				});
				title = 'Profit and Revenue by Item Category';
			};
			if ((jQuery.inArray("Profit", measureIndex) + 1) && (jQuery.inArray("Cost", measureIndex) + 1)) {
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Profit", "Cost"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
							name: 'Profit',
							value: '{Profit}'
						},

						{
							name: "Cost",
							value: "{Cost}"
						}
					],
					data: {
						path: "/book"
					}
				});
				title = 'Profit and Cost by Item Category';
			};
			if ((jQuery.inArray("Revenue", measureIndex) + 1) && (jQuery.inArray("Cost", measureIndex) + 1)) {
				feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "primaryValues",
					'type': "Measure",
					'values': ["Revenue", "Cost"]
				});
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: 'Item Category',
						value: "{Item Category}"
					}],
					measures: [{
						name: "Cost",
						value: "{Cost}"
					}, {
						name: "Revenue",
						value: '{Revenue}'
					}],
					data: {
						path: "/book"
					}
				});
				title = 'Cost and Revenue by Item Category';
			};
		};

		if (measureIndex.length == 3) {
			feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "primaryValues",
				'type': "Measure",
				'values': ["Profit", "Cost", 'Revenue']
			});
			oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: 'Item Category',
					value: "{Item Category}"
				}],
				measures: [{
						name: 'Profit',
						value: '{Profit}'
					},

					{
						name: "Cost",
						value: "{Cost}"
					}, {
						name: "Revenue",
						value: '{Revenue}'
					}
				],
				data: {
					path: "/book"
				}
			});
			title = 'Profit and Cost and Revenue by Item Category';
		};
		var feedAxisLabels = new sap.viz.ui5.controls.common.feeds.FeedItem({
			'uid': "axisLabels",
			'type': "Dimension",
			'values': ["Item Category"]
		});
		this.oVizFrame.setVizProperties({
			title: {
				visible: true,
				text: title
			}
		});
		this.oVizFrame.setDataset(oDataset);
		this.oVizFrame.addFeed(feedPrimaryValues);
		this.oVizFrame.addFeed(feedAxisLabels);
	},
	navButtonPress: function () {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("main");
	},

	onInit: function () {
		//way 1: use the route 
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		this.colorPalette = ["#5cbae6", "#b6d957", "#fac364"];
		this.colorPaletteManul = ['#5cbae6' , '#b6d957', '#fac364'];
		var chartContainer = this.getView().byId("idChartContainer");
		chartContainer.detachContentChange()
		chartContainer
		var amModel = new sap.ui.model.json.JSONModel("ByItemCity_sum.json");
		var oDataset = new sap.viz.ui5.data.FlattenedDataset({
			dimensions: [{
				name: 'Item Category',
				value: "{Item Category}"
			}],
			measures: [{
					name: 'Profit',
					value: '{Profit}'
				},

				{
					name: "Cost",
					value: "{Cost}"
				}, {
					name: "Revenue",
					value: '{Revenue}'
				}
			],
			data: {
				path: "/book"
			}
		});
		var feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "primaryValues",
				'type': "Measure",
				'values': ["Profit", "Cost", 'Revenue']
			}),
			feedAxisLabels = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "axisLabels",
				'type': "Dimension",
				'values': ["Item Category"]
			});

		// -------- VizFrame ----------------
		this.chartPopover = this.getView().byId("idPopOver");
		this.oVizFrame = this.getView().byId("idoVizFrame");
		this.oVizFrame.setDataset(oDataset);
		this.oVizFrame.setModel(amModel);
		this.oVizFrame.addFeed(feedPrimaryValues);
		this.oVizFrame.addFeed(feedAxisLabels);
		this.oVizFrame.setVizType('bar');
		this.oVizFrame.setVizProperties({
			plotArea: {
				dataLabel: {
					visible: true
				},
				colorPalette: this.colorPalette
			},
			legend: {
				title: {
					visible: false
				}
			},
			title: {
				visible: true,
				text: 'Profit and Cost and Revenue by Item Category'
			}
		});

		var popoverProps = {};
		this.chartPopover = new sap.viz.ui5.controls.Popover(popoverProps);

		this.chartPopover.setActionItems();
		/*this.chartPopover.connect(this.oVizFrame.getVizUid());*/

	},
	attachContentChange: function (evt) {
		var itemId = evt.getParameter("selectedItemId");
		sap.m.MessageToast.show("ContentChange event was fired. Selected Item was changed to:" + itemId);
	}
}