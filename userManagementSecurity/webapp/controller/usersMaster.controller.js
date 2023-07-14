sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"inhance/userManagementSecurity/util/formatter",
	"sap/m/MessageBox"
], function (Controller, formatter, MessageBox) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.usersMaster", {
		formatter: formatter,
		onInit: function () {
			if (!this.valueHelpForNewUser)
				this.valueHelpForNewUser = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForNewUser", this);
			this.getView().addDependent(this.valueHelpForNewUser);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("usersMaster").attachPatternMatched(this._objPatternMatched, this);
		},
		_objPatternMatched: function () {
			this.getView().getModel("appView").getProperty("/sideContent").getItem().getItems()[1].getItems()[0]._selectItem(true);
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.file = {
				"organisationid": this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid")
			};
			this.handleUserModel();
			this.handleRolesModel();
		},
		onAfterRendering: function () {
			this.handleUserModel();
			this.handleRolesModel();
		},
		handleUserModel: function (flag) {
			var that = this;
			var org_id = this.getView().getModel("appView").getProperty("/loginDetails/0/organisationid");
			$.get("/BrevoMongoDB/UM/getusers?param1=" + org_id, function (data) {
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
					var usersModel = new sap.ui.model.json.JSONModel(data);
					// usersModel.attachRequestCompleted(function () {
					that.getOwnerComponent().setModel(usersModel, "usersList");
					if (flag) {
						var listItems = that.getView().byId("itemlistId").getItems();
						listItems[listItems.length - 1].setSelected(true);
						that.getRouter().navTo("usersDetail", {
							userId: listItems[listItems.length - 1].getBindingContext("usersList").getObject()._id,
							path: listItems[listItems.length - 1].getBindingContext("usersList").getPath().split("/")[1]
						});
					}
					// });
				}
			});

		},
		handleRolesModel: function () {
			var that = this;
			var org_id = this.getView().getModel("appView").oData.loginDetails[0].organisationid;
			$.get("/BrevoMongoDB/UM/getroles?param1=" + org_id, function (data) {
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
		handleUsersListPress: function (evt) {
			this.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("usersDetail", {
				userId: evt.getParameter("listItem").getBindingContext("usersList").getObject()._id,
				path: evt.getParameter("listItem").getBindingContext("usersList").getPath().split("/")[1]
			});
		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		onNavBack: function () {
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			this.getRouter().navTo("Home");
		},
		handleAddNewCutsomer: function () {
			this.valueHelpForNewUser.getContent()[2].setVisible(true);
			this.valueHelpForNewUser.getContent()[2].getContent()[1].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[3].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[5].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[7].setValue(null);
			this.valueHelpForNewUser.getContent()[2].getContent()[9].setSelectedKey("");
			this.valueHelpForNewUser.getContent()[1].setVisible(false);
			this.valueHelpForNewUser.getContent()[2].setTitle("Create User");
			this.valueHelpForNewUser.getContent()[0].setVisible(true);
			this.valueHelpForNewUser.getContent()[0].setSelectedKey("Create User");
			this.valueHelpForNewUser.setTitle("Create User");
			this.valueHelpForNewUser.open();
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
				$.post("/BrevoMongoDB/UM/UploadUsers", this.file, function (data) {

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
						that.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded")
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
					$.post(("/BrevoMongoDB/UM/createuser?param1=" + roleid + "&param2=" + orgid /*+"&typevalue=" +typevalue*/ ), this.userObj,
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
								that.handleUserModel(true);
								that.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

							} else {
								MessageBox.error(data);
							}
						});
					this.valueHelpForNewUser.close();
				}
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
		onSearch: function (evt) {
			var filter1 = new sap.ui.model.Filter("firstname", "Contains", evt.getParameter("newValue"));
			var filter2 = new sap.ui.model.Filter("lastname", "Contains", evt.getParameter("newValue"));
			this.getView().byId("itemlistId").getBinding("items").filter(new sap.ui.model.Filter([filter1, filter2], false));
		},
		/*handleValidateEmail:function(oevt){
			var that=this;
					var email = oevt.getParameter("value");
					var numVal1 = "";
					var mailregex = /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/;
					if (!mailregex.test(email)) {
							numVal1 = numVal1 + email;
							oevt.getSource().setValue(numVal1);
							var _oInput = oevt.getSource();
							var val = _oInput.getValue();
							val = val.replace(/[^\d]/g, '');
							_oInput.setValue(val);
							this.numVal = numVal1; 
							sap.m.MessageToast.show("Please enter Valid Mail");
							//evt.getSource().setValueState("Error");
					  }else{
								// evt.getSource().setValueState("None");
								  that.valueHelpForNewUser.getContent()[2].getContent()[5].setValue(this.numVal);
									
									
								}
							
					
						},*/
		limitPhoneNumbers: function (evt) {
			var that = this;
			var num = evt.getParameter("value");
			var numVal1 = "";
			if (num.length <= 12) {
				for (var v = 0; v < num.length; v++) {
					numVal1 = numVal1 + num[v];
					evt.getSource().setValue(numVal1);
					var _oInput = evt.getSource();
					var val = _oInput.getValue();
					val = val.replace(/[^\d]/g, '');
					_oInput.setValue(val);
				}
				this.numVal = numVal1;
			} else {
				//var message = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("limitPhoneNumbers");
				sap.m.MessageToast.show("Please Enter 12 Digits only");
				that.valueHelpForNewUser.getContent()[2].getContent()[7].setValue(that.numVal);

			}

		}
	});
});