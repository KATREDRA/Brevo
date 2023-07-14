var cardTemplateThis;
var mainEntitySet;
//jQuery.sap.require("sap.ca.ui.message.message");
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
	"sap/ui/core/routing/History",
	"Brevo/Brevo_V2/util/DrawPivotTable",
	"Brevo/Brevo_V2/util/DataFormatter",
	"Brevo/Brevo_V2/util/FilterProcessor"
], function (Controller, MessageToast, MessageBox, Filter, Sorter, JSONModel, DrawVizChart, Utils, Services, DrawTable, Formatter,
	History, DrawPivotTable, DataFormatter, FilterProcessor) {
	"use strict";
	return Controller.extend("Brevo.Brevo_V2.controller.cardTemplate", {
		fileUploaded: false,
		addMenuEventListeners: function () {
			var arrayOfIds = ["menuItem1", "menuItem3", "menuItem4", "menuItem5", "menuItem6", "menuItem7", "menuItem8"

			];

			for (var i = 0; i < arrayOfIds.length; i++) {
				var element = cardTemplateThis.getView().byId(arrayOfIds[i]);
				element.addEventDelegate({
					onclick: function (evt) {
						var id = evt.currentTarget.id;
						var element = id.charAt(id.length - 1);
						cardTemplateThis.handleMenuItemPress(element);
					}
				});
			}
		},
		//onclick of the menu items, its visibles the particular elements
		handleMenuItemPress: function (evt, arrayOfIds) {
			var arrayOfIds = ["configuration1", "configuration2", "configuration3", "configuration4", "configuration5", "configuration6",
				"configuration7", "configuration8", "configuration9"
			];
			for (var i = 0; i < arrayOfIds.length; i++) {
				var element = cardTemplateThis.getView().byId(arrayOfIds[i]);
				element.setVisible(false);
			}
			cardTemplateThis.getView().byId("configuration" + evt).setVisible(true);
		},
		_onObjectMatched: function (evt) {
			var that = this;
			this.tableOrChart = new JSONModel({
				isChart: true,
				predictionSupport: false
			});
			var model = null;
			previewCard.getView().setModel(this.tableOrChart, "chartType");
			this.columnNumber = 4;
			this.pageId = evt.getParameter("arguments").pageId;
			this.dashboardType = evt.getParameter("arguments").dashboardType;
			this.isEditMode = evt.getParameter("arguments").isEditMode == "true" ? true : false;
			this.isFromSuggestion = evt.getParameter("arguments").isFromSuggestion ? true : false;
			var cardListModel = sap.ui.getCore().getModel("cardListModel");
			if (!cardListModel) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Main", true);
				return;
			}

			if (this.isEditMode === true) {
				this.modelName = evt.getParameter("arguments").modelName;
				model = sap.ui.getCore().getModel(this.modelName);
				if (!model) {
					model = new sap.ui.model.json.JSONModel(that.cardInfo);
					// var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					// oRouter.navTo("Main", true);
					// return;
				}
				// cardTemplateThis.loadDataToModelForServiceUrl();
			}
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("appView", "updateSideNav", {
				pagesOpen: false
			});
			if (!this.isFromSuggestion) {
				var userName = "Gary";
				Services.callService("SuggestionModel", "SuggestionModel",
					"textSearchForCard.xsjs?Search=" + "sales", "", "false",
					function (evt) {
						var oModel = sap.ui.getCore().getModel("SuggestionModel");
						var cardInfoResults = oModel.oData;
						var suggestionData = [];
						var keys = Object.keys(cardInfoResults);
						for (var i = 0; i < keys.length; i++) {
							try {

								var cardInfo = JSON.parse(decodeURIComponent(escape((cardInfoResults[keys[i]].Configuration))));
								cardInfo.chartConfigId = cardInfoResults[keys[i]]["Config ID"];
								cardInfo.pageId = cardInfoResults[keys[i]]["Page ID"];
								suggestionData.push(cardInfo);
							} catch (e) {

							}
						}
						cardTemplateThis.getView().byId("aiTitle").setText("Recommended for you");
						oModel.setData(suggestionData);
						cardTemplateThis.getView().byId("aiGrid").setModel(oModel);
					});
			}
			var semantiColors = ['#d32030', '#e17b24', '#61a656', '#848f94'];
			if (that.isEditMode) {
				var dimensionArray = [];
				var measureArray = [];
				var newArray = [];
				var propertiesModel = new sap.ui.model.json.JSONModel();
				var measureModel = new sap.ui.model.json.JSONModel();
				var dimensionModel = new sap.ui.model.json.JSONModel();
				if (this.modelName) {
					var model = sap.ui.getCore().getModel(this.modelName);
				}
				this.cardInfo = model.getData();
				if (!that.isFromSuggestion) {
					that.isUpdate = true;
				}
				that.chartConfigId = this.cardInfo.confiId;
				previewCard.getView().byId("chartContainer").setVisible(true);
				previewCard.getView().byId("ChartPreviewBox").setVisible(false);
				that.getView().byId("aiTitle").setText("Recommended for You");
				model.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
				if (this.cardInfo.dataSource == "file") {
					that.getView().setBusy(true);
					var fileUploadModel = sap.ui.getCore().getModel("FileUploadModel");
					that.fileUploaded = true;
					if (fileUploadModel) {
						that.onExistingFileSelected(null, this.cardInfo.excelFileId, function () {
							that.getView().setBusy(false);
							that.setDataOnEdit(that.cardInfo);
						});
					} else {
						that.refreshFileTable(function () {
							that.onExistingFileSelected(null, that.cardInfo.excelFileId, function () {
								that.getView().setBusy(false);
								that.setDataOnEdit(that.cardInfo);
							})
						});
					}
				}
				var chartType = this.cardInfo.cardType;
				that.chartName = chartType;
				if (this.cardInfo.isShowLabels == undefined) {
					that.getView().byId("isShowLabelsSet").setSelected(true);
				} else

					that.getView().byId("isShowLabelsSet").setSelected(this.cardInfo.isShowLabels);
				that.getView().byId("colorText").setSelectedKey(this.cardInfo.selectedChartColor);
				that.manualColors = this.cardInfo.manualColors;

				that.getView().byId("colorValues").removeAllTokens();
				that.getView().byId("formattingId").getContent()[1].setSelectedKey(this.cardInfo.measureFormat);
				that.selectedMeasureFormat = this.cardInfo.measureFormat;
				that.getView().byId("formattingId").getContent()[3].setValue(this.cardInfo.decimalValue);
				that.selectedDecimalValues = this.cardInfo.decimalValue;
				that.getView().byId("formattingId").getContent()[5].setValue(this.cardInfo.xAxisLabel);
				that.getView().byId("formattingId").getContent()[7].setValue(this.cardInfo.yAxisLabel);
				var defaultColors = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
				if (this.cardInfo.selectedChartColor == "Manual_Color") {
					that.getView().byId("colorValues").setEnabled(true);
					for (var i = 0; i < that.manualColors.length; i++) {

						that.getView().byId("colorValues").addToken(new sap.m.Token({
							key: that.manualColors[i],
							text: that.manualColors[i]
						}));
					}
				} else {
					if (this.cardInfo.selectedChartColor == "Semantic_Color" || this.cardInfo.selectedChartColor == "") {

						that.getView().byId("colorValues").setEnabled(false);
						for (var i = 0; i < semantiColors.length; i++) {

							that.getView().byId("colorValues").addToken(new sap.m.Token({
								key: semantiColors[i],
								text: semantiColors[i]
							}));
						}
					} else if (this.cardInfo.selectedChartColor == "Default_Color") {
						that.getView().byId("colorValues").setEnabled(false);
						for (var i = 0; i < defaultColors.length; i++) {
							that.getView().byId("colorValues").addToken(new sap.m.Token({
								key: defaultColors[i],
								text: defaultColors[i]
							}));
						}
					}
				}
				that.entitySetRequired = that.cardInfo.EntitySet;
				that.getView().byId("configuration3").setModel(model);
				that.handleTitleInput();
				try {
					if (cardInfoModel.oData.cardTitle.length > 0) {
						that.getView().byId("menuItem3").removeStyleClass("invalid customMenuItem");
						that.getView().byId("menuItem3").addStyleClass("valid customMenuItem");
					} else {
						that.getView().byId("menuItem3").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
						that.getView().byId("menuItem3").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
					}
				} catch (e) {}
				that.entitySetDataModel = new sap.ui.model.json.JSONModel();
				window.setTimeout(function () {
					//that.cardInfo.serviceURL = Services.config.serviceConfig.destination + that.cardInfo.serviceURL;
					that.getView().byId("fileId").setText(that.cardInfo.serviceURL);
					var destination = that.cardInfo.destination;
					if (Services.config.serviceConfig.useDataDestination) {
						if (!that.cardInfo.destination) {
							destination = Services.config.serviceConfig.destination;
						}
					} else {
						destination = "";
					}
					that.getView().byId("destinationId").setText(destination);
					var editServiceUrl = that.cardInfo.serviceURL;
					if (editServiceUrl == "/sap/opu/odata/sap/ZOVP_BUILDER_FINANCE_SRV/") {
						that.getView().byId("setfileIdText").setText("Finance");
					} else if (editServiceUrl == "/SalesForecast/Sales.xsodata/") {
						that.getView().byId("setfileIdText").setText("Express");
					} else if (editServiceUrl == "/sugar_odata/index.php/OdataNew/odata?database=sugarcrm") {
						that.getView().byId("setfileIdText").setText("Sugar CRM");
					} else if (editServiceUrl == "/sugar_odata/index.php/OdataNew/odata?database=tiebs_service") {
						that.getView().byId("setfileIdText").setText("Tiebs");
					} else if (editServiceUrl == "/Car/car.xsodata/") {
						that.getView().byId("setfileIdText").setText("Sales Details");
					} else {
						that.getView().byId("setfileIdText").setText(that.cardInfo.serviceURL);
					}
					//that.getView().byId("setfileIdText").setText(cardInfo.EntitySet);
					that.getView().byId("entityId").setValue(that.cardInfo.Entity);
					/*	if (cardInfo.sorters != undefined) {
						that.sortItems = cardInfo.sorters;
						that.getView().byId("sortButtonId").setText(cardInfo.sorters[0].selectedSortItem);
					} else {
						that.getView().byId("sortButtonId").setText("Select a Value");
					}*/
					that.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
					that.getView().byId(
						"menuItem4").addStyleClass("sapUiResponsivePadding valid customMenuItem");

					var entity = that.cardInfo.Entity;
					if (that.cardInfo.dataSource == "file") {
						that.fileUploaded = true;
						that.getView().byId("entityId").setShowValueHelp(false);
					} else {
						that.fileUploaded = false;
						that.getView().byId("entityId").setShowValueHelp(true);
						that.onServiceUrlChanged(that.isEditMode, function () {
							// that.entitySetDataModel.setData({
							// 	d: {
							// 		results: model.getData().data
							// 	}
							// });
							that.setMeasuresAndDimensionsForEnity(entity);
							that.setDataOnEdit(that.cardInfo);
							if (that.isFromSuggestion) {
								that.handleRefreshButton(true);
								that.isEditMode = false;
							}
						});
					}
				}, 1);
			} else {
				window.setTimeout(function () {
					var chartListJSON = sap.ui.getCore().getModel("chartListJSON");
					if (chartListJSON) {
						var masterListId2 = that.getView().byId("masterListId2");
						if (masterListId2.getBinding("content")) {
							masterListId2.getBinding("content").filter([new sap.ui.model.Filter("category", "EQ",
								that.dashboardType ?
								that.dashboardType : "D")]);
							that.setCardTypeBoxSelected(masterListId2.getContent()[0], that);
						}
					}
				}, 200);
				var dummyModel = new sap.ui.model.json.JSONModel([]);
				// that.getView().byId("carConfigWizard").setModel(dummyModel);
				that.chartContextId = "0";
				that.isUpdate = false;
				that.chartName = "";

				that.getView().byId("entityId").setShowValueHelp(true);
				that.getView().byId("column1").setModel(dummyModel);
				that.getView().byId("column2").setModel(dummyModel);
				that.getView().byId("column3").setModel(dummyModel);
				that.getView().byId("columnVboxId").setVisible(false);
				that.getView().byId("measureId").setModel(dummyModel);
				that.getView().byId("dimensionId").setModel(dummyModel);
				that.getView().byId("colorText").setSelectedKey("Semantic_Color");
				that.getView().byId("formattingId").getContent()[1].setSelectedKey("default");
				that.getView().byId("formattingId").getContent()[3].setValue("");
				that.getView().byId("formattingId").getContent()[5].setValue("");
				that.getView().byId("formattingId").getContent()[7].setValue("");
				that.getView().byId("colorValues").removeAllTokens();
				that.getView().byId("isShowLabelsSet").setSelected(true);

				that.getView().byId("colorValues").setEnabled(false);
				for (var i = 0; i < semantiColors.length; i++) {

					that.getView().byId("colorValues").addToken(new sap.m.Token({
						key: semantiColors[i],
						text: semantiColors[i]
					}));
				}
			}
			try {
				that.handleMenuItemPress(1);
				that.getView().byId("menuItem1").setSelected(true);
			} catch (e) {}
			//			that.getView().setBusy(false);

		},
		onInit: function () {
			var measuresArr = []
			cardTemplateThis = this;
			cardTemplateThis.busyDialog = new sap.m.BusyDialog();
			var that = this;
			this.addMenuEventListeners();
			this.navHash = "";
			this.columnvalue = 1;
			cardTemplateThis.isUpdate = false;
			var chrtSelectBox = this.getView().byId("chrtSelectBox");
			chrtSelectBox.addEventDelegate({
				onclick: function (evt) {
					var box = sap.ui.getCore().byId(evt.currentTarget.id);
					that.setCardTypeBoxSelected(box, that);
				}
			});
			var excelBox = this.getView().byId("excelBox");
			excelBox.addEventDelegate({
				onclick: function (evt) {
					var excelBox = sap.ui.getCore().byId(evt.currentTarget.id);
					that.onValueHelpRequestForFiles(excelBox.oParent);
				}
			});
			var dataBox = this.getView().byId("dataBox");
			dataBox.addEventDelegate({
				onclick: function (evt) {
					var dataBox = sap.ui.getCore().byId(evt.currentTarget.id);
					that.onValueHelpRequestForDataRecords(dataBox.oParent);
				}
			});
			var masterListId2 = cardTemplateThis.getView().byId("masterListId2");
			Services.callService("chartListJSON", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/chartList.json", "", "", "loadMock",
				function (
					evt) {
					var chartListJSON = sap.ui.getCore().getModel("chartListJSON");
					try {
						var chartNames = ["Block Matrix", "Vertical Floating Bars", "Bubble Ring", "Grouped Step Line"];
						for (var m = (chartListJSON.oData.length - 1); m >= 0; m--) {
							var chartPresent = chartNames.includes(chartListJSON.oData[m].chartName);
							if (chartPresent == true) {
								chartListJSON.oData.splice(m, 1);
							}
						}
						masterListId2.setModel(chartListJSON);
					} catch (e) {
						masterListId2.setModel(chartListJSON);
					}
				});
			// Get the URLS from manifest files
			Services.callService("dataSrcJSON", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/neo-app.json", "GetDestinations", "", "false",
				function (evt) {
					var oModel = sap.ui.getCore().getModel("dataSrcJSON");
					cardTemplateThis.ValueHelpForDataRecords.getContent()[0].getPages()[0].setModel(oModel);
				});

			if (!cardTemplateThis.ValueHelpForYearSelection)
				cardTemplateThis.ValueHelpForYearSelection = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForSelectingYear", this);
			if (!cardTemplateThis.ValueHelpForMonthSelection)
				cardTemplateThis.ValueHelpForMonthSelection = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForSelectingMonth", this);
			if (!cardTemplateThis.ValueHelpForDateSelection)
				cardTemplateThis.ValueHelpForDateSelection = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForSelectingDate", this);
			if (!cardTemplateThis.ValueHelpForNavigation)
				cardTemplateThis.ValueHelpForNavigation = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForNavigation", this);
			if (!cardTemplateThis.ValueHelpForFiles)
				cardTemplateThis.ValueHelpForFiles = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForFiles", this);
			if (!cardTemplateThis.ValueHelpForDimensionsTypeSelection)
				cardTemplateThis.ValueHelpForDimensionsTypeSelection = sap.ui.xmlfragment(
					"Brevo.Brevo_V2.fragments.ValueHelpForDimensionsTypeSelection", this);
			if (!cardTemplateThis.ValueHelpForMeasureChartTypeSelection)
				cardTemplateThis.ValueHelpForMeasureChartTypeSelection = sap.ui.xmlfragment(
					"Brevo.Brevo_V2.fragments.ValueHelpForMeasureChartTypeSelection", this);
			if (!cardTemplateThis.displayExcel) {
				cardTemplateThis.displayExcel = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.displayExcel", this);
			}
			/*if (!cardTemplateThis.customMeasureDialog)
				cardTemplateThis.customMeasureDialog = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.CustomMeasureDialog", cardTemplateThis);*/
			if (!cardTemplateThis.ValueHelpForDataRecords)
				cardTemplateThis.ValueHelpForDataRecords = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForDataRecords", this);
			if (!cardTemplateThis.valueHelpRequestForEntity)
				cardTemplateThis.valueHelpRequestForEntity = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelp", this);
			if (!cardTemplateThis.valueHelpRequestForFields)
				cardTemplateThis.valueHelpRequestForFields = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForFields", this);
			if (!cardTemplateThis.valueHelpRequestForFilter)
				cardTemplateThis.valueHelpRequestForFilter = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForFilters", this);
			if (!cardTemplateThis.valueHelpRequestForBot)
				cardTemplateThis.valueHelpRequestForBot = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.valueHelpRequestForBot", this);
			if (!cardTemplateThis.valueHelpForMeasureSettings)
				cardTemplateThis.valueHelpForMeasureSettings = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.valueHelpForMeasureSettings", this);
			if (!cardTemplateThis.valueHelpRequestForSort)
				cardTemplateThis.valueHelpRequestForSort = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.valueHelpForSort", this);
			if (!cardTemplateThis.valueHelpForRestrictedMeasure)
				cardTemplateThis.valueHelpForRestrictedMeasure = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.valueHelpForRestrictedMeasure",
					this);
			cardTemplateThis.ValueHelpForFiles.getContent()[0].addEventDelegate({
				onclick: function () {
					$("#" + cardTemplateThis.ValueHelpForFiles.getContent()[1].sId + "-fu").trigger('click');
				}
			});
			// cardTemplateThis.ValueHelpForDataSrc =
			// sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForDataService",
			// this);
			if (!cardTemplateThis.ValueHelpForFilterValues)
				cardTemplateThis.ValueHelpForFilterValues = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.ValueHelpForFilterValues", this);
			var calMeasureDailog = cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[0].getContent()[7];
			calMeasureDailog.onAfterRendering = function () {
				// call autocomplete plugin function after rendering of textarea is completed
				cardTemplateThis.enableAutoComplete();
			};
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("CreateView").attachPatternMatched(this._onObjectMatched, this);

		},
		setDataOnEdit: function (cardInfo) {
			var chartType = cardInfo.cardType;
			var masterListId2 = cardTemplateThis.getView().byId("masterListId2");
			try {
				for (var i = 0; i < cardInfo.filters.length; i++) {
					var filterParameterArr = [];
					if (cardInfo.filters[i].filterName != undefined) {
						for (var r = 0; r < cardInfo.filters[i].filterValue.split(",").length; r++) {
							var filterObj = {
								filterParameterValue: cardInfo.filters[i].split(",")[r]
							};
							filterParameterArr.push(filterObj);
						}
						var panelObj = {
							filterParameter: cardInfo.filters[i].filterName,
							filterDataType: "Edm.String",
							filterOperator: "eq",
							filterParameterArr
							//filterParameterArr :values
						};
						cardInfo.filters[i] = panelObj;
					}
				}
			} catch (e) {}
			var filterModel = new sap.ui.model.json.JSONModel(cardInfo.filters);
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(filterModel);
			var measureArr = [];
			for (var i = 0; i < cardInfo.measures.length; i++) {
				measureArr.push(cardInfo.measures[i].COLUMN_NAME);
			}
			var dimArr = [];
			for (var i = 0; i < cardInfo.dimension.length; i++) {
				dimArr.push(cardInfo.dimension[i].COLUMN_NAME);
			}
			if (measureArr.length > 0 && dimArr.length > 0) {
				cardTemplateThis.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				cardTemplateThis.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			}
			if (chartType == "Table") {
				if (cardInfo.columns == undefined) {
					cardTemplateThis.getView().byId("column1").setSelectedKey(cardInfo.column1.COLUMN_NAME);
					cardTemplateThis.getView().byId("column2").setSelectedKey(cardInfo.column2.COLUMN_NAME);
					cardTemplateThis.getView().byId("column3").setSelectedKey(cardInfo.column3.COLUMN_NAME);
				} else {
					previewCard.getView().byId("graphListId").removeAllColumns();
					for (var r = 0; r < cardInfo.columns.length; r++) {
						for (var r = 0; r < cardInfo.columns.length; r++) {
							if (r == 0) {
								cardTemplateThis.getView().byId("column1").setSelectedKey(cardInfo.columns[r].COLUMN_NAME);
								var column1Obj = cardTemplateThis.getView().byId("column1").getSelectedItem().getBindingContext().getObject();
								column1Obj["customLabel"] = cardInfo.columns[0].customLabel;
							} else if (r == 1) {
								cardTemplateThis.getView().byId("column2").setSelectedKey(cardInfo.columns[r].COLUMN_NAME);
								var column2Obj = cardTemplateThis.getView().byId("column2").getSelectedItem().getBindingContext().getObject();
								column2Obj["customLabel"] = cardInfo.columns[1].customLabel;
							} else if (r == 2) {
								cardTemplateThis.getView().byId("column3").setSelectedKey(cardInfo.columns[r].COLUMN_NAME);
								var column3Obj = cardTemplateThis.getView().byId("column3").getSelectedItem().getBindingContext().getObject();
								column3Obj["customLabel"] = cardInfo.columns[2].customLabel;
							} else {
								cardTemplateThis.handleDynamicColumn(true, cardInfo.columns[r].COLUMN_NAME);
							}
						}
						/*	var selectField = cardTemplateThis.handleDynamicColumn(true);
						selectField.setSelectedKey(cardInfo.columns[r].property);*/
					}
				}
			} else {
				var measureItems = cardTemplateThis.getView().byId("measureId").getItems();
				for (var i = 0; i < measureArr.length; i++) {
					for (var j = 0; j < measureItems.length; j++) {
						var object = measureItems[j].getBindingContext().getObject();
						if (measureArr[i] == object.COLUMN_NAME || measureArr[i].toUpperCase() == object.COLUMN_NAME.toUpperCase() || measureArr[i].replace(
								"_", "").replace("_", "").toUpperCase() == object.COLUMN_NAME.replace("_", "").replace("_", "").toUpperCase()) {
							measureItems[j].setSelected(true);
							break;
						}
					}
				}
				var dimensionItems = cardTemplateThis.getView().byId("dimensionId").getItems();
				for (var v = 0; v < dimArr.length; v++) {
					for (var u = 0; u < dimensionItems.length; u++) {
						var object = dimensionItems[u].getBindingContext().getObject();
						if (dimArr[v] == object.COLUMN_NAME || dimArr[v].toUpperCase() == object.COLUMN_NAME.toUpperCase() || dimArr[v].replace(
								"_", "").replace("_", "").toUpperCase() == object.COLUMN_NAME.replace("_", "").replace("_", "").toUpperCase()) {
							dimensionItems[u].setSelected(true);
							break;
						}
					}
				}
			}
			for (var k = 0; k < masterListId2.getContent().length; k++) {
				var oContext = masterListId2.getContent()[k].getBindingContext();
				var cardTypeTemp = oContext.getModel().getObject(oContext.sPath).chartName;
				if (cardTypeTemp === chartType) {
					cardTemplateThis.setCardTypeBoxSelected(masterListId2.getContent()[k], cardTemplateThis);
					break;
				}
			}
			var filterModel = new sap.ui.model.json.JSONModel(cardInfo.filters);
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(filterModel);
			try {
				if (cardInfo.sorters != undefined) {
					cardTemplateThis.sortItems = cardInfo.sorters;
					cardTemplateThis.getView().byId("sortButtonId").setText(cardInfo.sorters[0].selectedSortItem);
				} else {
					cardTemplateThis.getView().byId("sortButtonId").setText("Select a Value");
				}
			} catch (e) {}

			cardTemplateThis.handleChangeCard(true);
		},
		setDataOnEdit2: function (cardInfo) {
			var chartType = cardInfo.cardType;
			var masterListId2 = cardTemplateThis.getView().byId("masterListId2");

			var measureArr = [];
			for (var i = 0; i < cardInfo.measures.length; i++) {
				measureArr.push(cardInfo.measures[i].property);
			}
			var measure1Arr = [];
			for (var j = 0; j < cardInfo.measures1.length; j++) {
				measure1Arr.push(cardInfo.measures1[j].property);
			}
			var dimArr = [];
			for (var k = 0; k < cardInfo.dimension.length; k++) {
				dimArr.push(cardInfo.dimension[k].property);
			}
			cardTemplateThis.getView().byId("measureId1").setSelectedKeys(measureArr);
			cardTemplateThis.getView().byId("measureId2").setSelectedKeys(measure1Arr);
			cardTemplateThis.getView().byId("commomdimensionId").setSelectedKeys(dimArr);
			for (var l = 0; l < masterListId2.getContent().length; l++) {
				var oContext = masterListId2.getContent()[l].getBindingContext();
				var cardTypeTemp = oContext.getModel().getObject(oContext.sPath).chartName;
				if (cardTypeTemp === chartType) {
					cardTemplateThis.setCardTypeBoxSelected(masterListId2.getContent()[l], cardTemplateThis);
					break;
				}
			}
			var filterModel = new sap.ui.model.json.JSONModel(cardInfo.filters);
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(filterModel);
		},
		onNvaigationValueHelpPress: function (evt) {
			cardTemplateThis.ValueHelpForNavigation.getContent()[0].to("typeOfNavigation");
			cardTemplateThis.ValueHelpForNavigation.openBy(evt.oSource);
		},
		onNavigationValueHelpItemPress: function (evt) {
			if (evt.oSource.getTitle() == "Reports") {
				var navigationUrl = "ReportConfigSet?$filter=TypeOfReport eq 'VIZCharts'";
				this.callServiceForNavigation(navigationUrl, false);
			} else if (evt.oSource.getTitle() == "Table") {
				var navigationUrl = "ReportConfigSet?$filter=TypeOfReport eq 'Table'";
				this.callServiceForNavigation(navigationUrl, false);
			} else if (evt.oSource.getTitle() == "Analytics") {
				//var navigationUrl = "ReportConfigSet";
				var navigationUrl = "OVPPageConfig?$filter=TypeOfPage eq 'A'"
				this.callServiceForNavigation(navigationUrl, true);
			}
		},
		callServiceForNavigation: function (navigationUrl, flag) {
			var baseUrl = Services.config.serviceConfig.destination + Services.config.serviceConfig.serviceUrl;
			Services.callService("NavigationModel", "NavigationModel", baseUrl + navigationUrl, "", "false", function (evt) {
				var oModel = sap.ui.getCore().getModel("NavigationModel");
				cardTemplateThis.ValueHelpForNavigation.getContent()[0].to("listOfNavigation");
				var list = cardTemplateThis.ValueHelpForNavigation.getContent()[0].getPages()[1].getContent()[0];
				if (flag) {
					list.bindItems({
						path: "/",
						template: new sap.m.StandardListItem({
							title: "{PageTitle}",
							type: "Active",
							press: function (evt) {
								cardTemplateThis.navigationListPress(evt);
							}
						}).addStyleClass("popOverItem")
					});
					cardTemplateThis.ValueHelpForNavigation.setModel(oModel);

				} else {
					var reportConfig = [];
					for (var m = 0; m < oModel.oData.length; m++) {
						try {
							var data = JSON.parse(decodeURIComponent(escape(window.atob(oModel.oData[m].RepConfig))))
							Object.assign(data, {
								"Page_Id": oModel.oData[m].PageId,
								"ReportId": oModel.oData[m].RepId
							});
							reportConfig.push(data);
						} catch (e) {

						}
					}
					var reportModel = new sap.ui.model.json.JSONModel(reportConfig);
					cardTemplateThis.ValueHelpForNavigation.setModel(reportModel);
					list.bindItems({
						path: "/",
						template: new sap.m.StandardListItem({
							title: "{reportTitle}",
							type: "Active",
							press: function (evt) {
								cardTemplateThis.navigationListPress(evt);
							}
						}).addStyleClass("popOverItem")
					});
				}
			}, "", "");
		},
		navigationListPress: function (evt) {
			cardTemplateThis.getView().byId("trgURLID").setValue(evt.oSource.getTitle());
			/*if (evt.oSource.getBindingContext().getObject().reportType) {
				
				evt.oSource.getBindingContext().getObject()["navTo"] = "Preview";
				evt.oSource.getBindingContext().getObject()["Page_ID"] = evt.oSource.getBindingContext().getObject()["PageId"];
			} else {
				evt.oSource.getBindingContext().getObject()["navTo"] = "Pana Viewer";
			}
			cardTemplateThis.navigationObj = evt.oSource.getBindingContext().getObject();*/
			var nav = {};
			if (evt.oSource.getBindingContext().getObject().ReportId) {
				nav["navTo"] = "Browser_Pana";
				nav["Report_ID"] = evt.oSource.getBindingContext().getObject().ReportId;
				nav["Page_ID"] = evt.oSource.getBindingContext().getObject().Page_Id;
			} else {
				nav["navTo"] = "Pana_Viewer";
				nav["Page_ID"] = evt.oSource.getBindingContext().getObject().Page_Id;
			}
			cardTemplateThis.navigationObj = nav;
			cardTemplateThis.ValueHelpForNavigation.close();
		},
		onLimitDataSelect: function (evt) {
			var isLimited = evt.oSource.getSelected();
			this.getView().byId("limitDataSet").setVisible(isLimited);
			this.getView().byId("limitDataSet").setValue(100);
		},
		handleShowSearchButton: function (evt) {
			cardTemplateThis.valueHelpRequestForBot.openBy(evt.oSource);
		},
		botCount: 0,
		onBotSend: function (evt) {

			var userText = evt.oSource.getValue();
			cardTemplateThis.valueHelpRequestForBot.getContent()[1].addItem(new sap.m.FeedListItem({
				sender: "Paul",
				icon: "sap-icon://employee-pane",
				senderPress: "onPress",
				iconPress: "onPress",
				timestamp: new Date().toLocaleString(),
				text: userText,
				convertLinksToAnchorTags: "All"
			}));
			if (userText.toUpperCase().indexOf("CREATE") > -1) {
				//Keywords for HANA Text Search from entiity extraction
				$.ajax({
					type: "POST",
					url: "https://language.googleapis.com/v1beta2/documents:analyzeEntities?key=AIzaSyDxY-GfjHC5RVcL4lKvqnqnAwCuPYh7fWY",
					dataType: 'json',
					contentType: "application/json",
					data: JSON.stringify({
						document: {
							type: "PLAIN_TEXT",
							content: userText.replace("create", "").replace("Create", "").replace("Card", "").replace("card", "")
						},
						encodingType: "UTF16"
					}),
					success: function (data) {
						//Keywords for HANA Text Search 
						var searchTextForHana = "";
						for (var i = 0; i < data.entities.length; i++) {
							searchTextForHana = searchTextForHana + " " + data.entities[i].name;
						}

						Services.callService("ChatBotModel", "ChatBotModel",
							"/textSearchForCard.xsjs?Search=" + searchTextForHana, "", "false",
							function (evt) {
								//cardTemplateThis.getView().byId("aiTitle").setText("Search results for: " + userName);
								var oModel = sap.ui.getCore().getModel("ChatBotModel");
								var cardInfoResults = oModel.oData.CARDCONFIG;
								var suggestionData = [];
								var botReply = "Here is the list of cards matching your request. Which one you would like to select?<br/>";
								var keys = Object.keys(cardInfoResults);
								for (var i = 0, j = 0; i < keys.length; i++) {
									try {

										var cardInfo = JSON.parse(decodeURIComponent(escape((cardInfoResults[keys[i]].Configuartion))));
										cardInfo.chartConfigId = cardInfoResults[keys[i]]["Config ID"];
										cardInfo.pageId = cardInfoResults[keys[i]]["Page ID"];
										botReply = botReply + (j + 1) + ") " + cardInfo.cardTitle + " " + cardInfo.cardSubtitle + ": " + cardInfo.dimension[0]
											.value +
											"/" + cardInfo.measures[0].value + "<br/>";
										suggestionData.push(cardInfo);
										j++;
									} catch (e) {

									}
								}
								if (keys.length <= 0) {
									botReply = "Did not find what you are looking for.<br/>";
								}
								cardTemplateThis.addBotReply(botReply);
								oModel.setData(suggestionData);
							});
					}
				});
			} else if (!isNaN(userText)) {
				if (typeof sap.ui.getCore().getModel("ChatBotModel") != "undefined" || sap.ui.getCore().getModel("ChatBotModel") != null) {
					cardTemplateThis.addBotReply("Do you want to add Filters?");
					cardTemplateThis.selectedCard = parseInt(userText);
				} else {
					cardTemplateThis.addBotReply("I do not understand. I can assist you in creating a card. Which card you want to create today?");
				}
			} else if (userText.toUpperCase().indexOf("YES") > -1) {
				cardTemplateThis.addBotReply("Feature coming up soon...");
			} else if (userText.toUpperCase().indexOf("NO") > -1) {
				cardTemplateThis.addBotReply("Generating your card.");
				try {
					var tempObject = sap.ui.getCore().getModel("ChatBotModel").oData[cardTemplateThis.selectedCard - 1];
					sap.ui.getCore().getModel("cardInfoModel").oData.d.results[0].CardConfiguration.results.push({
						Configuration: JSON.stringify(tempObject),
						Configid: tempObject.chartConfigId,
						isFromSuggestion: true
					});
				} catch (e) {
					var tempObject = {
						d: {
							results: [{
								CardConfiguration: {
									results: [{
										Configuration: JSON.stringify(tempObject),
										Configid: tempObject.chartConfigId,
										isFromSuggestion: true
									}]
								}
							}]
						}
					};
					sap.ui.getCore().getModel("cardInfoModel").setData(tempObject);
				}

				var bus = sap.ui.getCore().getEventBus();
				bus.publish("mainView", "toCardTemplate", {
					toggleBtn: false,
					chartConfigId: tempObject.chartConfigId + "",
					chartTitle: "",
					chartSubtitle: "",
					pageId: cardTemplateThis.pageId,
					isFromSuggestion: true,
					model: new sap.ui.model.json.JSONModel()
				});
				$("#" + cardTemplateThis.getView().byId("cardTemplateMainPage").sId).children().first().animate({
					scrollTop: $(document).height()
				}, 1000);
				evt.oSource.oParent.close();
			} else {
				cardTemplateThis.addBotReply("I do not understand. I can assist you in creating a card. Which card you want to create today?");
			}
			return;
			switch (this.botCount) {
			case 0:
				//it sucks to be here
				cardTemplateThis.valueHelpRequestForBot.getContent()[1].addItem(new sap.m.FeedListItem({
					sender: "Paul",
					icon: "sap-icon://employee-pane",
					senderPress: "onPress",
					iconPress: "onPress",
					timestamp: new Date().toLocaleString(),
					text: evt.oSource.getValue(),
					convertLinksToAnchorTags: "All"
				}));
				window.setTimeout(function (oSource) {
					oSource.oParent.getContent()[1].getItems()[2].setVisible(true);
				}, 1000, evt.oSource);
				break;
			case 1:
				//treats you like a slave
				evt.oSource.oParent.getContent()[1].getItems()[3].setVisible(true);
				window.setTimeout(function (oSource) {
					oSource.oParent.getContent()[1].getItems()[4].setVisible(true);
				}, 1000, evt.oSource);
				break;
			case 2:
				//i will talk to people i want to... and not randomly to anyone
				evt.oSource.oParent.getContent()[1].getItems()[5].setVisible(true);
				window.setTimeout(function (oSource) {
					oSource.oParent.getContent()[1].getItems()[6].setVisible(true);
				}, 1000, evt.oSource);
				break;
			case 3:
				//it's like i have no respect
				this.botCount++;
				evt.oSource.oParent.getContent()[1].getItems()[7].setVisible(true);
				window.setTimeout(function (oSource) {
					oSource.oParent.getContent()[1].getItems()[8].setVisible(true);
				}, 1000, evt.oSource);
				break;
			default:
				{
					evt.oSource.oParent.close();
					var userName = "ccdsadc create";

					if (userName.indexOf("create") >= 0 || userName.indexOf("Create") >= 0) {
						Services.callService("BotModel", "BotModel",
							"CardConfiguration(901555)", "", "false",
							function () {
								try {
									var object = sap.ui.getCore().getModel("BotModel").oData.d;
									sap.ui.getCore().getModel("cardInfoModel").oData.d.results[0].CardConfiguration.results.push({
										Configuration: object.Configuration,
										Configid: object.Configid,
										isFromSuggestion: true
									});
								} catch (e) {
									var tempObject = {
										d: {
											results: [{
												CardConfiguration: {
													results: [{
														Configuration: object.Configuration,
														Configid: object.Configid,
														isFromSuggestion: true
													}]
												}
											}]
										}
									};
									sap.ui.getCore().getModel("cardInfoModel").setData(tempObject);
								}

								var bus = sap.ui.getCore().getEventBus();
								bus.publish("mainView", "toCardTemplate", {
									toggleBtn: false,
									chartConfigId: object.Configid + "",
									chartTitle: "",
									chartSubtitle: "",
									pageId: cardTemplateThis.pageId,
									isFromSuggestion: true,
									model: new sap.ui.model.json.JSONModel()
								});
								$("#" + cardTemplateThis.getView().byId("cardTemplateMainPage").sId).children().first().animate({
									scrollTop: $(document).height()
								}, 1000);
							});
					}
				}

				break;
			}
			this.botCount++;
		},
		//to search the available charts from the list 
		onChartSearch: function (evt) {
			var aFilters = [];
			var sQuery = evt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("chartName", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			var list = this.getView().byId("masterListId2");
			var binding = list.getBinding("content");
			binding.filter(aFilters, "Application");
		},
		addBotReply: function (text) {
			cardTemplateThis.valueHelpRequestForBot.getContent()[1].addItem(new sap.m.FeedListItem({
				sender: "brevo",
				icon: "https://d30y9cdsu7xlg0.cloudfront.net/png/140730-200.png",
				senderPress: "onPress",
				iconPress: "onPress",
				timestamp: new Date().toLocaleString(),
				text: text,
				convertLinksToAnchorTags: "All"
			}));

		},
		setCardTypeBoxSelected: function (vBox, that) {
			vBox.addStyleClass("customChartSelectHoverColorSelected");
			var oObject = vBox.getBindingContext().getModel().getObject(vBox.getBindingContext().sPath);
			if (that.currentSelectedType) {
				that.currentSelectedType.oParent.removeStyleClass("customChartSelectHoverColorSelected");
				cardTemplateThis.getView().byId("menuItem5").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
				cardTemplateThis.getView().byId("menuItem5").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
			}
			cardTemplateThis.getView().byId("menuItem5").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
			cardTemplateThis.getView().byId("menuItem5").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			that.currentSelectedType = vBox.getItems()[1];
			that.onSelect(oObject.chartName);
			that.chartName = oObject.chartName;
			that.measureLen = oObject.measures;
			that.dimensionLen = oObject.dimensions;

			if (that.chartName == "Block Matrix" || that.chartName == "Vertical Floating Bars" || that.chartName == "Stacked Area" || that.chartName ==
				"Grouped Step Line" || that.chartName == "Bubble Ring") {
				var dummyModel = new sap.ui.model.json.JSONModel();
				//	this.getView().byId("filterTableID").setModel(dummyModel)
			}
			var predictionSupport = isPredictionSupported(that.chartName);
			that.getView().byId("isPredictiveEnabled").setEnabled(predictionSupport);

			previewCard.getView().getModel("chartType").setData({
				isChart: that.chartName === "table" ? false : true,
				predictionSupport: predictionSupport
			});
			// 		that.getView().byId("measureSettingsBtn").setVisible(Brevo.Brevo_V2.util.Formatter.isMeasureSettingVisible(that.chartName));

			that.handleSelectionChange();
		},
		onCarouselNext: function () {
			var carousel = this.getView().byId("carConfigWizard").nextStep();
		},
		onChartTypeSelected: function (e) {
			e.oSource.setSelected(!evt.oSource.getSelected())
		},
		stepActivate: function (evt) {
			if (evt.getParameters("index") != 1) {
				this.getView().byId("aiBox").setVisible(false);
				this.getView().byId("previewBox").setVisible(true);
			} else {
				this.getView().byId("aiBox").setVisible(true);
				this.getView().byId("previewBox").setVisible(false);
			}
		},
		backToMainPage: function (evt) {
			var app = MainApp.getView().byId("fioriContent");
			app.back();
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("fromCardTemplate", "toMain", {});
		},
		handleCancelBtn: function (evt) {
			if (this.isEditMode) {
				cardTemplateThis.pageCreated = false;
			} else {
				cardTemplateThis.pageCreated = true;
			}
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			// (sPreviousHash !== undefined) {
			//	window.history.go(-1);
			//} else {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Main", true);
			//}
			var bus = sap.ui.getCore().getEventBus();
			cardTemplateThis.removeContent();
			try {
				var cards = sap.ui.getCore().getModel("cardInfoModel").oData.d.results[0].CardConfiguration.results;
				/*	for (var i = 0; i < cards.length; i++) {
						if (cards[i].isFromSuggestion) {
							cards.splice(i, 1);
						}
					}*/
				for (var i = cards.length - 1; i >= 0; i--) {
					if (cards[i].isFromSuggestion) {
						cards.splice(i, 1);
					}
				}
			} catch (e) {

			}
			bus.publish("fromCardTemplate", "toMain", {
				fromCancel: true,
				pageCreated: cardTemplateThis.pageCreated
			});

		},
		getGroupHeader: function (oGroup) {
			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
		},
		handleSearch: function (evt) {
			var filters = [];
			var searchString = evt.oSource.getValue();
			var binding = this.getView().byId("masterListId").getBinding("items");
			if (searchString && searchString.length > 0) {
				var filterSupplierName = new sap.ui.model.Filter("chartName", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filterSupplierName);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else
				binding.filter([]);
		},
		// function to get the selected chart type
		onSelect: function (type) {
			var bus = sap.ui.getCore().getEventBus();
			cardTemplateThis.chartName = type;
			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			if (cardTemplateThis.chartName == "Table") {
				//cardTemplateThis.getView().byId("propertyLabel").setVisible(false);
				//cardTemplateThis.getView().byId("geomapId").setVisible(false);
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(false);
				cardTemplateThis.getView().byId("measurePanel").setVisible(false);
				cardTemplateThis.getView().byId("addColumnId").setVisible(true);
				cardTemplateThis.getView().byId("column1").setVisible(true);
				cardTemplateThis.getView().byId("column2").setVisible(true);
				cardTemplateThis.getView().byId("column3").setVisible(true);

			} else if (cardTemplateThis.chartName == "Geo Map") {
				//cardTemplateThis.getView().byId("propertyLabel").setVisible(true);
				//cardTemplateThis.getView().byId("geomapId").setVisible(true);
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
				cardTemplateThis.getView().byId("measurePanel").setVisible(true);
				cardTemplateThis.getView().byId("addColumnId").setVisible(false);
				cardTemplateThis.getView().byId("column1").setVisible(false);
				cardTemplateThis.getView().byId("column2").setVisible(false);
				cardTemplateThis.getView().byId("column3").setVisible(false);

			} else if (cardTemplateThis.chartName == "Heat Map" || cardTemplateThis.chartName == "Bullet" || cardTemplateThis.chartName ==
				"Waterfall" || cardTemplateThis.chartName == "Column Chart" || cardTemplateThis.chartName == "Stacked Column" ||
				cardTemplateThis.chartName ==
				"Scatter Chart" || cardTemplateThis.chartName == "Bubble Chart" || cardTemplateThis.chartName == "Line Chart" ||
				cardTemplateThis.chartName ==
				"Stacked Combination" || cardTemplateThis.chartName == "Donut Chart" || cardTemplateThis.chartName == "Bar Chart" ||
				cardTemplateThis
				.chartName == "Stacked Bar" || cardTemplateThis.chartName == "Pie Chart") {
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
				cardTemplateThis.getView().byId("measurePanel").setVisible(true);
				cardTemplateThis.getView().byId("addColumnId").setVisible(false);
				cardTemplateThis.getView().byId("column1").setVisible(false);
				cardTemplateThis.getView().byId("column2").setVisible(false);
				cardTemplateThis.getView().byId("column3").setVisible(false);
			} else {
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
				cardTemplateThis.getView().byId("measurePanel").setVisible(true);
				cardTemplateThis.getView().byId("addColumnId").setVisible(false);
				cardTemplateThis.getView().byId("column1").setVisible(false);
				cardTemplateThis.getView().byId("column2").setVisible(false);
				cardTemplateThis.getView().byId("column3").setVisible(false);
			}
		},
		handleToggleSecondaryContent: function (oEvent) {
			var oSplitContainer = this.getView().byId("mySplitContainer");
			oSplitContainer.setShowSecondaryContent(!oSplitContainer.getShowSecondaryContent());
		},
		onIntervalChange: function (evt) {
			var intervalValue = evt.oSource.getValue();
			var integerRegExp = /^[0-9]*$/;
			if (!intervalValue.match(integerRegExp)) {
				evt.oSource.setValue(evt.oSource._lastValue);
				sap.m.MessageToast.show("Please enter number value");
			}
		},
		//to close the popover of selecting filters 
		valueHelpCloseButton: function (evt) {
			//evt.oSource.oParent.close();
			// cardTemplateThis.valueHelpRequestForFilter.close();
			cardTemplateThis.valueHelpRequestForFilter.close();
		},
		//to navigate back to the popover of selecting filters popover from the selecting the filters value popover
		valueHelpCloseForFilterValues: function (evt) {
			cardTemplateThis.ValueHelpForFilterValues.close();
			cardTemplateThis.valueHelpRequestForFilter.openBy(cardTemplateThis.fragmentToOpen);
		},
		// To uplaod a new file
		valueHelpUploadButton: function (evt) {
			this.fileUploaded = true;
			this.serviceUrl = false;
			var that = this;
			// var source = evt.oSource;
			var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
			if (parsedDataFromExcelModel == undefined) {
				sap.m.MessageToast.show("Please Upload a Document");
			} else {

				var random = Math.round(Math.random() * 1000000) + "";
				//parsedDataFromExcelModel.oData.id = random;
				cardTemplateThis.displayExcel.setBusy(true);
				Services.callCreateService("FileUploader", JSON.stringify({
					fileName: parsedDataFromExcelModel.oData.id,
					data: parsedDataFromExcelModel.oData.data
				}), "POST", function (evt, isSuccess) {
					cardTemplateThis.displayExcel.setBusy(false);
					if (isSuccess) {
						var fileId = parsedDataFromExcelModel.oData.id;
						var columns = evt.columnData;
						var fileEntity = parsedDataFromExcelModel.oData.name;
						that.refreshFileTable();
						that.onExistingFileSelected(null, fileId);
						that.displayExcelTable(fileId, columns);
						// source.oParent.close();
					} else {
						sap.m.MessageToast.show("File upload failed");
						that.getView().byId("filtersId").setVisible(true);
						cardTemplateThis.ValueHelpForFiles.setBusy(false);
					}
				});
			}
		},
		handleFileUpdate: function (evt) {
			var that = this;
			var model = this.displayExcel.getModel();
			var method = "PUT";
			Services.callCreateService("FileUploader", JSON.stringify({
				fileName: model.oData.fileName,
				COLUMN_DET: model.oData.COLUMN_DET
			}), method, function (evt, isSuccess) {
				if (isSuccess) {
					that.displayExcel.close();
					var fileId = model.oData.fileName;
					that.refreshFileTable();
					that.onExistingFileSelected(null, fileId);
				} else {
					that.displayExcel.close();
					sap.m.MessageToast.show("File Update failed");
				}
			});
		},

		onnavBackButton: function (evt) {

			evt.oSource.oParent.to("typeOfNavigation");
		},
		onValueHelpRequestForDataSrc: function () {
			cardTemplateThis.ValueHelpForDataSrc.open();
		},
		onValueHelpRequestForServices: function () {
			if (cardTemplateThis.getView().byId("srcId").getValue().length <= 0) {
				sap.m.MessageToast.show("Please select a system source to load data..");
			} else {
				cardTemplateThis.ValueHelpForServiceUrl.open();
			}
		},
		//to close the popover the excel file selected
		valueHelpCloseButtonForExcel: function () {
			cardTemplateThis.ValueHelpForFiles.close();
		},
		//to close the popover of the table format excel data 
		valueHelpCloseButtonForExcelDisplay: function () {
			cardTemplateThis.displayExcel.close();
		},
		// Dialog box for file upload
		onValueHelpRequestForFiles: function (evt) {
			var that = this;
			//	if (this.chartName.length > 0) {
			//$.getScript("https://apis.google.com/js/api.js?onload=handleClientLoad");
			cardTemplateThis.ValueHelpForFiles.openBy(evt);
			cardTemplateThis.ValueHelpForFiles.setBusyIndicatorDelay(1);
			cardTemplateThis.ValueHelpForFiles.setBusy(true);
			window.setTimeout(function () {
				cardTemplateThis.ValueHelpForFiles.setBusy(false);
				var drop = document.getElementById(cardTemplateThis.ValueHelpForFiles.getContent()[0].sId);
				if (drop.addEventListener) {
					drop.addEventListener('dragenter', handleDragover, false);
					drop.addEventListener('dragover', handleDragover, false);
					drop.addEventListener('drop', function (e) {
						e.stopPropagation();
						e.preventDefault();
						var files = e.dataTransfer.files;
						var f = files[0];
						var name = f.name;
						cardTemplateThis.ValueHelpForFiles.getContent()[0].getItems()[0].setText(name);
						handleDrop(files, that.onFileRead, that);
					}, false);
				}
			}, 1500);
			this.refreshFileTable();

			//	} else sap.m.MessageToast.show("Please select type of Chart");
		},
		setFileNameForGoogleFile: function (name, results) {
			cardTemplateThis.ValueHelpForFiles.getContent()[0].getItems()[0].setText(name);
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
			parsedDataFromExcelModel.setData({
				name: results[0].name.split(".")[0],
				id: name.split(".")[0],
				data: (results[0].data),
				properties: results[0].properties
			});
			sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
		},
		// refresh file table
		refreshFileTable: function (callback) {
			// 
			Services.callService("FileUploadModel", "FileUpload", Services.config.metadataUrls.Files.list, "", true,
				function (evt) {
					var fileUploadModel = sap.ui.getCore().getModel("FileUploadModel");
					if (cardTemplateThis.ValueHelpForFiles) {
						cardTemplateThis.ValueHelpForFiles.getContent()[3].setModel(fileUploadModel);
						cardTemplateThis.ValueHelpForFiles.getContent()[0].focus();
					}
					if (callback)
						callback();
				}, "", "");
		},
		handleFileSearch: function (evt) {
			var search = evt.getSource().getValue();
			var binding = cardTemplateThis.ValueHelpForFiles.getContent()[3].getItems()[0].getBinding("items")
			if (search.length > 0)
				binding.filter([new sap.ui.model.Filter("FileName", "Contains", search)]);
			else binding.filter([]);
		},
		// To browse a new excel file
		onFileUploaderOnSelectChanged: function (e) {
			var that = this;
			var files = e.getParameters().files;
			var f = files[0];
			var name = f.name;
			cardTemplateThis.ValueHelpForFiles.getContent()[0].getItems()[0].setText(name);
			handleDrop(files, that.onFileRead, that);
		},
		// to download a sample excel file, the format of excel file
		// uploaded should be similar to the below file
		downloadSampleExcel: function () {
			initClient();
			//window.open(jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/model/SampleExcel.xlsx");
		},
		// to toogle edit/save mode of the table: To delete any
		// existing files
		editModeExcelTable: function (evt) {
			if (evt.oSource.getIcon() == "sap-icon://edit") {
				evt.oSource.oParent.oParent.setMode("Delete");
				evt.oSource.setIcon("sap-icon://accept")
			} else {
				evt.oSource.oParent.oParent.setMode("SingleSelectMaster");
				evt.oSource.setIcon("sap-icon://edit")
			}
		},
		// trigger file delete service
		handleFileDelete: function (evt) {
			var that = this;
			var context = evt.getParameters().listItem.getBindingContext();
			var fileId = context.getObject().FileName;
			var FileUpload = "FileUploader.xsjs?FileName=" + fileId;

			Services.callDeleteService(FileUpload, "", function (evt, sucessFlag, oError) {
				var fileData = sap.ui.getCore().getModel("parsedDataFromExcelModel");
				if (fileData) {
					var fileName = fileData.oData.id;
					if (fileName == fileId) {
						that.getView().byId("fileId").setValueState("Error");
						that.getView().byId("serviceURLId").setValueState("Error");
						that.getView().byId("fileId").setValue();
						that.getView().byId("serviceURLId").setValue();
						that.getView().byId("entityId").setValue();
						cardTemplateThis.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
						cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
						that.removeExistingData();
					}
				}
				that.refreshFileTable();
			});
		},
		// on switching on/off Prediction
		onPredictionOnOff: function (evt) {
			var state = evt.oSource.getState();
			var predictionForm = this.getView().byId("predictionForm");
			var content = predictionForm.getContent();
			if (state) {
				previewCard.getView().byId("predictionControlBox").setVisible(state);
			} else {
				previewCard.getView().byId("predictionControlBox").setVisible(state);
			}
			for (var i = 0; i < content.length; i++) {
				try {
					content[i].setEnabled(state);
				} catch (e) {}
			}
		},
		// Loading the data through service URL
		onServiceUrlChanged: function (isEditMode, callBack) {
			var that = this;
			var serviceUrl = this.getView().byId("fileId").getText().trim();
			var destination = this.getView().byId("destinationId").getText().trim();
			this.fileUploaded = false;
			var serviceUrl = this.getView().byId("fileId").getText().trim().replace("Express", "").replace("//", "/").replace("//", "/").replace(
				"//", "/");
			this.newUrl = destination + serviceUrl;
			this.newUrl.trim();
			if (this.newUrl.indexOf("mock") > -1) {
				jQuery.sap.require("sap.ui.core.util.MockServer");
				var oMockServer = new sap.ui.core.util.MockServer({
					rootUri: "mocklink/"
				});
				this._oMockServer = oMockServer;
				oMockServer.simulate(jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/model/metadata.xml", jQuery.sap.getModulePath(
						"Brevo.Brevo_V2") +
					"/model/");
				oMockServer.start();
				this.newUrl = "mocklink";
			}
			if (Services.config.isMongo) {
				Services.read("Metadata", Services.config.metadataUrls.Data.list, {
					finishMethod: function (evt) {
						// 			that.getView().byId("filtersId").setVisible(true);
						that.getView().byId("entityId").setValue();
						cardTemplateThis.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
						cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
						that.getView().byId("entityId").setShowValueHelp(true);
						if (!isEditMode)
							that.onValueHelpRequestForEntity();
						that.removeExistingData();
						that.fileUploaded = false; {
							// check if service url changed by user.
							if (isEditMode) {
								that.fetchMeasuresFromEditData = true;
							} else {
								that.fetchMeasuresFromEditData = false;
							}
							if (callBack && typeof callBack === "function") {
								callBack();
							}
						}
					}
				});
			} else {
				this.oDataModel = new sap.ui.model.odata.ODataModel(this.newUrl, true);
				var oDataModelMetadata = this.oDataModel.getServiceMetadata();
				this.oDataModel.attachMetadataFailed(function (e) {
					sap.m.InstanceManager.closeAllDialogs();
					sap.m.MessageBox.error("Service Url invalid; " + e.mParameters.statusCode + ": " + e.mParameters.statusText);
					that.removeExistingData();
					that.handleSelectionChange();
					return false;
				});
				this.oDataModel.attachMetadataLoaded(function () {
					// 			that.getView().byId("filtersId").setVisible(true);
					that.getView().byId("entityId").setValue();
					cardTemplateThis.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
					cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
					that.getView().byId("entityId").setShowValueHelp(true);
					if (!isEditMode)
						that.onValueHelpRequestForEntity();
					that.removeExistingData();
					that.fileUploaded = false; {
						// check if service url changed by user.
						if (isEditMode) {
							that.fetchMeasuresFromEditData = true;
						} else {
							that.fetchMeasuresFromEditData = false;
						}
						if (callBack && typeof callBack === "function") {
							callBack();
						}
					}
				});
			}
		},
		getFileMetadata: function (datasource, fileId, callBack) {
			fileId = fileId.replace(" ", "_").replace(" ", "_");
			var url = Services.config.metadataUrls.FileData.metadata;
			if (datasource == "Brevo")
				url = Services.config.metadataUrls.Data.metadata;
			Services.read("Metadata", url + fileId, {
				finishMethod: function (evt) {
					callBack(sap.ui.getCore().getModel("Metadata"));
				}
			});
		},
		buildMeasureDimensionModel: function (object) {
			var measures = [];
			var dimension = [];
			if (object.COLUMN_DET) {
				for (var i = 0; i < object.COLUMN_DET.length; i++) {
					object.COLUMN_DET[i].COLUMN_NAME = object.COLUMN_DET[i].COLUMN_NAME;
					object.COLUMN_DET[i].LABEL = object.COLUMN_DET[i].LABEL;
					//object.COLUMN_DET[i].name = object.COLUMN_DET[i].COLUMN_NAME;
					if (object.COLUMN_DET[i].TYPE == "DIMENSION") {
						dimension.push(object.COLUMN_DET[i]);
					} else {
						measures.push(object.COLUMN_DET[i]);
					}
				}
				object.measures = measures;
				object.dimensions = dimension;
				object.properties = measures.concat(dimension);
			}
			return object;
		},
		getFileData: function (dataSource, fileId, callBack) {
			var url = Services.config.metadataUrls.FileData.url;
			if (dataSource == "Brevo")
				url = Services.config.metadataUrls.Data.url;
			var fileUrl = url + fileId + "&$top=100";
			Services.callService("FileDataModel", "FileUpload", fileUrl, "", true, function (evt) {
				if (sap.ui.getCore().getModel("FileDataModel").getData().length > 0)
					callBack(sap.ui.getCore().getModel("FileDataModel"));
				else {
					sap.m.MessageToast("No data exist");
				}
			}, "", "");
		},
		onExistingDataSelected: function (evt) {
			var object = evt.getSource().getSelectedItem().getBindingContext().getObject()
			var fileId = object.TABLE_NAME ? object.TABLE_NAME : object.name;
			this.onExistingFileSelected(null, fileId);
		},
		// Select an existing file
		onExistingFileSelected: function (evt, fileName, callback) {
			var that = this;
			var fileId = fileName;
			if (evt) {
				that.getView().byId("setfileIdText").setText("Spreedsheet");
				var object = evt.getSource().getSelectedItem().getBindingContext().getObject()
				fileId = object.TABLE_NAME ? object.TABLE_NAME : object.name;
			}
			var dataSource = that.getView().byId("setfileIdText").getText();
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
			sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
			parsedDataFromExcelModel.setSizeLimit(9999999);

			cardTemplateThis.ValueHelpForFiles.setBusy(true);
			this.getFileMetadata(dataSource, fileId, function (model) {
				var object = model.getData();
				var object = that.buildMeasureDimensionModel(object);
				parsedDataFromExcelModel.setData(object);
				parsedDataFromExcelModel.setProperty("/name", fileId);
				parsedDataFromExcelModel.setProperty("/id", fileId);
				that.fileUploaded = true;
				that.removeExistingData();
				if (that.ValueHelpForFiles)
					that.ValueHelpForFiles.close();
				that.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				that.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				that.getFileData(dataSource, fileId, function (model) {
					that.ValueHelpForFiles.setBusy(false);
					parsedDataFromExcelModel.setProperty("/data", model.getData());
					var cardTitleStr = that.getView().byId("cardTitleId").getValue();
					var cardSubTitleStr = that.getView().byId("cardSubTitleId").getValue();
					that.setMeasuresAndDimensionsForEnity(fileId);
					that.refreshPreviewCard(cardTitleStr, cardSubTitleStr, that.chartName, []);
					if (callback) callback();
				});
			});

			that.getView().byId("fileId").setText(fileId)
			that.getView().byId("entityId").setValue(fileId);

			try {
				that.getView().byId("entityId").setShowValueHelp(false);
			} catch (e) {
				console.log(e);
				sap.m.MessageBox.error("Error downloading file");
			}
		},
		// To Read the content from the browsed file
		onFileRead: function (binaryData, parsedData, that) {
			// var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
			// parsedDataFromExcelModel.setSizeLimit(9999999);
			// parsedDataFromExcelModel.setData({
			// 	name: parsedData[0].name,
			// 	data: (parsedData[0].data),
			// 	id: cardTemplateThis.ValueHelpForFiles.getContent()[0].getItems()[0].getText().split(".")[0],
			// 	properties: (parsedData[0].properties)
			// });
			// sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
			parsedDataFromExcelModel.setData({
				id: cardTemplateThis.ValueHelpForFiles.getContent()[0].getItems()[0].getText().split(".")[0],
				data: (parsedData)
			});
			sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
			cardTemplateThis.ValueHelpForFiles.close();
			cardTemplateThis.valueHelpUploadButton();

		},
		displayExcelTable: function (fileName, tableColumns) {
			// var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel(tableColumns);
			parsedDataFromExcelModel.setData({
				fileName: fileName,
				COLUMN_DET: tableColumns
			});
			cardTemplateThis.displayExcel.open();
			// var arr = [];
			// arr = Object.keys(tableColumns[0]);
			// for (var i = 0; i < parsedDataFromExcelModel.oData.properties.length; i++) {
			// arr.push({
			// 	name: parsedDataFromExcelModel.oData.properties[i].name
			// });
			// }
			// var industry = new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("Brevo/Brevo_V2") + "/model/ExcelCategories.json");
			// cardTemplateThis.displayExcel.getContent()[1].setModel(industry);
			// var gTable = cardTemplateThis.displayExcel.getContent();
			// var gridTable = gTable[2];
			// gridTable.removeAllColumns();
			// for (var i = 0; i < arr.length; i++) {
			// 	gridTable.addColumn(new sap.ui.table.Column({
			// 		sortProperty: arr[i],
			// 		filterProperty: arr[i],
			// 		defaultFilterOperator: "Contains",
			// 		width: '10rem',
			// 		label: new sap.m.Label({
			// 			text: arr[i]
			// 		}),
			// 		template: new sap.m.Input({
			// 			value: "{" + arr[i] + "}",
			// 			editable: true
			// 		})
			// 	}));
			// }
			// gridTable.addColumn(new sap.ui.table.Column({
			// 	// 			width: '3rem',
			// 	template: new sap.ui.core.Icon({
			// 		src: 'sap-icon://delete',
			// 		color: 'white',
			// 		press: cardTemplateThis.onTableRowDelete
			// 	})
			// }));
			cardTemplateThis.displayExcel.setModel(parsedDataFromExcelModel);
			console.log(parsedDataFromExcelModel);
			// gridTable.bindRows({
			// 	path: '/COLUMN_DET',
			// 	sorter: {
			// 		path: arr[0],
			// 		descending: false,
			// 		group: true
			// 	},
			// 	groupHeaderFactory: function (oGroup) {
			// 		return new GroupHeaderListItem({
			// 			title: oGroup.key,
			// 			upperCase: false
			// 		});
			// 	}
			// });
		},
		onTableRowDelete: function (evt) {
			// var that = this;
			var objModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
			var obj = evt.oSource.getBindingContext().getObject();
			var sPath = evt.oSource.getBindingContext().sPath.split("/")[2];
			objModel.oData.data.splice(sPath, 1);
			objModel.updateBindings(true);
			console.log(sap.ui.getCore().getModel("parsedDataFromExcelModel"))
		},
		// Dialog to select the entity
		onValueHelpRequestForEntity: function (evt) {
			var dataValue = this.getView().byId("fileId").getText();
			if (dataValue.length > 0) {
				this.currentValueField = this.getView().byId("entityId");
				var datasrc = this.getView().byId("fileId").getText();
				if (datasrc.length > 0) {
					if (this.fileUploaded == false) {
						if (Services.config.isMongo) {
							this.entityList = sap.ui.getCore().getModel("Metadata").getData().Views;
						} else {
							var oDataModelMetadata = this.oDataModel.getServiceMetadata();
							this.entityList = oDataModelMetadata.dataServices.schema[0].entityType;
						}
					} else {
						var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
						this.entityList = parsedDataFromExcelModel.oData.data;
					}
					var entityModel = new sap.ui.model.json.JSONModel(this.entityList);
					sap.ui.getCore().setModel(entityModel, "entityModel");
					cardTemplateThis.valueHelpRequestForEntity.setModel(sap.ui.getCore().getModel("entityModel"));
					cardTemplateThis.valueHelpRequestForEntity.openBy(this.getView().byId("entityId"));
				} else sap.m.MessageToast.show("Please select data records");
			} else {
				sap.m.MessageToast.show("Please select data source");
			}
		},
		// Selected service URL from dialog box
		valueHelpItemSelectionServiceUrl: function (evt) {
			this.getView().byId("serviceURLId").setValue(evt.oSource.getIntro());
			cardTemplateThis.ValueHelpForServiceUrl.close();
			this.onServiceUrlChanged();
		},
		handleServiceFilterSearch: function (evt) {
			var filters = [];
			var searchString = evt.oSource.getValue();
			var binding = evt.oSource.oParent.getContent()[1].getBinding("items");
			if (searchString && searchString.length > 0) {
				var filter1 = new sap.ui.model.Filter("CatNam", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter1);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else {
				binding.filter([]);
			}
		},
		handleDataSrcSearch: function (evt) {
			var filters = [];
			var searchString = evt.oSource.getValue();
			var binding = evt.oSource.oParent.getContent()[1].getBinding("items");
			if (searchString && searchString.length > 0) {
				var filter1 = new sap.ui.model.Filter("RfcName", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter1);
				var filter2 = new sap.ui.model.Filter("RfcDescr", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter2);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else {
				binding.filter([]);
			}
		},
		handleDataSrcConfirm: function (evt) {
			var value = evt.mParameters.selectedItem.getTitle();
			cardTemplateThis.getView().byId("srcId").setValue(value);
			cardTemplateThis.dataSrcSystem = cardTemplateThis.getView().byId("srcId").getValue();
			cardTemplateThis.getView().byId("srcId").setValueState("Success");
			evt.getSource().getBinding("items").filter([]);
			cardTemplateThis.busyDialog.open();

			// url -->
			// ;mo/CatalogsSet?$expand=QueryInfoSet&$filter=SAP__Origin
			// eq 'SQWCLNT700'
			Services.callService("dataSrcSystem", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/neo-app.json",
				";mo/CatalogsSet?$expand=QueryInfoSet&$filter=SAP__Origin eq '" + cardTemplateThis.dataSrcSystem + "'", "removeSericeURL",
				"false",
				function (evt) {
					cardTemplateThis.busyDialog.close();
					var model = sap.ui.getCore().getModel("dataSrcSystem");
					cardTemplateThis.ValueHelpForServiceUrl.setModel(model);
					// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
				});
		},
		handleNavListItemSelect: function (evt) {
			var selectedItem = evt.oSource.getTitle();
			if (selectedItem == "Finance") {

				this.getView().byId("fileId").setText("/sap/opu/odata/sap/ZOVP_BUILDER_FINANCE_SRV/");
				this.getView().byId("setfileIdText").setText("Finance");
			} else if (selectedItem == "Brevo") {
				this.getView().byId("fileId").setText("Brevo");
				this.getView().byId("setfileIdText").setText("Brevo");
				this.getView().byId("destinationId").setText(Services.config.serviceConfig.destinationPi);
			} else if (selectedItem == "Hana Express") {
				this.getView().byId("fileId").setText("/SalesForecast/Sales.xsodata/");
				this.getView().byId("setfileIdText").setText("Express");
				this.getView().byId("destinationId").setText(Services.config.serviceConfig.destination);
			} else if (selectedItem == "Sugar CRM") {
				this.getView().byId("fileId").setText("/sugar_odata/index.php/OdataNew/odata?database=sugarcrm");
				this.getView().byId("setfileIdText").setText("Sugar CRM");
			} else if (selectedItem == "Tiebs") {
				this.getView().byId("fileId").setText("/sugar_odata/index.php/OdataNew/odata?database=tiebs_service");
				this.getView().byId("setfileIdText").setText("Tiebs");
			} else if (selectedItem == "Sales Details") {
				this.getView().byId("fileId").setText("/Car/car.xsodata/");
				this.getView().byId("setfileIdText").setText("Sales Details");
			} else if (selectedItem == "Compliants") {
				this.getView().byId("fileId").setText("/Complaints/Complaints.xsodata/");
				this.getView().byId("setfileIdText").setText("Compliants");
			} else if (selectedItem == "Covid") {
				this.getView().byId("fileId").setText("/COVID/COVID.xsodata");
				this.getView().byId("setfileIdText").setText(selectedItem);
				this.getView().byId("destinationId").setText(Services.config.serviceConfig.destination);
			}
			cardTemplateThis.ValueHelpForDataRecords.close();
			this.onServiceUrlChanged();

		},
		//to close popover of selecting the data records
		valueHelpCloseButtonForDataRecords: function () {
			cardTemplateThis.ValueHelpForDataRecords.close();
		},
		//to close popover of selecting the entity from the selected data records
		valueHelpCloseButtonForEntity: function () {
			cardTemplateThis.valueHelpRequestForEntity.close();
		},
		// Event called on selecting a particular entity set
		valueHelpItemSelectionEntity: function (evt) {
			var value = evt.oSource.getTitle();
			this.getView().byId("entityId").setValue(value);
			cardTemplateThis.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
			cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			this.loadDataToModelForServiceUrl();

		},
		onMeasuresSettingsPress: function (evt) {
			this.selected = evt.oSource.oParent.getContent()[0].getText();
			var oModel = new sap.ui.model.json.JSONModel();
			var settingsData = [];
			var selectedMeasures = this.getView().byId("measureId").getSelectedItems();
			for (var i = 0; i < selectedMeasures.length; i++) {
				var tempObject = selectedMeasures[i].getBindingContext().getObject();
				if (!this.fetchMeasuresFromEditData) {
					tempObject.measureType = DrawVizChart.getDefaultMeasureSetting(cardTemplateThis.chartName, i);
				} else {
					for (var j = 0; j < cardTemplateThis.cardInfo.measures.length; j++) {
						if (tempObject.property == cardTemplateThis.cardInfo.measures[j].COLUMN_NAME) {
							tempObject.measureType = cardTemplateThis.cardInfo.measures[j].measureType;
							break;
						}
					}
					if (j >= cardTemplateThis.cardInfo.measures.length)
						tempObject.measureType = DrawVizChart.getDefaultMeasureSetting(cardTemplateThis.chartName, i);
				}
				settingsData.push(tempObject);
			}
			oModel.setData(settingsData);
			cardTemplateThis.ValueHelpForMeasureChartTypeSelection.setModel(oModel);
			this.ValueHelpForMeasureChartTypeSelection.open();
		},

		onMeasureSettingsOkPress: function (evt) {
			this.fetchMeasuresFromEditData = false;
			evt.oSource.oParent.close();
			cardTemplateThis.selectedMeasureType = [];
			var items = evt.oSource.oParent.getContent()[0].getItems();
			for (var i = 0; i < items.length; i++) {
				var tempObject = items[0].getBindingContext().oModel.getObject(items[i].getBindingContext().sPath);
				tempObject.measureType = items[0].getCells()[1].getSelectedKey()
			}
			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, cardTemplateThis.chartName);
		},
		setMeasuresAndDimensionsForEnity: function (value) {
			var propArr = [];
			var that = this;
			var dimensionArray = [];
			var measureArray = [];
			var newArray = [];
			var propertiesModel = new sap.ui.model.json.JSONModel();
			var measureModel = new sap.ui.model.json.JSONModel();
			var dimensionModel = new sap.ui.model.json.JSONModel();
			var model = new sap.ui.model.json.JSONModel();
			this.getView().byId("entityId").setValue(value);
			cardTemplateThis.sortItems = undefined;
			cardTemplateThis.getView().byId("menuItem4").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
			cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			var entity = value;
			if (this.fileUploaded == false) {
				var serviceUrl = this.getView().byId("destinationId").getText().trim() + this.getView().byId("fileId").getText().trim();
				if (serviceUrl.length > 0 && entity.length > 0) {
					var oDataModelMetadata = this.oDataModel.getServiceMetadata();
					var entityList = oDataModelMetadata.dataServices.schema[0].entityType;
					for (var i = 0; i < entityList.length; i++) {
						if (entity.indexOf(entityList[i].name) > -1) {

							propertiesModel.setData(entityList[i].property);
							try {
								//	if(entityList[i].property.length>1){
								//	propertiesModel.setData(entityList[i].property[1]);	
								//}
							} catch (e) {
								//		propertiesModel.setData(entityList[i].property);
								console.log(e);
							}
							break;
						}
					}
				}
				for (var i = 0; i < propertiesModel.oData.length; i++) {
					for (var j = 0; j < propertiesModel.oData[i].extensions.length; j++) {
						if (propertiesModel.oData[i].extensions[j].name == "label") {
							propertiesModel.oData[i].extensions[j].property = propertiesModel.oData[i].name;
							newArray.push(propertiesModel.oData[i].extensions[j]);
							for (var k = 0; k < propertiesModel.oData[i].extensions.length; k++) {
								if (propertiesModel.oData[i].extensions[k].value == "dimension") {
									dimensionArray.push(propertiesModel.oData[i].extensions[j]);
								} else if (propertiesModel.oData[i].extensions[k].value == "measure") {
									propertiesModel.oData[i].extensions[j].measureSettings = Brevo.Brevo_V2.util.Formatter.measureSettingsValue(this.chartName);
									measureArray.push(propertiesModel.oData[i].extensions[j]);
								}
							}
						}
					}
				}
				measureModel.setData(measureArray);
				dimensionModel.setData(dimensionArray);
				model.setData(newArray);
				sap.ui.getCore().setModel(model, "labelModel");
				if (cardTemplateThis.getView().byId("addColumnId").getItems().length > 2) {
					for (var m = (cardTemplateThis.getView().byId("addColumnId").getItems().length - 1); m > 2; m--) {
						if (cardTemplateThis.getView().byId("addColumnId").getItems()[m].sId.indexOf("cardTemplate") == -1)
							cardTemplateThis.getView().byId("addColumnId").removeItem(m);
						cardTemplateThis.columnNumber = 4;
					}
				}
				that.getView().byId("column1").setModel(model);
				that.getView().byId("column2").setModel(model);
				that.getView().byId("column3").setModel(model);
				/*that.getView().byId("geomapId").setModel(model);*/
				that.getView().byId("measureId").setModel(measureModel);
				that.getView().byId("dimensionId").setModel(dimensionModel);
				cardTemplateThis.ValueHelpForDimensionsTypeSelection.setModel(measureModel);
			} else {
				var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
				that.entitySetDataModel = new sap.ui.model.json.JSONModel();
				that.entitySetDataModel.setData({
					d: {
						results: parsedDataFromExcelModel.oData.data
					}
				});
				if (parsedDataFromExcelModel.oData.measures)
					measureModel.setData(parsedDataFromExcelModel.oData.measures);
				else
					measureModel.setData(parsedDataFromExcelModel.oData.properties);
				if (parsedDataFromExcelModel.oData.dimensions)
					dimensionModel.setData(parsedDataFromExcelModel.oData.dimensions);
				else
					dimensionModel.setData(parsedDataFromExcelModel.oData.properties);
				propertiesModel.setData(parsedDataFromExcelModel.oData.properties);
				sap.ui.getCore().setModel(propertiesModel, "propertiesModel");
				if (cardTemplateThis.getView().byId("addColumnId").getItems().length > 2) {
					for (var m = (cardTemplateThis.getView().byId("addColumnId").getItems().length - 1); m > 2; m--) {
						if (cardTemplateThis.getView().byId("addColumnId").getItems()[m].sId.indexOf("cardTemplate") == -1)
							cardTemplateThis.getView().byId("addColumnId").removeItem(m);
						cardTemplateThis.columnNumber = 4;
					}
				}
				that.getView().byId("column1").setModel(sap.ui.getCore().getModel("propertiesModel"));
				that.getView().byId("column2").setModel(sap.ui.getCore().getModel("propertiesModel"));
				that.getView().byId("column3").setModel(sap.ui.getCore().getModel("propertiesModel"));
				/*	that.getView().byId("geomapId").setModel(sap.ui.getCore().getModel("propertiesModel"));*/
				that.getView().byId("measureId").setModel(measureModel);
				that.getView().byId("dimensionId").setModel(dimensionModel);
			}
			var dummyModel = new sap.ui.model.json.JSONModel([]);
			//cardTemplateThis.getView().byId("filterTableID").setModel(dummyModel);
			cardTemplateThis.getView().byId("sortButtonId").setText("Select a Value");
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(dummyModel);
			cardTemplateThis.valueHelpRequestForFilter.setModel(dummyModel);
			this.valueHelpRequestForEntity.close();
		},
		// loading entity set data
		loadDataToModelForServiceUrl: function (evt) {
			//var serviceUrl = this.newUrl;
			var that = this;
			var entity = this.getView().byId("entityId").getValue().trim();
			var serviceUrl = this.getView().byId("destinationId").getText() + this.getView().byId("fileId").getText();
			var isDataSetLimited = this.getView().byId("isDataSetLimited").getSelected();
			var dataSetLimit = 100;
			var getEntityDataUrl = "";
			if (isDataSetLimited)
				dataSetLimit = this.getView().byId("limitDataSet").getValue();
			if (serviceUrl.length > 0 && entity.length > 0) {
				if (Services.config.isMongo) {
					this.fileUploaded = true;
					getEntityDataUrl = Services.config.metadataUrls.Data.url + entity + "&$format=json&$top=" + dataSetLimit;
					Services.read("ViewMetadata", Services.config.metadataUrls.Data.metadata + entity, {
						finishMethod: function (evt) {
							that.setMeasuresAndDimensionsForEnity(entity);
						}
					});
				} else {
					var oDataModelMetadata = this.oDataModel.getServiceMetadata();
					var schemaLength = oDataModelMetadata.dataServices.schema.length;
					if (schemaLength >= 1) {
						for (var k = (schemaLength - 1); k >= 0; k--) {
							var entityCont = oDataModelMetadata.dataServices.schema[k].entityContainer;
							var entitySetList = entityCont[0].entitySet;
							for (var i = 0; i < entitySetList.length; i++) {
								if (entitySetList[i].entityType.endsWith(entity)) {
									cardTemplateThis.entitySetRequired = entitySetList[i].name;
									mainEntitySet = cardTemplateThis.entitySetRequired;
									//var getEntityDataUrl = this.newUrl + "/" + cardTemplateThis.entitySetRequired + "?$format=json&$top=50";
									var getEntityDataUrl = serviceUrl + "/" + cardTemplateThis.entitySetRequired + "?$format=json&$top=" + dataSetLimit
									getEntityDataUrl.trim();
									break;
								}
							}
							break;
						}
					}
					if (schemaLength == 1) {
						var entityCont = oDataModelMetadata.dataServices.schema[0].entityContainer;
						var entitySetList = entityCont[0].entitySet;
						for (var i = 0; i < entitySetList.length; i++) {
							if (entitySetList[i].entityType.endsWith(entity)) {
								cardTemplateThis.entitySetRequired = entitySetList[i].name;
								mainEntitySet = cardTemplateThis.entitySetRequired;
								//var getEntityDataUrl = this.newUrl + "/" + cardTemplateThis.entitySetRequired + "?$format=json&$top=50";
								var getEntityDataUrl = serviceUrl + "/" + cardTemplateThis.entitySetRequired + "?$format=json&$top=" + dataSetLimit
								getEntityDataUrl.trim();
								break;
							}
						}
					}
				}
				cardTemplateThis.getView().setBusy(true);
				this.entitySetDataModel = new sap.ui.model.json.JSONModel(getEntityDataUrl, {
					bAsync: false
				});
				this.entitySetDataModel.attachRequestCompleted(function (oEv) {
					oEv.oSource.mEventRegistry = [];
					cardTemplateThis.getView().setBusy(false);
				});
				this.setMeasuresAndDimensionsForEnity(entity);
			} else {
				var message = "Enter a Service URL";
				sap.m.MessageToast.show(message);
			}
		},
		//To remove existing data when you change the data source or excel fie
		removeExistingData: function () {
			// 		cardTemplateThis.getView().byId("measureId").setSelectedKeys(null);
			// 	cardTemplateThis.getView().byId("dimensionId").setSelectedKeys(null);
			//	cardTemplateThis.getView().byId("measureId").removeSelections(true);
			//	cardTemplateThis.getView().byId("dimensionId").removeSelections(true);

			// 		cardTemplateThis.getView().byId("geomapId").setSelectedKeys(null);
			cardTemplateThis.getView().byId("column1").setSelectedKey(null);
			cardTemplateThis.getView().byId("column2").setSelectedKey(null);
			cardTemplateThis.getView().byId("column3").setSelectedKey(null);
			var dummyModel = new sap.ui.model.json.JSONModel([]);
			cardTemplateThis.getView().byId("measureId").setModel(dummyModel);
			cardTemplateThis.getView().byId("dimensionId").setModel(dummyModel);
			// 		cardTemplateThis.getView().byId("geomapId").setModel(dummyModel);
			cardTemplateThis.getView().byId("column1").setModel(dummyModel);
			cardTemplateThis.getView().byId("column2").setModel(dummyModel);
			cardTemplateThis.getView().byId("column3").setModel(dummyModel);
			cardTemplateThis.getView().byId("sortButtonId").setText("Select a Value");
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(dummyModel);
			cardTemplateThis.valueHelpRequestForFilter.setModel(dummyModel);
			// 		cardTemplateThis.getView().byId("filterTableID").setModel(dummyModel);
			this.entitySetDataModel = new sap.ui.model.json.JSONModel();
			if (this.chartName == "Table") {
				previewCard.getView().byId("graphListId").setModel(dummyModel);
				previewCard.getView().byId("previewChartBoxId").setVisible(true);
			} else if (this.chartName == "Geo Map") {
				previewCard.getView().byId("previewChartBoxId").setVisible(true);
				previewCard.getView().byId("geoMapLayoutId").setVisible(false);
			} else {
				// 			this.getView().byId("measureSettingsBtn").setVisible(Brevo.Brevo_V2.util.Formatter.isMeasureSettingVisible(this.chartName));
				// 			this.getView().byId("measureId").setValueState("Error");
				// 			this.getView().byId("dimensionId").setValueState("Error");
				previewCard.getView().byId("vizChartBoxId").setVisible(false);
				previewCard.getView().byId("errorText").setVisible(true);
			}

		},
		// To remove the field content from the card template view
		removeContent: function () {
			try {
				if (this.currentSelectedType) {
					this.currentSelectedType.oParent.removeStyleClass("customChartSelectHoverColorSelected");
				}
			} catch (e) {}

			this.chartName = "";
			cardTemplateThis.currentSelectedType = null;
			cardTemplateThis.getView().byId("cardTitleId").setValue("");
			cardTemplateThis.getView().byId("cardSubTitleId").setValue("");
			cardTemplateThis.getView().byId("setfileIdText").setText("");
			cardTemplateThis.getView().byId("fileId").setText("");
			cardTemplateThis.getView().byId("destinationId").setText("");
			// 		cardTemplateThis.getView().byId("serviceURLId").setValue("");
			cardTemplateThis.getView().byId("entityId").setValue("");
			cardTemplateThis.getView().byId("entityId").setShowValueHelp(true);
			cardTemplateThis.getView().byId("refreshIntervalId").setValue("");
			cardTemplateThis.getView().byId("numConVal1Id").setValue("");
			cardTemplateThis.getView().byId("numConVal2Id").setValue("");
			cardTemplateThis.getView().byId("aiSearch").setValue("");
			// 		cardTemplateThis.getView().byId("fileId").setValueState("Error");
			// 		cardTemplateThis.getView().byId("serviceURLId").setValueState("Error");
			cardTemplateThis.getView().byId("measureId").removeSelections(true);
			cardTemplateThis.getView().byId("dimensionId").removeSelections(true);

			cardTemplateThis.getView().byId("column1").setSelectedKey(null);
			cardTemplateThis.getView().byId("column2").setSelectedKey(null);
			cardTemplateThis.getView().byId("column3").setSelectedKey(null);
			cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
			cardTemplateThis.getView().byId("measurePanel").setVisible(true);
			cardTemplateThis.getView().byId("columnVboxId").setVisible(false);
			/*	cardTemplateThis.getView().byId("column2panel").setVisible(false);
			cardTemplateThis.getView().byId("column3panel").setVisible(false);*/
			var tableModel = new sap.ui.model.json.JSONModel();
			cardTemplateThis.getView().byId("trgURLID").setValue("");
			previewCard.getView().byId("ChartTitle").setText("");
			previewCard.getView().byId("ChartSubTitle").setText("");
			previewCard.getView().byId("numConBoxId").setVisible(false);
			// 		previewCard.getView().byId("graphListId").setVisible(false);
			previewCard.getView().byId("chartContainer").setVisible(false);
			previewCard.getView().byId("previewChartBoxId").setVisible(true);
			previewCard.getView().byId("ChartPreviewBox").setVisible(true);
			previewCard.getView().byId("geoMapLayoutId").setVisible(false);
			previewCard.getView().byId("vizChartBoxId").setVisible(false);
			cardTemplateThis.getView().byId("filterParameterVboxId").setModel(tableModel);
			var columntListItemsIds = ["menuItem3", "menuItem4", "menuItem5", "menuItem6"];
			for (var i = 0; i < columntListItemsIds.length; i++) {
				cardTemplateThis.getView().byId(columntListItemsIds[i]).removeStyleClass("sapUiResponsivePadding valid customMenuItem");
				cardTemplateThis.getView().byId(columntListItemsIds[i]).addStyleClass("sapUiResponsivePadding invalid customMenuItem");
			}
			cardTemplateThis.getView().byId("sortButtonId").setText("Select a Value");
			cardTemplateThis.sortItems = undefined;
			previewCard.getView().byId("graphListId").removeAllColumns();
			if (cardTemplateThis.getView().byId("addColumnId").getItems().length > 2) {
				for (var m = (cardTemplateThis.getView().byId("addColumnId").getItems().length - 1); m > 2; m--) {
					if (cardTemplateThis.getView().byId("addColumnId").getItems()[m].sId.indexOf("cardTemplate") == -1)
						cardTemplateThis.getView().byId("addColumnId").removeItem(m);
				}
			}
			cardTemplateThis.valueHelpRequestForBot = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.valueHelpRequestForBot", this);

		},
		// To add a new row to the filter table
		handleAddRow: function (evt) {
			// perform validation of measures and dimensions
			if (cardTemplateThis.chartName == "Table") {
				var c1 = cardTemplateThis.getView().byId("column1").getSelectedKey().length;
				var c2 = cardTemplateThis.getView().byId("column2").getSelectedKey().length;
				var c3 = cardTemplateThis.getView().byId("column3").getSelectedKey().length;
				if (c1 > 0 && c2 > 0 && c3 > 0) {
					cardTemplateThis.callServiceForFilter(evt);
				} else {
					sap.m.MessageToast.show("Please select all the columns", {
						duration: 2000
					});
				}
			} else if (cardTemplateThis.chartName == "Geo Map") {
				var prop = cardTemplateThis.getView().byId("geomapId").getSelectedKeys().length;
				if (prop > 0) {
					cardTemplateThis.callServiceForFilter(evt);
				} else {
					sap.m.MessageToast.show("Please select properties", {
						duration: 2000
					});
				}
			} else if (cardTemplateThis.chartName == "Heat Map" || cardTemplateThis.chartName == "Bullet" || cardTemplateThis.chartName ==
				"Waterfall" || cardTemplateThis.chartName == "Column Chart" || cardTemplateThis.chartName == "Stacked Column" ||
				cardTemplateThis.chartName ==
				"Scatter Chart" || cardTemplateThis.chartName == "Bubble Chart" || cardTemplateThis.chartName == "Line Chart" ||
				cardTemplateThis.chartName ==
				"Stacked Combination" || cardTemplateThis.chartName == "Donut Chart" || cardTemplateThis.chartName == "Bar Chart" ||
				cardTemplateThis
				.chartName == "Stacked Bar" || cardTemplateThis.chartName == "Pie Chart") {
				var measure = cardTemplateThis.getView().byId("measureId").getSelectedItems().length;
				var dimension = cardTemplateThis.getView().byId("dimensionId").getSelectedItems().length;
				if (measure > 0 && dimension > 0) {
					cardTemplateThis.callServiceForFilter(evt);
				} else {
					sap.m.MessageToast.show("Please select measures and dimensions", {
						duration: 2000
					});
				}
			}
			/*else {
			    sap.m.MessageToast.show("Please complete the previous steps and add filters");
			}*/
		},
		callServiceForFilter: function (evt) {
			var arr = [];
			cardTemplateThis.fragmentToOpen = evt.oSource;
			if (cardTemplateThis.fileUploaded == true) {
				var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
				arr = parsedDataFromExcelModel.oData.dimensions;
			} else {
				/*var properties = cardTemplateThis.oDataModel.getServiceMetadata().dataServices.schema[0].entityType[0].property;*/
				var properties = cardTemplateThis.oDataModel.getServiceMetadata().dataServices.schema[0].entityType[0].property;
				var entity = this.getView().byId("entityId").getValue().trim();
				for (var i = 0; i < cardTemplateThis.oDataModel.getServiceMetadata().dataServices.schema[0].entityType.length; i++) {
					if (cardTemplateThis.oDataModel.getServiceMetadata().dataServices.schema[0].entityType[i].name.indexOf(entity) > -1) {
						properties = cardTemplateThis.oDataModel.getServiceMetadata().dataServices.schema[0].entityType[i].property;
						break;
					}
				}
				var name = "";
				var objName = "";
				var dataType = "";
				for (var i = 0; i < properties.length; i++) {
					for (var j = 0; j < properties[i].extensions.length; j++) {
						name = properties[i].extensions[j].name;
						if (name === "filterable") {
							break;
						} else {
							objName = properties[i].name;
							dataType = properties[i].type;
						}
						if (j >= properties[i].extensions.length - 1) {
							arr.push({
								value: objName,
								dataType: dataType
							});
						}
					}
				}
				var data = sap.ui.getCore().getModel("labelModel").oData;
				for (var k = 0; k < data.length; k++) {
					for (var l = 0; l < arr.length; l++) {
						if (arr[l].value === data[k].property) {
							arr[l].property = data[k].value;
							// console.log(arr);
							break;
						}
					}
				}
			}
			var model = new sap.ui.model.json.JSONModel(arr);
			cardTemplateThis.valueHelpRequestForFilter.setModel(model);
			// cardTemplateThis.valueHelpRequestForFilter.setModel(sap.ui.getCore().getModel("labelModel"));
			if (evt == false) {} else {
				cardTemplateThis.valueHelpRequestForFilter.openBy(evt.oSource);
			}
		},
		// Search a property on click of add for filters
		handleFilterSearch: function (evt) {
			var filters = [];
			var searchString = evt.getParameter("value");
			var binding = evt.mParameters.itemsBinding;
			if (searchString && searchString.length > 0) {
				var filter1 = new sap.ui.model.Filter("property", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter1);
				var filter2 = new sap.ui.model.Filter("value", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter2);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else {
				binding.filter([]);
			}
		},
		// Add the selected filters from the value help dialog to
		// the filter table
		handleFilterConfirm: function (evt) {
			var addNewFilter = true;
			var selectedFilter = evt.oSource.getTitle();
			var filterDataModel = cardTemplateThis.getView().byId("filterParameterVboxId").getModel();
			if (filterDataModel != undefined) {
				for (var m = 0; m < filterDataModel.oData.length; m++) {
					if (filterDataModel.oData[m].filterParameter == selectedFilter) {
						addNewFilter = false;
						sap.m.MessageToast.show("Selected Property already exists in the filter");
						cardTemplateThis.valueHelpRequestForFilter.close();
						break;
					}
				}
			}
			if (addNewFilter == true) {
				if (evt.oSource.getBindingContext().getObject().filterDataType == undefined) {
					Object.assign({
						filterDataType: "Edm.String"
					}, evt.oSource.getBindingContext().getObject());
				}
				cardTemplateThis.valueHelpRequestForFilter.close();
				cardTemplateThis.onValueHelpRequestForFilterValue(evt);
			}
		},
		//triggers on click of the edit button for each filterItems
		handleFilterEditPress: function (evt) {
			cardTemplateThis.selectdFilterValues = evt.oSource.oParent.oParent.getBindingContext().getObject().filterParameterArr;
			if (evt.oSource.oParent.oParent.getBindingContext().getObject().filterDataType == "Edm.DateTime") {
				cardTemplateThis.ValueHelpForFilterValues.getContent()[1].setVisible(true);
				cardTemplateThis.ValueHelpForFilterValues.getContent()[0].setVisible(false);
				if (cardTemplateThis.selectdFilterValues.length > 1) {
					cardTemplateThis.ValueHelpForFilterValues.getContent()[1].getContent()[1].setValue(cardTemplateThis.selectdFilterValues[0].filterParameterValue);
					cardTemplateThis.ValueHelpForFilterValues.getContent()[1].getContent()[3].setValue(cardTemplateThis.selectdFilterValues[1].filterParameterValue);
				} else {
					cardTemplateThis.ValueHelpForFilterValues.getContent()[1].getContent()[1].setValue(cardTemplateThis.selectdFilterValues[0].filterParameterValue);
					cardTemplateThis.ValueHelpForFilterValues.getContent()[1].getContent()[3].setValue();
				}
				if (cardTemplateThis.fragmentToOpen != undefined) {
					cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
				} else {
					cardTemplateThis.ValueHelpForFilterValues.openBy(evt.oSource.oParent.oParent.oParent)
				}

				cardTemplateThis.selectedFilterValueField = evt.oSource.oParent.oParent;
				var filterParameter = evt.oSource.oParent.oParent.getBindingContext().getObject().filterParameter;
				cardTemplateThis.filterParameter = filterParameter;
			} else {
				cardTemplateThis.ValueHelpForFilterValues.getContent()[0].setVisible(true);
				cardTemplateThis.ValueHelpForFilterValues.getContent()[1].setVisible(false);
				var filterParameter = evt.oSource.oParent.oParent.getBindingContext().getObject().filterParameter;
				cardTemplateThis.selectedFilterValueField = evt.oSource.oParent.oParent;
				cardTemplateThis.filterParameter = filterParameter;

				cardTemplateThis.busyDialog.open();
				if (cardTemplateThis.fileUploaded) {
					var filterKey = filterParameter;
					var dataSource = this.getView().byId("setfileIdText").getText("Spreedsheet");
					var url = Services.config.metadataUrls.FileFilter.values(dataSource, sap.ui.getCore().getModel("parsedDataFromExcelModel").oData.id,
						filterKey);
					Services.callService("filterFileData", "filterFileData", url, "", "false", function (oEvent) {
						cardTemplateThis.busyDialog.close();
						var model = sap.ui.getCore().getModel("filterFileData");
						// model.oData = {
						// 	d: {
						// 		results: model.oData.results
						// 	}
						// };
						// if (model.oData.d.results.length > 0) {
						var listItem = new sap.m.StandardListItem({
							title: "{" + filterParameter + "}"
						});
						listItem.addStyleClass("popOverItem");
						cardTemplateThis.ValueHelpForFilterValues.getContent()[0].bindAggregation("items", {
							path: "/",
							template: listItem
						});
						// }
						cardTemplateThis.ValueHelpForFilterValues.setModel(model);
						var filtervaluesListItems = cardTemplateThis.ValueHelpForFilterValues.getContent()[0].getItems();
						for (var i = 0; i < cardTemplateThis.selectdFilterValues.length; i++) {
							for (var j = 0; j < filtervaluesListItems.length; j++) {
								if (cardTemplateThis.selectdFilterValues[i].filterParameterValue == filtervaluesListItems[j].getTitle()) {
									filtervaluesListItems[j].setSelected(true)
									break;
								}
							}
						}
						if (cardTemplateThis.fragmentToOpen != undefined) {
							cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
						} else {
							cardTemplateThis.ValueHelpForFilterValues.openBy(evt.oSource.oParent.oParent.oParent)
						}
						//cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
						// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
					}, "", "");
				} else {
					var url = cardTemplateThis.getView().byId("destinationId").getText() + cardTemplateThis.getView().byId("fileId").getText() +
						"/" +
						this.entitySetRequired + "?$format=json&$top=100" +
						"&$select=" + filterParameter;
					Services.callService("dataSrcSystem", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/neo-app.json", url, "removeSericeURL",
						"false",
						function (oEvent) {
							cardTemplateThis.busyDialog.close();
							var model = sap.ui.getCore().getModel("dataSrcSystem");
							if (model.oData.length > 0) {
								var listItem = new sap.m.StandardListItem({
									title: "{" + filterParameter + "}",
									//class : "popOverItem" 
								});
								listItem.addStyleClass("popOverItem");
								cardTemplateThis.ValueHelpForFilterValues.getContent()[0].bindAggregation("items", {
									path: "/",
									template: listItem
								});
							}
							cardTemplateThis.ValueHelpForFilterValues.setModel(model);
							var filtervaluesListItems = cardTemplateThis.ValueHelpForFilterValues.getContent()[0].getItems();
							for (var i = 0; i < cardTemplateThis.selectdFilterValues.length; i++) {
								for (var j = 0; j < filtervaluesListItems.length; j++) {
									if (cardTemplateThis.selectdFilterValues[i].filterParameterValue == filtervaluesListItems[j].getTitle()) {
										filtervaluesListItems[j].setSelected(true)
										break;
									}
								}
							}
							if (cardTemplateThis.fragmentToOpen != undefined) {
								cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
							} else {
								cardTemplateThis.ValueHelpForFilterValues.openBy(evt.oSource.oParent.oParent.oParent)
							}
							//cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
							// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
						});
				}
			}
		},
		// open a value help dialog with a list of values to choose
		// for filters
		onValueHelpRequestForFilterValue: function (evt) {
			if (evt.oSource.getBindingContext().getObject().dataType == "Edm.DateTime") {
				cardTemplateThis.ValueHelpForFilterValues.getContent()[1].setVisible(true);
				cardTemplateThis.ValueHelpForFilterValues.getContent()[0].setVisible(false);
				cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
				cardTemplateThis.selectedFilterValueField = evt.oSource;
				var filterParameter = evt.oSource.getBindingContext().getObject().COLUMN_NAME;
				cardTemplateThis.filterParameter = filterParameter;
			} else {
				cardTemplateThis.ValueHelpForFilterValues.getContent()[0].setVisible(true);
				cardTemplateThis.ValueHelpForFilterValues.getContent()[1].setVisible(false);
				var filterParameter = evt.oSource.getBindingContext().getObject().COLUMN_NAME;
				cardTemplateThis.selectedFilterValueField = evt.oSource;
				cardTemplateThis.filterParameter = filterParameter;

				cardTemplateThis.busyDialog.open();
				if (cardTemplateThis.fileUploaded) {
					var fileId = sap.ui.getCore().getModel("parsedDataFromExcelModel").oData.id;
					var dataSource = this.getView().byId("setfileIdText").getText("Spreedsheet");
					if (dataSource == "Spreedsheet")
						dataSource = "fileuploader";
					var url = Services.config.metadataUrls.FileFilter.values(dataSource, fileId, filterParameter);
					Services.callService("filterFileData", "filterFileData", url, "", "false", function (oEvent) {
						cardTemplateThis.busyDialog.close();
						var model = sap.ui.getCore().getModel("filterFileData");
						// model.oData = {
						// 	d: {
						// 		results: model.oData.results
						// 	}
						// };
						// if (model.oData.d.results.length > 0) {
						var listItem = new sap.m.StandardListItem({
							title: "{" + filterParameter + "}"
						});
						listItem.addStyleClass("popOverItem");
						cardTemplateThis.ValueHelpForFilterValues.getContent()[0].bindAggregation("items", {
							path: "/",
							template: listItem
						});
						// }
						cardTemplateThis.ValueHelpForFilterValues.setModel(model);
						cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
						// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
					}, "", "");
				} else {
					var url = cardTemplateThis.getView().byId("destinationId").getText() + cardTemplateThis.getView().byId("fileId").getText() +
						"/" +
						this.entitySetRequired + "?$format=json&$top=100" +
						"&$select=" +
						filterParameter;
					Services.callService("dataSrcSystem", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/neo-app.json", url, "removeSericeURL",
						"false",
						function (oEvent) {
							cardTemplateThis.busyDialog.close();
							var model = sap.ui.getCore().getModel("dataSrcSystem");
							if (model.oData.length > 0) {
								var listItem = new sap.m.StandardListItem({
									title: "{" + filterParameter + "}",
									//class : "popOverItem" 
								});
								listItem.addStyleClass("popOverItem");
								cardTemplateThis.ValueHelpForFilterValues.getContent()[0].bindAggregation("items", {
									path: "/",
									template: listItem
								});
							}
							cardTemplateThis.ValueHelpForFilterValues.setModel(model);
							cardTemplateThis.ValueHelpForFilterValues.openBy(cardTemplateThis.fragmentToOpen);
							// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
						}, "", "");
				}
			}
		},
		//search function for filter values
		handleFilterValueSearch: function (evt) {
			var filters = [];
			var searchString = evt.getParameter("value");
			var binding = evt.mParameters.itemsBinding;
			if (searchString && searchString.length > 0) {
				var filter1 = new sap.ui.model.Filter(cardTemplateThis.filterParameter, sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter1);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else {
				binding.filter([]);
			}
		},
		handleFilterOperator: function (evt) {
			var key = evt.oSource.getSelectedKey();
			// If value already exists and user wants to change the operator
			if (key === "bw") {
				var input = new sap.m.Input({
					showValueHelp: true,
					valueHelpOnly: true,
					valueHelpRequest: cardTemplateThis.onValueHelpRequestForFilterValue
				});
				evt.oSource.oParent.getCells()[2].insertItem(input, 1);
			} else {
				var filterItems = this.getView().byId("filterTableID").getItems();
				for (var i = 0; i < filterItems.length; i++) {
					if (filterItems[i].getCells()[2].getItems().length > 0) {
						filterItems[i].getCells()[2].getItems()[1].setVisible(false);
					}
				}
				// cardTemplateThis.getView().byId("secondInput").setVisible(false);
				if (cardTemplateThis.selectedFilterValueField !== undefined) {
					if (cardTemplateThis.selectedFilterValueField.getValue().length > 0) {
						cardTemplateThis.handleChangeCard(true);
					}
				}
			}
		},
		// to call service once filter value is selected
		handleFilterValueConfirm: function (evt) {
			var value = "";
			var values = [],
				filterParameterArr = [];

			var obj;
			//	var selectedItems = evt.getParameter("selectedContexts");
			if (cardTemplateThis.selectedFilterValueField.getBindingContext().getObject().filterDataType == "Edm.DateTime" ||
				cardTemplateThis.selectedFilterValueField
				.getBindingContext().getObject().dataType == "Edm.DateTime") {
				// 			var seletedDate = evt.oSource.oParent.oParent.getContent()[1].getContent()[5].getValue();
				// 			var selectedMonth = evt.oSource.oParent.oParent.getContent()[1].getContent()[3].getValue();
				// 			var selectedYear = evt.oSource.oParent.oParent.getContent()[1].getContent()[1].getValue();
				// 			var dateFormat = seletedDate + "-" + selectedMonth + "-" + selectedYear;
				var fromDate = evt.oSource.oParent.oParent.getContent()[1].getContent()[1].getValue();
				var toDate = evt.oSource.oParent.oParent.getContent()[1].getContent()[3].getValue();
				var filterObj1;
				var filterObj
				if (fromDate) {
					filterObj = {
						filterParameterValue: fromDate
					};
					filterParameterArr.push(filterObj);
				}
				if (toDate) {
					filterObj1 = {
						filterParameterValue: toDate
					};
					filterParameterArr.push(filterObj1);
				}
				var panelObj;
				if (cardTemplateThis.selectedFilterValueField.getBindingContext().getObject().dataType == undefined) {
					panelObj = [{
						filterParameter: cardTemplateThis.filterParameter,
						filterDataType: cardTemplateThis.selectedFilterValueField.getBindingContext().getObject().filterDataType,
						filterOperator: "eq",
						filterParameterArr
						//filterParameterArr :values
					}]
				} else {
					panelObj = [{
						filterParameter: cardTemplateThis.filterParameter,
						filterDataType: cardTemplateThis.selectedFilterValueField.getBindingContext().getObject().dataType,
						filterOperator: "eq",
						filterParameterArr
						//filterParameterArr :values
					}]
				}

				try {
					var previousFilterObj = cardTemplateThis.getView().byId("filterParameterVboxId").getModel().oData;
					var filterItemReplace = false;
					for (var i = 0; i < previousFilterObj.length; i++) {
						if (previousFilterObj[i].filterParameter == panelObj[0].filterParameter) {
							filterItemReplace = true;
							previousFilterObj[i] = panelObj[0];
							var filterModel = new sap.ui.model.json.JSONModel(previousFilterObj);
							break;
						}
					}
					if (filterItemReplace == false) {
						previousFilterObj.push(panelObj[0]);
						var filterModel = new sap.ui.model.json.JSONModel(previousFilterObj);
					}
					/*	var previousFilterObj = cardTemplateThis.getView().byId("filterParameterVboxId").getModel().oData;
					previousFilterObj.push(panelObj[0]);
					var filterModel = new sap.ui.model.json.JSONModel(previousFilterObj);*/
				} catch (e) {
					var filterModel = new sap.ui.model.json.JSONModel(panelObj);
				}
				cardTemplateThis.getView().byId("filterParameterVboxId").setModel(filterModel);
				cardTemplateThis.ValueHelpForFilterValues.close();
				cardTemplateThis.handleChangeCard(true);
			} else {
				var selectedItems = evt.oSource.oParent.oParent.getContent()[0].getSelectedItems();
				if (selectedItems.length > 0) {
					for (var i = 0; i < selectedItems.length; i++) {
						obj = selectedItems[i].getBindingContext().getObject();
						values.push(obj[cardTemplateThis.filterParameter]);
						if (selectedItems.length === 1) {
							value = obj[cardTemplateThis.filterParameter];
						} else {
							if (i === 0) {
								value = obj[cardTemplateThis.filterParameter];
							} else {
								if (this.fileUploaded)
									value = value + ",," + obj[cardTemplateThis.filterParameter];
								else
									value = value + "," + obj[cardTemplateThis.filterParameter];
							}
						}
					}
					cardTemplateThis.selectedValues = values;
					for (var r = 0; r < values.length; r++) {
						var filterObj = {
							filterParameterValue: cardTemplateThis.selectedValues[r]
						};
						filterParameterArr.push(filterObj);
					}
					var panelObj = [{
						filterParameter: cardTemplateThis.filterParameter,
						filterDataType: cardTemplateThis.selectedFilterValueField.getBindingContext().getObject().dataType,
						filterOperator: "eq",
						filterParameterArr
						//filterParameterArr :values
					}]
					try {
						var previousFilterObj = cardTemplateThis.getView().byId("filterParameterVboxId").getModel().oData;
						var filterItemReplace = false;
						for (var i = 0; i < previousFilterObj.length; i++) {
							if (previousFilterObj[i].filterParameter == panelObj[0].filterParameter) {
								filterItemReplace = true;
								previousFilterObj[i] = panelObj[0];
								var filterModel = new sap.ui.model.json.JSONModel(previousFilterObj);
								break;
							}
						}
						if (filterItemReplace == false) {
							previousFilterObj.push(panelObj[0]);
							var filterModel = new sap.ui.model.json.JSONModel(previousFilterObj);
						}
					} catch (e) {
						var filterModel = new sap.ui.model.json.JSONModel(panelObj);
					}
					cardTemplateThis.getView().byId("filterParameterVboxId").setModel(filterModel);
					cardTemplateThis.ValueHelpForFilterValues.close();
					cardTemplateThis.handleChangeCard(true);
				}
			}
		},
		//to delete the parameter of seleted filter values from the filters list
		handleFilterValueDeletePress: function (evt) {
			var selectedFilterItems = evt.oSource.oParent.getItems();
			if (selectedFilterItems.length > 0 && selectedFilterItems.length > 1) {
				var selectedFilterObj = evt.oSource.oParent.oParent.getBindingContext().getObject();
				for (var v = 0; v < selectedFilterObj.filterParameterArr.length; v++) {
					if (selectedFilterObj.filterParameterArr[v].filterParameterValue == evt.oSource.getText()) {
						selectedFilterObj.filterParameterArr.splice(v, 1);
						evt.oSource.oParent.oParent.getModel().updateBindings(true);
						cardTemplateThis.handleChangeCard(true);
					}
				}
			} else if (selectedFilterItems.length == 1) {
				//  var filterModel = evt.oSource.oParent.getModel();
				var selectedFilterObj = evt.oSource.oParent.oParent.getBindingContext().getObject();
				var filterObj = cardTemplateThis.getView().byId("filterParameterVboxId").getModel();
				for (var v = 0; v < filterObj.oData.length; v++) {
					if (filterObj.oData[v].filterParameter == selectedFilterObj.filterParameter) {
						filterObj.oData.splice(v, 1);
						evt.oSource.oParent.oParent.getModel().updateBindings(true);
						cardTemplateThis.handleChangeCard(true);
					}
				}
			}
		},
		//to delete the seleted filter value from the filters list
		handleFilterDeletePress: function (evt) {
			var selectedFilterItems = evt.oSource.oParent.getContent();
			if (selectedFilterItems.length > 0) {
				var filterModel = evt.oSource.oParent.getContent()[0].getModel();
				for (var v = 0; v < filterModel.oData.length; v++) {
					if (filterModel.oData[v].filterParameter == evt.oSource.oParent.getContent()[0].getText()) {
						filterModel.oData.splice(v, 1);
						filterModel.updateBindings(true);
						cardTemplateThis.handleChangeCard(true);
					}
				}
			}
		},
		// To remove a row from the filter table
		handleRemoveRow: function (evt) {
			cardTemplateThis.getView().byId("filterTableID").setMode("MultiSelect");
			cardTemplateThis.getView().byId("addButID").setVisible(false);
			cardTemplateThis.getView().byId("removeButID").setVisible(false);
			cardTemplateThis.getView().byId("deleteFilters").setVisible(true);
			// cardTemplateThis.getView().byId("secondInput").setVisible(false);
			cardTemplateThis.selectedFilterValueField = "";
			sap.m.MessageToast.show("Please select the items to remove..", {
				duration: 2000
			});
		},
		handleRemoveSelectedRows: function (evt) {
			cardTemplateThis.selectedFilterValueField = "";
			var selectedFltrItems = this.getView().byId("filterTableID").getSelectedItems();
			var filterItems = this.getView().byId("filterTableID");
			var aContexts = this.getView().byId("filterTableID").getSelectedContexts();
			var oModel = cardTemplateThis.getView().byId("filterTableID").getModel();
			var aRows = oModel.getProperty("/filters");
			for (var i = selectedFltrItems.length - 1; i >= 0; i--) {
				var oThisObj = aContexts[0].getObject();
				var index = $.map(aRows, function (obj, index) {
					if (obj === oThisObj)
						return index;
				});
				aRows.splice(index, 1);
			}
			oModel.setProperty("/filters", aRows);
			cardTemplateThis.getView().byId("filterTableID").setMode("None");
			cardTemplateThis.getView().byId("addButID").setVisible(true);
			cardTemplateThis.getView().byId("removeButID").setVisible(true);
			cardTemplateThis.getView().byId("deleteFilters").setVisible(false);
			filterItems.removeSelections(true);
			cardTemplateThis.handleChangeCard(true);
		},

		handleDynamicColumn: function (evt, val) {
			var getView = this.getView().byId("addColumnId");
			var Addpanel = new sap.m.Panel({
				width: '100%',
				expandable: true,
				expanded: true,
				class: "sapUiResponsiveMargin",
				headerText: "Column " + cardTemplateThis.columnNumber,
				width: "auto"
			});
			//		var headerBar = new sap.m.HeaderContainer({});
			var toolBar = new sap.m.Toolbar({});

			var columnText = new sap.m.Text({
				text: "Column 4",
				class: "whiteText"

			});
			var barSpacer = new sap.m.ToolbarSpacer({});
			var button = new sap.m.Button({
				icon: "sap-icon://delete",
				type: "Transparent",
				Visible: true,
				press: function (evt) {

				}
			});

			var select = new sap.m.Select({
				width: "100%",
				//	 items : "{/}",
				//	class: "customMultiBoxStyle",
				change: function (evt) {
					cardTemplateThis.handleSelectionChange(evt)

				}
			});
			var oItemSelectTemplate = new sap.ui.core.Item({
				key: "{COLUMN_NAME}",
				text: "{LABEL}"
			});
			if (this.fileUploaded == true)
				select.setModel(sap.ui.getCore().getModel("propertiesModel"));
			else
				select.setModel(sap.ui.getCore().getModel("labelModel"));
			select.bindAggregation("items", "/", oItemSelectTemplate);
			toolBar.addContent(columnText);
			Addpanel.addContent(select);
			getView.addItem(Addpanel);
			if (val) {
				select.setSelectedKey(val);
			} else {
				var firstItem = select.getItems()[0].getText();
				select.setSelectedKey(firstItem);
			}
			cardTemplateThis.columnNumber++;
			/*if (evt == true) {
				return select;
			}*/
			var colNo = 1;
			var colArr = [];
			var columnSelItems = cardTemplateThis.getView().byId("addColumnId").getItems();
			for (var a = 0; a < columnSelItems.length; a++) {
				var columnSelProperty = cardTemplateThis.getView().byId("addColumnId").getItems()[a].getContent()[0].getSelectedItem().getBindingContext()
					.getObject();
				if (typeof columnSelProperty["customLabel"] === "undefined") {
					if (val) {
						columnSelProperty["customLabel"] = cardTemplateThis.cardInfo.columns[a].customLabel;
					} else {

						columnSelProperty["customLabel"] = "";
					}
				}
				columnSelProperty["colNum"] = "Column " + colNo;
				colArr.push(columnSelProperty);
				colNo++;
			}

			var formatModel = new sap.ui.model.json.JSONModel();
			formatModel.setData(colArr);
			cardTemplateThis.getView().byId("tableId").setModel(formatModel);

			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, this.chartName);
		},

		handleAiObjectPress: function (evt) {

			var object = evt.oSource.getBindingContext().getObject();
			this.cardInfo = object;
			if (!object.chartConfigId) {
				object.chartConfigId = Math.round(Math.random() * 1000000);
			}
			// 		cardTemplateThis.getView().byId("aiBox").setVisible(false);
			cardTemplateThis.getView().byId("SplitContDemo").setVisible(true);

			try {
				sap.ui.getCore().getModel("cardListModel").getData().push({
					Configuration: JSON.stringify(object),
					Configid: object.chartConfigId,
					isFromSuggestion: true
				});
			} catch (e) {
				var tempObject = [{
					Configuration: JSON.stringify(object),
					Configid: object.chartConfigId,
					isFromSuggestion: true
				}]
				sap.ui.getCore().getModel("cardListModel").setData(tempObject);
			}

			if (cardTemplateThis.getView().byId("configuration1").getVisible() === true) {
				// var bus = sap.ui.getCore().getEventBus();
				// bus.publish("mainView", "toCardTemplate", {
				// 	toggleBtn: false,
				// 	chartConfigId: object.chartConfigId + "",
				// 	chartTitle: object.cardTitle,
				// 	chartSubtitle: object.cardSubtitle,
				// 	pageId: cardTemplateThis.pageId,
				// 	isFromSuggestion: true,
				// 	model: new sap.ui.model.json.JSONModel()
				// });
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("CreateView", {
					pageId: cardTemplateThis.pageId,
					isEditMode: true,
					isFromSuggestion: true,
					modelName: "",
					chartId: object.chartConfigId,
					dashboardType: this.dashboardType
				});

			}

			$("#" + cardTemplateThis.getView().byId("cardTemplateMainPage").sId).children().first().animate({
				scrollTop: $(document).height()
			}, 1000);

		},
		//to close the popover measure settings
		valueHelpCloseButtonForMeasureSettings: function () {
			cardTemplateThis.valueHelpForMeasureSettings.close();
		},
		handleExcelFilePress: function (evt) {
			var data = evt.oSource;
		},
		// on press of refresh button
		handleRefreshButton: function () {
			//cardTemplateThis.getView().byId("aiBox").setVisible(false);
			//cardTemplateThis.getView().byId("previewBox").setVisible(true);
			cardTemplateThis.handleChangeCard(true);
		},
		aiBtnPress: function () {
			cardTemplateThis.getView().byId("aiBox").setVisible(true);
			cardTemplateThis.getView().byId("previewBox").setVisible(false);
		},
		onAISearch: function (evt) {
			var userName = evt.oSource.getValue();
			if (userName.length <= 0) {
				var oModel = sap.ui.getCore().getModel("SuggestionModel");
				cardTemplateThis.getView().byId("aiTitle").setText("Recommended for you");
				cardTemplateThis.getView().byId("aiGrid").setModel(oModel);
				return;
			}

			if (userName.indexOf("create") >= 0 || userName.indexOf("Create") >= 0) {
				Services.callService("BotModel", "BotModel",
					"CardConfiguration(901555)", "", "false",
					function () {
						try {
							var object = sap.ui.getCore().getModel("BotModel").oData.d;
							sap.ui.getCore().getModel("cardInfoModel").oData.d.results[0].CardConfiguration.results.push({
								Configuration: object.Configuration,
								Configid: object.Configid,
								isFromSuggestion: true
							});
						} catch (e) {
							var tempObject = {
								d: {
									results: [{
										CardConfiguration: {
											results: [{
												Configuration: object.Configuration,
												Configid: object.Configid,
												isFromSuggestion: true
											}]
										}
									}]
								}
							};
							sap.ui.getCore().getModel("cardInfoModel").setData(tempObject);
						}

						var bus = sap.ui.getCore().getEventBus();
						bus.publish("mainView", "toCardTemplate", {
							toggleBtn: false,
							chartConfigId: object.Configid + "",
							chartTitle: "",
							chartSubtitle: "",
							pageId: cardTemplateThis.pageId,
							isFromSuggestion: true,
							model: new sap.ui.model.json.JSONModel()
						});
						$("#" + cardTemplateThis.getView().byId("cardTemplateMainPage").sId).children().first().animate({
							scrollTop: $(document).height()
						}, 1000);
					});
				return;
				$.ajax({
					type: "POST",
					url: "https://language.googleapis.com/v1beta2/documents:analyzeEntities?key=AIzaSyDxY-GfjHC5RVcL4lKvqnqnAwCuPYh7fWY",
					data: {
						document: {
							type: "PLAIN_TEXT",
							content: userName
						},
						encodingType: "UTF16"
					},
					success: function () {}
				});

			} else {
				Services.callService("SearchSuggestionModel", "SearchSuggestionModel",
					"/textSearchForCard.xsjs?Search=" + userName, "", "false",
					function (evt) {
						cardTemplateThis.getView().byId("aiTitle").setText("Search results for: " + userName);
						var oModel = sap.ui.getCore().getModel("SearchSuggestionModel");
						var cardInfoResults = oModel.oData;
						var suggestionData = [];
						var keys = Object.keys(cardInfoResults);
						for (var i = 0; i < keys.length; i++) {
							try {

								var cardInfo = JSON.parse(decodeURIComponent(escape((cardInfoResults[keys[i]].Configuration))));
								cardInfo.chartConfigId = cardInfoResults[keys[i]]["Config ID"];
								cardInfo.pageId = cardInfoResults[keys[i]]["Page ID"];
								suggestionData.push(cardInfo);
							} catch (e) {

							}
						}
						oModel.setData(suggestionData);
						cardTemplateThis.getView().byId("aiGrid").setModel(oModel);
					});
			}
		},
		// on press of save button
		handleSaveButton: function () {
			cardTemplateThis.handleChangeCard(false);
		},
		// saving the data
		handleChangeCard: function (refreshButtonSelected) {
			var that = this;
			var cardTitleStr = that.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = that.getView().byId("cardSubTitleId").getValue();
			var mesurementValue = [],
				allMesurementValue = [],
				allMeasureKeys = [],
				measureKeys = [];
			var dimensionValue = [],
				dimensionKeys = [];
			var serviceURL = that.getView().byId("fileId").getText();
			var destination = that.getView().byId("destinationId").getText();
			var filters = [];
			var filterName;
			var filterOperator;
			var selectedFilterValues;
			if (that.navigationObj) var navigationObj = that.navigationObj;
			else var navigationObj = "";
			var isDataSetLimited = this.getView().byId("isDataSetLimited").getSelected();
			var isShowLabelsSet = this.getView().byId("isShowLabelsSet").getSelected();
			var dataSetLimit = 999999;
			if (isDataSetLimited)
				dataSetLimit = this.getView().byId("limitDataSet").getValue();
			var filterValue, selectParam;
			var filterUrl1, filterUrl2;
			var select;
			var finalFilter = "";
			var filterItems;
			try {
				filterItems = cardTemplateThis.getView().byId("filterParameterVboxId").getModel().oData;
			} catch (e) {
				filterItems = [];
			}

			this.newUrl = destination + serviceURL + "/" + cardTemplateThis.entitySetRequired + "?$format=json&$top=" + dataSetLimit;
			//constructing the fillterurl for selected filtering parameter
			if (true) {
				var filterUrlToAppend = "",
					filterUrl, finalFilter;
				filters = filterItems;
				var filterObject = [];
				var filterParam = "";
				for (var i = 0; i < filterItems.length; i++) {
					filterName = filterItems[i].filterParameter;
					filterOperator = filterItems[i].filterOperator;
					selectedFilterValues = filterItems[i].filterParameterArr;
					var filterObjectOR = [];
					if (selectedFilterValues.length <= 0)
						continue;
					for (var m = 0; m < selectedFilterValues.length; m++) {
						var filter = new Filter(filterName, filterOperator, selectedFilterValues[m].filterParameterValue);
						filter.filterDataType = filterItems[i].filterDataType;
						filterObjectOR.push(filter);
					}
					if (filterObjectOR.length > 0)
						filterObject.push(new Filter(filterObjectOR, false));
				}
				if (filterObject.length > 0) {
					filterObject = new Filter(filterObject, true);
					filterParam = FilterProcessor.createFilterParams(filterObject, null, null, null);
				}
				console.log(filterParam);
				// for (var i = 0; i < filterItems.length; i++) {
				// 	if (filterItems[i].filterParameter != undefined) {
				// 		filterName = filterItems[i].filterParameter
				// 			//	filterName = filterName.replace(/\s/g, "%20");
				// 		filterOperator = filterItems[i].filterOperator;
				// 		if (filterItems[i].filterDataType == "Edm.DateTime") {
				// 			var value1 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[2];
				// 			var value2 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[1];
				// 			var value3 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[0];
				// 			if (value1 > 0 && value2.length > 0 && value3.length > 0) {
				// 				filterUrl = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
				// 					" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
				// 			} else if (value1.length > 0 && value2.length > 0) {
				// 				filterUrl = "(year(" + filterName + ") eq " + value1 + ")and(month(" + filterName + ")" + " eq " + value2 + ")";
				// 			} else if (value2.length > 0 && value3.length > 0) {
				// 				filterUrl = "(month(" + filterName + ")eq" + value2 + ")and(day(" + filterName + ")" + "eq" + value3 + ")";
				// 			} else if (value1.length > 0 && value3.length > 0) {
				// 				filterUrl = "(year(" + filterName + ")  eq " + value1 + ")and(day(" + filterName + ") eq " + value3 + ")";
				// 			} else if (value1.length > 0) {
				// 				filterUrl = "(year(" + filterName + ") eq " + value1 + ")";
				// 			} else if (value2.length > 0) {
				// 				filterUrl = "(month(" + filterName + ") eq " + value2 + ")";
				// 			} else if (value3.length > 0) {
				// 				filterUrl = "(day(" + filterName + ") eq " + value3 + ")";
				// 			}

				// 		} else if (filterItems[i].filterOperator == "bw") {
				// 			var value1 = filterItems[i].getCells()[2].getItems()[0].getValue();
				// 			var value2 = filterItems[i].getCells()[2].getItems()[1].getValue();
				// 			if (value1.length > 0 && value2.length > 0) {
				// 				if (value1.indexOf(",") == (-1) && value2.indexOf(",") == (-1)) {
				// 					filterUrl2 = "(" + filterName + " gt " + "'" + value1 + "'" + ")and(" + filterName + " lt " +
				// 						"'" + value2 + "'" + ")";
				// 				} else {
				// 					var values1Len = value1.split(",");
				// 					for (var m = 0; m < values1Len.length; m++) {
				// 						values1Len[m] = values1Len[m].trim().replace(/\s/g, "%20");
				// 						if (m === 0) {
				// 							filterUrl = "(" + filterName + " " + filterOperator + " '" + values1Len[0] + "')";
				// 						} else {
				// 							filterUrl = filterUrl + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[m] + "')";
				// 						}
				// 					}
				// 					var values2Len = value2.split(",");
				// 					for (var k = 0; k < values2Len.length; k++) {
				// 						values1Len[k] = values2Len[k].trim().replace(/\s/g, "%20");
				// 						if (k === 0) {
				// 							filterUrl = "(" + filterName + " " + filterOperator + " " + "'" + values1Len[0] + "')";
				// 						} else {
				// 							filterUrl = filterUrl + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[k] + "')";
				// 						}
				// 					}
				// 					filterUrl = filterUrl + "and" + filterUrl;
				// 				}
				// 			}
				// 		} else {
				// 			selectedFilterValues = filterItems[i].filterParameterArr;
				// 			for (var m = 0; m < selectedFilterValues.length; m++) {
				// 				var selectedValues = selectedFilterValues[m].filterParameterValue.trim();
				// 				if (m === 0) {
				// 					filterUrl = '"' + filterName + '"' + "@" + filterOperator + "@" + selectedValues;
				// 				} else {
				// 					filterUrl = filterUrl + ",," + '"' + filterName + '"' + "@" + filterOperator + "@" + selectedValues;
				// 				}
				// 			}
				// 		}
				// 		if (i == 0)
				// 			filterUrlToAppend = filterUrl;
				// 		else {
				// 			if (filterUrl)
				// 				filterUrlToAppend += ",," + filterUrl
				// 			else
				// 				filterUrlToAppend = filterUrl;
				// 		}
				// 	}
				// }
				// if (filterUrlToAppend.length != 0)
				// 	finalFilter = "&$filter=" + filterUrlToAppend;
			} else {
				var filterUrlToAppend = "";
				filters = filterItems;
				// for (var i = 0; i < filterItems.length; i++) {
				// 	if (filterItems[0].filterParameter != undefined) {
				// 		filterName = filterItems[i].filterParameter
				// 		filterOperator = filterItems[i].filterOperator;
				// 		if (filterItems[i].filterDataType == "Edm.DateTime") {
				// 			var value1 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[2];
				// 			var value2 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[1];
				// 			var value3 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[0];
				// 			if (filterItems[i].filterParameterArr.length > 1) {
				// 				var value4 = filterItems[i].filterParameterArr[1].filterParameterValue.split("-")[2];
				// 				var value5 = filterItems[i].filterParameterArr[1].filterParameterValue.split("-")[1];
				// 				var value6 = filterItems[i].filterParameterArr[1].filterParameterValue.split("-")[0];
				// 				if (value1.length > 0 && value2.length > 0 && value3.length > 0 && value4.length > 0 && value5.length > 0 && value6.length >
				// 					0) {
				// 					/*filterUrl2 = "(year(" + filterName + ")" + " gt " + value1 + ")and(month(" + filterName + ")" +
				// 						" gt " + value2 + ")and(day(" + filterName + ") gt " + value3 + " and year(" + filterName + ")" + " lt " + value4 + ")and(month(" +
				// 						filterName + ")" + " lt " + value5 + ")and(day(" + filterName + ") lt " + value6 + ")";*/
				// 					/*	filterUrl2 = "year(" + filterName + ") gt " + value1 + " and month(" + filterName + ")" +
				// 						" gt " + value2 + " and day(" + filterName + ") gt " + value3 + " or year(" + filterName + ") lt " + value4 + " and month(" +
				// 						filterName + ") lt " + value5 + " and day(" + filterName + ") lt " + value6;*/
				// 					try {
				// 						var filterDate1 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[2] + "-" + filterItems[i].filterParameterArr[
				// 							0].filterParameterValue.split("-")[1] + "-" + filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[0];
				// 						var filterDate2 = filterItems[i].filterParameterArr[1].filterParameterValue.split("-")[2] + "-" + filterItems[i].filterParameterArr[
				// 							1].filterParameterValue.split("-")[1] + "-" + filterItems[i].filterParameterArr[1].filterParameterValue.split("-")[0];
				// 						filterUrl2 = filterName + " ge datetime" + "'" + filterDate1 + "'" + " and " + filterName + " le datetime" + "'" +
				// 							filterDate2 +
				// 							"'";
				// 					} catch (e) {}

				// 				}
				// 			} else {
				// 				if (value1.length > 0 && value2.length > 0 && value3.length > 0) {
				// 					filterUrl2 = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
				// 						" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
				// 				} else if (value4.length > 0 && value5.length > 0 && value6.length > 0) {
				// 					filterUrl2 = "(year(" + filterName + ")" + " eq " + value4 + ")and(month(" + filterName + ")" +
				// 						" eq " + value5 + ")and(day(" + filterName + ") eq " + value6 + ")";
				// 				}
				// 			}

				// 			// 		var value1 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[2];
				// 			// 		var value2 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[1];
				// 			// 		var value3 = filterItems[i].filterParameterArr[0].filterParameterValue.split("-")[0];
				// 			// 		if (value1 > 0 && value2.length > 0 && value3.length > 0) {
				// 			// 			filterUrl2 = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
				// 			// 				" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
				// 			// 		} else if (value1.length > 0 && value2.length > 0) {
				// 			// 			filterUrl2 = "(year(" + filterName + ") eq " + value1 + ")and(month(" + filterName + ")" + " eq " + value2 + ")";
				// 			// 		} else if (value2.length > 0 && value3.length > 0) {
				// 			// 			filterUrl2 = "(month(" + filterName + ")eq" + value2 + ")and(day(" + filterName + ")" + "eq" + value3 + ")";
				// 			// 		} else if (value1.length > 0 && value3.length > 0) {
				// 			// 			filterUrl2 = "(year(" + filterName + ")  eq " + value1 + ")and(day(" + filterName + ") eq " + value3 + ")";
				// 			// 		} else if (value1.length > 0) {
				// 			// 			filterUrl2 = "(year(" + filterName + ") eq " + value1 + ")";
				// 			// 		} else if (value2.length > 0) {
				// 			// 			filterUrl2 = "(month(" + filterName + ") eq " + value2 + ")";
				// 			// 		} else if (value3.length > 0) {
				// 			// 			filterUrl2 = "(day(" + filterName + ") eq " + value3 + ")";
				// 			// 		}
				// 		} else if (filterItems[i].filterOperator == "bw") {
				// 			var value1 = filterItems[i].getCells()[2].getItems()[0].getValue();
				// 			var value2 = filterItems[i].getCells()[2].getItems()[1].getValue();
				// 			if (value1.length > 0 && value2.length > 0) {
				// 				if (value1.indexOf(",") == (-1) && value2.indexOf(",") == (-1)) {
				// 					filterUrl2 = "(" + filterName + " gt " + "'" + value1 + "'" + ")and(" + filterName + " lt " +
				// 						"'" + value2 + "'" + ")";
				// 				} else {
				// 					var values1Len = value1.split(",");
				// 					for (var m = 0; m < values1Len.length; m++) {
				// 						values1Len[m] = values1Len[m].trim().replace(/\s/g, "%20");
				// 						if (m === 0) {
				// 							if (serviceURL.indexOf("sugar_odata") > -1)
				// 								filterValue1 = filterName + "='" + values1Len[0] + "'";
				// 							else
				// 								filterValue1 = "(" + filterName + " " + filterOperator + " '" + values1Len[0] + "')";
				// 						} else {
				// 							if (serviceURL.indexOf("sugar_odata") > -1)
				// 								filterValue1 = filterValue1 + "||" + filterName + "='" + values1Len[m] + "'";
				// 							else
				// 								filterValue1 = filterValue1 + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[m] + "')";
				// 						}
				// 					}
				// 					var values2Len = value2.split(",");
				// 					for (var k = 0; k < values2Len.length; k++) {
				// 						values1Len[k] = values2Len[k].trim().replace(/\s/g, "%20");
				// 						if (k === 0) {
				// 							if (serviceURL.indexOf("sugar_odata") > -1)
				// 								filterValue2 = filterName + "='" + values1Len[0] + "'";
				// 							else
				// 								filterValue2 = "(" + filterName + " " + filterOperator + " " + "'" + values1Len[0] + "')";
				// 						} else {
				// 							if (serviceURL.indexOf("sugar_odata") > -1)
				// 								filterValue2 = filterValue2 + "||" + filterName + "='" + values1Len[k] + "'";
				// 							else
				// 								filterValue2 = filterValue2 + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[k] + "')";
				// 						}
				// 					}
				// 					filterUrl2 = filterValue1 + "and" + filterValue2;
				// 				}
				// 			}
				// 		} else {
				// 			selectedFilterValues = filterItems[i].filterParameterArr;
				// 			for (var m = 0; m < selectedFilterValues.length; m++) {
				// 				if (isNaN(selectedFilterValues[m].filterParameterValue) === true) {
				// 					var selValue = selectedFilterValues[m].filterParameterValue.trim();
				// 				} else {
				// 					var selValue = selectedFilterValues[m].filterParameterValue;
				// 				}
				// 				if (m === 0) {
				// 					if (serviceURL.indexOf("sugar_odata") > -1)
				// 						filterUrl2 = filterName + "='" + selValue + "'";
				// 					else
				// 						filterUrl2 = "(" + filterName + " " + filterOperator + " " + "'" + selValue + "')";
				// 				} else {
				// 					if (serviceURL.indexOf("sugar_odata") > -1)
				// 						filterUrl2 = filterUrl2 + "||" + filterName + "='" + selValue + "'";
				// 					else
				// 						filterUrl2 = filterUrl2 + "or(" + filterName + " " + filterOperator + " " + "'" + selValue + "')";
				// 				}
				// 			}
				// 		}
				// 		filterUrl2 = "(" + filterUrl2 + ")"
				// 		if (filterUrlToAppend.length == 0) {
				// 			filterUrlToAppend = filterUrl2;
				// 		} else {
				// 			filterUrlToAppend = filterUrlToAppend + "and" + filterUrl2;
				// 		}
				// 	}
				// }
				console.log(filterUrlToAppend);
				filterUrl2 = filterUrlToAppend;
				if (filterUrl2.length != 0) {
					if (serviceURL.indexOf("sugar_odata") > -1)
						finalFilter = filterUrl2;
					else
						finalFilter = "&$filter=" + filterUrl2;
				}
			}
			var cardTitleStr = that.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = that.getView().byId("cardSubTitleId").getValue();
			if (!refreshButtonSelected && cardTitleStr.length <= 0) {
				sap.m.MessageToast.show("Please select General Information");
			}
			var excelFileId = "",
				dataSource = "service";
			if (this.fileUploaded === false) {
				this.newUrl = this.newUrl + filterParam;
				dataSource = "service";
			} else {
				serviceURL = that.getView().byId("setfileIdText").getText();
				var url = Services.config.metadataUrls.FileData.url;
				if (serviceURL == "Brevo")
					url = Services.config.metadataUrls.Data.url;
				var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
				excelFileId = parsedDataFromExcelModel.oData.id;
				//serviceURL = url + excelFileId;
				this.newUrl = url + excelFileId + filterParam;
				dataSource = "file";
			}
			var serivceEntity = that.getView().byId("entityId").getValue();
			if (cardTitleStr.length > 0 && serivceEntity.length <= 0) {
				sap.m.MessageToast.show("Please select Entity Type");
			}
			var reIntervalTime = that.getView().byId("refreshIntervalId").getValue();
			var numContent1 = that.getView().byId("numConVal1Id").getValue();
			var numContent2 = that.getView().byId("numConVal2Id").getValue();
			var predictiveIsOn = that.getView().byId("isPredictiveEnabled").getState();
			var selectedMeasures = cardTemplateThis.getView().byId("measureId").getSelectedItems();
			for (var i = 0; i < selectedMeasures.length; i++) {
				var object = selectedMeasures[i].getBindingContext().getObject();
				delete object["namespace"];
				delete object["___metadata"];
				mesurementValue.push(object);
				measureKeys.push(selectedMeasures[i].getBindingContext().getObject().COLUMN_NAME);
			}
			var allMeasures = cardTemplateThis.getView().byId("measureId").getSelectedItems();
			if (cardTemplateThis.dashboardType && cardTemplateThis.dashboardType == "R")
				allMeasures = cardTemplateThis.getView().byId("measureId").getItems();
			for (var i = 0; i < allMeasures.length; i++) {
				var object = allMeasures[i].getBindingContext().getObject();
				delete object["namespace"];
				delete object["___metadata"];
				allMesurementValue.push(object);
				allMeasureKeys.push(allMeasures[i].getBindingContext().getObject().COLUMN_NAME);
			}
			// 		measureKeys = cardTemplateThis.getView().byId("measureId").getSelectedItems();
			for (var i = 0; i < cardTemplateThis.getView().byId("dimensionId").getSelectedItems().length; i++) {
				dimensionValue.push(cardTemplateThis.getView().byId("dimensionId").getSelectedItems()[i].getBindingContext().getObject());
				dimensionKeys.push(cardTemplateThis.getView().byId("dimensionId").getSelectedItems()[i].getBindingContext().getObject().COLUMN_NAME)
			}
			// 		dimensionKeys = cardTemplateThis.getView().byId("dimensionId").getSelectedItems();

			var selectedChartColor = cardTemplateThis.getView().byId("colorText").getSelectedKey();

			if (that.chartName == "Table") {
				try {
					if (cardTemplateThis.cardInfo.columns == undefined) {
						var column1 = that.getView().byId("column1").getSelectedItem().getBindingContext().getObject();
						var column2 = that.getView().byId("column2").getSelectedItem().getBindingContext().getObject();
						var column3 = that.getView().byId("column3").getSelectedItem().getBindingContext().getObject();
					} else {
						var column1 = "";
						var column2 = "";
						var column3 = "";
					}
				} catch (e) {
					if (cardTemplateThis.getView().byId("addColumnId").getItems().length == 3) {
						var column1 = that.getView().byId("column1").getSelectedItem().getBindingContext().getObject();
						var column2 = that.getView().byId("column2").getSelectedItem().getBindingContext().getObject();
						var column3 = that.getView().byId("column3").getSelectedItem().getBindingContext().getObject();
					} else {
						var column1 = "";
						var column2 = "";
						var column3 = "";
					}
				}

			}
			// 		var property = that.getView().byId("geomapId").getSelectedKeys();
			// 		var parameterValue = that.getView().byId("parameterID").getValue();
			var property = [];
			var trgURLValue = that.getView().byId("trgURLID").getValue();
			var selectedEntitySet = that.entitySetRequired;
			var $select = "&$select="
			select = "&select=";
			var finalUrl = this.newUrl;
			var allProperties = [];
			// 		var mesurementValueState = cardTemplateThis.getView().byId("measureId").getValueState();
			// 		var dimensionValueState = cardTemplateThis.getView().byId("dimensionId").getValueState();
			if (cardTemplateThis.fileUploaded == false) {
				if (typeof cardTemplateThis.valueHelpRequestForFilter.getModel() == undefined) {
					cardTemplateThis.callServiceForFilter(false);
				} else if (cardTemplateThis.valueHelpRequestForFilter.getModel().oData.length == 0) {
					cardTemplateThis.callServiceForFilter(false);
				}
				allProperties = cardTemplateThis.valueHelpRequestForFilter.getModel().oData;
			} else {
				var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");
				allProperties = parsedDataFromExcelModel.oData.properties;
			}

			// Vaidation for card Submission. each required field is validted here.
			if (!refreshButtonSelected && cardTitleStr.length <= 0) {
				sap.m.MessageToast.show("Please provide General Information");
			} else if (cardTitleStr.length > 0 && serivceEntity.length <= 0) {
				sap.m.MessageToast.show("Please select Entity Type");
			} else if (that.chartName.length <= 0) {
				sap.m.MessageToast.show("Please select type of Chart");
			} //else if (that.chartName == "Table" && (column1.length <= 0 || column2.length <= 0 || column3.length <= 0)) {
			//	sap.m.MessageToast.show("Please provide mandatory details");
			//} 
			else if ((dimensionKeys <= 0 || measureKeys <= 0) && that.chartName != "Table" && that.chartName != "Scatter Chart" && that.chartName !=
				"Bubble Chart" && that.chartName != "Numeric Chart") {
				sap.m.MessageToast.show("Please Select Measure and Dimension");
			}
			// 		else if (cardTitleStr.length <= 0 || serviceURL.length <= 0 || mesurementValueState == "Error" || dimensionValueState == "Error") {
			// 			sap.m.MessageToast.show("Please provide mandtory details");
			// 		} 
			else {
				/*if (that.chartName == "Table") {
					//	$select = $select + column1.property + "," + column2.property + "," + column3.property + "&"
					$select = $select + column1.property + "," + column2.property + "," + column3.property + "&"
					select = select + column1.property + "," + column2.property + "," + column3.property;

				} */
				if (that.chartName == "Table") {
					var columnSelItems = cardTemplateThis.getView().byId("addColumnId").getItems();
					var tableUrlToAdd, columns = [];
					for (var a = 0; a < columnSelItems.length; a++) {
						var columnSelProperty = cardTemplateThis.getView().byId("addColumnId").getItems()[a].getContent()[0].getSelectedItem().getBindingContext()
							.getObject().COLUMN_NAME;
						columns.push(cardTemplateThis.getView().byId("addColumnId").getItems()[a].getContent()[0].getSelectedItem().getBindingContext()
							.getObject())
						if (a == 0)
							tableUrlToAdd = columnSelProperty
						else
							tableUrlToAdd += "," + columnSelProperty
					}
					$select = $select + tableUrlToAdd + "&"
					select = select + tableUrlToAdd;
				} else {
					if (dimensionKeys.length <= 0)
						$select = $select + allMeasureKeys.join(",");
					else
						$select = $select + allMeasureKeys.join(",") + "," + dimensionKeys.join(",");
				}
				if (dataSource == "file" && !Services.config.isMongo) {
					if (that.chartName != "Table") {
						if (measureKeys.length > 0)
							$select = "&selectM=" + measureKeys.join(",");
						if (dimensionKeys.length > 0)
							$select = $select + "&" + "selectD=" + dimensionKeys.join(",") + "&aggregate=true";
						finalUrl = this.newUrl + $select;
					} else {
						var spliturl = this.newUrl.split("xsjs?");
						var concaturl = spliturl[0] + "xsjs?aggregate=true&" + spliturl[1];
						finalUrl = concaturl + select;
						//finalUrl = this.newUrl;
					}
				}
				/*else
					finalUrl = finalUrl + $select;*/
				else {
					if (this.newUrl.indexOf("sugar_odata") > -1)
						finalUrl = finalUrl + select;
					else
						finalUrl = finalUrl + $select;
				}
				if (cardTemplateThis.sortItems != undefined) {
					if (cardTemplateThis.sortItems.length > 0) {
						var sortItems = cardTemplateThis.sortItems;
						if (cardTemplateThis.sortItems[0].sortOperator == "Descending")
							var typeOfSort = " desc"
						else
							var typeOfSort = ""
						if (dataSource == "service") {
							finalUrl = finalUrl + "&$orderby=" + cardTemplateThis.sortItems[0].selectedSortItem + typeOfSort;
						} else {
							if (cardTemplateThis.sortItems[0].sortOperator == "Ascending")
								var typeOfSort = " asc"
							finalUrl = finalUrl + "&sorting=true&orderby=" + cardTemplateThis.sortItems[0].selectedSortItem + typeOfSort;
						}
						//finalUrl = finalUrl + "&$orderby=" + cardTemplateThis.sortItems[0].selectedSortItem + typeOfSort;
					} else {
						var sortItems = [];
					}
				}
				/*if (cardTemplateThis.sortItems != undefined) {
				if (cardTemplateThis.sortItems.length > 0) {
					var sortItems = cardTemplateThis.sortItems;
					if (cardTemplateThis.sortItems[0].sortOperator == "DESCENDING")
						var typeOfSort = " desc"
					else
						var typeOfSort = ""
					finalUrl = finalUrl + "&$orderby=" + cardTemplateThis.sortItems[0].selectedSortItem + typeOfSort;
				} else {
					var sortItems = [];
				}
			}
*/
				console.log(finalUrl);
				if (refreshButtonSelected)
					if (dataSource == "file") {
						var oFilters = [];
						//oFilters = Brevo.Brevo_V2.util.Formatter.constructFilter(filters);
						//cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, that.chartName, oFilters);
						cardTemplateThis.constructCardConfig(finalUrl, dataSource);
					} else
						cardTemplateThis.constructCardConfig(finalUrl);
				else
				// that.saveCard(cardTitleStr, cardSubTitleStr, serviceURL, serivceEntity, reIntervalTime, numContent1, numContent2, filters,
				// 	mesurementValue, dimensionValue, column1,
				// 	column2, column3, property, parameterValue, trgURLValue, selectedEntitySet, finalUrl, excelFileId, dataSource, selectedChartColor,
				// 	dataSetLimit, isDataSetLimited,
				// 	isShowLabelsSet, allProperties);
					that.saveCard(cardTitleStr, cardSubTitleStr, serviceURL, serivceEntity, reIntervalTime, numContent1, numContent2, filters,
					mesurementValue, dimensionValue, column1, column2, column3, property, "",
					trgURLValue, selectedEntitySet, finalUrl, excelFileId, dataSource, selectedChartColor,
					dataSetLimit, isDataSetLimited,
					isShowLabelsSet, allProperties, navigationObj, sortItems, columns, predictiveIsOn, destination, allMesurementValue);
			}
		},
		// To fetch data for the final url which includes
		// filters,select and limit records,
		constructCardConfig: function (url, dataSource) {
			var finalUrl = url.replace("//", "/");
			finalUrl = finalUrl.replace("//", "/");
			finalUrl = finalUrl.replace("//", "/");
			cardTemplateThis.getView().setBusy(true);

			Services.callService("constructCardConfigModel", "constructCardConfigModel", finalUrl, "removeSericeURL", true, function (evt) {
				cardTemplateThis.getView().setBusy(false);
				if (dataSource == "file") {
					var info = sap.ui.getCore().getModel("constructCardConfigModel").oData;
					if (Array.isArray(info)) {
						sap.ui.getCore().getModel("constructCardConfigModel").setData({
							d: {
								results: info
							}
						});
					} else if (info.results) {
						sap.ui.getCore().getModel("constructCardConfigModel").setData({
							d: {
								results: sap.ui.getCore().getModel("constructCardConfigModel").getData().results
							}
						});
					} else {
						if (info.d) {
							var results = sap.ui.getCore().getModel("constructCardConfigModel").getData().d.results[1];
							if (results == undefined)
								results = sap.ui.getCore().getModel("constructCardConfigModel").getData().d.results;
							sap.ui.getCore().getModel("constructCardConfigModel").setData({
								d: {
									results: results
								}
							});
						} else if (info.indexOf("inconsistent datatype") > -1) {
							sap.m.MessageBox.error("Invalid  Measure: Please select measures of Numeric type");

							sap.ui.getCore().getModel("constructCardConfigModel").setData({
								d: {
									results: []
								}
							});
						} else {
							sap.m.MessageBox.error("Internal Error occured");
							sap.ui.getCore().getModel("constructCardConfigModel").setData({
								d: {
									results: []
								}
							});
						}
					}
				} else {
					var data = sap.ui.getCore().getModel("constructCardConfigModel").oData;
					try {
						if (Array.isArray(data)) {
							sap.ui.getCore().getModel("constructCardConfigModel").setData({
								d: {
									results: data
								}
							});
						} else {
							sap.ui.getCore().getModel("constructCardConfigModel").setData({
								d: {
									results: data.tables
								}
							});
						}
					} catch (e) {}
				}
				cardTemplateThis.entitySetDataModel = sap.ui.getCore().getModel("constructCardConfigModel");
				var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
				var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
				cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, cardTemplateThis.chartName, []);
			}, "", "");
		},
		// To draw the charts and table
		refreshPreviewCard: function (cardTitleStr, cardSubTitleStr, chartName, oFilters) {
			var that = this;
			var dimensionValue = [];
			var mesurementValue = [];
			var labelsSelected = that.getView().byId("isShowLabelsSet").getSelected();
			var selectedMeasures = that.getView().byId("measureId").getSelectedItems();
			var selectedDimension = that.getView().byId("dimensionId").getSelectedItems();
			for (var i = 0; i < selectedMeasures.length; i++) {
				var object = selectedMeasures[i].getBindingContext().getObject();
				mesurementValue.push(object);
			}
			for (var i = 0; i < selectedDimension.length; i++) {
				var object = selectedDimension[i].getBindingContext().getObject();
				dimensionValue.push(object);
			}
			var decimalPlaces = that.getView().byId("decimalPlacesId").getValue();
			if (decimalPlaces) {
				that.selectedDecimalValues = decimalPlaces;
			} else {
				that.selectedDecimalValues = "";
			}
			if (!that.entitySetDataModel)
				that.entitySetDataModel = new sap.ui.model.json.JSONModel({});
			var data = [];
			try {
				data = that.entitySetDataModel.getData().d.results;
			} catch (e) {}
			var measureModel = this.getView().byId("measureId").getModel();
			var allProperties = [];
			if (measureModel.getData() && measureModel.getData().length > 0)
				allProperties = measureModel.getData();
			var oModel = new sap.ui.model.json.JSONModel({
				"dimension": dimensionValue,
				"measures": mesurementValue,
				"customMeasures": "",
				"isShowLabels": labelsSelected,
				"measureFormat": that.selectedMeasureFormat,
				"decimalValue": that.selectedDecimalValues,
				"xAxisLabel": that.getView().byId("xAxisLabelId").getValue(),
				"yAxisLabel": that.getView().byId("yAxisLabelId").getValue(),
				"selectedChartColor": that.getView().byId("colorText").getSelectedKey(),
				"manualColors": that.manualColors,
				"data": data,
				"cardType": chartName,
				"allProperties": allProperties
			});
			previewCard.getView().byId("ChartTitle").setText(cardTitleStr);
			previewCard.getView().byId("ChartSubTitle").setText(cardSubTitleStr);
			var serviceURL = that.getView().byId("fileId").getText();
			previewCard.getView().byId("graphListId").setVisible(false);
			previewCard.getView().byId("geoMapLayoutId").setVisible(false);
			previewCard.getView().byId("previewChartBoxId").setVisible(false);
			previewCard.getView().byId("vizChartBoxId").setVisible(false);
			previewCard.getView().byId("errorText").setVisible(false);
			previewCard.getView().byId("numericChartBoxId").setVisible(false);
			cardTemplateThis.getView().byId("DimensionPanel").setVisible(false);
			cardTemplateThis.getView().byId("measurePanel").setVisible(false);
			cardTemplateThis.getView().byId("columnVboxId").setVisible(false);
			cardTemplateThis.getView().byId("column1panel").setVisible(false);
			cardTemplateThis.getView().byId("column2panel").setVisible(false);
			cardTemplateThis.getView().byId("column3panel").setVisible(false);
			if (chartName == "Table") {
				previewCard.getView().byId("graphListId").setVisible(true);
				cardTemplateThis.getView().byId("columnVboxId").setVisible(true);
				cardTemplateThis.getView().byId("column1panel").setVisible(true);
				cardTemplateThis.getView().byId("column2panel").setVisible(true);
				cardTemplateThis.getView().byId("column3panel").setVisible(true);
				//previewCard.getView().setBusy(true);
				var id = "#" + previewCard.getView().byId("graphListId").sId;

				var columnItems = cardTemplateThis.getView().byId("addColumnId").getItems();
				var columnItemsArr = [],
					columnToAddArr = [];
				previewCard.getView().byId("graphListId").removeAllColumns();
				for (var i = 0; i < columnItems.length; i++) {
					var particularColumnItem = cardTemplateThis.getView().byId("addColumnId").getItems()[i].getContent()[0].getSelectedItem().getBindingContext()
						.getObject();
					columnItemsArr.push(particularColumnItem);
				}
				for (var j = 0; j < columnItemsArr.length; j++) {
					var getTableTitle = Brevo.Brevo_V2.util.Formatter.columnCustomLabel(columnItemsArr[j]);
					var tableColumn = new sap.m.Column({
						header: new sap.m.ObjectIdentifier({
							title: getTableTitle
						})
					})
					previewCard.getView().byId("graphListId").addColumn(tableColumn);
				}

				for (var k = 0; k < columnItemsArr.length; k++) {

					var colName = columnItemsArr[k].COLUMN_NAME;
					var columnToAdd = new sap.m.ObjectIdentifier({
						text: {
							parts: [{
								path: colName
							}],
							formatter: function (colName) {
								if (colName) {
									if (this.mBindingInfos.text.binding)
										var bindingPath = this.mBindingInfos.text.binding.sPath;
									for (var g = 0; g < columnItemsArr.length; g++) {
										if (columnItemsArr[g].COLUMN_NAME == bindingPath) {
											var columnData = columnItemsArr[g];
											break;
										}
									}
									var formattedData = cardTemplateThis.formatTableData(colName, columnData);
									return formattedData;
								} else return colName;
							}
						}
					})
					columnToAddArr.push(columnToAdd);
				}
				//previewCard.getView().byId("graphListId").setModel(oModel);
				previewCard.getView().byId("graphListId").bindAggregation("items", {
					path: '/data',
					filters: oFilters,
					template: new sap.m.ColumnListItem({
						cells: columnToAddArr
					})
				})
				previewCard.getView().byId("graphListId").setModel(oModel);
				previewCard.getView().setBusy(false);
			} else if (chartName == "Geo Map") {
				previewCard.getView().byId("geoMapLayoutId").setVisible(true);
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
				cardTemplateThis.getView().byId("measurePanel").setVisible(true);
				var view = previewCard.getView().byId("geoMapLayoutId");
				DrawVizChart.loadGeoMap(oModel, view);
			} else if (chartName == "Heat Map" || chartName == "Bullet" || chartName == "Waterfall" || chartName == "Column Chart" ||
				chartName ==
				"Stacked Column" || chartName == "Scatter Chart" || chartName == "Bubble Chart" || chartName == "Line Chart" || chartName ==
				"Stacked Combination" || chartName == "Donut Chart" || chartName == "Pie Chart" || chartName == "Bar Chart" || chartName ==
				"Stacked Bar") {
				previewCard.getView().byId("previewChartBoxId").setVisible(true);
				previewCard.getView().byId("vizChartBoxId").setVisible(true);
				previewCard.getView().byId("errorText").setVisible(true);
				previewCard.getView().byId("chartContainer").setVisible(true);
				that.getView().byId("DimensionPanel").setVisible(true);
				that.getView().byId("measurePanel").setVisible(true);
				var view = previewCard.getView().byId("idVizFrameCombination");
				window.setTimeout(function () {
					DrawVizChart.drawVizCharts(oModel, view);
				}, 1000);
			} else if (chartName == "Numeric Chart") {
				previewCard.getView().byId("numericChartBoxId").setVisible(true);
				that.getView().byId("measurePanel").setVisible(true);
				var view = previewCard.getView().byId("numericChartBoxId");
				window.setTimeout(function () {
					DrawVizChart.drawNumericCharts(oModel, view);
				}, 1000);
			} else if (chartName == "Report Table") {
				that.getView().byId("DimensionPanel").setVisible(true);
				that.getView().byId("measurePanel").setVisible(true);
				previewCard.getView().byId("geoMapLayoutId").setVisible(true);
				var view = previewCard.getView().byId("numericChartBoxId");
				window.setTimeout(function () {
					DrawPivotTable.drawTableWithCurrentData("territoryMap", oModel.getData(), [], [], view);
				}, 1000);
			} else {
				previewCard.getView().byId("chartContainer").setVisible(true);
				previewCard.getView().byId("previewChartBoxId").setVisible(true);
				cardTemplateThis.getView().byId("DimensionPanel").setVisible(true);
				cardTemplateThis.getView().byId("measurePanel").setVisible(true);
				window.setTimeout(function () {
					var id = previewCard.getView().byId("chartContainer").sId;
					var chartContent = DrawVizChart.drawdonutChart(id, chartName, chartObject.oData, oModel);
					chartContent.draw();
				}, 1000);
			}
		},
		// To call POST and PUT service
		saveCard: function (cardTitleStr, cardSubTitleStr, serviceURL, serivceEntity, reIntervalTime, numContent1, numContent2, filters,
			mesurementValue, dimensionValue, column1,
			column2, column3, property, parameterValue, trgURLValue, selectedEntitySet, finalUrl, excelFileId, dataSource, selectedChartColor,
			dataSetLimit, isDataSetLimited,
			isShowLabelsSet, allProperties, navigationObj, sortItems, columns, predictiveIsOn, destination, allMesurementValue) {
			var configId;
			var that = this;
			var CardConfiguration;
			try {
				dataSetLimit = parseInt(dataSetLimit);
			} catch (e) {
				dataSetLimit = 999999;
			}
			dataSetLimit = dataSetLimit + "";
			finalUrl = finalUrl.replace("//", "/");
			finalUrl = finalUrl.replace("//", "/");
			finalUrl = finalUrl.replace("//", "/");
			var cardInfo = {
				"cardType": that.chartName,
				"cardTitle": cardTitleStr,
				"cardSubtitle": cardSubTitleStr,
				"serviceURL": serviceURL,
				"destination": destination ? destination : "",
				"Entity": serivceEntity,
				"ris": reIntervalTime,
				"numContent1": numContent1,
				"numContent2": numContent2,
				"measures": mesurementValue,
				"dimension": dimensionValue,
				"column1": column1,
				"column2": column2,
				"column3": column3,
				"property": property,
				"filters": filters,
				"parameters": that.navHash,
				"targetURL": trgURLValue,
				"EntitySet": selectedEntitySet,
				"finalUrl": dataSource == "file" ? finalUrl : "",
				"excelFileId": excelFileId,
				"dataSource": dataSource,
				"selectedChartColor": selectedChartColor,
				"manualColors": that.manualColors,
				"dataSetLimit": dataSetLimit,
				"isDataSetLimited": isDataSetLimited,
				"isShowLabels": isShowLabelsSet,
				"allProperties": allProperties,
				"navigation": navigationObj,
				"sorters": sortItems,
				"predictiveIsOn": predictiveIsOn,
				"columns": columns,
				"measureFormat": that.selectedMeasureFormat,
				"decimalValue": that.selectedDecimalValues,
				"xAxisLabel": that.getView().byId("xAxisLabelId").getValue(),
				"yAxisLabel": that.getView().byId("yAxisLabelId").getValue(),
				"allMesurementValue": allMesurementValue
			}
			var method = "POST";
			var random = Math.round(Math.random() * 1000000);
			var configId = random;
			var Url = Services.config.metadataUrls.Cards.create;
			if (that.isUpdate) {
				configId = that.chartConfigId;
				method = "PUT";
				Url = Services.config.metadataUrls.Cards.update(configId);
				that.pageCreated = false
			} else {
				var random = Math.round(Math.random() * 1000000);
				configId = random;
				method = "POST";
				Url = Services.config.metadataUrls.Cards.create;
				that.pageCreated = true;
			}
			var postCardInfo = {
				"Configid": parseInt(configId + ""),
				"Configuration": JSON.stringify(cardInfo),
				"Page_Id": parseInt(that.pageId)
			}
			var cardsModel = sap.ui.getCore().getModel("cardListModel").oData;
			if (method == "PUT") {
				for (var i = 0; i < cardsModel.length; i++) {
					if (configId == cardsModel[i].Configid) {
						cardsModel[i].Configuration = (JSON.stringify(cardInfo));
					}
				}
			} else {
				if (cardsModel && Array.isArray(cardsModel))
					cardsModel.push(postCardInfo);
				else {
					cardsModel.setData([postCardInfo]);
				}
			}
			var bus = sap.ui.getCore().getEventBus();
			Services.callCreateService(Url, JSON.stringify(postCardInfo), method, function (evt, sucessFlag, oError) {
				if (sucessFlag) {
					cardTemplateThis.removeContent();
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("MainWithRefreshId", {
						"pageId": that.pageId,
						"refreshId": configId
					});
				} else {
					sap.m.MessageToast.show("Unable to save, try again later.");
				}
			});
		},
		// To add a new destination in the cockpit
		goToCockpit: function () {
			window.open("https://account.hana.ondemand.com/cockpit");
		},
		// To display card title in the preview card
		handleTitleInput: function () {
			var value = this.getView().byId("cardTitleId").getValue();
			if (value.length > 0) {
				this.getView().byId("cardTitleId").setValueState("None");
				cardTemplateThis.getView().byId("menuItem3").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				cardTemplateThis.getView().byId("menuItem3").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			} else {
				this.getView().byId("cardTitleId").setValueState("Error");
				cardTemplateThis.getView().byId("menuItem3").aCustomStyleClasses[1] = "invalid";
				cardTemplateThis.getView().byId("menuItem3").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
				cardTemplateThis.getView().byId("menuItem3").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
			}
			previewCard.getView().byId("ChartTitle").setText(value);
		},
		//for adding css for data column list item after selecting
		handleEntityInput: function (evt) {
			if (evt.oSource.getValue().length > 0) {
				var existingClass = cardTemplateThis.getView().byId("menuItem4").aCustomStyleClasses;
				for (var i = 0; i < existingClass.length; i++) {
					var styleName = cardTemplateThis.getView().byId("menuItem4").aCustomStyleClasses[i];
					cardTemplateThis.getView().byId("menuItem4").removeStyleClass(styleName);
				}
				cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding valid customMenuItem");
			} else {
				var existingClass = cardTemplateThis.getView().byId("menuItem4").aCustomStyleClasses;
				for (var i = 0; i < existingClass.length; i++) {
					var styleName = cardTemplateThis.getView().byId("menuItem4").aCustomStyleClasses[i];
					cardTemplateThis.getView().byId("menuItem4").removeStyleClass(styleName);
				}
				cardTemplateThis.getView().byId("menuItem4").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
			}
		},
		// To display card subtitle in the preview card
		handleSubTitleInput: function (evt) {
			previewCard.getView().byId("ChartSubTitle").setText(evt.oSource.getValue());
		},
		// To display numeric content in the preview card
		handleNumInput: function (evt) {
			previewCard.getView().byId("numConBoxId").getItems()[0].setText(evt.oSource.getValue());
		},
		handleNumInput1: function (evt) {
			previewCard.getView().byId("numConBoxId").getItems()[1].setText(evt.oSource.getValue());
		},
		//selection of scale
		handleScaleSelection: function (evt) {
			var selectedscale = evt.oSource.getSelectedItem().getKey();
			var sPath = evt.getSource().getBindingContext().sPath;
			var model = evt.getSource().getModel();
			model.setProperty(sPath + "/aggregationType", selectedscale);
			/*	var decimalValue = evt.oSource.oParent.oParent.mAggregations.formElements[1].mAggregations.fields[0].getValue();
				if (selectedscale == "percent") {
					evt.oSource.oParent.oParent.mAggregations.formElements[3].getFields()[0].setValue("%");
				} else if (selectedscale == "thousand") {
					evt.oSource.oParent.oParent.mAggregations.formElements[3].getFields()[0].setValue("K");
				} else if (selectedscale == "million") {
					evt.oSource.oParent.oParent.mAggregations.formElements[3].getFields()[0].setValue("M");
				} else {
					evt.oSource.oParent.oParent.mAggregations.formElements[3].getFields()[0].setValue("B");
				}
				cardTemplateThis.selectedMeasureType = [];*/
			/*var items = evt.oSource.oParent.oParent.mAggregations.formElements[3].mAggregations.fields[1].getItems();
			for (var i = 0; i < items.length; i++) {
				var tableitems = items[i].getBindingContext().oModel.getObject(items[i].getBindingContext().sPath);
				if (tableitems.property == this.selectedval) {
					var tempObject = items[i].getBindingContext().oModel.getObject(items[i].getBindingContext().sPath);
					tempObject.measureFormat = selectedscale;
					tempObject.decimalPlaces = decimalValue;
					tempObject.measureType = items[i].getCells()[1].getSelectedKey();
					cardTemplateThis.tempObject = tempObject;
					break;
				}
			}*/
			/*var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, cardTemplateThis.chartName);*/

			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			cardTemplateThis.selectedMeasureFormat = evt.oSource.getSelectedItem().getKey();
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, cardTemplateThis.chartName);
		},

		// To pass the selected measures,dimensions and columns to
		// the chart and table
		handleSelectionChange: function (evt) {
			var that = this;
			try {
				if (evt.mParameters.selected == true) {
					evt.mParameters.listItem.getContent()[0].getContent()[2].setVisible(true);
				} else {
					evt.mParameters.listItem.getContent()[0].getContent()[2].setVisible(false);
				}
			} catch (e) {}
			if (evt)
				var selVal = evt.mParameters.listItem;
			else
				selVal = "";
			var showLabels = that.getView().byId("isShowLabelsSet").getSelected();
			that.getView().byId("isShowLabelsSet").setSelected(showLabels);

			var key = this.getView().byId("colorText").getSelectedKey();
			var cardTitleStr = that.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = that.getView().byId("cardSubTitleId").getValue();
			if (this.chartName == "Numeric Chart") {
				this.getView().byId("dimensionId").removeSelections();
			}
			if (this.chartName != "Table" && this.chartName != "Geo Map") {
				previewCard.getView().byId("graphListId").setVisible(false);
				var selectedMeasures = this.getView().byId("measureId").getSelectedItems();
				var selectedDimensions = this.getView().byId("dimensionId").getSelectedItems();
				if (selectedMeasures.length > 0 && selectedDimensions.length > 0) {
					that.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
					that.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				}
				that.getView().byId("formattingId").setVisible(true);
				that.getView().byId("tableId").setVisible(false);
				that.getView().byId("sid").setVisible(false);
				this.handleValueState(handleMeasures(this.chartName, selectedMeasures.length), handleDimension(this.chartName,
						selectedDimensions.length),
					selVal);
			}
			if (this.chartName == "Table") {
				that.getView().byId("formattingId").setVisible(false);
				that.getView().byId("tableId").setVisible(true);
				that.getView().byId("sid").setVisible(true);
				that.getView().byId("columnVboxId").setVisible(true);
				previewCard.getView().byId("graphListId").setVisible(true);
				previewCard.getView().byId("errorText").setVisible(false);
				that.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				that.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				var col1 = that.getView().byId("column1").getSelectedKey().length;
				var col2 = that.getView().byId("column2").getSelectedKey().length;
				var col3 = that.getView().byId("column3").getSelectedKey().length;
				//if (col1 == 0 || col2 == 0 || col3 == 0) return;
				var colNo = 1;
				var colArr = [];
				that.setstatus();
				var columnSelItems = that.getView().byId("addColumnId").getItems();
				for (var e = 0; e < columnSelItems.length; e++) {
					var columnSelProperty = that.getView().byId("addColumnId").getItems()[e].getContent()[0].getSelectedItem().getBindingContext()
						.getObject();
					if (typeof columnSelProperty["customLabel"] === "undefined")
						columnSelProperty["customLabel"] = "";

					columnSelProperty["colNum"] = "Column " + colNo;

					colArr.push(columnSelProperty);
					colNo++;

				}

				var formatModel = new sap.ui.model.json.JSONModel();
				formatModel.setData(colArr);
				that.getView().byId("tableId").setModel(formatModel);
				that.handleChangeCard(true);

			}
			var semantiColors = ['#d32030', '#e17b24', '#61a656', '#848f94'];
			var defaultColors = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
			if (key == "Manual_Color") {

				that.getView().byId("colorValues").setEnabled(true);
				that.getView().byId("colorText").setSelectedKey(key);
				this.onColorAdded();
			} else {
				that.getView().byId("colorValues").removeAllTokens();
				that.getView().byId("colorText").setSelectedKey(key);
				// 	
				if (key == "Semantic_Color" || key == "") {

					cardTemplateThis.getView().byId("colorValues").setEnabled(false);
					for (var i = 0; i < semantiColors.length; i++) {

						cardTemplateThis.getView().byId("colorValues").addToken(new sap.m.Token({
							key: semantiColors[i],
							text: semantiColors[i]
						}));
					}
				} else if (key == "Default_Color") {
					cardTemplateThis.getView().byId("colorValues").setEnabled(false);

					for (var i = 0; i < defaultColors.length; i++) {

						cardTemplateThis.getView().byId("colorValues").addToken(new sap.m.Token({
							key: defaultColors[i],
							text: defaultColors[i]
						}));
					}
				}

			}
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, this.chartName);
		},
		setstatus: function () {
			var oModel2 = new sap.ui.model.json.JSONModel();
			var temp = {

				colNum: false,
				colNum1: false,
				colNum2: false

			};
			oModel2.setData(temp);
			//s	cardTemplateThis.getView().setModel(oModel2, "visimod");
		},

		handleChangeinVBox: function (evt) {
			var showLabels = cardTemplateThis.getView().byId("isShowLabelsSet").getSelected();
			cardTemplateThis.getView().byId("isShowLabelsSet").setSelected(showLabels);
			var key = cardTemplateThis.getView().byId("colorText").getSelectedKey();
			cardTemplateThis.getView().byId("colorText").setSelectedKey(key);
			var semantiColors = ['#d32030', '#e17b24', '#61a656', '#848f94'];
			var defaultColors = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"];
			if (key == "Manual_Color") {

				cardTemplateThis.getView().byId("colorValues").setEnabled(true);
				this.onColorAdded();
			} else {

				cardTemplateThis.getView().byId("colorValues").removeAllTokens();
				if (key == "Semantic_Color") {

					cardTemplateThis.getView().byId("colorValues").setEnabled(false);
					for (var i = 0; i < semantiColors.length; i++) {
						cardTemplateThis.getView().byId("colorValues").addToken(new sap.m.Token({
							key: semantiColors[i],
							text: semantiColors[i]
						}));

					}
				} else if (key == "Default_Color") {

					cardTemplateThis.getView().byId("colorValues").setEnabled(false);
					for (var i = 0; i < defaultColors.length; i++) {
						cardTemplateThis.getView().byId("colorValues").addToken(new sap.m.Token({
							key: defaultColors[i],
							text: defaultColors[i]
						}));

					}
				}

			}
			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			if (this.chartName != "Table" || this.chartName != "Geo Map") {
				previewCard.getView().byId("graphListId").setVisible(false);
				var selectedMeasures = this.getView().byId("measureId").getSelectedItems();
				var selectedDimensions = this.getView().byId("dimensionId").getSelectedItems();
				if (selectedMeasures.length > 0 && selectedDimensions.length > 0) {
					cardTemplateThis.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
					cardTemplateThis.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				}
				//this.getView().byId("measureId").setValueState(handleMeasures(this.chartName, selectedMeasures.length));
				//this.getView().byId("dimensionId").setValueState(handleDimension(this.chartName, selectedDimensions.length));
				this.handleValueState(handleMeasures(this.chartName, selectedMeasures.length), handleDimension(this.chartName,
					selectedDimensions.length));
			}
			if (this.chartName == "Table") {
				previewCard.getView().byId("graphListId").setVisible(true);
				previewCard.getView().byId("errorText").setVisible(false);
				cardTemplateThis.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				cardTemplateThis.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				var col1 = cardTemplateThis.getView().byId("column1").getSelectedKey().length;
				var col2 = cardTemplateThis.getView().byId("column2").getSelectedKey().length;
				var col3 = cardTemplateThis.getView().byId("column3").getSelectedKey().length;
				if (col1 == 0 || col2 == 0 || col3 == 0) return;

			}
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, this.chartName);
		},
		loadCardDataForTable: function (cardModel, url, previewCard) {
			var that = this;
			var cardInfo = cardModel.getData();
			Services.callService("cardDataModel" + cardInfo.confiId, "ZQ_Q_PQMP01_ODATA_001Results.json", url, true, true,
				function (evt) {
					var dataModel = sap.ui.getCore().getModel("cardDataModel" + cardInfo.confiId);
					if (cardInfo.dataSource === "file")
						cardModel.getData()["data"] = dataModel.getData().results;
					else
						cardModel.getData()["data"] = dataModel.getData();
					previewCard.getView().byId("graphListId").setModel(cardModel);
				});
		},
		// To check propoer measures and dimensions before drawing
		// chart
		handleValueState: function (status1, status2, selection) {
			var selectedMeasures = this.getView().byId("measureId").getSelectedItems();
			var selectedDimensions = this.getView().byId("dimensionId").getSelectedItems();
			if ((status1 == "Error") || (status2 == "Error")) {
				if (status1 == "Error") {
					this.getView().byId("measureText").setText("Please select " + this.measureLen + " measure.");
					if (selectedMeasures.length > this.measureLen) {
						/*for (var i = selectedMeasures.length - 1; i > this.measureLen - 1; i--)
							{
							selectedMeasures[i].setSelected(false);
							}*/
						selection.setSelected(false);
						//selectedMeasures[i].setSelected(false); 
					}
				}
				if (status2 == "Error") {
					this.getView().byId("dimensionText").setText("Maximum dimensions equals to " + this.dimensionLen + " .Please select " + this.dimensionLen +
						" dimension.");
					if (selectedDimensions.length > this.dimensionLen) {
						/*for (var i = selectedDimensions.length - 1; i > this.dimensionLen - 1; i--)
							{
							selectedDimensions[i].setSelected(false);
							}*/
						selection.setSelected(false);
						//selection.setSelected(true);
					}
				}

				cardTemplateThis.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding valid customMenuItem");
				cardTemplateThis.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding invalid customMenuItem");
				previewCard.getView().byId("idVizFrameCombination").setVisible(false);
				previewCard.getView().byId("vizChartBoxId").setVisible(false);
				previewCard.getView().byId("errorText").setVisible(true);
				return;
				//this.handleSelectionChange();
			} else if ((status1 == "Success") && (status2 == "Success")) {
				cardTemplateThis.getView().byId("menuItem6").removeStyleClass("sapUiResponsivePadding invalid customMenuItem");
				cardTemplateThis.getView().byId("menuItem6").addStyleClass("sapUiResponsivePadding valid customMenuItem");
				previewCard.getView().byId("idVizFrameCombination").setVisible(true);
				previewCard.getView().byId("vizChartBoxId").setVisible(true);
				previewCard.getView().byId("errorText").setVisible(false);
			}
		},
		// on entering the new color
		onNewColorAdded: function (evt) {
			var value = evt.oSource.getValue();
			if (value.indexOf(" ") > -1) {
				this.onColorAdded();
			}
		},
		// to add tokens when user clicks enter on adding manual
		// colors in multi input box
		onColorAdded: function () {
			var value = cardTemplateThis.getView().byId("colorValues").getValue();
			if (value == "") {
				value = cardTemplateThis.getView().byId("colorValues").getValue();
			}
			if (value.length > 0) {
				if (value.indexOf(" ") > -1) {
					var value = value.slice("0", value.length - 1);
				}

				cardTemplateThis.getView().byId("colorValues").addToken(new sap.m.Token({
					key: value,
					text: value
				}));
			}
			var keys = this.getView().byId("measureId").getSelectedItems().length;
			var tokens = cardTemplateThis.getView().byId("colorValues").getTokens();
			this.manualColors = [];
			if (tokens.length < keys) {

				cardTemplateThis.getView().byId("colorValues").setValueState("Error");
			} else {
				for (var i = 0; i < tokens.length; i++) {
					this.manualColors.push(tokens[i].getKey());
				}
				cardTemplateThis.getView().byId("colorValues").setValueState("None");
				var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
				var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
				cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, this.chartName);
			}
			cardTemplateThis.getView().byId("colorValues").setValue();
		},
		// once tokens are removed and to call function with new
		// maual colors

		onTokensChange: function (evt) {
			var type = evt.mParameters.type;
			var rToken = evt.mParameters.token;
			var key = cardTemplateThis.getView().byId("colorText").getSelectedKey();
			var tokens = cardTemplateThis.getView().byId("colorValues").getTokens();
			if (type == "removed" && key == "Manual_Color") {
				for (var i = 0; i < tokens.length; i++) {
					if (tokens[i].mProperties.key == rToken.mProperties.key) {
						cardTemplateThis.getView().byId("colorValues").removeToken(tokens[i]);
					}

				}
				this.onColorAdded();
			}
		},
		onValueHelpRequestForDataRecords: function (evt) {
			//cardTemplateThis.ValueHelpForDataRecords.getContent()[0].backToTop();
			this.valueHelpRequestForEntity.close();
			cardTemplateThis.ValueHelpForFiles.close();
			cardTemplateThis.ValueHelpForDataRecords.openBy(evt);

		},
		handleDataSrcConfirm: function (evt) {
			var value = evt.oSource.getTitle();
			cardTemplateThis.ValueHelpForDataRecords.setBusy(true);

			// url -->
			// ;mo/CatalogsSet?$expand=QueryInfoSet&$filter=SAP__Origin
			// eq 'SQWCLNT700'
			Services.callService("dataSrcSystem", jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/neo-app.json",
				";mo/CatalogsSet?$expand=QueryInfoSet&$filter=SAP__Origin eq '" + value + "'",
				"removeSericeURL", "false",
				function (evt) {
					cardTemplateThis.ValueHelpForDataRecords.setBusy(false);
					var model = sap.ui.getCore().getModel("dataSrcSystem");
					cardTemplateThis.ValueHelpForDataRecords.getContent()[0].getPages()[1].setModel(model);
					var app = cardTemplateThis.ValueHelpForDataRecords.getContent()[0];
					app.to(cardTemplateThis.ValueHelpForDataRecords.getContent()[0].getPages()[1]);
					// cardTemplateThis.ValueHelpForServiceUrlNew.setModel(urlListJSON);
				});
		},
		onDataRecordBackPress: function () {
			var app = cardTemplateThis.ValueHelpForDataRecords.getContent()[0];
			app.back();
		},
		OnNavigate: function () {
			var object = cardTemplateThis.carddata;
			var pageId = cardTemplateThis.pageId;
			var cardId = cardTemplateThis.chartConfigId;
			if (cardTemplateThis.isEditMode) {
				window.location.hash = "#analyticsbuilder-Display?Page_Id=" + pageId + "&card_Id=" + cardId;
			} else {
				window.location.hash = "#analyticsbuilder-Display?Page_Id=" + pageId;
			}
		},
		onMeasureSettingPress: function (evt) {
			var object = evt.getSource().getBindingContext().getObject();
			var aggregationTypeSelect = sap.ui.getCore().byId("aggregationTypeSelect");
			if (!object.aggregationType)
				object.aggregationType = "Sum";
			aggregationTypeSelect.setSelectedKey(object.aggregationType);
			this.valueHelpForMeasureSettings.setModel(evt.getSource().getBindingContext().getModel());
			this.valueHelpForMeasureSettings.setBindingContext(evt.getSource().getBindingContext());
			this.valueHelpForMeasureSettings.openBy(evt.oSource.oParent.oParent.oParent);
		},
		//To open measure settings popup
		onMeasureSettingPressN: function (evt) {
			this.selectedval = evt.oSource.oParent.getContent()[0].getText();
			var oModel = new sap.ui.model.json.JSONModel();
			var settingsData = [];
			var selectedMeasures = this.getView().byId("measureId").getSelectedItems();
			var selectedFormat;
			for (var i = 0; i < selectedMeasures.length; i++) {
				var tempObject = selectedMeasures[i].getBindingContext().getObject();
				if (!this.fetchMeasuresFromEditData) {
					tempObject.measureType = DrawVizChart.getDefaultMeasureSetting(cardTemplateThis.chartName, i);
					selectedFormat = tempObject.measureFormat;
				} else {
					for (var j = 0; j < cardTemplateThis.cardInfo.measures.length; j++) {
						if (tempObject.property == cardTemplateThis.cardInfo.measures[j].property) {
							tempObject.measureType = cardTemplateThis.cardInfo.measures[j].measureType;
							selectedFormat = tempObject.measureFormat;
							break;
						}
					}
					if (j >= cardTemplateThis.cardInfo.measures.length)
						tempObject.measureType = DrawVizChart.getDefaultMeasureSetting(cardTemplateThis.chartName, i);
				}
				settingsData.push(tempObject);
			}
			oModel.setData(settingsData);
			cardTemplateThis.valueHelpForMeasureSettings.setModel(oModel);
			cardTemplateThis.ValueHelpForMeasureChartTypeSelection.getContent()[0].setVisible(Brevo.Brevo_V2.util.Formatter.isMeasureSettingVisible(
				this.chartName));
			//this.ValueHelpForMeasureChartTypeSelection.open();
			//cardTemplateThis.valueHelpForMeasureSettings.getContent()[0].backToTop();
			//	var selectedObject = evt.oSource.oParent.mAggregations.content[0].getBindingContext().getObject();
			//	cardTemplateThis.valueHelpForMeasureSettings.setModel(selectedObject);
			cardTemplateThis.valueHelpForMeasureSettings.openBy(evt.oSource.oParent.oParent.oParent);
		},
		//on selection of Restricted measure in measures
		handleRestrictedMeasure: function (evt) {
			cardTemplateThis.valueHelpForRestrictedMeasure.openBy(evt.oSource.oParent.oParent);
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[0].setVisible(false);
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[1].setVisible(true);
			var measureModel = this.getView().byId("measureId").getModel();
			var dimensionModel = this.getView().byId("dimensionId").getModel();
			//cardTemplateThis.valueHelpForRestrictedMeasure.setModel(measureModel);
			cardTemplateThis.valueHelpForRestrictedMeasure.getCustomHeader().mAggregations.content[2].setText("Restricted Measure Settings");
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[1]._aElements[7].setModel(measureModel);
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[1]._aElements[9].setModel(dimensionModel);

		},
		onValueHelpRequestForYear: function (evt) {
			cardTemplateThis.oButton = evt.getSource();
			cardTemplateThis.ValueHelpForYearSelection.openBy(cardTemplateThis.oButton);
		},
		onValueHelpRequestForMonth: function (evt) {
			cardTemplateThis.oButton = evt.getSource();
			cardTemplateThis.ValueHelpForMonthSelection.openBy(cardTemplateThis.oButton);
		},
		onValueHelpRequestForDate: function (evt) {
			cardTemplateThis.oButton = evt.getSource();
			cardTemplateThis.ValueHelpForDateSelection.openBy(cardTemplateThis.oButton);
		},
		handleDateSelect: function (evt) {
			var date = evt.getSource().getText();
			cardTemplateThis.oButton.setValue(date);
			cardTemplateThis.ValueHelpForDateSelection.close();
		},
		handleFilterValueClose: function (evt) {
			cardTemplateThis.ValueHelpForFilterValues.close();
		},
		handleMonthSelect: function (evt) {
			var month = evt.getSource().getText();
			switch (month) {
			case "January":
				cardTemplateThis.oButton.setValue("01");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "February":
				cardTemplateThis.oButton.setValue("02");
				sap.ui.getCore().byId("buttonId1").setVisible(false);
				sap.ui.getCore().byId("buttonId2").setVisible(false);
				sap.ui.getCore().byId("buttonId3").setVisible(false);
				break;

			case "March":
				cardTemplateThis.oButton.setValue("03");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "April":
				cardTemplateThis.oButton.setValue("04");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(false);
				break;

			case "May":
				cardTemplateThis.oButton.setValue("05");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "June":
				cardTemplateThis.oButton.setValue("06");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(false);
				break;

			case "July":
				cardTemplateThis.oButton.setValue("07");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "August":
				cardTemplateThis.oButton.setValue("08");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "September":
				cardTemplateThis.oButton.setValue("09");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(false);
				break;

			case "October":
				cardTemplateThis.oButton.setValue("10");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;

			case "November":
				cardTemplateThis.oButton.setValue("11");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(false);
				break;

			case "December":
				cardTemplateThis.oButton.setValue("12");
				sap.ui.getCore().byId("buttonId1").setVisible(true);
				sap.ui.getCore().byId("buttonId2").setVisible(true);
				sap.ui.getCore().byId("buttonId3").setVisible(true);
				break;
			}
			cardTemplateThis.ValueHelpForMonthSelection.close();
		},
		handleYearSelect: function (evt) {
			var year = evt.getSource().getText();
			cardTemplateThis.oButton.setValue(year);
			cardTemplateThis.ValueHelpForYearSelection.close();
		},
		handleAddSort: function (evt) {
			var selectedProperty = [];
			/*if (this.chartName == "Table") {
				var columnItem = cardTemplateThis.getView().byId("addColumnId").getItems();
				for (var v = 0; v < columnItem.length; v++) {
					var columnName = cardTemplateThis.getView().byId("addColumnId").getItems()[v].getContent()[0].getSelectedItem()
						.getBindingContext().getObject().property;
					var columnNamePresent = selectedProperty.includes(columnName);
					if (columnNamePresent == false) {
						selectedProperty.push(columnName);
					}
				}

			} else {*/
			//selectedProperty = cardTemplateThis.getView().byId("measureId").getModel().oData;
			var measureItems = cardTemplateThis.getView().byId("measureId").getItems();
			for (var j = 0; j < measureItems.length; j++) {
				var selectedMeasure = cardTemplateThis.getView().byId("measureId").getItems()[j].getBindingContext().getObject().COLUMN_NAME;
				selectedProperty.push(selectedMeasure);

			}
			var dimensionItems = cardTemplateThis.getView().byId("dimensionId").getSelectedItems();
			for (var u = 0; u < dimensionItems.length; u++) {
				var selectedDimension = cardTemplateThis.getView().byId("dimensionId").getSelectedItems()[u].getBindingContext().getObject().COLUMN_NAME;
				selectedProperty.push(selectedDimension);
			}
			// }
			if (cardTemplateThis.valueHelpRequestForSort.getContent()[2].getItems().length > 0) {
				var grp = cardTemplateThis.valueHelpRequestForSort.getContent()[2];
				for (var i = cardTemplateThis.valueHelpRequestForSort.getContent()[2].getItems().length - 1; i > -1; i--) {
					grp.removeItem(i);
				}
			}

			for (var z = 0; z < selectedProperty.length; z++) {
				var listItem = new sap.m.StandardListItem({
					title: selectedProperty[z]
				});
				listItem.addStyleClass("popOverItem");
				cardTemplateThis.valueHelpRequestForSort.getContent()[2].addItem(listItem);
			}
			/*	try {
				if (cardTemplateThis.cardInfo.sorters.length > 0) {
					if (cardTemplateThis.cardInfo.sorters[0].sortOperator == "Ascending")
						cardTemplateThis.valueHelpRequestForSort.getContent()[0].getItems()[0].setSelected(true);
					else
					cardTemplateThis.valueHelpRequestForSort.getContent()[0].getItems()[1].setSelected(true);
						var sortListItems = cardTemplateThis.valueHelpRequestForSort.getContent()[2].getItems();
				for (var i = 0; i < sortListItems.length; i++) {
					if (sortListItems[i].getTitle() == cardTemplateThis.cardInfo.sorters[0].selectedSortItem) {
						sortListItems[i].setSelected(true);
						break;
					}
				}
				}
			} catch (e) {}*/
			if (cardTemplateThis.sortItems != undefined) {
				if (cardTemplateThis.sortItems[0].sortOperator == "Ascending") {
					cardTemplateThis.valueHelpRequestForSort.getContent()[0].getItems()[0].setSelected(true);
				} else {
					cardTemplateThis.valueHelpRequestForSort.getContent()[0].getItems()[1].setSelected(true);
				}
				var sortListItems = cardTemplateThis.valueHelpRequestForSort.getContent()[2].getItems();
				for (var i = 0; i < sortListItems.length; i++) {
					if (sortListItems[i].getTitle() == cardTemplateThis.sortItems[0].selectedSortItem) {
						sortListItems[i].setSelected(true);
						break;
					}
				}
			}
			cardTemplateThis.valueHelpRequestForSort.openBy(evt.oSource.oParent.oParent.oParent);
		},
		handleViewSettingsConfirm: function (evt) {
			// 		if (evt.mParameters.sortDescending == false)
			// 			var sortType = "ASCENDING";
			// 		else
			// 			var sortType = "DESCENDING";
			// 		if (evt.oSource.oParent.oParent.getContent()[0].getContent()[0].getButtons()[1].getSelected() == false)
			// 			var sortType = "ASCENDING";
			// 		else
			// 			var sortType = "DESCENDING";
			var sortType = evt.oSource.oParent.oParent.getContent()[0].getSelectedItem().getTitle();
			for (var i = 0; i < evt.oSource.oParent.oParent.getContent()[2].getItems().length; i++)
				if (evt.oSource.oParent.oParent.getContent()[2].getItems()[i].getSelected() == true) {
					var sortItemSelected = evt.oSource.oParent.oParent.getContent()[2].getItems()[i].getTitle();
					break;
				}
				// var selectedIndex = evt.oSource.oParent.oParent.getContent()[1].getContent()[0].getSelectedIndex();
				// 		// 		var sortItemSelected = evt.mParameters.sortItem.getText();
				// 		var sortItemSelected = cardTemplateThis.valueHelpRequestForSort.getContent()[1].getContent()[0].getButtons()[selectedIndex].getText();
			cardTemplateThis.sortItems = [{
				sortOperator: sortType,
				selectedSortItem: sortItemSelected
			}];
			cardTemplateThis.getView().byId("sortButtonId").setText(sortItemSelected);
			cardTemplateThis.handleChangeCard(true);
			cardTemplateThis.valueHelpRequestForSort.close();
		},
		handleSortClose: function (evt) {
			cardTemplateThis.valueHelpRequestForSort.close();
		},
		oncustomLabelchange: function (evt) {
			var columnSelItems = cardTemplateThis.getView().byId("addColumnId").getItems();
			for (var a = 0; a < columnSelItems.length; a++) {
				var columnSelProperty = cardTemplateThis.getView().byId("addColumnId").getItems()[a].getContent()[0].getSelectedItem().getBindingContext()
					.getObject();
				if (evt.oSource.getBindingContext().getObject().COLUMN_NAME === columnSelProperty.COLUMN_NAME) {
					columnSelProperty["customLabel"] = evt.oSource.getValue();
				}
			}
		},
		formatTableData: function (value, columnDetails) {
			/*if (typeof value == "string" && value) {
				if (value.charAt(0) == ".")
					value = "0" + value;
			}
			var num = parseInt(value);
			var num1 = Number.isInteger(num);
			var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({
				style: "short",
				maxFractionDigits: 3
			});
			if (columnDetails.decimalPlaces) {
				decimalPlaces = parseInt(columnDetails.decimalPlaces);
			} else {
				decimalPlaces = 2;
			}*/
			if (columnDetails.COLUMN_NAME.indexOf("DATE") != (-1)) {
				if (value) {
					if ((value + "").indexOf("(") > -1) {
						value = value.split("(")[1].split(")")[0];
					}
					value = parseInt(value);
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "MM.dd.YYYY"
					});
					return dateFormat.format(new Date(value));
				} else {
					return value;
				}
			} else {
				return value;
			}
			/*	if (num1 && (!isNaN(value))) {
						if (columnDetails.formatPattern == "short") {
							var oFormatOptions = {
								style: "short",
								shortDecimals: decimalPlaces,
								decimalSeparator: ".",
								groupingSeparator: ",",
								roundingMode: "half_away_from_zero"
							};
							var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions);
							return oFloatFormat.format(parseFloat(value));
						} else if (columnDetails.formatPattern == "percentage") {
							var percentage = sap.ui.core.format.NumberFormat.getPercentInstance({
								style: 'percent',
								maxFractionDigits: decimalPlaces
							});
							return percentage.format(value);
						} else {
							return fixedInteger.format(value);
						}

					} else {
						return value;
					}
			*/
			//cardTemplateThis.formatTableValue(value, cardTemplateThis.selectedMeasureFormat, decimalValue);
		},
		onCustomMeasurePress: function (evt) {
			cardTemplateThis = this;
			cardTemplateThis.valueHelpForRestrictedMeasure.openBy(evt.oSource);
			cardTemplateThis.validateFormula = false;
			//cardTemplateThis.customMeasureDialog.setModel(cardTemplateThis.cMeasures);
		},
		enableAutoComplete: function () {
			var that = this;
			var oControl = this.valueHelpForRestrictedMeasure.getContent()[0].getContent()[5];

			// get textarea htmltag from UI5 control
			var jQueryTextArea = jQuery("#" + oControl.getId()).find("textarea");

			jQueryTextArea.textcomplete([{
				// #1 - Regular experession used to trigger search
				match: /(\b(\w+))$/, // --> triggers search for every char typed

				// #2 - Function called at every new key stroke
				search: function (query, fnCallback) {
					var pData = Promise.resolve(
						// jQuery.ajax({
						//   url: "./model/countries.json",
						//   method: "GET"
						// })

						that.getView().byId("measureId").getModel().getData()
					);

					pData.then(function (oResult) {
						fnCallback(
							oResult.filter(function (oRecord) {
								// filter results based on query
								return oRecord.property
									.toUpperCase()
									.includes(query.toUpperCase());
							})
						);
					});
				},

				// #3 - Template used to display each result (also supports HTML tags)
				template: function (hit) {
					// Returns the highlighted version of the name attribute
					return hit.property;
				},

				// #4 - Template used to display the selected result in the textarea
				replace: function (hit) {
					return hit.property;
				}
			}]);
		},
		handleDecimalSelection: function (evt) {

			var cardTitleStr = cardTemplateThis.getView().byId("cardTitleId").getValue();
			var cardSubTitleStr = cardTemplateThis.getView().byId("cardSubTitleId").getValue();
			cardTemplateThis.refreshPreviewCard(cardTitleStr, cardSubTitleStr, cardTemplateThis.chartName);
		},
		handleMeasureTypeChange: function (evt) {
			var selectedMesType = evt.oSource.getSelectedKey();
			if (selectedMesType == "Restricted") {
				this.customMeasureDialog.getContent()[0].getItems()[2].setVisible(false);
				this.customMeasureDialog.getContent()[0].getItems()[3].setVisible(true);
				var filterItems = [{
					"filterName": cardTemplateThis.dimensionForResMeasure[0].name,
					"filterDataType": cardTemplateThis.dimensionForResMeasure[0].datatype,
					"filterOperator": "eq",
					"filterValue": "",
					"filterValue1": "",
					"dimensionsList": cardTemplateThis.dimensionForResMeasure
				}];
				this.customMeasureDialog.getContent()[0].getItems()[3].getItems()[4].setModel(new sap.ui.model.json.JSONModel(filterItems));
			} else {
				this.customMeasureDialog.getContent()[0].getItems()[2].setVisible(true);
				this.customMeasureDialog.getContent()[0].getItems()[3].setVisible(false);
			}
		},
		//on selection of calculated measure in measures
		handleCalculatedMeasure: function (evt) {

			cardTemplateThis.valueHelpForRestrictedMeasure.openBy(evt.oSource.oParent.oParent);
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[0].setVisible(true);
			cardTemplateThis.valueHelpForRestrictedMeasure.getContent()[1].setVisible(false);
			var measureModel = this.getView().byId("measureId").getModel();
			cardTemplateThis.valueHelpForRestrictedMeasure.setModel(measureModel);
			cardTemplateThis.valueHelpForRestrictedMeasure.getCustomHeader().mAggregations.content[2].setText("Calculated Measure Settings");
		},
		onValidateFormula: function () {
			var that = this;
			var content = this.valueHelpForRestrictedMeasure.getContent()[0].getContent()[5];
			if (content.getValue().length === 0) {
				content.setValueState("Error");
				sap.m.MessageToast.show("Please Enter Formula");
				return;
			}
			content.setValueState("None");
			var object = {
				"TableName": this.getView().byId("entityId").getValue(),
				"Formula": '(' + content.getValue() + ')',
				"Measure": this.valueHelpForRestrictedMeasure.getContent()[0].getContent()[3].getValue()
			};

			Services.callCreateService("Inhance/CalculatedField.xsjs?cmd=ValidateExpression", JSON.stringify(object), "POST", function (evt,
				sucessFlag, oError) {
				if (sucessFlag) {
					sap.m.MessageToast.show("valid");
				} else {
					sap.m.MessageToast.show("Unable to save, try again later.");
				}
			});

		}

	})
});