sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("Brevo.BrevoDtree.controller.nodeSettings", {

		onInit: function () {
			var that = this;
			var bus = sap.ui.getCore().getEventBus();
			bus.subscribe("treeData", "settings", function (channel, evt, data) {
				that.treeData = data;
				/*var Type, arr =[];*/
				that.getView().byId("scenEntity").setText(data.scenario.Entity);
				that.getView().byId("Scentitle").setText(data.scenario.scenarioTitle);
				that.getView().byId("datamodel").setText(data.scenario.serviceURL);
				if (data.node.dtitle != data.scenario.Entity) {
					var Type = [{
						name: "External Assumptions",
						key: "Assumptions"
					}, {
						name: "Formula",
						key: "Formula"
					}, {
						name: "System Derived",
						key: "SystemDerived"
					}];
					that.getView().byId("systemFormulaText").setText(data.node.value_org + "-(" + data.node.co_val + "*" + data.node.value +
						")");
					that.getView().byId("systemValue").setValue(data.node.co_val);
				} else {
					var Type = [{
						name: "External Assumptions",
						key: "Assumptions"
					}, {
						name: "Formula",
						key: "Formula"
					}];
					//arr.push(Type);
				}
				var calculatetypeModel = new sap.ui.model.json.JSONModel(Type);
				that.getView().byId("calculateKey").setModel(calculatetypeModel);

				that.getView().byId("calculateKey").setSelectedKey("Assumptions");
				var Marray = [];
				if (data.scenario.measures.length > 0) {
					for (var i = 0; i < data.scenario.measures.length; i++) {
						Marray.push(data.scenario.measures[i]);
					}
				}
				var Darray = [];
				if (data.scenario.dimension.length > 0) {
					for (var i = 0; i < data.scenario.dimension.length; i++) {
						Darray.push(data.scenario.dimension[i]);
					}
				}
				that.getView().byId("scenDim").setText(Darray);
				that.getView().byId("scenMeas").setText(Marray);
				that.getView().byId("nodeName").setText(data.node.name);
				that.getView().byId("extLabelValue").setValue(data.node.value);

				var arr = [];
				var measure = data.scenario.measures;
				for (var x = 0; x < measure.length; x++) {
					var data = {
						"key": measure[x].Value,
						"label": measure[x].Value,
						"items": [{
							"key": measure[x].Value
						}, {
							"key": "+"
						}, {
							"key": measure[x].Value
						}]
					};
					arr.push(data);
				}
				var measureModel = new sap.ui.model.json.JSONModel(arr);
				that.getView().byId("formulaValue").setModel(measureModel);
				that.handleSelectionChange("Assumptions");

			});
		},

		navBackToTreeView: function () {
			this.resetField();
			window.history.go(-1);
		},

		handleSelectionChange: function (evt) {
			if (evt == "Assumptions")
				this.setCalculationDetails("Assumptions");
			else
				this.setCalculationDetails(evt.oSource.getSelectedKey());
		},
		setCalculationDetails: function (key) {
			var that = this;
			if (key == "Assumptions") {
				this.getView().byId("extLabelText").setVisible(true);
				this.getView().byId("extLabelValue").setVisible(true);
				this.getView().byId("formulaText").setVisible(false);
				this.getView().byId("formulaValue").setVisible(false);
				this.getView().byId("coefficientLabel").setVisible(false);
				this.getView().byId("systemValue").setVisible(false);
				this.getView().byId("systemFormula").setVisible(false);
				this.getView().byId("systemFormulaText").setVisible(false);
				this.getView().byId("systemFormulaLabel").setVisible(false);
			} else if (key == "Formula") {
				this.getView().byId("extLabelText").setVisible(false);
				this.getView().byId("extLabelValue").setVisible(false);
				this.getView().byId("formulaText").setVisible(true);
				this.getView().byId("formulaValue").setVisible(true);
				this.getView().byId("coefficientLabel").setVisible(false);
				this.getView().byId("systemValue").setVisible(false);
				this.getView().byId("systemFormulaText").setVisible(false);
				this.getView().byId("systemFormula").setVisible(false);
				this.getView().byId("systemFormulaLabel").setVisible(false);
			} else {
				this.getView().byId("extLabelText").setVisible(false);
				this.getView().byId("extLabelValue").setVisible(false);
				this.getView().byId("formulaText").setVisible(false);
				this.getView().byId("formulaValue").setVisible(false);
				this.getView().byId("coefficientLabel").setVisible(true);
				this.getView().byId("systemValue").setVisible(true);
				this.getView().byId("systemFormula").setVisible(true);
				this.getView().byId("systemFormulaText").setVisible(true);
				this.getView().byId("systemFormulaLabel").setVisible(true);
				if (that.treeData.node.System_co_val)
					that.getView().byId("resetButtonId").setVisible(true);
				else
					that.getView().byId("resetButtonId").setVisible(false);
			}
		},
		onNodeCancel: function () {
			this.resetField();
			window.history.go(-1);
		},
		onNodeSave: function () {
			var that = this;
			var objectData, calType, value;
			var key = that.getView().byId("calculateKey").getSelectedKey();
			var Nodename = that.getView().byId("nodeName").getText();
			var variantId = that.treeData.variant.VariantId.toString();
			if (key != "SystemDerived") {
				if (key == "Assumptions") {
					calType = "External Assumptions";
					value = that.getView().byId("extLabelValue").getValue();
				} else if (key == "Formula") {
					calType = "Formula";
					value = that.getView().byId("formulaValue").getExpression();
				}
				if (value.length != 0) {
					// objectData = {
					// 	"variantID": variantId,
					// 	"Node_name": Nodename,
					// 	"Node_Calculation": calType,
					// 	"Formula": value
					// };
					// console.log(objectData);
					var selectedNode = that.treeData.node;
					var rootNode = JSON.parse(that.treeData.variant.MeasureTree);
					// var children = rootNode.children;
					if (selectedNode.name == rootNode.name) {

					} else {
						rootNode.children.forEach(function (child) {
							if (selectedNode.name == child.name) {
								selectedNode.value_copy = selectedNode.value;
								selectedNode.value = parseInt(that.getView().byId("extLabelValue").getValue());
								that.treeData.variant.MeasureTree = JSON.stringify(rootNode);
								that.onUpdateSystemData(selectedNode, key);
								// that.onPostData(that.treeData.variant, selectedNode, key);
							}
						});
					}
					// that.onPostData(objectData);
				} else {
					sap.m.MessageToast.show("Value field is Required");
				}
			} else {
				value = that.getView().byId("systemValue").getValue();
				if (that.treeData.node.System_co_val) {
					// that.treeData.node.System_co_val = that.treeData.node.co_val;
					// that.treeData.node.co_val = value;
					that.onUpdateSystemData(that.treeData.node, key);
				} else {
					that.onUpdateSystemData(that.treeData.node, "Assumptions");
				}
			}
		},
		onSystemCoEfficientChange: function () {
			var that = this;
			var value = that.getView().byId("systemValue").getValue();
			that.getView().byId("resetButtonId").setVisible(true);
			var rootNode = that.treeData.node;
			if (rootNode.System_co_val) {
				rootNode.co_val = Number(value);
			} else {
				rootNode.System_co_val = rootNode.co_val;
				rootNode.co_val = Number(value);
			}
		},
		onResetButtonPress: function () {
			var that = this;
			var rootNode = that.treeData.node;
			rootNode.co_val = rootNode.System_co_val;
			that.getView().byId("systemValue").setValue(that.treeData.node.co_val);
			delete rootNode.System_co_val;
			that.getView().byId("resetButtonId").setVisible(false);

		},
		// add new node
		onPostData: function (data, selectedNode, key) {
			var that = this;
			// var service = ibrevoVDT.Component.getService();
			// service.callCreateService("Variants('" + parseInt(data.VariantId) + "')", JSON.stringify(data), "scenario", "PUT",
			// 	function (evt, sucessFlag, oError) {
			// 		if (sucessFlag) {
			sap.m.MessageToast.show("Node setting saved");
			that.resetField();
			var router = sap.ui.core.UIComponent.getRouterFor(that);
			router.navTo("treeView");
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("systemsetting", "systemtreeData", {
				nodedetails: selectedNode,
				key: key
			});
			// bus.publish("settings", "treeData", {
			// 	scenarioInfo: that.treeData.scenario,
			// 	varianceInfo: that.treeData.varianceInfo
			// });
			// 	}
			// });

			// service.callCreateService("Advanced_Settings.xsjs", JSON.stringify(data), "Mlsystem", "POST", function (evt, sucessFlag, oError) {
			// 	sap.m.MessageToast.show("Node setting saved");
			// 	that.resetField();
			// 	var router = sap.ui.core.UIComponent.getRouterFor(that);
			// 	router.navTo("treeView");
			// 	var bus = sap.ui.getCore().getEventBus();
			// 	bus.publish("settings", "treeData", {
			// 		scenarioInfo: that.treeData.scenario,
			// 		varianceInfo: that.treeData.varianceInfo
			// 	});

			// });
		},
		onUpdateSystemData: function (selectedNode, key) {
			sap.m.MessageToast.show("Node setting saved");
			this.resetField();
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("treeView");
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("systemsetting", "systemtreeData", {
				nodedetails: selectedNode,
				key: key
			});

		},
		resetField: function () {
			this.getView().byId("extLabelValue").setValue();
			this.getView().byId("formulaValue").setExpression(" ");
			this.getView().byId("systemValue").setValue();
			this.getView().byId("systemFormulaText").setText();
			this.getView().byId("resetButtonId").setVisible(false);
		}
	});

});