sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("Brevo.BrevoDtree.controller.VarianceSettings", {
		onInit: function () {
			varianceAnalysis = this;
			var bus = sap.ui.getCore().getEventBus();
			bus.subscribe("fromdataconfig", "tovariancesettings", function (channel, evt, data) {
				varianceAnalysis.flag = data.status;
				var dimensions, measures;
				for (var i = 0; i < data.dimensions.length; i++) {
					if (i == 0) {
						dimensions = data.dimensions[i].getTitle();
					} else {
						dimensions += "," + data.dimensions[i].getTitle();
					}
				}
				for (var j = 0; j < data.measures.length; j++) {
					if (j == 0) {
						measures = data.measures[j].getTitle();
					} else {
						measures += "," + data.measures[j].getTitle();
					}
				}

				varianceAnalysis.Value = data;

				varianceAnalysis.existingscen = data.scenario;
				varianceAnalysis.existingvariance = data.variance;

				var url = "Date.xsjs?view=" + data.view + "&select=" + dimensions + "," + measures;
				var service = ibrevoVDT.Component.getService();
				service.callService("varianceModel", "varianceModel", url, "scenario", true, "", function (evt, flag) {
					var varianceModel = sap.ui.getCore().getModel("varianceModel");
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[2].setModel(new sap.ui.model.json.JSONModel(
						varianceModel.oData[0].TimeDimension));
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[4].setModel(new sap.ui.model.json.JSONModel(
						varianceModel.oData[0].TimePeriod));
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setMin(0.0);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setMax(1.0);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setStep(0.1);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setValue(0.5);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setEnableTickmarks(true);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setMin(-10);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setMax(10);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setStep(2);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setValue(0);
					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setEnableTickmarks(true);
					var arr = [];
					var variancemeasure = [{
						value: varianceAnalysis.Value.target + " Variance Absolute",
						key: 1
					}, {
						value: varianceAnalysis.Value.target + " Percentage",
						key: 2
					}];

					varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[7].setModel(new sap.ui.model.json.JSONModel(
						variancemeasure));

					if (varianceAnalysis.flag == true) {
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[2].setSelectedKey(varianceAnalysis.Value.variance
							.timeDimension);
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[4].setSelectedKey(varianceAnalysis.Value.variance
							.timePeriod);
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[5].setSelectedKey(varianceAnalysis.Value.variance
							.quarterInfo);
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[7].setSelectedKey(varianceAnalysis.Value.variance
							.varianceMeasure);
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[9].setValue(varianceAnalysis.Value.variance.MinDimension);
						varianceAnalysis.getView().byId("SimpleFormDisplay354wideDual").getContent()[11].setValue(varianceAnalysis.Value.variance.minMeasure);

					}
				});
			});
		},

		// on selection change of variance analysis settings
		handleSelectionChange: function (evt) {
			var item = evt.getParameters().selectedItem;
		},
		// on change of slider value change for variance analysis
		handleSliderChange: function (evt) {
			var value = evt.getParameters().value;
		}
	});

});