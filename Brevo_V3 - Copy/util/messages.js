jQuery.sap.declare("dynamicCards.util.messages");

dynamicCards.util.messages = {};
dynamicCards.util.messages.showErrorMessage = function(oParameter) {
	var oErrorDetails = dynamicCards.util.messages._parseError(oParameter);
	sap.ui.require("sap.ca.ui.message.message", function() {
		var oMsgBox = sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: oErrorDetails.sMessage,
			details: oErrorDetails.sDetails
		});
		if (!sap.ui.Device.support.touch) {
			oMsgBox.addStyleClass("sapUiSizeCompact");
		}
	});

};