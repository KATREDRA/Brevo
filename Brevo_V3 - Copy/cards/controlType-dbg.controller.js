sap.ui.controller("dynamicCards.cards.controlType", {

	onInit : function() {
		var stackGraph = this;
		var stmodel = new sap.ui.model.json.JSONModel("model/Purchase.json");
		sap.ui.getCore().setModel(stmodel, "stackmodel");
		stackGraph.getView().setModel(stmodel);
		window.setTimeout(function() {
			stackGraph.addstackChart();
		}, 1000);
		window.setTimeout(function(){
			var oVbox = stackGraph.getView().byId("barGraphId");
			MainView.navToCardTemplate(oVbox);
		},100)
		
		
	},

	addstackChart : function() {
		var oVizFrame = this.getView().byId("idVizFrameStackedColumn");
		oVizFrame.removeAllFeeds();
		oVizFrame.setVizType('stacked_column');
		oVizFrame.setUiConfig({
			"applicationSet" : "fiori"
		});
		var piemodel = sap.ui.getCore().getModel("stackmodel");
		var oDataset = new sap.viz.ui5.data.FlattenedDataset({
			dimensions : [ {
				name : "Month",
				value : "{Month}"
			}, {
				name : "Legend",
				value : "{Legend}"
			} ],
			measures : [ {
				name : "Control Type",
				value : "{controltype}"
			} ],
			data : {
				path : "/graphDetails/0/controlType"
			}
		});
		oVizFrame.setModel(piemodel);
		oVizFrame.setDataset(oDataset);
		var feedvalueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
			'uid' : "valueAxis",
			'type' : "Measure",
			'values' : [ "Control Type" ]
		}), feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
			'uid' : "categoryAxis",
			'type' : "Dimension",
			'values' : [ "Month" ]
		}), feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem({
			'uid' : "color",
			'type' : "Dimension",
			'values' : [ "Legend" ]
		});
		oVizFrame.addFeed(feedvalueAxis);
		oVizFrame.addFeed(feedCategoryAxis);
		oVizFrame.addFeed(feedColor);

		oVizFrame.setVizProperties({
			title : {
				visible : false,
				text : 'Status'
			}
		});
	},
	
	onDeletePress : function(evt)
	{
		MainView.deleteCard(evt);
	}
});