sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, MessageBox, formatter) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.rolesDetail", {
		formatter: formatter,
		onInit: function () {
			var that = this;
			/*	if (!this.addPagesAccess)
					this.addPagesAccess = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addPagesAccess", this);*/
			if (!this.valueHelpForRoles)
				this.valueHelpForRoles = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForRoles", this);
			if (!this.valueHelpForNewUser)
				this.valueHelpForNewUser = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForNewUser", this);
			this.getView().addDependent(this.valueHelpForRoles);
			this.getView().addDependent(this.valueHelpForNewUser);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("rolesDetail").attachPatternMatched(this.objMatched, this);
		},
		objMatched: function (oEvent) {
			this.roleId = oEvent.getParameter("arguments").roleId;
			this.roleItemIndex = oEvent.getParameter("arguments").path;
			var context = new sap.ui.model.Context(this.getOwnerComponent().getModel("rolesDetails"), "/" + oEvent.getParameter(
				"arguments").path);
			this.getView().setBindingContext(context, "rolesDetails");
			// this.getView().byId("userIconTabFilter").setCount(context.getModel().oData.length);
			this.getView().byId("userIconTabFilter").setCount(context.getObject().user.length);
			this.getView().setModel(new sap.ui.model.json.JSONModel(context.getObject()), "roleDetail");
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.destination = this.getView().getModel("appView").getProperty("/destination");
			this.file = {
				"organisationid": this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid")
			};
			// this.handleRolesModel();
		},
		handleDetailBinding: function () {
			var that = this;
			var context = new sap.ui.model.Context(that.getOwnerComponent().getModel("rolesDetails"), "/" + that.roleItemIndex);
			that.getView().setBindingContext(context, "rolesDetails");
			that.getView().byId("userIconTabFilter").setCount(context.getObject().users.length);
		},
		/*	handleRolesModel: function () {
				var that = this;
				this.getView().setBusy(true);
				var org_id = this.getView().getModel("appView").getProperty("/loginDetails/organisation_details/0/id");
				var rolesModel = new sap.ui.model.json.JSONModel("/User_Management/user_management/index.php/userInfo/get_roles?organisationid=" +
					org_id);
				rolesModel.attachRequestCompleted(function () {
					that.getView().setBusy(false);
					that.getOwnerComponent().setModel(rolesModel, "rolesDetails");
					that.handleDetailBinding();
				});
			},*/
		handleSaveCancelButton: function (flag) {
			this.getView().byId("saveButtonId").setVisible(flag);
			this.getView().byId("cancelButtonId").setVisible(flag);
			this.getView().byId("editButtonId").setVisible(!flag);
			this.getView().byId("deleteButtonId").setVisible(!flag);
		},
		handleSaveUser: function () {
			var that = this;
			MessageBox.confirm("Are you Sure want to save your changes", function (oEvent) {
				if (oEvent == "OK") {
					that.handleSaveCancelButton(false);
					MessageBox.information("Changes are saved Successfully");
				}
			});
		},
		handleCancelUser: function () {
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
		handleDeleteRolePress: function () {
			var that = this;
			this.getView().setBusy(true);
			MessageBox.confirm("Are yo sure want to delete the role?", function (oEvent) {
				if (oEvent == "OK") {
					var roleid = that.getView().getBindingContext("rolesDetails").oModel.oData[that.roleItemIndex]._id;
					$.post((that.destination + "/UM/deleterole?param1=" + roleid), //{
						//	id: parseInt(that.getView().getBindingContext("rolesDetails").oModel.oData[0]._id)
						//	}, 
						function (data) {

							if (data == "Invalid Session") {
								MessageBox.information("Your session has expired. Please log in again.", {
									onClose: function (oEvent) {
										if (oEvent == "OK") {
											that.handleInvalidSession();
										}
									}
								});
							} else if (data == "role") {
								that.getView().setBusy(false);
								that.getOwnerComponent().getModel("rolesDetails").oData.splice(that.roleItemIndex, 1);
								that.getOwnerComponent().getModel("rolesDetails").updateBindings(true);
								MessageBox.success("Role deleted successfully");
								that.getView().getModel("appView").setProperty("/layout", "OneColumn");
							} else
								that.getView().setBusy(false);
						});
				} else {
					that.getView().setBusy(false);
				}
			});
		},
		handleEditRolePress: function () {
			var rolesObj = {
				"id": this.getView().getBindingContext("rolesDetails").getObject()._id,
				"type": this.getView().getBindingContext("rolesDetails").getObject().type,
				"description": this.getView().getBindingContext("rolesDetails").getObject().description,
				"createdate": this.getView().getBindingContext("rolesDetails").getObject().createdate,
				"modifydate": new Date().toJSON(),
				"countofcreatepage": this.getView().getBindingContext("rolesDetails").getObject().countofcreatepage,
				"countofcreateuser": "",
				"organisationid": this.getView().getBindingContext("rolesDetails").getObject().organisationid
			};
			this.valueHelpForRoles.setModel(new sap.ui.model.json.JSONModel(rolesObj));
			this.handleLicenseFields();
			this.valueHelpForRoles.setTitle("Edit Role");
			this.valueHelpForRoles.open();
		},
		handleLicenseFields: function () {
			var appView = this.getView().getModel("appView");
			this.valueHelpForRoles.getContent()[1].getContent()[1].setSelectedKey(appView.getData().loginDetails[0].license.license_type);
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
			if (parseInt(evt.getSource().getValue()) > parseInt(that.getView().getModel("appView").getData().loginDetails[0].license.dashboardcountallowed)) {
				evt.getSource().setValueState("Error").setValueStateText("Assigned Dashboard Creation count is " + this.getView().getModel(
						"appView").oData
					.loginDetails[0].dashboardcountallowed);
			} else {
				evt.getSource().setValueState("None").setValueStateText("");
			}
		},
		handleRolesFragmentSave: function () {
			var that = this;
			if (this.handleValidationsForRoles() && that.valueHelpForRoles.getContent()[1].getContent()[7].getValueState() != "Error") {
				this.rolesObj = this.valueHelpForRoles.getModel().getData();
				var orgid = this.getView().getModel("roleDetail").getData().organisationid;
				var roleid = this.getView().getModel("roleDetail").getData()._id;
				$.post((that.destination + "/UM/editrole?param1=" + orgid + "&param2=" + roleid), this.rolesObj, function (data) {
					if (data == "Invalid Session") {
						MessageBox.information("Your session has expired. Please log in again.", {
							onClose: function (oEvent) {
								if (oEvent == "OK") {
									that.handleInvalidSession();
								}
							}
						});
					} else if (data == "okk") {
						MessageBox.success("Role Updated Successfully");
						that.getOwnerComponent().getModel("rolesDetails").setProperty(that.getView().getBindingContext("rolesDetails").sPath + "/type",
							that.rolesObj.type);
						that.getOwnerComponent().getModel("rolesDetails").setProperty(that.getView().getBindingContext("rolesDetails").sPath +
							"/description", that.rolesObj.description);
						that.getOwnerComponent().getModel("rolesDetails").setProperty(that.getView().getBindingContext("rolesDetails").sPath +
							"/countofcreatepage", that.rolesObj.countofcreatepage);
						that.getOwnerComponent().getModel("rolesDetails").setProperty(that.getView().getBindingContext("rolesDetails").sPath +
							"/modifydate", that.rolesObj.modifydate);
						that.getView().getModel("roleDetail").setProperty("/type", that.rolesObj.type);
						that.getView().getModel("roleDetail").setProperty("/description", that.rolesObj.description);
						that.getView().getModel("roleDetail").setProperty("/countofcreatepage", that.rolesObj.countofcreatepage);
						that.getView().getModel("roleDetail").updateBindings(true);
					} else {
						MessageBox.error(data);
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
		handleDateRange: function (evt) {
			var date1 = evt.getSource().getDateValue();
			var date2 = evt.getSource().getSecondDateValue();
			var diffTime = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			this.valueHelpForRoles.getContent()[1].getContent()[5].setValue(diffDays);
		},
		handleAddUsersPress: function () {
			/*this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("usersMaster");*/
			this.valueHelpForNewUser.getContent()[2].setVisible(true);
			this.valueHelpForNewUser.getContent()[2].getContent()[1].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[3].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[5].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[7].setValue(null);
			this.valueHelpForNewUser.getContent()[1].setVisible(false);
			this.valueHelpForNewUser.getContent()[2].getContent()[9].setSelectedKey(this.roleId);
			this.valueHelpForNewUser.getContent()[0].setVisible(true);
			this.valueHelpForNewUser.getContent()[0].setSelectedKey("Create User");
			this.valueHelpForNewUser.setTitle("Create User");
			this.valueHelpForNewUser.open();
		},

		handleRolesModel: function () {
			var that = this;
			var org_id = this.getView().getModel("appView").oData.loginDetails[0].organisationid;
			/*var rolesModel = new sap.ui.model.json.JSONModel("/BrevoMongoDB/UM/getroles?param1=" +
				org_id);
			rolesModel.attachRequestCompleted(function () {
				that.getOwnerComponent().setModel(rolesModel, "rolesDetails");
			});*/
			$.get(this.destination + "/UM/getroles?param1=" + org_id, function (data) {
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
					that.getOwnerComponent().setModel(rolesModel, "rolesDetails");
					// });
				}
			});
		},
		onUpload: function (evt) {
			var that = this;
			var file = evt.getParameter("files")[0];
			var reader = new FileReader();

			reader.onload = function () {
				that.file.data = reader.result;
				console.log(reader.result);
			};
			reader.onerror = function (error) {
				console.log('Error: ', error);
			};
			reader.readAsDataURL(file);
		},
		uploadUsers: function () {
			if (this.file.data) {
				var that = this;
				$.post(this.destination + "/UM/UploadUsers", this.file, function (data) {

					if (data == "Invalid Session") {
						MessageBox.information("Your session has expired. Please log in again.", {
							onClose: function (oEvent) {
								if (oEvent == "OK") {
									that.handleInvalidSession();
								}
							}
						});
					} else if (JSON.parse(data).status == "Success") {
						MessageBox.success("User Created Successfully");
						that.handleUserModel(true);
						that.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
						that.valueHelpForNewUser.close();
					} else
						MessageBox.error("Following Error occured while uploading users: " + JSON.parse(data).message);

				});
			} else
				MessageBox.error("Please select a file to upload");
		},
		handleAddUserOkPress: function () {
			if (this.valueHelpForNewUser.getContent()[0].getSelectedKey() == "Upload Users")
				this.uploadUsers();
			else {
				var that = this;
				if (this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue().length == 0 ||
					this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue().length == 0) {
					MessageBox.error("Please fill the mandatory fileds");
				} else {
					this.userObj = {
						"firstname": this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue(),
						"lastname": this.valueHelpForNewUser.getContent()[2].getContent()[3].getValue(),
						"password": "Vaspp@123",
						"organisationid": this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid"),
						"roleid": this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()
							._id,
						//	"typevalue":"manager",
						"typevalue": this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()
							.type,
						"user_emailid": this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue(),
						"contactnumber": this.valueHelpForNewUser.getContent()[2].getContent()[7].getValue(),
						"verified": "verified",
						"createdate": new Date().toJSON(),
						"modifydate": new Date().toJSON()
					};
					var orgid = this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid");
					var roleid = this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()
						._id;
					//var typevalue =this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject().type
					$.post((that.destination + "/UM/createuser?param1=" + roleid + "&param2=" + orgid /*+"&typevalue=" +typevalue*/ ), this.userObj,
						function (data) {
							//	$.post("/IMS/createuser?param1="+roleid+"&param2="+orgid, this.userObj, function (data) {

							if (data == "Invalid Session") {
								MessageBox.information("Your session has expired. Please log in again.", {
									onClose: function (oEvent) {
										if (oEvent == "OK") {
											that.handleInvalidSession();
										}
									}
								});
							} else if (data == "ok") {
								MessageBox.success("User Created Successfully");
								that.handleUserModel();
							} else {
								MessageBox.error(data);
							}
						});
					this.valueHelpForNewUser.close();
				}
			}
		},
		handleUserModel: function () {
			var that = this;
			var org_id = this.getView().getModel("appView").oData.loginDetails[0].organisationid;
			$.get(that.destination + "/UM/getrole?param1=" + org_id, function (data) {
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
					that.getOwnerComponent().setModel(rolesModel, "rolesDetails");
					that.getOwnerComponent().getModel("rolesDetails").updateBindings(true);
					var context = new sap.ui.model.Context(that.getOwnerComponent().getModel("rolesDetails"), "/" + that.roleItemIndex);
					that.getView().setBindingContext(context, "rolesDetails");
					// this.getView().byId("userIconTabFilter").setCount(context.getModel().oData.length);
					that.getView().byId("userIconTabFilter").setCount(context.getObject().user.length);
					that.getView().setModel(new sap.ui.model.json.JSONModel(context.getObject()), "roleDetail");

					// });
				}
			});

		},
		handleAddUserCancelPress: function () {
			this.valueHelpForNewUser.close();
		},
		handleChangeUsersCreate: function (evt) {
			if (evt.getParameter("item").getText() == "Create User") {
				this.valueHelpForNewUser.getContent()[2].setVisible(true);
				this.valueHelpForNewUser.getContent()[1].setVisible(false);
			} else {
				this.valueHelpForNewUser.getContent()[2].setVisible(false);
				this.valueHelpForNewUser.getContent()[1].setVisible(true);
			}
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
		onCloseDetailPress: function () {
			var bFullScreen = this.getView().getModel("appView").getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.getView().getModel("appView").setProperty("/actionButtonsInfo/midColumn/closeColumn", !bFullScreen);
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("rolesMaster");
		}
	});
});