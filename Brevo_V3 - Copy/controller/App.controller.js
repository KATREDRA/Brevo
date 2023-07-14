var cardTemplateThis;
var mainEntitySet;
//jQuery.sap.require("sap.ca.ui.message.message");
sap.ui.define([
	"Brevo/Brevo_V2/controller/BaseController",

	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel",
	"Brevo/Brevo_V2/util/DrawVizChart",
	"Brevo/Brevo_V2/util/MiscUtils",
	"Brevo/Brevo_V2/model/Service",
	"Brevo/Brevo_V2/util/DrawTable",
	"Brevo/Brevo_V2/util/Formatter",
	"sap/ui/core/routing/History"
], function (Controller, MessageBox, Filter, Sorter, JSONModel, DrawVizChart, Utils, Services, DrawTable, Formatter,
	History) {
	"use strict";
	return Controller.extend("Brevo.Brevo_V2.controller.App", {
		onMainSearchPressed: function (evt) {
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("mainView", "mainSearchPressed", {});
		},
		onAvatarPress: function (evt) {
			if (!this.userSettings)
				this.userSettings = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.userSettings", this);
			this.userSettings.open();
			this.userSettings.setModel(sap.ui.getCore().getModel("userDet"));
			var list = this.userSettings.getContent()[2].getItems();
			list[0].getContent()[0].setState(window.localStorage["theme"] == "dark");
		},

		onSettingsOk: function () {
			var list = this.userSettings.getContent()[2].getItems();
			if (!list[0].getContent()[0].getState()) {
				window.localStorage["theme"] = "light";
			} else {
				window.localStorage["theme"] = "dark";
			}
			window.location.reload();
		},
		onSettingsClose: function () {
			this.userSettings.close();
		},
		onCrossAppNavigation: function (app, params) {
			var key = app;
			// "Browser_Pana";
			if (app != "Pana_Builder" && app != "Browser_Pana") {
				key = "";
			}
			// 	key = "Pana_Builder"
			// } else if (app == "Pana_Viewer") {
			// 	key = "Browser_Pana";
			// } else {
			// 	key = "Browser_Brevo";
			// }
			var that = this;
			var sideContent = this.getView().byId("app").getSideContent();
			sideContent.setSelectedKey(key);
			this.openVariants();
			var hasher = new sap.ui.core.routing.HashChanger();
			hasher.setHash(params.hash + "&a=" + key);
			that.getView().setBusy(true);
			window.setTimeout(function () {
				sideContent.fireItemSelect({
					item: sap.ui.getCore().byId(sideContent.getSelectedItem())
				});
				that.getView().setBusy(false);
			}, 1);
		},
		openVariants: function (evt) {
			var that = this;
			that.sideNavClose();
			if (this.getView().byId("parentApp").getVisible()) {
				var bus = sap.ui.getCore().getEventBus();
				bus.publish("mainView", "openVariantsPressed", {});
			}
		},
		onLogout: function (evt) {
			Services.callCreateService(Services.config.metadataUrls.user.logout, JSON.stringify({}), "POST", function (evt, sucessFlag,
				oError) {
				window.location.href = "Login/index.html";
			});
		},
		isLogedIn: function (evt) {
			var that = this;
			that.getView().setBusy(true);
			that.getView().setBusyIndicatorDelay(1);
			if (Services.config.isTesting) {
				var loginInfo = {
					userId: "admin@vaspp.com",
					password: "Vaspp@123"
				};
				Services.callCreateService(Services.config.metadataUrls.user.login, JSON.stringify(loginInfo), "POST", function (data,
					successFlag) {});
			}
			Services.callService("userDet", "", Services.config.metadataUrls.user.userDetails, true, true, function (evt) {
				that.getView().setBusy(false);
				if (evt.getSource().getData() && evt.getSource().getData().data && evt.getSource().getData().data._id) {
					var bus = sap.ui.getCore().getEventBus();
					bus.publish("mainView", "userDetail", {});
				} else {
					if (!Services.config.isTesting) {
						MessageBox.information("Redirecting...");
						window.setTimeout(function () {
							window.location.href = "Login/index.html";
						}, 1000);
					}
				}
			});
		},
		_onObjectMatched: function (evt) {
			var tntPage = this.getView().byId("app");
			var shellBar = this.getView().byId("shellBar");
			var menuButton = this.getView().byId("menuButton");
			if (evt.getParameter("name").indexOf("Main") >= 0) {
				tntPage.removeStyleClass("hideAside");
				menuButton.setVisible(true);
			} else if (evt.getParameter("name").indexOf("CreateView") >= 0) {
				tntPage.addStyleClass("hideAside");
				menuButton.setVisible(false);
			} else {
				menuButton.setVisible(false);
				tntPage.removeStyleClass("hideAside");
			}
		},
		onInit: function () {
			var that = this;
			that["currentKey"] = "Browser_Brevo";
			that[that["currentKey"]] = that.getView().byId("parentApp");
			that.isLogedIn();
			var theme = window.localStorage["theme"] == "dark" ? "" : "-light";
			jQuery.sap.includeStyleSheet("css/style" + theme + ".css");
			jQuery.sap.includeStyleSheet("css/gridStack" + theme + ".css");
			jQuery.sap.includeStyleSheet("css/card" + theme + ".css");
			if (theme.indexOf("light") > -1) {
				sap.ui.getCore().applyTheme("sap_fiori_3");
				$(".sapContrastPlus").removeClass("sapContrastPlus");
				$(document).on('DOMNodeInserted', function (e) {
					$(".sapContrastPlus").removeClass("sapContrastPlus");
				});
			} else {
				sap.ui.getCore().applyTheme("sap_belize_plus");
			}
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.attachRouteMatched(this._onObjectMatched, this);
			var hash = window.location.hash.replace("#", "").trim();
			hash = hash.charAt(0) == "/" ? hash.replace("/", "") : hash;
			if (hash.replace("#", "").trim().length > 0 && hash.indexOf("Dashboard") <= -1) {
				if (hash.indexOf("&a=") > 0) {
					window.location.hash = "";
					return;
				} else {
					window.location.hash = "";
					return;
				}
			}
			var bus = sap.ui.getCore().getEventBus();
			bus.subscribe("appView", "updateSideNav", function (evt, c, data) {
				that.getView().byId("app").setSideExpanded(data.pagesOpen);
			});
			bus.subscribe("appView", "crossAppNavigation", function (evt, c, data) {
				var app = data.app;
				var params = data.params;
				that.onCrossAppNavigation(app, params);
			});
			document.addEventListener('click', function (event) {
				if (event.target.id.indexOf("cardContainer") > -1) { // or any other filtering condition        
					var oToolPage = that.getView().byId("app");
					var bSideExpanded = oToolPage.getSideExpanded();
					if (bSideExpanded) {
						oToolPage.setSideExpanded(!bSideExpanded);
						if (that.getView().byId("parentApp").getVisible()) {
							var bus = sap.ui.getCore().getEventBus();
							bus.publish("mainView", "openVariantsPressed", {});
						}
					}
				}
			}, true /*Capture event*/ );
		},
		sideNavClose: function () {
			try {
				var oToolPage = this.getView().byId("app");
				var bSideExpanded = oToolPage.getSideExpanded();
				//this._setToggleButtonTooltip(bSideExpanded);
				oToolPage.setSideExpanded(!bSideExpanded);
				return !bSideExpanded;
			} catch (e) {

			}
		},
		onItemSelect: function (oEvent) {
			var that = this;
			this.openVariants();
			var oItem = oEvent.getParameter('item');
			var object = oItem.getBindingContext("side").getObject();
			var url = object.URL;
			if (url.indexOf("http") > -1) {
				window.open(url);
				return;
			}
			var component = object.componentName;
			var baseUrl = Services.config.domain;
			var componentPath = baseUrl + url;
			that.getView().setBusy(true);
			if (!url) {
				that.getView().setBusy(false);
				return;
			}
			window.setTimeout(function () {
				var bus = sap.ui.getCore().getEventBus();
				var sKey = oItem.getKey();
				var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
				if (that['currentKey'])
					that[that["currentKey"]].setVisible(false);
				if (url == 'current') {
					if (sKey === "Create_Brevo") {
						bus.publish("mainView", "createNewPage");
					} else if (sKey === "Browser_Brevo") {
						bus.publish("mainView", "triggerBrowseKPI");
					}
					that[sKey] = that.getView().byId("parentApp");
				} else if (!that[sKey]) {
					that[sKey] = new sap.ui.core.ComponentContainer({
						name: component,
						url: componentPath
					});
					that.getView().byId("app").addMainContent(that[sKey]);
				}
				that[sKey].setVisible(true);
				that["currentKey"] = sKey;
				window.setTimeout(function () {
					that.getView().setBusy(false);
				}, 1500);
			}, 100);
		}
	});
});