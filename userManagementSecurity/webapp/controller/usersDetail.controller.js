sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"inhance/userManagementSecurity/util/formatter",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (Controller, formatter, MessageBox, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.usersDetail", {
		formatter: formatter,
		onInit: function () {
			var that = this;
			this.selectedPages = [];
			this.deletedPages = [];
			this.selectedModels = [];
			this.deletedModels = [];
			if (!this.addPagesAccess)
				this.addPagesAccess = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addPagesAccess", this);
			if (!this.addModels)
				this.addModels = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addModelAccess", this);
			this.getView().addDependent(this.addPagesAccess);
			this.getView().addDependent(this.addModels);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("usersDetail").attachPatternMatched(this.objMatched, this);
			if (!this.valueHelpForNewUser)
				this.valueHelpForNewUser = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForNewUser", this);
			this.getView().addDependent(this.valueHelpForNewUser);
			this.getView().byId("pagesAccessId2").setModel(new sap.ui.model.json.JSONModel([]));
		},
		objMatched: function (oEvent) {
			var that = this;
			this.userId = oEvent.getParameter("arguments").userId;
			this.userItemIndex = oEvent.getParameter("arguments").path;
			var context = new sap.ui.model.Context(this.getOwnerComponent().getModel("usersList"), "/" + oEvent.getParameter("arguments").path);
			this.getView().setBindingContext(context, "usersList");
			this.handleSaveCancelButton(false);
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].removeSelections(false);
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].removeSelections(false);
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.getView().setBusy(true);
			$.get("/BrevoMongoDB/UM/getuseraccess?userid=" + this.userId, function (data) {
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
					var accessModel = new sap.ui.model.json.JSONModel(data);
					// accessModel.attachRequestCompleted(function () {
					that.getView().setBusy(false);
					if (accessModel.getData()[0].PageAccess) {
						accessModel.getData()[0].PageAccess.forEach(function (obj) {
							obj["createid"] = that.getBooleanTerm(obj.createid);
							obj["deleteid"] = that.getBooleanTerm(obj.deleteid);
							obj["readid"] = that.getBooleanTerm(obj.readid);
							obj["shareid"] = that.getBooleanTerm(obj.shareid);
							obj["updateid"] = that.getBooleanTerm(obj.updateid);
						});
					} else
						accessModel.getData()[0].PageAccess = [];
					var pageAccessModel = new sap.ui.model.json.JSONModel(accessModel.getData()[0].PageAccess);
					that.getView().byId("pagesAccessId").setModel(pageAccessModel);
					if (accessModel.getData()[0].ModelAccess) {
						accessModel.getData()[0].ModelAccess.forEach(function (obj) {
							obj["createid"] = that.getBooleanTerm(obj.createid);
							obj["deleteid"] = that.getBooleanTerm(obj.deleteid);
							obj["readid"] = that.getBooleanTerm(obj.readid);
							obj["shareid"] = that.getBooleanTerm(obj.shareid);
							obj["updateid"] = that.getBooleanTerm(obj.updateid);
						});
					} else
						accessModel.getData()[0].ModelAccess = [];
					var modelAccessModel = new sap.ui.model.json.JSONModel(accessModel.getData()[0].ModelAccess);
					that.getView().byId("pagesAccessId2").setModel(modelAccessModel);
					// });
				}
			});

		},
		getBooleanTerm: function (flag) {
			if (flag == "false" || flag == false) return false;
			else if (flag == "true" || flag == true) return true;
		},
		handleAddPagesAccess: function () {
			this.addPagesAccess.getContent()[0].to(this.addPagesAccess.getContent()[0].getPages()[0].getId());
			// this.handleListItemsSelected();
			this.addPagesAccess.open();
		},
		handleAddModels: function (evt) {
			/*	if (typeof (this.addModels.getModel("fileModels").getData()) == "string") {
					var oModel = new sap.ui.model.json.JSONModel(JSON.parse(this.addModels.getModel("fileModels").getData()));
					this.addModels.setModel(oModel, "fileModels");
				}
				var list = this.addModels.getContent()[0];
				list.removeSelections();
				var listItems = list.getItems();
				var accessModel = this.getView().byId("pagesAccessId2").getModel().getData();
				for (var i = 0; i < listItems.length; i++) {
					for (var j = 0; j < accessModel.length; j++) {
						if (listItems[i].getTitle() == accessModel[j].modelName) {
							list.setSelectedItem(listItems[i]);
							break;
						}
					}
				}*/
			this.addModels.getContent()[0].to(this.addModels.getContent()[0].getPages()[0].getId());
			this.addModels.open();
		},
		handleDBSelected: function (evt) {
			var that = this;
			var db = (evt.getSource().getTitle() == "MongoDB") ? "Brevo" : "fileuploader";
			$.get("/BrevoMongoDB/getAllTablesAndViews?db=" + db, function (data) {
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
					var oModel = new sap.ui.model.json.JSONModel(data);
					// oModel.attachRequestCompleted(function () {
					var viewModel = new sap.ui.model.json.JSONModel(oModel.getData());
					// viewModel.attachRequestCompleted(function () {
					that.addModels.setModel(viewModel);
					that.handleModelListSelect();
					that.addModels.getContent()[0].to(that.addModels.getContent()[0].getPages()[1].getId());
					// });

					// });
				}
			});

		},
		handleModelListSelect: function (evt) {
			var modelAccess = this.getView().byId("pagesAccessId2").getModel().getData();
			// var list = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2];
			this.addModels.getContent()[0].getPages()[1].getContent()[1].removeSelections();
			var listItems = this.addModels.getContent()[0].getPages()[1].getContent()[1].getItems();
			var fileModel = this.addModels.getModel().getData().Tables;
			for (var i = 0; i < listItems.length; i++) {
				var path = listItems[i].getBindingContextPath().split("/")[2];
				for (var j = 0; j < modelAccess.length; j++) {
					if (fileModel[path].TABLE_NAME == modelAccess[j].modelName && fileModel[path].TABLE_CATALOG == modelAccess[j].db) {
						this.addModels.getContent()[0].getPages()[1].getContent()[1].setSelectedItem(this.addModels.getContent()[0].getPages()[
							1].getContent()[1].getItems()[i]);
						break;
					}
				}
			}
		},
		handleAddModelAccess: function (evt) {
			// var selectedItems = this.selectedModels;
			var selectedItems = this.addModels.getContent()[0].getPages()[1].getContent()[1].getSelectedItems();
			var accessModel = this.getView().byId("pagesAccessId2").getModel().getData();

			if (selectedItems.length > 0) {
				var arr = [];
				for (var m = 0; m < selectedItems.length; m++) {
					var exists = false;
					for (var n = 0; n < accessModel.length; n++) {
						if (selectedItems[m].getBindingContext().getObject().TABLE_NAME == accessModel[n].modelName && selectedItems[m].getBindingContext()
							.getObject().TABLE_CATALOG == accessModel[n].db) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						var obj = {
							modelName: selectedItems[m].getBindingContext().getObject().TABLE_NAME,
							userid: this.userId,
							db: selectedItems[m].getBindingContext().getObject().TABLE_CATALOG,
							// pageid: selectedItems[m].getBindingContext("fileModels").getObject()._id,
							createdate: new Date().toJSON(),
							modifydate: new Date().toJSON(),
							createid: false,
							readid: false,
							updateid: false,
							deleteid: false,
							shareid: false
						};
						//arr.push(obj);
						accessModel.push(obj);
					}
				}
				this.getView().byId("pagesAccessId2").getModel().updateBindings(true);
				this.selectedModels = [];
				this.addModels.close();
				this.handleSaveCancelButton(true);
			} else {
				MessageBox.error("Please select a Model");
			}
		},
		handleAddModelsDialogClose: function (evt) {
			// var selectedItems = this.selectedModels;
			var selectedItems = this.addModels.getContent()[0].getSelectedItems();
			var accessModel = this.getView().byId("pagesAccessId2").getModel().getData();

			if (selectedItems.length > 0) {
				var arr = [];
				for (var m = 0; m < selectedItems.length; m++) {
					var exists = false;
					for (var n = 0; n < accessModel.length; n++) {
						if (selectedItems[m].getBindingContext("fileModels").getObject().FileName == accessModel[n].modelName) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						var obj = {
							modelName: selectedItems[m].getBindingContext("fileModels").getObject().FileName,
							userid: this.userId,
							// pageid: selectedItems[m].getBindingContext("fileModels").getObject()._id,
							createdate: new Date().toJSON(),
							modifydate: new Date().toJSON(),
							createid: false,
							readid: false,
							updateid: false,
							deleteid: false,
							shareid: false
						};
						//arr.push(obj);
						accessModel.push(obj);
					}
				}
				this.getView().byId("pagesAccessId2").getModel().updateBindings(true);
				this.selectedModels = [];
				this.addModels.close();
				this.handleSaveCancelButton(true);
			} else {
				MessageBox.error("Please select a Page");
			}
		},
		handlePageTypeSelected: function (evt) {
			this.selApplication = evt.getSource().getBindingContext("appView").getObject();
			// var flag = evt.getSource().getTitle() == "Dashboard builder" || "Dashboard Builder" || "Brevo" || "brevo" ? true : false;
			// this.typeOfPageSelected = flag == true ? 1 : 2;
			this.typeOfPageSelected = 1;
			var flag;
			if (evt.getSource().getTitle() == "Dashboard builder" || evt.getSource().getTitle() == "Dashboard Builder" || evt.getSource().getTitle() ==
				"Brevo" || evt.getSource().getTitle() == "brevo" || evt.getSource().getTitle() == "BREVO Dashboard Viewer") {
				flag = "D";
			} else if (evt.getSource().getTitle() == "Analytic Page builder" || evt.getSource().getTitle() == "Pana Builder" || evt.getSource()
				.getTitle() == "PANA Builder" || evt.getSource().getTitle() == "pana" ||
				evt.getSource().getTitle() == "BREVO PANA Viewer") {
				flag = "A";
			} else flag = "D";
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[0].setValue();
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].setVisible(true);
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].setVisible(false);
			var filter = new Filter("TypeOfPage", FilterOperator.EQ, flag);
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getBinding("items").filter([filter]);
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].getBinding("items").filter([]);
			this.addPagesAccess.getContent()[0].to(this.addPagesAccess.getContent()[0].getPages()[1].getId());
			//this.handleListItemsSelected();
		},
		/*handleListItemsSelected: function () {
			var listItems = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[this.typeOfPageSelected]._getPropertiesToPropagate()
				.oModels.pages.getData(); //this.addPagesAccess.getContent()[0].getPages()[1].getContent()[this.typeOfPageSelected].oPropagatedProperties.oModels.pages.getData();//this.addPagesAccess.getContent()[0].getPages()[1].getContent()[this.typeOfPageSelected].getItems();
			var accessPages = this.getView().byId("pagesAccessId").getModel().oData;
			for (var a = 0; a < accessPages.length; a++) {
				for (var b = 0; b < listItems.length; b++) {
					if (accessPages[a].pageid == listItems[b]._id) {
						//listItems[b].getBindingContext("pages").getObject()._id;
						//listItems[b].setSelected(true);
						break;
					}
				}
			}
		},*/
		handleListItemsSelected: function () {
			var pageAccess = this.getView().byId("pagesAccessId").getModel().getData();
			// var list = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2];
			this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].removeSelections();
			var listItems = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getItems();
			var pageModel = this.getView().getModel("pages").getData().d.results;
			for (var i = 0; i < listItems.length; i++) {
				var path = listItems[i].getBindingContextPath().split("/")[3];
				for (var j = 0; j < pageAccess.length; j++) {
					if (pageModel[path].Page_Id == pageAccess[j].pageid) {
						this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].setSelectedItem(this.addPagesAccess.getContent()[0].getPages()[
							1].getContent()[1].getItems()[i]);
						break;
					}
				}
			}
		},

		oNavigationBackBackPress: function (evt) {
			evt.getSource().getParent().to(evt.getSource().getParent().getPages()[0].getId());
		},
		handleSearchPages: function (evt) {
			var filter = new sap.ui.model.Filter("name", "Contains", evt.getParameter("newValue"));
			if (this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getVisible()) {
				this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getBinding("items").filter(filter);
			} else {
				this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].getBinding("items").filter(filter);
			}
		},
		handleAddUserAccess: function (evt) {
			var that = this;
			//var selectedItems = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[this.typeOfPageSelected].getSelectedItems();
			// var selectedItems = this.selectedPages;
			var selectedItems = this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getSelectedItems();
			var accessModel = this.getView().byId("pagesAccessId").getModel().getData();
			if (selectedItems.length > 0) {
				var arr = [];
				for (var m = 0; m < selectedItems.length; m++) {
					var exists = false;
					for (var n = 0; n < accessModel.length; n++) {
						if (selectedItems[m].getBindingContext("pages").getObject().Page_Id == accessModel[n].pageid) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						var obj = {
							applicationname: this.selApplication.name,
							pagetitle: selectedItems[m].getBindingContext("pages").getObject().PageTitle,
							TypeOfPage: selectedItems[m].getBindingContext("pages").getObject().type,
							userid: this.userId,
							applicationid: this.selApplication._id,
							pageid: selectedItems[m].getBindingContext("pages").getObject().Page_Id,
							createdate: new Date().toJSON(),
							modifydate: new Date().toJSON(),
							createid: false,
							readid: false,
							updateid: false,
							deleteid: false,
							shareid: false
						};
						//arr.push(obj);
						accessModel.push(obj);
					}
				}
				this.getView().byId("pagesAccessId").getModel().updateBindings(true);
				this.selectedPages = [];
				//this.getView().getModel().oData.users[this.userItemIndex].access = [];
				/*this.getView().byId("pagesAccessId").setModel(new sap.ui.model.json.JSONModel({
					Useraccess: arr
				}));*/

				this.addPagesAccess.close();
				this.handleSaveCancelButton(true);
			} else {
				MessageBox.error("Please select a Page");
			}

		},
		handleCancelUserAccess: function () {
			this.addPagesAccess.close();
		},
		handleDeletePageAccess: function (evt) {
			var selectedItems = this.getView().byId("pagesAccessId").getSelectedItems();
			if (selectedItems.length > 0) {
				for (var r = selectedItems.length - 1; r >= 0; r--) {
					for (var b = this.getView().byId("pagesAccessId").getModel().oData.length - 1; b >= 0; b--) {
						if (selectedItems[r].getBindingContext().getObject().pageid == this.getView().byId("pagesAccessId").getModel().oData[
								b].pageid) {
							if (selectedItems[r].getBindingContext().getObject()._id)
								this.deletedPages.push(selectedItems[r].getBindingContext().getObject()._id);
							this.getView().byId("pagesAccessId").getModel().oData.splice(b, 1);
							break;
						}
					}
				}
				this.getView().byId("pagesAccessId").getModel().updateBindings(true);
				this.getView().byId("pagesAccessId").removeSelections(false);
				this.handleSaveCancelButton(true);
			} else {
				MessageBox.error("Please select an item to delete");
			}
			this.getView().getModel().updateBindings(true);
		},
		handleModelsSelected: function (evt) {
			console.log(evt);
		},
		handleSaveCancelButton: function (flag) {
			this.getView().byId("saveButtonId").setVisible(flag);
			this.getView().byId("cancelButtonId").setVisible(flag);
			this.getView().byId("editButtonId").setVisible(!flag);
			this.getView().byId("deleteButtonId").setVisible(!flag);
		},
		handleSaveUserAccess: function () {
			var that = this;
			var pageAccessObj = this.getView().byId("pagesAccessId").getModel().getData();
			var modelAccessObj = this.getView().byId("pagesAccessId2").getModel().getData();
			MessageBox.confirm("Do u want to save your changes", {
				onClose: function (oEvent) {
					that.getView().setBusy(true);
					// var accessObj = that.getView().byId("pagesAccessId").getModel().oData;
					/*this.object = {
						applicationname: accessObj[0].applicationname,
						pagetitle: accessObj[0].pagetitle,
						//TypeOfPage: accessObj[0]
						userid: accessObj[0].userid,
						applicationid: accessObj[0].applicationid,
						pageid: accessObj[0].pageid,
						createdate: new Date().toJSON(),
						modifydate: new Date().toJSON(),
						createid: accessObj[0].createid,
						readid: accessObj[0].readid,
						updateid: accessObj[0].updateid,
						deleteid: accessObj[0].deleteid,
						shareid: accessObj[0].shareid

					};*/
					var obj = {
						userId: that.userId,
						pageAccess: pageAccessObj,
						ModelAccess: modelAccessObj,
						deletedPageAccessIds: that.deletedPages,
						deletedModelAccessIds: that.deletedModels
					};
					var param1 = that.userId;
					// var param2 = accessObj[0].applicationid;
					// var param3 = accessObj[0].pageid;
					$.post(("/BrevoMongoDB/UM/edituseraccess"),
						obj,
						function (data) {
							//$.post("/User_Management/user_management/index.php/userInfo/create_useraccess", {useraccess:accessObj} , function (data) {
							that.getView().setBusy(false);
							if (data == "Invalid Session") {
								MessageBox.information("Your session has expired. Please log in again.", {
									onClose: function (oEvent) {
										if (oEvent == "OK") {
											that.handleInvalidSession();
										}
									}
								});
							} else if (data == "ok") {
								MessageBox.success("Access Assigned Successfully");
								that.handleSaveCancelButton(false);
							} else {
								MessageBox.error(data);
							}
						});
				}
			});
		},
		handleCancelUser: function () {
			var that = this;
			MessageBox.confirm("Are you sure want to cancel your changes", {
				onClose: function (oEvent) {
					if (oEvent == "OK") {
						$.get("/BrevoMongoDB/UM/getuseraccess?userid=" + that.userId, function (data) {
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
								var accessModel = new sap.ui.model.json.JSONModel(data);
								// accessModel.attachRequestCompleted(function () {
								that.getView().setBusy(false);
								if (accessModel.getData()[0].PageAccess) {
									accessModel.getData()[0].PageAccess.forEach(function (obj) {
										obj["createid"] = that.getBooleanTerm(obj.createid);
										obj["deleteid"] = that.getBooleanTerm(obj.deleteid);
										obj["readid"] = that.getBooleanTerm(obj.readid);
										obj["shareid"] = that.getBooleanTerm(obj.shareid);
										obj["updateid"] = that.getBooleanTerm(obj.updateid);
									});
								} else
									accessModel.getData()[0].PageAccess = [];
								var pageAccessModel = new sap.ui.model.json.JSONModel(accessModel.getData()[0].PageAccess);
								that.getView().byId("pagesAccessId").setModel(pageAccessModel);
								if (accessModel.getData()[0].ModelAccess) {
									accessModel.getData()[0].ModelAccess.forEach(function (obj) {
										obj["createid"] = that.getBooleanTerm(obj.createid);
										obj["deleteid"] = that.getBooleanTerm(obj.deleteid);
										obj["readid"] = that.getBooleanTerm(obj.readid);
										obj["shareid"] = that.getBooleanTerm(obj.shareid);
										obj["updateid"] = that.getBooleanTerm(obj.updateid);
									});
								} else
									accessModel.getData()[0].ModelAccess = [];
								var modelAccessModel = new sap.ui.model.json.JSONModel(accessModel.getData()[0].ModelAccess);
								that.getView().byId("pagesAccessId2").setModel(modelAccessModel);
								// });
							}
						});

						that.handleSaveCancelButton(false);
						//MessageBox.information("Changes are not saved");
					}
				}
			});
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
		handleDeleteUserPress: function () {
			var that = this;
			this.getView().setBusy(true);
			MessageBox.confirm("Are you sure want to delete a user?", {
				onClose: function (oEvent) {
					if (oEvent == "OK") {
						var userid = that.userId;
						$.post(("/BrevoMongoDB/UM/deleteuser?param1=" + userid), {
							id: that.getView().getBindingContext("usersList").getObject()._id
						}, function (data) {
							if (data == "Invalid Session") {
								MessageBox.information("Your session has expired. Please log in again.", {
									onClose: function (oEvent) {
										if (oEvent == "OK") {
											that.handleInvalidSession();
										}
									}
								});
							} else if (data == "okk") {
								that.getView().setBusy(false);
								that.getOwnerComponent().getModel("usersList").getData().splice(that.userItemIndex, 1);
								var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
								oRouter.navTo("usersMaster");
								that.getOwnerComponent().getModel("usersList").updateBindings(true);
								MessageBox.success("User deleted successfully");
								that.getView().getModel("appView").setProperty("/layout", "OneColumn");
							} else that.getView().setBusy(false);
						});
					} else
						that.getView().setBusy(false);
				}
			});
		},
		handleEditUserPress: function () {
			this.valueHelpForNewUser.getContent()[2].setVisible(true);
			this.valueHelpForNewUser.getContent()[1].setVisible(false);
			this.valueHelpForNewUser.getContent()[0].setVisible(false);
			this.valueHelpForNewUser.getContent()[2].setTitle("Edit User");
			var userObj = this.getView().getBindingContext("usersList").getObject();
			this.valueHelpForNewUser.getContent()[2].getContent()[1].setValue(userObj.firstname);
			this.valueHelpForNewUser.getContent()[2].getContent()[3].setValue(userObj.lastname);
			this.valueHelpForNewUser.getContent()[2].getContent()[5].setValue(userObj.user_emailid);
			this.valueHelpForNewUser.getContent()[2].getContent()[7].setValue(userObj.contactnumber);
			this.valueHelpForNewUser.getContent()[2].getContent()[9].setSelectedKey(userObj.roleid);
			// this.valueHelpForNewUser.getContent()[2].getContent()[9].setSelectedKey(userObj.roletype);
			this.valueHelpForNewUser.setTitle("Edit User");

			this.valueHelpForNewUser.open();
		},
		handleAddUserOkPress: function () {
			var that = this;
			if (this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue().length == 0 ||
				this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue().length == 0) {
				MessageBox.error("Please fill the mandatory fileds");
			} else {
				this.userObj = {
					"id": this.userId,
					"firstname": this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue(),
					"lastname": this.valueHelpForNewUser.getContent()[2].getContent()[3].getValue(),
					"password": "Vaspp@123",
					"organisationid": this.getView().getModel("appView").getProperty("/loginDetails/0/organisation/_id"),
					"roleid": this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()
						._id,
					"typevalue": this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getText(), //this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject().type,

					"user_emailid": this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue(),
					"contactnumber": this.valueHelpForNewUser.getContent()[2].getContent()[7].getValue(),
					"verified": "1",
					"createdate": new Date().toJSON(),
					"modifydate": new Date().toJSON()
				};
				var param1 = this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()
					._id;
				var param2 = this.getView().getModel("appView").getProperty("/loginDetails/0/organisation/_id");
				var param3 = this.userId;
				$.post(("/BrevoMongoDB/UM/edituser?param1=" + param1 + "&param2=" + param2 + "&param3=" + param3),
					this.userObj,
					function (data) {
						if (data == "Invalid Session") {
							MessageBox.information("Your session has expired. Please log in again.", {
								onClose: function (oEvent) {
									if (oEvent == "OK") {
										that.handleInvalidSession();
									}
								}
							});
						} else if (data == "ok") {
							MessageBox.success("User Edited Successfully");
							that.userObj["roletype"] = that.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext(
								"rolesDetails").getObject().type;
							that.userObj["_id"] = that.userId;
							that.getView().getModel("usersList").getData()[that.userItemIndex] = that.userObj;
							that.getView().getModel("usersList").updateBindings(true);
						} else {
							MessageBox.error(JSON.parse(data).status);
						}
					});
				this.valueHelpForNewUser.close();
			}
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
		onCloseDetailPress: function () {
			var bFullScreen = this.getView().getModel("appView").getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.getView().getModel("appView").setProperty("/actionButtonsInfo/midColumn/closeColumn", !bFullScreen);
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("usersMaster");
		},
		handleAccessPressed: function (evt) {
			this.handleSaveCancelButton(true);
			// evt.getSource().mBindingInfos.selected.binding.sPath = evt.getParameter("selected")
			// evt.getSource().getBindingContext().getObject()[evt.getSource().mBindingInfos.selected.binding.sPath] = evt.getParameter(
			// 	"selected")
			var path = evt.getSource().getBindingContext().sPath.split("/")[1];
			var id = evt.getSource().getId();
			if (id.includes("createid"))
				evt.getSource().getParent().getParent().getModel().oData[path].createid = evt.getSource().getSelected();
			else if (id.includes("readid"))
				evt.getSource().getParent().getParent().getModel().oData[path].readid = evt.getSource().getSelected();
			else if (id.includes("updateid"))
				evt.getSource().getParent().getParent().getModel().oData[path].updateid = evt.getSource().getSelected();
			else if (id.includes("deleteid"))
				evt.getSource().getParent().getParent().getModel().oData[path].deleteid = evt.getSource().getSelected();
			else if (id.includes("shareid"))
				evt.getSource().getParent().getParent().getModel().oData[path].shareid = evt.getSource().getSelected();
			evt.getSource().getModel().updateBindings(true);
		},
		handleListPageSelected: function (evt) {
			this.selectedPages.push(evt.getParameter("listItem"));
		},
		handleListModelSelected: function (evt) {
			this.selectedModels.push(evt.getParameter("listItem"));
		},
		handleAddModelsDialogCancel: function (evt) {
			this.addModels.close();
		},
		handleDeleteModels: function (evt) {
			var selectedItems = this.getView().byId("pagesAccessId2").getSelectedItems();
			if (selectedItems.length > 0) {
				for (var r = selectedItems.length - 1; r >= 0; r--) {
					for (var b = this.getView().byId("pagesAccessId2").getModel().oData.length - 1; b >= 0; b--) {
						if (selectedItems[r].getBindingContext().getObject().modelName == this.getView().byId("pagesAccessId2").getModel().oData[
								b].modelName && selectedItems[r].getBindingContext().getObject().db == this.getView().byId("pagesAccessId2").getModel().oData[
								b].db) {
							if (selectedItems[r].getBindingContext().getObject()._id) {
								this.deletedModels.push(selectedItems[r].getBindingContext().getObject()._id);
							}
							this.getView().byId("pagesAccessId2").getModel().oData.splice(b, 1);
							break;
						}
					}
				}
				this.getView().byId("pagesAccessId2").getModel().updateBindings(true);
				this.getView().byId("pagesAccessId2").removeSelections(false);
				this.handleSaveCancelButton(true);
			} else {
				MessageBox.error("Please select an item to delete");
			}
			this.getView().getModel().updateBindings(true);
		}
	});
});