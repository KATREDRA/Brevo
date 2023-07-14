sap.ui.define(["sap/ui/core/mvc/Controller","inhance/userManagementSecurity/util/formatter","sap/m/MessageBox","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,s,a,i){"use strict";return e.extend("inhance.userManagementSecurity.controller.usersDetail",{formatter:t,onInit:function(){var e=this;this.selectedPages=[];this.deletedPages=[];this.selectedModels=[];this.deletedModels=[];if(!this.addPagesAccess)this.addPagesAccess=new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addPagesAccess",this);if(!this.addModels)this.addModels=new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.addModelAccess",this);this.getView().addDependent(this.addPagesAccess);this.getView().addDependent(this.addModels);sap.ui.core.UIComponent.getRouterFor(this).getRoute("usersDetail").attachPatternMatched(this.objMatched,this);if(!this.valueHelpForNewUser)this.valueHelpForNewUser=new sap.ui.xmlfragment("inhance.userManagementSecurity.fragments.valueHelpForNewUser",this);this.getView().addDependent(this.valueHelpForNewUser);this.getView().byId("pagesAccessId2").setModel(new sap.ui.model.json.JSONModel([]))},objMatched:function(e){var t=this;this.userId=e.getParameter("arguments").userId;this.userItemIndex=e.getParameter("arguments").path;var a=new sap.ui.model.Context(this.getOwnerComponent().getModel("usersList"),"/"+e.getParameter("arguments").path);this.getView().setBindingContext(a,"usersList");this.handleSaveCancelButton(false);this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].removeSelections(false);this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].removeSelections(false);this.getView().getModel("appView").setProperty("/sideMenuVisible",true);this.destination=this.getView().getModel("appView").getProperty("/destination");this.getView().setBusy(true);$.get(this.destination+"/UM/getuseraccess?userid="+this.userId,function(e){if(e=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(e){if(e=="OK"){t.handleInvalidSession()}}})}else{try{e=JSON.parse(e)}catch(e){}var a=new sap.ui.model.json.JSONModel(e);t.getView().setBusy(false);if(a.getData()[0].PageAccess){a.getData()[0].PageAccess.forEach(function(e){e["createid"]=t.getBooleanTerm(e.createid);e["deleteid"]=t.getBooleanTerm(e.deleteid);e["readid"]=t.getBooleanTerm(e.readid);e["shareid"]=t.getBooleanTerm(e.shareid);e["updateid"]=t.getBooleanTerm(e.updateid)})}else a.getData()[0].PageAccess=[];var i=new sap.ui.model.json.JSONModel(a.getData()[0].PageAccess);t.getView().byId("pagesAccessId").setModel(i);if(a.getData()[0].ModelAccess){a.getData()[0].ModelAccess.forEach(function(e){e["createid"]=t.getBooleanTerm(e.createid);e["deleteid"]=t.getBooleanTerm(e.deleteid);e["readid"]=t.getBooleanTerm(e.readid);e["shareid"]=t.getBooleanTerm(e.shareid);e["updateid"]=t.getBooleanTerm(e.updateid)})}else a.getData()[0].ModelAccess=[];var n=new sap.ui.model.json.JSONModel(a.getData()[0].ModelAccess);t.getView().byId("pagesAccessId2").setModel(n)}})},getBooleanTerm:function(e){if(e=="false"||e==false)return false;else if(e=="true"||e==true)return true},handleAddPagesAccess:function(){this.addPagesAccess.getContent()[0].to(this.addPagesAccess.getContent()[0].getPages()[0].getId());this.addPagesAccess.open()},handleAddModels:function(e){this.addModels.getContent()[0].to(this.addModels.getContent()[0].getPages()[0].getId());this.addModels.open()},handleDBSelected:function(e){var t=this;var a=e.getSource().getTitle()=="MongoDB"?"Brevo":"fileuploader";$.get(this.destination+"/getAllTablesAndViews?db="+a,function(e){if(e=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(e){if(e=="OK"){t.handleInvalidSession()}}})}else{try{e=JSON.parse(e)}catch(e){}var a=new sap.ui.model.json.JSONModel(e);var i=new sap.ui.model.json.JSONModel(a.getData());t.addModels.setModel(i);t.handleModelListSelect();t.addModels.getContent()[0].to(t.addModels.getContent()[0].getPages()[1].getId())}})},handleModelListSelect:function(e){var t=this.getView().byId("pagesAccessId2").getModel().getData();this.addModels.getContent()[0].getPages()[1].getContent()[1].removeSelections();var s=this.addModels.getContent()[0].getPages()[1].getContent()[1].getItems();var a=this.addModels.getModel().getData().Tables;for(var i=0;i<s.length;i++){var n=s[i].getBindingContextPath().split("/")[2];for(var o=0;o<t.length;o++){if(a[n].TABLE_NAME==t[o].modelName&&a[n].TABLE_CATALOG==t[o].db){this.addModels.getContent()[0].getPages()[1].getContent()[1].setSelectedItem(this.addModels.getContent()[0].getPages()[1].getContent()[1].getItems()[i]);break}}}},handleAddModelAccess:function(e){var t=this.addModels.getContent()[0].getPages()[1].getContent()[1].getSelectedItems();var a=this.getView().byId("pagesAccessId2").getModel().getData();if(t.length>0){var i=[];for(var n=0;n<t.length;n++){var o=false;for(var d=0;d<a.length;d++){if(t[n].getBindingContext().getObject().TABLE_NAME==a[d].modelName&&t[n].getBindingContext().getObject().TABLE_CATALOG==a[d].db){o=true;break}}if(!o){var g={modelName:t[n].getBindingContext().getObject().TABLE_NAME,userid:this.userId,db:t[n].getBindingContext().getObject().TABLE_CATALOG,createdate:(new Date).toJSON(),modifydate:(new Date).toJSON(),createid:false,readid:false,updateid:false,deleteid:false,shareid:false};a.push(g)}}this.getView().byId("pagesAccessId2").getModel().updateBindings(true);this.selectedModels=[];this.addModels.close();this.handleSaveCancelButton(true)}else{s.error("Please select a Model")}},handleAddModelsDialogClose:function(e){var t=this.addModels.getContent()[0].getSelectedItems();var a=this.getView().byId("pagesAccessId2").getModel().getData();if(t.length>0){var i=[];for(var n=0;n<t.length;n++){var o=false;for(var d=0;d<a.length;d++){if(t[n].getBindingContext("fileModels").getObject().FileName==a[d].modelName){o=true;break}}if(!o){var g={modelName:t[n].getBindingContext("fileModels").getObject().FileName,userid:this.userId,createdate:(new Date).toJSON(),modifydate:(new Date).toJSON(),createid:false,readid:false,updateid:false,deleteid:false,shareid:false};a.push(g)}}this.getView().byId("pagesAccessId2").getModel().updateBindings(true);this.selectedModels=[];this.addModels.close();this.handleSaveCancelButton(true)}else{s.error("Please select a Page")}},handlePageTypeSelected:function(e){this.selApplication=e.getSource().getBindingContext("appView").getObject();this.typeOfPageSelected=1;var t;if(e.getSource().getTitle()=="Dashboard builder"||e.getSource().getTitle()=="Dashboard Builder"||e.getSource().getTitle()=="Brevo"||e.getSource().getTitle()=="brevo"||e.getSource().getTitle()=="BREVO Dashboard Viewer"){t="D"}else if(e.getSource().getTitle()=="Analytic Page builder"||e.getSource().getTitle()=="Pana Builder"||e.getSource().getTitle()=="PANA Builder"||e.getSource().getTitle()=="pana"||e.getSource().getTitle()=="BREVO PANA Viewer"){t="A"}else t="D";this.addPagesAccess.getContent()[0].getPages()[1].getContent()[0].setValue();this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].setVisible(true);this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].setVisible(false);var s=new a("TypeOfPage",i.EQ,t);this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getBinding("items").filter([s]);this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].getBinding("items").filter([]);this.addPagesAccess.getContent()[0].to(this.addPagesAccess.getContent()[0].getPages()[1].getId())},handleListItemsSelected:function(){var e=this.getView().byId("pagesAccessId").getModel().getData();this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].removeSelections();var t=this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getItems();var s=this.getView().getModel("pages").getData().d.results;for(var a=0;a<t.length;a++){var i=t[a].getBindingContextPath().split("/")[3];for(var n=0;n<e.length;n++){if(s[i].Page_Id==e[n].pageid){this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].setSelectedItem(this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getItems()[a]);break}}}},oNavigationBackBackPress:function(e){e.getSource().getParent().to(e.getSource().getParent().getPages()[0].getId())},handleSearchPages:function(e){var t=new sap.ui.model.Filter("name","Contains",e.getParameter("newValue"));if(this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getVisible()){this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getBinding("items").filter(t)}else{this.addPagesAccess.getContent()[0].getPages()[1].getContent()[2].getBinding("items").filter(t)}},handleAddUserAccess:function(e){var t=this;var a=this.addPagesAccess.getContent()[0].getPages()[1].getContent()[1].getSelectedItems();var i=this.getView().byId("pagesAccessId").getModel().getData();if(a.length>0){var n=[];for(var o=0;o<a.length;o++){var d=false;for(var g=0;g<i.length;g++){if(a[o].getBindingContext("pages").getObject().Page_Id==i[g].pageid){d=true;break}}if(!d){var l={applicationname:this.selApplication.name,pagetitle:a[o].getBindingContext("pages").getObject().PageTitle,TypeOfPage:a[o].getBindingContext("pages").getObject().type,userid:this.userId,applicationid:this.selApplication._id,pageid:a[o].getBindingContext("pages").getObject().Page_Id,createdate:(new Date).toJSON(),modifydate:(new Date).toJSON(),createid:false,readid:false,updateid:false,deleteid:false,shareid:false};i.push(l)}}this.getView().byId("pagesAccessId").getModel().updateBindings(true);this.selectedPages=[];this.addPagesAccess.close();this.handleSaveCancelButton(true)}else{s.error("Please select a Page")}},handleCancelUserAccess:function(){this.addPagesAccess.close()},handleDeletePageAccess:function(e){var t=this.getView().byId("pagesAccessId").getSelectedItems();if(t.length>0){for(var a=t.length-1;a>=0;a--){for(var i=this.getView().byId("pagesAccessId").getModel().oData.length-1;i>=0;i--){if(t[a].getBindingContext().getObject().pageid==this.getView().byId("pagesAccessId").getModel().oData[i].pageid){if(t[a].getBindingContext().getObject()._id)this.deletedPages.push(t[a].getBindingContext().getObject()._id);this.getView().byId("pagesAccessId").getModel().oData.splice(i,1);break}}}this.getView().byId("pagesAccessId").getModel().updateBindings(true);this.getView().byId("pagesAccessId").removeSelections(false);this.handleSaveCancelButton(true)}else{s.error("Please select an item to delete")}this.getView().getModel().updateBindings(true)},handleModelsSelected:function(e){console.log(e)},handleSaveCancelButton:function(e){this.getView().byId("saveButtonId").setVisible(e);this.getView().byId("cancelButtonId").setVisible(e);this.getView().byId("editButtonId").setVisible(!e);this.getView().byId("deleteButtonId").setVisible(!e)},handleSaveUserAccess:function(){var e=this;var t=this.getView().byId("pagesAccessId").getModel().getData();var a=this.getView().byId("pagesAccessId2").getModel().getData();s.confirm("Do u want to save your changes",{onClose:function(i){e.getView().setBusy(true);var n={userId:e.userId,pageAccess:t,ModelAccess:a,deletedPageAccessIds:e.deletedPages,deletedModelAccessIds:e.deletedModels};var o=e.userId;$.post(e.destination+"/UM/edituseraccess",n,function(t){e.getView().setBusy(false);if(t=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(t){if(t=="OK"){e.handleInvalidSession()}}})}else if(t=="ok"){s.success("Access Assigned Successfully");e.handleSaveCancelButton(false)}else{s.error(t)}})}})},handleCancelUser:function(){var e=this;s.confirm("Are you sure want to cancel your changes",{onClose:function(t){if(t=="OK"){$.get(e.destination+"/UM/getuseraccess?userid="+e.userId,function(t){if(t=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(t){if(t=="OK"){e.handleInvalidSession()}}})}else{try{t=JSON.parse(t)}catch(e){}var a=new sap.ui.model.json.JSONModel(t);e.getView().setBusy(false);if(a.getData()[0].PageAccess){a.getData()[0].PageAccess.forEach(function(t){t["createid"]=e.getBooleanTerm(t.createid);t["deleteid"]=e.getBooleanTerm(t.deleteid);t["readid"]=e.getBooleanTerm(t.readid);t["shareid"]=e.getBooleanTerm(t.shareid);t["updateid"]=e.getBooleanTerm(t.updateid)})}else a.getData()[0].PageAccess=[];var i=new sap.ui.model.json.JSONModel(a.getData()[0].PageAccess);e.getView().byId("pagesAccessId").setModel(i);if(a.getData()[0].ModelAccess){a.getData()[0].ModelAccess.forEach(function(t){t["createid"]=e.getBooleanTerm(t.createid);t["deleteid"]=e.getBooleanTerm(t.deleteid);t["readid"]=e.getBooleanTerm(t.readid);t["shareid"]=e.getBooleanTerm(t.shareid);t["updateid"]=e.getBooleanTerm(t.updateid)})}else a.getData()[0].ModelAccess=[];var n=new sap.ui.model.json.JSONModel(a.getData()[0].ModelAccess);e.getView().byId("pagesAccessId2").setModel(n)}});e.handleSaveCancelButton(false)}}})},handleInvalidSession:function(){var e=this;e.getView().getModel("appView").setProperty("/layout","OneColumn");var t=sap.ui.core.UIComponent.getRouterFor(e);t.navTo("login");function s(){window.history.forward()}setTimeout("preventBack()",0);window.onunload=function(){null};window.localStorage.removeItem("loginDetails")},handleDeleteUserPress:function(){var e=this;this.getView().setBusy(true);s.confirm("Are you sure want to delete a user?",{onClose:function(t){if(t=="OK"){var a=e.userId;$.post(e.destination+"/UM/deleteuser?param1="+a,{id:e.getView().getBindingContext("usersList").getObject()._id},function(t){if(t=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(t){if(t=="OK"){e.handleInvalidSession()}}})}else if(t=="okk"){e.getView().setBusy(false);e.getOwnerComponent().getModel("usersList").getData().splice(e.userItemIndex,1);var a=sap.ui.core.UIComponent.getRouterFor(e);a.navTo("usersMaster");e.getOwnerComponent().getModel("usersList").updateBindings(true);s.success("User deleted successfully");e.getView().getModel("appView").setProperty("/layout","OneColumn")}else e.getView().setBusy(false)})}else e.getView().setBusy(false)}})},handleEditUserPress:function(){this.valueHelpForNewUser.getContent()[2].setVisible(true);this.valueHelpForNewUser.getContent()[1].setVisible(false);this.valueHelpForNewUser.getContent()[0].setVisible(false);this.valueHelpForNewUser.getContent()[2].setTitle("Edit User");var e=this.getView().getBindingContext("usersList").getObject();this.valueHelpForNewUser.getContent()[2].getContent()[1].setValue(e.firstname);this.valueHelpForNewUser.getContent()[2].getContent()[3].setValue(e.lastname);this.valueHelpForNewUser.getContent()[2].getContent()[5].setValue(e.user_emailid);this.valueHelpForNewUser.getContent()[2].getContent()[7].setValue(e.contactnumber);this.valueHelpForNewUser.getContent()[2].getContent()[9].setSelectedKey(e.roleid);this.valueHelpForNewUser.setTitle("Edit User");this.valueHelpForNewUser.open()},handleAddUserOkPress:function(){var e=this;if(this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue().length==0||this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue().length==0){s.error("Please fill the mandatory fileds")}else{this.userObj={id:this.userId,firstname:this.valueHelpForNewUser.getContent()[2].getContent()[1].getValue(),lastname:this.valueHelpForNewUser.getContent()[2].getContent()[3].getValue(),password:"Vaspp@123",organisationid:this.getView().getModel("appView").getProperty("/loginDetails/0/organisation/_id"),roleid:this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()._id,typevalue:this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getText(),user_emailid:this.valueHelpForNewUser.getContent()[2].getContent()[5].getValue(),contactnumber:this.valueHelpForNewUser.getContent()[2].getContent()[7].getValue(),verified:"1",createdate:(new Date).toJSON(),modifydate:(new Date).toJSON()};var t=this.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject()._id;var a=this.getView().getModel("appView").getProperty("/loginDetails/0/organisation/_id");var i=this.userId;$.post(e.destination+"/UM/edituser?param1="+t+"&param2="+a+"&param3="+i,this.userObj,function(t){if(t=="Invalid Session"){s.information("Your session has expired. Please log in again.",{onClose:function(t){if(t=="OK"){e.handleInvalidSession()}}})}else if(t=="ok"){s.success("User Edited Successfully");e.userObj["roletype"]=e.valueHelpForNewUser.getContent()[2].getContent()[9].getSelectedItem().getBindingContext("rolesDetails").getObject().type;e.userObj["_id"]=e.userId;e.getView().getModel("usersList").getData()[e.userItemIndex]=e.userObj;e.getView().getModel("usersList").updateBindings(true)}else{s.error(JSON.parse(t).status)}});this.valueHelpForNewUser.close()}},handleAddUserCancelPress:function(){this.valueHelpForNewUser.close()},handleChangeUsersCreate:function(e){if(e.getParameter("item").getText()=="Create User"){this.valueHelpForNewUser.getContent()[2].setVisible(true);this.valueHelpForNewUser.getContent()[1].setVisible(false)}else{this.valueHelpForNewUser.getContent()[2].setVisible(false);this.valueHelpForNewUser.getContent()[1].setVisible(true)}},onCloseDetailPress:function(){var e=this.getView().getModel("appView").getProperty("/actionButtonsInfo/midColumn/closeColumn");this.getView().getModel("appView").setProperty("/actionButtonsInfo/midColumn/closeColumn",!e);this.getView().getModel("appView").setProperty("/layout","OneColumn");var t=sap.ui.core.UIComponent.getRouterFor(this);t.navTo("usersMaster")},handleAccessPressed:function(e){this.handleSaveCancelButton(true);var t=e.getSource().getBindingContext().sPath.split("/")[1];var s=e.getSource().getId();if(s.includes("createid"))e.getSource().getParent().getParent().getModel().oData[t].createid=e.getSource().getSelected();else if(s.includes("readid"))e.getSource().getParent().getParent().getModel().oData[t].readid=e.getSource().getSelected();else if(s.includes("updateid"))e.getSource().getParent().getParent().getModel().oData[t].updateid=e.getSource().getSelected();else if(s.includes("deleteid"))e.getSource().getParent().getParent().getModel().oData[t].deleteid=e.getSource().getSelected();else if(s.includes("shareid"))e.getSource().getParent().getParent().getModel().oData[t].shareid=e.getSource().getSelected();e.getSource().getModel().updateBindings(true)},handleListPageSelected:function(e){this.selectedPages.push(e.getParameter("listItem"))},handleListModelSelected:function(e){this.selectedModels.push(e.getParameter("listItem"))},handleAddModelsDialogCancel:function(e){this.addModels.close()},handleDeleteModels:function(e){var t=this.getView().byId("pagesAccessId2").getSelectedItems();if(t.length>0){for(var a=t.length-1;a>=0;a--){for(var i=this.getView().byId("pagesAccessId2").getModel().oData.length-1;i>=0;i--){if(t[a].getBindingContext().getObject().modelName==this.getView().byId("pagesAccessId2").getModel().oData[i].modelName&&t[a].getBindingContext().getObject().db==this.getView().byId("pagesAccessId2").getModel().oData[i].db){if(t[a].getBindingContext().getObject()._id){this.deletedModels.push(t[a].getBindingContext().getObject()._id)}this.getView().byId("pagesAccessId2").getModel().oData.splice(i,1);break}}}this.getView().byId("pagesAccessId2").getModel().updateBindings(true);this.getView().byId("pagesAccessId2").removeSelections(false);this.handleSaveCancelButton(true)}else{s.error("Please select an item to delete")}this.getView().getModel().updateBindings(true)}})});