sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, MessageBox, formatter) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.adminMaster", {
		formatter: formatter,
		onInit: function () {
			this.appObject = [];
			if (!this.valueHelpForOrganization)
				this.valueHelpForOrganization = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForOrganization", this);
			//this.valueHelpForOrganization.addDependent(this.valueHelpForOrganization);
			if (!this.valueHelpForApplicationList)
				this.valueHelpForApplicationList = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForApplicationList",
					this);
			this.getView().addDependent(this.valueHelpForApplicationList);
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("adminMaster").attachPatternMatched(this._objPatternMatched, this);
		},
		onAfterRendering: function () {
			this.handleOrganizationModel();
		},
		handleOrganizationModel: function () {
			var that = this;
			this.getView().byId("organizationList").setBusy(true);
			var organizationModel = new sap.ui.model.json.JSONModel("/BrevoMongoDB/UM/getorganisations");
			organizationModel.attachRequestCompleted(function () {
				that.getView().byId("organizationList").setBusy(false);
				that.getOwnerComponent().setModel(organizationModel, "organization");
			});
		},
		_objPatternMatched: function () {
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.handleOrganizationModel();
		},
		onSearch: function (evt) {
			this.getView().byId("organizationList").getBinding("items").filter([new sap.ui.model.Filter("name", "Contains", evt.getParameter(
				"newValue"))]);
		},
		handleOrganizationsListPress: function (evt) {
			this.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			/*oRouter.navTo("adminDetail", {
				userId: evt.getParameter("listItem").getBindingContext().getObject().organizationId,
				path: evt.getParameter("listItem").getBindingContextPath().split("/")[2]
			})*/
			oRouter.navTo("adminDetail", {
				userId: evt.getParameter("listItem").getBindingContext("organization").getObject()._id,
				path: evt.getParameter("listItem").getBindingContextPath("organization").split("/")[1]
			});
		},
		handleAddNewOrganization: function () {
			/*var organizationObj = {
				"organizationName": "",
				"organizationId": 500 + this.getOwnerComponent().getModel().getData().superAdmin.length + 1,
				"organizationDescription": "",
				"Email": "",
				"Phone": "",
				"Address": "",
				"admin": [{
					"adminName": "",
					"FirstName": "",
					"LastName": "",
					"Email": "",
					"Contact No.": ""

				}],
				"roles": [{
					"roleName": "Administrator",
					"noOfUsers": "1",
					"createdAt": this.todayDate(),
					"lastChangedAt": this.todayDate()
				}],

				"LicenseType": "",
				"LicensePeriod": "",
				"LicenseSpan": "",
				"Authorize_to_Create_No_Of_Dashboards": "",
				"Authorize_to_Create_No_Of_Users": "",
				"apps": []
			};*/

			var organizationObj = {
				name: "",
				description: "",
				phone: "",
				org_email: "",
				address: "",
				createdate: new Date().toJSON(),
				modifydate: new Date().toJSON(),
				license_type: "",
				startdate: "",
				enddate: "",
				dashboardcountallowed: "",
				usercountallowed: "",
				firstname: "",
				lastname: "",
				user_emailid: "",
				contactnumber: "",
				application: []
			};

			this.valueHelpForOrganization.setModel(new sap.ui.model.json.JSONModel(organizationObj));
			this.valueHelpForOrganization.open();
		},
		todayDate: function () {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MM/dd/YYYY"
			});
			return dateFormat.format(new Date());
		},
		handleOrganizationCancel: function () {
			this.valueHelpForOrganization.close();
		},
		handleOrganizationSave: function () {
			var that = this;

			if (this.handleValidationsForOrganization() != 0 || this.handleValidationsForOrganization() == true) {
				var organizationObj = this.valueHelpForOrganization.getModel().getData();
				organizationObj.applicationIds = [];
				organizationObj.application.forEach(function (appl) {
					organizationObj.applicationIds.push(appl._id);
				});
				delete organizationObj.applications
				that.getView().setBusy(true);
				organizationObj["startdate"] = new Date(this.valueHelpForOrganization.getContent()[0].getContent()[16].getValue().split(" - ")[0])
					.toJSON();
				organizationObj["enddate"] = new Date(this.valueHelpForOrganization.getContent()[0].getContent()[16].getValue().split(" - ")[1]).toJSON();
				$.post("/BrevoMongoDB/UM/createorganisation", organizationObj, function (data) {
					if (data == "okk") {
						MessageBox.success("Organization Created Successfully");
						var organizationModel = new sap.ui.model.json.JSONModel("/BrevoMongoDB/UM/getorganisations");
						organizationModel.attachRequestCompleted(function () {
							that.getView().setBusy(false);
							that.getOwnerComponent().setModel(organizationModel, "organization");
						});
						that.valueHelpForOrganization.close();
					} else {
						MessageBox.error(data);
					}
				});
			} else {
				if (this.handleValidationsForOrganization() == 0) {
					sap.m.MessageBox.error("Please enter Valid Mail");
				} else {
					sap.m.MessageBox.error("Please fill the mandatory fields!");
				}
			}
		},
		handleValidationsForOrganization: function () {
			var contentIndex = [2, 4, 16, 18, 20, 22, 25, 27, 29],
				//	var organizationObj = this.valueHelpForOrganization.getModel().getData();
				//var mailregex = /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/;
				//	org_email: (!mailregex.test(organizationObj.org_email)) != false ? sap.m.MessageBox.error("Please enter Valid Mail") : organizationObj.org_email,
				//	user_emailid: (!mailregex.test(organizationObj.user_emailid)) != false ? sap.m.MessageBox.error("Please enter Valid Mail") : organizationObj.user_emailid,
				validationFlag = true;
			for (var i = 0; i < contentIndex.length; i++) {
				if (this.valueHelpForOrganization.getContent()[0].getContent()[contentIndex[i]].getValue().length == 0) {
					validationFlag = false;
					break;
				}
			}
			var mailregex = /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/;
			if (!mailregex.test(this.valueHelpForOrganization.getContent()[0].getContent()[9].getValue()) || !mailregex.test(this.valueHelpForOrganization
					.getContent()[0].getContent()[29].getValue())) {

				validationFlag = 0;

			}
			if (this.valueHelpForOrganization.getContent()[0].getContent()[14].getSelectedKey().length == 0)
				validationFlag = false;
			return validationFlag;
		},
		handleDateRange: function (evt) {
			var date1 = evt.getSource().getDateValue();
			var date2 = evt.getSource().getSecondDateValue();
			var diffTime = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			this.valueHelpForOrganization.getContent()[0].getContent()[18].setValue(diffDays);
			this.valueHelpForOrganization.getModel().oData.startdate = this.valueHelpForOrganization.getContent()[0].getContent()[16].getValue()
				.split(" - ")[0];
			this.valueHelpForOrganization.getModel().oData.enddate = this.valueHelpForOrganization.getContent()[0].getContent()[16].getValue().split(
				" - ")[1];
		},
		onNavBack: function () {
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");
		},
		handleApplicationValueHelp: function () {
			this.handleListItemsSelected();
			this.valueHelpForApplicationList.open();
		},
		handleListItemsSelected: function () {

			for (var s = 0; s < this.valueHelpForOrganization.getModel().getData().application.length; s++) {
				for (var m = 0; m < this.valueHelpForApplicationList.getItems().length; m++) {
					if (this.valueHelpForOrganization.getModel().getData().application[s].id == this.valueHelpForApplicationList.getItems()[m].getBindingContext(
							"applications").getObject().id) {
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
			evt.getParameter("removedTokens")[0].getBindingContext().getModel().oData.application.splice(appPath, 1);
		},
		handleCloseAppList: function () {
			//	this.valueHelpForApplicationList.close();
		},
		limitPhoneNumbers: function (evt) {
			var that = this;
			var num = evt.getParameter("value");
			var numVal1 = "";
			if (num.length <= 12) {
				for (var v = 0; v < num.length; v++) {
					numVal1 = numVal1 + num[v];
					evt.getSource().setValue(numVal1);
					var _oInput = evt.getSource();
					var valn = _oInput.getValue();
					valn = valn.replace(/[^\d]/g, '');
					_oInput.setValue(valn);
				}
				this.numVal = numVal1;
			} else {
				//var message = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("limitPhoneNumbers");
				sap.m.MessageToast.show("Please Enter 12 Digits only");
				that.valueHelpForOrganization.getContent()[0].getContent()[7].setValue(that.numVal);

			}

		},
		/*	handleValidateEmail:function(oevt){
				var that=this;
						var email = oevt.getParameter("value");
						var numVal1 = "";
						var mailregex = /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/;
						if (!mailregex.test(email)) {
								numVal1 = numVal1 + email;
								oevt.getSource().setValue(numVal1);
								var _oInput = oevt.getSource();
								var vale = _oInput.getValue();
								vale = vale.replace(/[^\d]/g, '');
								_oInput.setValue(vale);
								this.emailVal = numVal1; 
								sap.m.MessageToast.show("Please enter Valid Mail");
								//evt.getSource().setValueState("Error");
						  }else{
									// evt.getSource().setValueState("None");
								   	  //that.numVal = numVal1; 
									  that.valueHelpForOrganization.getContent()[0].getContent()[29].setValue(this.emailVal);
										
										
									}
								
						
							},*/
		/*limitemailadmin:function(evt){
		var that=this;
				var email = evt.getParameter("value");
				var numVal1 = "";
				var mailregex = /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/;
				if (!mailregex.test(email)) {
						
					
						numVal1 = numVal1 + email;
						evt.getSource().setValue(numVal1);
						var _oInput = evt.getSource();
						var valea = _oInput.getValue();
						valea = valea.replace(/[^\d]/g, '');
						_oInput.setValue(valea);
						this.emailVal2 = numVal1;
						sap.m.MessageToast.show("Please enter Valid Mail");
						//evt.getSource().setValueState("Error");
						
				  }else{
							//evt.getSource().setValueState("None");	
							  that.valueHelpForOrganization.getContent()[0].getContent()[9].setValue(this.emailVal2);
								//	evt.getSource().setValueState("Error");
								
							}
						
				
					},*/
		limitPhoneNumbersadmin: function (evt) {
			var that = this;
			var num = evt.getParameter("value");
			var numVal1 = "";
			if (num.length <= 12) {
				for (var v = 0; v < num.length; v++) {
					numVal1 = numVal1 + num[v];
					evt.getSource().setValue(numVal1);
					var _oInput = evt.getSource();
					var valna = _oInput.getValue();
					valna = valna.replace(/[^\d]/g, '');
					_oInput.setValue(valna);
				}
				this.numValadmin = numVal1;
			} else {
				//var message = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("limitPhoneNumbers");
				sap.m.MessageToast.show("Please Enter 12 Digits only");
				that.valueHelpForOrganization.getContent()[0].getContent()[31].setValue(that.numValadmin);

			}

		}
	});
});