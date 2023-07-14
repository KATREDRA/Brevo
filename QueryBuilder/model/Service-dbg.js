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
					name: "Query_Builder Services",
					serviceUrl: "",
					destination: window.location.href.indexOf("ondemand") > -1 ? "IMS" : "",
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
			// console.log("Service url is " + sServiceUrl);
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
		fixProxyServerUrl: function (sMetaServiceUrl) {
			var destination = this.metadata.config.serviceConfig.destination;
			if (window.location.hostname == "localhost") {
				var url = window.location.href + "proxy/";
				return url.concat(sMetaServiceUrl);
			} else if (destination != "") {
				var mConfig = this.metadata.config;
				var url = window.location.origin + "/" + destination + "/";
				return url.concat(sMetaServiceUrl);
			} else {
				var mConfig = this.metadata.config;
				var url = window.location.origin + "/";
				return url.concat(sMetaServiceUrl);
			}
		},
		callService: function (modelName, jsonFileName, sServiceURL, serviceUrl, replaceOld, finishMethod, index) {
			var replace = replaceOld || false;
			var oModel = sap.ui.getCore().getModel(modelName);
			var forceLoad = false;
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(oModel, modelName);
				forceLoad = true;
			}
			var reqFailed = function (oEvt) {
				oModel.detachRequestFailed(this);
			}
			oModel.attachRequestCompleted(function (oEv) {
				oEv.oSource.mEventRegistry = [];
				try {
					oModel.setData(JSON.parse(oModel.getData()));
				} catch (e) {}
				finishMethod(oEv, oEv.mParameters.success);
			});

			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			oModel.attachRequestFailed(reqFailed);
			var relativePath = this.metadata.config.serviceConfig.serviceUrl + sServiceURL;
			var finalUrl = this.fixProxyServerUrl(relativePath);
			if (this.mockdata == false && replaceOld != "loadMock") {
				oModel.loadData(finalUrl, {}, true, 'GET', false, false, {});
			} else {
				if (jsonFileName.indexOf(".json") < -1)
					jsonFileName = jsonFileName + ".json";
				var mockJSONUrl = jsonFileName;
				oModel.loadData(mockJSONUrl);
			}
		},

		callGetService: function (modelName, jsonFileName, sServiceURL, serviceUrl, replaceOld, finishMethod, index) {
			var replace = replaceOld || false;
			var oModel = sap.ui.getCore().getModel(modelName);
			var forceLoad = false;
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(oModel, modelName);
				forceLoad = true;
			}
			var reqFailed = function (oEvt) {
				oModel.detachRequestFailed(this);
			}
			oModel.attachRequestCompleted(function (oEv) {
				oEv.oSource.mEventRegistry = [];
				finishMethod(oEv, index);
			});

			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			oModel.attachRequestFailed(reqFailed);
			// var relativePath = sServiceURL;
			var relativePath = this.metadata.config.serviceConfig.serviceUrl + sServiceURL;
			var finalUrl = this.fixProxyServerUrl(relativePath);
			if (this.mockdata == false && replaceOld != "loadMock") {
				$.ajax({
					type: 'GET',
					url: finalUrl
				}).done(function (data, status) {
					if (data === "")
						status = true;
					else if (JSON.parse(data).status == "Success")
						status = true;
					else
						status = false;
					finishMethod(data, status);
				});
			} else {
				if (jsonFileName.indexOf(".json") < -1)
					jsonFileName = jsonFileName + ".json";
				var mockJSONUrl = jsonFileName;
				oModel.loadData(mockJSONUrl);
			}
		},
		callCreateService: function (sServiceUrl, inputData, method, finishMethod) {
			var relativePath = this.metadata.config.serviceConfig.serviceUrl + sServiceUrl;
			var finalUrl = this.fixProxyServerUrl(relativePath);
			if (method === "POST") {
				$.ajax({
					type: 'POST',
					url: finalUrl,
					data: inputData,
					headers: {
						"Content-Type": 'application/json'
					},
				}).done(function (data, status) {
					if (JSON.parse(data).status == "Success")
						status = true;
					else
						status = false;
					finishMethod(data, status);
				});
			}

			function fnSuccess(data, response) {
				finishMethod(data, true);
			}

			function fnError(oError) {
				finishMethod(JSON.parse(oError.response.body).error.message.value, false);
			}
		}
	};
});