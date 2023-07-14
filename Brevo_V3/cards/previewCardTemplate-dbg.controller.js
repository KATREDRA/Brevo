var previewCard;
sap.ui.controller("Brevo.Brevo_V2.cards.previewCardTemplate", {

	onInit: function () {
		previewCard = this;
	},
	handleAddCard: function (evt) {
		var app = MainApp.getView().byId("fioriContent");
		if (app.getPage("cardTemplate") == null) {
			var page = sap.ui.xmlview("cardTemplate", "Brevo.Brevo_V2.view.cardTemplate");
			app.addPage(page);
		}
		app.to("cardTemplate", "slide");

	}
});