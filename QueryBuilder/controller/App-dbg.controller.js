sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/QueryBuilder/model/Service"
], function (Controller, service) {
	"use strict";

	return Controller.extend("Brevo.QueryBuilder.controller.App", {
		onInit: function () {
			// var loginInfo = {
			// 	userId: "admin@vaspp.com",
			// 	password: "Vaspp@123"
			// };
			// service.callCreateService("login", JSON.stringify(loginInfo), "POST", function (data, successFlag) {
			// 	if (successFlag) {

			// 	}
			// });
		}
	});
});