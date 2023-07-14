sap.ui.define(["Brevo/Brevo_V2/controller/BaseController", "Brevo/Brevo_V2/model/Service",
	"Brevo/Brevo_V2/util/FilterProcessor", "sap/ui/model/Filter", "sap/ui/model/Sorter"
], function (Controller, Services, FilterProcessor, Filter, Sorter) {
	"use strict";
	return {
		parseCardConfiguration: function (configuration) {
			var cardInfo = "";
			try {
				cardInfo = JSON.parse(configuration);
			} catch (e) {
				try {
					cardInfo = JSON.parse(decodeURIComponent(escape(window.atob(configuration))));
				} catch (e2) {
					cardInfo = configuration;
					console.log("MiscUtils=====> Unable to parse JSON");
				}
			}
			return cardInfo;
		},
		sortArrayByCustomOrder: function (cards, order, key1, key2) {
			if (order && order.length > 0) {
				var results = [],
					cardsNotFound = [];
				order.forEach(function (key) {
					var found = false;
					cards.filter(function (item) {
						if (!found && item[key1] == key[key2]) {
							results.push(item);
							found = true;
							return false;
						} else
							return true;
					});
				});
				for (var i = 0; i < cards.length; i++) {
					var found = false;
					for (var j = 0; j < results.length; j++) {
						if (cards[i][key1] == results[j][key1]) {
							found = true;
							break;
						}
					}
					if (!found)
						cardsNotFound.push(cards[i]);
				}
				return results.concat(cardsNotFound);
			} else return cards;
		},
		getRequiredFragment: function (cardType, controller) {
			var fragment = null;
			switch (cardType) {
			case "Table":
				{
					if (!controller.tableCard)
						controller.tableCard = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.tableTemplate", controller);
					fragment = controller.tableCard.clone();
					break;
				}
			case "Report Table":
				{
					if (!controller.geoCard)
						controller.geoCard = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.reportTable", controller);
					fragment = controller.geoCard.clone();
					break;
				}
			case "Geo Map":
				{
					if (!controller.geoCard)
						controller.geoCard = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.geoTemplateCard", controller);
					fragment = controller.geoCard.clone();
					break;
				}
			case "Numeric Chart":
				if (!controller.numericChart)
					controller.numericChart = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.numericChart", controller);
				fragment = controller.numericChart.clone();
				break;
			case "Heat Map":
			case "Bullet":
			case "Waterfall":
			case "Column Chart":
			case "Stacked Column":
			case "Stacked Bar":
			case "Scatter Chart":
			case "Bubble Chart":
			case "Line Chart":
			case "Stacked Combination":
			case "Donut Chart":
			case "Pie Chart":
				{
					if (!controller.vizCard)
						controller.vizCard = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.vizChart", controller);
					fragment = controller.vizCard.clone();
					break;
				}
			default:
				{
					if (!controller.vizCard)
						controller.vizCard = sap.ui.xmlfragment("Brevo.Brevo_V2.fragments.vizChart", controller);
					fragment = controller.vizCard.clone();
					break;
				}
			}
			return fragment;
		},
		constructUrlForData: function (cardModel, semanticFilters, pageFilters) {
			try {
				var url = Services.config.metadataUrls.otherData.url;
				var $select = "";
				var cardInfo = cardModel.getData();
				var excelFileId = cardInfo.excelFileId,
					dataSource = cardInfo.dataSource,
					serviceURL = cardInfo.serviceURL,
					Entity = cardInfo.EntitySet,
					measures = cardInfo.mesurementValue,
					dimension = cardInfo.dimensionValue,
					column1 = cardInfo.column1,
					column2 = cardInfo.column2,
					column3 = cardInfo.column3,
					property = cardInfo.property,
					filterItems = cardInfo.filters,
					parameters = cardInfo.parameterValue,
					EntitySet = cardInfo.EntitySet,
					dataSetLimit = cardInfo.dataSetLimit,
					isDataSetLimited = cardInfo.isDataSetLimited,
					cardType = cardInfo.cardType,
					allMesurementValue = cardInfo.allMesurementValue,
					filterParam = "";
				var that = this;
				var selectArr = [];
				var dimArr = [];
				var measureArr = [];
				if (cardInfo.cardType == "Table") {
					if (cardInfo.columns == undefined) {
						selectArr.push(cardInfo.column1.COLUMN_NAME);
						selectArr.push(cardInfo.column2.COLUMN_NAME);
						selectArr.push(cardInfo.column3.COLUMN_NAME);
					} else {
						for (var a = 0; a < cardInfo.columns.length; a++) {
							selectArr.push(cardInfo.columns[a].COLUMN_NAME);
						}
					}
				}
				if (cardType == "Report Table") {
					for (var i = 0; i < cardInfo.allMesurementValue.length; i++) {
						selectArr.push(cardInfo.allMesurementValue[i].COLUMN_NAME);
					}
				} else {
					for (var i = 0; i < cardInfo.measures.length; i++) {
						selectArr.push(cardInfo.measures[i].COLUMN_NAME);
					}
				}
				var dimArr = [];
				for (var i = 0; i < cardInfo.dimension.length; i++) {
					selectArr.push(cardInfo.dimension[i].COLUMN_NAME);
				}
				if (cardInfo.dataSource == "file") {
					url = Services.config.metadataUrls.FileData.url + excelFileId;
					if (serviceURL && serviceURL == "Brevo") {
						url = Services.config.metadataUrls.Data.url + excelFileId;
					}
					$select = "&$select=" + selectArr.join(",");
				}
				var validPageFilters = [];
				for (var i = 0; i < pageFilters.length; i++) {
					for (var j = 0; j < cardInfo.allProperties.length; j++) {
						if (pageFilters[i].filterParameter == cardInfo.allProperties[j].COLUMN_NAME) {
							validPageFilters.push(pageFilters[i]);
							if (cardModel) cardModel.setProperty("/chartFiltered", true);
						}
					}
				}
				pageFilters = validPageFilters;
				if (filterItems && Object.keys(filterItems).length > 0) {
					if (semanticFilters.length > 0 && pageFilters.length == 0) {
						filterItems = filterItems.concat(semanticFilters);
					} else {
						filterItems = filterItems.concat(pageFilters);
					}
				} else {
					if (pageFilters) {
						filterItems = pageFilters
					}
				}
				var sorters = "";
				if (cardInfo.sorters) {
					var sortersObj = [];
					for (var i = 0; i < cardInfo.sorters.length; i++) {
						sortersObj.push(new Sorter(cardInfo.sorters[i].selectedSortItem, cardInfo.sorters[i].sortOperator == "Descending"));
					}
					sorters = FilterProcessor.createSortParams(sortersObj);
				}
				var filterUrlToAppend = "",
					filterUrl, finalFilter;
				var filterObject = [];
				for (var i = 0; i < filterItems.length; i++) {
					var filterName = filterItems[i].filterParameter;
					var filterOperator = filterItems[i].filterOperator;
					var selectedFilterValues = filterItems[i].filterParameterArr ? filterItems[i].filterParameterArr : filterItems[i].filterValue;
					var filterObjectOR = [];
					if (selectedFilterValues.length <= 0)
						continue;
					else if (typeof selectedFilterValues == "string") {
						selectedFilterValues = selectedFilterValues.split(",");
					}
					for (var m = 0; m < selectedFilterValues.length; m++) {
						var filter = new Filter(filterName, filterOperator, typeof selectedFilterValues[m] == "string" ? selectedFilterValues[m] :
							selectedFilterValues[m].filterParameterValue);
						filter.filterDataType = filterItems[i].filterDataType;
						filterObjectOR.push(filter);
					}
					if (filterObjectOR.length > 0)
						filterObject.push(new Filter(filterObjectOR, false));
				}
				if (filterObject.length > 0) {
					filterObject = new Filter(filterObject, true);
					filterParam = FilterProcessor.createFilterParams(filterObject, null, null, null);
					console.log(filterParam);
				}
				url = url + "&$top=" + dataSetLimit + filterParam + $select + sorters;
				return url;
			} catch (e) {
				console.log(e);
			}
		},
		constructUrlForDataOld: function (cardInfo, semanticFilters, pageFilters) {
			try {
				var excelFileId = cardInfo.excelFileId,
					dataSource = cardInfo.dataSource,
					serviceURL = cardInfo.serviceURL,
					Entity = cardInfo.EntitySet,
					measures = cardInfo.mesurementValue,
					dimension = cardInfo.dimensionValue,
					column1 = cardInfo.column1,
					column2 = cardInfo.column2,
					column3 = cardInfo.column3,
					property = cardInfo.property,
					filters = cardInfo.filters,
					parameters = cardInfo.parameterValue,
					EntitySet = cardInfo.EntitySet,
					dataSetLimit = cardInfo.dataSetLimit,
					isDataSetLimited = cardInfo.isDataSetLimited,
					cardType = cardInfo.cardType,
					allMesurementValue = cardInfo.allMesurementValue;
				var that = this;
				measureArr = [];
				var dimArr = [];
				var filterName;
				var filterOperator;
				var filterValue;
				if (cardInfo.dataSource == "file") {
					return cardInfo.finalUrl;
				}
				if (typeof dataSetLimit == "undefined") {
					dataSetLimit = 99999;
				}
				this.newUrl = serviceURL + "/" + Entity + "?$format=json&$top=" + dataSetLimit;

				if (filters && Object.keys(filters).length > 0) {
					if (semanticFilters.length > 0 && pageFilters.length == 0) {
						filters = filters.concat(semanticFilters);
					} else {
						filters = filters.concat(pageFilters);
					}
				} else {
					if (pageFilters) {
						filters = pageFilters
					}
				}
				var filterUrlToAppend = "",
					filterUrl, finalFilter = "",
					filterUrl2;
				if (cardInfo.dataSource != "service") {
					if (filters != undefined) {
						for (var i = 0; i < filters.length; i++) {
							if (filters[i].filterName != undefined) {
								filterName = filters[i].filterName
								filterOperator = filters[i].filterOperator;
								if (filters[i].filterDataType == "Edm.DateTime") {
									var value1 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[2];
									var value2 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[1];
									var value3 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[0];
									if (filters[i].filterParameterArr.length > 1) {
										var value4 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[2];
										var value5 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[1];
										var value6 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[0];
										if (value1.length > 0 && value2.length > 0 && value3.length > 0 && value4.length > 0 && value5.length > 0 && value6.length > 0) {
											/*filterUrl = "(year(" + filterName + ")" + " gt " + value1 + ")and(month(" + filterName + ")" +
												" gt " + value2 + ")and(day(" + filterName + ") gt " + value3 + " and year(" + filterName + ")" + " lt " + value4 +
												")and(month(" +
												filterName + ")" + " lt " + value5 + ")and(day(" + filterName + ") lt " + value6 + ")";*/
											filterUrl2 = "year(" + filterName + ") gt " + value1 + " and month(" + filterName + ")" +
												" gt " + value2 + " and day(" + filterName + ") gt " + value3 + " or year(" + filterName + ") lt " + value4 + " and month(" +
												filterName + ") lt " + value5 + " and day(" + filterName + ") lt " + value6;
										}
									} else {
										if (value1.length > 0 && value2.length > 0 && value3.length > 0) {
											filterUrl2 = "(year(" + filterName + ")" + " gt " + value1 + ")and(month(" + filterName + ")" +
												" gt " + value2 + ")and(day(" + filterName + ") gt " + value3 + ")";
										}
									}
									/*	if (value1 > 0 && value2.length > 0 && value3.length > 0) {
										filterUrl = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
											" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
									} else if (value1.length > 0 && value2.length > 0) {
										filterUrl = "(year(" + filterName + ") eq " + value1 + ")and(month(" + filterName + ")" + " eq " + value2 + ")";
									} else if (value2.length > 0 && value3.length > 0) {
										filterUrl = "(month(" + filterName + ")eq" + value2 + ")and(day(" + filterName + ")" + "eq" + value3 + ")";
									} else if (value1.length > 0 && value3.length > 0) {
										filterUrl = "(year(" + filterName + ")  eq " + value1 + ")and(day(" + filterName + ") eq " + value3 + ")";
									} else if (value1.length > 0) {
										filterUrl = "(year(" + filterName + ") eq " + value1 + ")";
									} else if (value2.length > 0) {
										filterUrl = "(month(" + filterName + ") eq " + value2 + ")";
									} else if (value3.length > 0) {
										filterUrl = "(day(" + filterName + ") eq " + value3 + ")";
									}*/
								} else if (filters[i].filterOperator == "bw") {
									var value1 = filters[i].getCells()[2].getItems()[0].getValue();
									var value2 = filters[i].getCells()[2].getItems()[1].getValue();
									if (value1.length > 0 && value2.length > 0) {
										if (value1.indexOf(",") == (-1) && value2.indexOf(",") == (-1)) {
											filterUrl2 = "(" + filterName + " gt " + "'" + value1 + "'" + ")and(" + filterName + " lt " +
												"'" + value2 + "'" + ")";
										} else {
											var values1Len = value1.split(",");
											for (var m = 0; m < values1Len.length; m++) {
												values1Len[m] = values1Len[m].trim().replace(/\s/g, "%20");
												if (m === 0) {
													filterUrl = "(" + filterName + " " + filterOperator + " '" + values1Len[0] + "')";
												} else {
													filterUrl = filterUrl + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[m] + "')";
												}
											}
											var values2Len = value2.split(",");
											for (var k = 0; k < values2Len.length; k++) {
												values1Len[k] = values2Len[k].trim().replace(/\s/g, "%20");
												if (k === 0) {
													filterUrl = "(" + filterName + " " + filterOperator + " " + "'" + values1Len[0] + "')";
												} else {
													filterUrl = filterUrl + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[k] + "')";
												}
											}
											filterUrl = filterUrl + "and" + filterUrl;
										}
									}
								} else {
									var selectedFilterValues = filters[i].filterValue.split(",");

									for (var m = 0; m < selectedFilterValues.length; m++) {
										var selectedValues = selectedFilterValues[m].filterValue.trim();
										if (m === 0) {
											filterUrl = '"' + filterName + '"' + "|" + filterOperator + "|" + selectedValues;
										} else {
											filterUrl = filterUrl + ",," + '"' + filterName + '"' + "|" + filterOperator + "|" + selectedValues;
										}
									}
								}
								if (i == 0)
									filterUrlToAppend = filterUrl;
								else {
									if (filterUrl)
										filterUrlToAppend += ",," + filterUrl
									else
										filterUrlToAppend = filterUrl;
								}
							}
						}
						finalFilter = "&$filter=" + filterUrlToAppend;
					}

				} else {
					var filterUrl2;
					if (filters != undefined) {
						for (var i = 0; i < filters.length; i++) {
							if (filters[i].filterParameter != undefined) {
								filterName = filters[i].filterParameter;
								filterOperator = filters[i].filterOperator;
								if (filters[i].filterDataType == "Edm.DateTime") {
									var value1 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[2];
									var value2 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[1];
									var value3 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[0];
									if (filters[i].filterParameterArr.length > 1) {
										var value4 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[2];
										var value5 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[1];
										var value6 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[0];
										if (value1.length > 0 && value2.length > 0 && value3.length > 0 && value4.length > 0 && value5.length > 0 && value6.length > 0) {
											/*filterUrl = "(year(" + filterName + ")" + " gt " + value1 + ")and(month(" + filterName + ")" +
												" gt " + value2 + ")and(day(" + filterName + ") gt " + value3 + " and year(" + filterName + ")" + " lt " + value4 +
												")and(month(" +
												filterName + ")" + " lt " + value5 + ")and(day(" + filterName + ") lt " + value6 + ")";*/
											/*	filterUrl2 = "year(" + filterName + ") gt " + value1 + " and month(" + filterName + ")" +
												" gt " + value2 + " and day(" + filterName + ") gt " + value3 + " or year(" + filterName + ") lt " + value4 + " and month(" +
												filterName + ") lt " + value5 + " and day(" + filterName + ") lt " + value6;*/
											try {
												var filterDate1 = filters[i].filterParameterArr[0].filterParameterValue.split("-")[2] + "-" + filters[i].filterParameterArr[
													0].filterParameterValue.split("-")[1] + "-" + filters[i].filterParameterArr[0].filterParameterValue.split("-")[0];
												var filterDate2 = filters[i].filterParameterArr[1].filterParameterValue.split("-")[2] + "-" + filters[i].filterParameterArr[
													1].filterParameterValue.split("-")[1] + "-" + filters[i].filterParameterArr[1].filterParameterValue.split("-")[0];
												filterUrl2 = filterName + " ge datetime" + "'" + filterDate1 + "'" + " and " + filterName + " le datetime" + "'" +
													filterDate2 +
													"'";
											} catch (e) {}
										}
									} else {
										if (value1.length > 0 && value2.length > 0 && value3.length > 0) {
											filterUrl2 = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
												" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
										}
									}
									/*	if (value1 > 0 && value2.length > 0 && value3.length > 0) {
										filterUrl2 = "(year(" + filterName + ")" + " eq " + value1 + ")and(month(" + filterName + ")" +
											" eq " + value2 + ")and(day(" + filterName + ") eq " + value3 + ")";
									} else if (value1.length > 0 && value2.length > 0) {
										filterUrl2 = "(year(" + filterName + ") eq " + value1 + ")and(month(" + filterName + ")" + " eq " + value2 + ")";
									} else if (value2.length > 0 && value3.length > 0) {
										filterUrl2 = "(month(" + filterName + ")eq" + value2 + ")and(day(" + filterName + ")" + "eq" + value3 + ")";
									} else if (value1.length > 0 && value3.length > 0) {
										filterUrl2 = "(year(" + filterName + ")  eq " + value1 + ")and(day(" + filterName + ") eq " + value3 + ")";
									} else if (value1.length > 0) {
										filterUrl2 = "(year(" + filterName + ") eq " + value1 + ")";
									} else if (value2.length > 0) {
										filterUrl2 = "(month(" + filterName + ") eq " + value2 + ")";
									} else if (value3.length > 0) {
										filterUrl2 = "(day(" + filterName + ") eq " + value3 + ")";
									}*/
								} else if (filters[i].filterOperator == "bw") {
									/*var value1 = filters[i].filterParameterArr[0].filterParameterValue[0];
									var value2 = filters[i].filterParameterArr[0].filterParameterValue[1];*/
									var value1 = filters[i].filterValue;
									var value2 = filters[i].filterValue2;
									if (value1.length > 0 && value2.length > 0) {
										if (value1.indexOf(",") == (-1) && value2.indexOf(",") == (-1)) {
											filterUrl2 = "(" + filterName + " gt " + "'" + value1 + "'" + ")and(" + filterName + " lt " +
												"'" + value2 + "'" + ")";
										} else {
											var values1Len = value1.split(",");
											for (var m = 0; m < values1Len.length; m++) {
												values1Len[m] = values1Len[m].trim().replace(/\s/g, "%20");
												if (m === 0) {
													if (serviceURL.indexOf("sugar_odata") > -1)
														filterValue1 = filterName + "='" + values1Len[0] + "'";
													else
														filterValue1 = "(" + filterName + " " + filterOperator + " '" + values1Len[0] + "')";
												} else {
													if (serviceURL.indexOf("sugar_odata") > -1)
														filterValue1 = filterValue1 + "||" + filterName + "='" + values1Len[m] + "'";
													else
														filterValue1 = filterValue1 + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[m] + "')";
												}
											}
											var values2Len = value2.split(",");
											for (var k = 0; k < values2Len.length; k++) {
												values1Len[k] = values2Len[k].trim().replace(/\s/g, "%20");
												if (k === 0) {
													if (serviceURL.indexOf("sugar_odata") > -1)
														filterValue2 = filterName + "='" + values1Len[0] + "'";
													else
														filterValue2 = "(" + filterName + " " + filterOperator + " " + "'" + values1Len[0] + "')";
												} else {
													if (serviceURL.indexOf("sugar_odata") > -1)
														filterValue2 = filterValue2 + "||" + filterName + "='" + values1Len[k] + "'";
													else
														filterValue2 = filterValue2 + "or(" + filterName + " " + filterOperator + " " + "'" + values1Len[k] + "')";
												}
											}
											filterUrl2 = filterValue1 + "and" + filterValue2;
										}
									}
								} else {
									if (typeof (filters[i].filterValue) === "undefined") {
										var selectedFilterValues = filters[i].filterParameterArr;
									} else {
										var selectedFilterValues = filters[i].filterValue.split(",");
									}
									for (var m = 0; m < selectedFilterValues.length; m++) {
										if (typeof (filters[i].filterValue) === "undefined") {
											var selValue = selectedFilterValues[m].filterParameterValue.trim();
										} else {
											var selValue = selectedFilterValues[m].trim();
										}
										if (m === 0) {
											if (serviceURL.indexOf("sugar_odata") > -1)
												filterUrl2 = filterName + "='" + selValue + "'";
											else
												filterUrl2 = "(" + filterName + " " + filterOperator + " " + "'" + selValue + "')";
										} else {
											if (serviceURL.indexOf("sugar_odata") > -1)
												filterUrl2 = filterUrl2 + "||" + filterName + "='" + selValue + "'";
											else
												filterUrl2 = filterUrl2 + "or(" + filterName + " " + filterOperator + " " + "'" + selValue + "')";
										}
									}
								}
								filterUrl2 = "(" + filterUrl2 + ")"
								if (filterUrlToAppend.length == 0) {
									filterUrlToAppend = filterUrl2;
								} else {
									filterUrlToAppend = filterUrlToAppend + "and" + filterUrl2;
								}

							}
						}

						filterUrl2 = filterUrlToAppend;
						if (filterUrl2.length != 0) {
							if (serviceURL.indexOf("sugar_odata") > -1)
								finalFilter = filterUrl2;
							else
								finalFilter = "&$filter=" + filterUrl2;
						}
					}

				}
				this.newUrl = this.newUrl.concat(finalFilter);
				this.newUrl.trim();
				if (dataSource === "service") {
					dataSource = "service";
				} else {
					serviceURL = Services.config.metadataUrls.FileData.url + excelFileId;
					this.newUrl = serviceURL;
					$select = "&selectM=" + measureKeys.join(",");
					$select = "&" + $select + "&selectD=" + dimensionKeys.join(",");
					finalUrl = this.newUrl + $select;
				}
				var measureArr = [];
				if (cardType == "Report Table") {
					for (var i = 0; i < cardInfo.allMesurementValue.length; i++) {
						measureArr.push(cardInfo.allMesurementValue[i].property);
					}
				} else {
					for (var i = 0; i < cardInfo.measures.length; i++) {
						measureArr.push(cardInfo.measures[i].property);
					}
				}
				var dimArr = [];
				for (var i = 0; i < cardInfo.dimension.length; i++) {
					dimArr.push(cardInfo.dimension[i].property);
				}
				var $select = "&$select=";
				var finalUrl = this.newUrl;
				if (cardInfo.cardType == "Table") {
					if (cardInfo.columns == undefined) {
						$select = $select + column1.property + "," + column2.property + "," + column3.property + "&"
					} else {
						var tableUrlToAdd;
						for (var a = 0; a < cardInfo.columns.length; a++) {
							if (a == 0)
								tableUrlToAdd = cardInfo.columns[a].property
							else
								tableUrlToAdd += "," + cardInfo.columns[a].property
						}
						$select = $select + tableUrlToAdd + "&"
					}

				} else {
					if (dimArr.length <= 0)
						$select = $select + measureArr.join(",");
					else
						$select = $select + measureArr.join(",") + "," + dimArr.join(",");
				}
				finalUrl = finalUrl + $select;
				try {
					if (cardInfo.sorters.length > 0) {
						if (cardInfo.sorters[0].sortOperator == "Descending")
							var typeOfSort = " desc";
						else
							var typeOfSort = "";
						finalUrl = finalUrl + "&$orderby=" + cardInfo.sorters[0].selectedSortItem + typeOfSort;
					}
				} catch (e) {}

				return finalUrl;
			} catch (e) {
				return "";
			}
		}
	};
});