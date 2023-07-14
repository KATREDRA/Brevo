sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.Home", {
		onInit: function () {
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("Home").attachPatternMatched(this._objMatched, this);
		},
		_objMatched: function () {
			this.getView().getModel("appView").getProperty("/sideContent").getItem().getItems()[0]._selectItem(true);
			this.getView().getModel("appView").setProperty("/sideMenuVisible", true);
			this.getView().getModel("side").updateBindings(true);
			this.handleMenuTabs();
		},
		handleMenuTabs: function () {
			var flag = true;
			if (this.getView().getModel("appView").getProperty("/loginDetails/0/role/0/type") == "superadmin")
				flag = false;
			else if (this.getView().getModel("appView").getProperty("/loginDetails/0/role/type") == "administrator" ||
				this.getView().getModel("appView").getProperty("/loginDetails/0/role/type") == "Administrator")
				flag = true;
			this.getView().getModel("appView").setProperty("/menuTabsVisibility", flag);
		},
		/*handleMenuTabs:function(){
			var flag = false;
			if(this.getView().getModel("appView").getProperty("/loginUserName") == "superadmin@vaspp.com")
			flag = false;
			else if(this.getView().getModel("appView").getProperty("/loginUserName") == "admin@vaspp.com")
			flag = true;
			this.getView().getModel("appView").setProperty("/menuTabsVisibility",flag);
		},*/
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		handleRolesPress: function () {
			//var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getRouter().navTo("rolesMaster");
		},
		handleGroupsPress: function () {
			this.getRouter().navTo("groups");
		},
		handleUserPress: function () {
			this.getRouter().navTo("usersMaster");
		},
		handleSuperAdminPress: function () {
			this.getRouter().navTo("adminMaster");
		},
		handleApplicationPress: function () {
			this.getRouter().navTo("applicationList");
		}
	});
});