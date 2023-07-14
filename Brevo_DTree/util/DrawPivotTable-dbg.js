// jQuery.sap.declare("ibrevoVDT.util.DrawPivotTable");
sap.ui.define([
		"Brevo/BrevoDtree/util/Formatter",
		"Brevo/BrevoDtree/model/Service"
	],
	function (Formatter, service) {
		"use strict";
		return {
			drawTable: function (divId, tableInfo, semanticFilters, pageFilters, reportContainerParent) {
				this._loadData(divId, jQuery.extend(true, {}, tableInfo), semanticFilters, pageFilters, this._drawTable, reportContainerParent);
			},
			drawTableWithCurrentData: function (divId, tableInfo, semanticFilters, pageFilters, reportContainerParent) {
				this._drawTable(divId, tableInfo);
			},
			_loadData: function (divId, tableInfo, semanticFilter, pageFilters, callBack, reportContainerParent) {
				// if (!tableInfo.allProperties)
				// 	tableInfo.allProperties = [];
				// if (tableInfo.MEASURES && tableInfo.MEASURES.length > 0) {
				// 	for (var i = 0; i < tableInfo.MEASURES.length; i++) {
				// 		tableInfo.allProperties.push({
				// 			value: tableInfo.MEASURES[i],
				// 			property: tableInfo.MEASURES[i],
				// 		});
				// 	}
				// } else if (tableInfo.columns && tableInfo.columns.length > 0) {
				// 	tableInfo.allProperties = tableInfo.allProperties.concat(tableInfo.columns);
				// }
				// tableInfo.columns = [];
				// for (var i = 0; i < tableInfo.allProperties.length; i++) {
				// 	tableInfo.columns.push({
				// 		value: tableInfo.allProperties[i].property,
				// 		property: tableInfo.allProperties[i].value,
				// 	});
				// }

				tableInfo.dataSetLimit = 9999;
				// var url = Utils.constructUrlForData(tableInfo, semanticFilter, pageFilters);
				var url = "getData?fileName=" + tableInfo.FileName;
				reportContainerParent.setBusy(true);

				service.callService("FileSelectedModel" + tableInfo.ScenId, "FileSelectedModel", url, "IMS", true, "",
					function (evt) {
						tableInfo.data = sap.ui.getCore().getModel("FileSelectedModel" + tableInfo.ScenId).getData();
						if (tableInfo.data.length >= 9999)
							tableInfo.moreRecords = true;
						else
							tableInfo.moreRecords = false;
						reportContainerParent.setModel(new sap.ui.model.json.JSONModel(tableInfo));
						callBack(divId, tableInfo);
						reportContainerParent.setBusy(false);
					});
			},
			_drawTable: function (divId, tableInfo) {
				if (!tableInfo.data || tableInfo.data.length <= 0)
					tableInfo.data = [];
				var derivers = $.pivotUtilities.derivers;
				var renderers = $.extend($.pivotUtilities.renderers,
					$.pivotUtilities.gchart_renderers);
				var rows = [],
					cols = [],
					agg = {},
					vals = [];
				if (tableInfo.MEASURES && tableInfo.MEASURES.length > 0 && tableInfo.DIMENSIONS && tableInfo.DIMENSIONS.length > 0) {

					// for (var i = 0; i < tableInfo.DIMENSIONS.length; i++) {
					rows.push(tableInfo.DIMENSIONS[0]);
					// }
					for (var i = 0; i < tableInfo.MEASURES.length; i++) {
						// vals.push(tableInfo.MEASURES[i]);
						var aggregationType = "Sum";
						if (tableInfo.MEASURES[i].aggregationType)
							aggregationType = tableInfo.MEASURES[i].aggregationType;
						agg['agg' + i] = {
							aggType: aggregationType,
							arguments: [tableInfo.MEASURES[i]],
							name: aggregationType + '(' + tableInfo.MEASURES[i] + ')',
							varName: i,
							hidden: false,
							renderEnhancement: 'barchart'
						};
					}
				}
				// else if (tableInfo.columns && tableInfo.columns.length > 0) {
				// 	vals = [tableInfo.columns[tableInfo.columns.length - 1].property];
				// 	for (var i = 0; i < tableInfo.columns.length - 1; i++) {
				// 		if (tableInfo.columns[i].dataType && tableInfo.columns[i].dataType.length > 0 && (tableInfo.columns[i].dataType == "Edm.Double" ||
				// 				tableInfo.columns[i].dataType == "Edm.Int32")) {
				// 			continue;
				// 		}
				// 		rows.push(tableInfo.columns[i].property);
				// 	}
				// }
				var sum = $.pivotUtilities.aggregatorTemplates.sum;
				var numberFormat = $.pivotUtilities.numberFormat;
				var intFormat = numberFormat({
					digitsAfterDecimal: 0
				});
				var customAggs = {};
				$.pivotUtilities.customAggs = customAggs;
				var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.gtRenderers);
				customAggs['Multifact Aggregators'] = $.pivotUtilities.multifactAggregatorGenerator(agg, {});

				$("#" + divId).pivotUI(tableInfo.data, {
					aggregatorName: "Multifact Aggregators",
					aggregator: $.extend($.pivotUtilities.aggregators, $.pivotUtilities.customAggs),
					vals: vals,
					renderers: renderers,
					exclusions: ["__metadata"],
					hiddenFromDragDrop: ["__metadata"],
					hiddenAttributes: tableInfo.MEASURES,
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

				$(".pvtRows").prepend(
					'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="pvtAxisLabel sapMTitle">Rows:</span><span class="pureWhiteText sapMText"></span></div>'
				);
				$(".pvtCols").prepend(
					'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="pvtAxisLabel sapMTitle">Columns:</span><span class="pureWhiteText sapMText"></span></div>'
				);
				$(".pvtUnused").prepend(
					'<div class="sapMFlexBox sapUiTinyMarginBottom sapMVBox"><span class="sapMTitle">Properties:</span><span class="pvtAxisLabel sapMText"></span></div>'
				);

			}
		};
	});