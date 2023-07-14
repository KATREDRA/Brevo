sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'jquery.sap.global',
	'sap/ui/core/Fragment',
	'sap/ui/model/json/JSONModel',
	'sap/m/ResponsivePopover',
	'sap/m/MessagePopover',
	'sap/m/ActionSheet',
	'sap/m/Button',
	'sap/m/Link',
	'sap/m/Bar',
	'sap/ui/layout/VerticalLayout',
	'sap/m/NotificationListItem',
	'sap/m/MessagePopoverItem',
	'sap/ui/core/CustomData',
	'sap/m/MessageToast',
	'sap/ui/Device',
	"inhance/userManagementSecurity/util/formatter"
], function (Controller, jQuery,
	Fragment,
	JSONModel,
	ResponsivePopover,
	MessagePopover,
	ActionSheet,
	Button,
	Link,
	Bar,
	VerticalLayout,
	NotificationListItem,
	MessagePopoverItem,
	CustomData,
	MessageToast,
	Device, formatter) {
	"use strict";

	return Controller.extend("inhance.userManagementSecurity.controller.app", {
		formatter: formatter,
		onInit: function () {
			var that = this;
			var oViewModel = new sap.ui.model.json.JSONModel({
				busy: true,
				delay: 0,
				layout: "OneColumn",
				previousLayout: "",
				sideContent: this.getView().byId("sideNavigationList"),
				loginUserName: "",
				loginUserPassword: "",
				menuTabsVisibility: true,
				sideMenuVisible: false,
				actionButtonsInfo: {
					midColumn: {
						fullScreen: false
					}
				}
			});
			this.getView().setModel(oViewModel, "appView");
			this.sideNavClose();
			if (!this.valueHelpForUserProfile)
				this.valueHelpForUserProfile = new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForUserProfile", this);
			this.getView().addDependent(this.valueHelpForUserProfile);
			//this.getOwnerComponent().getModel("side").attachRequestCompleted(function(){
			var sideNavigation = that.getView().byId("sideNavigationList").getItem().getItems();
			for (var i = 0; i < sideNavigation.length; i++) {
				if (sideNavigation[i].getKey() == "home") {
					that.getView().byId("sideNavigationList").setSelectedItem(sideNavigation[i]);
					break;
				}
			}
			if (window.history.length != 1 && window.localStorage.getItem("loginDetails") != null && window.localStorage.getItem("loginDetails") !=
				"null") {
				this.getView().getModel("appView").setProperty("/loginDetails", JSON.parse(window.localStorage.getItem("loginDetails")));
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Home");
			}
		},
		_objPatternMatched: function () {

		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		onItemSelect: function (oEvent) {
			var oItem = oEvent.getParameter('item');
			var sKey = oItem.getKey();
			this.getView().getModel("appView").setProperty("/layout", "OneColumn");
			if (sKey === "home") {
				this.sideNavClose();
				this.getRouter().navTo("Home");
			} else if (sKey === "users") {
				this.getRouter().navTo("usersMaster");
			} else if (sKey === "groups") {
				this.getRouter().navTo("groups");
			} else if (sKey === "roles") {
				this.getRouter().navTo("rolesMaster");
			} else if (sKey === "Super Admin") {
				this.getRouter().navTo("adminMaster");
			} else if (sKey === "Application") {
				this.getRouter().navTo("applicationList");
			}
		},
		onSideNavButtonPress: function () {
			var oToolPage = this.getView().byId("app");
			var bSideExpanded = oToolPage.getSideExpanded();
			this._setToggleButtonTooltip(bSideExpanded);
			oToolPage.setSideExpanded(!bSideExpanded);
		},
		sideNavClose: function () {
			var oToolPage = this.getView().byId("app");
			var bSideExpanded = oToolPage.getSideExpanded();
			this._setToggleButtonTooltip(bSideExpanded);
			oToolPage.setSideExpanded(false);
		},
		_setToggleButtonTooltip: function (bSideExpanded) {
			var oToggleButton = this.getView().byId('sideNavigationToggleButton');
			if (bSideExpanded) {
				oToggleButton.setTooltip('Large Size Navigation');
			} else {
				oToggleButton.setTooltip('Small Size Navigation');
			}
		},
		_createNotification: function (sId, oBindingContext) {
			var oBindingObject = oBindingContext.getObject();
			var oNotificationItem = new NotificationListItem({
				title: oBindingObject.title,
				description: oBindingObject.description,
				priority: oBindingObject.priority,
				close: function (oEvent) {
					var sBindingPath = oEvent.getSource().getCustomData()[0].getValue();
					var sIndex = sBindingPath.split("/").pop();
					var aItems = oEvent.getSource().getModel("alerts").getProperty("/alerts/notifications");
					aItems.splice(sIndex, 1);
					oEvent.getSource().getModel("alerts").setProperty("/alerts/notifications", aItems);
					oEvent.getSource().getModel("alerts").updateBindings("/alerts/notifications");
					sap.m.MessageToast.show("Notification has been deleted.");
				},
				datetime: oBindingObject.date,
				authorPicture: oBindingObject.icon,
				press: function () {},
				customData: [
					new CustomData({
						key: "path",
						value: oBindingContext.getPath()
					})
				]
			});
			return oNotificationItem;
		},
		_createError: function (sId, oBindingContext) {
			var oBindingObject = oBindingContext.getObject();
			var oLink = new Link("moreDetailsLink", {
				text: "More Details",
				press: function () {
					MessageToast.show("More Details was pressed");
				}
			});
			var oMessageItem = new MessagePopoverItem({
				title: oBindingObject.title,
				subtitle: oBindingObject.subTitle,
				description: oBindingObject.description,
				counter: oBindingObject.counter,
				link: oLink
			});
			return oMessageItem;
		},
		handleLogoutPress: function () {
			var that = this;
			$.post("/BrevoMongoDB/logout", {}, function (data) {
				if (JSON.parse(data).logout) {
					that.getView().getModel("appView").setProperty("/layout", "OneColumn");
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("login");

					function preventBack() {
						window.history.forward();
					}
					setTimeout("preventBack()", 0);
					window.onunload = function () {
						null
					};
					window.localStorage.removeItem("loginDetails");
				}
			})

		},
		handleUserProfilePress: function (evt) {
			this.valueHelpForUserProfile.openBy(evt.getSource());
		}
	});
});