jQuery.sap.declare("Brevo.BrevoDtree.util.Formatter");
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

function handleDrop(files, callBack, that) {
	rABS = false;
	use_worker = false;
	var f = files[0]; {
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function (e) {
			if (typeof console !== 'undefined')
				console.log("onload", new Date(), rABS, use_worker);
			var data = e.target.result;
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
		// reader.readAsArrayBuffer(f);
			reader.readAsDataURL(f);
	}
}

function handleDragover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}

Brevo.BrevoDtree.util.Formatter = {
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
		for (var j = 0; j < arr1.length - 1; j++) {
			var source = arr1[j];
			var target = arr1[j + 1];
			var temp = [];
			for (var i = 0; i < source.length; i++) {
				var srcObj = source[i];
				for (var k = 0; k < target.length; k++) {
					if (target[k].property === srcObj.property) {
						temp.push(srcObj);
						break;
					}
				}
			}
			arr1[j + 1] = temp;
		}
		//debugger;
		return arr1[j];
	},
	columnLinkVisibility: function (arr1, colProperty) {
		var visibility = false;
		for (var i = 0; i < arr1.length - 1; i++) {
			if (colProperty == arr1[i].value) {
				visibility = true;
				break;
			}
		}
		return visibility;
	},
	filterValuePercent: function (value) {
		try {
			var percent = parseFloat(value);
			if (percent > 100) return 100;
			else return percent;
		} catch (e) {
			return 0;
		}
	},
	commentDateFormatter: function (template, createdDate) {
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern: "MM/dd/yyyy"
		});

		if (typeof createdDate == "string") {
			/*	createdDate = createdDate.replace("/Date(", "");
			createdDate = parseInt(createdDate.replace(")/", ""));
			var formattedDate = "Posted on: " + oDateFormat.format(new Date(createdDate));*/
			var gmonth, gdate;
			var getDate = createdDate.split("-");
			var gyear = getDate[0];
			if (getDate[1].length)
				if (getDate[1].length != 2) {
					gmonth = '0' + getDate[1];
				} else {
					gmonth = getDate[1];
				}
			if (getDate[2].length == 16) {
				gdate = getDate[2].split("T")[0];
			} else if (getDate[2].length != 2) {
				gdate = '0' + getDate[2];
			} else {
				gdate = getDate[2];
			}
			if (template)
				var formattedDate = "Today: " + gmonth + '/' + gdate + '/' + gyear;
			else
				var formattedDate = "Posted on: " + gmonth + '/' + gdate + '/' + gyear;
		} else {
			if (template)
				var formattedDate = "Today: " + oDateFormat.format(createdDate);
			else
				var formattedDate = "Posted on: " + oDateFormat.format(createdDate);
		}
		return formattedDate;
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
			return jQuery.sap.getModulePath("Brevo.BrevoDtree") + "/" + value;
		else
			return value;
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
	handleDateFieldVisibility: function (datatype, column) {
		if (datatype) {
			if (datatype == "Date") {
				return column;
			} else return "";
		}
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
		} else if (value > 999999999)
			return (value / 1000000000).toFixed(1) + 'B';
		else if (value > 999999)
			return (value / 1000000).toFixed(1) + 'M';
		else if (value > 999)
			return (value / 1000).toFixed(1) + 'K';
		else if (value > 0)
			return value.toFixed(1);
		else if (value == 0)
			return (value + ".0");
		else {
			if (isNaN((value))) {
				return 0.0;
			} else if (value < -999999999)
				return (value / 1000000000).toFixed(1) + 'B';
			else if (value < -999999)
				return (value / 1000000).toFixed(1) + 'M';
			else if (value < -999)
				return (value / 1000).toFixed(1) + 'K';
			else if (value < 0)
				return value.toFixed(1);
		}
	},
	getDifferenceInMonths: function (selectedValue, selectedYear) {
		var today = new Date();
		var selectedDate = new Date(selectedYear, selectedValue, 1);
		var a = today;
		var b = selectedDate;

		// Months between years.
		var months = (b.getFullYear() - a.getFullYear()) * 12;

		// Months between... months.
		months += b.getMonth() - a.getMonth();

		// Subtract one month if b's date is less that a's.
		if (b.getDate() < a.getDate())
			months--;

		return months;
	},
	getQuater: function (getQuartervalue, view) {

		if (getQuartervalue == 12 || getQuartervalue > 9) {
			/*view.getView().byId("floatSlider").setRange([9,12]);
			view.getView().byId("floatSlider").setStep(3);*/
			return "Q4";
		} else if (getQuartervalue == 9 || getQuartervalue > 6) {
			/*view.getView().byId("floatSlider").setRange([6,9]);
			view.getView().byId("floatSlider").setStep(3);*/
			return "Q3";
		} else if (getQuartervalue == 6 || getQuartervalue > 3) {
			/*view.getView().byId("floatSlider").setRange([3,6]);
			view.getView().byId("floatSlider").setStep(3);*/
			return "Q2";
		} else {
			/*view.getView().byId("floatSlider").setRange([0,3]);
			view.getView().byId("floatSlider").setStep(3);*/
			return "Q1"
		}
	},
	formatdata: function (value, format) {
		if (format == "percent") {

			return (value / 100).toFixed(1) + '%';
		} else if (format == "thousand") {
			return (value / 1000).toFixed(1) + 'k';
		} else if (format == "million") {
			return (value / 1000000).toFixed(1) + 'M';
		} else {
			return (value / 1000000000).toFixed(1) + 'B';
		}

	},
	thresholdLevel: function (d, color, color1) {
		var value = parseFloat(d.value);
		var value1 = parseFloat(d.value_org);
		var arr = [];
		var arr1 = [];
		var arr2 = [];
		arr.push(value, value1);
		arr1.push(color, color1);
		for (var i = 0; i < arr.length; i++) {
			arr2.push({
				value: arr[i],
				color: arr1[i]
			});
		}
		if (arr2.length > 0) {
			var values = [];
			for (i = 0; i < arr2.length; i++) {
				values.push([arr2[i].color]);
			}
			return values;
		}
	},
	setThresholdLevel: function (value) {
		if (value == 0) return "";
		else return parseFloat(value);
	},
	setRectanglecolor: function (impact) {
		if (impact > 0.8) {
			//forestgreen  High Positive
			return "#67f967";
		} else if (impact <= 0.8 && impact > 0.6) {
			//greenyellow   Positive
			return "#7ffa7f";
		} else if (impact <= 0.6 && impact > 0.4) {
			// grey  Average
			return "#98fb98";
		} else if (impact <= 0.4 && impact > 0.2) {
			//light red  Negative
			return "#b1fcb1";
		} else {
			//firebrick
			return "#c9fdc9";
		}

	},

	getSapValueStateColor: function (color, driverTree) {
		driverTree.getView().byId("legend1").removeStyleClass("legend1Error");
		driverTree.getView().byId("legend1").removeStyleClass("legend1Warning");
		driverTree.getView().byId("legend1").removeStyleClass("legend1Success");
		driverTree.getView().byId("legend1").removeStyleClass("legend1Color");
		if (color == "red") return ["Error", "legend1Error"];
		else if (color == "orange") return ["Critical", "legend1Warning"];
		else if (color == "green") return ["Good", "legend1Success"];
		else return ["Neutral", "legend1Color"];
	},
	indexValue: function (value) {
		value = parseFloat(value);
		if (isNaN((value))) {
			return 0.0;
		} else
			return value.toFixed(1);

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
				if (hh < 10) {
					hh = "0" + hh;
				}
				if (mm < 10) {
					mm = "0" + mm;
				}
				if (ss < 10) {
					ss = "0" + ss;
				}

				return "PT" + hh + "H" + mm + "M" + ss + "S";

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
	linkVisibility: function (values) {
		try {
			if (values.length > 5) return true;
			else return false;
		} catch (e) {
			return false;
		}
	},
	nextButtonVisibility: function (items, filter) {
		try {
			if (items.length > 0) {
				var nexVisibility = true;
				for (var i = 0; i < items.length; i++) {
					if (items[i].filter == filter && (i == items.length - 1)) {
						nexVisibility = false;
						return false;
					}
				}
				if (nexVisibility) return true;
			} else return false;
		} catch (e) {
			return false;
		}
	},
	calculationPieParent: function (node, value) {
		var fin = value - node.value_org;
		var fin_val = node.value / fin;
		return fin_val;
	},
	buttonVisibility: function (obj) {
		if (obj) {
			if (obj.Parent)
				return false;
			else return true;
		}

	},
	textVisibility: function (obj) {
		if (obj) {
			if (obj.Parent || obj.ParentNew)
				return true;
			else return false;
		}
	},
	iconVisibility: function (obj, expanded) {
		if (obj) {
			if (expanded) {
				// if(obj.indexOf(expanded) != (-1)){
				if (obj.replace("All", "") == expanded) {
					return "sap-icon://navigation-down-arrow";
				} else {
					return "sap-icon://navigation-right-arrow";
				}

			} else {
				return "sap-icon://navigation-right-arrow";
			}
		}
	},
	tableInputVisibilty: function (text) {
		if (text) {
			if (text.indexOf("All") > (-1))
				return false;
			else
				return true;
		}

	},
	tableButtonVisibilty: function (text) {
		if (text) {
			if (text.indexOf("All") > (-1))
				return true;
			else
				return false;
		}

	}
};