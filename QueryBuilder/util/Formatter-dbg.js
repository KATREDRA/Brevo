jQuery.sap.declare("Brevo.QueryBuilder.util.Formatter");
jQuery.sap.require("sap.ui.core.format.DateFormat");

Brevo.QueryBuilder.util.Formatter = {

	filterUrlOperator: function (filterOperator) {
		var filterOperatorToAdd;
		if (filterOperator == "eq")
			filterOperatorToAdd = "=";
		else if (filterOperator == "ne")
			filterOperatorToAdd = "!=";
		else if (filterOperator == "gt")
			filterOperatorToAdd = ">";
		else if (filterOperator == "ge")
			filterOperatorToAdd = ">=";
		else if (filterOperator == "lt")
			filterOperatorToAdd = "<";
		else if (filterOperator == "le")
			filterOperatorToAdd = "<=";
		else
			filterOperatorToAdd = "=";
		return filterOperatorToAdd;

	},

	handleNaNValues: function (value) {
		if (value) {
			if (value == "NaN")
				return 0;
			else
				return value;
		}

	},

	aggregationColumnVisibility: function (datatype) {
		if (datatype == "MEASURE")
			return true;
		else
			return false;
	},
	filterColumnVisibility: function (datatype) {
		if (datatype != "MEASURE")
			return true;
		else
			return false;
	},
	columnCustomLabel: function (columnData) {
		if (columnData.customLabel)
			return columnData.customLabel;
		else
			return columnData.label;
	},
	columnDatatypeLabel: function (datatype) {
		if (datatype == "MEASURE")
			return "Measure";
		else if (datatype == "DIMENSION")
			return "Dimension";
		else if (datatype == "datetime")
			return "Date Time";
		else
			return datatype;
	},
	getFilterProperty: function (property, label) {
		if (label === undefined) {
			return property;
		} else {
			return label;
		}
	},
	getFilterVisibility: function (datatype) {
		if (datatype === undefined || datatype === "DIMENSION") {
			return true;
		} else if (datatype === "datetime" || datatype === "date") {
			return false;
		} else {
			return false;
		}
	},
	getBTFilterVisibility: function (datatype, operator) {
		if (operator === "bw" && datatype === "DIMENSION") {
			return true;
		} else {
			return false;
		}
	},
	getDateFilterVisibility: function (datatype) {
		if (datatype === undefined) {
			return false;
		} else if (datatype === "datetime" || datatype === "date") {
			return true;
		} else return false;
	},
	getDateBTFilterVisibility: function (datatype, operator) {
		if (operator === "bw" && (datatype === "datetime" || datatype === "date")) {
			return true;
		} else {
			return false;
		}
	},
	formatTableValue: function (value, measureFormat) {
		if (value) {
			if ((new Date(value)) != "Invalid Date") {
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
	},
	lastChangeFormatter: function (date) {
		if (date) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			var lastChanged = oDateFormat.format(new Date(date));
			return lastChanged;
		}

	}
};