sap.ui.define(["Brevo/Brevo_V2/controller/BaseController", "Brevo/Brevo_V2/util/DataFormatter", 'sap/ui/export/Spreadsheet'], function (
	Controller, DataFormatter, Spreadsheet) {
	"use strict";
	return {
		createColumnHeaders: function (dimensions, measures) {
			var columns = [];
			var column = null;
			for (var i = 0; i < dimensions.length; i++) {
				column = new sap.m.Column({
					hAlign: "Center",
					header: new sap.m.ObjectIdentifier({
						title: dimensions[i].LABEL
					})
				});
				columns.push(column);
			}
			for (i = 0; i < measures.length; i++) {
				column = new sap.m.Column({
					hAlign: "Center",
					header: new sap.m.ObjectIdentifier({
						title: measures[i].LABEL
					})
				});
				columns.push(column);
			}
			return columns;
		},
		createItems: function (data, dimensions, measures) {
			var items = [];
			for (var i = 0; i < data.length; i++) {
				var cells = [];
				for (var j = 0; j < dimensions.length; j++) {
					cells.push(new sap.m.ObjectIdentifier({
						title: data[i][dimensions[j]["COLUMN_NAME"]]
					}));
				}
				for (j = 0; j < measures.length; j++) {
					cells.push(new sap.m.ObjectIdentifier({
						text: DataFormatter.formatNumber(data[i][measures[j]["COLUMN_NAME"]])
					}));
				}
				items.push(new sap.m.ColumnListItem({
					cells: cells
				}));
			}
			return items;
		},
		createTable: function (tableBox, model) {
			tableBox.removeAllItems();
			var dimensions = model.getData().dimension;
			var measures = model.getData().measures;
			var data = model.getData().data;
			var table = new sap.m.Table({
				mode: "None",
				sticky: ["ColumnHeaders"],
				columns: this.createColumnHeaders(dimensions, measures),
				items: this.createItems(data, dimensions, measures)
			});
			tableBox.addItem(table);
		},
		createColumnConfig: function (data) {
			var dimensions = data.dimension;
			var measures = data.measures;
			var columns = [];
			for (var i = 0; i < dimensions.length; i++) {
				columns.push({
					hAlign: "Center",
					label: dimensions[i]["label"],
					property: dimensions[i]["COLUMN_NAME"]
				});
			}
			for (i = 0; i < measures.length; i++) {
				columns.push({
					hAlign: "Center",
					label: measures[i]["label"],
					property: measures[i]["COLUMN_NAME"],
					type: "number",
					scale: 2
				});
			}
			return columns;
		},
		downloadCurrentDataSet: function (model) {
			var aCols, data, oSettings, oSheet;
			data = model.getData();
			aCols = this.createColumnConfig(data);
			var title = model.getData().cardTitle;
			oSettings = {
				fileName: title + ".xlsx",
				workbook: {
					columns: aCols
				},
				dataSource: data.data
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function () {
					oSheet.destroy();
				});
		},
	};
});