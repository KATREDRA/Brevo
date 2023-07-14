sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/Brevo_V2/model/Service"
], function (Controller, Services) {
	"use strict";

	return Controller.extend("Brevo.Brevo_V2.controller.BaseController", {
		currentPageId: null,
		serviceRequestPending: 1,
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		_onInit: function () {
			sap.m.MessageToast._mSettings.animationTimingFunction = "linear";
			sap.m.MessageToast._mSettings.at = "right top";
			sap.m.MessageToast._mSettings.my = "right top";
			sap.m.MessageToast._mSettings.offset = "-10 -10";
			sap.m.MessageToast._mSettings.width = "20em";
		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		getUrlParamterSeparator: function () {
			return Services.config.separator;
		},
		constructFilter: function (key, operator, value) {
			var filter = Services.config.filter;
			if (typeof value === "string")
				value = filter.stringLimiter + value + filter.stringLimiter;
			return filter.key + key + filter.delimiter + filter.operator[operator] + filter.delimiter + value;
		},
		constructNextFilter: function (isAnd, key, operator, value) {
			var filter = Services.config.filter;
			if (typeof value === "string")
				value = filter.stringLimiter + value + filter.stringLimiter;
			return filter.delimiter + filter.operator[operator] + filter.delimiter + key +
				filter.delimiter + filter.operator[operator] + filter.delimiter + value;
		},
		getSortKey: function () {
			return Services.config.sortKey;
		},
		getSelectKey: function () {
			return Services.config.selectKey;
		},
		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getAccessData: function (role) {
			var data = this.getOwnerComponent().getModel("AccessModel").getData()[role];
			if (!role || typeof data == "undefined")
				data = this.getOwnerComponent().getModel("AccessModel").getData()["default"];
			return data;
		},
		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		setDefaultPage: function (pageId) {
			window.localStorage.setItem('pageId', pageId);
		},
		getDefaultPage: function () {
			return window.localStorage.getItem('pageId');
		},
		refreshPageList: function (success) {
			Services.readForMetadata("pageListModel", "pageListModel", Services.config.metadataUrls.Pages.list + "?" + Services.config.sort
				.key + "CreatedDate desc", "", true,
				function (evt) {
					var pageListModel = sap.ui.getCore().getModel("pageListModel");
					success(pageListModel);
				});
		},
		refreshCardList: function (pageId, fromServer, success) {
			var url = Services.config.metadataUrls.Cards.list + "?$top=1";
			if (pageId) {
				url = Services.config.metadataUrls.Cards.list + "?" + this.constructFilter("Page_Id", "eq", pageId);
				this.setDefaultPage(pageId);
			} else
				url = Services.config.metadataUrls.Cards.list + "?" + "$top=1";
			Services.readForMetadata("cardListModel", "CardConfiguration", url, "", fromServer, function (evt) {
				var cardListModel = sap.ui.getCore().getModel("cardListModel");
				success(cardListModel);
			});
		},
		refreshCardData: function (cardInfo, url, fragmentToAdd, success) {
			var that = this;
			fragmentToAdd.setBusy(true);
			if (this.serviceRequestPending)
				this.serviceRequestPending++;
			else {
				this.serviceRequestPending = 1;
			}
			Services.callService("cardDataModel" + cardInfo.confiId, "ZQ_Q_PQMP01_ODATA_001Results.json", url, true, true,
				function (evt) {
					that.serviceRequestPending--;
					if (that.serviceRequestPending <= 1) {
						success(true);
					} else {
						success(false);
					}
					fragmentToAdd.setBusy(false);
				}, "", "");
		},
	});

});