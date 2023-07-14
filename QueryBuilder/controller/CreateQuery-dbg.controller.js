sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"Brevo/QueryBuilder/model/Service",
	"Brevo/QueryBuilder/util/Formatter"
], function (Controller, JSONModel, MessageToast, History, service, Formatter) {
	"use strict";

	return Controller.extend("Brevo.QueryBuilder.controller.CreateQuery", {
		onInit: function () {
			var that = this;
			this.formulas = [];
			this.formulaFlag = false;
			this.join = "";
			this.queryName = "";
			this.sortItems = [];
			this.viewId = "";
			this.filterValues = [];
			this.sColumns = [];
			this.editMode = false;
			this.dbName = "Brevo";
			this.filterUrl = "";
			this.viewData = "";
			this.conditions = [];
			this.tableData = [];
			this.table1Name = "";
			this.selectedTables = [];
			this.joinsCount = 0;
			this.joinTablePosition = 190;
			this._wizard = this.byId("createQueryWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			this._oWizardReviewPage = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.ReviewPage", this);
			that.BusyDialog = new sap.m.BusyDialog();
			that.tableCount = 1;
			that.addFormulafrag = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.addFormula", that);
			var calMeasureDailog = this.addFormulafrag.getContent()[0].getItems()[1];
			calMeasureDailog.getItems()[0].getItems()[1].onAfterRendering = function () {
				// call autocomplete plugin function after rendering of textarea is completed
				that.enableAutoComplete();
			};
			if (!this.ValueHelpForFilterValues)
				this.ValueHelpForFilterValues = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.valueHelpForFilters", that);

			if (!this.valueHelpForSort)
				this.valueHelpForSort = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.valueHelpForSort", this);
			if (!that._oPopover) {
				that._oPopover = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.linkingPopOver", that);
				that.getView().addDependent(that._oPopover);
			}

			service.callService("databases", "databases", "database_list", "", true,
				function (evt) {
					var tModel = sap.ui.getCore().getModel("databases");
					that.getView().byId("database").setModel(tModel);
				});

			service.callService("Brevo" + "Tables", "Brevo" + "Tables", "getAllTablesAndViews?db=Brevo", "", true,
				function (evt) {
					var tModel = sap.ui.getCore().getModel("Brevo" + "Tables");
					that.getView().byId("tables").setModel(tModel);
				});

			var bus = sap.ui.getCore().getEventBus();
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("createQuery").attachPatternMatched(this.onPatternMatched, this);

			if (!that.createViewDialog) {
				that.createViewDialog = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.createView", that);
			}
			if (!that.editViewDialog) {
				that.editViewDialog = sap.ui.xmlfragment("Brevo.QueryBuilder.fragment.editView", that);
			}
			this.graph = new joint.dia.Graph;
			this.position = 30;
			this.posCount = 0;

		},
		onPatternMatched: function (evt) {
			var that = this;
			this.editMode = evt.getParameter("arguments").isEditMode;
			var isWizardDataPresent = evt.getParameter("arguments").isWizardDataPresent
			that.filterValues = [];
			that.sColumns = [];
			that.tableData = [];

			if (this.editMode != undefined) {
				if (that.editMode || that.editMode == "true") {
					that.getView().byId("editorButton").setEnabled(false);
					that.BusyDialog.open();
					that.getView().byId("formulaId").setVisible(true);
					var tileModel = sap.ui.getCore().getModel("queryInfo");
					var selectedDB = tileModel.getData().tables[0].split(".")[0];
					var selected_column = tileModel.getData().selected_columns;
					var arr = [];
					var array = [];
					arr = selected_column.split(",");

					for (var i = 0; i < arr.length; i++) {
						var inclAs = arr[i].includes("as");
						var inclBrace = arr[i].includes("(");
						if (inclAs && inclBrace) {
							array.push(arr[i]);
						}
					}

					var slpitformula = [];
					var formula = [];
					var alias = [];
					for (var t = 0; t < array.length; t++) {
						if (array[t].includes("Quarter(") || array[t].includes("Month(") || array[t].includes("Log(") || array[t].includes("Int(") ||
							array[t].includes("Float(") || array[t].includes("Double(")) {
							var splitFormula = array[t].split(" as ");
							var data = splitFormula[0].trim();
							var form = data.substring(1, data.length - 1);
							formula.push(form);
							alias.push(splitFormula[1].trim());
						} else {
							slpitformula = array[t].split("(")[1];
							formula.push(slpitformula.split(")")[0]);
							alias.push(slpitformula.split(" as ")[1].trim());
						}

					}
					var newArr = [];
					for (var r = 0; r < formula.length; r++) {
						var objectFormula = {};
						objectFormula["Formula"] = formula[r];
						objectFormula["Aliasname"] = alias[r];
						newArr.push(objectFormula);
					}

					var fModel = new sap.ui.model.json.JSONModel(newArr);
					that.getView().byId("comboBoxFormulaId").setModel(fModel);
					service.callService(selectedDB + "TablesonEdit", selectedDB + "TablesonEdit", "getAllTablesAndViews?db=" + selectedDB, "", true,
						function (evt) {
							var tModel = sap.ui.getCore().getModel(selectedDB + "TablesonEdit");
							that.getView().byId("tables").setModel(tModel);
							that.onEditMode();
						});
				} else {
					that.getView().byId("editorButton").setEnabled(true);
				}
			} else if (isWizardDataPresent) {
				var wizardDataModel = sap.ui.getCore().getModel("wizardDataModel");
				that.setDataforOutputView(wizardDataModel.getData());
			}

		},
		//on select of a database from the list
		onDatabaseChange: function (evt) {
			var that = this;
			var selectedDB = evt.mParameters.selectedItem.getKey();

			this.dbName = selectedDB;
			service.callService(selectedDB + "Tables", selectedDB + "Tables", "getAllTablesAndViews?db=" + selectedDB, "", true,
				function (evt) {
					var tModel = sap.ui.getCore().getModel(selectedDB + "Tables");
					that.getView().byId("tables").setModel(tModel);
					that.selectedTables = [];
					var selData = {
						"selectedTables": that.selectedTables
					};

					var outputTables = new sap.ui.model.json.JSONModel(selData);
					that.getView().byId("selectedTables").setModel(outputTables);
				});
			this.removeContent();
		},
		//on click of SQL editor buttor
		onEditorPress: function (evt) {
			var selectedTablesModel = this.getView().byId("selectedTables").getModel();
			if (selectedTablesModel) {
				if (selectedTablesModel.oData.selectedTables !== undefined && selectedTablesModel.oData.selectedTables.length > 0) {
					var wizardData = this.constructPayloadForWizard();
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					var url = "GetQuery";

					var tileModel = sap.ui.getCore().getModel("queryInfo");
					service.callCreateService(url, JSON.stringify(wizardData), "POST", function (evt, sucessFlag, oError) {
						if (sucessFlag) {
							var data = JSON.parse(evt);
							var queryModel = new sap.ui.model.json.JSONModel(data);
							sap.ui.getCore().setModel(queryModel, "dataQueryModel");
							oRouter.navTo("sqlEditor", {
								isQueryPresent: true
							});
						} else if (JSON.parse(evt).message === "View with this ID already exists") {
							sap.m.MessageToast.show("Query Name already exists.Please give a different Query Name");
						} else {
							sap.m.MessageToast.show("Unable to create view.Try again");
						}
					});
				} else {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("sqlEditor");
				}
			} else {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("sqlEditor");

			}

		},
		// Executed when user edits the query
		onEditMode: function () {
			var that = this;
			that.tableData = [];
			this.graph = new joint.dia.Graph;
			this.position = 30;
			this.posCount = 0;
			this.sColumns = [];
			var filterModel;
			var tileModel = sap.ui.getCore().getModel("queryInfo");
			this.viewData = tileModel.getData();
			this.conditions = tileModel.getData().conditions;
			var databases = that.getView().byId("database").getItems();
			var selectedDB = tileModel.getData().tables[0].split(".")[0];
			that.dbName = tileModel.getData().tables[0].split(".")[0];
			if (tileModel.getData().orderby) {
				var sortType = tileModel.getData().orderby.split(" ")[1];
				var sortItemSelected = tileModel.getData().orderby.split(" ")[0];
				this.sortItems = [{
					sortOperator: sortType,
					selectedSortItem: sortItemSelected
				}];
				this.getView().byId("sortById").setValue(sortItemSelected);
			} else {
				this.sortItems = [];
				this.getView().byId("sortById").setValue();
			}
			for (var i = 0; i < databases.length; i++) {
				if (databases[i].getBindingContext().getObject().name === selectedDB) {
					that.getView().byId("database").setSelectedKey(selectedDB);
				}
			}
			that.viewId = tileModel.getData()._id;
			var select = "TableMetadata?db=" + selectedDB;

			that.addLinkingItem(that.tableData);
			// service.callService(selectedDB + "Tables", selectedDB + "Tables", "getAllTablesAndViews?db=" + selectedDB, "", true,
			// 	function (evt) {
			// var tModel = sap.ui.getCore().getModel(selectedDB + "Tables");
			// that.getView().byId("tables").setModel(tModel);
			var items = that.getView().byId("tables").getItems();
			var parentTable = tileModel.getData().parent_table.split(".")[1];
			var finalURL = select + "&table=" + parentTable;
			that.callService(parentTable, true, finalURL);
			var tableArr = tileModel.getData().tables;
			var tables = [];

			for (var k = 0; k < tableArr.length; k++) {
				var stableName = tableArr[k].split(".")[1];
				tables.push(stableName);
				finalURL = select + "&table=" + stableName;
				that.callService(stableName, true, finalURL);
			}

			for (i = 0; i < items.length; i++) {
				if (items[i].getBindingContext().getObject().TABLE_NAME === parentTable) {
					that.getView().byId("tables").setSelectedItem(items[i]);
				} else {
					for (var j = 0; j < tables.length; j++) {
						if (items[i].getBindingContext().getObject().TABLE_NAME === tables[j]) {
							that.getView().byId("tables").setSelectedItem(items[i]);
						}
					}
				}
			}

			var sel_items = that.getView().byId("tables").getSelectedItems();
			var sel_tables = [];
			for (i = 0; i < sel_items.length; i++) {
				if (sel_items[i].getBindingContext().getObject().TABLE_NAME === parentTable) {
					sel_tables.push(sel_items[i].getBindingContext().getObject());
				}
			}
			for (j = 0; j < tables.length; j++) {
				for (i = 0; i < sel_items.length; i++) {
					if (sel_items[i].getBindingContext().getObject().TABLE_NAME === tables[j]) {
						sel_tables.push(sel_items[i].getBindingContext().getObject());
					}
				}
			}
			that.selectedTables = sel_tables;
			var selData = {
				"selectedTables": sel_tables
			};

			var outputTables = new sap.ui.model.json.JSONModel(selData);
			that.getView().byId("selectedTables").setModel(outputTables);
			that.BusyDialog.close();
			// });

			var OutputColumnsTableModel = new sap.ui.model.json.JSONModel(JSON.parse(tileModel.getData().table_config));
			that.getView().byId("columnSelectionTableId").setModel(OutputColumnsTableModel);
			this._handleNavigationToStep(3);
			that.setDataforOutputView();
			// that.clickNext();

		},
		//on selection of tables from the list
		clickNext: function (event) {
			var that = this;
			var database = this.getView().byId("database").getSelectedKey();
			var select = "TableMetadata?db=" + database;
			try {
				var selectedTable = event.mParameters.listItem.getBindingContext().getObject().TABLE_NAME;
				var selected = event.mParameters.selected;
			} catch (e) {
				var selectedTable = '';
			}

			if (selected && selectedTable.length > 0) {
				var finalURL = select + "&table=" + selectedTable;
				that.callService(selectedTable, selected, finalURL);
			} else if (!selected) {
				for (var i = 0; i < that.tableData.length; i++) {
					if (that.tableData[i].table === selectedTable) {
						that.tableData.splice(i, 1);
					}
				}
				// that.addLinkingItem(that.tableData);
			}

			var sel_items = this.getView().byId("tables").getSelectedItems();
			var list = sel_items.length;
			if (list >= 2) {
				this._wizard.validateStep(this.byId("ProductTypeStep"));
			} else if (list < 2) {
				// var msg = 'Minimum 2 Tables/Views must be selected';
				// MessageToast.show(msg);
				this._wizard.invalidateStep(this.byId("ProductTypeStep"));
			}

			if (event) {
				if (event.mParameters.selected === true) {
					that.clickedTable = event.getParameter("listItem").getBindingContext().getObject().TABLE_NAME;
					this.selectedTables.push(event.mParameters.listItem.getBindingContext().getObject());
				} else {
					that.clickedTable = undefined;
					try {
						for (var k = 0; k < this.selectedTables.length; k++) {
							if (this.selectedTables[k].TABLE_NAME === event.mParameters.listItem.getBindingContext().getObject().TABLE_NAME) {
								this.selectedTables.splice(k, 1);
							}
						}

						var cells = that.graph.getCells();
						for (var i = 0; i < cells.length; i++) {
							if (cells[i].attributes.type === "mapping.Record") {
								if (cells[i].attributes.attrs.headerLabel.textWrap.text === selectedTable) {
									cells[i].remove();
								}
							}
						}

						// if (that.editMode) {
						var arr = [
							[{
								id: 'value',
								label: 'Output Values',
							}, {
								id: 'value_12',
								label: '',
							}]
						];
						for (var i = 0; i < cells.length; i++) {
							if (cells[i].attributes.type == "mapping.Join") {
								cells[i].remove();
							} else if (cells[i].attributes.type == "mapping.Output") {
								cells[i].set("items", arr);
							}
						}
						this.joinsCount = 0;
						this.joinTablePosition = 190;
						// }

						if (this.selectedTables.length === 0) {
							for (var i = 0; i < cells.length; i++) {
								cells[i].remove();
								that.posCount = 0;
							}
						}
					} catch (e) {}
				}
			}
			var selData = {
				"selectedTables": this.selectedTables
			};

			var outputTables = new sap.ui.model.json.JSONModel(selData);
			this.getView().byId("selectedTables").setModel(outputTables);
		},
		//GET Service call
		callService: function (selectedTable, selected, finalUrl) {
			var that = this;
			that.BusyDialog.open();

			// service.callService("table" + that.tableCount + "fields", "table" + that.tableCount + "fields", finalUrl, "", true,
			service.callService(selectedTable + "tablefields", selectedTable + "tablefields", finalUrl, "", true,
				function (evt) {
					that.BusyDialog.close();
					var t1Model = sap.ui.getCore().getModel(selectedTable + "tablefields");
					var t1MItems = [],
						t1MObj = [];
					var t1DItems = [],
						t1DObj = [],
						fields = [];
					for (var i = 0; i < t1Model.oData.COLUMN_DET.length; i++) {
						if (t1Model.oData.COLUMN_DET[i].TYPE === "MEASURE" || t1Model.oData.COLUMN_DET[i].DATATYPE == "Date") {
							// t1MItems.push({
							// 	"measure": t1Model.oData.tables.fields[i].name
							// });
							t1MObj.push({
								"measureObj": t1Model.oData.COLUMN_DET[i]
							});
						} else {
							// t1DItems.push({
							// 	"dimension": t1Model.oData.tables.fields[i].name
							// });
							t1DObj.push({
								"dimensionObj": t1Model.oData.COLUMN_DET[i]
							});
						}
						var fieldObj = {
							col_datatype: t1Model.oData.COLUMN_DET[i].DATATYPE,
							datatype: t1Model.oData.COLUMN_DET[i].TYPE,
							id: t1Model.oData.TABLENAME + t1Model.oData.COLUMN_DET[i].COLUMN_NAME,
							label: t1Model.oData.COLUMN_DET[i].LABEL,
							max_length: 15,
							name: t1Model.oData.COLUMN_DET[i].COLUMN_NAME,
							tablename: t1Model.oData.TABLENAME,
						};
						fields.push(fieldObj);
					}
					var t1Measures = {
						"table": t1Model.oData.TABLENAME,
						"measures": t1Model.oData.MEASURES,
						"dimensions": t1Model.oData.DIMENSIONS,
						"measureObject": t1MObj,
						"dimensionObject": t1DObj,
						"fields": fields
					};

					if (selected && selectedTable === t1Model.oData.TABLENAME) {
						that.tableData.push(t1Measures);
						if (!that.editMode) {
							var cells = that.graph.getCells();
							for (var i = 0; i < cells.length; i++) {
								if (cells[i].attributes.type === "mapping.Record") {
									if (cells[i].attributes.attrs.headerLabel.textWrap.text === selectedTable) {
										cells[i].remove();
									}
								}
							}
							var order = new joint.shapes.mapping.Record({
								attrs: {
									itemLabels: {
										fill: '#fe854f',
										itemHighlight: {
											'fill': '#000000'
										}
									}
								},
								items: [
									[{
										id: t1Measures.table,
										label: 'Columns',
										icon: 'images/table.svg',
										group: "disabled",
										items: t1Measures.fields
									}]
								]
							});
							var heightInPx = t1Measures.fields.length * 22 + 400;
							var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
							if (heightInPx > paperHeight) {
								document.getElementById("linkingProperties").style.height = heightInPx + "px";
							}
							if (that.posCount === 0) {
								that.addLinkingItem(that.tableData);
								that.position = 30;
								var output = new joint.shapes.mapping.Output({
									attrs: {
										headerLabel: {
											cursor: "pointer",
											magnet: false
										}
									},
									items: [
										[{
											id: 'value',
											label: 'Output Values',
										}, {
											id: 'value_12',
											label: '',
										}]
									]
								});
								output.position(1000, 180);
								output.addTo(that.graph);
								output.setName("Output Columns");
								that.posCount = 1;
							} else {
								that.position = that.position + 190;
							}
							var heightInPx = t1Measures.fields.length * 22 + 400;
							var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
							if (heightInPx > paperHeight) {
								document.getElementById("linkingProperties").style.height = heightInPx + "px";
							}
							order.setName(t1Measures.table);
							order.position(that.position, 300);
							order.addTo(that.graph);
							// that.addLinkingItem(that.tableData);
							// console.log(that.tableData);
						} else if (that.editMode && that.clickedTable === selectedTable) {
							if (that.posCount === 0) {
								that.addLinkingItem(that.tableData);
								that.position = 30;
								var output = new joint.shapes.mapping.Output({
									attrs: {
										headerLabel: {
											cursor: "pointer",
											magnet: false
										}
									},
									items: [
										[{
											id: 'value',
											label: 'Output Values',
										}, {
											id: 'value_12',
											label: '',
										}]
									]
								});
								output.position(1000, 180);
								output.addTo(that.graph);
								output.setName("Output Columns");

								var order = new joint.shapes.mapping.Record({
									attrs: {
										itemLabels: {
											fill: '#fe854f',
											itemHighlight: {
												'fill': '#000000'
											}
										}
									},
									items: [
										[{
											id: t1Measures.table,
											label: 'Columns',
											icon: 'images/table.svg',
											group: "disabled",
											items: t1Measures.fields
										}]
									]
								});
								order.setName(t1Measures.table);
								order.position(that.position, 300);
								order.addTo(that.graph);
								that.posCount = 1;
							} else {
								that.position = that.position + 190;
								var order = new joint.shapes.mapping.Record({
									attrs: {
										itemLabels: {
											fill: '#fe854f',
											itemHighlight: {
												'fill': '#000000'
											}
										}
									},
									items: [
										[{
											id: t1Measures.table,
											label: 'Columns',
											icon: 'images/table.svg',
											group: "disabled",
											items: t1Measures.fields
										}]
									]
								});
								order.setName(t1Measures.table);
								order.position(that.position, 300);
								order.addTo(that.graph);
							}
						}
					} else {
						for (i = 0; i < that.tableData.length; i++) {
							if (that.tableData[i].table === selectedTable) {
								that.tableData.splice(i, 1);
							}
						}
					}

					// that.addLinkingItem(that.tableData);

				});
		},
		//to add vboxes for selecting linking dimension
		addLinkingItem: function (tableData) {
			var that = this;
			joint.setTheme('material');
			var arr1 = [{
				id: 'value_1',
				label: 'Value1',
				group: 'headers'
			}, {
				id: 'value3',
				label: '',
			}, {
				id: 'value4',
				label: ''
			}];
			var arr2 = [{
				id: 'value_2',
				label: 'Value2',
				group: 'headers'
			}, {
				id: 'value3',
				label: '',
			}, {
				id: 'value4',
				label: ''
			}];
			var itemArray = [];
			itemArray.push(arr1);
			itemArray.push(arr2);
			var linkingDataSet = false;

			var paper = new joint.dia.Paper({
				el: document.getElementById("linkingProperties"),
				model: this.graph,
				width: "100%",
				height: 1000,
				gridSize: 10,
				background: {
					color: '#f6f6f6'
				},
				magnetThreshold: 'onleave',
				moveThreshold: 5,
				clickThreshold: 5,
				linkPinning: false,
				interactive: {
					linkMove: false,
					elementMove: false
				},
				markAvailable: true,
				snapLinks: {
					radius: 40
				},
				defaultRouter: {
					name: 'mapping',
					args: {
						padding: 30
					}
				},
				defaultConnectionPoint: {
					name: 'anchor'
				},
				defaultAnchor: {
					name: 'mapping'
				},
				defaultConnector: {
					name: 'jumpover',
					args: {
						jump: 'cubic'
					}
				},
				highlighting: {
					magnetAvailability: {
						name: 'addClass',
						options: {
							className: 'record-item-available'
						}
					},
					connecting: {
						name: 'stroke',
						options: {
							padding: 8,
							attrs: {
								'stroke': 'none',
								'fill': '#7c68fc',
								'fill-opacity': 0.2
							}
						}
					}
				},
				defaultLink: function () {
					return new joint.shapes.mapping.Link();
				},
				validateConnection: function (sv, sm, tv, tm, end) {
					if (sv === tv) return false;
					if (sv.model.isLink() || tv.model.isLink()) return false;
					if (end === 'target') return tv.model.getItemSide(tv.findAttribute('item-id', tm)) !== 'right';
					return sv.model.getItemSide(sv.findAttribute('item-id', sm)) !== 'left';
				}
			});
			paper.on('link:mouseenter', function (linkView) {
				this.removeTools();
				showLinkTools(linkView);
			});

			paper.on('link:mouseleave', function (linkView) {
				this.removeTools();
				if (linkView.targetMagnet !== undefined && linkView.targetMagnet !== null) {
					try {
						var defaulttargetId = linkView.targetMagnet.getAttribute("item-id");
						var defaultsourceId = linkView.sourceMagnet.getAttribute("item-id");
						var cells = that.graph.getCells();

						if (linkView.targetMagnet.getAttribute("item-id") === defaulttargetId) {
							if (linkView.targetView.model.attributes.type === "mapping.Join" && linkView.sourceView.model.attributes.type ===
								"mapping.Join") {

								for (var i = 0; i < cells.length; i++) {
									if (cells[i].attributes.type === "mapping.Link") {
										if (linkView.model !== cells[i]) {
											if (cells[i].attributes.source.id === linkView.model.attributes.source.id && cells[i].attributes.target.id === linkView
												.model
												.attributes.target.id) {
												cells[i].remove();
												// that.position = that.position - 190;
											}
										}
									}
								}
								var arr1 = [];
								var linkingPropertyPushed = false;
								var joinTableColumns = [];
								for (var i = 0; i < linkView.sourceView.model.attributes.items.length; i++) {
									for (var j = 0; j < linkView.sourceView.model.attributes.items[i].length; j++) {
										if (j == 0) {
											delete linkView.sourceView.model.attributes.items[i][j].group;
											joinTableColumns.push(linkView.sourceView.model.attributes.items[i][j]);
										} else {
											joinTableColumns.push(linkView.sourceView.model.attributes.items[i][j]);
										}

									}
								}
								var sourceId = linkView.sourceMagnet.getAttribute("item-id");
								for (var i = 0; i < joinTableColumns.length; i++) {
									if (sourceId === joinTableColumns[i].id) {
										arr1.push(joinTableColumns[i]);
										linkingPropertyPushed = true;
									}
								}
								if (linkingPropertyPushed) {
									for (j = 0; j < joinTableColumns.length; j++) {
										// if (!linkView.sourceView.model.isItemHighlighted(joinTableColumns[j].id)) {
										if (joinTableColumns[j].id !== sourceId) {
											arr1.push(joinTableColumns[j]);
										}
										// }
									}

								}
								arr1[0]["group"] = "headers";
								// arr1[0]["id"] = arr1[0]["tablename"] + "_" +  arr1[0]["name"];
								itemArray = linkView.targetView.model.attributes.items;
								itemArray.splice(0, 1, arr1);
								var heightInPx;
								if (itemArray[0].length > itemArray[1].length) {
									heightInPx = itemArray[0].length * 22 + 400;
								} else if (itemArray[1].length > itemArray[0].length) {
									heightInPx = itemArray[1].length * 22 + 400;
								}
								var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
								if (heightInPx > paperHeight) {
									document.getElementById("linkingProperties").style.height = heightInPx + "px";
								}
								linkView.targetView.model.set("items", itemArray);
								linkView.targetView.model.toggleItemHighlight(linkView.targetView.model.attributes.items[1][0].id);
							} else if (linkView.targetView.model.attributes.type === "mapping.Join") {
								if (linkView.sourceView.model.attributes.type !== "mapping.Output") {
									for (var i = 0; i < cells.length; i++) {
										if (cells[i].attributes.type === "mapping.Link") {
											if (linkView.model !== cells[i]) {
												if (cells[i].attributes.source.id === linkView.model.attributes.source.id && cells[i].attributes.target.id ===
													linkView.model
													.attributes.target.id) {
													cells[i].remove();
												}
											}
										}
									}
									var arr1 = [];
									var linkingPropertyPushed = false;
									var sourceTable = linkView.sourceView.model.attributes.items[0][0].id;
									var sourceId = linkView.sourceMagnet.getAttribute("item-id");
									for (var i = 0; i < that.tableData.length; i++) {
										if (that.tableData[i].table === sourceTable) {
											for (var j = 0; j < that.tableData[i].fields.length; j++) {
												if (sourceId === that.tableData[i].fields[j].id) {
													arr1.push(that.tableData[i].fields[j]);
													linkingPropertyPushed = true;
												}
											}
										}
									}
									if (linkingPropertyPushed) {
										var srcTableItems = linkView.sourceView.model.attributes.items[0][0].items;
										for (j = 0; j < srcTableItems.length; j++) {
											if (!linkView.sourceView.model.isItemHighlighted(srcTableItems[j].id)) {
												if (srcTableItems[j].id !== sourceId) {
													arr1.push(srcTableItems[j]);
												}
											}
										}

									}
									arr1[0]["group"] = "headers";
									// arr1[0]["id"] = arr1[0]["tablename"] + "_" +  arr1[0]["name"];
									itemArray = linkView.targetView.model.attributes.items;
									itemArray.splice(0, 1, arr1);
									var heightInPx;
									if (itemArray[0].length > itemArray[1].length) {
										heightInPx = itemArray[0].length * 22 + 400;
									} else if (itemArray[1].length > itemArray[0].length) {
										heightInPx = itemArray[1].length * 22 + 400;
									}
									var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
									if (heightInPx > paperHeight) {
										document.getElementById("linkingProperties").style.height = heightInPx + "px";
									}
									linkView.targetView.model.set("items", itemArray);
									linkView.targetView.model.toggleItemHighlight(linkView.targetView.model.attributes.items[1][0].id);
								} else if (linkView.sourceView.model.attributes.type === "mapping.Output") {
									linkView.remove();
								}

							} else if (linkView.targetView.model.attributes.type === "mapping.Output") {
								if (linkView.sourceView.model.attributes.type === "mapping.Join") {
									arr1 = [];
									linkingPropertyPushed = false;
									joinTableColumns = [];
									for (var i = 0; i < linkView.sourceView.model.attributes.items.length; i++) {
										for (var j = 0; j < linkView.sourceView.model.attributes.items[i].length; j++) {
											if (j == 0) {
												delete linkView.sourceView.model.attributes.items[i][j].group;
												joinTableColumns.push(linkView.sourceView.model.attributes.items[i][j]);
											} else {
												joinTableColumns.push(linkView.sourceView.model.attributes.items[i][j]);
											}
										}
									}
									var sourceId = linkView.sourceMagnet.getAttribute("item-id");
									for (var i = 0; i < joinTableColumns.length; i++) {
										if (sourceId === joinTableColumns[i].id) {
											arr1.push(joinTableColumns[i]);
											linkingPropertyPushed = true;
										}
									}
									if (linkingPropertyPushed) {
										for (j = 0; j < joinTableColumns.length; j++) {
											if (joinTableColumns[j].id !== sourceId) {
												arr1.push(joinTableColumns[j]);
											}
										}

									}

									var itemArray = [];
									itemArray.push(arr1);
									var heightInPx;
									heightInPx = arr1.length * 22 + 400;
									var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
									if (heightInPx > paperHeight) {
										document.getElementById("linkingProperties").style.height = heightInPx + "px";
									}
									linkView.targetView.model.set("items", itemArray);
									that.validateStepFour();
								} else if (linkView.sourceView.model.attributes.type === "mapping.Record") {
									linkView.remove();
								}
							} else if (linkView.sourceView.model.attributes.type === "mapping.Record" && linkView.targetView.model.attributes.type ===
								"mapping.Record") {
								linkView.remove();
							} else if (linkView.sourceView.model.attributes.type === "mapping.Output") {
								linkView.remove();
							} else if (linkView.sourceMagnet.getAttribute("item-id") === defaultsourceId) {
								if (linkView.sourceMagnet !== undefined && linkView.sourceMagnet !== null) {
									if (linkView.targetView.model.attributes.type === "mapping.Join" && linkView.sourceView.model.attributes.type ===
										"mapping.Join") {
										arr1 = [];
										linkingPropertyPushed = false;
										joinTableColumns = [];
										for (var i = 0; i < linkView.targetView.model.attributes.items.length; i++) {
											for (var j = 0; j < linkView.targetView.model.attributes.items[i].length; j++) {
												// if(j!==0){
												joinTableColumns.push(linkView.targetView.model.attributes.items[i][j]);
												// }

											}
										}
										var sourceId = linkView.sourceMagnet.getAttribute("item-id");
										for (var i = 0; i < joinTableColumns.length; i++) {
											if (sourceId === joinTableColumns[i].id) {
												arr1.push(joinTableColumns[i]);
												linkingPropertyPushed = true;
											}
										}
										if (linkingPropertyPushed) {
											for (j = 0; j < joinTableColumns.length; j++) {
												if (!linkView.targetView.model.isItemHighlighted(joinTableColumns[j].id)) {
													if (joinTableColumns[j].id !== sourceId) {
														arr1.push(joinTableColumns[j]);
													}
												}
											}

										}
										arr1[0]["group"] = "headers";
										// arr1[0]["id"] = arr1[0]["tablename"] + "_" +  arr1[0]["name"];
										var itemArray = linkView.sourceView.model.attributes.items;
										itemArray.splice(1, 1, arr1);
										var heightInPx;
										if (itemArray[0].length > itemArray[1].length) {
											heightInPx = itemArray[0].length * 22 + 400;
										} else if (itemArray[1].length > itemArray[0].length) {
											heightInPx = itemArray[1].length * 22 + 400;
										}
										var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
										if (heightInPx > paperHeight) {
											document.getElementById("linkingProperties").style.height = heightInPx + "px";
										}
										linkView.sourceView.model.set("items", itemArray);
										// linkView.sourceView.model.toggleItemHighlight(linkView.sourceView.model.attributes.items[0][0].id);
									} else if (linkView.sourceView.model.attributes.type === "mapping.Join") {
										for (var i = 0; i < cells.length; i++) {
											if (cells[i].attributes.type === "mapping.Link") {
												if (linkView.model !== cells[i]) {
													if (cells[i].attributes.source.id === linkView.model.attributes.source.id && cells[i].attributes.target.id ===
														linkView
														.model.attributes.target.id) {
														cells[i].remove();
													}
												}
											}
										}
										var arr1 = [];
										var linkingPropertyPushed = false;
										var sourceTable = linkView.targetView.model.attributes.items[0][0].id;
										var sourceId = linkView.targetMagnet.getAttribute("item-id");
										for (var i = 0; i < that.tableData.length; i++) {
											if (that.tableData[i].table === sourceTable) {
												for (var j = 0; j < that.tableData[i].fields.length; j++) {
													if (sourceId === that.tableData[i].fields[j].id) {
														arr1.push(that.tableData[i].fields[j]);
														linkingPropertyPushed = true;
													}
												}
											}
										}
										if (linkingPropertyPushed) {
											var srcTableItems = linkView.targetView.model.attributes.items[0][0].items;
											for (j = 0; j < srcTableItems.length; j++) {
												if (!linkView.targetView.model.isItemHighlighted(srcTableItems[j].id)) {
													if (srcTableItems[j].id !== sourceId) {
														arr1.push(srcTableItems[j]);
													}

												}
											}

										}
										arr1[0]["group"] = "headers";
										// arr1[0]["id"] = arr1[0]["tablename"] + "_" +  arr1[0]["name"];
										var itemArray = linkView.sourceView.model.attributes.items;
										itemArray.splice(1, 1, arr1);
										var heightInPx;
										if (itemArray[0].length > itemArray[1].length) {
											heightInPx = itemArray[0].length * 22 + 400;
										} else if (itemArray[1].length > itemArray[0].length) {
											heightInPx = itemArray[1].length * 22 + 400;
										}
										var paperHeight = parseInt(document.getElementById("linkingProperties").style.height);
										if (heightInPx > paperHeight) {
											document.getElementById("linkingProperties").style.height = heightInPx + "px";
										}
										linkView.sourceView.model.set("items", itemArray);
										linkView.sourceView.model.toggleItemHighlight(linkView.sourceView.model.attributes.items[0][0].id);
									}
								}
							}
						}

					} catch (e) {

					}
				}
				// linkView.targetView.model.attributes.items = itemArray;

			});

			paper.on('element:magnet:pointerdblclick', function (elementView, evt, magnet) {
				evt.stopPropagation();
				itemEditAction(elementView.model, elementView.findAttribute('item-id', magnet));
			});

			paper.on('element:magnet:pointerclick', function (elementView, evt, magnet) {
				var element = elementView.model;
				if (magnet.textContent === "inner join" || magnet.textContent === "left join" || magnet.textContent === "right join" || magnet
					.textContent ===
					"full join") {
					var tools = elementView.model.getItemTools();
					if (tools) {
						evt.stopPropagation();
						elementJoinPicker(elementView.el, elementView, tools);
					}
				} else if (magnet.textContent === "Output Columns") {
					that._wizard.setCurrentStep(that.byId("Linking"));
				} else if (element.attributes.type !== "mapping.Join") {
					var itemId = elementView.findAttribute('item-id', magnet);
					element.toggleItemHighlight(itemId);
				}

			});

			paper.on('element:contextmenu', function (elementView, evt) {
				var tools = elementView.model.getTools();
				if (tools) {
					evt.stopPropagation();
					elementActionPicker(elementView.el, elementView, tools);
				}
			});

			// paper.on('element:magnet:contextmenu', function (elementView, evt, magnet) {
			// 	var tools = elementView.model.getItemTools();
			// 	if (tools) {
			// 		evt.stopPropagation();
			// 		elementJoinPicker(elementView.el, elementView, tools);
			// 	}
			// });

			paper.on('element:pointerclick', function (elementView) {
				showElementTools(elementView);
			});

			paper.on('element:pointermove', function (view, evt, x, y) {
				var data = evt.data;
				if (data.ghost) {
					data.ghost.attr({
						'x': x - data.dx,
						'y': y - data.dy
					});
				} else {
					var bbox = view.model.getBBox();
					var ghost = V('rect');
					ghost.attr(bbox);
					ghost.attr({
						'fill': 'transparent',
						'stroke': '#5755a1',
						'stroke-dasharray': '4,4',
						'stroke-width': 2
					});
					ghost.appendTo(this.viewport);
					evt.data.ghost = ghost;
					evt.data.dx = x - bbox.x;
					evt.data.dy = y - bbox.y;
				}
			});

			paper.on('element:pointerup', function (view, evt, x, y) {
				var data = evt.data;
				if (data.ghost) {
					data.ghost.remove();
					view.model.position(x - data.dx, y - data.dy);
				}
			});

			// Actions

			function showElementTools(elementView) {
				var element = elementView.model;
				var deleteButton = new joint.ui.Halo({
					cellView: elementView,
					handles: [{
						name: 'remove',
						position: 'ne',
						events: {
							pointerdown: 'removeElement'
						},
						attrs: {
							'.handle': {
								'data-tooltip-class-name': 'small',
								'data-tooltip': 'Click to remove the object',
								'data-tooltip-position': 'right',
								'data-tooltip-padding': 15
							}
						}
					}]
				});
				if (element.attributes.type === "mapping.Join") {
					deleteButton.render();
				}

				var transform = new joint.ui.FreeTransform({
					cellView: elementView,
					allowRotation: false
				});
				transform.render();
				transform.listenTo(element, 'change', updateMinSize);
				updateMinSize();

				function updateMinSize() {
					var minSize = element.getMinimalSize();
					transform.options.minHeight = minSize.height;
					transform.options.minWidth = minSize.width;
				}
			}

			function showLinkTools(linkView) {
				var toolsq = new joint.dia.ToolsView({
					tools: [
						new joint.linkTools.mapping.SourceArrowhead(),
						new joint.linkTools.mapping.TargetArrowhead({
							restrictArea: false,
						}),
						new joint.linkTools.mapping.Remove({
							distance: '25%',
							action: function () {
								linkAction(this.model);
							}
						})
					]
				});
				linkView.addTools(toolsq);
			}

			function itemActionPicker(target, elementView, itemId, tools) {

				var toolbar = new joint.ui.ContextToolbar({
					target: target,
					padding: 5,
					vertical: true,
					tools: tools
				});
			}

			function elementJoinPicker(target, elementView, tools) {

				var element = elementView.model
				var toolbar = new joint.ui.ContextToolbar({
					target: target,
					padding: 5,
					vertical: true,
					tools: tools
				});

				toolbar.render();
				toolbar.on({
					'action:on-inner-join': function () {
						toolbar.remove();
						element.setName("inner join");
					},
					'action:on-full-join': function () {
						toolbar.remove();
						element.setName("full join");
					},
					'action:on-left-join': function () {
						toolbar.remove();
						element.setName("left join");
					},
					'action:on-right-join': function () {
						toolbar.remove();
						element.setName("right join");
					}
				});
			}

			function elementActionPicker(target, elementView, tools) {

				var element = elementView.model
				var toolbar = new joint.ui.ContextToolbar({
					target: target,
					padding: 5,
					vertical: true,
					tools: tools
				});

				toolbar.render();
				toolbar.on({
					'action:remove': function () {
						toolbar.remove();
						element.remove();
					},
					'action:add-item': function () {
						toolbar.remove();
						element.addItemAtIndex(0, Infinity, element.getDefaultItem());
					}
				});
			}

			function itemEditAction(element, itemId) {

				// var config = element.getInspectorConfig(itemId);
				// if (!config) return;

				// var inspector = new joint.ui.Inspector({
				// 	cell: element,
				// 	live: false,
				// 	inputs: joint.util.setByPath({}, element.getItemPathArray(itemId), config)
				// });

				// inspector.render();
				// inspector.el.style.position = 'relative';
				// inspector.el.style.overflow = 'hidden';

				// var input = inspector.el.querySelector('[contenteditable]');
				// var selection = window.getSelection();
				// var range = document.createRange();
				// range.selectNodeContents(input);
				// selection.removeAllRanges();
				// selection.addRange(range);
			}

			function linkAction(link) {

				var dialog = new sap.m.Dialog({
					title: 'Confirm',
					type: 'Message',
					content: new sap.m.Text({
						text: 'Are you sure you want to delete this link ?'
					}),
					beginButton: new sap.m.Button({
						text: 'Remove',
						press: function () {
							link.remove();
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}

			if (this.editMode) {
				// this.setDataforOutputView();
			} else {
				this.validateStepFour();
			}
			if (this.editMode && that.clickedTable !== undefined)
				this.validateStepFour();

		},

		onAddJoinPress: function () {
			var concat1 = new joint.shapes.mapping.Join({
				attrs: {
					headerLabel: {
						cursor: "pointer",
						magnet: false,
						class: "iconClass"
							// onclick: "console.log('clicked')"
					}
				},
				items: [
					[{
						id: 'value_1',
						label: 'Value 1',
						group: 'headers'
					}, {
						id: 'value_12',
						label: '',
					}, {
						id: 'value_3',
						label: ''
					}],
					[{
						id: 'value_2',
						label: 'Value 2',
						group: 'headers'
					}, {
						id: 'value3',
						label: '',
					}, {
						id: 'value4',
						label: ''
					}]
				]
			});
			if (this.joinsCount === 0) {
				this.joinTablePosition = 190;
				this.joinsCount = this.joinsCount + 1;
			} else {
				this.joinTablePosition = this.joinTablePosition + 400;
			}
			concat1.position(this.joinTablePosition, 30);
			concat1.addTo(this.graph);
			concat1.setName("inner join");
		},

		//validates Step three
		validateStepThree: function () {
			var that = this;
			that._wizard.validateStep(that.byId("linkingDimension"));
		},
		//to Validate Step four
		validateStepFour: function () {
			var selectedTablesFields = [];
			for (var i = 0; i < this.graph.attributes.cells.models.length; i++) {
				if (this.graph.attributes.cells.models[i].attributes.type === "mapping.Output") {
					for (var j = 0; j < this.graph.attributes.cells.models[i].attributes.items[0].length; j++) {
						selectedTablesFields.push(this.graph.attributes.cells.models[i].attributes.items[0][j]);
					}
				}
			}
			var tableColModel = new sap.ui.model.json.JSONModel(selectedTablesFields);
			for (var r = 0; r < tableColModel.oData.length; r++) {
				if (!(tableColModel.oData[r].hasOwnProperty("aggregationType")))
					tableColModel.oData[r]["aggregationType"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("customLabel")))
					tableColModel.oData[r]["customLabel"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("filters")))
					tableColModel.oData[r]["filters"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("filters1")))
					tableColModel.oData[r]["filters1"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("filterOperator")))
					tableColModel.oData[r]["filterOperator"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("descriptions")))
					tableColModel.oData[r]["descriptions"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("synonyms")))
					tableColModel.oData[r]["synonyms"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("formatpattern")))
					tableColModel.oData[r]["formatpattern"] = "";
				if (!(tableColModel.oData[r].hasOwnProperty("hidden")))
					tableColModel.oData[r]["hidden"] = false;

			}
			for (var i = 0; i < tableColModel.oData.length - 1; i++) {
				for (var j = i + 1; j < tableColModel.oData.length; j++) {
					if (tableColModel.oData[i].label === tableColModel.oData[j].label) {
						tableColModel.oData[j].customLabel = tableColModel.oData[j].tablename + "_" + tableColModel.oData[j].name;
					}

				}
			}

			this.getView().byId("columnSelectionTableId").setModel(tableColModel);
			this.getView().byId("columnSelectionTableId").getModel().updateBindings(true);

		},
		// on add formula button click
		onAddButtonPress: function () {
			var that = this;
			this.editFormula = false;
			that.validateFormula = false;
			this.addFormulafrag.open();
		},
		// on fragment table select 
		handleTableSelect: function (evt) {
			var that = this;
			var selectedObject = evt.getParameter("selectedItem").getText();
			var settingsData = [];
			for (var i = 0; i < this.tableData.length; i++) {
				for (var j = 0; j < this.tableData[i].measureObject.length; j++) {
					if (this.addFormulafrag.getContent()[0].getItems()[0].getItems()[3].getSelectedKey() == this.tableData[i].table) {
						settingsData.push(this.tableData[i].measureObject[j].measureObj);
					}
				}
			}
			this.cMeasureModel.setData(settingsData);
			var calMeasureDailog = this.addFormulafrag.getContent()[0].getItems()[2];
			this.addFormulafrag.getContent()[0].getItems()[2].getItems()[0].getItems()[1].setValue();

		},
		enableAutoComplete: function () {
			var that = this;
			this.cMeasureModel = new sap.ui.model.json.JSONModel();
			var content = this.addFormulafrag.getContent()[0].getItems()[1];
			var oControl = content.getItems()[0].getItems()[1];
			var settingsData = [];
			that.tableNameArr = [];
			for (var i = 0; i < this.tableData.length; i++) {
				for (var j = 0; j < this.tableData[i].measureObject.length; j++) {
					this.tableData[i].measureObject[j].measureObj.name = this.tableData[i].measureObject[j].measureObj.COLUMN_NAME;
					this.tableData[i].measureObject[j].measureObj.tablename = this.tableData[i].table;
					//	if (this.addFormulafrag.getContent()[0].getItems()[0].getItems()[3].getSelectedKey() == this.tableData[i].table) {
					settingsData.push(this.tableData[i].measureObject[j].measureObj);
					//	}
				}
			}
			if (this.editMode) {
				that.viewname = sap.ui.getCore().getModel("queryInfo").oData.view_name;
			}
			this.cMeasureModel.setData(settingsData);
			// get textarea htmltag from UI5 control
			var jQueryTextArea = jQuery("#" + oControl.getId()).find("textarea");
			//	jQueryTextArea.text([{
			jQueryTextArea.textcomplete([{
				// #1 - Regular experession used to trigger search
				match: /(\b(\w+))$/, // --> triggers search for every char typed

				// #2 - Function called at every new key stroke
				search: function (query, fnCallback) {
					var pData = Promise.resolve(
						that.cMeasureModel.getData()
					);

					pData.then(function (oResult) {
						fnCallback(
							oResult.filter(function (oRecord) {
								// filter results based on query
								//that.cMeasureModel;
								return oRecord.name
									.toUpperCase()
									.includes(query.toUpperCase());
							})
						);
					});
				},

				// #3 - Template used to display each result (also supports HTML tags)
				template: function (hit) {
					// Returns the highlighted version of the name attribute
					//return that.viewname + "." + hit.name;
					return hit.tablename + "." + hit.name;
				},

				// #4 - Template used to display the selected result in the textarea
				replace: function (hit) {
					//return that.viewname + "." + hit.name;

					if (that.tableNameArr.includes(that.dbName + "." + hit.tablename) === false)
						that.tableNameArr.push(that.dbName + "." + hit.tablename);
					return hit.tablename + "." + hit.name;
				}
			}]);
		},
		onFunctionPress: function (evt) {
			var value = evt.getSource().getText();
			//var content = this.addFormulafrag.getContent()[0].getItems()[2].getItems()[0].getItems()[1];
			var content = this.addFormulafrag.getContent()[0].getItems()[1].getItems()[0].getItems()[1];
			if (content.getValue().length > 0 && value != "If()")
				content.setValue(content.getValue() + " " + value);
			else if (content.getValue().length > 0 && value == "If()")
				content.setValue("CASE WHEN " + content.getValue() + " THEN     ELSE   END");
			else if (content.getValue().length <= 0 && value == "If()")
				content.setValue("CASE WHEN       THEN     ELSE   END");
			else
				content.setValue(value);
		},
		onConditionPress: function (evt) {
			var value = evt.getSource().getText();
			if (value === "And") value = "and";
			else if (value === "Or") value = "or";
			else if (value === "Greater Than") value = ">";
			else if (value === "Greater Than Equals") value = ">=";
			else if (value === "Less Than") value = "<";
			else if (value === "Less Than Equals") value = "<=";
			var content = this.addFormulafrag.getContent()[0].getItems()[1].getItems()[0].getItems()[1];
			content.setValue(content.getValue() + " " + value);
		},
		onOperatorPress: function (evt) {
			var value = evt.getSource().getText();
			//var content = this.addFormulafrag.getContent()[0].getItems()[2].getItems()[0].getItems()[1];
			var content = this.addFormulafrag.getContent()[0].getItems()[1].getItems()[0].getItems()[1];
			content.setValue(content.getValue() + " " + value);
		},
		onValidateFormula: function (event) {
			var that = this;
			that.validateFormula = false;
			var addformula = this.addFormulafrag.getContent()[0].getItems();
			var mType = addformula[0].getItems()[1].getSelectedKey();
			if (this.editMode)
				var mName = this.viewname;
			else
				var mName = addformula[0].getItems()[3].getValue();

			var form = addformula[1].getItems()[0].getItems()[1];
			if (form.getValue().length === 0) {
				form.setValueState("Error");
				sap.m.MessageToast.show("Please Enter Formula");
				return;
			}

			form.setValueState("None");
			/*if(content.getValue().length>0)
			var customizedFormula = "CASE WHEN  " + content.getValue() + "  THEN 1  ELSE 0 END"; */

			var models = this.graph.attributes.cells.models;
			var arr = [];
			// var obj1 = {};
			// var obj = {};
			// var count = 0;
			var joinsArray = [];
			var tableArray = [];
			var selTables = [];
			var joinTypeArray = [];
			for (var i = 0; i < models.length; i++) {
				if (models[i].attributes.type == "mapping.Join") {
					joinsArray.push(models[i]);
				} else if (models[i].attributes.type == "mapping.Record") {
					tableArray.push(models[i]);
				}
			}

			tableArray = tableArray.sort(function (a, b) {
				return a.attributes.position.x - b.attributes.position.x
			});

			joinsArray = joinsArray.sort(function (a, b) {
				return a.attributes.position.x - b.attributes.position.x;

			});
			for (var j = 0; j < joinsArray.length; j++) {
				var table1 = joinsArray[j].attributes.items[0][0];
				var table2 = joinsArray[j].attributes.items[1][0];
				var condition = table1.tablename + "." + table1.name + "=" + table2.tablename + "." + table2.name;
				arr.push(condition);
				var join = joinsArray[j].attributes.attrs.headerLabel.textWrap.text;
				joinTypeArray.push(join);
				// count++;

			}
			var parentTable = that.dbName + "." + tableArray[0].attributes.attrs.headerLabel.textWrap.text;
			for (i = 1; i < tableArray.length; i++) {
				selTables.push(that.dbName + "." + tableArray[i].attributes.attrs.headerLabel.textWrap.text);
			}

			var object = {
				table_name: parentTable,
				encodecondition: btoa(form.getValue()),
				tables: selTables,
				conditions: arr,
				join_type: joinTypeArray
			};

			service.callCreateService("ValidateFormula", JSON.stringify(object), "POST", function (evt, sucessFlag, oError) {
				var result = JSON.parse(evt);
				if (result.status === "Error") {
					form.setValueState("Error");
					that.validateFormula = false;
					var dialog = new sap.m.Dialog({
						title: 'Error Message',
						type: 'Message',
						content: new sap.m.Text({
							text: result.message
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});

					dialog.open();
				} else {
					that.validateFormula = true;
					sap.m.MessageToast.show("Valid Formula");
					form.setValueState("None");
				}
			});
		},
		/*	onTogglePress: function(evt) {
				var calMeasureDailog = this.addFormulafrag.getContent()[0].getItems();
				var opToken = calMeasureDailog[1].getContent()[0].getItems()[0].getItems()[1].getItems()[1];
				var measure1Token = calMeasureDailog[1].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
				var measure2Token = calMeasureDailog[1].getContent()[0].getItems()[0].getItems()[1].getItems()[2];

				opToken.setVisible(true);
				opToken._deleteIcon.addStyleClass("tokenIconHide");
				measure1Token.setVisible(true);
				measure2Token.setVisible(true);

				var source = evt.getSource();
				var allItems = source.getParent().getContent();

				for (var i = 0; i < allItems.length; ++i) {
					var item = allItems[i];
					if (item != source) {
						item.setPressed(false);
					}
				}
				var operator = "";
				var key = "";
				switch (source.getText()) {
					case "Equals":
						operator = "Equals";
						key = "=";
						break;
					case "No Equals":
						operator = "Not Equals";
						key = "!=";
						break;
					case "Greater Than":
						operator = "Greater Than";
						key = ">";
						break;
					case "Less Than":
						operator = "Less Than";
						key = "<";
						break;
				}
				opToken.setKey(key);
				opToken.setText(operator);
			},*/
		/*		onTokenPress: function(evt) {

					//	var sourceToken = evt.getSource();
					var oModel = new sap.ui.model.json.JSONModel();
					var settingsData = [];
					for (var i = 0; i < this.tableData.length; i++) {
						for (var j = 0; j < this.tableData[i].measureObject.length; j++) {
							if (this.addFormulafrag.getContent()[0].getItems()[0].getItems()[3].getSelectedKey() == this.tableData[i].table) {
								settingsData.push(this.tableData[i].measureObject[j].measureObj);
							}
						}
					}
					oModel.setData(settingsData);
					var oItemTemplate = new sap.ui.core.Item({
						key: "{name}",
						text: "{name}"
					});
					var oList = new sap.m.SelectList({
						itemPress: function(evt) {
							var itemPressed = evt.getParameters().item.getKey();
							sourceToken.setText(evt.getParameters().item.getText());
							sourceToken.setKey(itemPressed);
							//	cardTemplateThis.customMeasureDialog[sourceToken.getId()] = itemPressed;
							popover.close();
							sourceToken.removeStyleClass("measureToken");
							sourceToken.addStyleClass("measureTokenSelected");
						},
						items: {
							path: "/",
							template: oItemTemplate
						}
					});
					oList.setModel(oModel);
					var popover = new sap.m.Popover({
						title: "Measures",
						placement: "Bottom",
						content: [oList],
						footer: [new sap.m.Toolbar({
							content: [
								new sap.m.ToolbarSpacer(),
								new sap.m.Button({
									text: "Close",
									press: function() {
										popover.close();
									}
								})
							]

						})]
					});
					popover.openBy(evt.getSource());
				},*/
		/*	onTokenDelete: function(evt) {
				var sourceToken = evt.getSource();
				sourceToken.setText("Select Measure");
				this.addFormulafrag[sourceToken.getId()] = undefined;
				sourceToken.removeStyleClass("measureTokenSelected");
				sourceToken.addStyleClass("measureToken");
			},*/
		handleCustomMeasureSave: function (evt) {
			var that = this;
			that.formulaFlag = true;
			var calMeasureDailog = this.addFormulafrag.getContent()[0].getItems();
			var measureType = calMeasureDailog[0].getItems()[1].getSelectedKey();
			//var measureName = calMeasureDailog[1].getItems()[3].getValue();
			var measureName = calMeasureDailog[0].getItems()[3].getValue();
			//var aggregation = calMeasureDailog[1].getItems()[1].getSelectedKey();
			var formula = calMeasureDailog[1].getItems()[0].getItems()[1].getValue().trim();
			var errMessage = "";
			if (measureType == "Conditional") {
				if (measureName.length == 0) {
					calMeasureDailog[0].getItems()[1].setValueState(sap.ui.core.ValueState.Error);
					errMessage = "Please enter measure name";
				} else if (formula.length == 0) {
					calMeasureDailog[0].getItems()[1].setValueState("None");
					calMeasureDailog[1].getItems()[0].getItems()[1].setValueState(sap.ui.core.ValueState.Error);
					errMessage = "Please enter formula";
				} else if (that.validateFormula === false || that.validateFormula == undefined) {
					calMeasureDailog[0].getItems()[1].setValueState("None");
					calMeasureDailog[1].getItems()[0].getItems()[1].setValueState(sap.ui.core.ValueState.Error);
					errMessage = "Please validate formula";
				}
				if (errMessage.length > 0) {
					sap.m.MessageToast.show(errMessage);
				} else if (this.validateFormula) {

					var saveFormulaInfo = {
						Viewname: this.viewname,
						Aliasname: measureName.replace(/[^a-zA-Z0-9]/g, '_'),
						Formula: formula
					};

					if (!this.editFormula) {
						if (this.editMode)
							this.formulas = this.getView().byId("comboBoxFormulaId").getModel().getData();
						this.formulas.push(saveFormulaInfo);
						var formulaModel = new sap.ui.model.json.JSONModel(this.formulas);
						this.getView().byId("comboBoxFormulaId").setModel(formulaModel);
					} else {
						this.getView().byId("comboBoxFormulaId").getItems()[that.listSelectedPath].getBindingContext().getObject()["Aliasname"] =
							measureName.replace(/[^a-zA-Z0-9]/g, '_');
						this.getView().byId("comboBoxFormulaId").getItems()[that.listSelectedPath].getBindingContext().getObject()["Formula"] =
							formula;
					}
					this.getView().byId("comboBoxFormulaId").getModel().updateBindings(true);
					var createcomboBoxItems = this.getView().byId("comboBoxFormulaId").getItems();
					calMeasureDailog[0].getItems()[3].setValue();
					calMeasureDailog[1].getItems()[0].getItems()[1].setValue();
					this.addFormulafrag.close();

				} else {
					sap.m.MessageToast.show("Please enter valid formula");
				}

			}

		},
		handleCustomMeasureCancel: function (evt) {
			this.addFormulafrag.getContent()[0].getItems()[0].getItems()[3].setValue();
			this.addFormulafrag.getContent()[0].getItems()[1].getItems()[0].getItems()[1].setValue();
			this.addFormulafrag.close();
			//	this.addFormulafrag.destroy();
		},
		removeContent: function () {
			var that = this;
			that.tableData = [];
			that.selectedTables = [];
			var dummyModel = new sap.ui.model.json.JSONModel();
			that.getView().byId("tables").setModel(dummyModel);
			that.getView().byId("selectedTables").setModel(dummyModel);

			// this.getView().byId("linkingFlexBox").removeAllItems();
			that.getView().byId("columnSelectionTableId").setModel(dummyModel);
			this._handleNavigationToStep(1);
		},
		setDataforOutputView: function (dataFromEditor) {
			var that = this;
			if (!dataFromEditor) {
				var tileModel = sap.ui.getCore().getModel("queryInfo");
				// var obj = JSON.parse(tileModel.getData().conditions)[0];
				var models = JSON.parse(tileModel.getData().graph_data);
				var conditionArray = tileModel.getData().conditions;
				// for (var k = 0; k < Object.keys(obj).length; k++) {
				// 	conditionArray.push(obj[k]);
				// }

				for (var k = 0; k < models.length; k++) {
					if (models[k].type == "mapping.Record") {
						var table = new joint.shapes.mapping.Record(models[k]);
						table.addTo(that.graph);
						that.position = table.attributes.position.x;
					} else if (models[k].type == "mapping.Join") {
						for (var i = 0; i < models[k].items[0].length; i++) {
							if (i === 0) {
								models[k].items[0][i]["group"] = "headers";
							} else {
								models[k].items[0][i]["group"] = "";
							}
						}
						for (var j = 0; j < models[k].items[1].length; j++) {
							if (j === 0) {
								models[k].items[1][j]["group"] = "headers";
							} else {
								models[k].items[1][j]["group"] = "";
							}
						}
						var table = new joint.shapes.mapping.Join(models[k]);
						table.addTo(that.graph);
						that.joinTablePosition = table.attributes.position.x;
						this.joinsCount = 1;

					} else if (models[k].type == "mapping.Output") {
						that.posCount = 1;
						for (var i = 0; i < models[k].items[0].length; i++) {
							models[k].items[0][i]["group"] = "";
						}
						var table = new joint.shapes.mapping.Output(models[k]);
						table.addTo(that.graph);
					}
				}

				var models = this.graph.attributes.cells.models;
				var linkArray = [];
				for (var j = 0; j < models.length; j++) {
					if (models[j].attributes.type === "mapping.Join") {
						var joinTable = models[j];
						var table1 = models[j].attributes.items[0][0].tablename;
						var table1property = models[j].attributes.items[0][0].id;
						var table2 = models[j].attributes.items[1][0].tablename
						var table2property = models[j].attributes.items[1][0].id;
						var link1 = new joint.shapes.mapping.Link();
						for (var k = 0; k < models.length; k++) {
							if (models[k].attributes.attrs.headerLabel.textWrap.text === table1) {
								var tableRecord = models[k];
								link1.attributes.source.id = tableRecord.id;
								link1.attributes.source.port = table1property;
								link1.attributes.target.id = joinTable.id;
								link1.attributes.target.port = table1property;
							}
						}
						linkArray.push(link1);
						var link2 = new joint.shapes.mapping.Link();
						for (var k = 0; k < models.length; k++) {
							if (models[k].attributes.attrs.headerLabel.textWrap.text === table2) {
								var tableRecord = models[k];
								link2.attributes.source.id = joinTable.id;
								link2.attributes.source.port = table2property;
								link2.attributes.target.id = tableRecord.id;
								link2.attributes.target.port = table2property;
							}
						}
						linkArray.push(link2);

					}
				}
				linkArray.forEach(function (link) {
					// links.addTo(that.graph);
					that.graph.addCell(link);
				});

			} else if (dataFromEditor) {
				that.tableData = [];
				this.graph = new joint.dia.Graph;
				this.position = 30;
				this.posCount = 0;
				this.sColumns = [];
				// var filterModel;
				// var tileModel = sap.ui.getCore().getModel("queryInfo");
				this.viewData = dataFromEditor;
				this.conditions = dataFromEditor.conditions;

				var databases = that.getView().byId("database").getItems();
				var selectedDB = dataFromEditor.parent_table.split(".")[0];
				that.dbName = selectedDB;
				for (var i = 0; i < databases.length; i++) {
					if (databases[i].getBindingContext().getObject().name === selectedDB) {
						that.getView().byId("database").setSelectedKey(selectedDB);
					}
				}
				var select = "getAllTablesAndViews?db=" + selectedDB;

				service.callService(selectedDB + "Tables", selectedDB + "Tables", "getAllTablesAndViews?db=" + selectedDB, "", true,
					function (evt) {
						var tModel = sap.ui.getCore().getModel(selectedDB + "Tables");
						that.getView().byId("tables").setModel(tModel);
						var items = that.getView().byId("tables").getItems();
						that.setOutputColumns(dataFromEditor);
						var parentTable = dataFromEditor.parent_table.split(".")[1].trim();
						// var finalURL = select + "&table=" + parentTable + "&metadata";
						that.addLinkingItem(that.tableData);
						// that.callService(parentTable, true, finalURL);

						var tables = [];

						for (var k = 0; k < dataFromEditor.tables.length; k++) {
							var stableName = dataFromEditor.tables[k].split(".")[1].trim();
							tables.push(stableName);
							// finalURL = select + "&table=" + stableName + "&metadata";
							// that.callService(stableName, true, finalURL);
						}

						for (i = 0; i < items.length; i++) {
							if (items[i].getBindingContext().getObject().TABLE_NAME === parentTable) {
								that.getView().byId("tables").setSelectedItem(items[i]);
							} else {
								for (var j = 0; j < tables.length; j++) {
									if (items[i].getBindingContext().getObject().TABLE_NAME === tables[j]) {
										that.getView().byId("tables").setSelectedItem(items[i]);
									}
								}
							}
						}

						var sel_items = that.getView().byId("tables").getSelectedItems();
						var sel_tables = [];
						// for (i = 0; i < sel_items.length; i++) {
						// 	if (sel_items[i].getBindingContext().getObject().TABLE_NAME === parentTable) {
						// 		sel_tables.push(sel_items[i].getBindingContext().getObject());
						// 	}
						// }
						for (j = 0; j < tables.length; j++) {
							for (i = 0; i < sel_items.length; i++) {
								if (sel_items[i].getBindingContext().getObject().TABLE_NAME === tables[j]) {
									sel_tables.push(sel_items[i].getBindingContext().getObject());
								}
							}
						}
						that.selectedTables = sel_tables;
						var selData = {
							"selectedTables": sel_tables
						};

						var outputTables = new sap.ui.model.json.JSONModel(selData);
						that.getView().byId("selectedTables").setModel(outputTables);
					});

				this._handleNavigationToStep(3);

			}

		},
		setOutputColumns: function (dataFromEditor) {
			var that = this;
			var selectedDB = dataFromEditor.parent_table.split(".")[0];
			var select = "TableMetadata?db=" + selectedDB;
			var parentTable = dataFromEditor.parent_table.split(".")[1].trim();
			var finalURL = select + "&table=" + parentTable;
			// window.setTimeout(function () {
			that.callService(parentTable, true, finalURL);
			// }, 1000);

			var tables = [];

			for (var k = 0; k < dataFromEditor.tables.length; k++) {
				var stableName = dataFromEditor.tables[k].split(".")[1].trim();
				tables.push(stableName);
				finalURL = select + "&table=" + stableName;
				// window.setTimeout(function () {
				that.callService(stableName, true, finalURL);
				// }, 1000);

			}
			// window.setTimeout(function () {
			// 	console.log(that.tableData);
			// }, 1000);
		},
		//to open the filter values dialog
		handletableColumnFilters: function (evt) {
			var filterParameter = evt.oSource.oParent.getBindingContext().getObject().name;
			var that = this;
			this.selectedFilterValueField = evt.oSource;
			this.filterParameter = filterParameter;
			this.BusyDialog.open();
			var table = evt.oSource.oParent.getBindingContext().getObject().tablename;

			var url = "TableData?db=" + that.dbName + "&table=" + table + "&select=" + filterParameter;
			service.callService("dataSrcSystem", jQuery.sap.getModulePath("Brevo.QueryBuilder") + "/neo-app.json", url, "", "false",
				function (evt) {
					that.BusyDialog.close();
					var model = sap.ui.getCore().getModel("dataSrcSystem");
					if (model.oData.tables.length > 0) {
						var obj = {};
						for (var i = 0, len = model.oData.tables.length; i < len; i++)
							obj[model.oData.tables[i][filterParameter]] = model.oData.tables[i];
						model.oData.tables = new Array();
						for (var key in obj)
							model.oData.tables.push(obj[key]);
						var listItem = new sap.m.StandardListItem({
							title: "{" + filterParameter + "}"
						});
						that.ValueHelpForFilterValues.bindAggregation("items", {
							path: "/tables",
							template: listItem
						});
					}
					that.ValueHelpForFilterValues.setModel(model);
					var listItems = that.ValueHelpForFilterValues.getItems();
					/*for (var j = 0; j < listItems.length; j++) {
						if (that.selectedFilterValueField.getValue().indexOf(listItems[j].getBindingContext().getObject()[filterParameter]) != (-1))
							that.ValueHelpForFilterValues.getItems()[j].setSelected(true);
						else
							that.ValueHelpForFilterValues.getItems()[j].setSelected(false);
					}*/
					that.ValueHelpForFilterValues.open();
				});
		},
		// Search a property on click of add for filters
		handleFilterSearch: function (evt) {
			var filters = [];
			var searchString = evt.getParameter("value");
			var binding = evt.mParameters.itemsBinding;
			if (searchString && searchString.length > 0) {
				var filter1 = new sap.ui.model.Filter("property", sap.ui.model.FilterOperator.Contains, searchString);
				filters.push(filter1);
				binding.filter(new sap.ui.model.Filter(filters, false));
			} else {
				binding.filter([]);
			}
		},
		//on click of OK button in filter value dialog
		handleFilterValueConfirm: function (evt) {
			var value = "";
			var values = [];
			var obj;
			var selectedItems = evt.getParameter("selectedContexts");
			if (selectedItems.length > 0) {
				for (var i = 0; i < selectedItems.length; i++) {
					obj = selectedItems[i].oModel.getProperty(selectedItems[i].sPath);
					values.push(obj[this.filterParameter]);
					if (selectedItems.length === 1) {
						value = obj[this.filterParameter];
					} else {
						if (i === 0) {
							value = obj[this.filterParameter];
						} else {
							value = value + "," + obj[this.filterParameter];
						}
					}
				}
				this.selectedValues = values;
				this.selectedFilterValueField.setValue(value);
			} else {
				sap.m.MessageToast.show("Select atleast one filter value");
				this.selectedFilterValueField.setValue();
			}
			evt.getSource().getBinding("items").filter([]);
		},
		constructFilterUrlForTable: function (columnFilters) {
			var filterUrlForTable = "",
				filterUrlToAppend = "";
			for (var a = 0; a < columnFilters.length; a++) {
				//	if (!columnFilters[a].notToBeUsed) {
				var filterName = columnFilters[a].filterName;
				var filterFormattedOperator = Formatter.filterUrlOperator(columnFilters[a].filterOperator);
				var filterTable = columnFilters[a].filterTable;
				if (columnFilters[a].filterDataType.indexOf("date") > -1) {
					if (columnFilters[a].filterOperator == "bw") {
						var value1 = columnFilters[a].filterValue.split(",");
						var value2 = columnFilters[a].filterValue1.split(",");
						filterUrlForTable = "(" + filterTable + "." + filterName + " > '" + value1 + " 00:00:00.000')and(" + filterTable + "." +
							filterName + " < '" + value2 +
							" 00:00:00.000')";
					} else {
						var selectedFilterValues = columnFilters[a].filterValue.split(",");
						for (var m = 0; m < selectedFilterValues.length; m++) {
							if (m == 0)
								filterUrlForTable = filterTable + "." + filterName + filterFormattedOperator + "'" + selectedFilterValues[m] + "'";
							else
								filterUrlForTable = filterUrlForTable + " OR " + filterTable + "." + filterName + filterFormattedOperator + "'" +
								selectedFilterValues[m] + "'";
						}

					}
				} else {
					if (columnFilters[a].filterOperator == "bw") {
						var value1 = columnFilters[a].filterValue.split(",");
						var value2 = columnFilters[a].filterValue1.split(",");
						if (value1.length > 0 && value2.length > 0) {
							if (value1.indexOf(",") == (-1) && value2.indexOf(",") == (-1)) {
								filterUrlForTable = "(" + filterName + " > '" + value1 + "')and(" + filterName + " < '" + value2 + "')";
							} else {
								var values1Len = value1.split(",");
								var filterValue1, filterValue2;
								for (var m = 0; m < values1Len.length; m++) {
									values1Len[m] = values1Len[m].trim().replace(/\s/g, "%20");
									if (m === 0) {
										filterValue1 = "(" + filterTable + "." + filterTable + "." + filterName + " > '" + values1Len[0] + "')";
									} else {
										filterValue1 = filterValue1 + "or (" + filterTable + "." + filterName + " > '" + values1Len[m] + "')";
									}
								}
								var values2Len = value2.split(",");
								for (var k = 0; k < values2Len.length; k++) {
									values1Len[k] = values2Len[k].trim().replace(/\s/g, "%20");
									if (k === 0) {
										filterValue2 = "(" + filterTable + "." + filterName + " < '" + values1Len[0] + "')";
									} else {
										filterValue2 = filterValue2 + "or (" + filterTable + "." + filterName + " < '" + values1Len[k] + "')";
									}
								}
								filterUrlForTable = filterValue1 + "and" + filterValue2;
							}
						}

					} else {
						var selectedFilterValues = columnFilters[a].filterValue.split(",");
						for (var m = 0; m < selectedFilterValues.length; m++) {
							if (m == 0)
								filterUrlForTable = filterTable + "." + filterName + filterFormattedOperator + "'" + selectedFilterValues[0] + "'";
							else
								filterUrlForTable = filterUrlForTable + " OR " + filterTable + "." + filterName + filterFormattedOperator + "'" +
								selectedFilterValues[m] + "'";
						}
					}
				}
				filterUrlForTable = "(" + filterUrlForTable + ")"
				if (filterUrlToAppend.length == 0) {
					filterUrlToAppend = filterUrlForTable;
				} else {
					filterUrlToAppend = filterUrlToAppend + "and" + filterUrlForTable;
				}
			}
			//	}
			if (filterUrlToAppend.length > 0)
				return filterUrlToAppend;
			else
				return "";
		},

		//on click of review button
		wizardCompletedHandler: function () {
			if (this.graph.attributes.cells.models.length > 0) {
				var tableModelItems = this.getView().byId("columnSelectionTableId").getModel().getProperty("/"); // 
				var updatedTableItems = [];
				var updatedFormulaItem = [];
				var reviewformulaModel = new sap.ui.model.json.JSONModel();
				for (var i = 0; i < tableModelItems.length; i++) {
					if (!tableModelItems[i].hidden) {
						updatedTableItems.push(tableModelItems[i]);
					}
				}

				var updatedTableModel = new sap.ui.model.json.JSONModel(updatedTableItems);
				// console.log(updatedTableModel);
				var fragment = this._oWizardReviewPage.getContent();
				fragment[0].getContent()[1].setText(this.dbName);
				var selectedTablesModel = this.getView().byId("selectedTables").getModel();

				fragment[1].getContent()[1].setModel(selectedTablesModel);

				//I have commented
				/*	var vboxItems = this.getView().byId("linkingFlexBox").getItems();
			fragment[2].getContent()[1].getContent()[0].removeAllItems();
			for (i = 0; i < vboxItems.length; i++) {
				var inputFieldValue = vboxItems[i].getItems()[3].getValue();
				var input = new sap.m.Input({
					editable: false,
					value: inputFieldValue
				});
				input.addStyleClass("inputStyleClass");
				fragment[2].getContent()[1].getContent()[0].addItem(input);
			}
*/
				// this.join = this.getView().byId("joinType").getSelectedKey();
				// fragment[2].getContent()[4].setText(this.join);

				fragment[3].getContent()[1].setModel(updatedTableModel);

				//new

				var formulaListItems = this.getView().byId("comboBoxFormulaId").getModel();
				fragment[3].getContent()[3].setModel(formulaListItems);
				//old
				/*	var formulaItems = this.getView().byId("comboBoxFormulaId").getSelectedItems();  //commented
					for (var f = 0; f < formulaItems.length; f++) {
						updatedFormulaItem.push(formulaItems[f].getBindingContext().getObject());
					}
					reviewformulaModel.setData(updatedFormulaItem);
					fragment[3].getContent()[3].setModel(reviewformulaModel);*/ //commented
				//		fragment[3].getContent()[3].getModel().updateBindings(true);      //commented
				//		var reviewComboBoxItems = fragment[3].getContent()[3].getItems();     //commented
				//	for (var r = 0; r < reviewComboBoxItems.length; r++)
				//		fragment[3].getContent()[3].setSelectedItems(reviewComboBoxItems);   //commented

				if (this.editMode) {
					this._oWizardReviewPage.mAggregations.footer.mAggregations.contentRight[2].setVisible(true);
					this._oWizardReviewPage.mAggregations.footer.mAggregations.contentRight[1].setVisible(false);
				} else {
					this._oWizardReviewPage.mAggregations.footer.mAggregations.contentRight[2].setVisible(false);
					this._oWizardReviewPage.mAggregations.footer.mAggregations.contentRight[1].setVisible(true);
				}
				this._oNavContainer.addPage(this._oWizardReviewPage);
				this._oNavContainer.to(this._oWizardReviewPage);
				var reviewGraph = new joint.dia.Graph;

				var paper1 = new joint.dia.Paper({
					el: document.getElementById("reviewLinkingProperties"),
					model: reviewGraph,
					width: "100%",
					height: 150,
					gridSize: 10,
					background: {
						color: '#f6f6f6'
					},
					magnetThreshold: 'onleave',
					moveThreshold: 5,
					clickThreshold: 5,
					linkPinning: false,
					interactive: {
						linkMove: false,
						elementMove: false
					},
					markAvailable: true,
					snapLinks: {
						radius: 40
					},
					defaultRouter: {
						name: 'mapping',
						args: {
							padding: 30
						}
					},
					defaultConnectionPoint: {
						name: 'anchor'
					},
					defaultAnchor: {
						name: 'mapping'
					},
					defaultConnector: {
						name: 'jumpover',
						args: {
							jump: 'cubic'
						}
					},
					highlighting: {
						magnetAvailability: {
							name: 'addClass',
							options: {
								className: 'record-item-available'
							}
						},
						connecting: {
							name: 'stroke',
							options: {
								padding: 8,
								attrs: {
									'stroke': 'none',
									'fill': '#7c68fc',
									'fill-opacity': 0.2
								}
							}
						}
					},
					defaultLink: function () {
						return new joint.shapes.mapping.Link();
					},
					validateConnection: function (sv, sm, tv, tm, end) {
						if (sv === tv) return false;
						if (sv.model.isLink() || tv.model.isLink()) return false;
						if (end === 'target') return tv.model.getItemSide(tv.findAttribute('item-id', tm)) !== 'right';
						return sv.model.getItemSide(sv.findAttribute('item-id', sm)) !== 'left';
					}
				});

				function showElementTools(elementView) {
					var element = elementView.model;
					var transform = new joint.ui.FreeTransform({
						cellView: elementView,
						allowRotation: false
					});
					transform.render();
					transform.listenTo(element, 'change', updateMinSize);
					updateMinSize();

					function updateMinSize() {
						var minSize = element.getMinimalSize();
						transform.options.minHeight = minSize.height;
						transform.options.minWidth = minSize.width;
					}
				}
				var models = this.graph.attributes.cells.models;
				var joinTable;
				var count = 30;

				for (i = 0; i < models.length; i++) {
					if (models[i].attributes.type == "mapping.Join") {
						var arr1 = [];
						var arr2 = [];
						arr1.push(models[i].attributes.items[0][0]);
						arr2.push(models[i].attributes.items[1][0]);
						// arr1[0]["label"] = arr1[0]["tablename"] + "." + arr1[0]["label"];
						// arr2[0]["label"] = arr2[0]["tablename"] + "." + arr2[0]["label"];
						arr1[0]["group"] = "headers";
						arr2[0]["group"] = "headers";
						var joinTable = new joint.shapes.mapping.Join({
							size: {
								width: 500
							},
							attrs: {
								headerLabel: {
									magnet: null
								},
								itemLabels: {
									magnet: null
								},
								itemLabels_1: {
									magnet: null
								},
							},
							items: [
								arr1,
								arr2
							]
						});
						joinTable.position(count, 50);
						joinTable.addTo(reviewGraph);
						count = count + 550;
						joinTable.setName(models[i].attributes.attrs.headerLabel.textWrap.text);
					}
				}

			} else {
				sap.m.MessageToast.show("Incomplete Data");
			}

		},
		_handleNavigationToStep: function (iStepNumber) {
			var fnAfterNavigate = function () {
				this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
				this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},
		backToWizardContent: function () {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},
		editStepOne: function () {
			this._handleNavigationToStep(0);
		},
		editStepTwo: function () {
			this._handleNavigationToStep(1);
		},
		editStepThree: function () {
			this._handleNavigationToStep(2);
		},
		editStepFour: function () {
			this._handleNavigationToStep(3);
		},
		//on preview data button press
		onPreviewDataPress: function () {
			var that = this;
			that.BusyDialog.open();
			var previewData = that.constructPayloadForWizard();
			if (that.sortItems.length > 0)
				previewData.orderby = this.sortItems[0].selectedSortItem + " " + this.sortItems[0].sortOperator;
			else
				previewData.orderby = "";
			var oRouter = sap.ui.core.UIComponent.getRouterFor(that);

			var url = "DataPreview";
			service.callCreateService(url, JSON.stringify(previewData), "POST", function (evt, sucessFlag, oError) {
				if (sucessFlag) {
					var data = JSON.parse(evt).data;
					var dataModel = new sap.ui.model.json.JSONModel(data);
					sap.ui.getCore().setModel(dataModel, "dataPreviewModel");
					oRouter.navTo("dataPreview");
					that.BusyDialog.close();
				} else {
					that.BusyDialog.close();
					sap.m.MessageToast.show("No data to Preview");
				}
			});
		},

		constructPayloadForWizard: function () {
			var that = this;
			var tableSelectedColumns = this.getView().byId("columnSelectionTableId").getModel().getProperty("/");
			this.tableColumns = [];
			this.tableFilters = [];
			var selColumns = [];
			for (var p = 0; p < tableSelectedColumns.length; p++) {
				this.tableColumns.push(tableSelectedColumns[p]);
				if (tableSelectedColumns[p].filters.length > 0) {
					this.tableFilters.push({
						filterDataType: this.tableColumns[p].datatype,
						filterName: this.tableColumns[p].name,
						filterOperator: this.tableColumns[p].filterOperator,
						filterValue: this.tableColumns[p].filters,
						filterValue1: this.tableColumns[p].filters1,
						selectParam: this.tableColumns[p].name,
						filterTable: this.tableColumns[p].tablename
					});
				}
			}
			var tableFilterUrl = this.constructFilterUrlForTable(this.tableFilters);
			var finalFilter = "";
			if (tableFilterUrl.length > 0) {
				if (finalFilter.length > 0)
					finalFilter += "and" + tableFilterUrl;
				else
					finalFilter = tableFilterUrl;
			}

			var columns = [];
			for (p = 0; p < this.tableColumns.length; p++) {
				columns.push(this.tableColumns[p]);
				if (!(this.tableColumns[p].hidden)) {
					if (this.tableColumns[p].customLabel) {
						var custLabel = this.tableColumns[p].customLabel.replace(/[^a-zA-Z0-9]/g, '_');
						selColumns.push(this.tableColumns[p].tablename + "." + this.tableColumns[p].name + " as " + custLabel);
					} else {
						selColumns.push(this.tableColumns[p].tablename + "." + this.tableColumns[p].name);
					}
				}
			}
			if (this.getView().byId("comboBoxFormulaId").getModel() !== undefined) {
				if (this.getView().byId("comboBoxFormulaId").getModel().oData.length > 0) {
					for (var i = 0; i < this.getView().byId("comboBoxFormulaId").getModel().oData.length; i++) {
						var formula = this.getView().byId("comboBoxFormulaId").getModel().oData[i].Formula;
						selColumns.push("(" + formula + ")" + " as " + this.getView().byId("comboBoxFormulaId").getModel().oData[i].Aliasname);
					}
				}

			}

			var finalUrl = finalFilter;
			var selTables = [];
			var models = this.graph.attributes.cells.models;
			var arr = [];
			var joinTypeArray = [];
			var tableArray = [];
			var joinsArray = [];
			for (i = 0; i < models.length; i++) {
				if (models[i].attributes.type == "mapping.Join") {
					joinsArray.push(models[i]);
				} else if (models[i].attributes.type == "mapping.Record") {
					tableArray.push(models[i]);
				}

			}
			tableArray = tableArray.sort(function (a, b) {
				return a.attributes.position.x - b.attributes.position.x
			});
			joinsArray = joinsArray.sort(function (a, b) {
				return a.attributes.position.x - b.attributes.position.x
			});
			for (i = 0; i < joinsArray.length; i++) {
				var table1 = joinsArray[i].attributes.items[0][0];
				var table2 = joinsArray[i].attributes.items[1][0];
				var condition = table1.tablename + "." + table1.name + "=" + table2.tablename + "." + table2.name;
				arr.push(condition);
				var join = joinsArray[i].attributes.attrs.headerLabel.textWrap.text;
				joinTypeArray.push(join);
			}
			var selectedDB = this.getView().byId("database").getSelectedKey();
			var parentTable = selectedDB + "." + tableArray[0].attributes.attrs.headerLabel.textWrap.text;
			for (i = 1; i < tableArray.length; i++) {
				selTables.push(selectedDB + "." + tableArray[i].attributes.attrs.headerLabel.textWrap.text);
			}
			var payloadObj = {
				"tables": selTables,
				"selected_columns": selColumns.toString(),
				"conditions": arr,
				"join_type": joinTypeArray,
				"parent_table": parentTable,
				"filter_url": finalUrl
			};

			return payloadObj;

		},

		//on click of create Query Button
		onCreateViewPress: function () {
			var oModel = sap.ui.getCore().getModel("Departments");
			var duplicateDeptModel = new sap.ui.model.json.JSONModel();
			duplicateDeptModel.oData.tables = [];
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				duplicateDeptModel.oData.tables.push(oModel.oData.tables[i]);
			}
			var valueArr = duplicateDeptModel.oData.tables.map(function (item) {
				return item.Department_name
			});
			if (!valueArr.includes("Add a New Department")) {
				duplicateDeptModel.oData.tables.push({
					// "Dep_Id": 0,
					"Department_name": "Add a New Department"
				});
			}
			duplicateDeptModel.setDefaultBindingMode("OneWay");
			this.createViewDialog.getContent()[0].getContent()[1].setValue("");
			this.createViewDialog.getContent()[0].getContent()[3].setValue("");
			this.createViewDialog.getContent()[0].getContent()[5].setModel(duplicateDeptModel);
			this.createViewDialog.getContent()[0].getContent()[6].setVisible(false);
			this.createViewDialog.getContent()[0].getContent()[7].setVisible(false);
			this.createViewDialog.open();
		},
		//on click of Cancel  Button  in create view Dialog
		onCreateCancelPress: function () {
			this.createViewDialog.getContent()[0].getContent()[1].setValue("");
			this.createViewDialog.close();
		},
		onDepartmentChangeOnCreate: function () {
			var departmt = this.createViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (departmt === "Add a New Department") {
				this.createViewDialog.getContent()[0].getContent()[6].setVisible(true);
				this.createViewDialog.getContent()[0].getContent()[6].setValue("");
				this.createViewDialog.getContent()[0].getContent()[7].setVisible(true);
			}
		},
		onDepartmentChangeOnEdit: function () {
			var departmt = this.editViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (departmt === "Add a New Department") {
				this.editViewDialog.getContent()[0].getContent()[6].setVisible(true);
				this.editViewDialog.getContent()[0].getContent()[6].setValue("");
				this.editViewDialog.getContent()[0].getContent()[7].setVisible(true);
			}
		},
		onAddDeptPressOnCreate: function () {
			var that = this;
			var oModel = this.createViewDialog.getContent()[0].getContent()[5].getModel();
			var newDept = this.createViewDialog.getContent()[0].getContent()[6].getValue();
			var duplicate = false;
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				if (oModel.oData.tables[i].Department_name === newDept) {
					var msg = 'Department already exists';
					MessageToast.show(msg);
					duplicate = true;
				}
			}
			if (duplicate) {
				this.createViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
				this.createViewDialog.getContent()[0].getContent()[6].setVisible(false);
				this.createViewDialog.getContent()[0].getContent()[7].setVisible(false);
			} else {

				var postData = {
					// "Dep_Id": "1",
					"Department_name": newDept
				};
				service.callCreateService("AddDepartment", JSON.stringify(postData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						oModel.oData.tables.splice(oModel.oData.tables.length - 1, 1);
						var addDept = {
							// "Dep_Id": "1",
							"Department_name": newDept
						};
						var addDept2 = {
							// "Dep_Id": "0",
							"Department_name": "Add a New Department"
						};
						oModel.oData.tables.push(addDept);
						oModel.oData.tables.push(addDept2);
						that.createViewDialog.getContent()[0].getContent()[5].getModel().updateBindings(true);;
						that.createViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
						that.createViewDialog.getContent()[0].getContent()[6].setVisible(false);
						that.createViewDialog.getContent()[0].getContent()[7].setVisible(false);
					} else {
						sap.m.MessageToast.show("Unable to add Department.Try again");
					}
				});
			}
		},
		onAddDeptPressOnEdit: function () {
			var that = this;
			var oModel = this.editViewDialog.getContent()[0].getContent()[5].getModel();
			var newDept = this.editViewDialog.getContent()[0].getContent()[6].getValue();
			var duplicate = false;
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				if (oModel.oData.tables[i].Department_name === newDept) {
					var msg = 'Department already exists';
					MessageToast.show(msg);
					duplicate = true;
				}
			}
			if (duplicate) {
				this.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
				this.editViewDialog.getContent()[0].getContent()[6].setVisible(false);
				this.editViewDialog.getContent()[0].getContent()[7].setVisible(false);
			} else {

				var postData = {
					// "Dep_Id": "1",
					"Department_name": newDept
				};
				service.callCreateService("filters/add_department", postData, "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						oModel.oData.tables.splice(oModel.oData.tables.length - 1, 1);
						var addDept = {
							// "Dep_Id": "1",
							"Department_name": newDept
						};
						var addDept2 = {
							// "Dep_Id": "0",
							"Department_name": "Add a New Department"
						};
						oModel.oData.tables.push(addDept);
						oModel.oData.tables.push(addDept2);
						that.editViewDialog.getContent()[0].getContent()[5].getModel().updateBindings(true);;
						that.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(newDept);
						that.editViewDialog.getContent()[0].getContent()[6].setVisible(false);
						that.editViewDialog.getContent()[0].getContent()[7].setVisible(false);
					} else {
						sap.m.MessageToast.show("Unable to add Department.Try again");
					}
				});
			}
		},
		//on click of create button in create view Dialog
		onCreatePress: function () {
			var that = this;
			var createViewData = this.constructPayloadForWizard();
			var name = this.createViewDialog.getContent()[0].getContent()[1].getValue();

			var descrip = this.createViewDialog.getContent()[0].getContent()[3].getValue();
			var departmt = this.createViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			var models = this.graph.attributes.cells.models;
			createViewData.view_name = "";
			createViewData.last_change = new Date();
			createViewData.table_config = JSON.stringify(this.tableColumns);
			createViewData.graph_data = JSON.stringify(models);
			createViewData.user_name = "";
			createViewData.description = descrip;
			createViewData.department = departmt;
			createViewData.created_through = "wizard";
			if (that.sortItems.length > 0)
				createViewData.orderby = this.sortItems[0].selectedSortItem + " " + this.sortItems[0].sortOperator;
			else
				createViewData.orderby = "";

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			if (name.length > 0) {
				var url;

				createViewData.view_name = name.replace(/[^a-zA-Z0-9]/g, '_');
				url = "CreateView";

				service.callCreateService(url, JSON.stringify(createViewData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						that.BusyDialog.close();
						sap.m.MessageToast.show("View Created Successfully");
						var data = JSON.parse(evt);
						oRouter.navTo("home");
						that.tile = data.view_name;
						that.viewId = data.id;
						that.handleWizardCancel();
						that.editMode = false;
						that.createViewDialog.close();
					} else if (JSON.parse(evt).message === "View with this ID already exists") {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Query Name already exists.Please give a different Query Name");
					} else if (JSON.parse(evt).message === "Query has 0 results") {
						that.BusyDialog.close();
						sap.m.MessageToast.show(JSON.parse(evt).message);
					} else {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Unable to create view.Try again");
					}
				});

			} else {
				that.BusyDialog.close();
				sap.m.MessageToast.show("Query Name cannot be empty");
			}
		},
		//on click of update View button
		onUpdateViewPress: function () {
			var tileModel = sap.ui.getCore().getModel("queryInfo");
			var oModel = sap.ui.getCore().getModel("Departments");
			var duplicateDeptModel = new sap.ui.model.json.JSONModel();
			duplicateDeptModel.oData.tables = [];
			for (var i = 0; i < oModel.oData.tables.length; i++) {
				duplicateDeptModel.oData.tables.push(oModel.oData.tables[i]);
			}
			var valueArr = duplicateDeptModel.oData.tables.map(function (item) {
				return item.Department_name
			});
			if (!valueArr.includes("Add a New Department")) {
				duplicateDeptModel.oData.tables.push({
					// "Dep_Id": "0",
					"Department_name": "Add a New Department"
				});
			}
			duplicateDeptModel.setDefaultBindingMode("OneWay");
			this.editViewDialog.getContent()[0].getContent()[1].setValue(this.viewData.view_name);
			this.editViewDialog.getContent()[0].getContent()[3].setValue(tileModel.getData().description);
			this.editViewDialog.getContent()[0].getContent()[5].setModel(duplicateDeptModel);
			this.editViewDialog.getContent()[0].getContent()[5].setSelectedKey(tileModel.getData().department);
			this.editViewDialog.getContent()[0].getContent()[6].setVisible(false);
			this.editViewDialog.getContent()[0].getContent()[7].setVisible(false);
			this.editViewDialog.open();
		},
		//on click of cancel button in update view Dialog
		onUpdateCancelPress: function () {
			this.editViewDialog.getContent()[0].getContent()[1].setValue("");
			this.editViewDialog.close();
		},
		//on click of update button in update view Dialog
		onUpdatePress: function () {
			var that = this;
			that.BusyDialog.open();
			var payloadObj = that.constructPayloadForWizard();
			var models = this.graph.attributes.cells.models;
			this.viewData.tables = payloadObj.tables;
			this.viewData.selected_columns = payloadObj.selected_columns;
			this.viewData.conditions = payloadObj.conditions;
			this.viewData.join_type = payloadObj.join_type;
			this.viewData.parent_table = payloadObj.parent_table;
			this.viewData.filter_url = payloadObj.filter_url;
			this.viewData.db_name = this.dbName;
			this.viewData.last_change = new Date();
			this.viewData.table_config = JSON.stringify(this.tableColumns);
			this.viewData.graph_data = JSON.stringify(models);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var name = this.editViewDialog.getContent()[0].getContent()[1].getValue();
			var descrip = this.editViewDialog.getContent()[0].getContent()[3].getValue();
			var departmt = this.editViewDialog.getContent()[0].getContent()[5].getSelectedKey();
			if (that.sortItems.length > 0)
				this.viewData.orderby = this.sortItems[0].selectedSortItem + " " + this.sortItems[0].sortOperator;
			else
				this.viewData.orderby = "";

			if (name.length > 0) {

				var updatedData;
				var url;
				this.viewData.view_name = name.replace(/[^a-zA-Z0-9]/g, '_');
				this.viewData.user_name = "";
				this.viewData.description = descrip;
				this.viewData.department = departmt;
				updatedData = this.viewData;
				url = "UpdateView";

				service.callCreateService(url, JSON.stringify(updatedData), "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						that.BusyDialog.close();
						that.clickedTable = undefined;
						sap.m.MessageToast.show("View Updated Successfully");
						oRouter.navTo("home");
						that.handleWizardCancel();
						that.editViewDialog.close();
					} else if (JSON.parse(evt).message === "View with this ID already exists") {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Query Name already exists.Please give a different Query Name");
					} else {
						that.BusyDialog.close();
						sap.m.MessageToast.show("Unable to update view.Try again");
					}
				});

			} else {
				that.BusyDialog.close();
				sap.m.MessageToast.show("Query Name cannot be empty");
			}
		},
		onTableSearch: function (oEvt) {
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("TABLE_NAME", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			// update list binding
			var list = this.byId("tables");
			var binding = list.getBinding("items");
			binding.filter(aFilters);
		},
		onViewSearch: function (oEvt) {
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("TABLE_NAME", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			// update list binding
			var list = this.byId("selectedTables");
			var binding = list.getBinding("items");
			binding.filter(aFilters);
		},
		onNavBack: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				oRouter.navTo("home", {}, true);
			}
			this.handleWizardCancel();
		},
		handleWizardCancel: function () {
			var that = this;
			this.selectedTables = [];
			this.sortItems = [];
			this.clickedTable = undefined;
			this.graph = new joint.dia.Graph;
			this.position = 30;
			this.posCount = 0;
			this.joinsCount = 0;
			this.joinTablePosition = 190;
			that.editMode = false;
			this.getView().byId("sortById").setValue();
			that.getView().byId("formulaId").setVisible(true);
			that.getView().byId("editorButton").setEnabled(true);
			var dummyModel = new sap.ui.model.json.JSONModel();
			this.getView().byId("database").setSelectedKey("Brevo");

			service.callService("Brevo" + "Tables", "Brevo" + "Tables", "getAllTablesAndViews?db=Brevo", "", true,
				function (evt) {
					var tModel = sap.ui.getCore().getModel("Brevo" + "Tables");
					that.getView().byId("tables").setModel(tModel);
				});
			this.getView().byId("tables").removeSelections();
			this.getView().byId("selectedTables").setModel(dummyModel);
			this.getView().byId("columnSelectionTableId").setModel(dummyModel);
			this.getView().byId("comboBoxFormulaId").setModel(dummyModel);
			this._handleNavigationToStep(0);
			this._wizard.discardProgress(this._wizard.getSteps()[0]);
			this._oNavContainer.removePage(this._oWizardReviewPage);
		},
		handleSubmitCancel: function () {
			this._handleNavigationToStep(0);
		},
		onListItemPress: function (evt) {
			var that = this;
			this.editFormula = true;
			that.listSelectedPath = evt.oSource.getBindingContext().sPath.split("/")[1];
			this.addFormulafrag.open();
			var value = evt.oSource.getBindingContext().getObject();
			var Aliasname = value.Aliasname;
			this.addFormulafrag.getContent()[0].getItems()[0].getItems()[3].setValue(Aliasname);
			var Formula = value.Formula;
			this.addFormulafrag.getContent()[0].getItems()[1].getItems()[0].getItems()[1].setValue(Formula);

		},
		handleDelete: function (evt) {
			var that = this;
			evt.mParameters.listItem.getBindingContextPath();
			evt.oSource.getModel().oData.splice(evt.mParameters.listItem.getBindingContextPath().split("/")[1], 1);
			evt.oSource.getModel().updateBindings(true);
		},
		onValueHelpRequestForSortValue: function (evt) {
			var that = this;
			var selectedProperty = [];
			var tableSelectedColumns = this.getView().byId("columnSelectionTableId").getModel().getProperty("/");
			if (that.fileUploaded == true) {
				for (var p = 0; p < tableSelectedColumns.length; p++) {
					selectedProperty.push(tableSelectedColumns[p].tablename + "." + tableSelectedColumns[p].name);
				}
			} else {
				for (var p = 0; p < tableSelectedColumns.length; p++) {
					if (tableSelectedColumns[p].datatype == "MEASURE")
						selectedProperty.push(tableSelectedColumns[p].tablename + "." + tableSelectedColumns[p].name);
				}
			}

			if (that.valueHelpForSort.getSortItems().length > 0) {
				that.valueHelpForSort.removeAllSortItems();
			}
			for (var z = 0; z < selectedProperty.length; z++) {
				that.valueHelpForSort.addSortItem(new sap.m.ViewSettingsItem({
					text: selectedProperty[z],
					key: selectedProperty[z]
				}));
			}
			var calColumns = this.getView().byId("comboBoxFormulaId").getModel().getData();
			for (var z = 0; z < calColumns.length; z++) {
				that.valueHelpForSort.addSortItem(new sap.m.ViewSettingsItem({
					text: calColumns[z].Aliasname,
					key: calColumns[z].Aliasname
				}));
			}
			if (that.sortItems.length > 0) {
				that.valueHelpForSort.setSelectedSortItem(that.sortItems[0].selectedSortItem);
				if (that.sortItems[0].sortOperator == "DESC")
					that.valueHelpForSort.setSortDescending(true)
				else
					that.valueHelpForSort.setSortDescending(false)
			}
			that.valueHelpForSort.open();
		},
		handleViewSettingsConfirm: function (evt) {
			if (evt.mParameters.sortDescending == false)
				var sortType = "ASC";
			else
				var sortType = "DESC";
			var sortItemSelected = evt.mParameters.sortItem.getText();
			// this.sortItem = sortItemSelected + " by " + sortType;
			this.sortItems = [{
				sortOperator: sortType,
				selectedSortItem: sortItemSelected
			}];
			this.getView().byId("sortById").setValue(sortItemSelected);
		},

	});

});