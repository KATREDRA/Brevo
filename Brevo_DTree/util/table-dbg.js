	sap.ui.define([
			"Brevo/BrevoDtree/model/Service",
		],
		function (Service) {
			"use strict";
			return {
				getControllerName: function () {
					return "Brevo.BrevoDtree.controller.view1";
				},
				tablefunc: function (oController, headername, VariantId) {
					// createContent : function(oController) {
					var that = this;
					that.Variantid = VariantId;
					//create my Excel Grid control
					var oExcelGrid = new ExcelGrid({
						data: "{/}", //binding the model
						options: {
							colHeaders: headername,
							manualColumnResize: true,
							colWidths: 250,
							maxCols: oController.length,
							afterChange: function (changes, source) {
								if (source == "edit") {
									var data = changes[0];
									// var tableupdate = {
									//     "ID": data[0]+1,
									//     "Column_name":data[1],
									//     "Col_UpdateVal":data[3]
									// };
									// console.log(tableupdate);
									var method = "PUT";
									var url = "http://104.198.161.189:8090/Brevo_VDT/ProxyFileUploader.xsjs";
									var postReportInfo = {
										"Cred": "c3lzdGVtOkluaXQyMDE4=",
										"varientID": that.Variantid,
										"Key": data[1],
										"ID_Value": data[0] + 1,
										"UpdatedValue": data[3]

									};
									// var service = ibrevoVDT.Component.getService();
									Service.callCreateService(url, JSON.stringify(postReportInfo), false, method, function (evt, sucessFlag,
										oError) {
										if (sucessFlag) {
											//window.localStorage.setItem('scenarioId', driverTree.ScenId);
											//driverTree.getView().byId("scenarioName").setText(scenarioTitle);
										}
									});
								}

							}
						}
					});

					var oLayout = new sap.ui.commons.layout.MatrixLayout({
						// id : "matrix1",
						layoutFixed: false,
						width: "100%"
					});

					// var oButtonModel = new sap.ui.commons.Button({
					//     text : "alert( oExcelGrid.getModel().getJSON())",
					//     tooltip : "Alert grid model",
					//     press : function() {alert( oExcelGrid.getModel().getJSON());}
					// });
					// var oButtonMethod = new sap.ui.commons.Button({
					//     text : "Call method countRows()",
					//     tooltip : "Test Call Method",
					//     press : function() {alert( oExcelGrid.getInstance().countRows() );}
					// });
					//oLayout.createRow(oAppHeader);
					oLayout.createRow(oExcelGrid);
					// oLayout.createRow(oButtonModel);
					// oLayout.createRow(oButtonMethod);      
					return oLayout;

				}
			};
		});