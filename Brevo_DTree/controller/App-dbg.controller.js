sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/BrevoDtree/model/Service"
], function (Controller, service) {
	"use strict";

	return Controller.extend("Brevo.BrevoDtree.controller.App", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf Brevo.BrevoDtree.view.App
		 */
		onInit: function () {
			// var loginInfo = {
			// 	userId: "admin@vaspp.com",
			// 	password: "Vaspp@123"
			// };
			// service.callCreateService("login", JSON.stringify(loginInfo), true, "POST", function (data, successFlag) {
			// 	if (successFlag) {

			// 	}
			// });
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf Brevo.BrevoDtree.view.App
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf Brevo.BrevoDtree.view.App
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf Brevo.BrevoDtree.view.App
		 */
		//	onExit: function() {
		//
		//	}

	});

});