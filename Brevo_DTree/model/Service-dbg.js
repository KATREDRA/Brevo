sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/Device"
], function (JSONModel, Device, MessageBox) {
	"use strict";
	return {
		metadata: {
			name: "LessonLearnt",
			version: "1.0",
			includes: [],
			dependencies: {
				libs: ["sap.m", "sap.ui.layout"],
				components: []
			},
			config: {
				resourceBundle: "i18n/messageBundle.properties",
				serviceConfig: {
					name: "ibrevoVDT Services",
					erviceUrl: "SalesForecast/Sales.xsodata/",
					scenarioUrl: "Brevo_VDT/Scenario.xsodata/",
					viewUrl: "SalesForecast/Brevo.xsodata/",
					xsjsUrl: "Brevo_VDT/",
					mongoDbUrl: "odata/mongodb",
					destination1: window.location.href.indexOf("ondemand") > -1 ? "BrevoMongoDB" : "",
					destination2: window.location.href.indexOf("ondemand") > -1 ? "IMS" : "",
					mockdataDir: "model/" // Local mock data directory
				}
			}
		},
		mockdata: false,
		init: function () {
			var mConfig = this.metadata.config;
			var bIsMocked = jQuery.sap.getUriParameters().get("mockdata") === 'false';
			this.mockdata = false; // Is running on mock data.
			var sServiceUrl = mConfig.serviceConfig.serviceUrl;
			console.log("Service url is " + sServiceUrl);
			if (this.mockdata) {
				this.showMockDataMessage();
			}
		},
		showMockDataMessage: function () {

		},
		handleError: function (oEv) {
			var errMsg = oEv.getParameters().message + " contact System Administrator";
			sap.m.MessageToast.show(errMsg, {
				duration: 4000
			});
		},

		fixProxyServerUrl: function (sMetaServiceUrl, destinationToLoadDataFrom) {
			var destination1 = this.metadata.config.serviceConfig.destination1;
			var destination2 = this.metadata.config.serviceConfig.destination2;
			if (window.location.hostname == "localhost") {
				var url = window.location.href + "proxy/";
				return url.concat(sMetaServiceUrl);
				//return "proxy/" + sMetaServiceUrl;
			} else if (destinationToLoadDataFrom == "IMS") {
				if (destination2 != "") {
					var mConfig = this.metadata.config;
					var url = window.location.origin + "/" + destination2 + "/";
					return url.concat(sMetaServiceUrl);
				} else {
					var mConfig = this.metadata.config;
					var url = window.location.origin + "/";
					return url.concat(sMetaServiceUrl);
				}
			} else {
				if (destination1 != "") {
					var mConfig = this.metadata.config;
					var url = window.location.origin + "/" + destination1 + "/";
					return url.concat(sMetaServiceUrl);
				} else {
					var mConfig = this.metadata.config;
					var url = window.location.origin + "/";
					return url.concat(sMetaServiceUrl);
				}

			}
		},

		callService: function (modelName, jsonFileName, sServiceURL, serviceUrl, replaceOld, dataUrl, finishMethod, index) {
			var replace = replaceOld || false;
			var oModel = sap.ui.getCore().getModel(modelName);
			var forceLoad = false,
				relativePath;
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(oModel, modelName);
				forceLoad = true;
			}
			if (replace === "fetchDataFromServer") {
				window.setTimeout(function (oModel, index, finishMethod) {
					finishMethod(oModel, index)
				}, 75, oModel, index, finishMethod);
				return;
			}
			var reqFailed = function (oEvt) {
				oModel.detachRequestFailed(this);
			}
			oModel.attachRequestCompleted(function (oEv) {
				oEv.oSource.mEventRegistry = [];
				try {
					oModel.setData(JSON.parse(oModel.getData()));
				} catch (e) {}
				if (oEv.mParameters.success) finishMethod(oEv, oEv.mParameters.success);
				else {
					finishMethod(oEv, oEv.mParameters.success);
					// if (modelName == "ScenarioListModel" || modelName == "SelectedScenarioModel" || modelName == "cmtInfoModel") {
					// 	oModel.loadData("model/" + modelName + ".json");
					// 	oModel.attachRequestCompleted(function (evt) {
					// 		finishMethod(evt, index);
					// 	});
					// }
				}

			});

			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			oModel.attachRequestFailed(reqFailed);
			if (serviceUrl == true) {
				var finalUrl = this.fixProxyServerUrl(sServiceURL);
			} else if (serviceUrl == "scenario") {
				relativePath = this.metadata.config.serviceConfig.mongoDbUrl + sServiceURL.trim();
				var finalUrl = this.fixProxyServerUrl(relativePath);
			} else if (serviceUrl == "IMS") {
				relativePath = sServiceURL.trim();
				var finalUrl = this.fixProxyServerUrl(relativePath, serviceUrl);
			} else if (serviceUrl == "views") {
				relativePath = this.metadata.config.serviceConfig.MLurl + sServiceURL.trim();
				var finalUrl = this.fixProxyServerUrl(relativePath);
			} else if (serviceUrl == "report") {
				var relativePath = this.metadata.config.serviceConfig.viewUrl + sServiceURL;
				var finalUrl = this.fixProxyServerUrl(relativePath);
			} else {
				relativePath = sServiceURL.trim();
				// if (sServiceURL.charAt(0) !== "/") {
				// 	relativePath = dataUrl + "/" + sServiceURL.trim();
				// } else {
				// 	relativePath = this.getMetadata().getConfig().serviceConfig.serviceUrl + sServiceURL.trim();
				// }
				var finalUrl = this.fixProxyServerUrl(relativePath); // JSON Model at the end.
			}
			if (this.mockdata == false && replaceOld != "loadMock") {
				oModel.loadData(finalUrl, {}, true, 'GET', false, false, {
					'sessionkey': window.localStorage.getItem("sessionkey"),
					'userid': window.localStorage.getItem("userid")
				});
			} else {
				if (jsonFileName.indexOf(".json") < -1)
					jsonFileName = jsonFileName + ".json";
				var mockJSONUrl = jsonFileName;
				oModel.loadData(mockJSONUrl);
			}
		},

		callCreateService: function (sServiceUrl, inputData, fileUploaded, method, finishMethod) {
			var oModel = sap.ui.getCore().getModel("dummy"),
				relativePath;
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				sap.ui.getCore().setModel(oModel, "dummy");

			}
			if (fileUploaded == true) {
				relativePath = sServiceUrl;
				if (sServiceUrl.indexOf("FileUploader") > -1)
					var finalUrl = this.fixProxyServerUrl(relativePath, "IMS");
				else
					var finalUrl = this.fixProxyServerUrl(relativePath);
				$.ajax({
					url: finalUrl,
					type: method,
					data: inputData,
					headers: {
						"Content-Type": 'application/json',
						"sessionkey": window.localStorage.getItem("sessionkey"),
						"userid": window.localStorage.getItem("userid")
					},
					success: function (data) {
						if (method == "PUT") {
							if (JSON.parse(data).update == true)
								var status = true;
							else
								var status = false;
						} else {
							if (data != "Invalid Session") {
								if (finalUrl.indexOf("FileUploader") > -1) {
									if (JSON.parse(data).insert == true)
										var status = true;
									else
										var status = false;
								} else {
									if (JSON.parse(data).login == true)
										var status = true;
									else if (JSON.parse(data).status == "Success")
										var status = true;
									else
										var status = false;
								}
							} else {
								MessageBox.alert("Your session has been expired. Please reload.")
							}
						}

						finishMethod(data, status);
					},
					error: function (data) {
						var status = false;
						finishMethod(data, status);
					}

				});
				// } else if (fileUploaded == "scenario") {
				// 	relativePath = this.getMetadata().getConfig().serviceConfig.mongoDbUrl + sServiceUrl;
				// 	var finalUrl = this.fixProxyServerUrl(relativePath);
				// 	$.post(finalUrl,
				// 		inputData
				// 	).done(function (data, status) {
				// 		if (data.ScenId)
				// 			status = true;
				// 		else
				// 			status = false;
				// 		finishMethod(data, status);
				// 	});
			} else {
				oModel.setJSON(inputData);

				/*if(fileUploaded === "Mlsystem"){
					relativePath = this.getMetadata().getConfig().serviceConfig.MLurl + sServiceUrl
				}else{*/
				// relativePath = this.getMetadata().getConfig().serviceConfig.xsjsUrl + sServiceUrl;
				// relativePath = sServiceUrl;

				//}
				if (fileUploaded == "variant" || fileUploaded === "Comment")
					relativePath = this.metadata.config.serviceConfig.scenarioUrl;
				if (fileUploaded == "scenario")
					relativePath = this.metadata.config.serviceConfig.mongoDbUrl;

				var metadataMMURL = this.fixProxyServerUrl(relativePath);
				var uploadModel = new sap.ui.model.odata.ODataModel(metadataMMURL, true, "", "");
				// uploadModel.refreshSecurityToken();
				uploadModel.setHeaders({
					'sessionkey': window.localStorage.sessionkey,
					'userid': window.localStorage.userid
				})
				if (method == "POST")
					uploadModel.create(sServiceUrl, oModel.getData(), null, fnSuccess, fnError);
				else
					uploadModel.update(sServiceUrl, oModel.getData(), null, fnSuccess, fnError);

				function fnSuccess(data, response) {
					if (data != "Invalid Session") {
						finishMethod(data, true);
						var msg = "Submitted Successfully !";
					} else {
						MessageBox.alert("Your session has been expired. Please reload.")
					}
				}

				function fnError(oError) {
					try {
						finishMethod(JSON.parse(oError.response.body).error.message.value, false); // This statement was surrounded by try-catch blocks by VI00066, VASPP, Bangalore, India on 11 Feb 2020.
					} catch (e) {
						finishMethod(oError.response.body, false);
					}
				}
				// if (fileUploaded === "variant" || fileUploaded === "Comment") {
				// 	if (method === "PUT") uploadModel.update(sServiceUrl, oModel.getData(), null, fnSuccess, fnError);
				// 	else uploadModel.create(sServiceUrl, oModel.getData(), null, fnSuccess, fnError);
				// } else if (method === "PUT") {
				// 	$.ajax({
				// 		url: metadataMMURL, // your api url
				// 		method: 'PUT', // method is any HTTP method
				// 		data: inputData, // data as js object
				// 		success: function (data) {
				// 			if (data === "Success") {
				// 				finishMethod(oModel, true);
				// 			}
				// 		}
				// 	});
				// } else {

				// 	$.post(metadataMMURL,
				// 		inputData
				// 	).done(function (data, status) {
				// 		if (data === "Success")
				// 			status = true;
				// 		else
				// 			status = false;
				// 		if (sServiceUrl == "/Proxy.xsjs") {
				// 			var dataToFetch = data;
				// 		} else {
				// 			var dataToFetch = oModel;
				// 		}
				// 		finishMethod(dataToFetch, true);
				// 	}).fail(function (error) {
				// 		oModel.setData("Error");
				// 		finishMethod(dataToFetch, false);
				// 	});
				// }

				// function fnSuccess(data, response) {
				// 	finishMethod(data, true);
				// 	var msg = "Submitted Successfully !";
				// }

				// function fnError(oError) {
				// 	finishMethod(JSON.parse(oError.response.body).error.message.value, false);
				// }

			}
		},

		callDeleteService: function (sServiceUrl, remote, finishMethod) {
			var oModel = sap.ui.getCore().getModel("dummy");
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				sap.ui.getCore().setModel(oModel, "dummy");
				// forceLoad = true;
			}
			//oModel.setJSON(inputData);
			//if (remote == "scenario")
			//var relativePath = this.getMetadata().getConfig().serviceConfig.xsjsUrl;

			/*else
			var relativePath = this.getMetadata().getConfig().serviceConfig.MLurl;*/
			// var relativePath = "Brevo_VDT/";
			var relativePath = this.metadata.config.serviceConfig.mongoDbUrl;
			var metadataMMURL = this.fixProxyServerUrl(relativePath);
			var uploadModel = new sap.ui.model.odata.ODataModel(metadataMMURL, true, "", ""); // Hard coded username and password. need to change.
			uploadModel.setHeaders({
				'sessionkey': window.localStorage.sessionkey,
				'userid': window.localStorage.userid
			})
			uploadModel.refreshSecurityToken();
			uploadModel.remove(sServiceUrl, null, fnSuccess, fnError);

			function fnSuccess(data, response) {
				if (data != "Invalid Session") {
					finishMethod(data, true);
					var msg = "Submitted Successfully !";
				} else {
					MessageBox.alert("Your session has been expired. Please reload.")
				}
			}

			function fnError(oError) {
				finishMethod(JSON.parse(oError.response.body).error.message.value, false);
			}
		}
	};
});