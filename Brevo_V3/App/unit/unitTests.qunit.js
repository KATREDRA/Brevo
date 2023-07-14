/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"Brevo/Brevo_V2/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});