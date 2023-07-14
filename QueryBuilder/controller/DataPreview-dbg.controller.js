sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/m/Button",
	"sap/m/Dialog",
	"Brevo/QueryBuilder/model/Service",
	"sap/ui/core/format/DateFormat"
], function (Controller, History, MessageToast, Button, Dialog, service, DateFormat) {
	"use strict";

	return Controller.extend("Brevo.QueryBuilder.controller.DataPreview", {

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("home", {}, true);
			}
		},
		onInit: function () {
			var that = this;
			this.queryId = "";
			this.query = "";
			this.queryName = "";
			this.created = "";
			this.viewData = {};
			this.dbName = "";

			that.BusyDialog = new sap.m.BusyDialog();
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("dataPreview").attachPatternMatched(this.onPatternMatched, this);

		},
		onPatternMatched: function (evt) {
			var that = this;
			var viewName = evt.getParameter("arguments").viewName;
			if (viewName) {
				that.BusyDialog.open();
				that.tile = viewName;
				var finalUrl = 'TableMetadata?db=Brevo&table=' + that.tile;
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "dd/MM/yyyy"
				});
				var lastChanged;

				service.callService("queryInfo", "queryInfo", finalUrl, "", true,
					function (evt) {
						var tileModel = sap.ui.getCore().getModel("queryInfo");
						that.created = tileModel.oData.created_through;
						that.queryId = tileModel.oData.view_id;
						lastChanged = oDateFormat.format(new Date(tileModel.oData.last_change));
						that.getView().byId("lastChange").setText("Last Modified: " + lastChanged);
						that.getView().byId("variantItems").setTitle(that.tile);
						that.getView().byId("editButton").setVisible(true);
						var gUrl = "TableData?db=Brevo&table=" + that.tile;
						service.callGetService("viewData", "viewData", gUrl, "", true,
							function (evt) {
								var vModel;
								var pArray = [];
								if (evt) {
									vModel = new sap.ui.model.json.JSONModel(JSON.parse(JSON.parse(evt)).tables);
									that.drawGridTable(vModel);
								} else {
									vModel = new sap.ui.model.json.JSONModel();
								}
								that.BusyDialog.close();
							});
					});

			} else {
				var dataModel = sap.ui.getCore().getModel("dataPreviewModel");
				that.getView().byId("variantItems").setTitle("Data");
				that.getView().byId("editButton").setVisible(false);
				that.drawGridTable(dataModel);
			}

		},

		drawGridTable: function (model) {
			var that = this;
			that.BusyDialog.open();
			var gTable = that.getView().byId("gridTable");
			gTable.removeAllColumns();
			var pArray = Object.keys(model.oData[0]);
			for (var i = 0; i < pArray.length; i++) {
				gTable.addColumn(new sap.ui.table.Column({
					width: "11rem",
					label: new sap.m.Label({
						text: pArray[i]
					}),
					template: new sap.m.Input({
						value: "{" + pArray[i] + "}",
						editable: false
					})
				}));
			}
			gTable.setModel(model);
			gTable.bindRows("/");
			that.getView().byId("variantItems").setNumber(model.oData.length);
			that.BusyDialog.close();
		},
		//on click of Edit Query
		onEditPress: function () {
			var that = this;
			that.BusyDialog.open();
			var editMode = true;
			var tile = this.tile;
			var vId = this.viewId;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			if (this.created == "editor") {
				oRouter.navTo("sqlEditor", {
					isEditMode: true
				});
				that.BusyDialog.close();
			} else {
				that.BusyDialog.close();
				oRouter.navTo("createQuery", {
					isEditMode: true
				});
			}

		}

	});

});