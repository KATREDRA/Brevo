jQuery.sap.declare("ibrevoVDT.js.excelgrid");
sap.ui.core.HTML.extend("ExcelGrid",
    {
    metadata:
    {
        properties :
        {
            "options":"object",
            "data":"object",
            "content": {type : "string", defaultValue : "<div></div>"},
            "preferDOM": {type : "boolean", defaultValue : false}
        }
    },
    init: function(){
              this.attachAfterRendering(function(e){
             
                  var constructorOptions = this.getOptions();
                      constructorOptions.data = this.getData();
           
                      this.$().handsontable(constructorOptions);
                   });
   
            },
       
    getInstance: function(){
        return this.$().handsontable('getInstance');
    },
           
    renderer: "sap.ui.core.HTMLRenderer"
    });