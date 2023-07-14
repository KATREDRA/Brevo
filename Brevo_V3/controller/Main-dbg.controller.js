sap.ui.define([
	"Brevo/Brevo_V2/controller/BaseController",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel",
	"Brevo/Brevo_V2/util/DrawVizChart",
	"Brevo/Brevo_V2/util/MiscUtils",
	"Brevo/Brevo_V2/model/Service",
	"Brevo/Brevo_V2/util/DrawTable",
	"Brevo/Brevo_V2/util/Formatter",
	"Brevo/Brevo_V2/util/DrawPivotTable",
	"Brevo/Brevo_V2/util/DataFormatter",
], function (Controller, MessageToast, MessageBox, Filter, Sorter, JSONModel, DrawVizChart, Utils, Services, DrawTable, Formatter,
	DrawPivotTable, DataFormatter) {
	"use strict";
	return Controller.extend("Brevo.Brevo_V2.controller.Main", {
		cardList: [],
		pageFilters: [],
		semanticFilter: [],
		chartFilter: [],
		pagesOpen: true,
		editCard: false,
		copiedCards: [],
		onInit: function () {
			var that = this;
			this._onInit();
			this.getView().setBusyIndicatorDelay(1);
			this.getView().setBusy(true);
			if (!this.cardConfig)
				this.cardConfig = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.cardsConfig", this);
			if (!this.PopupForPages)
				this.PopupForPages = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.PopupForVariants", this);
			if (!this.shareSettingDialog)
				this.shareSettingDialog = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.shareSettingsDialog", this);
			if (!this.userDetailsDialog)
				this.userDetailsDialog = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.userDetails", this);
			if (!this.PopupForPageFilters)
				this.PopupForPageFilters = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForPageFilters", this);
			var filterModel = new sap.ui.model.json.JSONModel();
			this.PopupForPageFilters.setModel(filterModel);
			this.getView().byId("filterContainer").setModel(filterModel);
			this.getView().setModel(this.getOwnerComponent().getModel("dashboardTypes"), "dashboardTypes");
			var bus = sap.ui.getCore().getEventBus();
			bus.subscribe("mainView", "mainSearchPressed", function (evt) {
				that.onMainSearchPressed();
			});
			bus.subscribe("mainView", "userDetail", function (evt) {
				var data = sap.ui.getCore().getModel("userDet").getData().data
				that.getView().byId("welcomeText").setText("Welcome " + data.firstname + " " + data.lastname + "!");
			});
			bus.subscribe("mainView", "openVariantsPressed", function (evt) {
				that.openVariants();
			});
			bus.subscribe("mainView", "createNewPage", function (evt) {
				that.createNewPage(evt);
			});
			bus.subscribe("mainView", "triggerCreateKPI", function (evt) {
				that.handleAddCard();
			});
			bus.subscribe("mainView", "triggerBrowseKPI", function (evt) {
				that.loadMainPage();
			});

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("MainWithRefreshId").attachPatternMatched(this._onObjectMatched, this);
			oRouter.getRoute("Main").attachPatternMatched(this._onObjectMatched, this);

			google.load("visualization", "1", {
				packages: ["corechart", "charteditor", "geochart"]
			});

		},
		_onObjectMatched: function (evt) {
			var pageId = evt.getParameter("arguments").pageId;
			var refreshId = evt.getParameter("arguments").refreshId;
			if (this.currentPageId && this.currentPageId == pageId) {
				if (refreshId && refreshId.length > 0) {
					this.getCardsForPage(pageId, false, refreshId, false);
				} else {
					this.loadDefaultPage(true);
				}
			} else {
				this.loadDefaultPage(true);
			}
		},
		onPageSelected: function (evt) {
			var object = evt.getSource().getSelectedItem().getBindingContext().getObject();
			var searchBox = this.getView().byId("searchBox");
			searchBox.setVisible(false);
			this.pageFilters = [];
			this.cardFilters = [];
			this.dashboardType = object.type;
			this.openVariants();
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("appView", "updateSideNav", {
				pagesOpen: false
			});
			var that = this;
			window.setTimeout(function () {
				that.setPageData(object.Page_Id);
				that.getCardsForPage(object.Page_Id, true, true, true);
			}, 500);
		},
		loadDefaultPage: function (fetchDataFromServer) {
			var that = this;
			try {
				var pageId = window.location.hash.match(new RegExp("Page_Id" + "=([^&]*)"));
				if (pageId !== null) {
					var currentPageId = pageId[1];
					this.setDefaultPage(currentPageId);
				}
			} catch (e) {
				console.log(e);
				this.setDefaultPage("");
				this.currentPageId = "";
			}
			this.refreshPageList(function (listOfPagesModel) {
				if (listOfPagesModel.getData() && listOfPagesModel.getData().length > 0) {
					that.listOfPages = listOfPagesModel.getData();
					if (that.getDefaultPage() === null || that.getDefaultPage().trim().length <= 0)
						that.currentPageId = listOfPagesModel.getData()[0].Page_Id;
					else
						that.currentPageId = that.getDefaultPage();
				} else {
					that.setDefaultPage("");
					that.currentPageId = "";
					listOfPagesModel.setData([]);
				}
				that.getView().byId("pageList").setModel(listOfPagesModel);
				that.PopupForPages.setModel(listOfPagesModel);
				that.listOfPages = listOfPagesModel.getData();
				if (that.setPageData(that.currentPageId)) {
					listOfPagesModel.updateBindings(true);
					coolGrids.init();
					that.getCardsForPage(that.currentPageId, fetchDataFromServer, null, true);
				} else {
					that.getView().setBusy(false);
				}
			});
		},
		clearAllCards: function () {
			for (var i = 0; i < this.cardList.length; i++) {
				this.cardList[i].destroy();
			}
			this.cardList = [];
		},
		setPageAccess: function (currentPageData) {
			var that = this;
			var userId = "IDADMIN";
			var role = "default";
			try {
				userId = sap.ushell.Container.getService("UserInfo").getUser().getId();
			} catch (e) {
				userId = "IDADMIN";
			}
			if (that.isManager) {
				role = "manager";
			} else
			if (currentPageData.CreatedBy !== userId) {
				role = "default";
			} else {
				role = "owner";
			}
			this.getView().setModel(new JSONModel(that.getAccessData("default")), "AccessModel");
		},
		getCardsForPage: function (pageId, fetchDataFromServer, reloadDataForconfigId, isInitialLoad) {
			var that = this;
			this.clearAllCards();
			that.getView().byId("editBtn").setEnabled(false);
			this.refreshCardList(parseInt(pageId, 10), true, function (cardListModel) {
				that.getView().setBusy(false);
				that.currentPageId = pageId;
				if (cardListModel.getData() && cardListModel.getData().length > 0) {
					//	that.currentPageData = cardListModel.getData()[0];
					that.cardListData = cardListModel.getData();
					that.drawGridsForCard(cardListModel, fetchDataFromServer, reloadDataForconfigId, false, isInitialLoad);
				}
			});
		},
		setPageData: function (pageId) {
			this.currentPageData = this.listOfPages.find(x => x.Page_Id == pageId);
			if (this.currentPageData) {
				this.setPageAccess(this.currentPageData);
				this.getView().byId("ovpPageHeader").setText(this.currentPageData.PageTitle);
				return this.currentPageData;
			}
			return false;
		},
		drawGridsForCard: function (cardListModel, fetchDataFromServer, reloadDataForconfigId, isSearchResult, isInitialLoad) {
			var that = this;
			var configuration = that.currentPageData.CONFIGURATION;
			if (configuration) {
				try {
					configuration = JSON.parse(configuration);
					configuration.position = configuration.position ? configuration.position.reverse() : configuration.reverse();
				} catch (e) {
					configuration = {};
				}
			} else {
				configuration = {};
			}
			coolGrids.drawGrids(configuration.position);
			that.cardListData = Utils.sortArrayByCustomOrder(that.cardListData, configuration.position, "Configid", "confiId");
			if (configuration && configuration.pageFilters)
				that.pageFiltersFromServer = configuration.pageFilters;
			else {
				that.pageFiltersFromServer = [];
			}
			if (isInitialLoad)
				that.pageFilters = that.pageFilters.concat(that.pageFiltersFromServer);
			that.PopupForPageFilters.getModel().setData(that.pageFilters);
			that.PopupForPageFilters.getModel().updateBindings(true);
			that.commonProperties = [];
			for (var i = (that.cardListData.length - 1); i >= 0; i--) {
				try {
					var isParsed = true;
					var fragmentToAdd = null;
					var cardInfo = "";
					that.commonProperties[i] = [];
					var confiId = that.cardListData[i].Configid ? that.cardListData[i].Configid : that.cardListData[i]._id;
					//parse configuration
					that.cardListData[i].Configuration = Utils.parseCardConfiguration(that.cardListData[i].Configuration);
					cardInfo = that.cardListData[i].Configuration;
					if (!cardInfo)
						continue;
					cardInfo.confiId = confiId;

					if (isSearchResult) {
						cardInfo.cardSubtitle = "" + that.cardListData[i].PageTitle;
						cardInfo.isPinVisible = true;
					} else {
						cardInfo.isPinVisible = false;
					}

					if (!cardInfo)
						isParsed = false;

					that.generateGlobalFliters(cardInfo, i);
					that.generateLocalSorters(cardInfo, i);
					that.generateLocalFilters(cardInfo, i);
					//get the fragment for UI
					fragmentToAdd = Utils.getRequiredFragment(cardInfo.cardType, that);

					//add the card to our coolGrids
					var cardElementId = coolGrids.addCard(cardInfo, i);
					fragmentToAdd.placeAt(cardElementId, "only");
					that.addRequiredEvents(fragmentToAdd);
					var cardModel = new JSONModel(cardInfo);
					fragmentToAdd.setModel(cardModel);
					sap.ui.getCore().setModel(cardModel, "Card" + confiId);
					try {
						fragmentToAdd.getItems()[2].getContent()[0].getContent().setHeight($("#" + cardElementId).height() - 85 + "px");
					} catch (e) {}
					that.cardList.unshift(fragmentToAdd);

					var url = that.beforeCardDataLoad(cardModel, fetchDataFromServer, reloadDataForconfigId);
					if (url)
						that.loadCardData(cardModel, url, fragmentToAdd);
					else {
						var dataModel = sap.ui.getCore().getModel("cardDataModel" + cardInfo.confiId);
						if (cardInfo.dataSource === "file")
							cardModel.getData()["data"] = dataModel.getData();
						else
							cardModel.getData()["data"] = dataModel.getData();
						that.drawCards(cardModel, fragmentToAdd);
					}
					continue;
				} catch (e) {
					console.log(e);
					continue;
				}
				if (cardInfo.cardType == "Dual Combination" || cardInfo.predictiveIsOn) {
					cardIndex--;
					var finalUrl = that.constructFinalUrl1(cardInfo);
					that.loadCardData1(EntitySet, cardInfo, finalUrl, confiId, fragmentToAdd, fetchCardDataFromServer, filters);
				} else if (cardInfo.cardType != "Dual Combination") {
					cardIndex--;
					if (cardInfo.cardType != "Image") {
						if (isParsed) {
							var finalUrl = "",
								filters = [];
							if (cardInfo.dataSource == "file") {
								finalUrl = cardInfo.finalUrl;
								if (cardInfo.cardType == "Table")
									filters = [];
								else
									filters = cardInfo.filters;
							} else
								var finalUrl = that.constructFinalUrl(cardInfo);
							that.cardInfoServiceUrl = cardInfo.serviceURL;
							that.cardInfoEntitySet = cardInfo.EntitySet;
							fragmentToAdd.setBusyIndicatorDelay(1);
							fragmentToAdd.setBusy(true);
							window.setTimeout(function (EntitySet, cardInfo, finalUrl, confiId, fragmentToAdd, fetchCardDataFromServer, filters) {
									that.loadCardData(EntitySet, cardInfo, finalUrl, confiId, fragmentToAdd, fetchCardDataFromServer, filters);
								}, parseInt(i / 4) * 500, cardInfo.EntitySet, cardInfo, finalUrl, confiId, fragmentToAdd, fetchCardDataFromServer,
								filters);
						}
					}
				} else {
					fragmentToAdd = sap.ui.xmlfragment("dynamicCards.fragments.templateCard", that)
					that.getView().byId("cardContainer").insertContent(fragmentToAdd);
					fragmentToAdd.setVisible(false);
				}
			}
			that.commonProperties = Formatter.mergeArrays(that.commonProperties);
			//that.commonProperties = dynamicCards.util.Formatter.mergeArrays(that.commonProperties);

		},
		generateLocalSorters: function (cardInfo, i) {
			cardInfo.allSorters = [];
			if (cardInfo.dimension && cardInfo.dimension.length > 0)
				cardInfo.allSorters = cardInfo.dimension.concat(cardInfo.measures);
			else if (cardInfo.columns && cardInfo.columns.length > 0)
				cardInfo.allSorters = cardInfo.columns.concat(cardInfo.measures);
		},
		generateGlobalFliters: function (cardInfo, i) {
			this.cardInfoServiceUrl = cardInfo.serviceURL;
			this.cardInfoEntitySet = cardInfo.EntitySet;
			if (cardInfo.allProperties && cardInfo.allProperties.length > 0) {
				this.commonProperties[i] = cardInfo.allProperties;
			} else if (cardInfo.columns && cardInfo.columns.length > 0)
				this.commonProperties[i] = cardInfo.columns;
			this.commonProperties[i].cardInfoServiceUrl = cardInfo.serviceURL;
			this.commonProperties[i].table = cardInfo.excelFileId;
		},
		generateLocalFilters: function (cardInfo, i) {
			if (this.chartFilter[cardInfo.confiId]) {
				cardInfo.filters = cardInfo.filters.concat(this.chartFilter[cardInfo.confiId]);
				cardInfo.chartFiltered = true;
			} else {
				cardInfo.chartFiltered = false;
			}
		},
		beforeCardDataLoad: function (cardModel, fetchDataFromServer, reloadDataForconfigId) {
			var fetchCardDataFromServer = "";
			var cardInfo = cardModel.getData();
			if (reloadDataForconfigId && reloadDataForconfigId !== null && reloadDataForconfigId + "" === cardInfo.confiId + "") {
				fetchCardDataFromServer = true;
			} else {
				fetchCardDataFromServer = fetchDataFromServer
			}
			if (cardInfo.cardType === "Image") {
				fetchCardDataFromServer = false;
			} else if (cardInfo.cardType === "Dual Combination" || cardInfo.predictiveIsOn) {

			} else {
				// all viz cards 
				var finalUrl = Utils.constructUrlForData(cardModel, this.semanticFilter, this.pageFilters);
			}
			if (fetchCardDataFromServer)
				return finalUrl;
			else
				return false;
		},
		loadCardData: function (cardModel, url, fragmentToAdd) {
			var that = this;
			var cardInfo = cardModel.getData();
			fragmentToAdd.setBusy(true);
			fragmentToAdd.setBusyIndicatorDelay(1);
			this.refreshCardData(cardInfo, url, fragmentToAdd, function (allCardsLoaded) {
				fragmentToAdd.setBusy(false);
				var dataModel = sap.ui.getCore().getModel("cardDataModel" + cardInfo.confiId);
				if (cardInfo.dataSource === "file")
					cardModel.getData()["data"] = dataModel.getData();
				else
					cardModel.getData()["data"] = dataModel.getData();
				that.drawCards(cardModel, fragmentToAdd);
				if (allCardsLoaded) {
					that.getView().byId("editBtn").setEnabled(that.getView().getModel("AccessModel").getData().editCardEnabled);
				}
			});
		},
		drawCards: function (cardModel, fragmentToAdd) {
			try {
				var that = this;
				var cardInfo = cardModel.getData();
				var confiId = cardInfo.confiId;
				var view = null;
				var filters = cardInfo.filters;
				if (cardInfo.cardType == "Table") {
					var tableView = fragmentToAdd.getItems()[2].getContent()[0].getContent();
					tableView.setModel(cardModel);
					if (cardInfo.columns) {
						fragmentToAdd.getItems()[2].getContent()[0].getContent().removeAllColumns();
						var columnToAddArr = [];
						var columnItemsArr = cardInfo.columns;
						var width = ($("#" + tableView.sId).width() / columnItemsArr.length) < 150 ? 150 : ($("#" + tableView.sId).width() /
							columnItemsArr.length);
						for (var j = 0; j < columnItemsArr.length; j++) {
							var getTableTitle = Formatter.columnCustomLabel(columnItemsArr[j]);
							var tableColumn = new sap.ui.table.Column({
								sortProperty: columnItemsArr[j].COLUMN_NAME,
								filterProperty: columnItemsArr[j].COLUMN_NAME,
								defaultFilterOperator: "Contains",
								width: width + "px",
								label: new sap.m.Label({
									text: getTableTitle
								}),
								template: new sap.m.ObjectIdentifier({
									text: {
										parts: [{
											path: columnItemsArr[j].COLUMN_NAME
										}, {
											path: columnItemsArr[j].TYPE
										}],
										formatter: DataFormatter.formatNumber
									}
								})

							});
							fragmentToAdd.getItems()[2].getContent()[0].getContent().addColumn(tableColumn);
						}
						fragmentToAdd.getItems()[2].getContent()[0].getContent().bindAggregation("rows", {
							path: '/data',
							sorter: {
								path: columnItemsArr[0].COLUMN_NAME,
								descending: false
							}
						});
					} else {
						fragmentToAdd.getItems()[2].getContent()[0].getContent().removeAllColumns();
						var columnToAddArr = [];
						var columnItemsArr = cardInfo.columns;
						for (var j = 0; j < columnItemsArr.length; j++) {
							var getTableTitle = Formatter.columnCustomLabel(columnItemsArr[j]);
							var tableColumn = new sap.ui.table.Column({
								header: new sap.m.ObjectIdentifier({
									title: getTableTitle
								})
							})
							fragmentToAdd.getItems()[2].getContent()[0].getContent().addColumn(tableColumn);
						}
						for (var k = 0; k < columnItemsArr.length; k++) {
							var columnToAdd = new sap.m.ObjectIdentifier({
								title: "{" + columnItemsArr[k].COLUMN_NAME + "}",
								titleActive: Formatter.columnLinkVisibility(that.commonProperties, columnItemsArr[k].COLUMN_NAME)
							});
							columnToAddArr.push(columnToAdd);
						}
						fragmentToAdd.getItems()[2].getContent()[0].getContent().bindAggregation("items", {
							path: '/data',
							template: new sap.m.ColumnListItem({
								cells: columnToAddArr
							})
						});
					}
				} else if (cardInfo.cardType == "Geo Map") {
					view = fragmentToAdd.getItems()[2];
					DrawVizChart.loadGeoMap(cardModel, view);
				} else if (cardInfo.cardType == "Report Table") {
					view = fragmentToAdd.getItems()[3];
					DrawPivotTable.drawTableWithCurrentData(view.getItems()[0].sId, cardModel.getData(), [], [], view);
				} else if (cardInfo.cardType == "Dual Combination") {
					view = fragmentToAdd.getItems()[2].getContent()[0].getContent();
					DrawVizChart.drawVizCharts(confiId, cardInfo, cardInfo.cardType, cardModel, view, cardInfo.selectedChartColor,
						cardInfo.manualColors, filters);
				} else if (cardInfo.cardType == "ThirdParty") {} else if (cardInfo.cardType == "Numeric Chart") {
					view = fragmentToAdd.getItems()[2];
					DrawVizChart.drawNumericCharts(cardModel, view);
				} else {
					view = fragmentToAdd.getItems()[2].getContent()[0].getContent();
					if (cardInfo.predictiveIsOn) {
						fragmentToAdd.getItems()[3].setVisible(true);
					} else {
						fragmentToAdd.getItems()[3].setVisible(false);
					}
					DrawVizChart.drawVizCharts(cardModel, view);
				}
			} catch (e) {
				console.log(e);
				// some error ocurred. we will hide this card
				try {
					fragmentToAdd.setVisible(false);
				} catch (e) {
					console.log(e);
				}
			}
		},
		closeVariants: function () {
			this.getView().byId("pageList").setVisible(false);
			this.getView().byId("cardContainerParent").removeStyleClass("hiddenContainer");
			this.pagesOpen = false;
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("appView", "updateSideNav", {
				pagesOpen: false
			});
		},
		openVariants: function () {
			var that = this;
			if (this.pagesOpen) {
				this.getView().byId("pageList").setVisible(false);
				this.getView().byId("cardContainerParent").removeStyleClass("hiddenContainer");
				window.setTimeout(function () {
					that.getView().byId("cardContainerParent").setVisible(true);
				}, 0);
				this.pagesOpen = false;
			} else {
				//this.getView().byId("openVariantBtn").setIcon("sap-icon://navigation-down-arrow");
				this.getView().byId("pageList").setVisible(true);
				this.getView().byId("cardContainerParent").addStyleClass("hiddenContainer");
				this.pagesOpen = true;
			}
		},
		onMainSearchPressed: function () {
			var searchBox = this.getView().byId("searchBox");
			searchBox.setVisible(!searchBox.getVisible());
		},
		onSearchForMain: function (evt) {
			var that = this;
			var searchTerm = evt.getSource().getValue();
			if (searchTerm.length > 0) {
				Services.read("SuggestionModel", "textSearchForCard.xsjs?Search=" + searchTerm, {
					replaceOld: true,
					destination: Services.config.serviceConfig.destination,
					finishMethod: function (evt) {
						that.getView().setBusy(false);
						that.getView().byId("searchErrorMessage").setVisible(false);
						var cardListModel = sap.ui.getCore().getModel("SuggestionModel");
						if (cardListModel.getData() && cardListModel.getData().length > 0) {
							that.currentPageData = cardListModel.getData();
							that.currentPageData.PageTitle = "Search results for '" + searchTerm + "'";
							that.cardListData = cardListModel.getData();
							that.drawGridsForCard(cardListModel, true, false, true);
						} else {
							that.getView().byId("searchErrorMessage").setVisible(true);
						}
					}

				})
			} else {

			}
		},
		handleSave: function (evt) {
			var data = {
				// todo PageId for Kappa system
				"Page_Id": this.currentPageId,
				"CONFIGURATION": JSON.stringify(coolGrids.savePosition())
			}
			var service = dynamicCards.Component.getService();
			service.callCreateService("OVPPageConfig(" + this.currentPageId + ")", JSON.stringify(data), "PUT", function (evt, sucessFlag,
				oError) {
				if (sucessFlag) {
					sap.m.MessageToast.show("saved successfully");
				} else {
					sap.m.MessageBox.error("Failed to save your Page, Try again later or Contact system admin");
				}
			});

		},
		onSavePressWithoutPopup: function () {
			var data = {
				"Page_Id": parseInt(this.currentPageId),
				"CONFIGURATION": JSON.stringify({
					position: coolGrids.savePosition(),
					pageFilters: this.pageFilters
				}),
				"Lastchanged": new Date().toJSON()
			};
			var that = this;
			Services.callCreateService(Services.config.metadataUrls.Pages.update(this.currentPageId), JSON.stringify(data), "PUT",
				function (evt, sucessFlag,
					oError) {
					if (sucessFlag) {
						sap.m.MessageToast.show("Page Saved");
						that.pageFilters = [];
						that.chartFilter = [];
						that.loadDefaultPage(false);
						//that.getCardsForPage(that.currentPageId, false, null, true);
					} else {
						sap.m.MessageBox.error("Failed to save your Page, Try again later or Contact system admin");
					}
				});
		},
		onTableViewPress: function (evt) {
			var fragmentToAdd = null;
			var model = evt.getSource().getModel();
			for (var i = 0; i < this.cardList.length; i++) {
				if (this.cardList[i].getModel().getData().confiId == model.getData().confiId) {
					fragmentToAdd = this.cardList[i];
					break;
				}
			}
			var parent = fragmentToAdd.getItems()[2];
			var tableBox = fragmentToAdd.getItems()[3];
			var chart = parent.getContent()[0].getContent();
			var isTable = chart.getVisible();
			tableBox.setVisible(isTable);
			chart.setVisible(!isTable);
			if (isTable) {
				evt.getSource().setText("Chart");
				evt.getSource().setIcon("sap-icon://bar-chart");
				DrawTable.createTable(tableBox, model);
			} else {
				evt.getSource().setIcon("sap-icon://table-view");
				evt.getSource().setText("Table");
			}
		},
		resizeCard: function (evt) {
			if (evt.getSource().getIcon() == "sap-icon://full-screen") {
				var model = evt.getSource().getModel();
				var configId = model.getData().confiId;
				coolGrids.resizeCard(configId, true);
				evt.getSource().setIcon("sap-icon://exit-full-screen");
			} else {
				var model = evt.getSource().getModel();
				var configId = model.getData().confiId;
				coolGrids.resizeCard(configId, false);
				evt.getSource().setIcon("sap-icon://full-screen");
			}
		},
		onAddSearchCardToPage: function (evt) {
			this.PopupForPages.openBy(evt.getSource());
		},
		handleAddCard: function (evt) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("CreateView", {
				pageId: this.currentPageId,
				isEditMode: this.editCard,
				dashboardType: this.currentPageData.TypeOfPage
			}, false);
		},
		loadMainPage: function (evt) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Main");
		},
		handleEdit: function (evt) {
			var that = this;
			that.editCard = !that.editCard;
			if (!that.editCard) {
				evt.oSource.setIcon("sap-icon://edit");
			} else {
				evt.oSource.setIcon("sap-icon://accept");
			}
			for (var i = 0; i < this.cardList.length; i++) {
				if (that.editCard) {
					that.cardList[i].addStyleClass("editMode");
				} else {
					that.cardList[i].removeStyleClass("editMode");
				}
			}
		},
		copyCurrentCard: function (evt) {
			var config = evt.getSource().getModel().getData();
			if (config.data)
				config.data = [];
			this.copiedCards.push(evt.getSource().getModel().getData());
			this.getView().byId("pasteBtn").setEnabled(true);
		},
		handlePastePress: function (evt) {
			this.onAddMultipleCards(this.copiedCards);
			this.copiedCards = [];
			this.getView().byId("pasteBtn").setEnabled(false);
		},
		downloadCurrentDataSet: function (evt) {
			DrawTable.downloadCurrentDataSet(evt.getSource().getModel());
		},
		editCurrentCard: function (evt) {
			var confiId = evt.getSource().getModel().getData().confiId;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("CreateView", {
				pageId: this.currentPageId,
				dashboardType: this.currentPageData.TypeOfPage,
				isEditMode: true,
				modelName: "Card" + confiId
			}, false);
		},
		deletCurrentCard: function (evt) {
			var that = this;
			var confiId = evt.getSource().getModel().getData().confiId;
			var postCardInfo = {
				"Configid": confiId
			}
			sap.m.MessageBox.warning("Are you sure, you want to delete this card?", {
				title: "Warning",
				styleClass: "sapContrastPlus",
				initialFocus: sap.m.MessageBox.Action.NO,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.YES) {
						var CardConfiguration = Services.config.metadataUrls.Cards.delete(confiId);
						Services.callDeleteService(CardConfiguration, JSON.stringify(postCardInfo), function (evt, sucessFlag, oError) {
							if (!sucessFlag || (typeof evt == "string" && evt.indexOf("error") > -1)) {
								sap.m.MessageToast.show("Unable to delete, Try again later. " + (typeof evt == "string" ? evt : ""));
							} else {
								that.loadDefaultPage(false);

							}
						});
					}
				}
			});
		},
		cardTitlePress: function (evt) {
			var confiId = evt.getSource().getModel().getData().confiId
			var cardInfo = evt.getSource().getModel().getData();
			var bus = sap.ui.getCore().getEventBus();
			if (cardInfo.navigation != undefined && cardInfo.navigation.navTo == "Pana_Viewer" || cardInfo.navigation.navTo ==
				"Browser_Pana" || cardInfo.navigation.navTo ==
				"Pana Viewer") {

				bus.publish("appView", "crossAppNavigation", {
					app: "Browser_Pana",
					params: {
						hash: "Page_Id=" + cardInfo.navigation.Page_ID
					}
				});
				//window.open(window.location.origin + "/Pana_Viewer/index.html#Page_Id=" + cardInfo.navigation.Page_ID);
			} else if (cardInfo.navigation != undefined && cardInfo.navigation.navTo == "Preview") {
				bus.publish("appView", "crossAppNavigation", {
					app: "Pana_Builder",
					params: {
						hash: "reportpreview"
					}
				});
				window.localStorage.setItem("RepConfig", cardInfo.navigation.Report_ID);
				window.localStorage.setItem("analyticalPageId", cardInfo.navigation.Page_ID);
				//	window.open(window.location.origin + "/Pana_Builder/index.html#/reportpreview");
			} else {
				this._autoGenerateReport(cardInfo);
			}
		},
		onDimensionChangedReport: function (evt) {
			var keys = evt.getSource().getSelectedKeys();
			var reportContainerParent = this.getView().byId("reportContainerParent");
			DrawPivotTable.drawTable("reportContainer", evt.getSource().getModel().getData(), this.semanticFilter, this.pageFilters,
				reportContainerParent, keys);
		},
		_autoGenerateReport: function (cardInfo) {
			this.getView().byId("cardParent").setVisible(false);
			var reportContainerParent = this.getView().byId("reportContainerParent");
			reportContainerParent.setVisible(true);
			var dimensionSelect = reportContainerParent.getItems()[0].getContent()[4];
			dimensionSelect.clearSelection();
			DrawPivotTable.drawTable("reportContainer", cardInfo, this.semanticFilter, this.pageFilters, reportContainerParent);
		},
		onBackFromAutoReport: function () {
			this.getView().byId("cardParent").setVisible(true);
			this.getView().byId("reportContainerParent").setVisible(false);
		},
		onPageFilterPress: function () {
			var model = new sap.ui.model.json.JSONModel();
			if (this.pageFilters.length <= 0 && this.commonProperties && this.commonProperties.length > 0) {
				if (this.semanticFilter) {
					if (this.semanticFilter.length <= 0)
						this.pageFilters = [{
							"filterParameter": "",
							"filterValue": "",
							"isBtw": false,
							"filterOperator": "eq",
							"properties": this.commonProperties
						}];
				}
			};
			if (this.semanticFilter) {
				for (var i = 0; i < this.semanticFilter.length; i++) {
					if (this.pageFilters.indexOf(this.semanticFilter[i]) == (-1))
						this.pageFilters.push(this.semanticFilter[i]);
				}
			}
			model.setData(this.pageFilters);
			this.PopupForPageFilters.setModel(model);
			this.getView().byId("filterContainer").setModel(model);
			if (this.PopupForPageFilters.getContent()[0].getItems().length > 0) {
				var filteroperator = this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[1].getSelectedKey();
				for (var p = 0; p < this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0].properties.length; p++) {
					if (this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getBindingContext().getObject().filterParameter ===
						this
						.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0].properties[p].value) {
						if (this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0].properties[p].dataType ===
							"Edm.DateTime") {
							if (filteroperator === "bw") {
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0]["isBtwdate"] = "true"
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[1].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setPlaceholder("From");
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[3].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[3].setPlaceholder("To");
							} else {
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0]["isBtwdate"] = "true"
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[1].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setPlaceholder("");
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[3].setVisible(false);
							}
						} else {
							if (filteroperator === "bw") {
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0]["isBtwdate"] = "false"
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setPlaceholder("");
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[1].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[1].setPlaceholder("");
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[3].setVisible(false);
							} else {
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[0].getModel().oData[0]["isBtwdate"] = "false"
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setVisible(true);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[0].setPlaceholder("");
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[1].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[2].setVisible(false);
								this.PopupForPageFilters.getContent()[0].getItems()[0].getCells()[2].getItems()[3].setVisible(false);
							}
						}
					}
				}
			}
			this.PopupForPageFilters.open();
		},
		onValueHelpRequestForFilterValue: function (evt) {
			var that = this;
			if (!this.ValueHelpForFilterValues)
				this.ValueHelpForFilterValues = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValuehelpforMainFilter", this);
			this.selectedFilterValueField = evt.oSource;
			var object = this.selectedFilterValueField.getBindingContext().getObject();
			var filterParameter = object.filterParameter;
			var table = "";
			for (var i = 0; i < object.properties.length; i++) {
				if (object.properties[i].COLUMN_NAME == filterParameter) {
					table = object.properties[i].table;
					break;
				}
			}
			var url = Services.config.metadataUrls.FileFilter.values(table, filterParameter);
			this.ValueHelpForFilterValues.setBusy(true);
			this.filterParameter = filterParameter;
			Services.read("filterValue", url, {
				replaceOld: true,
				destination: "",
				finishMethod: function (event) {
					that.ValueHelpForFilterValues.setBusy(false);
					var model = sap.ui.getCore().getModel("filterValue");
					if (model.getData().length > 0) {
						var listItem = new sap.m.StandardListItem({
							title: "{" + filterParameter + "}"
						});
						that.ValueHelpForFilterValues.bindAggregation("items", {
							path: "/",
							template: listItem
						});
					}
					that.ValueHelpForFilterValues.setModel(model);
					that.ValueHelpForFilterValues.open();
				}
			});
		},
		onAddNewFilterRow: function () {
			this.pageFilters.push({
				"filterParameter": "",
				"filterValue": "",
				"filterOperator": "eq",
				"isBtw": false,
				"properties": this.commonProperties
			});

			this.PopupForPageFilters.getModel().updateBindings(true);
			// this.onPageFilterPress();
		},
		onDeleteFilterRow: function (evt) {
			var object = evt.oSource.getBindingContext().getObject();
			var i = this.pageFilters.indexOf(object);
			this.pageFilters.splice(i, 1);
			this.PopupForPageFilters.getModel().updateBindings(true);
			// this.onPageFilterPress();
		},
		handleFilterValueConfirm: function (evt) {
			var value = "";
			var values = [];
			var obj;
			var selectedItems = evt.getParameter("selectedContexts");
			if (selectedItems.length > 0) {
				for (var i = 0; i < selectedItems.length; i++) {
					obj = selectedItems[i].oModel.getProperty(selectedItems[i].sPath);
					values.push(obj[this.filterParameter]);
					if (selectedItems.length === 1) {
						value = obj[this.filterParameter];
					} else {
						if (i === 0) {
							value = obj[this.filterParameter];
						} else {
							value = value + ", " + obj[this.filterParameter];
						}
					}
				}
				if (this.selectedFilterValueField && this.selectedFilterValueField !== null) {
					this.selectedFilterValueField.selectedValues = values;
					this.selectedFilterValueField.setValue(value);
					this.selectedFilterValueField = null;
				} else if (this.selectedChartFilter && this.selectedChartFilter !== null) {
					var filterParameter = this.selectedChartFilter.getBindingContext().getObject().COLUMN_NAME;
					var model = this.selectedChartFilter.getModel();
					var filters = model.getData().filters;
					var chartFilters = [{
						"filterParameter": filterParameter,
						"filterValue": value,
						"isBtw": false,
						"filterOperator": "eq",
						"properties": model.getData().commonProperties
					}];
					if (this.chartFilter[model.getData().confiId]) {
						this.chartFilter[model.getData().confiId] = this.chartFilter[model.getData().confiId].concat(chartFilters);
					} else {
						this.chartFilter[model.getData().confiId] = [];
						this.chartFilter[model.getData().confiId] = this.chartFilter[model.getData().confiId].concat(chartFilters);
					}
					chartFilters = chartFilters.concat(filters);
					model.setProperty("/filters", chartFilters);
					model.setProperty("/chartFiltered", true);
					var fragmentToAdd = null;
					for (var i = 0; i < this.cardList.length; i++) {
						if (this.cardList[i].getModel().getData().confiId == model.getData().confiId) {
							fragmentToAdd = this.cardList[i];
							break;
						}
					}
					var url = this.beforeCardDataLoad(model, true, null);
					if (url)
						this.loadCardData(model, url, fragmentToAdd);
					this.selectedChartFilter = null;
				}
			}
			evt.getSource().getBinding("items").filter([]);

		},
		handleFilterConfirm: function (evt) {
			if (this.pageFilters.length <= 1) {
				// this.pageFilters = [];
			}
			this.onPageFilterGoPress();
			evt.oSource.oParent.close();
		},
		//on closing filters dailog box
		handleFilterClose: function (evt) {
			for (var i = 0; i < this.pageFilters.length; i++) {
				if (this.pageFilters[i].filterValue.length <= 0) {
					this.pageFilters.splice(i, 1);
				}
			}
			var model = this.PopupForPageFilters.getModel();
			//model.setData(this.pageFilters);
			model.updateBindings(true);
			evt.oSource.oParent.close();
		},
		onPageFilterGoPress: function () {
			for (var i = 0; i < this.pageFilters.length; i++) {
				if (this.pageFilters[i].filterValue.length <= 0) {
					this.pageFilters.splice(i, 1);
				}
			}
			var model = this.PopupForPageFilters.getModel();
			//model.setData(this.pageFilters);
			model.updateBindings(true);
			this.getCardsForPage(this.currentPageId, true, null, false);
		},
		onPageFilterClearPress: function () {
			this.pageFilters = [];
			this.chartFilter = []
			this.semanticFilters = [];
			this.getCardsForPage(this.currentPageId, false, null, true);
		},
		onOvpPageSearch: function (evt) {
			var list = this.getView().byId("dashboardReports");
			var drillDownReports = this.getView().byId("drillDownReports");
			var search = evt.getSource().getValue();
			if (search.trim().length > 0) {
				list.setHeaderText("Search: " + search);
				drillDownReports.setVisible(false);
			} else {
				list.setHeaderText("Dashboards");
				drillDownReports.setVisible(true);
			}
			var aFilters = [];
			var filter = new sap.ui.model.Filter("PageTitle", sap.ui.model.FilterOperator.Contains, search);
			aFilters.push(filter);
			filter = new sap.ui.model.Filter("PageDescrpition", sap.ui.model.FilterOperator.Contains, search);
			aFilters.push(filter);
			filter = new sap.ui.model.Filter("Industry", sap.ui.model.FilterOperator.Contains, search);
			aFilters.push(filter);
			filter = new sap.ui.model.Filter("SubTitle", sap.ui.model.FilterOperator.Contains, search);
			aFilters.push(filter);
			filter = new sap.ui.model.Filter("Tags", sap.ui.model.FilterOperator.Contains, search);
			aFilters.push(filter);
			var aFilters = new sap.ui.model.Filter(aFilters, false);
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		onOvpRecentPage: function (evt) {
			var list = evt.getSource().getParent().getParent();
			var sort = new sap.ui.model.Sorter("CreatedDate", true);
			var binding = list.getBinding("items");
			binding.sort(sort, "Application");
		},
		createNewPage: function (evt) {
			if (!this.saveAsDialog) {
				this.saveAsDialog = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.SaveAsDialog", this);
				this.getView().getModel("role").setSizeLimit(10000);
				this.saveAsDialog.setModel(this.getView().getModel("role"), "role");
				this.saveAsDialog.setModel(this.getView().getModel("dashboardTypes"), "dashboardTypes");
			}
			this.saveAsDialog.open();
			try {
				var reportTypeSelector = this.saveAsDialog.getContent()[0].getItems()[1].getItems()[0];
				reportTypeSelector.setSelectedItem(reportTypeSelector.getItems()[0]);
			} catch (E) {
				console.log(E);
			}

		},
		onOvpPageEdit: function (evt) {
			if (!this.EditDialog) {
				this.EditDialog = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.EditDialog", this);
				this.getView().getModel("role").setSizeLimit(10000);
				this.EditDialog.setModel(this.getView().getModel("role"), "role");
			}
			var context = evt.getSource().getBindingContext();
			this.EditDialog.setModel(context.getModel());
			this.EditDialog.setBindingContext(context);
			this.EditDialog.open();
		},
		onEditPageDialogClose: function () {
			var items = this.EditDialog.getContent()[0].getItems()[0].getItems()
			items[1].setValue();
			items[5].setValue();
			items[2].getContent()[0].setSelected(true)
			this.EditDialog.close();
		},
		onCreateNewPageDialogClose: function () {
			var items = this.saveAsDialog.getContent()[0].getItems()[0].getItems()
			items[1].setValue();
			items[5].setValue();
			items[2].getContent()[0].setSelected(true)
			this.saveAsDialog.close();
		},
		addRequiredEvents: function (fragment) {
			$('#' + fragment.sId).on('contextmenu', function (ev) {
				ev.preventDefault();
				alert('success!');
				return false;
			}, false);
		},
		keywordValidator: function (args) {
			var text = args.text;

			return new Token({
				key: text,
				text: text
			});
		},
		onEditPageSavePress: function (evt) {
			var that = this;
			var oItems = this.EditDialog.getContent()[0].getItems();
			var name = oItems[1].getValue();
			var description = oItems[5].getValue();
			var tile = oItems[2].getContent()[2].getSelected();
			var share = oItems[2].getContent()[1].getSelected() ? 'X' : '';
			var pageId = this.EditDialog.getBindingContext().getObject().Page_Id;
			var defaultPage = oItems[2].getContent()[0].getSelected();
			var Industry = "";
			if (oItems[7].getSelectedItem())
				Industry = oItems[7].getSelectedItem().getText();
			var tags = oItems[11].getValue();
			var roleName = "";
			if (oItems[9].getSelectedItem())
				roleName = oItems[9].getSelectedItem().getText();
			var data = {
				"Page_Id": pageId,
				"PageTitle": name,
				"RoleFlag": share,
				"SubTitle": roleName,
				"TypeOfPage": "D",
				"PageDescrpition": description,
				"Industry": Industry,
				"Tags": tags

			}
			Services.callCreateService(Services.config.metadataUrls.Pages.update(pageId, "int"), JSON.stringify(data), "PUT", function (
				evt,
				sucessFlag, oError) {
				if (sucessFlag) {
					that.EditDialog.getContent()[0].getItems()[1].setValue();
					that.EditDialog.getContent()[0].getItems()[2].getContent()[0].setSelected(true);
					that.EditDialog.close();
					if (defaultPage) {
						that.setDefaultPage('pageId', pageId);
					}
					that.loadDefaultPage(true);
					sap.m.MessageToast.show("Page saved successfully");
				} else {
					sap.m.MessageBox.error("Failed to save your Page, Try again later or Contact system admin");
				}
			});
		},
		onCreateNewPagePress: function (evt) {
			var that = this;
			var oItems = this.saveAsDialog.getContent()[0].getItems()[0].getItems();
			var name = oItems[1].getValue();
			var description = oItems[5].getValue();
			var tile = oItems[2].getContent()[2].getSelected();
			var share = oItems[2].getContent()[1].getSelected() ? 'X' : '';
			var Industry = "";
			if (oItems[7].getSelectedItem())
				Industry = oItems[7].getSelectedItem().getText();
			var tags = oItems[11].getValue();
			var typeOfPage = this.saveAsDialog.getContent()[0].getItems()[1].getItems()[0].getSelectedItem();
			if (typeOfPage) {
				typeOfPage = typeOfPage.getBindingContext("dashboardTypes").getObject().type;
			} else {
				typeOfPage = "D";
			}
			var roleName = "";
			if (oItems[9].getSelectedItem())
				roleName = oItems[9].getSelectedItem().getText();
			if (name.length > 0) {
				var CardConfiguration = [];
				if (("" + this.Page_Id).indexOf("standard") > -1) {
					CardConfiguration = [];
				} else {
					try {
						var CardInfoModel = sap.ui.getCore().getModel("cardInfoModel");
						CardConfiguration = CardInfoModel.oData.d.results[0].CardConfiguration.results;
						for (var i = 0; i < CardConfiguration.length; i++) {
							CardConfiguration[i].Configid = Math.round(Math.random() * 1000000);
						}
					} catch (evt) {
						CardConfiguration = [];
					}
				}
				var defaultPage = oItems[2].getContent()[0].getSelected();
				var random = Math.round(Math.random() * 1000000);

				var data = {
					// todo PageId for Kappa system
					"Page_Id": random,
					"PageTitle": name,
					"RoleFlag": share,
					"SubTitle": roleName,
					"TypeOfPage": typeOfPage,
					"PageDescrpition": description,
					"Industry": Industry,
					"Tags": tags

				};
				Services.callCreateService(Services.config.metadataUrls.Pages.create, JSON.stringify(data), "POST", function (evt, sucessFlag,
					oError) {
					if (sucessFlag) {
						that.saveAsDialog.getContent()[0].getItems()[0].getItems()[1].setValue();
						// that.saveAsDialog.getContent()[0].getItems()[1].setValue();
						that.saveAsDialog.getContent()[0].getItems()[0].getItems()[2].getContent()[0].setSelected(true);
						that.saveAsDialog.close();
						if (defaultPage) {
							that.currentPageId = random;
							that.setDefaultPage(random);
							that.loadDefaultPage(true);
						}
					} else {
						sap.m.MessageBox.error("Failed to create Dashboard, Try again later or contact system admin");
					}
				});
			}
		},
		onOvpPageDelete: function (evt) {
			var that = this;
			var ovPageId = evt.oSource.getBindingContext().getObject().Page_Id;
			var ovpPageName = evt.oSource.getBindingContext().getObject().PageTitle;
			var postPageInfo = {
				"Page_Id": ovPageId
			}
			var PageConfiguration = Services.config.metadataUrls.Pages.delete(ovPageId, "int");
			sap.m.MessageBox.warning("Are you sure, you want to delete this page?", {
				title: "Warning",
				styleClass: "sapContrastPlus",
				initialFocus: sap.m.MessageBox.Action.NO,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.YES) {
						Services.callDeleteService(PageConfiguration, JSON.stringify(postPageInfo), function (evt, sucessFlag, oError) {
							if (sucessFlag) {
								if (window.localStorage.getItem('pageId') && window.localStorage.getItem('pageId') == ovPageId)
									window.localStorage.removeItem('pageId');
								sap.m.MessageToast.show(ovpPageName + " Page deleted.");
								that.loadDefaultPage(true);
								try {
									var oBookmark = sap.ushell.Container.getService("Bookmark")
									oBookmark.deleteBookmarks('#ovpgateway-Display?Page_Id=' + ovPageId);
								} catch (e) {
									console.log(e);
								}
							} else {
								sap.m.MessageToast.show("Unable to delete, Try again later.");
							}
						});
					}
				}
			});
		},
		onFullScreenPress: function (evt) {
			evt.oSource.oParent.oParent.getItems()[2].setFullScreen(true);
		},
		onAddMultipleCards: function (cards) {
			var that = this;
			var oConfig = {
					json: true,
					useBatch: true
				},
				batchChanges = [],
				CardConfiguration = cards;
			// var oModel = new sap.ui.model.odata.ODataModel(Services.config.serviceConfig.destination + Services.config.serviceConfig.serviceUrl,
			// 	oConfig);
			var Url = Services.config.metadataUrls.Cards.create;
			var count = 0;
			if (CardConfiguration.length > 0) {
				for (var i = 0; i < CardConfiguration.length; i++) {
					count++;
					var pageObject = {
						// todo existing card config for HANA system
						"Configid": Math.round(Math.random() * 1000000),
						"Configuration": JSON.stringify(CardConfiguration[i]),
						"Page_Id": parseInt(this.currentPageId)
					}
					Services.callCreateService(Url, JSON.stringify(pageObject), "POST", function (evt, sucessFlag, oError) {
						count--;
						if (count <= 0) {
							that.loadDefaultPage(true);
						} else {
							sap.m.MessageToast.show("Unable to save, try again later.");
						}
					});
				}
			}
		},
		sortCurrentCard: function (evt) {
			var cardModel = evt.getSource().getModel();
			var sort = {
				sortOperator: evt.getSource().getText(),
				selectedSortItem: evt.getSource().getParent().getBindingContext().getObject().COLUMN_NAME
			};
			var configId = cardModel.getData().confiId;
			var fragmentToAdd = null;
			for (var i = 0; i < this.cardList.length; i++) {
				if (this.cardList[i].getModel().getData().confiId == configId) {
					fragmentToAdd = this.cardList[i];
					break;
				}
			}
			cardModel.setProperty("/sorters", [sort]);
			var url = this.beforeCardDataLoad(cardModel, true, null);
			if (url)
				this.loadCardData(cardModel, url, fragmentToAdd);
		},
		onClearCardFilterPress: function (evt) {
			var model = evt.getSource().getModel();
			this.chartFilter[model.getData().confiId] = null;
			model.setProperty("/chartFiltered", false);
			this.getCardsForPage(this.currentPageId, false, model.getData().confiId, true);
		},
		filterCurrentCard: function (evt) {
			this.selectedChartFilter = evt.getSource();
			var model = evt.getSource().getModel();
			if (!this.ValueHelpForFilterValues)
				this.ValueHelpForFilterValues = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValuehelpforMainFilter", this);
			var that = this;
			var filterParameter = evt.getSource().getBindingContext().getObject().COLUMN_NAME;
			this.filterParameter = evt.getSource().getBindingContext().getObject().COLUMN_NAME;
			var sPath = evt.getSource().getBindingContext().sPath;
			var url = Services.config.metadataUrls.FileFilter.values(model.getData().EntitySet, filterParameter);
			that.ValueHelpForFilterValues.open();
			that.ValueHelpForFilterValues.setBusy(true);
			//var url = model.getData().serviceURL + model.getData().EntitySet + "?$format=json&$top=1000" + "&$select=" + filterParameter;
			Services.read("filterValue" + filterParameter, url, {
				replaceOld: true,
				destination: "",
				finishMethod: function (event) {
					that.ValueHelpForFilterValues.setBusy(false);
					var model = sap.ui.getCore().getModel("filterValue" + filterParameter);
					//if (values.length > 0) {
					var listItem = new sap.m.StandardListItem({
						title: "{" + filterParameter + "}"
					});
					that.ValueHelpForFilterValues.bindAggregation("items", {
						path: "/",
						template: listItem
					});
					//}
					that.ValueHelpForFilterValues.setModel(model);

				}
			});

		},
	});
});