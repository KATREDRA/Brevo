sap.ui.define([], function () {
	"use strict";

	return {
		getUserStatus: function (status) {
			if (status == "Active")
				return "Success";
			else
				return "Error";
		},
		getTypeOfPage: function (typeOfPage) {
			return typeOfPage == "0" ? "Dashboard" : "Analytical"
		},
		getSideMenuItemVisibility: function (title, flag) {
			if (title == "Home") return true;
			else
			if (title == "Super Admin" || title == "Application") return !flag;
			else return flag;
			//var visibleFlag =  title = "Super Admin" ?  !flag : flag ;
			//return visibleFlag;
		},
		getAuthorizeDays: function (startDate, endDate) {
			if (startDate && endDate) {
				startDate = new Date(startDate);
				endDate = new Date(endDate);
				var diffTime = Math.abs(endDate.getTime() - startDate.getTime());
				var diffD = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				if (diffD >= 365) {
					var year = (diffD / 365);
					var resYear = parseInt(year);
					if (resYear == "1") {
						resYear = parseInt(year) + " year";
					} else {
						resYear = parseInt(year) + " years";
					}
					return resYear;
				} else if (diffD < 365 && diffD > 30) {
					var month = (diffD / 30);
					var resMonth = parseInt(month);
					if (resMonth == "1") {
						resMonth = parseInt(month) + " month";
					} else {
						resMonth = parseInt(month) + " months";
					}
					return resMonth;
				} else if (diffD >= 7) {
					var days = (diffD / 7);
					var resWeek = parseInt(days);
					if (resWeek == "1") {
						resWeek = parseInt(days) + " week";
					} else {
						resWeek = parseInt(days) + " weeks";
					}
					return resWeek;
				} else {
					//	var day = (diffD/7);
					var resDay = parseInt(diffD);
					if (resDay == "1") {
						resDay = parseInt(diffD) + " day";
					} else if (resDay == "0") {
						resDay = parseInt(diffD) + " day";
					} else {
						resDay = parseInt(diffD) + " days";
					}
					return resDay;
				}
			}
		},
		getNoOfDays: function (startDate, endDate) {
			if (startDate, endDate) {
				startDate = new Date(startDate);
				endDate = new Date(endDate);
				var diffTime = Math.abs(endDate.getTime() - startDate.getTime());
				var diffD = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				return diffD;
			} else return "";

		},
		handleDateValues: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MM/dd/YYYY"
			});
			return dateFormat.format(new Date(date));
		},
		getNoOfUsers: function (users) {
			try {
				return users.length;
			} catch (e) {
				return 0;
			}
		},
		getBooleanCondition: function (flag) {
			if (flag == true || flag == "true") return true;
			else if (flag == false || flag == "false") return false;
		},
		test: function (data) {
			return data;
		}
	};
});