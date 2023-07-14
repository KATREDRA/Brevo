var templateCard;
sap.ui.controller("dynamicCards.cards.maps", {
	onInit:function(){
		var regionterrMap = this;
		var oModel = new sap.ui.model.json.JSONModel("model/Purchase.json");
		regionterrMap.getView().setModel(oModel);
		lon= 77.5946;
		lat=12.9716;
		jQuery.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyAwA9IAZHYwkNIY8pReh74q9E1cV18sXRM",function(result){
			regionterrMap.InitModel();
		});
		window.setTimeout(function(){
			var oVbox = regionterrMap.getView().byId("regionMapView");
			MainView.navToCardTemplate(oVbox)
		},100)

	},
	allMarkers : [],
	InitModel : function(){	
		//var map;
		var regionterrMap = this;
		/*var locations =  sap.ui.getCore().getModel("regionModel").oData.d.results;*/
		regionterrMap.map = new google.maps.Map(document.getElementById('regionMap'), {
			center: {lat:lat, lng:lon },
			zoom: 8,
			mapTypeControl: false,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
				position: google.maps.ControlPosition.TOP_CENTER
			},
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP
			},
			scaleControl: true,
			streetViewControl: false,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP
			},
			fullscreenControl: false
		});

		var marker, i;
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lon),
			map: regionterrMap.map
		});
		google.maps.event.addListener(marker, 'click', (function(marker, i) {
			return function() {
				regionterrMap.map.setCenter(marker.getPosition());
				regionterrMap.map.setZoom(8);

				var infowindow = new google.maps.InfoWindow({
					content: marker.getTitle(),
					maxWidth  : 200
				});
				infowindow.open(regionterrMap.map, marker);
			};
		})(marker, i));
	},

	handleSelect:function(evt){
		var key=evt.oSource.getSelectedKey();
		switch(key){
		case"list":
			this.getView().byId("regionAccountsList").setVisible(true);
			this.getView().byId("regionMapView").setVisible(false);
			break;
		case"map":
			this.getView().byId("regionAccountsList").setVisible(false);
			this.getView().byId("regionMapView").setVisible(true);
			break;

		}
	},

	onDeletePress : function(evt)
	{
		MainView.deleteCard(evt);
	}
});