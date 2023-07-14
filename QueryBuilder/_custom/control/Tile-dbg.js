sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	return Control.extend("_custom.control.Tile", {
		/**
		 *    Metadata:
		 *    Where properties, aggregations and events
		 *    are declared
		 */
		metadata: {
			properties: {
				noData: {
					type: "string",
					defaultValue: "No data"
				},
				width: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				},
				height: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				},
				padding: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "1rem"
				}
			},
			defaultAggregation: "content",
			aggregations: {
				content: {
					type: "sap.ui.core.Control",
					multiple: false, // 1:1
					singularName: "content"
				}
			}
			// events: {
			// 	"press": {}
			// }
		},
		/**
		 *      Init: Called when object is being created
		 *      @public
		 */

		// onclick: function(evt) {
		// 	this.fireEvent("press",);
		// },
		init: function() {
			this._oNoDataLabel = new sap.m.Label().addStyleClass("cockpitPanelContainerNoData");
		},
		/**
		 *    Exit: Garbage collector
		 *      @public
		 */
		exit: function() {
			this._oNoDataLabel.destroy();
			delete this._oNoDataLabel;
		},
		renderer: {
			/**
			 *    Main method for custom objects.
			 *    In order to display the object with properties
			 *    and aggregations defined, the method below
			 *    treat them, and allows the developer to insert
			 *    css classes or styles
			 *
			 *    @public
			 *    @param {object} oRm
			 *    @param {object} oControl
			 */
			render: function(oRm, oControl) {
				oRm.write("<div tabindex=\"0\"");
				oRm.writeControlData(oControl);
				// write classes
				oRm.addClass("tileLayout");
				oRm.writeClasses();
				// write styles
				oRm.addStyle("padding", oControl.getPadding());
				oRm.addStyle("height", oControl.getHeight());
				oRm.addStyle("width", oControl.getWidth());
				oRm.writeStyles();
				oRm.write(">");
				this._renderContent(oRm, oControl); //
				oRm.write("</div>");
			},
			/**
			 *    Render each object of content aggregation
			 *    to the main object
			 *    @private
			 *    @param {object} oRm
			 *    @param {object} oControl
			 */
			_renderContent: function(oRm, oControl) {
				var oContent = oControl.getAggregation("content");
				if (!oContent || oContent.length === 0) {
					// no data found on content aggregation
					this._renderNoData(oRm, oControl);
				} else {
					oRm.renderControl(oControl.getContent());
				}
			},
			/**
			 *    Render 'noData' property to the main object
			 *    @private
			 *    @param {object} oRm
			 *    @param {object} oControl
			 */
			_renderNoData: function(oRm, oControl) {
				if (!oControl._oNoDataLabel.getText()) {
					// force "no data" text in case of empty container
					oControl._oNoDataLabel.setText("Empty Tile");
				}
				oRm.write("<div");
				oRm.writeClasses();
				oRm.write(">");
				oRm.renderControl(oControl._oNoDataLabel);
				oRm.write("</div>");
			}
		}
	});
});