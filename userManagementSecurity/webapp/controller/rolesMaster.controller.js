sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, MessageBox, formatter) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.rolesMaster", {
		formatter: formatter,
		onInit: function () {
			if (!this.valueHelpForRoles)
				this.valueHelpForRoles = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForRoles", this);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("rolesMaster").attachPatternMatched(this._objPatternMatched, this);
		},
		_objPatternMatched: function () {
			this.getView().getModel("appView").getProperty("/sideContent").getItem().getItems()[1].getItems()[1]._selectItem(true);
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.handleRolesModel();
			this.getOwnerComponent().getModel("rolesDetails").updateBindings(true);

		},
		onAfterRendering: function () {
			this.handleRolesModel();
		},
		handleRolesModel: function () {
			var that = this;
			this.getView().byId("roleList").setBusy(true);
			var org_id = this.getView().getModel("appView").oData.loginDetails[0].organisationid;
			var url = "/BrevoMongoDB/UM/getrole?param1=" + org_id;
			$.get(url, function (data) {
				if (data == "Invalid Session") {
					MessageBox.information("Your session has expired. Please log in again.", {
						onClose: function (oEvent) {
							if (oEvent == "OK") {
								that.handleInvalidSession();
							}
						}
					});
				} else {
					try {
						data = JSON.parse(data);
					} catch (e) {

					}
					var rolesModel = new sap.ui.model.json.JSONModel(data);
					// rolesModel.attachRequestCompleted(function () {
					//	console.log(rolesModel);
					that.getView().byId("roleList").setBusy(false);
					that.getOwnerComponent().setModel(rolesModel, "rolesDetails");

					// });
				}
			});

		},
		onNavBack: function () {
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Home");
		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		handleRolesListPress: function (evt) {
			this.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("rolesDetail", {
				orgid: this.getView().getModel("appView").oData.loginDetails[0].organisationid,
				roleId: evt.getParameter("listItem").getBindingContext("rolesDetails").getObject()._id,
				path: evt.getParameter("listItem").getBindingContext("rolesDetails").getPath().split("/")[1]
			});
		},
		onSearch: function (evt) {
			this.getView().byId("roleList").getBinding("items").filter([new sap.ui.model.Filter("type", "Contains", evt.getParameter(
				"newValue"))]);
		},
		handleAddNewRole: function () {
			var rolesObj = {
				"type": "",
				"description": "",
				"createdate": new Date().toJSON(),
				"modifydate": new Date().toJSON(),
				"countofcreatepage": "",
				"countofcreateuser": "",
				"organisationid": this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid")
			};
			this.valueHelpForRoles.setModel(new sap.ui.model.json.JSONModel(rolesObj));
			this.valueHelpForRoles.setTitle("Create Role");
			this.handleLicenseFields();
			this.valueHelpForRoles.open();
		},
		handleLicenseFields: function () {
			var appView = this.getView().getModel("appView");
			this.valueHelpForRoles.getContent()[1].getContent()[1].setSelectedKey(appView.oData.loginDetails[0].license.license_type);
			this.valueHelpForRoles.getContent()[1].getContent()[3].setValue(appView.getProperty("/loginDetails/0/license/startdate") +
				" - " + appView.getProperty("/loginDetails/0/license/enddate"));
			var noOfDay = formatter.getNoOfDays(appView.getProperty("/loginDetails/0/license/startdate"), appView.getProperty(
				"/loginDetails/0/license/enddate"));
			this.valueHelpForRoles.getContent()[1].getContent()[5].setValue(noOfDay);
		},
		handleRolesFragmentCancel: function () {
			this.valueHelpForRoles.close();
		},
		handleCreatePageCount: function (evt) {
			var that = this;
			if (evt.getSource().getValue() > that.oView.getModel("appView").oData.loginDetails[0].license.dashboardcountallowed) {
				evt.getSource().setValueState("Error").setValueStateText("Assigned Dashboard Creation count is " + this.oView.getModel("appView").oData
					.loginDetails.license_details[0].dashboardcountallowed);
			} else {
				evt.getSource().setValueState("None").setValueStateText("");
			}
		},
		handleRolesFragmentSave: function () {
			//this.getOwnerComponent().getModel().getData().roles.push(this.valueHelpForRoles.getModel().getData());
			var that = this;
			if (this.handleValidationsForRoles() && that.valueHelpForRoles.getContent()[1].getContent()[7].getValueState() != "Error") {
				var rolesObj = this.valueHelpForRoles.getModel().getData();
				var orgid = this.getView().getModel("appView").oData.loginDetails[0].organisationid;
				$.post(("/BrevoMongoDB/UM/createrole?param1=" + orgid), rolesObj, function (data) {

					if (data == "Invalid Session") {
						MessageBox.information("Your session has expired. Please log in again.", {
							onClose: function (oEvent) {
								if (oEvent == "OK") {
									that.handleInvalidSession();
								}
							}
						});
					} else if (data == "okk") {
						MessageBox.success("Role Created Successfully");
						that.valueHelpForRoles.getContent()[1].getContent()[7].setValueState("None");
						that.handleRolesModel();
					} else {
						MessageBox.error(JSON.parse(data).status);
					}
				});
				this.valueHelpForRoles.close();
			} else {
				sap.m.MessageBox.error("Please fill the mandatory fields!");
			}

		},
		handleValidationsForRoles: function () {
			var validationFlag = true;
			if (this.valueHelpForRoles.getContent()[0].getContent()[1].getValue().length == 0 || this.valueHelpForRoles.getContent()[0].getContent()[
					3].getValue().length == 0 || this.valueHelpForRoles.getContent()[1].getContent()[7].getValue().length == 0) {
				validationFlag = false;
			}
			return validationFlag;
		},
		handleInvalidSession: function () {
			var that = this;
			that.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
			oRouter.navTo("login");

			function preventBack() {
				window.history.forward();
			}
			setTimeout("preventBack()", 0);
			window.onunload = function () {
				null
			};
			window.localStorage.removeItem("loginDetails");
		},
		handleDateRange: function (evt) {
			var date1 = evt.getSource().getDateValue();
			var date2 = evt.getSource().getSecondDateValue();
			var diffTime = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			this.valueHelpForRoles.getContent()[1].getContent()[5].setValue(diffDays);
		}
	});
});