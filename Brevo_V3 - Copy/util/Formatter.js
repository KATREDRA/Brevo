jQuery.sap.declare("Brevo.Brevo_V2.util.Formatter");
jQuery.sap.require("sap.ui.core.format.DateFormat");

function fixdata(data) {
	var o = "",
		l = 0,
		w = 10240;
	for (; l < data.byteLength / w; ++l)
		o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
	o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
	return o;
}

function to_json(workbook) {
	var result = [];
	var i = 0;
	workbook.SheetNames.forEach(function (sheetName) {
		var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		if (roa.length > 0) {
			var props = [];
			for (var i in roa[0]) {
				props.push({
					property: i,
					value: i,
					name: i
				});
			}
			result.push({
				name: sheetName,
				data: roa,
				properties: props
			});
		}
		i++;
	});
	return result;
}

function csv_to_json(results, name) {
	var result = [],
		props = [];
	var columns = results.meta.fields;
	for (var i = 0; i < columns.length; i++) {
		props.push({
			property: columns[i],
			value: columns[i],
			name: columns[i]
		});
	}
	result.push({
		name: name.split(".")[0],
		data: results.data,
		properties: props
	});
	return result;
}

function handleDrop(files, callBack, that) {

	rABS = false;
	use_worker = false;
	var f = files[0];
	var name = f.name;
	if (name.indexOf("csv") > -1) {
		/*var reader = new FileReader();
		reader.onload = function(e) {
			var data = e.target.result;
			var lines = data.split("\n");
			var result = [],csvData = [];
			var headers;
			for (var i = 0; i < lines.length; i++) {
				headers = lines[i].split("\n");
			}
			result.push(headers);
			var cont = 0;
			for (var i = 0; i < lines.length; i++) {

				var obj = {};
				var currentline = lines[i].split("\n");
				for (var j = 0; j < headers.length; j++) {
					obj[cont] = currentline[j];
				}
				cont++;
				csvData.push(obj);
			}
			result.push(csvData);
			callBack(data, result, that);
		};
		reader.readAsText(f);*/
		Papa.parse(files[0], {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			complete: function (results) {
				var output = csv_to_json(results, name);
				callBack("data", output, that);
			}
		});
	} else {
		var reader = new FileReader();
		reader.onload = function (e) {
			if (typeof console !== 'undefined')
				console.log("onload", new Date(), rABS, use_worker);
			var data = e.target.result;

			var lines = data.split("\n");
			var result = [],
				csvData = [];
			var headers;
			for (var i = 0; i < lines.length; i++) {
				headers = lines[i].split("\n");
			}
			result.push(headers);

			if (use_worker) {
				xw(data, process_wb);
			} else {
				var wb;
				if (rABS) {
					wb = XLSX.read(data, {
						type: 'binary'
					});
				} else {
					var base64Data = data.split("base64,");
					// var arr = fixdata(data);
					// wb = XLSX.read(btoa(arr), {
					// 	type: 'base64'
					// });
				}
				// var output = to_json(wb);
				var output = base64Data[1];
				callBack(data, output, that);
			}
		};
		if (rABS)
			reader.readAsBinaryString(f);
		else
			reader.readAsDataURL(f);
		// reader.readAsArrayBuffer(f);
	}
}

function handleDragover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}

function handleMeasures(chartType, measuresSelected) {
	switch (chartType) {
	case "Column Chart":
		if (measuresSelected >= 1)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Column":
		if (measuresSelected >= 2)
			return "Success";
		else
			return "Error";
		break;
	case "Bar Chart":
		if (measuresSelected >= 1)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Bar":
		if (measuresSelected >= 2)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Combination":
		if (measuresSelected >= 3)
			return "Success";
		else
			return "Error";
		break;
	case "Block Matrix":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Vertical Floating Bars":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Horiz Grouped Lolli Pie":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Scatter Chart":
		if (measuresSelected == 2)
			return "Success";
		else
			return "Error";
		break;
	case "Donut Chart":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Pie Chart":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bubble Chart":
		if (measuresSelected == 3)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Area":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Line Chart":
		if (measuresSelected >= 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bubble Ring":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Grouped Step Line":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Heat Map":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bullet":
		if (measuresSelected == 2)
			return "Success";
		else
			return "Error";
		break;
	case "Waterfall":
		if (measuresSelected == 1)
			return "Success";
		else
			return "Error";
		break;

	case "Numeric Chart":
		if (measuresSelected == 1 || measuresSelected == 2)
			return "Success";
		else
			return "Error";
		break;
	}
}

function handleDimension(chartType, dimensionSelected) {
	switch (chartType) {

	case "Numeric Chart":
		if (dimensionSelected == 0)
			return "Success";
		else
			return "Error";
		break;

	case "Column Chart":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Column":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bar Chart":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Bar":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Combination":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Block Matrix":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Vertical Floating Bars":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Horiz Grouped Lolli Pie":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Scatter Chart":
		if (dimensionSelected == 0)
			return "Success";
		else
			return "Error";
		break;
	case "Donut Chart":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Pie Chart":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bubble Chart":
		if (dimensionSelected == 0)
			return "Success";
		else
			return "Error";
		break;
	case "Stacked Area":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Line Chart":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Bubble Ring":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Grouped Step Line":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Heat Map":
		if (dimensionSelected == 2)
			return "Success";
		else
			return "Error";
		break;
	case "Bullet":
		if (dimensionSelected == 1)
			return "Success";
		else
			return "Error";
		break;
	case "Waterfall":
		if (dimensionSelected == 2)
			return "Success";
		else
			return "Error";
		break;
	}
}

function isPredictionSupported(chartType) {
	switch (chartType) {
	case "Column Chart":
		return false;
		break;
	case "Stacked Column":
		return false;
		break;
	case "Bar Chart":
		return false;
		break;
	case "Stacked Bar":
		return false;
		break;
	case "Stacked Combination":
		return true;
		break;
	case "Block Matrix":
		return false;
		break;
	case "Vertical Floating Bars":
		return false;
		break;
	case "Horiz Grouped Lolli Pie":
		return false;
		break;
	case "Scatter Chart":
		return false;
		break;
	case "Donut Chart":
		return false;
		break;
	case "Pie Chart":
		return false;
		break;
	case "Bubble Chart":
		return false;
		break;
	case "Stacked Area":
		return false;
		break;
	case "Line Chart":
		return false;
		break;
	case "Bubble Ring":
		return false;
		break;
	case "Grouped Step Line":
		return false;
		break;
	case "Heat Map":
		return false;
		break;
	case "Bullet":
		return false;
		break;
	case "Waterfall":
		return false;
		break;
	case "Numeric":
		return false;
		break;
	case "Image":
		return false;
		break;
	case "Table":
		return false;
		break;
	}
}

Brevo.Brevo_V2.util.Formatter = {
	formatNumber: function (value) {
		var num = parseFloat(value);
		var num1 = Number.isInteger(num);
		if (num1) {
			if (num < 0) {
				return num;
			} else if (num > 0 && num < 999) {
				return num.toFixed(2);
			} else if (num >= 1000 && num < 999999) {
				//num = num / 1000;
				return num.toFixed(2); // + "K";
			} else if (num >= 1000000 && num < 999999999) {
				num = num / 1000000;
				return num.toFixed(2) + "M";
			} else if (num >= 1000000000 && num < 999999999999) {
				num = num / 1000000000;
				return num.toFixed(2) + "B";
			} else {
				return num;
			}
		} else {
			return value;
		}
	},
	columnTypeFormatter: function (value) {
		if (value) {
			if (value == "String" || value == "Date") {
				return "Dimension";
			} else return "Measure";
		}
	},
	aggregationColumnVisibility: function (value) {
		if (value) {
			if (value == "String" || value == "Date") {
				return false;
			} else return true;
		}
	},
	IconForPage: function (TypeOfPage) {
		if (TypeOfPage == "O")
			return "sap-icon://overview-chart";
		else if (TypeOfPage == "R")
			return "sap-icon://table-view";
		else if (TypeOfPage == "T")
			return "sap-icon://Tree";
		else
			return "sap-icon://overview-chart";
	},
	columnCustomLabel: function (columnData) {
		if (columnData.customLabel)
			return columnData.customLabel;
		else
			return columnData.LABEL;
	},
	isMeasureSettingVisible: function (chartType) {
		switch (chartType) {
		case "Stacked Combination":
		case "Bubble Chart":
		case "Bullet":
			return true;
		case "Column Chart":
		case "Stacked Column":
		case "Block Matrix":
		case "Stacked Area":
		case "Grouped Step Line":
		case "Heat Map":
		case "Scatter Chart":
		case "Line Chart":
		case "Bubble Ring":
		case "Vertical Floating Bars":
		case "Horiz Grouped Lolli Pie":
		case "Waterfall":
		default:
			return false;

		}
	},
	canUserEditPage: function (roleFlag, createdBy) {
		if (roleFlag && createdBy) {
			var userId = "IDADMIN";
			try {
				userId = sap.ushell.Container.getService("UserInfo").getUser().getId();
			} catch (e) {
				return true;
			}
			if (roleFlag === "X" && createdBy != userId) {
				return true;
			} else {
				return true;
			}
		} else {
			return true;
		}
	},
	constructFilter: function (filters) {
		var oFilters = [];
		for (var i = 0; i < filters.length; i++) {
			filterOperator = filters[i].filterOperator;
			filterValue = filters[i].filterValue;
			filterName = filters[i].filterName;
			var selectedValues = filterValue.split(",");
			var tempORFilter = [];
			for (var l = 0; l < selectedValues.length; l++) {
				var tempFilter = new sap.ui.model.Filter(filterName, filterOperator.toUpperCase(), selectedValues[l].trim());
				tempORFilter.push(tempFilter);
			}
			if (tempORFilter.length > 1) {
				var tempFilter = new sap.ui.model.Filter({
					filters: tempORFilter,
					and: false
				});
				tempFilter.bAnd = false;
			}
			oFilters.push(tempFilter);
		}
		if (oFilters.length > 1) {
			var oFilters = new sap.ui.model.Filter({
				filters: oFilters,
				and: true
			});
		}
		return oFilters;
	},
	isDimensionSettingVisible: function (chartType) {
		switch (chartType) {
		case "Waterfall":
			return true;
		case "Column Chart":
		case "Stacked Column":
		case "Block Matrix":
		case "Stacked Area":
		case "Grouped Step Line":
		case "Heat Map":
		case "Scatter Chart":
		case "Line Chart":
		case "Bubble Ring":
		case "Vertical Floating Bars":
		case "Horiz Grouped Lolli Pie":
		case "Stacked Combination":
		case "Bubble Chart":
		case "Bullet":
		default:
			return false;

		}
	},
	measureSettingsValue: function (chartType) {
		switch (chartType) {
		case "Stacked Combination":
			return [{
				text: "Column",
				key: "bar"
			}, {
				text: "Line",
				key: "line"
			}];
		case "Bubble Chart":
			return [{
				text: "Axis 1",
				key: "valueAxis1"
			}, {
				text: "Axis 2",
				key: "valueAxis2"
			}, {
				text: "Bubble Width",
				key: "bubbleWidth"
			}];
		case "Bullet":
			return [{
				text: "Axis",
				key: "actualValues"
			}, {
				text: "Target",
				key: "targetValues"
			}];
		case "Column Chart":
		case "Stacked Column":
		case "Block Matrix":
		case "Stacked Area":
		case "Grouped Step Line":
		case "Heat Map":
		case "Scatter Chart":
		case "Line Chart":
		case "Bubble Ring":
		case "Vertical Floating Bars":
		case "Horiz Grouped Lolli Pie":
		case "Waterfall":
		default:
			return [];

		}
	},
	mergeArrays: function (arr1) {
		var array = [];
		for (var j = 0; j < arr1.length; j++) {
			var source = arr1[j];
			var target = arr1[j + 1];
			var temp = [];
			for (var i = 0; i < source.length; i++) {
				var srcObj = source[i];
				srcObj.table = source.table;
				srcObj.cardInfoServiceUrl = source.cardInfoServiceUrl;
				if (source[i].TYPE && source[i].TYPE == "MEASURE")
					continue;
				var exist = false;
				for (var k = 0; k < array.length; k++) {
					if (array[k].COLUMN_NAME === srcObj.COLUMN_NAME) {
						exist = true;
						break;
					}
				}
				if (!exist) {
					array.push(srcObj);
				}
			}
			//arr1[j + 1] = temp;
		}
		//debugger;
		return array;
	},
	compactFormatNumber: function (value) {
		if (value.length > 0) {
			if (isNaN(parseFloat(value))) {
				return value;
			} else {
				var oFormatOptions = {
					style: "short",
					shortDecimals: 2,
					decimalSeparator: ".",
					groupingSeparator: ",",
					roundingMode: "half_away_from_zero"
				};
				var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions);
				return oFloatFormat.format(parseFloat(value));
			}
		} else {
			return "";
		}
	},
	columnLinkVisibility: function (arr1, colProperty) {
		var visibility = false;
		for (var i = 0; i < arr1.length - 1; i++) {
			if (arr1[i] && colProperty == arr1[i].value) {
				visibility = true;
				break;
			}
		}
		return visibility;
	},
	getRouteType: function (value, name) {
		if (value) {
			if (value == "destination" && name != "Card_Configuration")
				return true;
			else
				return false;
		} else {
			return false;
		}
	},
	test: function (e) {
		debugger;
	},
	checkForVisibility: function (value) {
		if (value) {
			return true;
		} else {
			return false;
		}
	},
	isCardDrillDownEnabled: function (value) {
		if (value) {
			if (value != undefined && (value.navigation || value.navTo)) {
				return true;
			} else {
				return false;
			}
		} else
			return false;
	},
	isCardDrillDownEnabledN: function (value) {
		if (value) {
			if (value != undefined && (value.navigation || value.navTo)) {
				return false;
			} else {
				return true;
			}
		} else
			return true;
	},
	uppercaseFirstChar: function (sStr) {
		return sStr.charAt(0).toUpperCase() + sStr.slice(1);
	},
	FLoc: function (value) {
		if (value == "1")
			return false;
		else
			return true;
	},
	Delta: function (part1, part2) {
		if (isNaN(parseInt(part2) - parseInt(part1)))
			return 0;
		else
			return parseInt(part2) - parseInt(part1);
	},
	getImagePath: function (value) {
		if (value)
			return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/" + value;
		else
			return value;
	},
	getStaticImagePath: function (value) {

		try {
			var chartListJSON = sap.ui.getCore().getModel("chartListJSON");
			var charts = chartListJSON.oData;
			for (var i = 0; i < charts.length; i++) {
				if (value == charts[i].chartName) {
					return charts[i].icon;
					return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/" + charts[i].chartURL;
				}
			}
		} catch (e) {
			switch (value) {
			case "Line Chart":
				return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/images/Line.PNG";

			case "Column Chart":
				return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/images/VerticalBar.PNG";

			case "Pie Chart":
				return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/images/Pie.PNG";

			case "Bar Chart":
				return jQuery.sap.getModulePath("Brevo.Brevo_V2") + "/images/Bar.PNG";
			}
		}
	},
	DeltaState: function (v) {
		return "Success";
	},
	discontinuedStatusState: function (sDate) {
		return sDate ? "Error" : "None";
	},

	discontinuedStatusValue: function (sDate) {
		return sDate ? "Discontinued" : "";
	},

	currencyValue: function (value) {
		return parseFloat(value).toFixed(2);
	},
	PublishedDate: function (value) {
		if (value) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "MMMM dd,YYYY"
			});
			return oDateFormat.format(new Date(value.split(",")[1]));
		}
	},
	amountToMillions: function (value) {
		value = parseFloat(value);
		if (isNaN((value))) {
			return 0.0;
		} else if (value > 999999)
			return (value / 1000000).toFixed(1) + 'M';
		else if (value > 999)
			return (value / 1000).toFixed(1) + 'K';
		else if (value > 0)
			return (value / 10).toFixed(1);
		else if (value == 0)
			return (value + ".0");

	},
	indexValue: function (value) {
		value = parseFloat(value);
		if (isNaN((value))) {
			return 0.0;
		} else
			return value.toFixed(1);

	},
	Percentage: function (Terr, USA) {
		if (Terr && USA) {
			if (USA == 0) {
				return 100.0;
			}
			if (Terr == 0 && USA == 0) {
				return 100.0;
			} else {
				var value = ((USA - Terr) / USA) * 100.0;
				return value > 0 ? parseFloat(value).toFixed(1) : parseFloat(value).toFixed(1);
			}
		} else
			return 0.0;

	},
	Status: function (value) {
		switch (value) {
		case "1":
			return ("Priority/Safety");
			// if (lineObject.SerialNoIndicator == true &&
			// grDetail.serialNumbers[i][j].trim() == "") {

			// return("Error");
			// }
			break;
		case "4":
			return ("Next intervention");
			break;
		case "3":
			return ("Minor issue");
			break;
		case "2":
			return ("Stop/Default");
			break;
		default:
			return ("-");

			break;

		}
	},

	State: function (value) {
		switch (value) {
		case "1":
			return ("Error");
			break;
		case "2":
			return ("Warning");
			break;
		case "3":
			return ("Success");
			break;
		case "4":
			return ("None");
			break;
		default:
			return ("None");

			break;

		}
	},

	Quantity: function (value) {
		try {
			return (value) ? parseFloat(value).toFixed(0) : value;
		} catch (err) {
			return "Not-A-Number";
		}
	},
	DateValue: function (value) {
		if (value) {
			return (new Date(value.substr(0, 2), value.substr(2, 4), value.substr(4, 6))) + " ";
		} else {
			return value;
		}
	},
	Date: function (value) {
		if (value) {
			if (typeof value == "string") {
				value = value.replace("/Date(", "");
				value = parseInt(value.replace(")/", ""));
			}
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-yyyy"
			});
			return oDateFormat.format(new Date(value), true) + " ";
		} else {
			return value;
		}
	},
	NewDateTime: function (value) {
		if (value) {
			value = value.replace("/Date(", "");
			value = parseInt(value.replace(")/", ""));
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-yyyy"
			});
			return oDateFormat.format(new Date(value), false);
		} else {
			return value;
		}
	},
	DateTimeFormatForDisplay: function (value) {
		if (value) {
			index = value.indexOf("T");
			value = parseInt(value.subStr(0, index));
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-yyyy"
			});
			return oDateFormat.format(new Date(value), true);
		} else {
			return value;
		}
	},
	Time: function (value) {
		if (value) {
			value = value.replace("PT", "");

			value = (value.replace("H", ""));
			value = (value.replace("M", ""));
			value = (value.replace("S", ""));
			var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "H:mm"
			});
			if (value.substring(0, 2) == "00" && value.substring(2, 4) == "00")
				return "";
			else
				return oDateFormat.format(new Date(2015, 12, 05, value.substring(0, 2), value.substring(2, 4), value.substring(4, 6)), false);
		} else {
			return value;
		}
	},
	DateTimeWhenString: function (value, onlyTime) {
		if (!onlyTime) {
			if (value) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"

				});
				var hh = value.substr(8, 2);
				var mm = value.substr(10, 2);
				var ss = value.substr(12, 2);
				// This line gives you 12-hour (not 24) time
				// if (hh > 12) {
				// hh = hh - 12;
				// }
				// These lines ensure you have two-digits
				// if (hh < 10) {
				// hh = "0" + hh;
				// }
				// if (mm < 10) {
				// mm = "0" + mm;
				// }
				// if (ss < 10) {
				// ss = "0" + ss;
				// }
				// This formats your string to HH:MM:SS
				var t = hh + ":" + mm + ":" + ss;
				return oDateFormat.format(new Date(value.substr(0, 4), value.substr(4, 2), value.substr(6, 2)), false) + "T" + t;
			} else {
				return value;
			}
		} else {
			if (value) {
				var date = new Date(value);
				var hh = date.getHours();
				var mm = date.getMinutes();
				var ss = date.getSeconds();
				// if (hh > 12) {
				// hh = hh - 12;
				// }
				// These lines ensure you have two-digits
				if (hh < 10) {
					hh = "0" + hh;
				}
				if (mm < 10) {
					mm = "0" + mm;
				}
				if (ss < 10) {
					ss = "0" + ss;
				}

				return "PT" + hh + "H" + mm + "M" + ss + "S"

			}
		}
	},
	DateTime: function (value, onlyTime) {
		if (!onlyTime) {
			if (value) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"

				});
				var hh = value.getHours();
				var mm = value.getMinutes();
				var ss = value.getSeconds();
				// This line gives you 12-hour (not 24) time
				// if (hh > 12) {
				// hh = hh - 12;
				// }
				// These lines ensure you have two-digits
				if (hh < 10) {
					hh = "0" + hh;
				}
				if (mm < 10) {
					mm = "0" + mm;
				}
				if (ss < 10) {
					ss = "0" + ss;
				}
				// This formats your string to HH:MM:SS
				var t = hh + ":" + mm + ":" + ss;
				return oDateFormat.format(new Date(value), false) + "T" + t;
			} else {
				return value;
			}
		} else {
			if (value) {
				var date = new Date(value);
				var hh = date.getHours();
				var mm = date.getMinutes();
				var ss = date.getSeconds();
				// if (hh > 12) {
				// hh = hh - 12;
				// }
				// These lines ensure you have two-digits
				if (hh < 10) {
					hh = "0" + hh;
				}
				if (mm < 10) {
					mm = "0" + mm;
				}
				if (ss < 10) {
					ss = "0" + ss;
				}

				return "PT" + hh + "H" + mm + "M" + ss + "S"

			}
		}
	},
	Blank: function (val) {
		if (val == "0.000") {
			var tableLineItems = invFCUpdateView.byId("invFCUpdateTbl");
			var items = tableLineItems.getItems();
			for (var i = 0; i < items.length; i++) {
				var qtyVal = items[i].getAggregation("cells")[1].getValue();
				if (qtyVal == "") {
					items[i].getAggregation("cells")[1].setValue("");
				}
			}
		}
	},
	formatLevel: function (fValue) {
		try {
			if (fValue == "Critical") {
				return "Warning";
			} else if (fValue == "High") {
				return "Warning";
			} else if (fValue == "Low") {
				return "Success";
			} else {
				return "None";
			}
		} catch (err) {
			return "None";
		}
	},
	_openVariantSelection: function (evt) {
		var oItems = null;

		// this._delayedControlCreation();

		if (this.bPopoverOpen == true) {
			return;
		}

		this.bPopoverOpen = true;

		this.oVariantList.destroyItems();

		this.oVariantSave.setEnabled(false);
		this.oActionSheetSave.setEnabled(false);
		if (this.bVariantItemMode === false && this.getSelectionKey() !== null) {
			this.oVariantSave.setEnabled(true);
			this.oActionSheetSave.setEnabled(true);
		}

		oItems = this._getItems();
		if (oItems.length < 9) {
			this.oVariantSelectionPage.setShowSubHeader(false);
		} else {
			this.oVariantSelectionPage.setShowSubHeader(true);
			this.oSearchField.setValue("");
		}

		this._restoreCompleteList();

		if (this.currentVariantGetModified()) {
			var oSelectedItem = this.oVariantList.getItemByKey(this.getSelectionKey());
			if (oSelectedItem) {
				if (!oSelectedItem.getReadOnly() || (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === oSelectedItem.getKey()))) {
					this.oVariantSave.setEnabled(true);
					this.oActionSheetSave.setEnabled(true);
				}
			}
		}

		this.oVariantSaveAs.setEnabled(true);
		if (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === this.getSelectionKey()) && (this.getStandardVariantKey() ===
				this.STANDARDVARIANTKEY)) {
			this.oVariantSaveAs.setEnabled(false);
		}

		this._setDialogCompactStyle(this, this.oVariantPopOver);
		this._manageButtonState();
		this.oVariantPopOver.setInitialFocus(this.oVariantList.getSelectedItem().getId());
		this.oVariantPopOver.openBy(this.oVariantPopoverTrigger.$("img")[0]);
		this.oVariantSaveAs.setVisible(false);
		this.oVariantSave.setVisible(false);
	},
	measureValuesFormatter: function (measureValues) {
		if (measureValues) {
			if (measureValues.indexOf("Date") != (-1)) {
				measureValues = measureValues.replace("/Date(", "");
				measureValues = measureValues.replace(")/", "");
				var dateObject = new Date(parseInt(measureValues));
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "YYYY-MM-dd"
				});
				var dateFormatted = dateFormat.format(dateObject);
				//	var	formattedDate = createdDate;
				return dateFormatted;
			} else {
				return measureValues;
			}
		}
	},
	columnCustomLabel: function (columnData) {
		if (columnData) {
			if (columnData.customLabel)
				return columnData.customLabel;
			else
				return columnData.LABEL;
		}

	}

};