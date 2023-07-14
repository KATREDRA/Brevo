sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Brevo/BrevoDtree/model/Service",
	"Brevo/BrevoDtree/util/CustomerFormatter",
	"Brevo/BrevoDtree/util/draw",
	"Brevo/BrevoDtree/util/DrawPivotTable",
	"sap/m/MessageBox",
	"sap/ui/commons/TextView",
	"sap/ui/table/Column",
	"Brevo/BrevoDtree/util/Formatter",
], function (Controller, service, CustomerFormatter, draw, drawPivotTable, MessageBox, TextView, Column, Formatter) {
	"use strict";

	return Controller.extend("Brevo.BrevoDtree.controller.View1", {
		onInit: function () {
			var driverTree = this;
			this.isOnNavBack = false;
			driverTree.selectedColumnName = [];
			this.fileUploaded = false, this.createScenario = false, this.variantChange = false, this.hMode = true, this.hiddenNodes = [], this
				.editDataLevel2 = [], this.expandTree = true, this.simulate = false, this.dragged = false, this.getEntityDataUrl;
			this.filterId = [], this.filterSelectedValues = {}, driverTree.segmentArray = [], this.fileUpload, this.arrayVal, this.eventVal,
				this
				.mArray = [], this.dArray = [], this.originalsegmentModel,
				this.thresHolds = [], this.viewName, this.measureProperties, this.dimensionProperties, this.measureModel, this.segmentModel, this.dimensionModel,
				this.selectedVariant =
				"Variant 1", this.scenarioInfo, this.varianceInfo, this.segnewData,
				this.segmentsSelected = [],
				this.segmentItems = [], this.segmentTree = false, this.impactSelected = false, this.ListId, this.ScenId, this.updateFlag;
			if (!driverTree.FileDialog)
				driverTree.FileDialog = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.ValueHelpForFiles", driverTree);
			if (!driverTree.valueHelpRequestForEntity)
				driverTree.valueHelpRequestForEntity = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.ValueHelpForEntity", this);
			if (!driverTree.DropDownPopUp)
				driverTree.DropDownPopUp = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.PopUpForScenario", driverTree);
			if (!driverTree.ValueHelpForService)
				driverTree.ValueHelpForService = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.ValueHelpForService", driverTree);
			if (!driverTree.ValueHelpForDataRecords)
				driverTree.ValueHelpForDataRecords = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.ValueHelpForDataRecords", driverTree);
			if (!this.valueHelpForAddnodes)
				this.valueHelpForAddnodes = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.AddNodes", driverTree);
			if (!this.valueHelpForAddComments)
				this.valueHelpForAddComments = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.AddComments", driverTree);
			if (!this.valueHelpForVariant)
				this.valueHelpForVariant = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.addVariant", driverTree);
			if (!this.DialogForExcelUpdate)
				this.DialogForExcelUpdate = sap.ui.xmlfragment("Brevo.BrevoDtree.fragments.DialogForExcelUpdate", driverTree);

			driverTree.FileDialog.getContent()[0].addEventDelegate({
				onclick: function () {
					$("#" + driverTree.FileDialog.getContent()[1].sId + "-fu").trigger('click');
				}
			});

			service.callService("viewsListModel", "viewsListModel",
				"FileUploader/Tables", "", true, "",
				function (
					evt,
					flag) {
					var selectedViewsModel = sap.ui.getCore().getModel("viewsListModel");
					driverTree.ValueHelpForDataRecords.setModel(selectedViewsModel);
				});
			var bus = sap.ui.getCore().getEventBus();
			bus.subscribe("systemsetting", "systemtreeData", function (channel, evt, data) {
				if (data.key == "SystemDerived")
					driverTree.sliderChangeFunction(data.nodedetails, data.nodedetails.value, true);
				else
					driverTree.sliderChangeFunction(data.nodedetails, data.nodedetails.value, false);
			});
			var url = "/Scenario.xsodata/Filter('DTREE')/ExistingScenSet?$format=json";

			// service.callService("existingModel", "existingModel",
			// 	url, "scenario", true, "",
			// 	function (evt, flag) {
			// 		var varianceModel = sap.ui.getCore().getModel("existingModel");
			// 		driverTree.ValueHelpForService.getContent()[2].setModel(varianceModel);
			// 		var bus = sap.ui.getCore().getEventBus();
			// 		bus.subscribe("settings", "treeData", function (channel, evt, data) {
			// 			driverTree.variantObject.MeasureTree = "";
			// 			driverTree.variantObject.HiddenNodes = "";
			// 			driverTree.loadDataToTreeForScenario(data.scenarioInfo, data.varianceInfo)
			// 		});
			// 		bus.subscribe("systemsetting", "systemtreeData", function (channel, evt, data) {
			// 			driverTree.sliderChangeFunction(data.nodedetails, data.nodedetails.value, true)
			// 		});
			// 	});
			// var treeEvent = driverTree.getView().byId("temptree");
			// treeEvent.addEventDelegate({
			// 	onclick: function (evt) {
			// 		if (evt.srcControl.sId.indexOf("input") != (-1)) {
			// 			evt.srcControl.setEditable(true);
			// 		}
			// 	}
			// });
			this.initCustomFormat();
			this.getAllScenarioes();
			this.getAllSharedScenario();
		},
		onAfterRendering: function () {
			try {
				// var scenarioId = window.localStorage.getItem('scenarioId');
				// this.selectedScenarioModel(scenarioId);
				if (this.isOnNavBack) {
					draw.drawMeasureTree(this);
				}
			} catch (e) {}

		},

		//Create scenario for pana report
		createScenarioForpanaReport: function (value) {
			var that = this;
			var target = localStorage.getItem("targetMeasure");

			var reportUrl = "ReportConfigSet(" + value + ")";
			service.callService("reportModel", "reportModel", reportUrl, "report", true, "", function (evt, flag) {
				var reportModel = sap.ui.getCore().getModel("reportModel");
				var reportData = reportModel.oData.d["RepConfig"];
				var reportDetails = JSON.parse(decodeURIComponent(escape(window.atob(reportData))));
				var measureValue = [],
					dimensionValue = []
				if (reportDetails.measures.length < 1) {
					var columns = reportDetails.columns;
					for (var x = 0; x < columns.length; x++) {
						if (columns[x].dataType == "measure" && columns[x].property != localStorage.getItem("Input_Content")) {
							measureValue.push({
								Value: columns[x].property
							});
						} else {
							dimensionValue.push({
								Value: columns[x].property
							});
						}
					}
				}
				var scenarioInfo = {
					"scenarioTitle": reportDetails.reportTitle,
					"serviceURL": reportDetails.EntitySet,
					"Entity": localStorage.getItem("targetMeasure"),
					"EntitySet": "",
					"measures": measureValue,
					"dimension": dimensionValue,
					"excelFileName": "excelFile",
					"dataSource": "service"
				}
				var variantConfig = {
					"timeDimension": "",
					"timePeriod": "",
					"quarterInfo": "",
					"varianceMeasure": "",
					"MinDimension": "",
					"minMeasure": ""
				}
				that.ScenId = Math.round(Math.random() * 1000000);
				that.ListId = Math.round(Math.random() * 1000000);
				that.scenarioTitle = reportDetails.reportTitle;

				var url = "/Scenarios";
				var msg = "Scenario Created Successfully";
				var postReportInfo = {
					"ListId": that.ListId,
					"ScenId": that.ScenId,
					"ScenName": reportDetails.reportTitle,
					"ScenConfig": btoa(unescape(encodeURIComponent(JSON.stringify(scenarioInfo)))),
					"RoleFlag": "T",
					"temp": 0,
					"Filter": "DTREE",
					"VariantSettings": btoa(unescape(encodeURIComponent(JSON.stringify(variantConfig))))
				};
				service.callCreateService(url, JSON.stringify(postReportInfo), false, "POST", function (evt, sucessFlag,
					oError) {
					if (sucessFlag) {
						that.getView().byId("scenarioName").setText(that.scenarioTitle);
						var variant = {
							"VariantId": Math.round(Math.random() * 1000000),
							"VariantName": "Variant 1",
							"ScenId": that.ScenId,
							"SegmentTree": "",
							"SegmentSelection": "",
							"MeasureTree": "",
							"HiddenNodes": "",
							"Filter": "DTREE"
						};
						service.callCreateService("/Variants.xsjs", JSON.stringify(variant), "", "POST", function (evt, sucessFlag,
							oError) {
							localStorage.setItem("targetMeasure", null);
							that.panaviewData = true;
							that.selectedScenarioModel(that.ScenId);
						});
					}
				});
			});
		},

		initCustomFormat: function () {
			CustomerFormatter.registerCustomFormat();
		},
		// Navigate to next step in creation scenario dailog
		hanldeNextStep: function () {
			var next = this;
			var scenIconTabSelected = this.ValueHelpForService.getContent()[1].getSelectedKey();
			if (scenIconTabSelected === "general") {
				this.ValueHelpForService.getContent()[1].getItems()[2].setEnabled(true);
				this.ValueHelpForService.getContent()[1].setSelectedKey("data");
				if (this.updateFlag === true) {
					this.ValueHelpForService.getButtons()[1].setVisible(true);
				} else {
					this.ValueHelpForService.getButtons()[0].setVisible(true);
				}
			} else {
				if (this.validateFields()) {
					if (this.updateFlag === true) {
						this.ValueHelpForService.getButtons()[0].setVisible(false);
						this.ValueHelpForService.getButtons()[1].setVisible(true);
					} else {
						this.ValueHelpForService.getButtons()[0].setVisible(true);
						this.ValueHelpForService.getButtons()[1].setVisible(false);
					}
					this.ValueHelpForService.getContent()[1].getItems()[4].setEnabled(true);
					this.ValueHelpForService.getContent()[1].setSelectedKey("variance");
					this.ValueHelpForService.getButtons()[2].setVisible(false);
				}
			}
		},

		removeFilterstyleclass: function () {
			for (var f = 0; f < this.filterId.length; f++) {
				sap.ui.getCore().byId(this.filterId[f]).removeStyleClass("customFilterSelectColor");
				this.filterId.splice(f, 1);
			}
		},
		// To get all list of user scenarios
		getAllScenarioes: function () {
			var driverTree = this;
			service.callService("ScenarioListModel", "ScenarioListModel", "/Scenarios?$filter=temp%20eq%200", "scenario",
				true, "",
				function (evt, flag) {
					if (flag) {
						var selectedFileModel = sap.ui.getCore().getModel("ScenarioListModel");
						if (selectedFileModel.oData.d.results.length != 0) {
							driverTree.getView().byId("createtextId").setVisible(false);
							driverTree.getView().byId("chartArea").setVisible(true);
							driverTree.getView().byId("variantItems").setVisible(true);
							driverTree.user = selectedFileModel.oData.d.results[0].CreatedBy;
							var scenarioId = window.localStorage.getItem('scenarioId');
							var bCompact = !!driverTree.getView().$().closest(".sapUiSizeCompact").length;
							try {
								if (evt.mParameters.errorobject.statusCode == 502 || evt.mParameters.errorobject.statusCode == 500) {
									var message = evt.mParameters.errorobject.responseText
									sap.m.MessageBox.error(message, {
										styleClass: bCompact ? "sapUiSizeCompact" : ""
									});
									driverTree.getView().setBusy(false);
								}
							} catch (e) {
								console.log(e);
							}
							driverTree.DropDownPopUp.setModel(selectedFileModel);
							var target = localStorage.getItem("targetMeasure");
							if (window.location.hash.length > 2 && target !== "null") {
								if (window.location.hash) {
									var cardId = window.location.hash.split("#")[1].split("=")[1];
									//= window.location.hash.cardId;
								} else {
									var cardId = 746538;
								}
								var postTempScenarioInfo = {
									"cardid": cardId
								};
								service.callCreateService("TempScenario", JSON.stringify(postTempScenarioInfo), true, "POST", function (evt, sucessFlag,
									oError) {
									if (sucessFlag) {
										driverTree.selectedScenarioModel(cardId);
										driverTree.ScenId = cardId;
										// driverTree.createVariant(cardId);
									}
								});;
							} else if (selectedFileModel.oData.d.results.length != 0)

								if (scenarioId == null || scenarioId == "null" || scenarioId == "undefined")
									driverTree.selectedScenarioModel(selectedFileModel.oData.d.results[0].ScenId)
								else
									driverTree.selectedScenarioModel(scenarioId);

						} else {
							driverTree.getView().byId("createtextId").setVisible(true);
							driverTree.getView().byId("chartArea").setVisible(false);
							driverTree.getView().byId("variantItems").setVisible(false)
							driverTree.getView().byId("scenarioName").setText("Select a Scenario");
							driverTree.getView().setBusy(false);
						}
					} else {
						window.location = "../Login/index.html";
						// console.log("Invalid Session");
					}

				});
		},
		// To get all list of existing scenarios for other users
		getAllSharedScenario: function () {
			var that = this;

			// service.callService("ScenarioExistingModel", "ScenarioExistingModel", "Scenario.xsodata/Filter('DTREE')/ExistingScenSet",
			// 	"scenario", true, "",
			// 	function (
			// 		evt, flag) {
			// 		var ScenarioExistingModel = sap.ui.getCore().getModel("ScenarioExistingModel");
			// 		that.ValueHelpForService.getContent()[2].setModel(ScenarioExistingModel);
			// 	});
		},

		// To display existing scenarios
		openReportList: function (evt) {
			this.DropDownPopUp.openBy(evt.oSource);
		},

		// update temp create scenario
		UpdateScenario: function (ListId, ScenId, scenarioInfo, varianceInfo) {
			var that = this

			sap.m.MessageBox.warning("Do u want save the Scenario.?", {
				title: "Warning",
				initialFocus: sap.m.MessageBox.Action.NO,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (sButton) {
					if (sButton === sap.m.MessageBox.Action.NO) {
						var url = "ScenarioDelete.xsjs?ListId=" + ListId + "";
						service.callDeleteService(url, "scenario", function () {

							service.callService("ScenarioListModel", "ScenarioListModel", "Scenario.xsodata/filter('DTREE')/SavedScenariosSet",
								"scenario", true, "",
								function (evt,
									flag) {
									var selectedFileModel = sap.ui.getCore().getModel("ScenarioListModel");
									that.DropDownPopUp.setModel(selectedFileModel)
									that.panaviewData = false;
								});
						});
					} else {
						var postReportInfo = {
							"ScenId": ScenId,
							"ScenName": scenarioInfo.scenarioTitle,
							"ScenConfig": btoa(unescape(encodeURIComponent(JSON.stringify(scenarioInfo)))),
							"RoleFlag": "",
							"Filter": "DTREE",
							"VariantSettings": btoa(unescape(encodeURIComponent(JSON.stringify(varianceInfo))))
						};
						service.callCreateService("Scenario.xsjs?ListId=" + ListId + "", JSON.stringify(postReportInfo), false, "PUT", function (
							evt,
							sucessFlag,
							oError) {
							if (sucessFlag) {
								that.panaviewData = false;
								sap.m.MessageToast.show("Scenario saved successfully");
								service.callService("ScenarioListModel", "ScenarioListModel", "Scenario.xsodata/filter('DTREE')/SavedScenariosSet",
									"scenario", true, "",
									function (evt,
										flag) {
										that.DropDownPopUp.setModel(selectedFileModel);
									});
							}
						});
					}
				}
			});
		},

		// on Selection of scenario
		onScenarioSelection: function (evt) {
			var driverTree = this;
			this.hMode = true, this.expandTree = true, this.variantChange = false;
			if (driverTree.panaviewData == true) {
				driverTree.UpdateScenario(driverTree.ListId, driverTree.ScenId, driverTree.selectedscenarioInfo, driverTree.varianceInfo);
			}
			var scenario = evt.oSource.getSelectedItem().getBindingContext().getObject();
			this.getView().setBusy(true);
			evt.oSource.removeSelections();
			window.localStorage.setItem('scenarioId', scenario.ScenId);
			this.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
			this.getView().byId("treeStyle").setIcon("sap-icon://collapse");
			this.getView().byId("segments").setVisible(true);
			this.getView().byId("vdt").setWidth("100%");
			this.onDeletePress();
			this.onRefreshView();
			this.getView().byId("vdtVisualise").setVisible(false);
			if (scenario.Existing) {
				this.onExistingScenarioPress("selection");
			} else {
				var variantItemsModel = new sap.ui.model.json.JSONModel("model/icontabModel.json");
				driverTree.getView().byId("variantItems").setModel(variantItemsModel);
				if (driverTree.getView().byId("variantItems").getModel().oData.length == 1) {
					driverTree.getView().byId("variantDelId").setVisible(false);
				} else {
					driverTree.getView().byId("variantDelId").setVisible(true);
				}
				variantItemsModel.attachRequestCompleted(function () {
					driverTree.variantObject = variantItemsModel.oData[0];
				});
				driverTree.getView().byId("variantItems").updateBindings(true);
				this.selectedVariant = "Variant 1";
				this.selectedScenarioModel(scenario.ScenId);
			}
			this.DropDownPopUp.close();
		},
		// On selection of existing scenario
		onExistingScenarioPress: function (evt, object) {
			var driverTree = this;
			var scen = evt;
			this.getView().byId("segments").setText("Segments : All");
			if (evt == "scenario") {
				this.existingObject = object;
			} else if (scen != "selection") {
				this.existingObject = evt.oSource.getSelectedItem().getBindingContext().getObject();
				evt.oSource.removeSelections();
				$("svg")[0].style.width = window.innerWidth;
			}
			this.Scenario = this.existingObject;
			this.Existing = true, this.hMode = true, this.expandTree = true, this.variantChange = false;
			this.getView().byId("vdt").setWidth("100%");
			this.segmentsSelected = [], this.segmentItems = [], this.filterId = [], this.segmentTree = false;
			if (evt.sId == "select") {
				driverTree.dialog = new sap.m.Dialog({
					title: 'Confirm',
					type: 'Message',
					content: [
						new sap.m.Label({
							text: 'Are you sure you want to create shared scenario?',
							labelFor: 'Scenario Name'
						}),
						new sap.m.Input({
							value: evt.mParameters.listItem.getTitle(),
							width: '100%',
						}),
						new sap.m.Label({
							text: 'Share: ',
						}),
						new sap.m.CheckBox({}),
					],
					beginButton: new sap.m.Button({
						text: 'Save',
						press: function () {
							driverTree.busy = new sap.m.BusyDialog();
							driverTree.busy.open();

							var url = "Variant.xsjs?ScenId=" + driverTree.existingObject.ScenId + "&Shared=true&$format=json";
							service.callService("Model1", "Model1", url, "scenario", true, "", function (evt) {
								driverTree.settingmodel = sap.ui.getCore().getModel("Model1").oData;
								var method = "POST";
								driverTree.ScenId = Math.round(Math.random() * 1000000);
								driverTree.ListId = Math.round(Math.random() * 1000000);
								driverTree.scenariotitle = driverTree.dialog.getContent()[1].getValue();
								var share;
								if (driverTree.dialog.getContent()[3].getSelected() == true) {
									share = "X";
								} else {
									share = "";
								}
								var msg = "Scenario Created Successfully";
								var postReportInfo = {
									"ListId": driverTree.ListId,
									"ScenId": driverTree.ScenId,
									"ScenName": driverTree.scenariotitle,
									"ScenConfig": driverTree.settingmodel[0].ScenConfig,
									"RoleFlag": share,
									"temp": 0,
									"Filter": "DTREE",
									"VariantSettings": driverTree.settingmodel[0].VariantSettings
								};
								service.callCreateService("Scenario.xsjs", JSON.stringify(postReportInfo), false, method, function (evt, sucessFlag,
									oError) {
									if (sucessFlag) {
										driverTree.getView().byId("scenarioName").setText(driverTree.scenariotitle);
										var numvariant = driverTree.settingmodel[0].Variants;
										var z = 0;
										for (var i = 0; i < numvariant.length; i++) {
											var variant = {
												"VariantId": Math.round(Math.random() * 1000000),
												"VariantName": numvariant[i].VariantName,
												"ScenId": driverTree.ScenId,
												"SegmentTree": numvariant[i].SegmentTree,
												"SegmentSelection": numvariant[i].SegmentSelection,
												"MeasureTree": numvariant[i].MeasureTree,
												"HiddenNodes": numvariant[i].HiddenNodes,
												"Filter": "DTREE"
											};
											service.callCreateService("Variants.xsjs", JSON.stringify(variant), "", "POST", function (evt, sucessFlag,
												oError) {
												console.log("posted");
												z++;
												if (z == numvariant.length) {
													driverTree.hMode = true;
													driverTree.resetFields();
													driverTree.createScenario = true;
													window.localStorage.setItem('scenarioId', driverTree.ScenId);
													driverTree.getAllScenarioes();
													driverTree.dialog.close();
													driverTree.busy.close();
												}
											});
										}
									}
								});
							});
							driverTree.dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function () {
							driverTree.dialog.close();
						}
					}),
				});
				driverTree.dialog.open();
			}
		},
		// to select segments for the selected variant
		onEditSegmentsPress: function () {
			var that = this;
			if (that.getView().byId("dataStyle").getIcon() === "sap-icon://table-view") {
				that.segmentsSelected = [], that.segmentItems = [];
				that.segmentTree = true;
				$("svg")[0].style.width = window.innerWidth;
				that.getView().byId("vdt").setWidth("100%");
				that.onDeletePress();
				if (that.variantObject.SegmentTree == null || that.variantObject.SegmentTree.length == 0) {
					that.dailog.open();
					that.callSegmentService();
				} else
					draw.drawSegmentTree(that);
				that.getView().byId("forecasting").setType("Transparent");
				that.getView().byId("floaterSettingsVisibility").setVisible(false);
				that.getView().byId("vdtVisualise").setVisible(true);
			}
		},

		// To load the configuration info for selected scenario
		selectedScenarioModel: function (scenarioid) {
			var driverTree = this;
			this.isOnNavBack = true;
			this.Existing = false;
			this.onDeletePress();
			this.onRefreshView();
			var url = "/Scenarios?$expand=Variants&$filter=ScenId eq " + parseInt(scenarioid) + "&$format=json";
			service.callService("SelectedScenarioModel", "SelectedScenarioModel", url, "scenario", true, "", function (evt) {
				driverTree.getView().setBusy(false);
				try {
					if (!evt.mParameters.success) {
						var message = evt.mParameters.errorobject.responseText
						sap.m.MessageBox.error(message);
						driverTree.getView().setBusy(false);
					} else {
						var selectedFileModel = sap.ui.getCore().getModel("SelectedScenarioModel").oData.d.results[0];
						driverTree.getView().byId("scenarioName").setText(selectedFileModel.ScenName);
						driverTree.scenarioInfo = JSON.parse(decodeURIComponent(escape(window.atob(selectedFileModel.ScenConfig))));
						driverTree.varianceInfo = JSON.parse(decodeURIComponent(escape(window.atob(selectedFileModel.VariantSettings))));
						var variantItemsModel = new sap.ui.model.json.JSONModel(selectedFileModel.Variants);
						driverTree.getView().byId("variantItems").setModel(variantItemsModel);
						if (driverTree.getView().byId("variantItems").getModel().oData.length == 1) {
							driverTree.getView().byId("variantDelId").setVisible(false);
						} else {
							driverTree.getView().byId("variantDelId").setVisible(true);
						}
						driverTree.variantObject = variantItemsModel.oData[0];
						if (variantItemsModel.oData[0].SegmentSelection.includes("'")) {
							driverTree.getView().byId("segments").setText("Segments : " + variantItemsModel.oData[0].SegmentSelection);
						} else {
							driverTree.getView().byId("segments").setText("Segments : All");
						}
						if (driverTree.variantObject.HiddenNodes) {
							driverTree.hiddenNodes = JSON.parse(driverTree.variantObject.HiddenNodes)
						} else {
							driverTree.hiddenNodes = []
						}
					}
					driverTree.getView().byId("customFloatEditBtn2").setIcon("sap-icon://horizontal-grip");
					driverTree.getView().byId("customFloatEditBtn2").setTooltip("Horizontal Representation");
					driverTree.hMode = true, driverTree.filterId = [];
					driverTree.getView().byId("dataSource").setText(driverTree.scenarioInfo.serviceURL);
					driverTree.getView().byId("entity").setText(driverTree.scenarioInfo.Entity);
					driverTree.dragged = false;
					driverTree.commentServices(scenarioid);
					driverTree.loadDataToTreeForScenario(driverTree.scenarioInfo, driverTree.varianceInfo);
				} catch (e) {
					driverTree.getView().setBusy(false);
				}

			});
		},
		// on add icon button press
		onAddPress: function () {
			var that = this;
			this.DropDownPopUp.close();
			this.updateFlag = false;
			this.mArray = [];
			this.dArray = [];
			var oIconTab = that.ValueHelpForService.getContent()[1];
			if (oIconTab.getItems()[0].getContent()[0].getContent()[3].getSelected() === true) {
				oIconTab.getItems()[0].getContent()[0].getContent()[3].setSelected(false);
			}

			oIconTab.setSelectedKey(oIconTab.getItems()[0].getKey());
			that.ValueHelpForService.getButtons()[2].setVisible(true);
			that.ValueHelpForService.getButtons()[1].setVisible(false);
			that.ValueHelpForService.getButtons()[2].setEnabled(false);
			that.ValueHelpForService.getButtons()[0].setVisible(false);
			oIconTab.getItems()[2].setEnabled(false);
			oIconTab.getItems()[4].setEnabled(false);
			oIconTab.getItems()[0].setEnabled(true);
			this.ValueHelpForService.open();
		},
		// search to find scenario from list
		onScenarioSearch: function (evt) {
			var aFilters = [];
			var sQuery = evt.getSource().getValue();
			var list = this.DropDownPopUp.getContent()[0];
			var binding = list.getBinding("items");
			if (sQuery && sQuery.length > 0) {
				var scentitle = new sap.ui.model.Filter("ScenName", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(scentitle);
				binding.filter(new sap.ui.model.Filter(aFilters, false));
			} else {
				binding.filter([]);
			}
		},
		handleServiceDialogClose: function () {
			this.resetFields();
			this.ValueHelpForService.close();
			this.getView().setBusy(false);
		},
		valueHelpDataRecordsClose: function (evt) {
			evt.oSource.oParent.getContent()[0].setValue();
			this.ValueHelpForDataRecords.close();
		},
		valueHelpCloseButton: function () {
			this.valueHelpRequestForEntity.close();
		},
		valueHelpFileCloseButton: function () {
			this.FileDialog.close();
		},
		// to display file dailog and for displaying existing files list
		onValueHelpRequestForFiles: function () {
			var driverTree = this;
			driverTree.FileDialog.open();
		},
		// to open dailog for list of data records
		onValueHelpRequestForDataRecords: function () {
			var that = this;
			this.ValueHelpForDataRecords.getContent()[1].getBinding("items").filter([]);
			that.ValueHelpForDataRecords.open();
		},

		// to delete the user scenario
		onScenarioDelete: function (evt) {
			var driverTree = this;
			var scenario = evt.oSource.oParent.getBindingContext().getObject();
			sap.m.MessageBox.confirm(
				"Are you sure you want to delete the " + scenario.ScenName + " scenario?", {
					onClose: function (oAction) {
						if (oAction === "OK") {

							var scenarioId = window.localStorage.getItem('scenarioId');
							driverTree.getView().setBusy(true);
							// var url = "Scenarios('" + scenario.ListId + "')";
							var url = "Scenarios(" + scenario.ScenId + ")";
							service.callDeleteService(url, "scenario", function () {
								var ovpPageConfigUrl = "OVPPageConfig(" + scenario.ScenId + ")";
								service.callDeleteService(ovpPageConfigUrl, "scenario", function () {
									sap.m.MessageToast.show("Scenario Deleted successfully");
									if (scenario.ScenId === parseInt(scenarioId))
										window.localStorage.setItem('scenarioId', null);
									driverTree.onRefreshView();
									driverTree.createScenario = false;
									driverTree.getAllScenarioes();
								});

							});
						}
					}
				});
		},
		// to toogle edit/save mode of the table: To delete any
		// existing files
		editModeExcelTable: function (evt) {
			if (evt.oSource.getIcon() == "sap-icon://edit") {
				evt.oSource.oParent.oParent.setMode("Delete");
				evt.oSource.setIcon("sap-icon://accept")
			} else {
				evt.oSource.oParent.oParent.setMode("SingleSelectMaster");
				evt.oSource.setIcon("sap-icon://edit")
			}
		},

		// Select an existing file
		onExistingFileSelected: function (evt, scenarioInfo, parsedDataFromExcelModel) {
			var that = this;
			var oIconTab = this.ValueHelpForService.getContent()[1];
			this.FileDialog.setBusy(true);
			this.fileUploaded = true;
			if (this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].getColumns().length > 0) {
				this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].removeAllColumns();
				this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].getModel().setData(null);
			}
			this.mArray = [];
			this.dArray = [];
			if (that.updateFlag === true) {
				var fileName = scenarioInfo.excelFileName;
				var fileUrl = "/FileUploader.xsjs?FileName=" + fileName;
			} else if (that.fileUpload === true) {
				fileName = parsedDataFromExcelModel.oData.name.split(".")[0];
				fileUrl = "/FileUploader.xsjs?FileName=" + fileName;
			} else {
				var object = evt.getParameters().listItem.getBindingContext().getModel().getObject(evt.getParameters().listItem.getBindingContext()
					.sPath);
				fileName = object.FileName;
				fileUrl = "/FileUploader.xsjs?FileName=" + fileName;
				var source = evt.oSource;
			}

			service.callService("FileDataModel", "FileUpload", fileUrl, true, "true", "", function (evt) {
				try {
					that.FileDialog.setBusy(false);
					var fileUploadModel = sap.ui.getCore().getModel("FileDataModel");
					var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
					parsedDataFromExcelModel.setData({
						name: fileName,
						data: fileUploadModel.oData.results
					});
					sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
					var props = [];
					for (var i in fileUploadModel.oData.results[0]) {
						props.push({
							property: i,
							value: i,
							name: i
						});
					}
					var propertiesModel = new sap.ui.model.json.JSONModel();
					propertiesModel.setData(props);
					that.fileUploaded = true;
					that.FileDialog.close();

					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValueState("None");
					that.fileUploaded = true;
					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValue();
					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].setValue(fileName);
					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].setShowValueHelp(false);
					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0].removeAllItems();
					oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1].removeAllItems();

					var mlist = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
					mlist.bindItems({
						path: "/",
						template: new sap.m.StandardListItem({
							title: "{value}"
						})
					});
					mlist.setModel(propertiesModel);
					var dlist = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1];
					dlist.bindItems({
						path: "/",
						template: new sap.m.StandardListItem({
							title: "{value}"
						})
					});
					dlist.setModel(propertiesModel);
					if (that.updateFlag === false) {
						source.removeSelections();
					}
					that.createTabledata(scenarioInfo);
					// that.setMeasuresAndDimensionsForEnity(object.FileName);
				} catch (e) {
					var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
					sap.m.MessageBox.error(
						"Failed to load data for selected scenario", {
							styleClass: bCompact ? "sapUiSizeCompact" : ""
						});
				}
			});
		},
		// To browse a new excel file
		onFileUploaderOnSelectChanged: function (e) {
			var driverTree = this;
			var files = e.getParameters().files;
			var f = files[0];
			var name = f.name;
			driverTree.FileDialog.getContent()[0].getItems()[0].setText(name);
			handleDrop(files, driverTree.onFileRead, driverTree);
		},
		// To Read the content from the browsed file
		onFileRead: function (binaryData, parsedData, that) {

			// var data = parsedData[0].data
			// var colname = Object.keys(data[0]);
			// for (var i = 0; i < colname.length; i++) {
			// 	if (colname[i].indexOf("Date") > -1 || colname[i].indexOf("date") > -1) {
			// 		for (var z = 0; z < data.length; z++) {
			// 			var newdate = moment(new Date(1899, 12, data[z][colname[i]] - 1)).format('YYYY-MM-DD');

			// 			data[z][colname[i]] = newdate;
			// 		}

			// 	}
			// }
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel();
			parsedDataFromExcelModel.setData({
				name: that.FileDialog.getContent()[0].getItems()[0].getText(),
				data: (parsedData)
			});
			sap.ui.getCore().setModel(parsedDataFromExcelModel, "parsedDataFromExcelModel");
		},
		valueHelpCloseButtonForExcelDisplay: function () {
			this.DialogForExcelUpdate.close();
		},
		displayExcelTableForFileUpdate: function (fileName, tableColumns) {
			var that = this;
			var parsedDataFromExcelModel = new sap.ui.model.json.JSONModel(tableColumns);
			parsedDataFromExcelModel.setData({
				fileName: fileName,
				COLUMN_DET: tableColumns
			});
			this.DialogForExcelUpdate.setModel(parsedDataFromExcelModel);
			this.DialogForExcelUpdate.open();
		},
		handleFileUpdate: function (evt) {
			var that = this;
			var model = this.DialogForExcelUpdate.getModel();
			var method = "PUT";
			that.ValueHelpForService.setBusy(true);
			service.callCreateService("FileUploader", JSON.stringify({
				fileName: model.oData.fileName,
				COLUMN_DET: model.oData.COLUMN_DET
			}), true, method, function (evt, isSuccess) {
				if (isSuccess) {
					that.DialogForExcelUpdate.close();
					service.callService("viewsListModel", "viewsListModel",
						"FileUploader/Tables", "", true, "",
						function (evt, flag) {
							var selectedViewsModel = sap.ui.getCore().getModel("viewsListModel");
							that.ValueHelpForDataRecords.setModel(selectedViewsModel);
							var viewList = that.ValueHelpForDataRecords.getContent()[1];
							viewList.getItems().forEach(function (item) {
								if (item.getBindingContext().getObject().FileName == model.oData.fileName) {
									item.firePress();
									sap.m.MessageToast.show("File Updated successfully");
									that.ValueHelpForService.setBusy(false);
								}
							});
							// that.ValueHelpForDataRecords.close();
						});
				} else {
					that.DialogForExcelUpdate.close();
					sap.m.MessageToast.show("File Update failed");
				}
			});
		},
		handleExistingFileUpdate: function (evt) {
			var tableObj = evt.getSource().getBindingContext().getObject();
			var tableColumns = tableObj.COLUMN_DET;
			var tableName = tableObj.FileName;
			this.displayExcelTableForFileUpdate(tableName, tableColumns);
		},

		// To uplaod a new file
		valueHelpUploadButton: function (evt) {
			/*
			 * this.getView().setBusy(true); this.serviceUrl = false;
			 */
			var that = this;
			var method = "POST";
			var parsedDataFromExcelModel = sap.ui.getCore().getModel("parsedDataFromExcelModel");

			var random = Math.round(Math.random() * 1000000) + "";
			parsedDataFromExcelModel.oData.id = random;

			// var source = evt.oSource;

			that.ValueHelpForService.setBusy(true);

			service.callCreateService("FileUploader", JSON.stringify({
				fileName: parsedDataFromExcelModel.oData.name.split(".")[0],
				data: parsedDataFromExcelModel.oData.data
			}), true, method, function (evt, isSuccess) {
				if (isSuccess) {
					that.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[1].setValue();
					var columns = JSON.parse(evt).columnData;
					var fileName = that.FileDialog.getContent()[0].getItems()[0].getText().split(".")[0];
					service.callService("viewsListModel", "viewsListModel",
						"FileUploader/Tables", "", true, "",
						function (evt, flag) {
							var selectedViewsModel = sap.ui.getCore().getModel("viewsListModel");
							that.ValueHelpForDataRecords.setModel(selectedViewsModel);
							var viewList = that.ValueHelpForDataRecords.getContent()[1];
							viewList.getItems().forEach(function (item) {
								if (item.getBindingContext().getObject().FileName == fileName) {
									that.ValueHelpForService.setBusy(false);
									sap.m.MessageToast.show("File Uploaded successfully");
									item.firePress();
									that.displayExcelTableForFileUpdate(fileName, columns);
								}
							});
						});

				} else {
					try {
						var errorMsg = JSON.parse(evt).message;
					} catch (e) {}
					var displayMsg;
					if (errorMsg == "Access Denied")
						displayMsg = "Access Denied.File Already exists";
					else
						displayMsg = "File Upload failed";
					that.ValueHelpForService.setBusy(false);
					sap.m.MessageToast.show(displayMsg);
				}
			});
		},
		// on select of service url from data records dailog
		onServiceUrlSelect: function (evt) {
			var value
			if (typeof evt === "object") value = evt.getSource().getTitle();
			else value = evt;
			evt.oSource.oParent.oParent.getContent()[0].setValue();
			var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent();
			dataContent[5].setValue(value);
			this.viewName = value;
			dataContent[5].setValueState("Success");
			// dataContent[1].setValueState("Success");
			this.ValueHelpForDataRecords.close();
			this.fileUploaded = false;
			var msrsanddimModel = new sap.ui.model.json.JSONModel(evt.getSource().getBindingContext().getObject());
			sap.ui.getCore().setModel(msrsanddimModel, "msrsanddimModel");
			this.onServiceUrlChanged();
		},
		// on changing the Data source URL from Data Records dialog
		onServiceUrlChanged: function (scenarioInfo) {
			var dTree = this;
			var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent();
			var servicePath = dataContent[5].getValue().trim();

			// var serviceURL = "Views.xsodata/All_View_Columns?$filter=VIEW_NAME eq '" + servicePath +
			// 	"'&$format=json";
			// var serviceURL = "ColumnsOfView?FileName=" + servicePath;
			// service.callService("msrsanddimModel", "msrsanddimModel", serviceURL, "", true, "", function (
			// 	evt,
			// 	flag) {
			var selectedViewsModel = sap.ui.getCore().getModel("msrsanddimModel");
			dTree.setMeasuresAndDimensionsForEnity(selectedViewsModel, scenarioInfo);
			// });

		},
		// To load list of entities for selected URL
		onValueHelpRequestForEntity: function (evt) {
			this.valueHelpRequestForEntity.open();
		},
		// Event called on selecting a particular entity set
		valueHelpItemSelectionEntity: function (evt) {
			var value
			if (typeof evt === "object") value = evt.getSource().getTitle();
			else value = evt;
			this.targetValue = value
			var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems();
			dataContent[0].getContent()[7].setValue(value);
			var oIconTab = this.ValueHelpForService.getContent()[1];
			var measureList = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
			if (measureList.getSelectedItems().length > 0) {
				for (var i = 0; i < measureList.getSelectedItems().length; i++) {
					if (measureList.getSelectedItems()[i].getTitle() == dataContent[0].getContent()[7].getValue()) {
						measureList.getSelectedItems()[i].setSelected(false);
					}
				}

			}
			this.valueHelpRequestForEntity.close();
		},
		// To load data for the selected entityset
		loadDataToModelForServiceUrl: function (evt, scenarioInfo) {
			var driverTree = this;
			var serviceUrl = this.newUrl;
			this.newUrl.replace("Express/", "");
			var oIconTab = this.ValueHelpForService.getContent()[1];
			var entity = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].getValue().trim();
			if (serviceUrl.length > 0 && entity.length > 0) {
				var oDataModelMetadata = this.oDataModel.getServiceMetadata();
				var schemaLength = oDataModelMetadata.dataServices.schema.length;
				if (schemaLength >= 1) {
					for (var k = (schemaLength - 1); k >= 0; k--) {
						var entityCont = oDataModelMetadata.dataServices.schema[k].entityContainer;
						var entitySetList = entityCont[0].entitySet;
						for (var i = 0; i < entitySetList.length; i++) {
							if (entitySetList[i].entityType.endsWith(entity)) {
								this.entitySetRequired = entitySetList[i].name;
								this.getEntityDataUrl = this.newUrl + "/" + this.entitySetRequired + "?$format=json&$top=5";
								this.getEntityDataUrl.trim();
								break;
							}
						}
						break;
					}
				}
				if (schemaLength == 1) {
					var entityCont = oDataModelMetadata.dataServices.schema[0].entityContainer;
					var entitySetList = entityCont[0].entitySet;
					for (var i = 0; i < entitySetList.length; i++) {
						if (entitySetList[i].entityType.endsWith(entity)) {
							this.entitySetRequired = entitySetList[i].name;
							this.getEntityDataUrl = this.newUrl + "/" + this.entitySetRequired + "?$format=json&$top=5";
							this.getEntityDataUrl.trim();
							break;
						}
					}
				}
				this.getView().setBusy(true);
				this.entitySetDataModel = new sap.ui.model.json.JSONModel(this.getEntityDataUrl, {
					bAsync: false
				});
				this.entitySetDataModel.attachRequestCompleted(function (oEv) {
					oEv.oSource.mEventRegistry = [];
					driverTree.getView().setBusy(false);
					if (driverTree.updateFlag === true) {
						driverTree.createTabledata(scenarioInfo);
					}
				});
				this.setMeasuresAndDimensionsForEnity(entity);
			} else {
				var message = "Enter a Service URL";
				sap.m.MessageToast.show(message);
			}
		},
		// To set measures and dimensions for the selected entityset
		setMeasuresAndDimensionsForEnity: function (value, scenarioInfo) {
			var that = this;
			// this.measureModel = new sap.ui.model.json.JSONModel([]);
			// this.dimensionModel = new sap.ui.model.json.JSONModel([]);
			// this.measureAndDimensionsModel = value;
			this.timedimensionmodel = new sap.ui.model.json.JSONModel([]);
			if (value == undefined)
				value = new sap.ui.model.json.JSONModel(scenarioInfo);
			// this.measureAndDimensionsModel = value;
			if (value.getData().COLUMN_DET.length > 0) {
				for (var d = 0; d < value.getData().COLUMN_DET.length; d++) {
					try {
						if (value.getData().COLUMN_DET[d].DATATYPE == "DATE" || value.getData().COLUMN_DET[d].DATATYPE == "Date") {
							var dEntrytime = {
								"Value": value.getData().COLUMN_DET[d].COLUMN_NAME
							};
							var dEntriestime = this.timedimensionmodel.getData();
							dEntriestime.push(dEntrytime);
						}
					} catch (e) {}
				}
			}
			// this.alldimension = dEntries;
			// this.measureModel.setData(mEntries);
			// this.dimensionModel.setData(dEntries);
			var mlist = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
			mlist.bindItems({
				path: "/MEASURES",
				template: new sap.m.StandardListItem({
					title: "{}"
				})
			});
			// mlist.setModel(this.measureModel);
			var dlist = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1];
			dlist.bindItems({
				path: "/DIMENSIONS",
				template: new sap.m.StandardListItem({
					title: "{}"
				})
			});
			// dlist.setModel(this.dimensionModel);
			this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[1].setModel(value);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].setModel(this.timedimensionmodel);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[2].setSelectedKey();
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[4].setSelectedKey();
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setMin(0.0);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setMax(1.0);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setStep(0.1);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setValue(0.5);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setEnableTickmarks(true);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setMin(-10);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setMax(10);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setStep(2);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setValue(0);
			this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setEnableTickmarks(true);
			this.valueHelpRequestForEntity.setModel(value);
			if (this.updateFlag === false) {
				var oTable = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1];
				oTable.removeAllColumns();
				oTable.setModel(new sap.ui.model.json.JSONModel([]));
				var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems();
				dataContent[0].getContent()[7].setValue();
				this.mArray = [];
				this.dArray = [];
				this.prop = [];
			} else {
				this.createTabledata(scenarioInfo);
				this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[2].setSelectedKey(that.editvarianceInfo
					.timeDimension);
				this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[4].setSelectedKey(that.editvarianceInfo
					.timePeriod);
				this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[6].setValue(that.editvarianceInfo.MinDimension);
				this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent()[8].setValue(that.editvarianceInfo.minMeasure);
			}
			this.getView().setBusy(false);
		},
		// To validate measure selections
		handleMeasureSelections: function (evt) {
			var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems();
			if (dataContent[0].getContent()[7].getValue() === "") {
				sap.m.MessageToast.show("Please select target measure");
				evt.getParameters("listItem").listItem.setSelected(false);
			} else if (dataContent[0].getContent()[7].getValue() == evt.getParameters("listItem").listItem.getTitle()) {
				evt.getParameters("listItem").listItem.setSelected(false);
				sap.m.MessageToast.show("Measure is selected as a target measure");
			} else {
				var measureKey = evt.getParameters("listItem").listItem.getTitle();
				this.eventVal = evt.getParameters("listItem").listItem;
				this.arrayVal = true;
				var table = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1];
				if (this.mArray.indexOf(measureKey) === -1) {
					this.mArray.push(measureKey);
					this.batchCall();
				} else {
					this.mArray.splice(this.mArray.indexOf(measureKey), 1);
					if (this.mArray.length === 0 && this.dArray.length > 0) {
						table.removeColumn(table.getColumns().length - 1);
					} else if (this.mArray.length === 0) {
						table.removeAllColumns();
						table.getModel().setData(null);
					} else {
						this.batchCall();
					}
				}
			}
		},
		// To validate dimension selections
		handleDimensionSelections: function (evt) {
			this.eventVal = evt.getParameters("listItem").listItem;
			this.arrayVal = false;
			if (this.fileUploaded === true) {
				if (this.mArray.length === 0) {
					sap.m.MessageBox.error("Please select measures before selecting dimension");
					this.eventVal.setSelected(false);
				} else {
					this.dimensionsSelection(evt);
				}
			} else {
				this.dimensionsSelection(evt);
			}

		},
		dimensionsSelection: function (evt) {
			var dataContent = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems();
			if (dataContent[0].getContent()[7].getValue() === "") {
				sap.m.MessageToast.show("Please select target measure");
				evt.getParameters("listItem").listItem.setSelected(false);
			} else {
				var dimensionKey = evt.getParameters("listItem").listItem.getTitle();
				var table = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1];
				if (this.dArray.indexOf(dimensionKey) === -1) {
					this.dArray.push(dimensionKey);
					this.batchCall();
				} else {
					this.dArray.splice(this.dArray.indexOf(dimensionKey), 1);
					this.batchCall();
				}
			}
		},
		batchCall: function () {
			var driverTree = this;
			var keys = this.dArray.concat(this.mArray);
			if (keys.join() === "") {
				var oTable = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1];
				oTable.removeAllColumns();
				oTable.getModel().setData(null);
			} else {
				if (this.fileUploaded === true) {
					driverTree.fileuploadmeasuresanddimensions(keys, sap.ui.getCore().getModel("parsedDataFromExcelModel").oData.name);
				} else {
					driverTree.fileuploadmeasuresanddimensions(keys);
				}
			}
		},
		fileuploadmeasuresanddimensions: function (keys, scenarioInfo) {
			var driverTree = this;
			var oIconTab = this.ValueHelpForService.getContent()[1];
			if (driverTree.updateFlag === true) {
				driverTree.viewName = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
			}
			if (this.fileUploaded === false) {
				var dataUrl = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
				var fileUrl = "getData?fileName=" + this.viewName;
				var boolean = "true";
				if (this.mArray.length > 0 && this.dArray.length === 0) {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName + "&$select=" + this.mArray.join();
				} else if (this.mArray.length === 0 && this.dArray.length > 0) {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName +
						"&$select=" + this.dArray.join();
				} else {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName + "&$select=" + this.mArray.join() + "," +
						this.dArray.join();
				}
			} else {
				boolean = "true";
				if (this.mArray.length > 0 && this.dArray.length === 0) {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName + "&$select=" + this.mArray.join();
				} else if (this.mArray.length === 0 && this.dArray.length > 0) {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName +
						"&$select=" + this.dArray.join();
				} else {
					fileUrl = "getData?aggregation=true&fileName=" + this.viewName + "&$select=" + this.mArray.join() + "," +
						this.dArray.join();
				}
			}

			service.callService("FileSelectedModel", "FileSelectedModel", fileUrl, "IMS", true, dataUrl, function (evt) {
				if (typeof evt.oSource.oData === "object") {
					var selectedFileModel = sap.ui.getCore().getModel("FileSelectedModel");
					// driverTree.createTable(keys,
					// selectedFileModel.oData.results);
					if (driverTree.arrayVal === false && driverTree.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[
							0]
						.getItems()[
							1].getItems()[1].getSelectedItems().length === 0) {
						driverTree.createTable(keys, selectedFileModel.oData[0]);
					} else if (driverTree.arrayVal === true && driverTree.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[
							0].getItems()[
							1].getItems()[1].getSelectedItems().length >= 1) {
						driverTree.createTable(keys, selectedFileModel.oData[1]);
					} else if (driverTree.arrayVal === true) {
						driverTree.createTable(keys, selectedFileModel.oData);
					} else {
						driverTree.createTable(keys, selectedFileModel.oData);
					}
				} else {
					sap.m.MessageBox.error("Selected value is not valid, please select other");
					driverTree.eventVal.setSelected(false);
					if (driverTree.arrayVal === true) {
						for (var m = 0; m < driverTree.mArray.length; m++) {
							if (driverTree.eventVal.getTitle() === driverTree.mArray[m]) {
								driverTree.mArray.splice(driverTree.mArray.indexOf(driverTree.mArray[m]), 1);
							}
						}
					} else {
						for (var d = 0; d < driverTree.dArray.length; d++) {
							if (driverTree.eventVal.getTitle() === driverTree.dArray[d]) {
								driverTree.dArray.splice(driverTree.dArray.indexOf(driverTree.dArray[d]), 1);
							}
						}
					}

				}
			});
		},
		createTable: function (value, data) {
			var oTable = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1];
			oTable.removeAllColumns();
			if (this.fileUploaded === true) {
				if (data.length > 1) {
					var myArray = Object.assign({}, data[0], data[1], data[2]);
				} else {
					myArray = data;
				}
			} else {
				myArray = data;
			}
			for (var i = 0; i < value.length; i++) {
				oTable.addColumn(new Column({
					width: "7rem",
					label: new sap.m.Label({
						text: value[i]
					}),
					template: new TextView({
						text: "{" + value[i] + "}"
					})
				}));
			}
			oTable.setModel(new sap.ui.model.json.JSONModel(myArray));
			this.segmentTable = myArray;
			oTable.bindRows("/");
			// oTable.setModel(new sap.ui.model.json.JSONModel(myArray));
			// driverTree.createTable(keys, selectedFileModel.oData.results);
			if (this.arrayVal === false && this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[
					1].getItems()[1].getSelectedItems().length === 0) {
				oTable.setModel(new sap.ui.model.json.JSONModel([myArray]));
			} else if (this.arrayVal === true && this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[
					0].getItems()[
					1].getItems()[1].getSelectedItems().length >= 1) {
				oTable.setModel(new sap.ui.model.json.JSONModel(myArray));
			} else if (this.arrayVal === true) {
				oTable.setModel(new sap.ui.model.json.JSONModel([myArray]));
			} else {
				oTable.setModel(new sap.ui.model.json.JSONModel(myArray));
			}
			oTable.bindRows("/");
			this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].setBusy(false);
		},
		// To validate all fields before creating scenario
		validateFields: function () {
			var oIconTab = this.ValueHelpForService.getContent()[1];
			var scenarioTitle = oIconTab.getItems()[0].getContent()[0].getContent()[1].getValue();

			var dataSrc = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
			var entity = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].getValue();
			var measureKeys = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0].getSelectedItems();
			var dimensionKeys = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1].getSelectedItems();
			if (scenarioTitle.length <= 0)
				sap.m.MessageToast.show("Please enter the scenario name");
			// else if (excelFile.length <= 0 && dataSrc.length <= 0)
			else if (dataSrc.length <= 0)
				sap.m.MessageToast.show("Please upload excel or choose any Data Source");
			else if (entity.length <= 0)
				sap.m.MessageToast.show("Please select Target Measure");
			else if (measureKeys.length <= 0)
				sap.m.MessageToast.show("Please choose atleast one measure");
			else if (dimensionKeys.length <= 1)
				sap.m.MessageToast.show("Please choose atleast two dimensions");
			else
				return true;
		},
		// on create new scenario
		handleCreateScenario: function () {
			var that = this;
			var driverTree = this;
			var validated = this.validateFields();
			var oIconTab = this.ValueHelpForService.getContent()[1];
			var scenarioTitle = oIconTab.getItems()[0].getContent()[0].getContent()[1].getValue();

			var serviceUrl = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
			var entity = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].getValue();
			var measureKeys = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0].getSelectedItems();
			var dimensionKeys = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1].getSelectedItems();
			var variantConfig = driverTree.variantAnalysisConfig("scenario");
			if (that.ValueHelpForService.getButtons()[1].getVisible() === true && this.fileUploaded === true) {
				this.updateFlag = true;
			}
			var ScenarioList = sap.ui.getCore().getModel("ScenarioListModel");
			var scenarioPresent = false;
			if (this.updateFlag != true && ScenarioList.oData.d.results.length > 0) {
				for (var k = 0; k < ScenarioList.oData.d.results.length; k++) {
					if (ScenarioList.oData.d.results[k].ScenName == scenarioTitle) {
						scenarioPresent = true;
						sap.m.MessageToast.show("scenario with " + scenarioTitle + " exist please change the scenario Title");
						break;
					} else {
						scenarioPresent = false;
					}

				}

			}
			if (validated && scenarioPresent == false) {
				var measureValue = [],
					dimensionValue = [],
					dataSource;
				if (this.fileUploaded)
					dataSource = "file";
				else
					dataSource = "service";
				for (var i = 0; i < measureKeys.length; i++)
					measureValue.push(oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0].getSelectedItems()[i].getBindingContext()
						.getObject());
				for (var i = 0; i < dimensionKeys.length; i++)
					dimensionValue.push(oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1].getSelectedItems()[i].getBindingContext()
						.getObject());
				var scenarioInfo = {
					"scenarioTitle": scenarioTitle,
					"serviceURL": serviceUrl,
					"Entity": entity,
					"EntitySet": this.entitySetRequired,
					"measures": measureValue,
					"dimension": dimensionValue,
					// "excelFileName": excelFile,
					"excelFileName": "excelFile",
					"dataSource": dataSource
				};
				var shareSelected = oIconTab.getItems()[0].getContent()[0].getContent()[3].getSelected();
				if (shareSelected)
					var sharable = "X";
				else
					sharable = "";
				if (this.updateFlag === true) {
					var method = "PUT";
					var url = "/Scenarios(" + this.ScenId + ")";
					var ovpPageUrl = "OVPPageConfig(" + this.ScenId + ")";
					var msg = "Scenario Updated Successfully";
					var postReportInfo = {
						"ScenId": this.ScenId,
						"ScenName": scenarioTitle,
						"ScenConfig": btoa(unescape(encodeURIComponent(JSON.stringify(scenarioInfo)))),
						"RoleFlag": sharable,
						"Filter": "DTREE",
						"temp": 0,
						"VariantSettings": btoa(unescape(encodeURIComponent(JSON.stringify(variantConfig))))
					};
					var postPageInfo = {
						"Page_Id": this.ScenId,
						"PageTitle": scenarioTitle,
						"TypeOfPage": "D",
						"RoleFlag": sharable
					};
				} else {
					method = "POST";
					this.ScenId = Math.round(Math.random() * 1000000);
					this.ListId = Math.round(Math.random() * 1000000);
					url = "/Scenarios"
					ovpPageUrl = "OVPPageConfig";
					// url = "Scenario.xsjs";
					msg = "Scenario Created Successfully";
					var postReportInfo = {
						"ListId": this.ListId,
						"ScenId": this.ScenId,
						"Page_Id": this.ScenId,
						"ScenName": scenarioTitle,
						"temp": 0,
						"ScenConfig": btoa(unescape(encodeURIComponent(JSON.stringify(scenarioInfo)))),
						"RoleFlag": sharable,
						"Filter": "DTREE",
						"VariantSettings": btoa(unescape(encodeURIComponent(JSON.stringify(variantConfig))))
					};
					var postPageInfo = {
						"Page_Id": this.ScenId,
						"PageTitle": scenarioTitle,
						"TypeOfPage": "D",
						"RoleFlag": sharable
					};
				}
				driverTree.ValueHelpForService.close();

				driverTree.getView().setBusy(true);
				service.callCreateService(ovpPageUrl, JSON.stringify(postPageInfo), "scenario", method, function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						// var PageId = JSON.parse(evt).data.Page_Id;
						// postReportInfo.Page_Id = PageId;
						service.callCreateService(url, JSON.stringify(postReportInfo), "scenario", method, function (evt, sucessFlag, oError) {
							if (sucessFlag) {
								window.localStorage.setItem('scenarioId', driverTree.ScenId);
								driverTree.getView().byId("scenarioName").setText(scenarioTitle);
								if (method == "POST") {
									that.createVariant(driverTree.ScenId);
								} else {
									sap.m.MessageToast.show(msg);
									driverTree.getView().byId("segments").setText("Segments : All");
									driverTree.hMode = true;
									driverTree.resetFields();
									driverTree.createScenario = false;
									driverTree.getAllScenarioes();
								}
							} else {
								sap.m.MessageToast.show("Unable to create scenario, try again later.");
							}
						});

					}
				});
			}
		},
		createVariant: function (ScenId) {
			var driverTree = this;
			var msg = "Scenario Created Successfully";
			var variant = {
				"VariantId": Math.round(Math.random() * 1000000),
				"VariantName": "Variant 1",
				"ScenId": ScenId,
				"Page_Id": ScenId,
				"SegmentTree": "",
				"SegmentSelection": "",
				"MeasureTree": "",
				"HiddenNodes": "",
				"Filter": "DTREE"
			};
			service.callCreateService("/Variants", JSON.stringify(variant), "scenario", "POST", function (evt, sucessFlag,
				oError) {
				sap.m.MessageToast.show(msg);
				driverTree.variantObject = variant;
				driverTree.selectedVariant = "Variant 1";
				driverTree.getView().byId("segments").setVisible(true);
				driverTree.getView().byId("segments").setText("Segments : All");
				// driverTree.handleCreateTree(scenarioInfo);
				driverTree.hMode = true;
				driverTree.resetFields();
				driverTree.createScenario = true;
				driverTree.getAllScenarioes();
				// driverTree.selectedScenarioModel(driverTree.ScenId);
			});
		},
		// To construct json variant anayalysis for selected/created scenario
		variantAnalysisConfig: function (category) {
			var dataContent;
			if (category === "scenario") {
				// dataContent =
				// varianceAnalysis.getView().getContent()[0].getContent()[0].getContent();
				// if(dataContent[4].getSelectedKey() == "" ){
				var bus = sap.ui.getCore().getEventBus();
				var viewname = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[
					5].getValue();
				if (viewname == undefined) {
					viewname = this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[3].getValue();
				}
				dataContent = this.ValueHelpForService.getContent()[1].getItems()[4].getContent()[0].getContent();
			} else
				dataContent = this.variancePopUp.getContent()[0].getContent()[0].getContent()[0].getContent();
			return {
				"timeDimension": dataContent[2].getSelectedKey(),
				"timePeriod": dataContent[4].getSelectedKey(),
				// "quarterInfo": dataContent[5].getSelectedKey(),
				// "varianceMeasure": dataContent[7].getSelectedKey(),
				"MinDimension": dataContent[6].getValue(),
				"minMeasure": dataContent[8].getValue()
			};
		},

		// load data for the selected scenario for datasource as odata service
		loadDataToTreeForScenario: function (scenarioInfo, varianceInfo) {
			try {
				this.getView().byId("floatSlider").setValue(0);
				this.measureProperties = scenarioInfo.measures;
				this.dimensionProperties = scenarioInfo.dimension;
				this.selectedscenarioInfo = scenarioInfo;
				this.selectedvarianceInfo = varianceInfo;
				var driverTree = this,
					measures = "",
					dimensions = "";
				for (var i = 0; i < this.measureProperties.length; i++) {
					if (i == 0) measures = this.measureProperties[i];
					else measures += "," + this.measureProperties[i];
				}

				for (var j = 0; j < this.dimensionProperties.length; j++) {
					if (j === 0) dimensions = this.dimensionProperties[j];
					else dimensions += "," + this.dimensionProperties[j];
				}
				var properties = measures + "," + dimensions;

				driverTree.selectedmeasureandDimensions = properties;
				if (varianceInfo.timeDimension.length > 0) {
					driverTree.SelectedUrl = scenarioInfo.serviceURL + "&select=" + properties + "&target=" + scenarioInfo.Entity + "&variantID=" +
						driverTree.variantObject.VariantId + "&year=" +
						varianceInfo.timePeriod + "&contribution=" + varianceInfo.minMeasure + "&time=" + varianceInfo.timeDimension;
				} else {
					driverTree.SelectedUrl = scenarioInfo.serviceURL + "&select=" + properties + "&target=" + scenarioInfo.Entity + "&variantID=" +
						driverTree.variantObject.VariantId + "&contribution=" + varianceInfo.minMeasure;
				}
				driverTree.dailog = new sap.m.BusyDialog();
				driverTree.time = varianceInfo.timeDimension;
				if (driverTree.variantObject.MeasureTree.length == 0) {
					driverTree.loadeddata = "Ml";
					driverTree.dailog.open();
					driverTree.measuretreeurl = "MeasureTree?view=" + driverTree.SelectedUrl;
					service.callService("treedataModel", "treedataModel", driverTree.measuretreeurl, "IMS", true, "", function (evt, flag) {
						var newdata = driverTree.constructMeasureTreeJson(sap.ui.getCore().getModel("treedataModel").oData, null, null);
						driverTree.OmeasureModel = newdata;
						driverTree.variantObject.MeasureTree = JSON.stringify(driverTree.OmeasureModel.oData, function (key, value) {
							if (key != "parent")
								return value;
						});
						driverTree.dailog.close();
						// driverTree.getView().byId("temptree").setVisible(false);
						driverTree.getView().byId("reportContainerParent").setVisible(false);
						driverTree.segmentTree = false;
						draw.drawMeasureTree(driverTree);
					});
				} else {
					// driverTree.getView().byId("temptree").setVisible(false);
					if (JSON.parse(driverTree.variantObject.MeasureTree).nodecomments == undefined) {
						var newdata = driverTree.constructMeasureTreeJson(JSON.parse(driverTree.variantObject.MeasureTree), null, null);
						driverTree.OmeasureModel = newdata;
						driverTree.variantObject.MeasureTree = JSON.stringify(driverTree.OmeasureModel.oData, function (key, value) {
							if (key != "parent")
								return value;
						});
					}
					driverTree.getView().byId("reportContainerParent").setVisible(false);
					draw.drawMeasureTree(driverTree);
					driverTree.segmentTree = false;
				}
			} catch (e) {
				console.log(e);
			}

		},

		// segment tree Infl3 Service
		callSegmentService: function () {
			var that = this;

			var segmenttreeurl = "SegmentTree?view=" + that.SelectedUrl;
			service.callService("SegmenttreedataModel", "SegmenttreedataModel", segmenttreeurl, "IMS", true, "", function (evt, flag) {
				if (evt.oSource.oData.root != undefined && evt.oSource.oData.root.children.length != 0) {
					var SegmentData = sap.ui.getCore().getModel("SegmenttreedataModel").oData.root;
					SegmentData.children.forEach(function (d) {
						parseObject(d);
					});

					function parseObject(obj) {
						if (obj.hasOwnProperty("children")) {
							if (obj["children"].length > 0) {
								if (obj["children"][0].length == undefined)
									return;
								else
									obj["children"] = obj["children"][0];
								for (var child = 0; child < (obj["children"].length); child++) {
									parseObject(obj["children"][child]);
								}
							} else {
								return;
							}
						} else {
							return;
						}
					}
					var segmentmodeljson = that.constructSegmentTreeJson(SegmentData);
					that.OsegmentModel = new sap.ui.model.json.JSONModel(segmentmodeljson);
					that.variantObject.SegmentTree = JSON.stringify(that.OsegmentModel.oData, function (key, value) {
						if (key != "parent")
							return value;
					});
					draw.drawSegmentTree(that);
					// that.handleVariantUpdate(that.selectedVariant, false, false);
					that.dailog.close();
				} else {
					that.dailog.close();
				}
			});
		},

		// Tree json for Measure Tree
		constructMeasureTreeJson: function (data, year, quater) {
			var selectedyear, selectedquater;
			if (year != null) {
				selectedyear = year;
			} else {
				selectedyear = "";
			}
			if (quater != null) {
				selectedquater = quater;
			} else {
				selectedquater = "";
			}
			var that = this;
			var newData = {
				id: "NODE1",
				title: "Measure",
				dtitle: data.name,
				name: data.name,
				value: data.value,
				value_org: data.value,
				value_copy: data.value,
				difference: data.value - data.value,
				intercept: data.intercept,
				children: "",
				isHidden: false,
				isLocked: false,
				selected: false,
				nodecomments: [],
				year: selectedyear,
				quater: selectedquater,
			};
			if (data.children.length == 0)
				that.dailog.close();
			else
				data.children.forEach(function (d) {
					parseObject(d);
				});

			function parseObject(obj) {

				if (obj.hasOwnProperty("name")) {
					if (obj.hasOwnProperty("co_val")) {
						if (obj["co_val"].toString().indexOf("e") > -1) {
							convert(obj["co_val"]);

							function convert(n) {
								var [lead, decimal, pow] = n.toString().split(/e|\./);
								that.co_val = +pow <= 0 ? "0." + "0".repeat(Math.abs(pow) - 1) + lead + decimal : lead + (+pow >= decimal.length ? (decimal +
									"0".repeat(+pow - decimal.length)) : (decimal.slice(0, +pow) + "." + decimal.slice(+pow)));
							}
							obj["title"] = obj["name"];
							obj["dtitle"] = obj["name"];
							obj["value"] = obj["value"];
							obj["value_org"] = obj["value"];
							obj["value_copy"] = obj["value"];
							obj["difference"] = (obj["value_org"] - obj["value"]);
							obj["co_val"] = that.co_val.replace("-", '');
							obj["isHidden"] = false;
							obj["isLocked"] = false;
							obj["selected"] = false;
							obj["nodecomments"] = [];
						} else {
							obj["title"] = obj["name"];
							obj["dtitle"] = obj["name"];
							obj["value"] = obj["value"];
							obj["value_org"] = obj["value"];
							obj["value_copy"] = obj["value"];
							obj["difference"] = (obj["value_org"] - obj["value"]);
							obj["co_val"] = obj["co_val"];
							obj["isHidden"] = false;
							obj["isLocked"] = false;
							obj["selected"] = false;
							obj["nodecomments"] = [];
						}
					} else {
						obj["title"] = obj["name"];
						obj["dtitle"] = obj["name"];
						obj["value"] = obj["value"];
						obj["value_org"] = obj["value"];
						obj["difference"] = (obj["value_org"] - obj["value"]);
						obj["isHidden"] = false;
						obj["isLocked"] = false;
						obj["selected"] = false;
						obj["nodecomments"] = [];
					}

				}
				if (obj.hasOwnProperty("children")) {
					for (var child = 0; child < (obj["children"].length); child++) {
						parseObject(obj["children"][child]);
					}
				} else {
					return;
				}
			}
			newData.children = (data.children);
			return (new sap.ui.model.json.JSONModel(newData));
			this.resetFields();
		},

		// Tree json for Segment Tree
		constructSegmentTreeJson: function (SegmentData) {
			var that = this;
			if (that.varianceMeasure == true) {
				var MysegmentJson = {
					id: "NODE1",
					title: SegmentData.name,
					dtitle: "Measure",
					Value: SegmentData.Value,
					percentvalue: 100,
					value_org: SegmentData.Value,
					children: "",
				}
				SegmentData.children.forEach(function (d) {
					parseObject(d, SegmentData);
				});

				function parseObject(obj, previousObj) {
					if (obj.hasOwnProperty("name")) {
						obj["dtitle"] = obj["title"];
						obj["title"] = obj["name"];
						obj["value_org"] = obj["Value"];
						obj["percentvalue"] = (obj["Value"] / previousObj["Value"]) * 100;
					}
					if (obj.hasOwnProperty("children")) {
						for (var child = 0; child < (obj["children"].length); child++) {
							parseObject(obj["children"][child], obj);
						}
					} else {
						return;
					}
				}
				MysegmentJson.children = (SegmentData.children);
			} else {
				var MysegmentJson = {
					id: "NODE1",
					title: SegmentData.name,
					dtitle: "Measure",
					Value: SegmentData.Value,
					value_org: SegmentData.Value,
					children: "",
				}
				SegmentData.children.forEach(function (d) {
					parseObject(d);
				});

				function parseObject(obj) {
					if (obj.hasOwnProperty("name")) {
						obj["dtitle"] = obj["title"];
						obj["title"] = obj["name"];
						obj["value_org"] = obj["Value"];
					}
					if (obj.hasOwnProperty("children")) {
						for (var child = 0; child < (obj["children"].length); child++) {
							parseObject(obj["children"][child]);
						}
					} else {
						return;
					}
				}
				MysegmentJson.children = (SegmentData.children);
			}
			return (MysegmentJson);
		},

		onyearPress: function (evt) {
			var curDate = new Date();
			var curYear = curDate.getFullYear();
			var selectedyear = evt.oSource.getText();
			if (curYear.toString() != selectedyear) {
				this.getView().byId("floatSlider").setMin(0);
				this.getView().byId("floatSlider").setValue(0);
				this.getView().byId("floatSlider").setMax(12);
				/*this.getView().byId("floatSlider").setRange([0,0]);*/
				this.getView().byId("floatSlider").setStep(3);
			} else {
				var min;
				var curmonth = curDate.getMonth() + 1;
				if (curmonth == 1 || curmonth < 3)
					min = 3;
				else if (curmonth == 3 || curmonth < 6)
					min = 6;
				else if (curmonth == 6 || curmonth < 9)
					min = 9;

				this.getView().byId("floatSlider").setMin(min);
				this.getView().byId("floatSlider").setMax(12);
				/*this.getView().byId("floatSlider").setRange([min,min]);*/
				this.getView().byId("floatSlider").setStep(3);
			}
			this.handleFloatSliderChange();
		},

		loadPivotTable: function () {
			var that = this;
			var tableInfo = {};
			var reportContainerParent = this.getView().byId("reportContainerParent");
			var variantUrl = "FileUploader/Tables?FileName=" + this.scenarioInfo.serviceURL;

			service.callService("selectedTableModel", "selectedTableModel", variantUrl, "IMS", true, "", function (evt, flag) {
				if (evt.mParameters.success) {
					var tableInfo = sap.ui.getCore().getModel("selectedTableModel").getData();
					console.log(evt);
					drawPivotTable.drawTable("reportContainer", tableInfo, [], [], reportContainerParent);
				} else {
					MessageBox.error("Data Loading Failed")
				}

			});

		},

		// function for table expand and collapse 
		handleExpandButtonPress: function (evt) {
			var that = this;
			var measure
			that.selecetdColumnObj = evt.oSource.getBindingContext();
			that.selectedColumnName = evt.oSource.mBindingInfos.text.binding.sPath;
			evt.oSource.getBindingContext().getObject()["Parent"] = evt.oSource.mBindingInfos.text.binding.sPath + evt.oSource.getBindingContext()
				.sPath.split("/")[1];
			that.pathToRecognize = evt.oSource.getBindingContext().getObject()["Parent"];
			var selecetdObj = evt.oSource.getBindingContext().getObject();
			if (evt.oSource.getIcon() == "sap-icon://navigation-right-arrow") {
				evt.oSource.setIcon("sap-icon://navigation-down-arrow");
				var alldata = that.selecetdColumnObj.getObject();
				var data;
				for (var x = 0; x < Object.keys(evt.oSource.getBindingContext().getObject()).length; x++) {
					if ((Object.keys(evt.oSource.getBindingContext().getObject())[x] != "expanded") && (Object.values(evt.oSource.getBindingContext()
							.getObject())[x].toString().indexOf("All") == (-1)) && (Object.keys(evt.oSource.getBindingContext().getObject())[x] !=
							"Parent") &&
						(Object.keys(evt.oSource.getBindingContext().getObject())[x] != "ParentNew")) {
						if (x == 0) {
							data = '"' + Object.keys(evt.oSource.getBindingContext().getObject())[x] + '"' + "||" + Object.values(evt.oSource.getBindingContext()
								.getObject())[x];
						} else {
							data = data + ",," + '"' + Object.keys(evt.oSource.getBindingContext().getObject())[x] + '"' + "||" + Object.values(evt.oSource
								.getBindingContext().getObject())[x];
						}
					}

				}
				evt.oSource.setIcon("sap-icon://navigation-down-arrow");
				for (var j = 0; j < that.measureProperties.length; j++) {
					if (j === 0) measure = that.measureProperties[j].Value;
					else measure += "," + that.measureProperties[j].Value;
				}
				for (var i = 0; i < 2; i++) {
					if (that.selecetdColumnObj.getObject()[that.unselecteddimension[i]].indexOf("All") == (-1))
						measure += "," + that.unselecteddimension[i];
				}
				var properties = measure + "," + evt.oSource.mBindingInfos.text.parts[0].path + "&$filter=" + data;

				that.selecetdColumnObj.getObject()["expanded"] = evt.oSource.mBindingInfos.text.binding.sPath;
				var dataurl = "TableExpand.xsjs?variantID=" + that.variantObject.VariantId + "&select=" + properties;
				service.callService("ExbandTabledataModel", "ExbandTabledataModel", dataurl, "scenario", true, "", function (evt, flag) {
					var expanddata = sap.ui.getCore().getModel("ExbandTabledataModel").oData[0];
					for (var i = 0; i < 2; i++) {
						for (var j = 0; j < expanddata.length; j++) {
							if (!(expanddata[j].hasOwnProperty(that.unselecteddimension[i])))
								expanddata[j][that.unselecteddimension[i]] = "All " + that.unselecteddimension[i];

						}
					}

					for (var j = 0; j < expanddata.length; j++) {
						if (that.selecetdColumnObj.getObject().Parent) {
							expanddata[j]["Parent"] = that.selecetdColumnObj.getObject().Parent;
						}
					}

					for (var j = 0; j < expanddata.length; j++) {
						if ((expanddata[j].hasOwnProperty("Parent")))
							expanddata[j]["ParentNew"] = that.pathToRecognize;
						else
							expanddata[j]["Parent"] = that.pathToRecognize;
					}
					for (var s = 0; s < expanddata.length; s++)
						that.selecetdColumnObj.getModel().oData.splice(parseInt(that.selecetdColumnObj.getPath().split("/")[1]) + s + 1, 0,
							expanddata[
								s]);
					that.selecetdColumnObj.getModel().updateBindings(true);

				})
			} else {
				that.selecetdColumnObj.getObject()["expanded"] = false;
				evt.oSource.setIcon("sap-icon://navigation-right-arrow");
				for (var b = that.selecetdColumnObj.getModel().oData.length - 1; b >= 0; b--) {
					if (that.selecetdColumnObj.getModel().oData[b].Parent != undefined ||
						that.selecetdColumnObj.getModel().oData[b].ParentNew != undefined) {
						if (that.selecetdColumnObj.getModel().oData[b].Parent == that.pathToRecognize ||
							that.selecetdColumnObj.getModel().oData[b].ParentNew == that.pathToRecognize)
							that.selecetdColumnObj.getModel().oData.splice(b, 1);
					}

				}
				that.selecetdColumnObj.getModel().updateBindings(true);
			}
		},
		// table search functiom
		handleTableSearch: function (evt) {
			var columnName = Object.keys(this.getView().byId("temptree").getModel().oData[0]);
			var searchText = evt.oSource.getValue();
			var columnarr = [];
			for (var j = 0; j < this.dimensionProperties.length; j++) {
				var columnData = this.dimensionProperties[j].Value;
				columnarr.push(columnData);
			}
			for (var x = 0; x < this.unselecteddimension.length; x++) {
				columnarr.push(this.unselecteddimension[x])
			}
			var arr = [];
			for (var i = 0; i < columnName.length; i++) {
				for (var k = 0; k < columnarr.length; k++) {
					if (columnarr[k] == columnName[i]) {
						arr.push(new sap.ui.model.Filter(columnName[i], sap.ui.model.FilterOperator.Contains, searchText));
					}
				}
			}
			var oFilter = new sap.ui.model.Filter(arr, false);
			this.getView().byId("temptree").getBinding("rows").filter(oFilter);
		},
		ontablecollapse: function () {
			this.getView().setBusy(true);
			// this.getView().byId("temptree").setVisible(true);
			this.getView().byId("reportContainerParent").setVisible(true);
			// this.gridtable();
		},

		// To construct data for selected datasource as excel file
		fileDataTree: function (data, measureProperties, dimensionProperties) {
			var responses = data.oData.d.results;
			measureProperties[0].property = measureProperties[0].property.toLocaleUpperCase();
			for (var j = 0; j < dimensionProperties.length; j++) {
				dimensionProperties[j].property = dimensionProperties[j].property.toLocaleUpperCase();
			}
			var dataNodes = [],
				arr = [];
			for (var i = 0; i < measureProperties.length; i++) {
				dataNodes.push({
					"property": measureProperties[i].property,
					"value": responses[0][measureProperties[0].property.toLocaleUpperCase()]
				});
			}
			for (var i = 1; i < responses.length; i++) {
				var results = responses[i];
				for (var j = 0; j < results.length; j++) {
					arr.push(results[j]);
				}
			}
			this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[0].setModel(new sap.ui.model.json.JSONModel(dataNodes));
			this.constructMeasureTreeJson(responses[0], arr, measureProperties, dimensionProperties);
		},
		// To construct json for the selected service URL
		serviceURLTree: function (data, measureProperties, dimensionProperties) {
			var responses = data.__batchResponses;
			var dataNodes = [],
				arr = [];
			for (var i = 0; i < measureProperties.length; i++) {
				dataNodes.push({
					"property": measureProperties[i].property,
					"value": responses[0].data.results[0][measureProperties[i].property]
				});
			}
			for (var i = 1; i < responses.length; i++) {
				var results = responses[i].data.results;
				for (var j = 0; j < results.length; j++) {
					arr.push(results[j]);
				}
			}
			this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[0].setModel(new sap.ui.model.json.JSONModel(dataNodes));
			this.constructMeasureTreeJson(responses[0].data.results[0], arr, measureProperties, dimensionProperties);
		},

		// Node settings
		nodeSettings: function (d) {
			var that = this;
			this.nodeDetails = d;
			this.impactSelected = false;
			var hiddenList = this.getView().byId("hiddenList"),
				hiddenItems = [];
			var itemPresent = false;

			if (this.hiddenNodes.length > 0) {
				for (var i = 0; i < this.hiddenNodes.length; i++) {
					var title = this.hiddenNodes[i].arrayPos.split(":")[2];
					if (title === d.title) {
						hiddenItems.push({});
						itemPresent = true;
					}
				}
			}

			if (itemPresent === true) {
				hiddenList.setModel(new sap.ui.model.json.JSONModel(hiddenItems));
				this.getView().byId("hideNode").setVisible(true);
			} else {
				this.getView().byId("hideNode").setVisible(false);
			}
			if (d.parent == undefined) {
				this.getView().byId("nodeHidden").setEnabled(false);
			} else {
				this.getView().byId("nodeHidden").setEnabled(true);
			}

			var percent = 100;
			var nodeSlicer = d3.select("#id" + this.nodeDetails.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(this.nodeDetails.value_org))
				.select(".slice")[0][0];
			var color = nodeSlicer.style.fill.length == 0 ? nodeSlicer.getAttribute("fill") : nodeSlicer.style.fill;
			this.value = percent;
			if (this.url == "file") var source = this.Scenario.excelFileName.split(".")[0];
			else var source = "LR2/Grossmargin"
			if (d.isHidden) {
				this.getView().byId("nodeHidden").removeStyleClass("switchTextOff");
				this.getView().byId("nodeHidden").addStyleClass("switchTextOn");
			} else {
				this.getView().byId("nodeHidden").removeStyleClass("switchTextOn");
				this.getView().byId("nodeHidden").addStyleClass("switchTextOff");
			}
			// }

			if (d.isLocked) {
				this.getView().byId("nodeLocked").removeStyleClass("switchTextOff");
				this.getView().byId("nodeLocked").addStyleClass("switchTextOn");
			} else {
				this.getView().byId("nodeLocked").removeStyleClass("switchTextOn");
				this.getView().byId("nodeLocked").addStyleClass("switchTextOff");
			}
			this.getView().byId("nodeHidden").setState(d.isHidden);
			this.getView().byId("nodeLocked").setState(d.isLocked);
			this.getView().byId("dataSource").setText(source);
			this.getView().byId("nodePercent").setEnabled(!d.isLocked);
			this.getView().byId("nodePercent").setValue(percent);
			this.getView().byId("nodePie").getData()[0].setValue(parseInt(d.value_org));
			if (this.getView().byId("nodePie").getData()[0].getValue() > 0) {
				this.getView().byId("nodePie").getData()[0].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[0].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[1].setValue(parseInt(d.value));
			if (this.getView().byId("nodePie").getData()[1].getValue() > 0) {
				this.getView().byId("nodePie").getData()[1].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[1].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[2].setValue(parseInt(d.value - d.value_org));
			if (this.getView().byId("nodePie").getData()[2].getValue() > 0) {
				this.getView().byId("nodePie").getData()[2].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[2].setColor("Error");
			}
			this.getView().byId("header").setTitle(d.dtitle);
			this.getView().byId("header").getAttributes()[0].setText("Org Value : " + Formatter.amountToMillions(d.value_org));
			this.getView().byId("nodeCurrentValue").setText("Current Value : " + Formatter.amountToMillions(d.value));
			this.getView().byId("nodeDiffValue").setText("Difference : " + Formatter.amountToMillions(parseFloat(d.value_org) -
				parseFloat(d.value)));
			var currentChange = parseFloat(d.value_org) - parseFloat(d.value);
			this.getView().byId("nodeDiffValue").setState(currentChange > 0 ? "Success" : (currentChange < 0 ? "Error" : "None"));

		},
		// To set impact measures for the selected node
		setImpactMeasuresValues: function (d) {
			var driverTree = this;
			this.getView().byId("ImpactMeasures").removeAllContent();
			// this.getView().byId("nodePercent").removeAllContent();
			var form = this.getView().byId("ImpactMeasures");
			var parent = d;
			try {
				d.children.forEach(function (d) {
					parseObject(d);
				});

				function parseObject(obj) {

					if (obj.isLocked == false) {
						var pValue = parseFloat(parent.value_org);
						var cValue = parseFloat(obj.value_org);
						var percent = (cValue / pValue) * 100;
						obj.percent = percent;
						form.addContent(new sap.m.Label({
							text: obj.name
						}))
						form.addContent(new sap.m.ObjectStatus({
							text: cValue
						}))
						form.addContent(new sap.m.Slider({
							min: 0,
							max: 2 * (cValue),
							width: "90%",
							value: cValue,
							liveChange: function (evt) {
								driverTree.handleImpactChange(evt);
							}
						}))

					} else {
						var pValue = parseFloat(d.value_org);
						var cValue = parseFloat(obj.value_org);
						var percent = (cValue / pValue) * 100;
						parent.obj.percent = percent;
						form.addContent(new sap.m.Label({
							text: obj.name
						}))
						form.addContent(new sap.m.ObjectStatus({
							text: cValue
						}))
						form.addContent(new sap.m.Slider({
							min: 0,
							max: 2 * (cValue),
							width: "90%",
							value: cValue,
							enabled: false,
							liveChange: function (evt) {
								driverTree.handleImpactChange(evt);
							}
						}))
					}
					if (obj.hasOwnProperty("children")) {
						for (var child = 0; child < (obj["children"].length); child++) {
							parseObject(obj["children"][child]);
						}
					} else {
						return;
					}
				}
			} catch (e) {

			}
			try {
				setvalce(d);

				function setvalce(d) {
					if (d.isLocked == false) {
						var value_org1 = 2 * (d.value_org);
						var value_org2 = parseInt(d.value);

						driverTree.getView().byId("nodePercent").setMax(value_org1);
						driverTree.getView().byId("nodePercent").setMin(0);
						driverTree.getView().byId("nodePercent").setValue(value_org2);
					} else {
						driverTree.getView().byId("nodePercent").setEnabled(false);
						var value_org1 = 2 * (d.value_org);
						var value_org2 = parseInt(d.value);

						driverTree.getView().byId("nodePercent").setMax(value_org1);
						driverTree.getView().byId("nodePercent").setMin(0);
						driverTree.getView().byId("nodePercent").setValue(value_org2);
					}
				}
			} catch (e) {}
		},

		// To reset service dialog filds once after creation or close
		resetFields: function () {
			var oIconTab = this.ValueHelpForService.getContent()[1];
			oIconTab.getItems()[0].getContent()[0].getContent()[1].setValue();

			oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValue();
			oIconTab.getItems()[0].getContent()[0].getContent()[3].setSelected(false)
			oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].setValue();

			oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValueState("Error");
			if (this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].getColumns().length > 0) {
				this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].removeAllColumns();
				this.ValueHelpForService.getContent()[1].getItems()[2].getContent()[0].getItems()[1].getModel().setData(null);
			}
			var measureslist = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
			var dimensionList = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1];
			if (measureslist.getItems().length > 0) {
				measureslist.removeAllItems();
			}
			if (dimensionList.getItems().length > 0) {
				dimensionList.removeAllItems();
			}
		},
		// on Select Dialog segmented buttons
		onSelectSegment: function (evt) {
			var that = this;
			var segmentSelectedKey = evt.oSource.getSelectedKey();
			switch (segmentSelectedKey) {
			case "new":
				that.ValueHelpForService.getContent()[2].setVisible(false);
				that.ValueHelpForService.getContent()[1].setVisible(true);
				break;
			case "exists":
				that.ValueHelpForService.getContent()[1].setVisible(false);
				that.ValueHelpForService.getContent()[2].setVisible(true);
			}
		},
		// To change selection of tree layout
		handleTreeStyle: function (evt) {
			if (evt.mParameters.id.indexOf("expand") > -1) this.expandTree = true;
			else this.expandTree = false;
			draw.drawSegmentTree(this);
		},
		handleTreeStyleData: function (evt) {
			if (this.expandTree) {
				evt.oSource.setTooltip("Expand all child nodes at once");
				evt.oSource.setIcon("sap-icon://expand");
			} else {
				evt.oSource.setTooltip("Collapse second level child nodes");
				evt.oSource.setIcon("sap-icon://collapse");
			}
			this.expandTree = !this.expandTree;
			if (this.segmentTree) {
				draw.drawSegmentTree(this);
			} else {
				draw.drawMeasureTree(this);

			}
		},
		// To change selection of tree layout
		handleChangeData: function (evt) {
			// this.getView().setBusy(true);
			var driverTree = this;
			if (evt.oSource.getIcon().indexOf("tree") > -1) {
				this.getView().byId("segments").setVisible(true);
				this.getView().byId("chartArea").setVisible(true);
				// this.getView().byId("temptree").setVisible(false);
				this.getView().byId("reportContainerParent").setVisible(false);
				this.getView().byId("treeStyle").setVisible(true);
				this.getView().byId("customFloatEditBtn2").setVisible(true);
				this.getView().byId("forecasting").setVisible(true);
				this.getView().byId("scenariocommentId").setVisible(true);
				evt.oSource.setIcon("sap-icon://table-view");
				evt.oSource.setTooltip("Table Structure");
				if (driverTree.segmentTree) {
					window.setTimeout(function () {
						driverTree.getView().byId("vdtVisualise").setVisible(true);
						draw.drawSegmentTree(driverTree)
					}, 1000);
				} else {
					window.setTimeout(function () {

						draw.drawMeasureTree(driverTree);
					}, 1000);
				}

			} else {
				this.onDeletePress();
				this.getView().byId("segments").setVisible(false);
				this.getView().byId("chartArea").setVisible(false);
				this.getView().byId("treeStyle").setVisible(false);
				this.getView().byId("comment").setVisible(false);
				this.getView().byId("forecasting").setVisible(false);
				this.getView().byId("vdtVisualise").setVisible(false);
				this.getView().byId("scenariocommentId").setVisible(false);
				this.getView().byId("floaterSettingsVisibility").setVisible(false);
				this.getView().byId("customFloatEditBtn2").setVisible(false);
				// this.getView().byId("temptree").setVisible(true);
				this.getView().byId("reportContainerParent").setVisible(true);
				this.getView().setBusy(false);
				evt.oSource.setIcon("sap-icon://tree");
				evt.oSource.setTooltip("Tree Structure");
				this.loadPivotTable();
			}
		},
		// To change tree visualization horizontal / vertical mode
		handleVisualization: function (evt) {
			var scale = this.zoomListener.scale();
			this.hMode = !this.hMode;
			if (!this.hMode) {
				evt.oSource.setTooltip("Vertical Representation");
				evt.oSource.setIcon("sap-icon://vertical-grip");
			} else {
				evt.oSource.setTooltip("Horizontal Representation");
				evt.oSource.setIcon("sap-icon://horizontal-grip");
			}
			if (this.segmentTree) {
				this.getView().byId("vdtVisualise").setVisible(true);
				draw.drawSegmentTree(this);
			} else {
				draw.drawMeasureTree(this);
			}

		},

		onRefreshView() {
			this.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
			this.getView().byId("treeStyle").setIcon("sap-icon://collapse");
			this.getView().byId("dataStyle").setIcon("sap-icon://table-view")
			this.getView().byId("forecasting").setType("Transparent")
			this.getView().byId("floaterSettingsVisibility").setVisible(false);
			this.getView().byId("chartArea").setVisible(true);
			this.getView().byId("treeStyle").setVisible(true);
			this.getView().byId("reportid").setVisible(true);
			this.getView().byId("forecasting").setVisible(true);
			this.getView().byId("saveVariant").setVisible(true);
			this.getView().byId("scenariocommentId").setVisible(true);
			this.getView().byId("customFloatEditBtn2").setVisible(true);
			this.getView().byId("customFloatEditBtn2").setVisible(true);
			this.getView().byId("vdtVisualise").setVisible(false)
		},

		// To reset all functioanalities and to load initial data
		onTreeReset: function () {
			// this.getView().setBusy(true);
			this.expandTree = true;
			this.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
			this.getView().byId("treeStyle").setIcon("sap-icon://collapse");
			this.getView().byId("dataStyle").setIcon("sap-icon://table-view")
			this.getView().byId("forecasting").setType("Transparent")
			this.getView().byId("floaterSettingsVisibility").setVisible(false);
			this.getView().byId("vdtVisualise").setVisible(false);
			this.getView().byId("chartArea").setVisible(true);
			this.getView().byId("treeStyle").setVisible(true);
			this.getView().byId("reportid").setVisible(true);
			this.getView().byId("forecasting").setVisible(true);
			this.getView().byId("saveVariant").setVisible(true);
			this.getView().byId("scenariocommentId").setVisible(true);
			this.getView().byId("customFloatEditBtn2").setVisible(true);
			this.getView().byId("customFloatEditBtn2").setVisible(true);
			this.segmentTree = false;
			if (this.loadeddata == "Ml") {
				this.loadeddata = "HANA;"
				this.variantObject.MeasureTree = "";
				this.variantObject.SegmentSelection = "";
				this.variantObject.SegmentTree = "";
				this.getView().byId("segments").setText("Segments : All");
				this.loadDataToTreeForScenario(this.scenarioInfo, this.varianceInfo);
			} else {

				var that = this;
				var variantUrl = "/Variants?$filter=VariantId eq " + that.variantObject.VariantId;
				service.callService("variantInfoModel", "variantInfoModel", variantUrl, "scenario", "true", "", function (evt) {
					that.variantObject = sap.ui.getCore().getModel("variantInfoModel").getData().d.results[0];
					that.variantObject.VariantId = sap.ui.getCore().getModel("variantInfoModel").getData().d.results[0].VariantId;
					if (that.variantObject.SegmentSelection.includes("'")) {
						that.getView().byId("segments").setText("Segments : " + that.variantObject.SegmentSelection);
					} else {
						that.getView().byId("segments").setText("Segments : All");
					}
					if (that.variantObject.HiddenNodes) {
						that.hiddenNodes = JSON.parse(that.variantObject.HiddenNodes)
					} else {
						that.hiddenNodes = []
					}
					draw.drawMeasureTree(that);
				});
			}

		},
		//set year and month
		setYearMonth: function () {
			var curDate = new Date();
			var curYear = curDate.getFullYear();
			var curmonth = curDate.getMonth() + 1;
			var yeararr = [];
			if (curmonth > 8) {
				yeararr.push({
					year: (curYear + 1).toString()
				});
				yeararr.push({
					year: (curYear + 2).toString()
				});
				yeararr.push({
					year: (curYear + 3).toString()
				});
			} else {
				yeararr.push({
					year: curYear.toString()
				});
				yeararr.push({
					year: (curYear + 1).toString()
				});
				yeararr.push({
					year: (curYear + 2).toString()
				});
				this.getView().byId("floatSlider").setValue(curmonth);
				if (curmonth >= 0 && curmonth < 3)
					this.getView().byId("floatSlider").setMin(3);
				else if (curmonth >= 4 && curmonth < 6)
					this.getView().byId("floatSlider").setMin(6);
				else if (curmonth >= 7 && curmonth < 9)
					this.getView().byId("floatSlider").setMin(9);
			}
			var yearModel = new sap.ui.model.json.JSONModel(yeararr);
			this.getView().byId("yearId").setModel(yearModel);
		},

		// onForecastPress
		onFuturePress: function (evt) {
			// this.setYearMonth();
			var type = evt.oSource.getType();
			if (type == "Transparent") {
				// this.getAllMeasures();
				evt.oSource.setType("Emphasized");
				this.getView().byId("floaterSettingsVisibility").setVisible(true);
			} else {
				evt.oSource.setType("Transparent");
				this.getView().byId("floaterSettingsVisibility").setVisible(false);
			}
		},

		onScenCommentsPress: function (evt) {
			this.onDeletePress();
			$("svg")[0].style.width = parseInt((window.innerWidth / 100) * 73);
			this.getView().byId("comment").setVisible(true);
			this.getView().byId("vdt").setWidth("75%");
		},

		// route to report
		OnreportViewPress: function (evt) {
			var that = this;
			var selectedscn = sap.ui.getCore().getModel("SelectedScenarioModel").oData.d.results[0];
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("Report");
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("treeData", "Report", {
				node: that.nodeDetails,
				scenario: selectedscn,
				variant: that.variantObject
			});
		},

		commentServices: function (scenarioid) {
			var that = this;
			this.cmtScen = scenarioid;
			// this.getView().setBusy(true);

			var cmtUrl = "/comments?$filter=ScenId eq " + scenarioid;
			service.callService("cmtInfoModel", "cmtInfoModel", cmtUrl, "scenario", "true", "", function (evt) {
				var cmtModel = sap.ui.getCore().getModel("cmtInfoModel");
				var cmtData = cmtModel.oData.d.results;
				var cmtArr = [];
				for (var k = 0; k < cmtData.length; k++) {
					cmtData[k].template = false;
					cmtArr.push(cmtData[k]);
				}
				cmtArr.push({
					"CreatedBy": that.user,
					"rating": 5,
					"CommentDesc": "",
					"CreatedDate": new Date(),
					"template": true
				});
				that.getView().byId("comment").setModel(new sap.ui.model.json.JSONModel({
					d: {
						results: cmtArr
					}
				}));
				that.getView().setBusy(false);
			});
		},
		addReview: function (oEvent) {
			var that = this;
			var cmtValue = oEvent.oSource.oParent.getItems()[0].getText();
			if (cmtValue.length <= 0) {
				sap.m.MessageToast.show("Please enter the comment description");
			} else {
				var cmtId = Math.floor(Math.random() * 100000);
				var oEntry = {
					"CommentId": cmtId,
					"CommentDesc": cmtValue,
					"CreatedDate": new Date(),
					"ScenId": that.variantObject.ScenId,
					"VariantId": that.variantObject.VariantId,
					"VariantName": that.variantObject.VariantName,
					"Filter": "DTREE"
				};
				that.getView().setBusy(true);

				service.callCreateService("comments", JSON.stringify(oEntry), "scenario", "POST", function (evt, sucessFlag, oError) {
					if (sucessFlag) {
						var message = "Comment is posted";
						sap.m.MessageToast.show(message);
						oEntry.template = false;
						oEntry.CreatedBy = that.user;
						oEntry.CreatedDate = new Date();
						oEvent.oSource.oParent.getItems()[0].setText();
						that.getView().byId("comment").getModel().oData.d.results.unshift(oEntry);
						that.getView().byId("comment").getModel().updateBindings(true);
						that.getView().setBusy(false);
						window.setTimeout(function () {
							that.valueHelpForComments.openBy(that.oButton);
						}, 100)

					} else {
						sap.m.MessageToast.show("Failed to add comments, Try again later or Contact system admin");
						that.getView().setBusy(false);
						// that.busyDialog.close();
					}
				});
			}
		},

		onDeletePress: function () {
			var that = this;
			try {
				$("svg")[0].style.width = window.innerWidth;
			} catch (e) {}
			// this.getView().byId("actionButtons").setVisible(true);
			this.getView().byId("vdt").setWidth("100%");
			this.getView().byId("forecasting").setType("Transparent");
			this.getView().byId("floaterSettingsVisibility").setVisible(false);
			this.getView().byId("forecast").setVisible(false);
			this.getView().byId("comment").setVisible(false);
			this.getView().byId("nodeSettings").setVisible(false);
			this.getView().byId("nodeHidden").setState(false);
			this.getView().byId("nodeLocked").setState(false);
			this.getView().byId("nodePercent").setValue(0);
			// this.getView().byId("saveTree").setVisible(false);
			this.getView().byId("hideNode").setVisible(false);
			try {
				if (this.nodeDetails.isHidden) sap.m.MessageBox.warning("Hidden node not saved. Do you want to save hidden node.?", {
					title: "Warning",
					initialFocus: sap.m.MessageBox.Action.NO,
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (sButton) {
						if (sButton === sap.m.MessageBox.Action.YES) {
							that.handleHiddenNode();
						} else {
							that.nodeDetails.isHidden = false;
							var node = $("#id" + that.nodeDetails.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(that.nodeDetails.value_org))[
								0];
							node.style.opacity = 1;
						}
					}
				});
			} catch (e) {}
		},
		// To save the hidden nodes into an array and to draw tree
		handleSaveHiddenNodes: function (evt) {
			var childNodes = this.treeModel.oData[0].children;
			var level = this.nodeDetails.depth;
			if (level == 1) {
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].title == this.nodeDetails.title && childNodes[i].isHidden) {
						childNodes[i].arrayPos = childNodes[i].title + ":" + i;
						this.hiddenNodes.push(childNodes.slice(i, i + 1)[0]);
						childNodes.splice(i, 1);
						i--;
					}
				}
			} else if (level == 2) {
				for (var i = 0; i < childNodes.length; i++) {
					var secondLevelNodes = (childNodes[i].children == undefined ? childNodes[i]._children : childNodes[i].children);
					for (var j = 0; j < secondLevelNodes.length; j++) {
						if (secondLevelNodes[j].title == this.nodeDetails.title && secondLevelNodes[j].isHidden) {
							secondLevelNodes[j].arrayPos = secondLevelNodes[j].title + ":" + j + ":" + childNodes[i].title;
							this.editDataLevel2.push(secondLevelNodes.slice(j, j + 1)[0]);
							secondLevelNodes.splice(j, 1);
							j--;
							break;
						}
					}
				}
			}
			draw.drawMeasureTree(this);
			this.nodeDetails.isHidden = false;
			this.getView().byId("saveTree").setVisible(false);
		},
		// To set back the hidden nodes to the same position
		handleDeleteHiddenNode: function (evt) {
			var title = evt.getParameters().listItem.getBindingContext().getObject().title;
			/* for (var i = (this.hiddenNodes.length - 1); i >= 0; i--) { */
			for (var i = 0; i < this.hiddenNodes.length; i++) {
				if (title === this.hiddenNodes[i].arrayPos.split(":")[0]) {
					var index = this.hiddenNodes[i].arrayPos.split(":")[1];
					delete this.hiddenNodes[i].arrayPos;
					this.hiddenNodes[i].isHidden = false;
					if (this.nodeDetails.children === undefined) {
						this.nodeDetails.children = [];
						this.nodeDetails.children.push(this.hiddenNodes[i]);
					} else {
						this.nodeDetails.children.splice(index, 0, this.hiddenNodes[i]);
					}
					var delArray = this.hiddenNodes[i].title.indexOf(title);
					if (delArray > -1) {
						this.hiddenNodes.splice(i, 1);
					}
				}
			}
			this.variantObject.MeasureTree = JSON.stringify(this.treeData, function (key, value) {
				if (key !== "parent") {
					return value;
				}
			});
			if (this.hiddenNodes.length === 0) {
				this.hiddenNodes = [];
			}
			this.getView().byId("hiddenList").getModel().oData.splice(evt.getParameters().listItem.getBindingContext().sPath.split("/")[1],
				1);
			this.getView().byId("hiddenList").getModel().updateBindings(true);
			this.handleVariantUpdate(this.selectedVariant, true, true);
			evt.oSource.oParent.setVisible(false);
		},

		// Hide the selected node in the tree
		handleHiddenNode: function (evt) {
			this.nodeDetails.isHidden = evt.getParameters("state").state;
			var node = $("#id" + this.nodeDetails.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(this.nodeDetails.value_org))[0];
			if (this.nodeDetails.isHidden) {
				node.style.opacity = 0.4;
				// this.getView().byId("saveTree").setVisible(true);
				this.getView().byId("nodeHidden").removeStyleClass("switchTextOff");
				this.getView().byId("nodeHidden").addStyleClass("switchTextOn");
				var children = this.nodeDetails.parent.children;
				for (var i = 0; i < children.length; i++) {
					if (this.nodeDetails.title == children[i].title && children[i].isHidden) {
						children[i].arrayPos = this.nodeDetails.title + ":" + i + ":" + this.nodeDetails.parent.title;
						this.hiddenNodes.push(children.slice(i, i + 1)[0]);
						var childrenData = this.treeData.children === null ? this.treeData.children : this.treeData.children;
						children.splice(i, 1);
						// this.updatingChildren(childrenData, children);
					}
				}
			} else {
				node.style.opacity = 1;
				// this.getView().byId("saveTree").setVisible(false);
				this.getView().byId("nodeHidden").removeStyleClass("switchTextOn");
				this.getView().byId("nodeHidden").addStyleClass("switchTextOff");
			}
		},
		// lock the selected node in the tree as do not change the value
		handleLockNode: function (evt) {
			this.nodeDetails.isLocked = evt.getParameters("state").state;
			if (this.nodeDetails.isLocked) {
				this.getView().byId("nodePercent").setEnabled(false);
				this.getView().byId("nodeLocked").removeStyleClass("switchTextOff");
				this.getView().byId("nodeLocked").addStyleClass("switchTextOn");
			} else {
				this.getView().byId("nodePercent").setEnabled(true);
				this.getView().byId("nodeLocked").removeStyleClass("switchTextOn");
				this.getView().byId("nodeLocked").addStyleClass("switchTextOff");
			}
		},
		// updating thresholds for the selected node
		handlethresholdInput: function () {
			this.nodeDetails.critical = this.getView().byId("Critical").getValue();
			this.nodeDetails.warning = this.getView().byId("Warning").getValue();
			this.nodeDetails.target = this.getView().byId("Target").getValue();
			var nodeSlicer = d3.select("#id" + this.nodeDetails.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(this.nodeDetails.value_org))
				.select(".slice")[0][0];
			var color = Formatter.thresholdLevel(this.nodeDetails, nodeSlicer.getAttribute("fill"));
			nodeSlicer.style.fill = color;
			$("#" + this.getView().byId("legend1").sId + "-img").css("color", color);
			this.getView().byId("legend1").addStyleClass(Formatter.getSapValueStateColor(color, this)[1]);
		},

		handleImpactChange: function (evt) {
			this.impactSelected = true;
			var value = evt.getParameters("value").value;
			var impactMeasure = evt.oSource.oParent.getLabel().getText();
			var children = this.nodeDetails.children;
			for (var i = 0; i < children.length; i++) {
				if (children[i].name === impactMeasure) var nodeDetails = children[i];
			}
			this.value = nodeDetails.value_org;
			this.sliderChangeFunction(nodeDetails, value, false);
			var children = nodeDetails.parent.children;
			for (var i = 0; i < children.length; i++) {
				// evt.oSource.oParent.getFields()[0].setText(children[i].value);
				evt.oSource.oParent.oParent.getFormElements()[i].getFields()[0].setText(children[i].value);
				evt.oSource.oParent.oParent.getFormElements()[i].getFields()[1].setValue(children[i].value);

			}
			var currentChange = parseFloat(nodeDetails.parent.value) - parseFloat(nodeDetails.parent.value_org);
			this.getView().byId("nodePie").getData()[0].setValue(parseInt(nodeDetails.value_org));
			if (this.getView().byId("nodePie").getData()[0].getValue() > 0) {
				this.getView().byId("nodePie").getData()[0].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[0].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[1].setValue(parseInt(nodeDetails.value));
			if (this.getView().byId("nodePie").getData()[1].getValue() > 0) {
				this.getView().byId("nodePie").getData()[1].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[1].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[2].setValue(parseInt(nodeDetails.value - nodeDetails.value_org));
			if (this.getView().byId("nodePie").getData()[2].getValue() > 0) {
				this.getView().byId("nodePie").getData()[2].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[2].setColor("Error");
			}
			this.getView().byId("nodeCurrentValue").setText("Current Value : " + Formatter.amountToMillions(nodeDetails.parent
				.value));
			this.getView().byId("nodeDiffValue").setText("Difference : " + Formatter.amountToMillions(currentChange));
			var color = currentChange > 0 ? "Success" : (currentChange < 0 ? "Error" : "None");
			this.getView().byId("nodeDiffValue").setState(color);

		},

		saveNodevalues: function () {
			var measurearray = [];
			var measuredata = this.treeData
			var obj = {
				name: this.treeData["name"],
				originalValue: this.treeData["value"]
			};
			measurearray.push(obj);
			measuredata.children.forEach(function (d) {
				parseObject(d);
			});

			function parseObject(obj) {
				if (obj.hasOwnProperty("name")) {
					var newobj = {
						name: obj["name"],
						originalValue: obj["value"]
					};
					measurearray.push(newobj);

				}
				if (obj.hasOwnProperty("children")) {
					for (var child = 0; child < (obj["children"].length); child++) {
						parseObject(obj["children"][child]);
					}
				} else {
					return;
				}
			}

			var col, val;
			for (var i = 0; i < measurearray.length; i++) {
				if (i == 0) {
					col = measurearray[i].name;
					val = measurearray[i].originalValue;
				} else {
					col += "," + measurearray[i].name;
					val += "," + measurearray[i].originalValue;
				}
			}
			// var url = "Disaggregation.xsjs?variantID=" + this.variantObject.VariantId + "&select=" + this.SelectedUrl.split("&select=")[1].split(
			// "&variantID")[0] + "&column1=" + col + "&value=" + val;

			// service.callService("updatedataModel", "updatedataModel", url, "scenario", true, "", function (evt, flag) {});
		},

		handleNodePercent: function (evt) {
			this.impactSelected = false;
			var value = evt.getParameters("value");
			var name = this.nodeDetails.name;
			this.sliderChangeFunction(this.nodeDetails, value.value, false);
			var currentChange = parseFloat(this.nodeDetails.value) - parseFloat(this.nodeDetails.value_org);
			this.getView().byId("nodePie").getData()[0].setValue(parseInt(this.nodeDetails.value_org));
			if (this.getView().byId("nodePie").getData()[0].getValue() > 0) {
				this.getView().byId("nodePie").getData()[0].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[0].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[1].setValue(parseInt(this.nodeDetails.value));
			if (this.getView().byId("nodePie").getData()[1].getValue() > 0) {
				this.getView().byId("nodePie").getData()[1].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[1].setColor("Error");
			}
			this.getView().byId("nodePie").getData()[2].setValue(parseInt(this.nodeDetails.value - this.nodeDetails.value_org));
			if (this.getView().byId("nodePie").getData()[2].getValue() > 0) {
				this.getView().byId("nodePie").getData()[2].setColor("Good");
			} else {
				this.getView().byId("nodePie").getData()[2].setColor("Error");
			}

			this.getView().byId("nodeCurrentValue").setText("Current Value : " + Formatter.amountToMillions(this.nodeDetails.value));
			this.getView().byId("nodeDiffValue").setText("Difference : " + Formatter.amountToMillions(currentChange));
			var color = currentChange > 0 ? "Success" : (currentChange < 0 ? "Error" : "None");
			this.getView().byId("nodeDiffValue").setState(color);

		},
		sliderChangeFunction: function (d, sliderValue, flag) {
			var driverTree = this;
			var sliderMove = sliderValue;
			var nodetitle = d.dtitle;
			d.value = sliderMove;
			var arr = [];
			arr.push(d.dtitle)
			if (d.parent != undefined) {
				if (flag == true)
					d.parent.value = parseInt(d.parent.value_org - (d.co_val) * (d.value_org)); // If Co-Efficient is Changed
				else
					d.parent.value = parseInt(d.parent.value_org - (d.co_val) * (d.value_org - d.value)); // If Value is Changed
				driverTree.nodeEffectedChange(d.parent);
			}
			if (d.hasOwnProperty("parent")) {
				parseObj(d);
			}
			if (d.parent == undefined) {
				d.value = sliderValue;

				if (d.hasOwnProperty("children")) {
					childupdateCal(d)
				} else {
					return;
				}
			}

			function parseObj(obj) {
				if (obj.isLocked == false) {
					if (!arr.includes(obj.dtitle)) {
						if (obj.parent != undefined) {
							if (flag == true)
								obj.parent.value = parseInt(obj.parent.value_org - (obj.co_val) * (obj.value_org));
							else
								obj.parent.value = parseInt(obj.parent.value_org - (obj.co_val) * (obj.value_org - obj.value));
							driverTree.nodeEffectedChange(obj.parent);
							arr.push(obj.dtitle);
						}
					}
					if (obj.hasOwnProperty("parent")) {
						parseObj(obj.parent);
					} else {
						childupdateCal(obj);
					}
				}
			}

			function childupdateCal(d) {
				if (d.children.length > 0) {
					for (var i = 0; i < d.children.length; i++) {
						if (d.children[i].isLocked == false) {
							if (!arr.includes(d.children[i].dtitle)) {
								if (flag == true)
									d.children[i].value = parseInt((d.value + (d.children[i].co_val * d.children[i].value_org) - d.value_org) / (d.children[i]
										.co_val));
								else
									d.children[i].value = parseInt((d.value + (d.children[i].co_val * d.children[i].value_org) - d.value_org) / (d.children[i]
										.co_val));
								driverTree.nodeEffectedChange(d.children[i]);
								arr.push(d.children[i]);
							}
							if (d.children[i].hasOwnProperty("children")) {
								childupdateCal(d.children[i]);
							}
						}

					}
				} else {
					return;
				}
			}
			driverTree.value = sliderMove;
			if (this.impactSelected) d.percent = sliderMove;
			this.nodeEffectedChange(d);
			driverTree.dragged = true, driverTree.variantChange = true;
		},

		nodeEffectedChange: function (sNode) {
			var pie = d3.layout.pie()
				.value(function (d) {
					return d;
				})
				.sort(null);
			// arc object
			var arc = d3.svg.arc()
				.outerRadius(40)
				.innerRadius(20);
			var titleId = sNode.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(sNode.value_org);
			//	var parentValue = sNode.parent == undefined ? 0 : sNode.parent.value;
			var currentChange = parseFloat(sNode.value) - parseFloat(sNode.value_org);
			sNode.difference = currentChange;
			if (sNode.id != "NODE1") {

				sNode.difference = parseFloat(sNode.value) - sNode.value_org;
				var paths = d3.select("#id" + titleId).selectAll("path");
				paths.data(pie([parseFloat(sNode.value_org), sNode.value, sNode.difference]));
				paths.transition()
					.duration(1)
					.attr('d', arc)
					.attr('fill', function (d, i) {
						if (i == 1) {
							if (d.data <= 0) {
								var tempColor = ['#427cac', '#a1bed6', 'red'];
								return tempColor[i];
							} else {
								var tempColor = ['#427cac', '#a1bed6', 'green'];
								return tempColor[i];

							}
						} else {
							if (d.data <= 0) {
								var tempColor = ['#427cac', '#a1bed6', 'red'];

								return tempColor[i];
							} else {
								var tempColor = ['#427cac', '#a1bed6', 'green'];
								return tempColor[i];
							}
						}
					});
			} else {
				sNode.difference = parseFloat(sNode.value) - sNode.value_org;
				var paths = d3.select("#id" + titleId).selectAll("path");
				paths.data(pie([parseFloat(sNode.value_org), sNode.value, sNode.difference]));
				paths.transition()
					.duration(1)
					.attr('d', arc)
					.attr('fill', function (d, i) {
						if (i == 1) {
							if (d.data <= 0) {
								var tempColor = ['#427cac', '#a1bed6', 'red'];
								return tempColor[i];
							} else {
								var tempColor = ['#427cac', '#a1bed6', 'green'];
								return tempColor[i];

							}
						} else {
							if (d.data <= 0) {
								var tempColor = ['#427cac', '#a1bed6', 'red'];

								return tempColor[i];
							} else {
								var tempColor = ['#427cac', '#a1bed6', 'green'];
								return tempColor[i];
							}
						}

					});

			}
			$("#ct" + titleId).text(Formatter.amountToMillions(sNode.value));
			$("#cv" + titleId).text("Current Value : " + Formatter.amountToMillions(sNode.value));
			$("#dv" + titleId).text("Difference " + Formatter.amountToMillions(sNode.difference));
			$("#dv" + titleId).css("fill", currentChange > 0 ? "green" : (currentChange < 0 ? "red" : "black"));
			$("#rt" + titleId).css("stroke", currentChange > 0 ? "green" : (currentChange < 0 ? "red" : "black"));
		},

		onSettingsPress: function () {
			var that = this;
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("nodeSettings");
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("treeData", "settings", {
				node: that.nodeDetails,
				scenario: that.scenarioInfo,
				varianceInfo: that.varianceInfo,
				variant: that.variantObject
			});
		},
		handleSwithSettings: function (evt) {
			var state = evt.getParameters("state").state;
			if (state) this.getView().byId("floatSliderVisibility").removeStyleClass("floatSliderVisibility");
			else this.getView().byId("floatSliderVisibility").addStyleClass("floatSliderVisibility");
		},

		// Bottom forecast sldier functionality
		handleFloatSliderChange: function () {
			var that = this;
			var numOfMonths = that.getView().byId("floatSlider").getValue();
			that.getView().setBusy(true);
			var timeDimension = this.varianceInfo.timeDimension;
			var selMeasures = that.scenarioInfo.measures.toString();
			// for (var z = 0; z < that.getView().byId("yearId").getItems().length; z++) {
			// 	if (that.getView().byId("yearId").getSelectedItem() == that.getView().byId("yearId").getItems()[z].sId) {
			// 		that.selectedyear = that.getView().byId("yearId").getItems()[z].getText();
			// 		break;
			// 	}
			// }

			if (timeDimension.length > 0) {
				var predicturl = "Forecast?view=" + that.scenarioInfo.serviceURL + "&Date=" + timeDimension + "&target=" + that.scenarioInfo.Entity +
					"&selectM=" + selMeasures + "&Month=" + numOfMonths;

				service.callService("measurepredicttreeModel", "measurepredicttreeModel", predicturl, "IMS", true, "", function (
					evt, flag) {
					if (evt.oSource.oData == "Forecasting of data is not possible.") {
						that.getView().setBusy(false);
						sap.m.MessageToast.show("Forecasting of data is not possible.");
					} else if (evt.oSource.oData.root != undefined) {
						var predictedmeasuredata = sap.ui.getCore().getModel("measurepredicttreeModel");
						var existingdata = that.treeData;
						var newdata = that.constructMeasureTreeJson(predictedmeasuredata.getData().root, that.selectedyear, that.x);
						that.getView().setBusy(false);
						var predictValue = that.Quartervalue;
						var treeData = newdata.oData;

						treeData.value = newdata.oData.value;
						treeData.value_org = existingdata.value_org;
						var parentId = treeData.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(treeData.value_org);
						var currentChange = parseFloat(newdata.oData.value) - parseFloat(existingdata.value_org);
						treeData.difference = currentChange;
						$("#ct" + parentId).text(Formatter.amountToMillions(treeData.value));
						$("#cv" + parentId).text("Current Value : " + Formatter.amountToMillions(treeData.value));
						$("#dv" + parentId).text("Difference " + Formatter.amountToMillions(currentChange));
						$("#dv" + parentId).css("fill", currentChange > 0 ? "green" : (currentChange < 0 ? "red" : "black"));
						$("#rt" + parentId).css("stroke", currentChange > 0 ? "green" : (currentChange < 0 ? "red" : "black"));
						childNodeChange(treeData.children)

						function childNodeChange(children) {
							var childNodes = children;
							for (var i = 0; i < childNodes.length; i++) {
								var nodeId = childNodes[i].title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(childNodes[i].value_org);

								for (var j = 0; j < existingdata.children.length; j++) {
									if (existingdata.children[j].title == childNodes[i].title) {
										childNodes[i].value = newdata.oData.children[i].value;
										childNodes[i].value_org = existingdata.children[i].value_org;
										var valueChange = parseFloat(newdata.oData.children[i].value) - parseFloat(existingdata.children[j].value_org);
										childNodes[i].difference = valueChange;
										break;
									}
								}
								$("#ct" + nodeId).text(Formatter.amountToMillions(childNodes[i].value));
								$("#cv" + nodeId).text("Current Value : " + Formatter.amountToMillions(childNodes[i].value));
								$("#dv" + nodeId).text("Difference " + Formatter.amountToMillions(valueChange));
								$("#dv" + nodeId).css("fill", valueChange > 0 ? "green" : (valueChange < 0 ? "red" : "black"));
								$("#rt" + nodeId).css("stroke", valueChange > 0 ? "green" : (valueChange < 0 ? "red" : "black"));
								children = childNodes[i]._children == null ? childNodes[i].children : childNodes[i]._children;
								if (children) childNodeChange(children);
							}
						}
						that.treeData = treeData;
						that.variantObject.MeasureTree = JSON.stringify(treeData);
						draw.drawMeasureTree(that);

					} else {
						that.getView().setBusy(false);

					}
				});
			} else {
				that.getView().setBusy(false);
				sap.m.MessageToast.show("Forecasting of data is not possible.");
			}

		},
		onSaveNewNode: function () {
			var that = this;
			that.nodeName = that.valueHelpForAddnodes.getContent()[0].getContent()[1].getItems()[0].getValue();
			var expression = that.valueHelpForAddnodes.getContent()[1].getExpression();
			if (that.nodeName.length < 0) {
				sap.m.MessageToast.show("Please Enter node name");
			} else if (this.valueHelpForAddnodes.getContent()[1].getExpression().length == 1) {
				sap.m.MessageToast.show("Please Enter Expression");
			} else {
				var data = {
					"variantID": JSON.stringify(that.variantObject.VariantId),
					"Parent_node": that.nodeDetails.name,
					"node_name": that.nodeName,
					"Cal_type": "On_Detail",
					"formula": expression
				}

				service.callCreateService("Adding_node.xsjs", JSON.stringify(data), "Mlsystem", "POST", function (evt, sucessFlag, oError) {
					console.log("posted");
					that.onCancel();
					that.dailog.open();
					var Measureurl = "MeasureTree.xsjs?view=" + that.SelectedUrl;
					service.callService("treedataModel", "treedataModel", Measureurl, "scenario", true, "", function (evt, flag) {
						// that.getView().byId("temptree").setVisible(false);
						// that.gridtable();
						var newdata = that.constructMeasureTreeJson(sap.ui.getCore().getModel("treedataModel").oData, null, null);
						that.variantObject.MeasureTree = JSON.stringify(newdata.oData, function (key, value) {
							if (key != "parent")
								return value;
						});
						draw.drawMeasureTree(that);
						that.segmentTree = false;
						that.dailog.close();
					});
				});
			}

		},
		/* added by shwetha */
		addNode: function (d) {
			var that = this;
			try {
				that.nodeDetails = d;

				var measures = [];
				// var measureUrl = "ListofMeasures.xsjs?variantID=" + this.variantObject.VariantId;
				// service.callService("MeasureModel", "MeasureModel", measureUrl, "scenario", true, "", function (evt, flag) {
				// var measure = sap.ui.getCore().getModel("MeasureModel");
				var viewList = that.ValueHelpForDataRecords.getModel().getData();
				viewList.forEach(function (item) {
					if (item.FileName == that.scenarioInfo.serviceURL) {
						measures = item.MEASURES
					}
				});
				var measure = new sap.ui.model.json.JSONModel(measures);
				var arr = [];
				for (var x = 0; x < measure.oData.length; x++) {
					var data = {
						"key": measure.oData[x],
						"label": measure.oData[x],
						"items": [{
							"key": measure.oData[x]
						}, {
							"key": "+"
						}, {
							"key": measure.oData[x]
						}]
					}
					arr.push(data);
				}
				var measureModel = new sap.ui.model.json.JSONModel(arr);
				that.valueHelpForAddnodes.getContent()[1].setModel(measureModel);
				that.valueHelpForAddnodes.open();
				// });
			} catch (e) {
				that.addNode(d);
			}
		},

		/* For Node Comments */
		addComment: function (d) {
			this.getView().byId("nodeSettings").setVisible(false);
			var that = this;
			this.nodeDetails = d;
			var cmtArr = [];
			if (this.nodeDetails.nodecomments.length > 0) {

				var compObj = {
					"d": {
						"results": this.nodeDetails.nodecomments

					}
				};
				var comtsNewModel = new sap.ui.model.json.JSONModel(compObj);
				that.valueHelpForAddComments.setModel(comtsNewModel);
			} else {
				var firstObj = {
					"CreatedBy": that.user,
					"CommentDescription": "",
					"CreatedDate": new Date(),
					"template": true
				};
				cmtArr.unshift(firstObj);
				var compObj = {
					"d": {
						"results": cmtArr
					}
				};

				var comtsNewModel = new sap.ui.model.json.JSONModel(compObj);
				that.valueHelpForAddComments.setModel(comtsNewModel);
			}
			this.valueHelpForAddComments.open();
		},
		NodeComments: function (d) {
			var that = this;
			var nodeId = this.nodeDetails.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(this.nodeDetails.value_org);
			var cmtvalue = d.oSource.oParent.getItems()[1].getValue();
			var firstObj = {
				"CreatedBy": that.user,
				"CommentDescription": "",
				"CreatedDate": new Date(),
				"template": true
			};
			try {
				var nodeCommnetsData = that.valueHelpForAddComments.getModel().oData.d.results;
				for (var i = 0; i < nodeCommnetsData.length; i++) {
					nodeCommnetsData[i].template = false;
				}
				that.valueHelpForAddComments.getModel().oData.d.results.unshift(firstObj);
				that.valueHelpForAddComments.getModel().updateBindings(true);
			} catch (e) {}
			if (that.valueHelpForAddComments.getModel().oData.d.results.length > 1)
				this.nodeDetails.nodecomments = that.valueHelpForAddComments.getModel().oData.d.results;
			$("#Mc" + nodeId).text(nodeCommnetsData.length - 1);
		},
		exitfragment: function () {
			$("svg")[0].style.width = window.innerWidth;
			this.getView().byId("vdt").setWidth("100%");
			this.valueHelpForAddComments.close();
		},
		selectNodeChange: function (evt) {
			var key = evt.oSource.getSelectedKey();
			if (key == "Data") {
				this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[0].setVisible(true);
				this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[1].setVisible(false);
				this.valueHelpForAddnodes.getContent()[0].getContent()[4].setVisible(false);
				this.valueHelpForAddnodes.getContent()[0].getContent()[5].setVisible(false);
			} else {
				this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[0].setVisible(false);
				this.valueHelpForAddnodes.getContent()[0].getContent()[3].getItems()[1].setVisible(true);
				this.valueHelpForAddnodes.getContent()[0].getContent()[4].setVisible(true);
				this.valueHelpForAddnodes.getContent()[0].getContent()[5].setVisible(true);
			}
		},
		onCancel: function () {
			this.valueHelpForAddnodes.getContent()[1].setExpression(" ");
			this.valueHelpForAddnodes.getContent()[0].getContent()[1].getItems()[0].setValue();
			this.valueHelpForAddnodes.close();
		},

		// on Segments Selection Message toast ok button
		onSelectedSegments: function (evt) {
			var that = this;
			var text = " ",
				filterurl;
			if (this.segmentItems.length > 0) {
				for (var i = 0; i < this.segmentItems.length; i++) {
					if (i == (this.segmentItems.length - 1))
						text += this.segmentItems[i].title + " '" + this.segmentItems[i].items.join() + "' ";
					else
						text += this.segmentItems[i].title + " '" + this.segmentItems[i].items.join() + "', ";
				}
				var filterParamUrl = "";
				for (var a = 0; a < this.segmentItems.length; a++) {
					if (a != 0) {
						filterParamUrl += " and ";
					}
					/*	for(var b=0; b< this.segmentItems[a].items.length; b++){
							if(b==0)
								filterParamUrl += this.segmentItems[a].title + " eq " + this.segmentItems[a].items[b];
							else
								filterParamUrl += " and " + this.segmentItems[a].title + " eq " + this.segmentItems[a].items[b];
						}*/
					if (this.segmentItems[a].title == "Measure") {
						for (var b = 0; b < this.segmentItems[a].items.length; b++) {
							if (b == 0)
								filterParamUrl += this.segmentItems[a].items[b] + " eq " + this.segmentItems[a].items[b];
							else
								filterParamUrl += " and " + this.segmentItems[a].items[b] + " eq " + this.segmentItems[a].items[b];
						}
					} else {
						for (var b = 0; b < this.segmentItems[a].items.length; b++) {
							if (b == 0)
								filterParamUrl += this.segmentItems[a].title + " eq " + this.segmentItems[a].items[b];
							else
								filterParamUrl += " and " + this.segmentItems[a].title + " eq " + this.segmentItems[a].items[b];
						}
					}

				}
				filterurl = "MeasureTree.xsjs?view=" + that.SelectedUrl + "&filter=" + filterParamUrl;
				console.log(filterParamUrl);

				/*	var arr = [];
					for (var i = 0; i < this.segmentItems.length; i++) {
					if (!arr.includes(this.segmentItems[i].title)) {
					arr.push(this.segmentItems[i].title);
					}
					}
					var filterParamUrl = "";
					for (var i = 0; i < arr.length; i++) {
					if (i != 0)
					filterParamUrl += " and " + arr[i] + " eq ";
					else {
					filterParamUrl += arr[i] + " eq ";
					}
					var x = true;
					for (var j = 0; j < this.segmentItems.length; j++) {
					if (arr[i] == this.segmentItems[j].title) {
					if (x == true) {
					x = false;
					for (var k = 0; k < this.segmentItems[j].items.length; k++) {
					if (k == 0 && k == (this.segmentItems[j].items.length - 1)) {
					filterParamUrl += this.segmentItems[j].items[k];
					} else {
					filterParamUrl += "," + this.segmentItems[j].items[k];
					}

					}
					} else {
					for (var l = 0; l < this.segmentItems[j].items.length; l++) {
					filterParamUrl += "," + this.segmentItems[j].items[l];
					}
					}
					}
					}
					}*/
				//filterurl = "MeasureTree.xsjs?view=" +	that.SelectedUrl + "&filter=" + filterParamUrl;
			} else {
				var text = " All ";
				filterurl = "MeasureTree.xsjs?view=" + that.SelectedUrl;
			}
			this.variantObject.SegmentTree = that.segmentTreeData;
			this.segmentTree = false;

			service.callService("selectedtreeModel", "selectedtreeModel", filterurl, "scenario", true,
				"",
				function (evt, flag) {
					var selectedsegmentdata = sap.ui.getCore().getModel("selectedtreeModel");
					that.getView().byId("segments").setText("Segments : " + text);
					that.variantChange = true;
					that.variantObject.SegmentSelection = text;
					that.getView().byId("vdtVisualise").setVisible(false);
					var newdata = that.constructMeasureTreeJson(selectedsegmentdata.oData, null, null);
					that.variantObject.MeasureTree = JSON.stringify(newdata.oData);
					draw.drawMeasureTree(that);
				});
		},
		// on Segments Selection Message toast cancel button
		onSelectedSegmentsCancel: function () {
			this.getView().byId("vdtVisualise").setVisible(false);
			this.segmentTree = false;
			draw.drawMeasureTree(this);
		},
		// create new variant
		onAddNewVariant: function () {
			var that = this;
			if (this.getView().byId("variantItems").getModel().oData.length >= 3) {
				sap.m.MessageToast.show("Please delete any existing variants to add new variant")
			} else {
				if (this.variantChange) {
					sap.m.MessageBox.warning("Changes made are not saved to selected variant? Do you wish to save the variant", {
						title: "Warning",
						initialFocus: sap.m.MessageBox.Action.NO,
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (sButton) {
							if (sButton === sap.m.MessageBox.Action.YES) {
								that.handleVariantUpdate(that.selectedVariant, true, true);
								if (sap.ui.getCore().getModel("SelectedScenarioModel").oData.d.results[0].RoleFlag.length > 0)
									that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
										true);
								else
									that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
										false);
								that.valueHelpForVariant.open();
							} else {

								that.resetVariantdata(that.variantObject.VariantId);
								if (sap.ui.getCore().getModel("SelectedScenarioModel").oData.d.results[0].RoleFlag.length > 0)
									that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
										true);
								else
									that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
										false);
								that.valueHelpForVariant.open();
							}

						}
					});
				} else {
					if (sap.ui.getCore().getModel("SelectedScenarioModel").oData.d.results[0].RoleFlag.length > 0)
						that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
							true);
					else
						that.valueHelpForVariant.getContent()[1].mAggregations.form.getFormContainers()[0].getFormElements()[1].getFields()[0].setVisible(
							false);
					this.valueHelpForVariant.open();
					this.existingVariants();
				}
			}
		},
		// get Shared variants
		existingVariants: function () {
			var that = this;

			var getsharedvariantsUrl = "VariantShare.xsjs?ScenId=" + that.variantObject.ScenId;
			service.callService("existingVariants", "existingVariants", getsharedvariantsUrl, "scenario", true,
				"",
				function (evt, flag) {
					if (evt.oSource.oData != "No Shared Variants for the Selected Scenario") {
						var existingvariantsdata = sap.ui.getCore().getModel("existingVariants");
						that.valueHelpForVariant.getContent()[2].setModel(existingvariantsdata);
					}
				});

		},
		onDeleteVariant: function (evt) {
			var that = this;
			// that.variantId = that.variantObject.VariantId;
			sap.m.MessageBox.confirm(
				"Are you sure you want to delete the ' " + that.variantObject.VariantName + " ' ?", {
					onClose: function (oAction) {
						if (oAction === "OK") {

							that.getView().setBusy(true);
							var url = "Variants(" + that.variantObject.VariantId + ")";
							service.callDeleteService(url, "scenario", function () {
								if (that.getView().byId("variantItems").getModel().oData.length == 1) {
									that.getView().byId("variantDelId").setVisible(false);
								} else {
									that.getView().byId("variantDelId").setVisible(true);
								}
								that.selectedScenarioModel(that.variantObject.ScenId);
							});
						}
					}
				});
		},
		onSegmentButtonPress: function (evt) {
			var that = this;
			this.segmentTree = false;
			if (this.getView().byId("dataStyle").getIcon() == "sap-icon://table-view") {
				this.getView().byId("chartArea").setVisible(true);
				// this.getView().byId("temptree").setVisible(false);
				this.getView().byId("reportContainerParent").setVisible(false);
				this.getView().byId("treeStyle").setVisible(true);
				this.getView().byId("customFloatEditBtn2").setVisible(true);
				this.getView().byId("forecasting").setVisible(true);
				this.getView().byId("scenariocommentId").setVisible(true);
				// evt.oSource.setIcon("sap-icon://table-view");
			}
			this.getView().byId("vdtVisualise").setVisible(false);
			var segment = evt.oSource;
			/* if (this.selectedVariant == evt.oSource.getText()) return; */
			if (this.variantChange)
				sap.m.MessageBox.warning("Changes made are not saved to selected variant? Do you wish to save the variant", {
					title: "Warning",
					initialFocus: sap.m.MessageBox.Action.YES,
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (sButton) {
						if (sButton === sap.m.MessageBox.Action.YES) {
							that.handleVariantUpdate(that.selectedVariant, false, true);
							that.resetdata();
						} else {
							window.setTimeout(function () {
								that.resetVariantdata(that.variantObject.VariantId);
							}, 10000);
						}
						$("svg")[0].style.width = window.innerWidth;
						that.getView().byId("vdt").setWidth("100%");
						that.selectedVariant = segment.getText();
						that.variantObject = segment.getBindingContext().getObject();
						if (that.variantObject.SegmentSelection.includes("'")) {
							that.getView().byId("segments").setText("Segments : " + that.variantObject.SegmentSelection);
						} else {
							that.getView().byId("segments").setText("Segments : All");
						}
						if (that.variantObject.HiddenNodes) {
							that.hiddenNodes = JSON.parse(that.variantObject.HiddenNodes)
						} else {
							that.hiddenNodes = []
						}
						that.expandTree = true, that.editDataLevel2 = [], that.dragged = false;
						that.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
						that.getView().byId("treeStyle").setIcon("sap-icon://collapse");
						that.variantChange = false;
						if (that.segmentTree) {
							that.segmentsSelected = [], that.segmentItems = [];
							draw.drawSegmentTree(that);
							that.getView().byId("vdtVisualise").setVisible(true);
						} else {
							that.loadDataToTreeForScenario(that.scenarioInfo, that.varianceInfo);
						}

					}
				});
			else {
				$("svg")[0].style.width = window.innerWidth;
				this.getView().byId("vdt").setWidth("100%");
				this.selectedVariant = evt.oSource.getText();
				this.variantObject = evt.oSource.getBindingContext().getObject();
				that.variantObject.VariantId = evt.oSource.getBindingContext().getObject().VariantId;
				// this.commentServices(evt.oSource.getBindingContext().getObject().ScenId);
				if (this.variantObject.SegmentSelection.includes("'")) {
					that.getView().byId("segments").setText("Segments : " + that.variantObject.SegmentSelection);
				} else {
					that.getView().byId("segments").setText("Segments : All");
				}
				if (that.variantObject.HiddenNodes) {
					that.hiddenNodes = JSON.parse(that.variantObject.HiddenNodes)
				} else {
					that.hiddenNodes = []
				}
				this.expandTree = true, this.editDataLevel2 = [], this.dragged = false;
				this.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
				this.getView().byId("treeStyle").setIcon("sap-icon://collapse");
				if (this.segmentTree) {
					this.segmentsSelected = [], this.segmentItems = [];
					draw.drawSegmentTree(this);
					this.getView().byId("vdtVisualise").setVisible(true);
				} else {
					that.loadDataToTreeForScenario(that.scenarioInfo, that.varianceInfo);

				}
				this.variantChange = false;
			}
		},
		resetdata: function () {
			var that = this;
			$("svg")[0].style.width = window.innerWidth;
			that.getView().byId("vdt").setWidth("100%");
			that.selectedVariant = segment.getText();
			that.variantObject = segment.getBindingContext().getObject();
			if (that.variantObject.SegmentSelection.includes("'")) {
				that.getView().byId("segments").setText("Segments : " + that.variantObject.SegmentSelection);
			} else {
				that.getView().byId("segments").setText("Segments : All");
			}
			if (that.variantObject.HiddenNodes) {
				that.hiddenNodes = JSON.parse(that.variantObject.HiddenNodes)
			} else {
				that.hiddenNodes = []
			}
			that.expandTree = true, that.editDataLevel2 = [], that.dragged = false;
			that.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
			that.getView().byId("treeStyle").setIcon("sap-icon://collapse");
			that.variantChange = false;
			if (that.segmentTree) {
				that.segmentsSelected = [], that.segmentItems = [];
				draw.drawSegmentTree(that);
				that.getView().byId("vdtVisualise").setVisible(true);
			} else {
				that.loadDataToTreeForScenario(that.scenarioInfo, that.varianceInfo);
			}
		},
		resetVariantdata: function (Vid) {
			var that = this;
			var variantUrl = "Variants.xsjs?variantID=" + Vid;
			service.callService("variantInfoModel", "variantInfoModel", variantUrl, "scenario", "true", "", function (evt) {
				that.variantObject = sap.ui.getCore().getModel("variantInfoModel").oData[0];
				that.variantObject.MeasureTree = that.variantObject.MeasureTree;
				that.variantObject.SegmentSelection = that.variantObject.SegmentSelection;
				that.variantObject.SegmentTree = that.variantObject.SegmentTree;
				if (that.variantObject.HiddenNodes) {
					that.hiddenNodes = JSON.parse(that.variantObject.HiddenNodes)
				} else {
					that.hiddenNodes = []
				}
				that.resetdata();
			});

		},

		onVariantSave: function () {
			var driverTree = this;
			// var treedata = driverTree.treeModel.oData;
			var dialog = new sap.m.Dialog({
				title: 'Confirm',
				type: 'Message',
				content: [
					new sap.m.Label({
						text: 'Are you sure you want to save changes to the selected variant as?'
							// labelFor: 'saveVariantTextArea'
					}),
					new sap.m.Input({
						value: driverTree.variantObject.VariantName,
						width: '100%',
						placeholder: 'Add Variant (required)'
					})
				],
				beginButton: new sap.m.Button({
					text: 'Save',
					press: function (evt) {
						var variantName = evt.getSource().getParent().getContent()[1].getValue();
						driverTree.handleVariantUpdate(variantName, true, true);
						driverTree.selectedVariant = variantName;
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function () {
						dialog.close();
					}
				})
			});

			dialog.open();
		},
		// To save the variant changes to the scenario
		handleVariantUpdate: function (variant, loadTree, showSuccessMsg) {
			var that = this;
			var segments = this.getView().byId("segments").getText().split(":")[1];
			this.variantObject.VariantName = variant;
			this.variantObject.SegmentSelection = segments;
			this.variantObject.MeasureTree = JSON.stringify(this.treeData, function (key, value) {
				if (key != "parent")
					return value;
			});
			that.saveNodevalues();
			this.variantObject.SegmentTree = JSON.stringify(that.segmentTreeData, function (key, value) {
				if (key != "parent")
					return value;
			});
			if (this.hiddenNodes.length > 0) {
				this.variantObject.HiddenNodes = JSON.stringify(this.hiddenNodes, function (key, value) {
					if (key != "parent")
						return value;
				});
			} else {
				this.variantObject.HiddenNodes = "";
			}
			this.getView().byId("variantItems").getModel().updateBindings(true);
			var object = {
				"VariantName": this.variantObject.VariantName,
				"ScenId": this.variantObject.ScenId,
				"Page_Id": this.variantObject.ScenId,
				"MeasureTree": this.variantObject.MeasureTree,
				"SegmentTree": this.variantObject.SegmentTree,
				"SegmentSelection": this.variantObject.SegmentSelection,
				"HiddenNodes": this.variantObject.HiddenNodes,
				// "Filter": "DTREE"
			};
			this.variantChange = false;
			if (this.Existing == false) {

				service.callCreateService("Variants(" + parseInt(this.variantObject.VariantId) + ")", JSON.stringify(object), "scenario",
					"PUT",
					function (evt, sucessFlag, oError) {
						if (sucessFlag && showSuccessMsg) {
							sap.m.MessageToast.show("Variant Updated successfully");
						}
						if (loadTree) {
							$("svg")[0].style.width = window.innerWidth;
							that.getView().byId("vdt").setWidth("100%");
							that.expandTree = true, that.dragged = false;
							that.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
							that.getView().byId("treeStyle").setIcon("sap-icon://collapse");
							if (that.segmentTree) {
								that.segmentsSelected = [], that.segmentItems = [];
								draw.drawSegmentTree(that);
								that.getView().byId("vdtVisualise").setVisible(true);
							} else
							// that.loadDataToTreeForScenario(that.scenarioInfo,that.varianceInfo);
								draw.drawMeasureTree(that);
						}

					});
			}
		},
		handleVariantDialogClose: function () {
			this.valueHelpForVariant.close();
		},
		handleVariantScenario: function (evt) {
			var driverTree = this;
			var variantName = this.valueHelpForVariant.getContent()[1].getContent()[1].getValue();
			if (variantName === "") {
				sap.m.MessageToast.show("Please Enter Variant Name");
			} else if (this.getView().byId("variantItems").getModel().oData.length > 0) {
				var nameExist = false;
				for (var j = 0; j < this.getView().byId("variantItems").getModel().oData.length; j++) {
					if (variantName == this.getView().byId("variantItems").getModel().oData[j].VariantName) {
						nameExist = true;
						sap.m.MessageToast.show("Variant Name Exist");
						break;
					} else {
						nameExist = false
					}
				}
			}
			// window.localStorage.getItem('scenarioId')
			if (nameExist == false) {
				this.valueHelpForVariant.close();
				var data = {
					"VariantName": variantName,
					"VariantId": Math.round(Math.random() * 1000000),
					"ScenId": parseInt(driverTree.ScenId),
					"Page_Id": parseInt(driverTree.ScenId),
					"MeasureTree": "",
					"SegmentTree": "",
					"SegmentSelection": "",
					"HiddenNodes": "",
					"Filter": "DTREE"
				};
				if (this.Existing) {
					driverTree.variantObject = data;
					driverTree.selectedVariant = variantName;
					driverTree.hiddenNodes = [];
					driverTree.getView().byId("segments").setText("Segments : All");
					driverTree.getView().byId("variantItems").getModel().oData.push(data);
					driverTree.getView().byId("variantItems").getModel().updateBindings(true);
					var item = driverTree.getView().byId("variantItems").getItems().length - 1;
					driverTree.getView().byId("variantItems").setSelectedItem(driverTree.getView().byId("variantItems").getItems()[item].sId);
					if (driverTree.getView().byId("variantItems").getModel().oData.length == 1) {
						driverTree.getView().byId("variantDelId").setVisible(false);
					} else {
						driverTree.getView().byId("variantDelId").setVisible(true);
					}
					driverTree.onExistingScenarioPress("selection");
				} else {

					var Flag = this.valueHelpForVariant.getContent()[1].getContent()[3].getSelected();
					service.callCreateService("/Variants", JSON.stringify(data), "scenario", "POST", function (evt, sucessFlag, oError) {
						sap.m.MessageToast.show("Variant is created successfully");
						driverTree.variantObject = data;
						driverTree.selectedVariant = variantName;
						driverTree.hiddenNodes = [];
						driverTree.getView().byId("segments").setText("Segments : All");
						driverTree.getView().byId("variantItems").getModel().oData.push(data);
						driverTree.getView().byId("variantItems").getModel().updateBindings(true);
						var item = driverTree.getView().byId("variantItems").getItems().length - 1;
						driverTree.getView().byId("variantItems").setSelectedItem(driverTree.getView().byId("variantItems").getItems()[item].sId);
						if (driverTree.getView().byId("variantItems").getModel().oData.length == 1) {
							driverTree.getView().byId("variantDelId").setVisible(false);
						} else {
							driverTree.getView().byId("variantDelId").setVisible(true);
						}
						driverTree.valueHelpForVariant.getContent()[1].getContent()[1].setValue();
						driverTree.valueHelpForVariant.getContent()[1].getContent()[3].setSelected(false);
						// driverTree.valueHelpForVariant.getContent()[1].getContent()[5].setValue();
						driverTree.expandTree = true;
						driverTree.getView().byId("treeStyle").setTooltip("Collapse second level child nodes");
						driverTree.getView().byId("treeStyle").setIcon("sap-icon://collapse");
						$("svg")[0].style.width = window.innerWidth;
						driverTree.getView().byId("vdt").setWidth("100%");
						driverTree.getView().byId("vdtVisualise").setVisible(false);
						var text = driverTree.getView().byId("scenarioName").getText();
						driverTree.getView().byId("segments").setText("Segments : All");
						driverTree.loadDataToTreeForScenario(driverTree.scenarioInfo, driverTree.varianceInfo);

					});
				}
			}
		},

		// on forecaste icon press to check each measure value
		onViewForcast: function () {
			this.onDeletePress();
			if (sap.ui.getCore().getModel("measurepredicttreeModel").oData != "Forecasting of data is not possible.") {
				$("svg")[0].style.width = parseInt((window.innerWidth / 100) * 73);
				this.getView().byId("forecast").setVisible(true);
				this.getView().byId("vdt").setWidth("75%");
				this.getView().byId("forecasting").setType("Emphasized");
				this.getView().byId("floaterSettingsVisibility").setVisible(true);
				var that = this;
				var getQuartervalue = this.getView().byId("floatSlider").getValue();
				var quater = Formatter.getQuater(getQuartervalue, that);
				var selectedMeasure = that.getView().byId("forecastMeasureId1").getSelectedKey();
				for (var z = 0; z < that.getView().byId("yearId").getItems().length; z++) {
					if (that.getView().byId("yearId").getSelectedItem() == that.getView().byId("yearId").getItems()[z].sId) {
						that.selectedyear = that.getView().byId("yearId").getItems()[z].getText();
						break;
					}
				}
				var url = "ForecastGraph.xsjs?variantID=" + that.variantObject.VariantId + "&select=" + that.measuretreeurl.split("&select=")[1]
					.split(
						"&target=")[0] + "&year1=" + that.selectedyear + "&Quarter1=" + quater + "&column=" + selectedMeasure + "&time=" + that.varianceInfo
					.timeDimension + "&year=" + that.varianceInfo.timePeriod + "&Quarter=" + that.varianceInfo.quarterInfo;
				that.getView().setBusy(true);

				service.callService("forcastModel", "forcastModel", url, "scenario", true,
					"",
					function (evt, flag) {
						var forcastModeldata = sap.ui.getCore().getModel("forcastModel");
						that.dynamicchart();
						that.getView().setBusy(false);
					});
			} else {
				sap.m.MessageToast.show("Forecasting of data is not possible.");
			}
		},
		// create line chart for forecaste
		dynamicchart: function () {
			var forcastModeldata = sap.ui.getCore().getModel("forcastModel");
			var settingsModel = ({
				key: "2",
				name: "Line",
				value: [
					["Current_Value", "Forecast_Value"],
					["Current_Value", "Forecast_Value"],
					["Current_Value", "Forecast_Value"]
				],
				vizType: "line",
				json: ["/timeaxis/actual_forecast.json",
					"/timeaxis/actual_target.json",
					"/timeaxis/semantic.json"
				],
				dataset: [{
					dimensions: [{
						name: 'month',
						value: '{month}',
						dataType: 'date'
					}],
					measures: [{
						name: 'Current_Value',
						value: '{Current_Value}'
					}, {
						name: 'Forecast_Value',
						value: '{Forecast_Value}'
					}],
					data: {
						path: "/"
					}
				}],
				rules: [{
					plotArea: {
						dataPointStyle: {
							"rules": [{
									"dataContext": {
										"Current_Value": '*'
									},
									"properties": {
										"color": "sapUiChartPaletteQualitativeHue1",
										"lineColor": "sapUiChartPaletteQualitativeHue1",
										"lineType": "line"
									},
									"displayName": "Current_Value",
									"dataName": {
										"Actual": "Current_Value"
									}
								}, {
									"dataContext": {
										"Forecast_Value": '*'
									},
									"properties": {
										"color": "sapUiChartPaletteQualitativeHue1",
										"lineColor": "sapUiChartPaletteQualitativeHue1",
										"lineType": "dash"
									},
									"displayName": "Forecast_Value",
									"dataName": {
										"Forecast": "Forecast_Value"
									}
								}

							]
						}
					}
				}],
				commonrules: {
					plotArea: {
						dataLabel: {
							formatString: ChartFormatter.DefaultPattern.SHORTFLOAT_MFD2,
							visible: false
						},
						gap: {
							visible: false
						},
						window: {
							start: "firstDataPoint",
							end: "lastDataPoint"
						}
					},
					valueAxis: {
						label: {
							formatString: ChartFormatter.DefaultPattern.SHORTFLOAT
						},
						title: {
							visible: false
						}
					},
					title: {
						visible: false
					},

					categoryAxis: {
						title: {
							visible: false
						}
					},
				}
			});

			var bindValue = settingsModel;
			var oSimpleForm = this.oView.byId("forecast");
			var i = 0;
			var oPopOver = new sap.viz.ui5.controls.Popover({});
			var oVizFrame = this.getView().byId("forcastevizId");
			oVizFrame.removeAllFeeds();
			var dataModel = sap.ui.getCore().getModel("forcastModel");
			oVizFrame.setModel(dataModel);
			var oDataset = new sap.viz.ui5.data.FlattenedDataset(bindValue.dataset[i]);
			oVizFrame.setDataset(oDataset);
			oVizFrame.setVizType(bindValue.vizType);
			oVizFrame.setVizProperties(bindValue.commonrules);
			oVizFrame.setVizProperties(bindValue.rules[i]);
			var feedTimeAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "categoryAxis",
					'type': "Dimension",
					'values': ["month"]
				}),
				feedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "valueAxis",
					'type': "Measure",
					'values': bindValue.value[i]
				});
			oVizFrame.addFeed(feedValueAxis);
			oVizFrame.addFeed(feedTimeAxis);
			oPopOver.connect(oVizFrame.getVizUid());
			oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
		},
		onSelectVariant: function (evt) {
			var variantSelectedKey = evt.oSource.getSelectedKey();
			switch (variantSelectedKey) {
			case "newvariant":
				this.valueHelpForVariant.getContent()[2].setVisible(false);
				this.valueHelpForVariant.getContent()[1].setVisible(true);
				break;
			case "existsvariant":
				this.valueHelpForVariant.getContent()[1].setVisible(false);
				this.valueHelpForVariant.getContent()[2].setVisible(true);
			}
		},
		onTitlechange: function (evt) {
			var that = this;
			if (evt.oSource.getValue() != "") {
				that.ValueHelpForService.getButtons()[2].setEnabled(true);
			}
		},
		hanldeNext: function () {
			var that = this;
			that.ValueHelpForService.getContent()[1].getItems()[2].setEnabled(true);
			that.ValueHelpForService.getContent()[1].setSelectedKey("data");
			that.ValueHelpForService.getButtons()[2].setVisible(false);
			that.ValueHelpForService.getButtons()[2].setEnabled(false);
			that.ValueHelpForService.getButtons()[0].setVisible(true);
		},

		handleIconTabPress: function (evt) {
			var that = this;
			var oIconTab = that.ValueHelpForService.getContent()[1];
			if (evt.oSource.getSelectedKey() === oIconTab.getItems()[4].getKey()) {
				that.ValueHelpForService.getButtons()[2].setVisible(false);
				that.ValueHelpForService.getButtons()[0].setVisible(true);
			}
			if (evt.oSource.getSelectedKey() === oIconTab.getItems()[0].getKey()) {
				that.ValueHelpForService.getButtons()[2].setVisible(true);
				that.ValueHelpForService.getButtons()[0].setVisible(false);
			}
		},

		// scenario edit
		onScenarioEdit: function (evt) {
			var that = this;
			this.ValueHelpForService.open();
			this.updateFlag = true;
			this.mArray = [];
			this.dArray = [];
			var path = evt.oSource.getBindingContext().sPath.split("/")[3];
			this.ListId = evt.oSource.oParent.getModel().oData.d.results[path].ListId;
			this.ScenId = evt.oSource.oParent.getModel().oData.d.results[path].ScenId;
			var roleFlag = evt.oSource.oParent.getModel().oData.d.results[path].RoleFlag;
			var oIconTab = this.ValueHelpForService.getContent()[1];

			if (roleFlag === "X") {
				oIconTab.getItems()[0].getContent()[0].getContent()[3].setSelected(true);
			}
			var scenarioInfo = JSON.parse(decodeURIComponent(escape(window.atob(evt.oSource.getModel().oData.d.results[path].ScenConfig))));
			that.editvarianceInfo = JSON.parse(decodeURIComponent(escape(window.atob(evt.oSource.getModel().oData.d.results[path].VariantSettings))));

			var that = this;
			var url = "/Scenarios?$expand=Variants&$filter=ScenId eq " + this.ScenId + "&$format=json";

			oIconTab.getItems()[0].getContent()[0].getContent()[1].setValue(scenarioInfo.scenarioTitle);

			oIconTab.getItems()[2].setEnabled(true);
			oIconTab.setSelectedKey("data");
			that.ValueHelpForService.getButtons()[0].setVisible(false);
			that.ValueHelpForService.getButtons()[1].setVisible(true).setEnabled(true);
			that.ValueHelpForService.getButtons()[2].setVisible(true).setEnabled(true);
			if (scenarioInfo.dataSource === "file") {
				this.fileUploaded = true;
				this.onExistingFileSelected("", scenarioInfo);
			} else {
				oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValue(scenarioInfo.serviceURL);
				oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].setValueState("Success");
				var viewList = that.ValueHelpForDataRecords.getContent()[1];
				viewList.getItems().forEach(function (item) {
					if (item.getBindingContext().getObject().FileName == scenarioInfo.serviceURL) {
						that.setMeasuresAndDimensionsForEnity(new sap.ui.model.json.JSONModel(item.getBindingContext().getObject()), scenarioInfo);
					}
				});
				oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[7].setValue(scenarioInfo.Entity);
				this.targetValue = scenarioInfo.Entity

			}
		},
		// create table view in scenario creation
		createTabledata: function (scenarioInfo) {
			var oIconTab = this.ValueHelpForService.getContent()[1];
			var measureslist = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[0];
			var dimensionList = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[1].getItems()[1];
			for (var m = 0; m < scenarioInfo.measures.length; m++) {
				for (var l = 0; l < measureslist.getItems().length; l++) {
					if (measureslist.getItems()[l].getTitle() === scenarioInfo.measures[m]) {
						measureslist.setSelectedItem(measureslist.getItems()[l]);
					}
				}
			}
			for (var d = 0; d < scenarioInfo.dimension.length; d++) {
				for (var h = 0; h < dimensionList.getItems().length; h++) {
					if (dimensionList.getItems()[h].getTitle() === scenarioInfo.dimension[d]) {
						dimensionList.setSelectedItem(dimensionList.getItems()[
							h]);
					}
				}
			}
			for (var a = 0; a < measureslist.getSelectedItems().length; a++) {
				this.mArray.push(measureslist.getSelectedItems()[a].getTitle());
			}
			for (var b = 0; b < dimensionList.getSelectedItems().length; b++) {
				this.dArray.push(dimensionList.getSelectedItems()[b].getTitle());
			}
			this.batchCall(scenarioInfo);
		},

		handleInput: function (evt) {
			var data = evt.oSource.getValue();
			evt.oSource.setEditable(false);
		},

		// search Views
		onviewSearch: function (evt) {
			var searchList = this.ValueHelpForDataRecords.getContent()[1];
			var binding = searchList.getBinding("items");
			var searchString = evt.getSource().getValue();
			if (searchString && searchString.length > 0) {
				var sfilters = [];
				var filter = new sap.ui.model.Filter("FileName", sap.ui.model.FilterOperator.Contains, searchString);
				sfilters.push(filter);
				binding.filter(new sap.ui.model.Filter(sfilters, false));
			} else {
				binding.filter([]);
			}
		},

		// search Measure
		onmeasureSearch: function (evt) {
			var searchList = this.valueHelpRequestForEntity.getContent()[1];
			var binding = searchList.getBinding("items");
			var searchString = evt.getSource().getValue();
			if (searchString && searchString.length > 0) {
				var sfilters = [];
				var filter = new sap.ui.model.Filter("", sap.ui.model.FilterOperator.Contains, searchString);
				sfilters.push(filter);
				binding.filter(new sap.ui.model.Filter(sfilters, false));
			} else {
				binding.filter([]);
			}
		},

		addScenarioTabChange: function (evt) {
			var that = this;
			var icontabSelected = evt.oSource.getSelectedKey();
			switch (icontabSelected) {
			case "data":
				that.ValueHelpForService.getButtons()[2].setVisible(true);
				that.ValueHelpForService.getButtons()[2].setEnabled(true);
				that.ValueHelpForService.getButtons()[0].setVisible(false);
				break;
			case "general":
				that.ValueHelpForService.getButtons()[2].setVisible(true);
				that.ValueHelpForService.getButtons()[2].setEnabled(true);
				that.ValueHelpForService.getButtons()[0].setVisible(false);
				that.ValueHelpForService.getButtons()[1].setVisible(false);
				break;
			case "variance":
				that.ValueHelpForService.getButtons()[2].setVisible(false);
				that.ValueHelpForService.getButtons()[0].setVisible(true);
				that.ValueHelpForService.getButtons()[0].setEnabled(true);
				// this.hanldeNextStep();
				if (this.updateFlag === true) {
					that.ValueHelpForService.getButtons()[0].setVisible(false);
					that.ValueHelpForService.getButtons()[1].setVisible(true);
					that.ValueHelpForService.getButtons()[1].setEnabled(true);
					this.hanldeNextStep();
				}
				break;
			}
		},

		fileuploadmeasuresanddimensionsForMeasuretree: function (keys, scenarioInfo) {
			var driverTree = this;
			var oIconTab = this.ValueHelpForService.getContent()[1];
			if (driverTree.updateFlag === true) {
				driverTree.viewName = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
			}
			if (this.fileUploaded === false) {
				var dataUrl = oIconTab.getItems()[2].getContent()[0].getItems()[0].getItems()[0].getContent()[5].getValue();
				var fileUrl = "Views.xsjs?ViewName=" + this.SelectedUrl.split("=")[0].split("&")[0] + "" +
					"&aggregate=true&select=" +
					keys.join() +
					"&$format=json";
				var boolean = "true";
			} else {
				boolean = "true";
				if (this.mArray.length > 0 && this.dArray.length === 0) {
					fileUrl = "FileUploader.xsjs?aggregate=true&FileName=" + scenarioInfo + "&selectM=" + this.mArray.join();
				} else if (this.mArray.length === 0 && this.dArray.length > 0) {
					fileUrl = "FileUploader.xsjs?aggregate=true&FileName=" + scenarioInfo +
						"&selectD=" + this.dArray.join();
				} else {
					fileUrl = "FileUploader.xsjs?aggregate=true&FileName=" + scenarioInfo + "&selectM=" + this.mArray.join() +
						"&selectD=" + this.dArray.join();
				}
			}

			service.callService("FileSelectedModel", "FileSelectedModel", fileUrl, "scenario", true, dataUrl, function (evt) {
				var selectedFileModel = sap.ui.getCore().getModel("FileSelectedModel");
				driverTree.segmentTable = selectedFileModel.oData.d.results[1];
				driverTree.segmentTableeditable = selectedFileModel.oData.d.results[1];
			});
		},

		// edit table value
		handleinputPress: function (evt) {
			var that = this;
			var val = evt.oSource.getValue();
			var columnName = evt.oSource.mBindingInfos.value.parts[0].path;
			var selectedfields = Object.keys(evt.oSource.getBindingContext().getObject());
			var selected = "",
				filter = "";
			for (var x = 0; x < Object.keys(evt.oSource.getBindingContext().getObject()).length; x++) {
				if (Object.values(evt.oSource.getBindingContext().getObject())[x].toString().indexOf("All") == (-1) &&
					Object.keys(evt.oSource.getBindingContext().getObject())[x] != "Parent" && Object.keys(evt.oSource.getBindingContext().getObject())[
						x] != "expanded" &&
					Object.keys(evt.oSource.getBindingContext().getObject())[x] != "ParentNew") {
					if (selected.length == 0) {
						selected = Object.keys(evt.oSource.getBindingContext().getObject())[x];
					} else {
						selected += "," + Object.keys(evt.oSource.getBindingContext().getObject())[x];
					}
					if (typeof (Object.values(evt.oSource.getBindingContext().getObject())[x]) == "string" && Object.values(evt.oSource.getBindingContext()
							.getObject())[x] != val && Object.keys(evt.oSource.getBindingContext().getObject())[x] != "ParentNew" && Object.keys(evt.oSource
							.getBindingContext().getObject())[x] != "Parent") {
						if (filter.length == 0) {
							filter = Object.keys(evt.oSource.getBindingContext().getObject())[x] + " eq " + Object.values(evt.oSource.getBindingContext()
								.getObject())[
								x];
						} else {
							filter = filter + " and " + Object.keys(evt.oSource.getBindingContext().getObject())[x] + " eq " + Object.values(evt.oSource
								.getBindingContext()
								.getObject())[x];
						}
					}
				}
			}
			var updateTableUrl = "Disaggregation.xsjs?variantID=" + this.variantObject.VariantId + "&select=" + selected + "&target=" + that
				.selectedscenarioInfo
				.Entity + "&filter=" + filter + "&column1=" + columnName + "&value=" + val;

			service.callService("TableUpdateModel", "TableUpdateModel", updateTableUrl, "scenario", true, "", function (evt, flag) {
				var updatetabledata = sap.ui.getCore().getModel("TableUpdateModel");
			});
		},

		onExistingVariantPress: function (evt) {
			var driverTree = this
			driverTree.selectvariant = evt.mParameters.listItem.getBindingContext().getObject();
			driverTree.dialog = new sap.m.Dialog({
				title: 'Confirm',
				type: 'Message',
				content: [
					new sap.m.Label({
						text: 'Are you sure you want to create shared variant?',
						labelFor: 'Scenario Name'
					}),

					new sap.m.Input({
						value: evt.mParameters.listItem.getTitle(),
						width: '100%',

					}),
					new sap.m.Label({
						text: 'Share: ',
					}),
					new sap.m.CheckBox({

					}),
				],
				beginButton: new sap.m.Button({
					text: 'Save',
					press: function () {

						var variant = {
							"VariantId": JSON.stringify(Math.round(Math.random() * 1000000)),
							"VariantName": driverTree.dialog.getContent()[1].getValue(),
							"ScenId": driverTree.variantObject.ScenId,
							"SegmentTree": driverTree.selectvariant.SegmentTree,
							"SegmentSelection": driverTree.selectvariant.SegmentSelection,
							"MeasureTree": driverTree.selectvariant.MeasureTree,
							"HiddenNodes": driverTree.selectvariant.HiddenNodes,
							"Filter": "DTREE"
						};
						service.callCreateService("Variants.xsjs?&RoleFlag=" + driverTree.dialog.getContent()[3].getSelected(), JSON.stringify(
							variant), "", "POST", function (evt, sucessFlag,
							oError) {
							driverTree.dialog.close();
							driverTree.valueHelpForVariant.close();
							driverTree.getView().setBusy(false);
							driverTree.variantObject = evt.oData;
							driverTree.selectedVariant = evt.oData.VariantName;
							driverTree.getView().byId("variantItems").getModel().oData.push(evt.oData);
							driverTree.getView().byId("variantItems").getModel().updateBindings(true);
							var item = driverTree.getView().byId("variantItems").getItems().length - 1;
							driverTree.getView().byId("variantItems").setSelectedItem(driverTree.getView().byId("variantItems").getItems()[item].sId);
							if (driverTree.getView().byId("variantItems").getModel().oData.length == 1) {
								driverTree.getView().byId("variantDelId").setVisible(false);
							} else {
								driverTree.getView().byId("variantDelId").setVisible(true);
							}
							driverTree.valueHelpForVariant.getContent()[1].getContent()[1].setValue();
							driverTree.valueHelpForVariant.getContent()[1].getContent()[3].setSelected(false);
							driverTree.variantObject.VariantId = evt.oData.VariantId;
							if (driverTree.variantObject.SegmentSelection.includes("'")) {
								driverTree.getView().byId("segments").setText("Segments : " + that.variantObject.SegmentSelection);
							} else {
								driverTree.getView().byId("segments").setText("Segments : All");
							}
							if (driverTree.variantObject.HiddenNodes) {
								driverTree.hiddenNodes = JSON.parse(driverTree.variantObject.HiddenNodes)
							} else {
								driverTree.hiddenNodes = []
							}
							driverTree.loadDataToTreeForScenario(driverTree.scenarioInfo, driverTree.varianceInfo);
						});
						driverTree.dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function () {
						driverTree.dialog.close();
					}
				})
			});
			driverTree.dialog.open();
		},
		onTableColumnDataTypeChanged: function (evt) {
			if (evt.getSource().getSelectedKey() == "String") {
				evt.getSource().getBindingContext().getObject().TYPE = "DIMENSION";
			} else {
				evt.getSource().getBindingContext().getObject().TYPE = "MEASURE";
			}
		}
	});
});