sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";
	var configGlobal = {
		destination: window.location.href.indexOf("ondemand") > -1 ? "/Brevo" : "",
		destinationPi: window.location.href.indexOf("ondemand") > -1 ? "/IMS" : "",
		useDataDestination: window.location.href.indexOf("ondemand") > -1 ? true : false,
		destinationMongo: window.location.href.indexOf("ondemand") > -1 ? "/BrevoMongoDB" : "",
		serviceUrlMongo: "/odata/mongodb",
		serviceUrl: "/SalesForecast/Brevo.xsodata/",
		isMongo: "Mongo"
			//isMongo: ""
	};
	return {
		config: {
			isCloud: true,
			//domain: 'http://35.238.55.231:8090/',
			domain: window.location.origin + "/",
			isMongo: configGlobal.isMongo == "Mongo" ? true : false,
			isOdata: configGlobal.isMongo == "Mongo" ? false : true,
			dataIsCrossDomain: false,
			isLaunchpad: false,
			separator: "&",
			filter: {
				key: "$filter=",
				delimiter: " ",
				stringLimiter: "'",
				operator: {
					"and": "and",
					"or": "or",
					"eq": "eq",
					"nq": "nq"
				}
			},
			sort: {
				key: "orderby=",
				top: "$top=",
				skip: "$skip=",
				delimiter: ",",
				operator: {
					"desc": "eq",
					"asc": "nq"
				}
			},
			select: {
				key: configGlobal.isMongo == "Mongo" ? "$select=" : "select=",
				delimiter: ",",
				operator: {

				}
			},

			serviceConfig: {
				metadataDomian: "",
				destination: configGlobal.destination,
				destinationPi: configGlobal.destinationPi,
				useDataDestination: configGlobal.useDataDestination,
				destinationMongo: configGlobal.destinationMongo,
				//serviceUrl: jQuery.sap.getModulePath("dynamicCards") + "/EP7/sap/opu/odata/sap/ZOVP_BUILDER_SRV/",
				serviceUrl: "/SalesForecast/Brevo.xsodata/",
				serviceUrlMongo: "/odata/mongodb",
				searchUrl: "/Brevo_V2/",
				//serviceUrl: jQuery.sap.getModulePath("dynamicCards") + "/SKG_GWD/sap/opu/odata/sap/Z_GW_OVP_BUILDER_SRV/",
				serviceUrl2: jQuery.sap.getModulePath("dynamicCards") + "/TextAnalysis/",
				mockdataDir: "model/" // Local mock data directory
			},
			metadataUrls: {
				Login: {
					url: configGlobal["destination" + configGlobal["isMongo"]] +
						"/login",
				},
				Pages: {
					list: configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
						"/OVPPageConfig",
					create: configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
						"/OVPPageConfig",
					update: function (pageId, type) {
						if (configGlobal.isMongo == "Mongo")
							type = "'";
						else if (type == "string")
							type = "'";
						else type = "";
						return configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
							"/OVPPageConfig" + "(" + type + pageId + type + "')"
					},
					delete: function (pageId, type) {
						if (configGlobal.isMongo == "Mongo")
							type = "'";
						else if (type == "string")
							type = "'";
						else type = "";
						return configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
							"/OVPPageConfig" + "(" + type + pageId + type + "')"
					}

				},
				Cards: {
					list: configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
						"/CardConfiguration",
					create: configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
						"/CardConfiguration",
					update: function (pageId, type) {
						if (configGlobal.isMongo == "Mongo")
							type = "'";
						else if (type == "string")
							type = "'";
						else type = "";
						return configGlobal["destination" + configGlobal["isMongo"]] + configGlobal["serviceUrl" + configGlobal["isMongo"]] +
							"/CardConfiguration" + "(" + type + pageId + type + "')"
					},
				},
				Files: {
					list: configGlobal.isMongo == "Mongo" ? (configGlobal["destination" + configGlobal["isMongo"]] + "/FileUploader/Tables") : (
						configGlobal
						.destination + "/SalesForecast/FileUploader.xsjs?get_tables=true")
				},
				FileData: {
					//	url: configGlobal.destination + "/SalesForecast/FileUploader.xsjs?FileName="
					url: configGlobal.isMongo == "Mongo" ?
						configGlobal.destinationPi + "/getData?" + "$aggregate=true&fileName=" : configGlobal.destination +
						"/SalesForecast/FileUploader.xsjs?FileName="

				},
				otherData: {
					url: configGlobal.isMongo == "Mongo" ?
						configGlobal.destinationPi + "/getData?" + "$aggregate=true&fileName=" : configGlobal.destination
				},
				FileFilter: {
					//	url: configGlobal.destination + "/SalesForecast/FileUploader.xsjs?FileName="
					values: function (fileName, filterParam) {
						return configGlobal.isMongo == "Mongo" ?
							(configGlobal.destinationPi + "/getData?fileName=" + fileName + "&$select=" + filterParam + "&$aggregate=true") : (configGlobal.destination +
								"/FileUploader.xsjs?fileName=" + fileName + "&select=" + filterParam + "&unique=true");
					}

				},
				backEndSystemsProperties: [{

				}]
			}
		},
		mockdata: false,
		handleError: function (oEv) {
			var errMsg = oEv.getParameters().message + " contact System Administrator";
			sap.m.MessageToast.show(errMsg, {
				duration: 4000
			});
		},

		fixProxyServerUrl: function (sMetaServiceUrl, destination) {
			var url = window.location.origin + "/";
			if (window.location.href.indexOf("ondemand") > -1)
				url = window.location.origin + "/" + destination;
			if (this.config.serviceConfig.metadataDomian.trim().length > 0) {
				url = this.config.serviceConfig.metadataDomian + "/"
			}
			return url.concat(sMetaServiceUrl);
		},
		//Do not modify the below function to manipulate the URL, use constructUrlForMetadata
		readForMetadata: function (modelName, jsonFileName, finalUrl, serviceUrl, replaceOld, finishMethod, index) {
			var replace = replaceOld || false;
			var oModel = sap.ui.getCore().getModel(modelName);
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setData([]);
				oModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(oModel, modelName);
			}
			if (replace === false) {
				window.setTimeout(function () {
					finishMethod(oModel, index);
				}, 7);
				return;
			}

			var reqFailed = function (oEvt) {
				oModel.detachRequestFailed(this);
			}
			oModel.attachRequestCompleted(function (oEv) {
				oEv.getSource().mEventRegistry = [];
				if (oEv.getSource().getData().d && oEv.getSource().getData().d.results) {
					oModel.setData(oEv.getSource().getData().d.results);
				} else if (oEv.getSource().getData().d) {
					oModel.setData(oEv.getSource().getData().d);
				} else {

				}
				finishMethod(oEv, index);
			});

			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			oModel.attachRequestFailed(reqFailed);

			//var finalUrl = this.constructUrlForMetadata(sServiceURL, serviceUrl);

			if (this.mockdata == false && replaceOld != "loadMock") {
				oModel.loadData(finalUrl, {}, true, 'GET', false, false, {});
			} else {
				if (jsonFileName.indexOf(".json") < -1)
					jsonFileName = jsonFileName + ".json";
				var mockJSONUrl = jsonFileName;
				oModel.loadData(mockJSONUrl);
			}
		},
		read: function (modelName, serviceUrl, properties) {
			this.callService(modelName, properties.jsonFileName ? properties.jsonFileName : "", serviceUrl ? serviceUrl : "",
				properties.serviceUrl ? properties.serviceUrl : "", properties.replaceOld, properties
				.finishMethod, properties.index, properties.destination);
		},
		callService: function (modelName, jsonFileName, sServiceURL, serviceUrl, replaceOld, finishMethod, index, destination) {
			var replace = replaceOld || false;
			var oModel = sap.ui.getCore().getModel(modelName);
			if (typeof destination == "undefined") {
				destination = configGlobal["destination" + configGlobal["isMongo"]];
			}
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(oModel, modelName);
			}

			if (!replace) {
				window.setTimeout(function (oModel, index, finishMethod) {
					finishMethod(oModel, index)
				}, 75, oModel, index, finishMethod);
				return;
			}

			var reqFailed = function (oEvt) {
				oModel.detachRequestFailed(this);
			}
			oModel.attachRequestCompleted(function (oEv) {
				oEv.getSource().mEventRegistry = [];
				try {
					if (oEv.getSource().getData().d && oEv.getSource().getData().d.results[1].length > 0) {
						oModel.setData(
							oEv.getSource().getData().d.results[1]
						);
					} else if (oEv.getSource().getData().d && oEv.getSource().getData().d.results) {
						oModel.setData(oEv.getSource().getData().d.results);
					} else if (oEv.getSource().getData().d) {
						oModel.setData(oEv.getSource().getData().d);
					} else if (oEv.getSource().getData().results) {
						oModel.setData(oEv.getSource().getData().results);
					} else if (Array.isArray(oEv.getSource().getData())) {
						oModel.setData(oEv.getSource().getData());
					}
				} catch (e) {
					if (oEv.getSource().getData().d && oEv.getSource().getData().d.results) {
						oModel.setData(oEv.getSource().getData().d.results);
					} else if (oEv.getSource().getData().d) {
						oModel.setData(oEv.getSource().getData().d);
					} else if (oEv.getSource().getData().results) {
						oModel.setData(
							oEv.getSource().getData().results
						);
					} else {

					}
				}

				finishMethod(oEv, index);
			});

			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			oModel.attachRequestFailed(reqFailed);
			if (sServiceURL.indexOf("FileUploader.") > -1 || sServiceURL.indexOf("CalculatedField") > -1) {
				if (window.location.href.indexOf("ondemand") <= -1 && sServiceURL.indexOf("SalesForecast") <= -1) {
					sServiceURL = '/SalesForecast/' + sServiceURL.trim();
				}
			}
			sServiceURL = this.constructUrlForData(sServiceURL, destination);

			if (jsonFileName.indexOf("Purchase.json") <= -1 && this.mockdata == false && replaceOld != "loadMock") {
				oModel.loadData(sServiceURL, {}, true, 'GET', false, false, {});
			} else {
				var folderPath = jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/model/";
				if (jsonFileName.indexOf(".json") < -1)
					jsonFileName = folderPath + jsonFileName + ".json";
				var mockJSONUrl = folderPath + jsonFileName;
				oModel.loadData(mockJSONUrl);
			}
		},
		callCreateService: function (sServiceUrl, inputData, method, finishMethod) {
			if (sServiceUrl.charAt(0) !== "/") {
				sServiceUrl = "/" + sServiceUrl.trim();
			}
			var oModel = sap.ui.getCore().getModel("dummy"),
				relativePath;
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				sap.ui.getCore().setModel(oModel, "dummy");
			}
			if (!this.config.isOdata || sServiceUrl.indexOf("FileUploader") > -1 || sServiceUrl.indexOf("CalculatedField") > -1) {
				if (sServiceUrl.indexOf("FileUploader") > -1) {
					relativePath = '/SalesForecast/' + sServiceUrl.trim();
				}
				//relativePath = this.config.serviceConfig.destination + relativePath;
				var fileModel = new sap.ui.model.odata.ODataModel(this.config.serviceConfig.destination + '/SalesForecast/Sales.xsodata', true, "",
					"");
				fileModel.refreshSecurityToken();
				var token = fileModel.getSecurityToken();
				$.ajax({
					type: method ? method : "POST",
					url: sServiceUrl,
					data: inputData,
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					headers: {
						"X-CSRF-Token": token
					}
				}).done(function (data, status) {
					if (status == "nocontent" || data.insert == true || (configGlobal.isMongo && status))
						status = true;
					else
						status = false;
					finishMethod(data, status);
				});
			} else {
				oModel.setJSON(inputData);

				function fnSuccess(data, response) {
					finishMethod(data, true);
				}

				function fnError(oError) {
					finishMethod(JSON.parse(oError.response.body).error.message.value, false);
				}
				if (!this.uploadModel)
					this.uploadModel = new sap.ui.model.odata.v2.ODataModel(this.constructUrlForMetadata(""));
				if (method == "POST")
					this.uploadModel.create(sServiceUrl, oModel.getData(), {
						success: fnSuccess,
						error: fnError
					});
				else if (method == "MERGE")
					this.uploadModel.update(sServiceUrl, oModel.getData(), {
						success: fnSuccess,
						error: fnError
					});
				else
					this.uploadModel.update(sServiceUrl, oModel.getData(), {
						success: fnSuccess,
						error: fnError
					});

			}
		},

		callDeleteService: function (sServiceUrl, inputData, finishMethod) {
			if (sServiceUrl.charAt(0) !== "/") {
				sServiceUrl = "/" + sServiceUrl.trim();
			}
			var oModel = sap.ui.getCore().getModel("dummy");
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				sap.ui.getCore().setModel(oModel, "dummy");
			}
			if (!this.config.isOdata || sServiceUrl.indexOf("FileUploader") > -1) {
				$.ajax({
					url: sServiceUrl.trim(),
					type: 'DELETE',
					success: function (result) {
						finishMethod(result, true);
					},
					error: function (result) {
						finishMethod(result, false);
					}
				});
			} else {
				oModel.setJSON(inputData);
				if (!this.uploadModel)
					this.uploadModel = new sap.ui.model.odata.v2.ODataModel(this.constructUrlForMetadata("")); // Hard coded username and password. need to change.

				this.uploadModel.refreshSecurityToken();
				this.uploadModel.remove(sServiceUrl, {
					success: fnSuccess,
					error: fnError
				});

				function fnSuccess(data, response) {
					finishMethod(data, true);
					var msg = "Submitted Successfully !";
				}

				function fnError(oError) {
					finishMethod(JSON.parse(oError.response.body).error.message.value, false);
				}
			}
		},
		constructUrlForMetadata: function (url) {
			var finalUrl = "";
			if (!url)
				url = "";
			url = this.config.serviceConfig.serviceUrl + url;
			finalUrl = this.fixProxyServerUrl(url, this.config.serviceConfig.destination);
			return finalUrl;
		},

		constructUrlForData: function (url, destination) {
			var finalUrl = "",
				relativePath = "";
			var config = this.config;
			if (url.charAt(0) !== "/") {
				url = "/" + url.trim();
			} else {
				url = url.trim();
			}
			url = url.replace("Express/", "");
			url = url.replace(destination, "");
			relativePath = url;
			if (url.indexOf("Search") > -1) {
				relativePath = config.serviceConfig.searchUrl + relativePath.trim();
			}
			if (url.indexOf("CalculatedField") > -1) {
				relativePath = '/SalesForecast/' + url.trim();
			}
			if (config.dataIsCrossDomain) {
				if (relativePath.charAt(0) === "/")
					finalUrl = relativePath.replace("/", "");
				else
					finalUrl = relativePath;
				if (finalUrl.indexOf("http") <= -1) {
					finalUrl = "http://" + finalUrl;
				}

			} else
				finalUrl = this.fixProxyServerUrl(relativePath, destination);

			return finalUrl;
		}

	};
});