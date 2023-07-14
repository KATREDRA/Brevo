sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(Controller, MessageToast,MessageBox) {
	"use strict";
	return Controller.extend("inhance.userManagementSecurity.controller.groups", {
		onInit: function() {
			if(!this.addGroups)
			this.addGroups = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addGroup",this);
		},
		onAfterRendering:function(){
		
		},
		handleAddGroups:function(){
			this.addGroups.open();
		},
		onNavBack:function(){
			this.getView().getModel("appView").setProperty("/layout","OneColumn")
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Home");
		},
	});
});