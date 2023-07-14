sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, MessageBox, formatter) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.adminDetail", {
		formatter: formatter,
		onInit: function () {
			var that = this;
			if (!this.valueHelpForOrganization)
				this.valueHelpForOrganization = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForOrganization", this);
			if (!this.valueHelpForApplicationList)
				this.valueHelpForApplicationList = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForApplicationList",
					this);
			this.getView().addDependent(this.valueHelpForApplicationList);
			//sap.ui.core.UIComponent.getRouterFor(this).getRoute("adminDetail").attachPatternMatched(this._objPatternMatched, this);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("adminDetail").attachPatternMatched(function (oEvent) {
				that._objPatternMatched(oEvent.getParameter("arguments").userId, oEvent.getParameter("arguments").path);
			}, this);
		},
		/*	_objPatternMatched: function (oEvent) {
				var that = this;
				this.handleClearUserTableFilters();
				this.getView().setBusy(true);
				this.oranizationId = oEvent.getParameter("arguments").oranizationId;
				this.oranizationItemIndex = oEvent.getParameter("arguments").oranizationItemIndex;
			    oEven

				this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			},*/
		_objPatternMatched: function (oranizationId, oranizationItemIndex) {
			var that = this;
			this.handleClearUserTableFilters();
			this.getView().setBusy(true);
			this.oranizationId = oranizationId;
			this.oranizationItemIndex = oranizationItemIndex;
			var organizationDetailModel = new sap.ui.model.json.JSONModel(
				"/BrevoMongoDB/UM/getorganisationdetailhierarchy?param1=" + this.oranizationId);
			organizationDetailModel.attachRequestCompleted(function () {
				that.getView().setModel(organizationDetailModel);
				that.getView().setBusy(false);
				window.setTimeout(function () {
					that.getView().byId("LicenseTypeId").setSelectedKey(organizationDetailModel.oData[0].License[0].license_type);
				}, 500);
			});

			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
		},
		/*	handleSaveCancelButton: function (flag) {
				this.getView().byId("saveButtonId").setVisible(flag);
				this.getView().byId("cancelButtonId").setVisible(flag);
				this.getView().byId("editButtonId").setVisible(!flag);
				this.getView().byId("deleteButtonId").setVisible(!flag);
			},*/
		handleSaveOrganization: function () {
			var that = this;
			MessageBox.confirm("Are you Sure want to save your changes", function (oEvent) {
				if (oEvent == "OK") {
					that.handleSaveCancelButton(false);
					MessageBox.information("Changes are saved Successfully");
				}
			});
		},
		handleCancelOrganization: function () {
			var that = this;
			MessageBox.confirm("Are you sure want to cancel your changes", {
				onClose: function (oEvent) {
					if (oEvent == "OK") {
						that.handleSaveCancelButton(false);
						//MessageBox.information("Changes are not saved");
					}
				}
			});
		},
		handleDeleteOrganizationPress: function () {
			var that = this;
			this.getView().setBusy(true);
			MessageBox.confirm("Are you sure want to delete a Organization?", {
				onClose: function (oEvent) {
					if (oEvent == "OK") {

						$.post(("/BrevoMongoDB/UM/deleteteorganisation?param1=" + that.oranizationId), {
							id: parseInt(that.oranizationId)
						}, function (data) {
							if (data == "success") {
								that.getView().setBusy(false);
								that.getOwnerComponent().getModel("organization").oData.splice(that.oranizationItemIndex, 1);
								that.getOwnerComponent().getModel("organization").updateBindings(true);
								MessageBox.success(data);
								that.getView().getModel("appView").setProperty("/layout", "OneColumn");
							}
						});
					} else
						that.getView().setBusy(false);
				}
			});
		},
		handleEditOrganizationPress: function () {
			//var organizationObj = this.getOwnerComponent().getModel().getData().superAdmin[this.oranizationItemIndex];
			var orgModelObj = this.getView().getModel().oData;
			var organizationObj = {
				id: orgModelObj[0]._id,
				name: orgModelObj[0].name,
				description: orgModelObj[0].description,
				phone: orgModelObj[0].phone,
				org_email: orgModelObj[0].org_email,
				address: orgModelObj[0].address,
				createdate: orgModelObj[0].createdate,
				modifydate: new Date().toJSON(),
				license_type: orgModelObj[0].License[0].license_type,
				startdate: orgModelObj[0].License[0].startdate,
				enddate: orgModelObj[0].License[0].enddate,
				dashboardcountallowed: orgModelObj[0].License[0].dashboardcountallowed,
				usercountallowed: orgModelObj[0].License[0].usercountallowed,
				firstname: orgModelObj[0].user[0].firstname,
				lastname: orgModelObj[0].user[0].lastname,
				user_emailid: orgModelObj[0].user[0].user_emailid,
				userid: "12345",
				//	userid: orgModelObj[0].log[0].userid == null ? orgModelObj[0].user[0]._id : orgModelObj[0].log[0].userid,
				contactnumber: orgModelObj[0].user[0].contactnumber,
				application: orgModelObj[0].applications
					//application: null
			};
			this.valueHelpForOrganization.setModel(new sap.ui.model.json.JSONModel(organizationObj));
			this.valueHelpForOrganization.open();
		},
		handleOrganizationCancel: function () {
			this.valueHelpForOrganization.close();
		},
		handleOrganizationSave: function () {
			//this.getOwnerComponent().getModel().getData().superAdmin.push(this.valueHelpForOrganization.getModel().getData());
			//this.getOwnerComponent().getModel().updateBindings(true);
			var that = this;
			var appArr = [];
			this.valueHelpForOrganization.getModel().getData().application.forEach(function (obj) {
				appArr.push({
					createdate: obj.createdate,
					//deleted:  obj.createdate,
					description: obj.application_desc != undefined ? obj.application_desc : obj.description,
					id: obj.applicationid != undefined ? obj.applicationid : obj._id,
					link: obj.application_link != undefined ? obj.application_link : obj.link,
					modifydate: obj.modifydate,
					name: obj.name
				});

			});
			this.valueHelpForOrganization.getModel().getData()["startdate"] = new Date(this.valueHelpForOrganization.getContent()[0].getContent()[
					16].getValue().split(" - ")[0])
				.toJSON();
			this.valueHelpForOrganization.getModel().getData()["enddate"] = new Date(this.valueHelpForOrganization.getContent()[0].getContent()[
				16].getValue().split(" - ")[1]).toJSON();
			this.valueHelpForOrganization.getModel().getData()["application"] = appArr;
			this.getView().setBusy(true);
			var userid = "12345";
			var licenceid = this.getView().getModel().oData[0].License[0]._id;
			var useridadmin = this.getView().getModel().oData[0].user[0]._id;
			this.valueHelpForOrganization.getModel().getData()["applicationIds"] = [];
			for (var i = 0; i < appArr.length; i++) {
				this.valueHelpForOrganization.getModel().getData()["applicationIds"].push(appArr[i].id);
			}
			$.post(("/BrevoMongoDB/UM/editorganisationnew?param1=" + userid + "&param2=" + that.oranizationId + "&param3=" + licenceid +
					"&param4=" + useridadmin),
				this.valueHelpForOrganization.getModel().getData(),
				function (data) {
					that.getView().setBusy(false);
					if (data == "ok") {
						//that.getView().setBusy(false);
						MessageBox.success("Organization Updated Successfully");
						that._objPatternMatched(that.oranizationId, that.oranizationItemIndex);
					} else {
						//that.getView().setBusy(false);
						MessageBox.error(data);
					}
				});
			this.valueHelpForOrganization.close();
		},
		handleDateRange: function (evt) {
			var date1 = evt.getSource().getDateValue();
			var date2 = evt.getSource().getSecondDateValue();
			var diffTime = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			this.valueHelpForOrganization.getContent()[0].getContent()[18].setValue(diffDays);
		},
		handleUpdateTableItems: function (evt) {
			if (this.getView().byId("usersTableId").getBinding("items").aFilters.length > 0) {
				this.getView().byId("clearFilterId").setVisible(true);
			} else {
				this.getView().byId("clearFilterId").setVisible(false);
			}
		},
		handleClearUserTableFilters: function () {
			this.getView().byId("usersTableId").getBinding("items").filter([]);
		},
		handleUsersTableItems: function (evt) {
			this.getView().byId("usersTableId").getBinding("items").filter([new sap.ui.model.Filter("roleid", "Contains", evt.getSource().getBindingContext()
				.getObject()._id)]);
		},
		onCloseDetailPress: function () {
			var bFullScreen = this.getView().getModel("appView").getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.getView().getModel("appView").setProperty("/actionButtonsInfo/midColumn/closeColumn", !bFullScreen);
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("adminMaster");
		},
		handleApplicationValueHelp: function () {
			this.handleListItemsSelected();
			this.valueHelpForApplicationList.open();
		},
		handleListItemsSelected: function () {
			for (var s = 0; s < this.valueHelpForOrganization.getModel().getData().application.length; s++) {
				for (var m = 0; m < this.valueHelpForApplicationList.getItems().length; m++) {
					if (this.valueHelpForOrganization.getModel().getData().application[s].name == this.valueHelpForApplicationList.getItems()[
							m].getBindingContext("applications").getObject().name) {
						this.valueHelpForApplicationList.getItems()[m].setSelected(true);
						break;
					}
				}
			}
		},
		handleConfirmAppList: function (evt) {
			var that = this;
			this.appObject = [];
			evt.getParameter("selectedItems").forEach(function (obj) {
				that.appObject.push(obj.getBindingContext("applications").getObject());
			});
			this.valueHelpForOrganization.getModel().getData()["application"] = this.appObject;
			this.valueHelpForOrganization.getModel().updateBindings(true);
		},
		handleInputTokenDeleted: function (evt) {
			var appPath = evt.getParameter("removedTokens")[0].getBindingContext().sPath.split("/")[2];
			evt.getParameter("removedTokens")[0].getBindingContext().getModel().getData().application.splice(appPath, 1);
		},
		handleCloseAppList: function () {
			//	this.valueHelpForApplicationList.close();
		}
	});
});