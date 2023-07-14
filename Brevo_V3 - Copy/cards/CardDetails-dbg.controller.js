sap.ui.controller("dynamicCards.cards.CardDetails", {

	onInit: function(){
		var cardDetails = this;
		window.setTimeout(function(){
			var oVbox = cardDetails.getView().byId("deleteIconId");
			MainView.navToCardTemplate(oVbox)
		},100)
	},
	handleAddCard :  function(evt)
	{
		var app =MainApp.getView().byId("fioriContent");
	    if (app.getPage("cardTemplate") == null)
	    {
	      var page = sap.ui.xmlview("cardTemplate", "dynamicCards.view.cardTemplate");
	      app.addPage(page);
	    }
	    app.to("cardTemplate", "slide");

	}
});