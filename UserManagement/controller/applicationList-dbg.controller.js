sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, MessageToast, MessageBox, DateFormat, formatter) {
	"use strict";
	return Controller.extend("inhance.userManagementSecurity.controller.applicationList", {
		formatter: formatter,
		onInit: function () {
			var that = this;
			if (!this.valueHelpForApplication)
				this.valueHelpForApplication = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForApplication", this);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("applicationList").attachPatternMatched(function () {
				that.getView().getModel("appView").setProperty("/sideMenuVisible", true);
				that.handleApplicationModel();
			}, this);
		},
		onAfterRendering: function () {
			this.handleApplicationModel();
		},
		handleApplicationModel: function () {
			var that = this;
			this.getView().setBusy(true);
			var model = new sap.ui.model.json.JSONModel("/BrevoMongoDB/UM/getapplications");
			model.attachRequestCompleted(function () {
				that.getView().setBusy(false);
				that.getOwnerComponent().setModel(model, "applications");
			});
		},
		handleAddGroups: function () {
			this.addGroups.open();
		},
		onNavBack: function () {
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Home");
		},

		handleAddApplication1: function () {
			this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel({
				"AppId": 1000 + this.getOwnerComponent().getModel().getData().apps.length + 1,
				"AppName": "",
				"Description": "",
				"App_Url": "",
				"Created_At": this.todayDate(),
				"Last_Changed_At": this.todayDate()
			}));
			this.valueHelpForApplication.open();
		},
		handleAddApplication: function () {
			this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel({
				"name": "",
				"description": "",
				"link": "",
				"createdate": new Date().toJSON(),
				"modifydate": new Date().toJSON()
			}));
			this.valueHelpForApplication.open();
		},
		handleApplicationSave: function () {
			var that = this;
			var appObj = this.valueHelpForApplication.getModel().getData(),
				serviceUrl = "";
			if (this.editApp) {
				this.editApp = false;
				var id = this.editAppObj._id;
				serviceUrl = ("/BrevoMongoDB/UM/editapplication?param1=" + id);
				this.getOwnerComponent().getModel().getData().apps[this.editAppPath] = this.valueHelpForApplication.getModel().getData();
			} else {
				serviceUrl = "/BrevoMongoDB/UM/createapplication";
			}
			$.post(serviceUrl, appObj, function (data) {
				if (data == "okk") {
					MessageBox.success(data);
					that.handleApplicationModel();
					that.getOwnerComponent().getModel().updateBindings(true);
				} else {
					MessageBox.error(data);
				}
			});
			this.getOwnerComponent().getModel().updateBindings(true);
			this.valueHelpForApplication.close();
		},
		todayDate: function () {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MM/dd/YYYY"
			});
			return dateFormat.format(new Date());
		},
		handleApplicationCancel: function () {
			this.valueHelpForApplication.close();
		},
		handleEditAppPress: function (evt) {
			this.editApp = true;
			this.editAppObj = evt.getSource().getBindingContext("applications").getObject();
			this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel(this.editAppObj));
			this.valueHelpForApplication.open();
		},
		handleAppSearch: function (evt) {
			var appName = new sap.ui.model.Filter("name", "Contains", evt.getParameter("newValue"));
			var appDesc = new sap.ui.model.Filter("description", "Contains", evt.getParameter("newValue"));
			var appUrl = new sap.ui.model.Filter("link", "Contains", evt.getParameter("newValue"));
			var filterArr = new sap.ui.model.Filter([appName, appDesc, appUrl], false);
			this.getView().byId("appTableId").getBinding("items").filter(filterArr);
		},
		handleLinkPress: function (evt) {
			window.open(evt.getSource().getText());
		},
		handleDeleteAppPress: function (evt) {
			var that = this;
			this.appToDelete = evt.getSource().getBindingContext("applications");
			this.getView().setBusy(true);
			MessageBox.confirm("Are You want to delete a Application?", {
				onClose: function (oEvent) {
					if (oEvent == "OK") {
						var appid = that.appToDelete.getObject()._id;
						$.post(("/BrevoMongoDB/UM/deleteapplication?param1=" + appid), {
							id: parseInt(that.appToDelete.getObject()._id)
						}, function (data) {
							if (data == "okk") {
								that.getView().setBusy(false);
								that.getOwnerComponent().getModel("applications").oData.splice(that.appToDelete.getPath().split("/")[1], 1);
								that.getOwnerComponent().getModel("applications").updateBindings(true);
								MessageBox.success(data);
							}
						});
					} else
						that.getView().setBusy(false);
				}
			});
		},
	});
});