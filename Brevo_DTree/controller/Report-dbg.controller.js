sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/BrevoDtree/model/Service",
	"Brevo/BrevoDtree/util/Formatter",
	"Brevo/BrevoDtree/util/CustomerFormatter",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox"
], function (Controller, service, Formatter, CustomerFormatter, History, MessageBox) {
	"use strict";

	return Controller.extend("Brevo.BrevoDtree.controller.Report", {

		onInit: function () {
			var that = this;
			var bus = sap.ui.getCore().getEventBus();
			if (!that.vizCard)
				that.vizCard = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.vizChart", this);
			bus.subscribe("treeData", "Report", function (channel, evt, data) {
				that.selectVariantobject = data.variant;
				that.scenarioInfo = JSON.parse(decodeURIComponent(escape(window.atob(data.scenario.ScenConfig))));
				that.varianceInfo = JSON.parse(decodeURIComponent(escape(window.atob(data.scenario.VariantSettings))));
				var variants = data.scenario.Variants;
				var newvariant = [{
					VariantId: "101",
					VariantName: "Actual Model"
				}, {
					VariantId: "102",
					VariantName: "Forecast"
				}];
				var allVariants = variants.concat(newvariant);
				that.getView().byId("variantId").setModel(new sap.ui.model.json.JSONModel(allVariants));
				coolGrids.init();
				coolGrids.drawGrids(null);
				that.getMeasuresandDimensions();
				that.CreateCommonUrl();
				that.keyInfluencerforScenario();
				var variants = that.getView().byId("variantId").getItems();
				var selectedvariants = [];
				for (var i = 0; i < variants.length; i++) {
					if (variants[i].getKey() == "101" || variants[i].getKey() == data.variant.VariantId) {
						selectedvariants.push(variants[i].getKey());
					}
				}
				that.getView().byId("forecaste").setVisible(false);
				that.getView().byId("variantId").setSelectedKeys(selectedvariants);
				var variantid = data.variant.VariantId + "," + 101;
				var forcast = false,
					orginalmodel = true,
					dateField = that.varianceInfo.timeDimension,
					numOfMonths = 0;
				// that.setDatesValue();
				// var year = that.getView().byId("years").getSelectedKey();
				// var diffInMonths = Formatter.getDifferenceInMonths(quater, year);

				that.onCompareSelectedVariant(variantid, forcast, orginalmodel, dateField, numOfMonths);

			});
		},
		// create common url
		CreateCommonUrl: function () {
			var scenarioInfo = this.scenarioInfo;
			var varianceInfo = this.varianceInfo;
			var measures = "",
				dimensions = "";
			for (var i = 0; i < scenarioInfo.measures.length; i++) {
				if (i == 0) measures = scenarioInfo.measures[i];
				else measures += "," + scenarioInfo.measures[i];
			}
			for (var j = 0; j < scenarioInfo.dimension.length; j++) {
				if (j === 0) dimensions = scenarioInfo.dimension[j];
				else dimensions += "," + scenarioInfo.dimension[j];
			}
			var properties = measures + "," + dimensions;

			if (varianceInfo.timeDimension.length > 0) {
				this.commomParametersUrl = "&select=" + measures + "," + dimensions + "&target=" + scenarioInfo.Entity + "&time=" + varianceInfo.timeDimension +
					"&year=" + varianceInfo.timePeriod;
			} else {
				this.commomParametersUrl = "&select=" + measures + "," + dimensions + "&target=" + scenarioInfo.Entity;
			}
		},

		keyInfluencerforScenario: function () {
			var that = this;
			var scenarioInfo = that.scenarioInfo;
			var varianceInfo = that.varianceInfo;
			var scenUrl = "Report_KeyInfluencers?view=" + that.scenarioInfo.serviceURL + "&variantID=" + that.selectVariantobject
				.VariantId;

			service.callService("TargetInfluencerModel", "TargetInfluencerModel", scenUrl, "IMS", true, "", function (evt, flag) {
				var data = sap.ui.getCore().getModel("TargetInfluencerModel");
				that.getView().byId("targetInfluencerId").setModel(data);
				var properties = {
					'title': {
						'text': 'Key influencers for ' + that.scenarioInfo.Entity
					}
				};
				that.getView().byId("targetInfluencerId").setVizProperties(properties);
				// that.scenarioData();
			});
		},

		getMeasuresandDimensions: function () {
			var that = this;
			var url = "FileUploader/Tables?FileName=" + that.scenarioInfo.serviceURL;

			service.callService("MeasuredimensionModel", "MeasuredimensionModel", url, "IMS", true, "", function (evt, flag) {
				if (evt.getParameters().success) {
					var data = sap.ui.getCore().getModel("MeasuredimensionModel");
					that.getView().byId("MeasuresId").setModel(new sap.ui.model.json.JSONModel(data.getData()["MEASURES"]));
					that.getView().byId("DimensionsId").setModel(new sap.ui.model.json.JSONModel(data.getData()["DIMENSIONS"]));
					var selectedmeasures = [];
					var measure = data.getData().MEASURES;
					for (var j = 0; j < that.scenarioInfo.measures.length; j++) {
						for (var x = 0; x < measure.length; x++) {
							if (that.scenarioInfo.measures[j] == measure[x]) {
								selectedmeasures.push(that.scenarioInfo.measures[j]);
							}
						}
					}
					that.getView().byId("MeasuresId").setSelectedKeys(selectedmeasures);
					that.handleMeasureDimensionSelection();
					var dimension = data.getData().DIMENSIONS;
					for (var j = 0; j < dimension.length; j++) {
						if (that.scenarioInfo.dimension[0] == dimension[j]) {
							that.getView().byId("DimensionsId").setSelectedKey(dimension[j]);
							break;
						}
					}
				} else {
					MessageBox.error("Data Loading Failed")
				}

			});
		},

		handlevariantsSelection: function (evt) {
			var that = this;
			var selecteditem = this.getView().byId("variantId").getSelectedKeys();
			if (selecteditem.length > 2) {
				evt.getSource().getParent().getFields()[0].removeSelectedItem(evt.getParameters().changedItem)
				sap.m.MessageToast.show("Select minimum 2 variants");
			} else if (selecteditem.length != 2) {
				this.getView().byId("forecaste").setVisible(false);
				this.getView().byId("chartContainer").setVisible(false);
				this.getView().byId("InfluencerContainer").setVisible(false);
				sap.m.MessageToast.show("Select minimum 2 variants");
			} else {
				var forcast = false,
					orginalmodel = false,
					variantid;
				// var year = this.getView().byId("years").getSelectedKey();
				var numOfMonths = this.getView().byId("floatSlider").getValue();
				// var quater = Formatter.getQuater(getQuartervalue, that);
				// var diffInMonths = Formatter.getDifferenceInMonths(getQuartervalue, year);
				if ((selecteditem[0] == "101" && selecteditem[1] == "102") || (selecteditem[1] == "101" && selecteditem[0] == "102")) {
					forcast = true;
					orginalmodel = true;
					this.getView().byId("forecaste").setVisible(true);
				} else if (selecteditem[0] == "102" || selecteditem[1] == "102") {
					forcast = true;
					this.getView().byId("forecaste").setVisible(true);
				} else if (selecteditem[0] == "101" || selecteditem[1] == "101") {
					orginalmodel = true;
				}
				variantid = selecteditem[0] + "," + selecteditem[1];
				// this.getView().setBusy(true);
				this.onCompareSelectedVariant(variantid, forcast, orginalmodel, this.varianceInfo.timeDimension, numOfMonths);
			}
		},

		// compare 2 variants
		onCompareSelectedVariant: function (variants, forecast, model, datefield, numberOfMonths) {
			var that = this;
			var compareUrl;
			var isDateFieldPresentToForecast = false;

			if (forecast == true && model == true) {
				if (datefield.length > 0 && numberOfMonths >= 0) {
					isDateFieldPresentToForecast = true;
					compareUrl = "Report_VariantComparision?view=" + that.scenarioInfo.serviceURL + "&variantID=" + that.selectVariantobject.VariantId +
						"," + variants + "&Date=" + datefield + "&Month=" + numberOfMonths;
				} else {
					compareUrl = "Report_VariantComparision?view=" + that.scenarioInfo.serviceURL + "&variantID=" + variants;
					isDateFieldPresentToForecast = false;
				}

			} else if (forecast == true) {
				if (datefield.length > 0 && numberOfMonths >= 0) {
					isDateFieldPresentToForecast = true;
					compareUrl = "Report_VariantComparision?view=" + that.scenarioInfo.serviceURL + "&variantID=" + variants +
						"&Date=" + datefield + "&Month=" + numberOfMonths;
				} else {
					compareUrl = "Report_VariantComparision?view=" + that.scenarioInfo.serviceURL + "&variantID=" + variants;
					isDateFieldPresentToForecast = false;
				}
			} else {
				compareUrl = "Report_VariantComparision?view=" + that.scenarioInfo.serviceURL + "&variantID=" + variants;
				isDateFieldPresentToForecast = true;
			}
			var temp = compareUrl.split("variantID=")[1];
			that.selectedvariantid = temp.split("&select=")[0];
			// that.selectedvariantid = temp.split("&select=")[0] + "&year1=" + year + "&Quarter1=" + quater;
			that.getView().setBusy(true);

			if (isDateFieldPresentToForecast) {
				service.callService("compareModel", "compareModel", compareUrl, "IMS", true, "", function (evt, flag) {
					that.getView().setBusy(false);
					if (evt.getSource().getData() != "Forecasting of data is not possible.") {
						that.getView().byId("chartContainer").setVisible(true);
						// that.getView().byId("InfluencerContainer").setVisible(true);
						var compareModel = sap.ui.getCore().getModel("compareModel");
						that.variantCompareChart(compareModel);
						that.variantCompareTable(compareModel);
					} else {
						sap.m.MessageToast.show("Forecasting of data is not possible.");
						that.getView().byId("forecaste").setVisible(false);
						that.getView().byId("chartContainer").setVisible(false);
						that.getView().byId("InfluencerContainer").setVisible(false);
					}
				});
			} else {
				that.getView().setBusy(false);
				sap.m.MessageToast.show("Forecasting of data is not possible.");
				that.getView().byId("forecaste").setVisible(false);
				that.getView().byId("chartContainer").setVisible(false);
				that.getView().byId("InfluencerContainer").setVisible(false);
			}

		},

		variantCompareTable: function (value) {
			var oTable = this.getView().byId("variantTableId");
			oTable.removeAllColumns();
			// var columnArr=[];
			for (var b = 0; b < Object.keys(value.oData[0]).length; b++) {
				oTable.addColumn(new sap.m.Column({
					width: "2em",
					header: new sap.m.Label({
						text: Object.keys(value.oData[0])[b]
					})
				}));
			}

			oTable.bindItems("/", new sap.m.ColumnListItem({
				cells: [new sap.m.Text({
					text: "{" + Object.keys(value.oData[0])[0] + "}"
				}), new sap.m.Text({
					text: "{" + Object.keys(value.oData[0])[1] + "}"
				}), new sap.m.Text({
					text: "{" + Object.keys(value.oData[0])[2] + "}"
				}), ]
			}));

			oTable.setModel(new sap.ui.model.json.JSONModel(value.oData));

		},

		variantCompareChart: function (value) {
			var variant1 = this.getView().byId("variantId").getSelectedItems()[0].getBindingContext().getObject().VariantName;
			var variant2 = this.getView().byId("variantId").getSelectedItems()[1].getBindingContext().getObject().VariantName;
			var oVizFrame = this.getView().byId("variantCompareChart");
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(value.oData);
			oVizFrame.removeAllFeeds();
			oVizFrame.setVizProperties({
				interaction: {
					selectability: {
						mode: "EXCLUSIVE"
					}
				},
				plotArea: {
					dataLabel: {
						visible: true,
						formatString: CustomerFormatter.FIORI_LABEL_SHORTFORMAT_2
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
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: true
					}
				},
				title: {
					visible: true,
					text: "Comparision for " + variant1 + " and " + variant2
				}
			});

			// 3. Create Viz dataset to feed to the data to the graph
			var measures = Object.keys(value.oData[0]),
				measureValue = [],
				measuresObject = [];
			for (var i = 1; i < measures.length; i++) {
				measuresObject.push({
					name: measures[i],
					value: "{path:'" + measures[i] + "'}"
				});
				measureValue.push(measures[i]);
			}
			var dimensions = Object.keys(value.oData[0])[0],
				dimensionsObject = [];
			// for (var i = 0; i < dimensions.length; i++) {
			dimensionsObject.push({
				name: dimensions,
				value: "{" + dimensions + "}"
			});
			// }
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: dimensionsObject,
				measures: measuresObject,
				data: {
					path: "/"
				}
			});
			oVizFrame.setDataset(oDataset);
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

			oVizFrame.setModel(oModel);
			oVizFrame.setVizType('column');
			// 4.Set Viz properties
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range()
				}
			});
		},

		onNavBack: function () {
			var that = this
			that.getView().byId("forecaste").setVisible(false);
			that.getView().byId("variantId").setModel(new sap.ui.model.json.JSONModel([]));
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = UIComponent.getRouterFor(this);
				oRouter.navTo("treeView", {}, true);
			}
		},

		Dynamiccharts: function (data, key, count) {
			this.vizCard = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.vizChart", this);
			var cardId = coolGrids.addCard(sap.ui.getCore().getModel("scenariomodel").oData, count);

			var scenariomodel = sap.ui.getCore().getModel("scenariomodel");

			var oVizFrame = this.vizCard.getItems()[2].getContent()[0].getContent();
			var oModel = new sap.ui.model.json.JSONModel();
			this.colorPalette = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
			oModel.setData(data);
			oVizFrame.setVizProperties({
				interaction: {
					selectability: {
						mode: "EXCLUSIVE"
					}
				},
				plotArea: {
					dataLabel: {
						visible: true,
						formatString: CustomerFormatter.FIORI_LABEL_SHORTFORMAT_2
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
					text: "Measures for " + key
				}
			});
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: 'Dimension_Value',
					value: "{Dimension_Value}"
				}],

				measures: [{
					name: 'Value',
					value: '{Value}'
				}],

				data: {
					path: "/"
				}
			});
			oVizFrame.setDataset(oDataset);
			oVizFrame.setModel(oModel);
			oVizFrame.setVizType('bar');
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range()
				}
			});

			var feedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "valueAxis",
					'type': "Measure",
					'values': ["Value"]
				}),
				feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "categoryAxis",
					'type': "Dimension",
					'values': ["Dimension_Value"]
				});
			oVizFrame.addFeed(feedValueAxis);
			oVizFrame.addFeed(feedCategoryAxis);

			this.vizCard.placeAt(cardId, "only");
			try {
				this.vizCard.getItems()[2].getContent()[0].getContent().setHeight($("#" + cardId).height() - 88 + "px");
			} catch (e) {
				// It's not a viz card
			}

			this.vizCard.getItems()[2].setTitle(key);
		},
		onFullScreenPress: function (evt) {
			evt.getSource().getParent().getParent().getItems()[2].setFullScreen(true);
		},
		handleMeasureDimensionSelection: function () {
			var that = this;
			var measures = that.getView().byId("MeasuresId").getSelectedItems();
			try {
				var dimensions = that.getView().byId("DimensionsId").getSelectedItem().getText();
			} catch (e) {
				dimensions = that.getView().byId("DimensionsId").getItems()[0].getText();
			}
			if (measures.length <= 0) {
				that.getView().byId("InfluencerContainer").setVisible(false);
				/* that.getView().byId("keyInfluencerchartId").setVisible(false); */
				sap.m.MessageToast.show("Select minimum 1 measure");
			} else {
				that.getView().byId("InfluencerContainer").setVisible(true);
				var selectionType = that.getView().byId("SelectedTypeId").getSelectedKey();
				if (selectionType == "column") {
					that.getView().byId("keyInfluencerchartId").setVizType("column");
				} else if (selectionType == "line") {
					that.getView().byId("keyInfluencerchartId").setVizType("line");
				} else {
					that.getView().byId("keyInfluencerchartId").setVizType("bar");
				}
				var selectMeasure;
				for (var i = 0; i < measures.length; i++) {
					if (i == 0)
						selectMeasure = measures[i].getText();
					else
						selectMeasure += "," + measures[i].getText();
				}
				that.getView().setBusy(true);
				var Url = "Report_MeasureDimensionSelection?view=" + this.scenarioInfo.serviceURL + "&variantID=" + that.selectedvariantid +
					"&target=" + that.scenarioInfo.Entity + "&selectD=" + dimensions + "&selectM=" + selectMeasure;

				service.callService("keyModel", "keyModel", Url, "IMS", true, "", function (evt, flag) {
					that.getView().setBusy(false);
					if (evt.getSource().oData != "Forecasting of data is not possible.") {
						var keyModel = sap.ui.getCore().getModel("keyModel");
						that.ViewChartype();
						that.ViewTabletype();
					} else {
						sap.m.MessageToast.show("Forecasting of data is not possible.");
						that.getView().byId("forecaste").setVisible(false);
						that.getView().byId("chartContainer").setVisible(false);
						that.getView().byId("InfluencerContainer").setVisible(false);
					}

				});
			}
		},
		ViewChartype: function () {
			var measure = sap.ui.getCore().getModel("keyModel").oData;
			var oVizFrame = this.getView().byId("keyInfluencerchartId")
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(measure);
			oVizFrame.removeAllFeeds();
			oVizFrame.setVizProperties({
				interaction: {
					selectability: {
						mode: "EXCLUSIVE"
					}
				},
				plotArea: {
					dataLabel: {
						visible: true,
						formatString: CustomerFormatter.FIORI_LABEL_SHORTFORMAT_2
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
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: true
					}
				},
				title: {
					visible: false,
					text: "key Influencer "
				}
			});
			var measures = Object.keys(measure[0]),
				measureValue = [],
				measuresObject = [];
			for (var i = 1; i < measures.length; i++) {
				measuresObject.push({
					name: measures[i],
					value: "{" + measures[i] + "}"
				});
				measureValue.push(measures[i]);
			}
			var dimensions = Object.keys(measure[0])[0],
				dimensionValue = [],
				dimensionsObject = [];

			dimensionsObject.push({
				name: dimensions,
				value: "{" + dimensions + "}"
			});
			dimensionValue.push(dimensions);
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: dimensionsObject,
				measures: measuresObject,
				data: {
					path: "/"
				}
			});
			oVizFrame.setDataset(oDataset);
			var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "valueAxis",
					'type': "Measure",
					'values': measureValue
				}),
				feedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "categoryAxis",
					'type': "Dimension",
					'values': dimensionValue
				});

			oVizFrame.addFeed(feedColor);
			oVizFrame.addFeed(feedValueAxis1);
			oVizFrame.setModel(oModel);
		},
		ViewTabletype: function () {
			var value = sap.ui.getCore().getModel("keyModel");
			var oTable = this.getView().byId("keyInfluencertableId");
			oTable.removeAllColumns();
			for (var b = 0; b < Object.keys(value.oData[0]).length; b++) {
				oTable.addColumn(new sap.m.Column({
					width: "2rem",
					header: new sap.m.Label({
						text: Object.keys(value.oData[0])[b]
					})
				}));
			}
			var cellsarray = [];
			for (var i = 0; i < Object.keys(value.oData[0]).length; i++) {
				cellsarray.push(new sap.m.Text({
					text: "{" + Object.keys(value.oData[0])[i] + "}"
				}));
			}
			oTable.bindItems("/", new sap.m.ColumnListItem({
				cells: cellsarray
			}));

			oTable.setModel(new sap.ui.model.json.JSONModel(value.oData));
		}
	});

});