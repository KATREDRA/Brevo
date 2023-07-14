sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/Login/model/Service"
], function (Controller, Service) {
	"use strict";

	return Controller.extend("Brevo.Login.controller.View1", {
		onInit: function () {

		},
		onLogin: function (evt) {
			var email = this.getView().byId("email").getValue().trim();
			var pass = this.getView().byId("pass").getValue().trim();
			if (email.trim().length <= 0 || pass.trim().length <= 0) {
				this.getView().byId("errorStrip").setVisible(true);
				return;
			} else {
				this.getView().byId("errorStrip").setVisible(false);
			}
			var that = this;
			Service.callCreateService(Service.config.metadataUrls.Login.url, JSON.stringify({
				"userId": email,
				"password": pass
			}), "POST", function (evt) {
				if (evt.login) {
					
					//redirect
					if (window.location.href.indexOf("close=true") > -1)
						window.close();
					else
						window.location.href = "../index.html"
				
				
				} else {
					that.getView().byId("errorStrip").setVisible(true);
				}
			});
		},
	});
});