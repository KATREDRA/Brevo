var coolGrids = {
    minWidth : 3,
    minHeight : 3, 
	waitForFinalEvent: function() {
		var b = {};
		return function(c, d, a) {
			a || (a = "I am a banana!");
			b[a] && clearTimeout(b[a]);
			b[a] = setTimeout(c, d)
		}
	}(),
	fullDateString: new Date(),
	isBreakpoint: function(alias) {
		return $('.device-' + alias).is(':visible');
	},

	options: {
	},
	init: function() {
		var that = this;
		$('.grid-stack').gridstack(that.options);
		$('.grid-stack').on('resizestop', this.onCardResize);
		$(window).resize(function() {
			that.waitForFinalEvent(function() {
				that.resizeGrid();
			}, 300, that.fullDateString.getTime());
		});
	},
	onCardResize: function(event, ui) {
		var newHeight = $(ui.element).height();
		$(ui.element).find(".sapVizFrame").height(newHeight - 68);
	},
	resizeGrid: function() {
		var that = this;
		var grid = $('.grid-stack').data('gridstack');
		if (that.isBreakpoint('xs')) {
			$('#grid-size').text('One column mode');
		} else if (that.isBreakpoint('sm')) {
			grid.setGridWidth(3);
			$('#grid-size').text(3);
		} else if (that.isBreakpoint('md')) {
			grid.setGridWidth(6);
			$('#grid-size').text(6);
		} else if (that.isBreakpoint('lg')) {
			grid.setGridWidth(12);
			$('#grid-size').text(12);
		}
	},

	drawGrids: function(serializedData) {
		var that = this;
		if (serializedData) {
			that.serializedData = serializedData;
		} else {
			that.serializedData = [
				{
					x: 0,
					y: 0,
					width: 3,
					height: 7
			},
				{
					x: 3,
					y: 1,
					width: 3,
					height: 7
			},
				{
					x: 4,
					y: 1,
					width: 3,
					height: 7
			},
				{
					x: 2,
					y: 3,
					width: 3,
					height: 7
			},
				{
					x: 0,
					y: 4,
					width: 4,
					height: 7
			},
				{
					x: 0,
					y: 3,
					width: 4,
					height: 7
			},
				{
					x: 2,
					y: 4,
					width: 4,
					height: 7
			},
				{
					x: 2,
					y: 5,
					width: 4,
					height: 7
			},
				{
					x: 0,
					y: 6,
					width: 12,
					height: 7
			}, {
					x: 0,
					y: 0,
					width: 2,
					height: 7
			},
				{
					x: 3,
					y: 1,
					width: 3,
					height: 9
			},
				{
					x: 4,
					y: 1,
					width: 5,
					height: 7
			},
				{
					x: 2,
					y: 3,
					width: 8,
					height: 7
			},
				{
					x: 0,
					y: 4,
					width: 4,
					height: 7
			},
				{
					x: 0,
					y: 3,
					width: 3,
					height: 7
			},
				{
					x: 2,
					y: 4,
					width: 3,
					height: 7
			},
				{
					x: 2,
					y: 5,
					width: 4,
					height: 7
			},
				{
					x: 0,
					y: 6,
					width: 12,
					height: 7
			}
                ];
		}
		that.grid = $('.grid-stack').data('gridstack');

		that.loadGrid = function() {
			that.grid.removeAll();
			var items = GridStackUI.Utils.sort(this.serializedData);
			_.each(items, function(node, i) {
				//	that.grid.addWidget($('<div><div class="grid-stack-item-content">' + i + '</div></div>'),
				//		node.x, node.y, node.width, node.height);
			}, that);
			return false;
		}.bind(that);
      //  that.serializedData = GridStackUI.Utils.sort(that.serializedData);
		that.loadGrid();
		that.resizeGrid();
	},
	addCard: function(cardInfo, i) {
		var that = this;
		var node = that.getNodeInformation(i);
		if (cardInfo.node) {
			node = cardInfo.node;
			node.x = 0;
			node.y = 0;
			node.autoPosition = false;
		} else {
		    if(!node){
		        node = {};
		        node.width = 4;
		        node.height = 7;
		    }
			node.autoPosition = true;
			//	node.width = 4;
			// node.height = 7;
		}
		var id = "grid-stack-item-" + i;
		var element = that.grid.addWidget($('<div><div id="' + id + '" class="grid-stack-item-content '+ i+'">' + '</div></div>'),
			node.x, node.y, node.width, node.height, node.autoPosition,this.minWidth, null, this.minHeight, null  );
		return id;
	},
	getNodeInformation: function(i) {
		switch (i) {
			case "addCard":
				return {
					x: 99,
					y: 99,
					width: 12,
					height: 4
				};
			default:
				return this.serializedData[i];
		}
	},
	deleteCard: function(i) {},
	getAllCardPositions: function() {
		var cards = this.grid.grid.nodes;
		this.serializedData = [];
		for (var i = 0; i < cards.length; i++) {
			this.serializedData.push({
				x: cards[i].x,
				y: cards[i].y,
				width: cards[i].width,
				height: cards[i].height
			});
		}
	},
	getCardPosition: function(i) {
		var card = this.grid.grid.nodes[i];
		return {
			x: cards[i].x,
			y: cards[i].y,
			width: cards[i].width,
			height: cards[i].height
		};
	},
	savePosition : function(){
	      this.serializedData = _.map($('.grid-stack > .grid-stack-item:visible'), function (el) {
                        el = $(el);
                        var node = el.data('_gridstack_node');
                        return {
                            x: node.x,
                            y: node.y,
                            width: node.width,
                            height: node.height
                        };
                    }, this);
                    return this.serializedData;
	},
};