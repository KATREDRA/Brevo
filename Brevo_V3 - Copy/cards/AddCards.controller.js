sap.ui.controller("dynamicCards.cards.AddCards", {
  handleAddCard: function(evt) {
    var app = MainApp.getView().byId("fioriContent");
    if (app.getPage("cardTemplate") == null) {
      var page = sap.ui.xmlview("cardTemplate", "dynamicCards.view.cardTemplate_v2");
      app.addPage(page);
    }
    app.to("cardTemplate", "slide");

    var bus = sap.ui.getCore().getEventBus();
    bus.publish("mainView", "toCardTemplate", {
      toggleBtn: true,
      pageId : MainView.Page_Id
    });
  }
});