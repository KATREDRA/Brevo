sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"Brevo/QueryBuilder/model/Service"
], function (Controller, History, MessageToast, service) {
	"use strict";
	return Controller.extend("Brevo.QueryBuilder.controller.SqlEditor", {

		escapePreventDialog: null,
		onInit: function () {
			var that = this;
			this.edit = false;
			this.query = "";
			that.BusyDialog = new sap.m.BusyDialog();
			this.queryId = "";
			this.tile = "";
			this.created = "";
			this.dbName = "";
			that.getView().byId("aCodeEditor").setValue("");

			if (!that.createViewDialog) {
				that.createViewDialog = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.createView", that);
			}
			if (!that.editViewDialog) {
				that.editViewDialog = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.editView", that);
			}

			sap.ui.core.UIComponent.getRouterFor(this).getRoute("sqlEditor").attachPatternMatched(this.onPatternMatched, this);
		},
		onPatternMatched: function (evt) {
			var that = this;
			var isQueryPresent = evt.getParameter("arguments").isQueryPresent;
			var isEditMode = evt.getParameter("arguments").isEditMode;
			if (isQueryPresent) {
				var queryModel = sap.ui.getCore().getModel("dataQueryModel");
				that.getView().byId("aCodeEditor").setValue(queryModel.getData().query);
				that.getView().byId("create").setVisible(true);
				that.getView().byId("update").setVisible(false);
				that.getView().byId("wizardButton").setEnabled(true);
				that.dataModel = sap.ui.getCore().getModel("queryInfo");
			} else if (isEditMode) {
				var queryModel = sap.ui.getCore().getModel("queryInfo");
				that.getView().byId("aCodeEditor").setValue(queryModel.getData().query);
				that.getView().byId("create").setVisible(false);
				that.getView().byId("update").setVisible(true);
				that.getView().byId("wizardButton").setEnabled(false);
			}
		},
		onNavBack: function () {
			this.getView().byId("aCodeEditor").setValue("");
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("home", {}, true);
			}
		},
		onWizardPress: function (event) {
			var that = this;
			this.editMode = false;
			var edit = this.editMode;
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			var sQuery = sqlQuery.split(" ");
			var url = "WizardDetail";
			var wizardObj = {
				query: sqlQuery
			};
			if (sqlQuery.length === 0) {
				sap.m.MessageToast.show("Invalid Query");
			} else if (sQuery[0] !== "select" && sQuery[0] !== "SELECT") {
				sap.m.MessageToast.show("Only select operation can be performed");
			} else {
				that.BusyDialog.open();
				this.validateQuery(sqlQuery, false, true, function (valid) {
					if (valid) {
						that.BusyDialog.close();
						service.callCreateService(url, JSON.stringify(wizardObj), "POST", function (evt, sucessFlag, oError) {
							if (sucessFlag) {
								var data = JSON.parse(evt).data;
								var wizardModel = new sap.ui.model.json.JSONModel(data);
								sap.ui.getCore().setModel(wizardModel, "wizardDataModel");
								oRouter.navTo("createQuery", {
									isWizardDataPresent: true
								});
							} else {
								sap.m.MessageToast.show("Internal Service Error");
							}
						});
					} else {
						sap.m.MessageToast.show("Invalid Query");
					}
				});

			}
		},
		onValidatePress: function () {
			var that = this;
			that.BusyDialog.open();
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();
			var sQuery = sqlQuery.split(" ");
			if (sQuery[0] !== "select" && sQuery[0] !== "SELECT") {
				sap.m.MessageToast.show("Only select operation can be performed");
			} else {
				this.validateQuery(sqlQuery, false, true, function (valid) {
					if (valid) {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Valid Query");
					} else {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Invalid Query");
					}
				});
			}

		},
		validateQuery: function (query, dataPreview, sqlValidate, callback) {
			var that = this;

			var inputObj = {
				"query": query,
				"data_preview": dataPreview,
				"sql_validate": sqlValidate
			};
			var url = "ValidateQuery";
			service.callCreateService(url, JSON.stringify(inputObj), "POST", function (evt, sucessFlag, oError) {
				if (sucessFlag) {
					callback(true, evt);
				} else {
					callback(false);
				}
			});
		},
		onDepartmentChangeOnCreate: function () {
			var departmt = this.createViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (departmt === "Add a New Category") {
				this.createViewDialog.getContent()[0].getContent()[6].setVisible(true);
				this.createViewDialog.getContent()[0].getContent()[6].setValue("");
				this.createViewDialog.getContent()[0].getContent()[7].setVisible(true);
			}
		},
		onDepartmentChangeOnEdit: function () {
			var departmt = this.editViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (departmt === "Add a New Department") {
				this.editViewDialog.getContent()[0].getContent()[6].setVisible(true);
				this.editViewDialog.getContent()[0].getContent()[6].setValue("");
				this.editViewDialog.getContent()[0].getContent()[7].setVisible(true);
			}
		},
		onExecutePress: function () {
			var that = this;
			if (this.getView().byId("aCodeEditor").getValue().length > 0) {
				that.BusyDialog.open();
				var dataBaseName = that.dbName;
				var sqlQuery = this.getView().byId("aCodeEditor").getValue();

				var sQuery = sqlQuery.split(" ");
				// if (sQuery[1] != "top") {
				// 	sQuery.splice(1, 0, "top 1000");
				// 	sqlQuery = sQuery.join(" ");
				// }
				if (sqlQuery.length === 0) {
					sap.m.MessageToast.show("Invalid Query");
				} else if (sQuery[0] !== "select" && sQuery[0] !== "SELECT") {
					sap.m.MessageToast.show("Only select operation can be performed");
				} else {
					this.validateQuery(sqlQuery, false, true, function (valid) {
						if (valid) {
							that.validateQuery(sqlQuery, true, false, function (success, evt) {
								if (success) {
									var data = JSON.parse(evt).tables;
									var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
									var dataModel = new sap.ui.model.json.JSONModel(data);
									sap.ui.getCore().setModel(dataModel, "dataPreviewModel");
									oRouter.navTo("dataPreview");
									that.BusyDialog.close();
								} else {
									that.BusyDialog.close();
									sap.m.MessageToast.show("No Data to Preview");
								}
							});
						} else {
							that.BusyDialog.close();
							sap.m.MessageToast.show("Invalid Query");
						}
					});

				}
			} else {
				sap.m.MessageToast.show("Please enter the query");
			}

		},
		onCreateViewPress: function () {
			var that = this;
			var dataBaseName = that.dbName;
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();

			var sQuery = sqlQuery.split(" ");
			if (sqlQuery.length === 0) {
				sap.m.MessageToast.show("Please Enter the Query");
			} else if (sQuery[0] !== "select" && sQuery[0] !== "SELECT") {
				sap.m.MessageToast.show("Only select operation can be performed");
			} else {
				this.validateQuery(sqlQuery, false, true, function (valid) {
					if (valid) {
						var oModel = sap.ui.getCore().getModel("Departments");
						var duplicateDeptModel = new sap.ui.model.json.JSONModel();
						duplicateDeptModel.oData.tables = [];
						for (var i = 0; i < oModel.oData.tables.length; i++) {
							duplicateDeptModel.oData.tables.push(oModel.oData.tables[i]);
						}
						var valueArr = duplicateDeptModel.oData.tables.map(function (item) {
							return item.Department_name
						});
						if (!valueArr.includes("Add a New Department")) {
							duplicateDeptModel.oData.tables.push({
								// "Dep_Id": "0",
								"Department_name": "Add a New Department"
							});
						}
						that.createViewDialog.getContent()[0].getContent()[1].setValue("");
						that.createViewDialog.getContent()[0].getContent()[3].setValue("");
						that.createViewDialog.getContent()[0].getContent()[5].setModel(duplicateDeptModel);
						that.createViewDialog.open();
					} else {
						sap.m.MessageToast.show("Invalid Query");
					}
				});

			}

		},
		onCreatePress: function () {
			var that = this;
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			var name = this.createViewDialog.getContent()[0].getContent()[1].getValue();
			var descrip = this.createViewDialog.getContent()[0].getContent()[3].getValue();
			var departmt = this.createViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (name.length > 0) {
				var postData;
				var url;
				postData = {
					"last_change": new Date(),
					"table_config": "",
					"query": sqlQuery,
					"view_name": name.replace(/[^a-zA-Z0-9]/g, '_'),
					"created_through": "editor",
					"user_name": "",
					"description": descrip,
					"department": departmt
				};
				url = "CreateView";

				service.callCreateService(url, JSON.stringify(postData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						sap.m.MessageToast.show("View Created Successfully");
						// var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
						oRouter.navTo("home");
						that.createViewDialog.close();
					} else if (JSON.parse(evt).message === "View with this ID already exists") {
						sap.m.MessageToast.show("Query Name already exists.Please give a different Query Name");
					} else {
						sap.m.MessageToast.show("Unable to create view.Try again");
					}
				});

			} else {
				sap.m.MessageToast.show("Query Name cannot be empty");
			}
		},
		onCreateCancelPress: function () {
			this.createViewDialog.getContent()[0].getContent()[1].setValue("");
			this.createViewDialog.close();
		},
		onUpdateViewPress: function () {
			var that = this;
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();

			var sQuery = sqlQuery.split(" ");
			if (sqlQuery.length === 0) {
				sap.m.MessageToast.show("Invalid Query");
			} else if (sQuery[0] !== "select" && sQuery[0] !== "SELECT") {
				sap.m.MessageToast.show("Only select operation can be performed");
			} else {
				this.validateQuery(sqlQuery, false, true, function (valid) {
					if (valid) {
						var tileModel = sap.ui.getCore().getModel("queryInfo");
						var oModel = sap.ui.getCore().getModel("Departments");
						var duplicateDeptModel = new sap.ui.model.json.JSONModel();
						duplicateDeptModel.oData.tables = [];
						for (var i = 0; i < oModel.oData.tables.length; i++) {
							duplicateDeptModel.oData.tables.push(oModel.oData.tables[i]);
						}
						var valueArr = duplicateDeptModel.oData.tables.map(function (item) {
							return item.Department_name
						});
						if (!valueArr.includes("Add a New Department")) {
							duplicateDeptModel.oData.tables.push({
								// "Dep_Id": "0",
								"Department_name": "Add a New Department"
							});
						}
						that.editViewDialog.getContent()[0].getContent()[1].setValue(tileModel.getData().view_name);
						that.editViewDialog.getContent()[0].getContent()[3].setValue(tileModel.getData().description);
						that.editViewDialog.getContent()[0].getContent()[5].setModel(duplicateDeptModel);
						that.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(tileModel.getData().department);
						that.editViewDialog.open();
					} else {
						sap.m.MessageToast.show("Invalid Query");
					}
				});

			}

		},
		onUpdatePress: function () {
			var that = this;
			var sqlQuery = this.getView().byId("aCodeEditor").getValue();
			var tileModel = sap.ui.getCore().getModel("queryInfo");
			var name = this.editViewDialog.getContent()[0].getContent()[1].getValue();

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			if (name.length > 0) {
				var updatedData;
				var url;
				var descrip = this.editViewDialog.getContent()[0].getContent()[3].getValue();
				var departmt = this.editViewDialog.getContent()[0].getContent()[5].getSelectedKey();
				updatedData = {
					"last_change": new Date(),
					"table_config": "",
					"query": sqlQuery,
					"view_name": name.replace(/[^a-zA-Z0-9]/g, '_'),
					"created_through": "editor",
					"user_name": "",
					"description": descrip,
					"department": departmt,
					"_id": tileModel.getData()._id,
				};
				url = "UpdateView";
				service.callCreateService(url, JSON.stringify(updatedData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						sap.m.MessageToast.show("View Updated Successfully");
						oRouter.navTo("home");
						that.editViewDialog.close();
					} else if (JSON.parse(evt).message === "View with this ID already exists") {
						sap.m.MessageToast.show("Query Name already exists.Please give a different Query Name");
					} else {
						sap.m.MessageToast.show("Unable to update view.Try again");
					}
				});

			} else {
				sap.m.MessageToast.show("Query Name cannot be empty");
			}
		},
		onUpdateCancelPress: function () {
			this.editViewDialog.getContent()[0].getContent()[1].setValue("");
			this.editViewDialog.close();
		},
		onAddDeptPressOnCreate: function () {
			var that = this;
			var oModel = this.createViewDialog.getContent()[0].getContent()[5].getModel();
			var newDept = this.createViewDialog.getContent()[0].getContent()[6].getValue();
			var duplicate = false;
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				if (oModel.oData.tables[i].Department_name === newDept) {
					var msg = 'Department already exists';
					MessageToast.show(msg);
					duplicate = true;
				}
			}
			if (duplicate) {
				this.createViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
				this.createViewDialog.getContent()[0].getContent()[6].setVisible(false);
				this.createViewDialog.getContent()[0].getContent()[7].setVisible(false);
			} else {

				var postData = {
					// "Dep_Id": "1",
					"Department_name": newDept
				};
				service.callCreateService("AddDepartment", JSON.stringify(postData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						oModel.oData.tables.splice(oModel.oData.tables.length - 1, 1);
						var addDept = {
							// "Dep_Id": "1",
							"Department_name": newDept
						};
						var addDept2 = {
							// "Dep_Id": "0",
							"Department_name": "Add a New Department"
						};
						oModel.oData.tables.push(addDept);
						oModel.oData.tables.push(addDept2);
						that.createViewDialog.getContent()[0].getContent()[5].getModel().updateBindings(true);;
						that.createViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
						that.createViewDialog.getContent()[0].getContent()[6].setVisible(false);
						that.createViewDialog.getContent()[0].getContent()[7].setVisible(false);
					} else {
						sap.m.MessageToast.show("Unable to add Department.Try again");
					}
				});
			}
		},
		onAddDeptPressOnEdit: function () {
			var that = this;
			var oModel = this.editViewDialog.getContent()[0].getContent()[5].getModel();
			var newDept = this.editViewDialog.getContent()[0].getContent()[6].getValue();
			var duplicate = false;
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				if (oModel.oData.tables[i].Department_name === newDept) {
					var msg = 'Department already exists';
					MessageToast.show(msg);
					duplicate = true;
				}
			}
			if (duplicate) {
				this.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
				this.editViewDialog.getContent()[0].getContent()[6].setVisible(false);
				this.editViewDialog.getContent()[0].getContent()[7].setVisible(false);
			} else {

				var postData = {
					// "Dep_Id": "1",
					"Department_name": newDept
				};
				service.callCreateService("filters/add_department", JSON.stringify(postData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						oModel.oData.tables.splice(oModel.oData.tables.length - 1, 1);
						var addDept = {
							// "Dep_Id": "1",
							"Department_name": newDept
						};
						var addDept2 = {
							// "Dep_Id": "0",
							"Department_name": "Add a New Department"
						};
						oModel.oData.tables.push(addDept);
						oModel.oData.tables.push(addDept2);
						that.editViewDialog.getContent()[0].getContent()[5].getModel().updateBindings(true);;
						that.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
						that.editViewDialog.getContent()[0].getContent()[6].setVisible(false);
						that.editViewDialog.getContent()[0].getContent()[7].setVisible(false);
					} else {
						sap.m.MessageToast.show("Unable to add Department.Try again");
					}
				});
			}
		}
	});

});