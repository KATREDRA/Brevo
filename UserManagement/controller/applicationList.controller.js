sap.ui.define(["sap/ui/core/mvc/Controller","sap/m/MessageToast","sap/m/MessageBox","sap/ui/core/format/DateFormat","inhance/userManagementSecurity/util/formatter"],function(e,t,i,a,n){"use strict";return e.extend("inhance.userManagementSecurity.controller.applicationList",{formatter:n,onInit:function(){var e=this;if(!this.valueHelpForApplication)this.valueHelpForApplication=new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForApplication",this);sap.ui.core.UIComponent.getRouterFor(this).getRoute("applicationList").attachPatternMatched(function(){e.getView().getModel("appView").setProperty("/sideMenuVisible",true);e.handleApplicationModel()},this)},onAfterRendering:function(){this.handleApplicationModel()},handleApplicationModel:function(){var e=this;this.getView().setBusy(true);var t=new sap.ui.model.json.JSONModel("/BrevoMongoDB/UM/getapplications");t.attachRequestCompleted(function(){e.getView().setBusy(false);e.getOwnerComponent().setModel(t,"applications")})},handleAddGroups:function(){this.addGroups.open()},onNavBack:function(){this.getView().getModel("appView").setProperty("/layout","OneColumn");var e=sap.ui.core.UIComponent.getRouterFor(this);e.navTo("Home")},handleAddApplication1:function(){this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel({AppId:1e3+this.getOwnerComponent().getModel().getData().apps.length+1,AppName:"",Description:"",App_Url:"",Created_At:this.todayDate(),Last_Changed_At:this.todayDate()}));this.valueHelpForApplication.open()},handleAddApplication:function(){this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel({name:"",description:"",link:"",createdate:(new Date).toJSON(),modifydate:(new Date).toJSON()}));this.valueHelpForApplication.open()},handleApplicationSave:function(){var e=this;var t=this.valueHelpForApplication.getModel().getData(),a="";if(this.editApp){this.editApp=false;var n=this.editAppObj._id;a="/BrevoMongoDB/UM/editapplication?param1="+n;this.getOwnerComponent().getModel().getData().apps[this.editAppPath]=this.valueHelpForApplication.getModel().getData()}else{a="/BrevoMongoDB/UM/createapplication"}$.post(a,t,function(t){if(t=="okk"){i.success(t);e.handleApplicationModel();e.getOwnerComponent().getModel().updateBindings(true)}else{i.error(t)}});this.getOwnerComponent().getModel().updateBindings(true);this.valueHelpForApplication.close()},todayDate:function(){var e=sap.ui.core.format.DateFormat.getDateInstance({pattern:"MM/dd/YYYY"});return e.format(new Date)},handleApplicationCancel:function(){this.valueHelpForApplication.close()},handleEditAppPress:function(e){this.editApp=true;this.editAppObj=e.getSource().getBindingContext("applications").getObject();this.valueHelpForApplication.setModel(new sap.ui.model.json.JSONModel(this.editAppObj));this.valueHelpForApplication.open()},handleAppSearch:function(e){var t=new sap.ui.model.Filter("name","Contains",e.getParameter("newValue"));var i=new sap.ui.model.Filter("description","Contains",e.getParameter("newValue"));var a=new sap.ui.model.Filter("link","Contains",e.getParameter("newValue"));var n=new sap.ui.model.Filter([t,i,a],false);this.getView().byId("appTableId").getBinding("items").filter(n)},handleLinkPress:function(e){window.open(e.getSource().getText())},handleDeleteAppPress:function(e){var t=this;this.appToDelete=e.getSource().getBindingContext("applications");this.getView().setBusy(true);i.confirm("Are You want to delete a Application?",{onClose:function(e){if(e=="OK"){var a=t.appToDelete.getObject()._id;$.post("/BrevoMongoDB/UM/deleteapplication?param1="+a,{id:parseInt(t.appToDelete.getObject()._id)},function(e){if(e=="okk"){t.getView().setBusy(false);t.getOwnerComponent().getModel("applications").oData.splice(t.appToDelete.getPath().split("/")[1],1);t.getOwnerComponent().getModel("applications").updateBindings(true);i.success(e)}})}else t.getView().setBusy(false)}})}})});