sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/routing/History","sap/m/MessageToast","sap/m/Button","sap/m/Dialog","Brevo/QueryBuilder/model/Service","sap/ui/core/format/DateFormat"],function(e,t,a,i,r,o,s){"use strict";return e.extend("Brevo.QueryBuilder.controller.DataPreview",{onNavBack:function(){var e=t.getInstance();var a=e.getPreviousHash();if(a!==undefined){window.history.go(-1)}else{var i=sap.ui.core.UIComponent.getRouterFor(this);i.navTo("home",{},true)}},onInit:function(){var e=this;this.queryId="";this.query="";this.queryName="";this.created="";this.viewData={};this.dbName="";e.BusyDialog=new sap.m.BusyDialog;sap.ui.core.UIComponent.getRouterFor(this).getRoute("dataPreview").attachPatternMatched(this.onPatternMatched,this)},onPatternMatched:function(e){var t=this;var a=e.getParameter("arguments").viewName;if(a){t.BusyDialog.open();t.tile=a;var i="TableMetadata?db=Brevo&table="+t.tile;var r=s.getDateTimeInstance({pattern:"dd/MM/yyyy"});var n;o.callService("queryInfo","queryInfo",i,"",true,function(e){var a=sap.ui.getCore().getModel("queryInfo");t.created=a.oData.created_through;t.queryId=a.oData.view_id;n=r.format(new Date(a.oData.last_change));t.getView().byId("lastChange").setText("Last Modified: "+n);t.getView().byId("variantItems").setTitle(t.tile);t.getView().byId("editButton").setVisible(true);var i="TableData?db=Brevo&table="+t.tile;o.callGetService("viewData","viewData",i,"",true,function(e){var a;var i=[];if(e){a=new sap.ui.model.json.JSONModel(JSON.parse(JSON.parse(e)).tables);t.drawGridTable(a)}else{a=new sap.ui.model.json.JSONModel}t.BusyDialog.close()})})}else{var l=sap.ui.getCore().getModel("dataPreviewModel");t.getView().byId("variantItems").setTitle("Data");t.getView().byId("editButton").setVisible(false);t.drawGridTable(l)}},drawGridTable:function(e){var t=this;t.BusyDialog.open();var a=t.getView().byId("gridTable");a.removeAllColumns();var i=Object.keys(e.oData[0]);for(var r=0;r<i.length;r++){a.addColumn(new sap.ui.table.Column({width:"11rem",label:new sap.m.Label({text:i[r]}),template:new sap.m.Input({value:"{"+i[r]+"}",editable:false})}))}a.setModel(e);a.bindRows("/");t.getView().byId("variantItems").setNumber(e.oData.length);t.BusyDialog.close()},onEditPress:function(){var e=this;e.BusyDialog.open();var t=true;var a=this.tile;var i=this.viewId;var r=sap.ui.core.UIComponent.getRouterFor(this);if(this.created=="editor"){r.navTo("sqlEditor",{isEditMode:true});e.BusyDialog.close()}else{e.BusyDialog.close();r.navTo("createQuery",{isEditMode:true})}}})});