sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/QueryBuilder/model/Service",
	"Brevo/QueryBuilder/util/Formatter"
], function (Controller, service, Formatter) {
	"use strict";

	return Controller.extend("Brevo.QueryBuilder.controller.Home", {

		onInit: function () {
			var that = this;
			that.BusyDialog = new sap.m.BusyDialog();
			that.BusyDialog.open();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("home").attachPatternMatched(this.onPatternMatched, this);
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.popOver", this);
			}

		},
		onPatternMatched: function () {
			var that = this;
			that.setDepartmentsModel();
			that.setQueriesModel();

		},
		applyDepartmentFilters: function () {
			var that = this;
			var selectedValue = that.getView().byId("idObjectHeader").getTitle();
			if (selectedValue == "") {
				selectedValue = "All Departments";
				that.getView().byId("idObjectHeader").setTitle(selectedValue);
			}
			var tiles = this.getView().byId("graphical").getBinding("items");
			var list = this.getView().byId("listView").getBinding("items");
			if (selectedValue !== "All Departments" && selectedValue.length > 0) {
				var deptFilter = new sap.ui.model.Filter("department", sap.ui.model.FilterOperator.Contains, selectedValue);
				tiles.filter(new sap.ui.model.Filter([deptFilter], false));
				list.filter(new sap.ui.model.Filter([deptFilter], false));
			} else {
				tiles.filter([]);
				list.filter([]);
			}
		},
		setQueriesModel: function () {
			var that = this;
			that.BusyDialog.open();
			// if (selectedDepartment)
			// 	var url = "getAllTablesAndViews?db=Brevo&$filter=department eq " + selectedDepartment;
			// else
			var url = "getAllTablesAndViews?db=Brevo";
			service.callService("Queries", "Queries", url, "", true,
				function (evt, flag) {
					if (flag) {
						var tModel = sap.ui.getCore().getModel("Queries");
						that.getView().byId("graphical").setModel(tModel);
						that.getView().byId("listView").setModel(tModel);
						that.BusyDialog.close();
					} else {
						window.location = "../Login/index.html";
					}

				});
		},
		setDepartmentsModel: function () {
			var that = this;
			that.BusyDialog.open();
			service.callService("Departments", "Departments", "TableData?db=Brevo&table=department", "", true,
				function (evt) {
					var oModel = sap.ui.getCore().getModel("Departments");
					// that.setQueriesModel(oModel.oData.tables[0].Department_name);
					var duplicateDeptModel = new sap.ui.model.json.JSONModel();
					duplicateDeptModel.oData.tables = [];
					for (var i = 0; i < oModel.oData.tables.length; i++) {
						duplicateDeptModel.oData.tables.push(oModel.oData.tables[i]);
					}
					var valueArr = duplicateDeptModel.oData.tables.map(function (item) {
						return item.Department_name
					});
					if (!valueArr.includes("Add a New Category")) {
						duplicateDeptModel.oData.tables.push({
							"Dep_Id": "0",
							"Department_name": "All Departments"
						});
					}
					duplicateDeptModel.setDefaultBindingMode("OneWay");
					that.getView().byId("idObjectHeader").setModel(duplicateDeptModel);
					that.applyDepartmentFilters();
					// that.getView().byId("idObjectHeader").setTitle("All Departments");
					that._oPopover.setModel(duplicateDeptModel);
					that.BusyDialog.close();
				});

		},
		onCreateTilePress: function (event) {
			this.oRouter.navTo("createQuery");
		},

		onGraphicalTilePress: function (evt) {
			var tile = evt.getSource().getBindingContext().getObject();
			this.oRouter.navTo("dataPreview", {
				viewName: tile.name
			});
		},
		handleDepartmentSelect: function (oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem");
			var oObjectHeader = this.byId("idObjectHeader");
			var selectedValue = oItem.getTitle();
			oObjectHeader.setTitle(selectedValue);
			oObjectHeader.setBindingContext(oItem.getBindingContext());
			this._oPopover.close();
			this.applyDepartmentFilters();
		},

		handleTitleSelectorPress: function (oEvent) {
			var _oPopover = this._oPopover;
			_oPopover.setModel(oEvent.getSource().getModel());
			_oPopover.openBy(oEvent.getParameter("domRef"));
		},
		onGridIconPress: function (evt) {
			var sIcon = evt.getSource().getIcon();
			if (sIcon === "sap-icon://grid") {
				this.getView().byId("toggle").setIcon("sap-icon://list");
				this.getView().byId("graphical").setVisible(true);
				this.getView().byId("listView").setVisible(false);
			} else {
				this.getView().byId("toggle").setIcon("sap-icon://grid");
				this.getView().byId("graphical").setVisible(false);
				this.getView().byId("listView").setVisible(true);
			}
		},
		onViewSearch: function (evt) {
			var sValue = evt.getParameter("newValue");
			var filterArray = [];
			if (sValue.length > 0) {
				filterArray.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sValue));
			}
			var tiles = this.getView().byId("graphical").getBinding("items");
			var list = this.getView().byId("listView").getBinding("items");
			tiles.filter(filterArray);
			list.filter(filterArray);
		},

		onListItemPress: function (evt) {
			var tile = evt.getSource()._getBindingContext().getObject();
			this.oRouter.navTo("dataPreview", {
				viewName: tile.name
			});
		}

	});

});