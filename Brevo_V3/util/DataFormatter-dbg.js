sap.ui.define(["Brevo/Brevo_V2/controller/BaseController"], function (Controller) {
	"use strict";
	return {
		formatNumber: function (value, type) {
			try {
				if (type && type.toUpperCase().indexOf("DIMENSION")) {
					return value;
				}
				var num = parseFloat(value, 10);
				var fixedPlaces = 2;
				if (num.toString().indexOf('.') <= 0)
					fixedPlaces = 0;
				var num1 = Number.isNaN(num);
				if (!num1) {
					if (num < 0) {
						return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					} else if (num > 0 && num < 999) {
						return num.toFixed(fixedPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					} else if (num >= 1000 && num < 999999) {
						//num = num / 1000;
						return num.toFixed(fixedPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ","); // + "K";
					} else if (num >= 1000000 && num < 999999999) {
						num = num / 1000000;
						return num.toFixed(fixedPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "M";
					} else if (num >= 1000000000 && num < 999999999999) {
						num = num / 1000000000;
						return num.toFixed(fixedPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "B";
					} else {
						return num;
					}
				} else {
					return value;
				}
			} catch (e) {
				return value;
			}
		}
	};
});