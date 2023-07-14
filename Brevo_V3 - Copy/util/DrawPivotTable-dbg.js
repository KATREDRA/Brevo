 sap.ui.define([
 	"sap/ui/model/json/JSONModel",
 	"sap/ui/Device",
 	"Brevo/Brevo_V2/model/Service",
 	"Brevo/Brevo_V2/util/MiscUtils",
 ], function (JSONModel, Device, Service, Utils) {
 	return {
 		drawTable: function (divId, cardInfo, semanticFilters, pageFilters, reportContainerParent, keys) {
 			this._loadData(divId, jQuery.extend(true, {}, cardInfo), semanticFilters, pageFilters, this._drawTable, reportContainerParent, keys);
 		},
 		drawTableWithCurrentData: function (divId, cardInfo, semanticFilters, pageFilters, reportContainerParent) {
 			this._drawTable(divId, cardInfo);
 		},
 		_loadData: function (divId, cardInfo, semanticFilter, pageFilters, callBack, reportContainerParent, keys) {
 			cardInfo.cardType = "Table";
 			if (!cardInfo.allProperties)
 				cardInfo.allProperties = [];
 			if (cardInfo.measures && cardInfo.measures.length > 0) {
 				for (var i = 0; i < cardInfo.measures.length; i++) {
 					// cardInfo.allProperties.push({
 					// 	value: cardInfo.measures[i].COLUMN_NAME,
 					// 	property: cardInfo.measures[i].LABEL,
 					// });
 				}
 			}
 			//cardInfo.allProperties = cardInfo.allProperties.concat(cardInfo.measures);
 			else if (cardInfo.columns && cardInfo.columns.length > 0) {
 				cardInfo.allProperties = cardInfo.allProperties.concat(cardInfo.columns);
 			}
 			cardInfo.columns = [];
 			var dimensionSelectChanged = false;
 			var dimensionSelect = reportContainerParent.getItems()[0].getContent()[4];
 			for (var i = 0; i < cardInfo.allProperties.length; i++) {
 				var select = true;
 				if (dimensionSelect && dimensionSelect.getItems() && dimensionSelect.getItems().length > 0) {
 					if (cardInfo.allProperties[i].TYPE == "MEASURE" || (dimensionSelect.getSelectedKeys().find(name => name === cardInfo.allProperties[
 							i].COLUMN_NAME))) {
 						select = true;
 					} else {
 						select = false;
 						dimensionSelectChanged = true;
 					}
 				}
 				if (select) {
 					cardInfo.columns.push({
 						COLUMN_NAME: cardInfo.allProperties[i].COLUMN_NAME ? cardInfo.allProperties[i].COLUMN_NAME : cardInfo.allProperties[i].property,
 						value: cardInfo.allProperties[i].LABEL ? cardInfo.allProperties[i].LABEL : cardInfo.allProperties[i].value,
 					});
 				}
 			}

 			cardInfo.dataSetLimit = 9999;
 			var url = Utils.constructUrlForData(new sap.ui.model.json.JSONModel(cardInfo), semanticFilter, pageFilters);
 			reportContainerParent.setBusy(true);
 			Service.callService("cardDataModelReport" + cardInfo.confiId, "ZQ_Q_PQMP01_ODATA_001Results.json", url, true, true,
 				function (evt) {
 					cardInfo.data = sap.ui.getCore().getModel("cardDataModelReport" + cardInfo.confiId).getData();
 					if (cardInfo.data.length >= 9999)
 						cardInfo.moreRecords = true;
 					else
 						cardInfo.moreRecords = false;
 					reportContainerParent.setModel(new sap.ui.model.json.JSONModel(cardInfo));
 					if (!dimensionSelectChanged) {
 						window.setTimeout(function () {
 							var keys = [];
 							for (var i = 0; i < dimensionSelect.getItems().length; i++) {
 								keys.push(dimensionSelect.getItems()[i].getKey());
 							}
 							dimensionSelect.setSelectedKeys(keys);
 						}, 1000);
 					}
 					callBack(divId, cardInfo);
 					reportContainerParent.setBusy(false);

 				}, "", "");
 		},
 		_drawTable: function (divId, cardInfo) {
 			if (!cardInfo.data || cardInfo.data.length <= 0)
 				cardInfo.data = [];
 			var derivers = $.pivotUtilities.derivers;
 			var renderers = $.extend($.pivotUtilities.renderers,
 				$.pivotUtilities.gchart_renderers);
 			var rows = [],
 				cols = [],
 				agg = {},
 				vals = [];
 			if (cardInfo.measures && cardInfo.measures.length > 0 && cardInfo.dimension && cardInfo.dimension.length > 0) {

 				for (var i = 0; i < cardInfo.dimension.length; i++) {
 					rows.push(cardInfo.dimension[i].COLUMN_NAME);
 					// i++;
 					// if (i < cardInfo.dimension.length) {
 					// 	cols.push(cardInfo.dimension[i].COLUMN_NAME);
 					// }
 				}
 				for (var i = 0; i < cardInfo.measures.length; i++) {
 					vals.push(cardInfo.measures[i].COLUMN_NAME);
 					var aggregationType = "Sum";
 					if (cardInfo.measures[i].aggregationType)
 						aggregationType = cardInfo.measures[i].aggregationType;
 					else if (cardInfo.measures[i].AGGREGATIONTYPE) {
 						if (cardInfo.measures[i].AGGREGATIONTYPE.toUpperCase() == "SUM") {
 							aggregationType = "Sum";
 						} else if (cardInfo.measures[i].AGGREGATIONTYPE.toUpperCase() == "AVERAGE") {
 							aggregationType = "Average";
 						} else if (cardInfo.measures[i].AGGREGATIONTYPE.toUpperCase() == "COUNT") {
 							aggregationType = "Count";
 						} else {
 							aggregationType = "Sum";
 						}
 					} //rows.push(cardInfo.measures[i].COLUMN_NAME);
 					agg['agg' + i] = {
 						aggType: aggregationType,
 						arguments: [cardInfo.measures[i].COLUMN_NAME],
 						name: aggregationType + '(' + cardInfo.measures[i].LABEL + ')',
 						varName: i,
 						hidden: false,
 						renderEnhancement: 'barchart'
 					}
 				}
 			} else if (cardInfo.columns && cardInfo.columns.length > 0) {
 				vals = [cardInfo.columns[cardInfo.columns.length - 1].COLUMN_NAME];
 				for (var i = 0; i < cardInfo.columns.length - 1; i++) {
 					if (cardInfo.columns[i].dataType && cardInfo.columns[i].dataType.length > 0 && (cardInfo.columns[i].dataType == "Edm.Double" ||
 							cardInfo.columns[i].dataType == "Edm.Int32")) {
 						continue;
 					} else if (cardInfo.columns[i].TYPE && cardInfo.columns[i].TYPE.length > 0 && (cardInfo.columns[i].TYPE == "MEASURE")) {
 						continue;
 					}
 					rows.push(cardInfo.columns[i].COLUMN_NAME);
 					// i++;
 					// if (i < cardInfo.columns.length - 1) {
 					// 	cols.push(cardInfo.columns[i].property);
 					// }
 				}
 				rows = rows.sort((a, b) => (a.TYPE > b.TYPE) ? 1 : (a.TYPE === b.TYPE) ? ((a.TYPE > b.TYPE) ? 1 : -1) : -1)
 			}
 			var sum = $.pivotUtilities.aggregatorTemplates.sum;
 			var numberFormat = $.pivotUtilities.numberFormat;
 			var intFormat = numberFormat({
 				digitsAfterDecimal: 0
 			});
 			var customAggs = {};
 			$.pivotUtilities.customAggs = customAggs;
 			//config.aggregators = $.extend($.pivotUtilities.aggregators, $.pivotUtilities.customAggs);
 			var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.gtRenderers);
 			customAggs['Multifact Aggregators'] = $.pivotUtilities.multifactAggregatorGenerator(agg, {});

 			$("#" + divId).pivotUI(cardInfo.data, {
 				aggregatorName: "Multifact Aggregators",
 				aggregator: $.extend($.pivotUtilities.aggregators, $.pivotUtilities.customAggs),
 				vals: vals,
 				renderers: renderers,
 				exclusions: ["__metadata"],
 				hiddenFromDragDrop: ["__metadata"],
 				unusedAttrsVertical: false,
 				cols: cols,
 				rows: rows,
 				rendererName: "GT Table",
 				rendererOptions: {
 					width: "45rem",
 					aggregations: {
 						defaultAggregations: agg,
 						derivedAggregations: {}
 					}
 				}
 			}, true);
 			//	if (!this.isInitialLoad) {
 			$(".pvtRows").prepend(
 				'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="pvtAxisLabel sapMTitle">Rows:</span><span class="pureWhiteText sapMText"></span></div>'
 			);
 			$(".pvtCols").prepend(
 				'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="pvtAxisLabel sapMTitle">Columns:</span><span class="pureWhiteText sapMText"></span></div>'
 			);
 			$(".pvtUnused").prepend(
 				'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="sapMTitle">Properties:</span><span class="pvtAxisLabel sapMText"></span></div>'
 			);
 			this.isInitialLoad = true;
 			//	}
 		}
 	}
 });