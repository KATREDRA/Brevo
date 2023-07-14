// Assign the required packages and dependencies to variables
var express = require('express');
var ODataServer = require("simple-odata-server");
var msqlAdapter = require('./mysqlAdapter')
var mongoAdapter = require('simple-odata-server-mongodb');
var mysql = require('mysql');
var MongoClient = require('mongodb').MongoClient;
var cors = require("cors");
var bodyParser = require('body-parser');
var parser = require('odata-parser')
var url = require('url')
var querystring = require('querystring')
const {ObjectId} = require('mongodb').ObjectId;
var UMServer = require('./UserManagerment.js')
// Load the Snowflake Node.js driver.
var snowflake = require('snowflake-sdk');

let cookieParser = require('cookie-parser'); 
var request = require('request');
var Session = require('./Session.js')
var DataAccess = require('./DataAccess.js')
// Create app variable to initialize Express 
var app = express();
app.use(express.static('./'));
app.use(express.static('Brevo_V3'));
app.use(express.static('UserManagerment'));
app.use(express.static('Brevo_DTree'));
app.use(express.static('QueryBuilder'));
// Enable Cross-origin resource sharing (CORS)  for app.

app.use(bodyParser.json({limit: "100mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit:50000}));
app.use(cors());
app.use(express.json());
app.use(cookieParser()); 
var MongoURL = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/"
MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
	if(err){
		//console.log("err");
	}else{
		dbo = db.db("BrevoV3")
   	 	dbo.collection("Session").createIndex( { "expireAt": 1 }, { expireAfterSeconds: 3600 } )
    } 
});

// Define Odata model of the resource entity i.e. Product. 
// The metadata is defined using OData type system called the Entity Data Model (EDM),
// consisting of EntitySets, Entities, ComplexTypes and Scalar Types.
var MongoModel = {
    namespace: "BrevoV3",
    entityTypes: {
        "OVPPageConfig": {
        	"_id":{"type": "Edm.String"},
            "Page_Id": {"type": "Edm.Int32", key: true},        
            "Roleflag": {"type": "Edm.String"},
            "createdTime": {"type": "Edm.String"},  
            "createdDate": {"type": "Edm.String"}, 
            "CreatedBy":{"type":"Edm.String"},
            "CONFIGURATION":{"type":"Edm.String"},
            "Lastchanged": {"type": "Edm.String"},  
            "FavoriteFlag": {"type": "Edm.Boolean"},  
            "NoOfCounts": {"type": "Edm.Int32"},
            "NoOfLikes": {"type": "Edm.Int32"},
            "link":{"type":"Edm.String"},
            "template":{"type":"Edm.String"},
            "AssetId":{"type":"Edm.Int32"},
            "MimeType":{"type":"Edm.String"},
            "Saved":{"type":"Edm.String"},
            "PageTitle":{"type":"Edm.String"},
            "SubTitle":{"type":"Edm.String"},
            "TypeOfPage":{"type":"Edm.String"},
            "PageDescrpition":{"type":"Edm.String"},
            "CardConfiguration":{"type":"Edm.String"},
            "ReportConfigSet":{"type":"Edm.String"},
            "KPIConfigSet":{"type":"Edm.String"},
            "type":"service"         
        },
        "CardConfiguration": {
        	"_id":{"type": "Edm.String"},
            "Page_Id": {"type": "Edm.Int32"},
            "Configid": {"type": "Edm.Int32", key: true},        
            "createdTime": {"type": "Edm.String"},  
            "createdDate": {"type": "Edm.String"}, 
            "CreatedBy":{"type":"Edm.String"},
            "Configuration": {"type": "Edm.String"},
            "type":"service"                      
        },
        "ReportConfigSet":{
        	"_id":{"type": "Edm.String"},
            "Page_Id": {"type": "Edm.Int32"},        
            "createdTime": {"type": "Edm.String"},  
            "createdDate": {"type": "Edm.String"}, 
            "CreatedBy":{"type":"Edm.String"},
            "RepConfig": {"type": "Edm.Int32"},
            "RepId":{"type": "Edm.String", key: true},
            "KpiId":{"type":"Edm.Int32"},
            "TypeOfReport":{"type":"Edm.String"},
            "type":"service"         
        },
        "KPIConfigSet":{
        	"_id":{"type": "Edm.String"},
            "Page_Id": {"type": "Edm.Int32"},        
            "createdTime": {"type": "Edm.String"},  
            "createdDate": {"type": "Edm.String"}, 
            "CreatedBy":{"type":"Edm.String"},
            "KpiConfig": {"type": "Edm.String"},
            "RepId":{"type": "Edm.Int32"},
            "KpiId":{"type":"Edm.Int32", key: true},
            "PageTitle":{"type":"Edm.String"},
            "type":"service"         
        },
        "Themes":{
        	"_id":{"type": "Edm.String"},
            "ThemeId": {"type": "Edm.Int32", key: true},        
            "ThemeName": {"type": "Edm.String"},  
            "BackgroundColor": {"type": "Edm.String"}, 
            "Basecolor":{"type":"Edm.String"},
            "BrandColor": {"type": "Edm.String"},
            "HighlightColor":{"type": "Edm.String"},
            "ShellHeaderColor":{"type":"Edm.String"},
            "TestColor":{"type":"Edm.String"},
            "BackgroundImage":{"type":"Edm.String"},
            "CompanyLogo":{"type":"Edm.String"},
            "type":"service"         
        },
        "comments":{
        	"_id":{"type": "Edm.String"},
            "CommentId": {"type": "Edm.Int32", key: true},        
            "ScenId": {"type": "Edm.Int32"},  
			"VariantId": {"type": "Edm.Int32"},
			"VariantName": {"type": "Edm.String"},
            "CreatedDate": {"type": "Edm.String"}, 
            "CreatedTime":{"type":"Edm.String"},
            "CommentDesc": {"type": "Edm.String"},
            "CreatedBy":{"type": "Edm.String"},
			"Filter":{"type":"Edm.String"},
            "type":"service"         
         },
        "Assets":{
        	"_id":{"type": "Edm.String"},
            "AssetId": {"type": "Edm.Int32", key: true},        
            "AssetTitle": {"type": "Edm.String"},  
            "AssetDesc": {"type": "Edm.String"}, 
            "Link":{"type":"Edm.String"},
            "Tags": {"type": "Edm.String"},
            "CreatedBy":{"type": "Edm.String"},
            "Groups": {"type": "Edm.String"},
            "ImageUpload": {"type": "Edm.String"},
            "Template": {"type": "Edm.String"},
            "type":"service"         
         },
         "Scenarios":{
        	"_id":{"type": "Edm.String"},
            "ScenId": {"type": "Edm.Int32", key: true},        
            "ListId": {"type": "Edm.Int32"}, 
			"Page_Id": {"type": "Edm.Int32"},  
            "ScenName": {"type": "Edm.String"}, 
            "ScenConfig":{"type":"Edm.String"},
            "RoleFlag": {"type": "Edm.String"},
            "Filter":{"type": "Edm.String"},
            "temp":{"type": "Edm.String"},
            "CreatedBy":{"type": "Edm.String"},
            "VariantSettings":{"type": "Edm.String"},
            "Variants":{"type": "Edm.String"},
            "type":"service"         
         },
         "Variants":{
        	"_id":{"type": "Edm.String"},
            "VariantId": {"type": "Edm.Int32", key: true},        
            "ScenId": {"type": "Edm.Int32"},
			"Page_Id": {"type": "Edm.Int32"},  
			"VariantName":{"type": "Edm.String"},
            "SegmentSelection": {"type": "Edm.String"}, 
            "CreatedTime":{"type":"Edm.String"},
            "CreatedDate": {"type": "Edm.String"},
            "CreatedBy":{"type": "Edm.String"},
            "MeasureTree":{"type": "Edm.String"},
            "SegmentTree":{"type": "Edm.String"},
            "HiddenNotes":{"type": "Edm.String"},
            "Filter":{"type": "Edm.String"},
            "VariantSelection":{"type": "Edm.String"},
            "RoleFlag":{"type": "Edm.String"},
            "type":"service"         
         }
    },   
    entitySets: {
        "OVPPageConfig": {
            entityType: "BrevoV3.OVPPageConfig",
            type:"service"
        },
        "CardConfiguration": {
            entityType: "BrevoV3.CardConfiguration",
            type:"service"
        },
        "ReportConfigSet": {
            entityType: "BrevoV3.ReportConfigSet",
            type:"service"
        },
        "KPIConfigSet":{
        	entityType: "BrevoV3.KPIConfigSet",
            type:"service"
        },
        "Themes":{
        	entityType: "BrevoV3.Themes",
            type:"service"
        },
        "comments":{
        	entityType: "BrevoV3.comments",
            type:"service"
        },
        "Assets": {
            entityType: "BrevoV3.Assets",
            type:"service"
        },
        "Scenarios":{
        	entityType: "BrevoV3.Scenarios",
            type:"service"
        },
        "Variants":{
        	entityType: "BrevoV3.Variants",
            type:"service"
        }
    }
};

// Instantiates ODataServer and assigns to odataserver variable.
var odataMongoServer = ODataServer().model(MongoModel);

// Connection to demo database in MongoDB
MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
	if(err){
		console.log(err);
	}else{
   	 	odataMongoServer.adapter(mongoAdapter(function(cb) { 
        cb(err, db.db('BrevoV3')); 
    })); 
   	 }
});

// The directive to set app route path.
app.use("/odata/mongodb", function (req, res) {
	console.log(req.cookies.session)
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity)
					odataMongoServer.handle(req, res);
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
    });

var UMServer = UMServer()

app.use("/UM", function(req, res){
	console.log("UM");
	if(req.url.indexOf("/loginuser") != -1){
		console.log("login")
		UMServer.handle(req, res);
	}else
		if(req.cookies.session)
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					UMServer.handle(req, res);
				}
				else
					res.end("Invalid Session")
			})
		else
			res.end("Invalid Session")
})

var mysqlModel = {
	namespace:"node_test",
	entityTypes:{
		"test":{
			"Id":{"type":"Edm.Int32", key: true},
			"Name":{"type":"Edm.String"},
			"Category":{"type":"Edm.String"},
			"Quantity":{"type":"Edm.String"},
		}
	},
	entitySets:{
		"test":{
			entityType:"node_test.test",
            type:"table"
		}
	}
}

var odataMysqlServer = ODataServer().model(mysqlModel);

var Mysqlconnection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'Init2019',
	database:'node_test'
});
Mysqlconnection.connect(function(err){
	if(err)
	{
		//console.log(err);
		
		
	}
	odataMysqlServer.adapter(msqlAdapter(function(cb){
		cb(err, Mysqlconnection);
	}))
});
setInterval(keepAlive, 8000000);
function keepAlive() {
    Mysqlconnection.query('SELECT * from test');
    console.log("Fired Keep-Alive");
    return;
}
 app.use("/odata/mysql", function(req, res){
 	odataMysqlServer.handle(req, res);
 })

// Create a Connection object that we can use later to connect.
var connection = snowflake.createConnection( {
    account: "zk10159.eu-central-1",
    username: "KAVYA",
    password: "Init2020"
//     database:"TEST",
//     schema:"TEST",
//     role:"ACCOUNTADMIN"
});


function createConnection(callBack){
// Try to connect to Snowflake, and check whether the connection was successful.
connection.connect( 
    function(err, conn) {
        if (err) {
            console.error('Unable to connect: ' + err.message);
//             return true;
            } 
        else {
            console.log('Successfully connected to Snowflake.'+conn.toString());
            // Optional: store the connection ID.
//             connection_ID = conn.getId();
//             return false;
//             callBack();
          
            
    	 }
    }
);
}

function destroyConnection(){
	connection.destroy(function(err, conn) {
 				 if (err) {
   					 console.error('Unable to disconnect: ' + err.message);
 				 } else {
   					 console.log('Disconnected connection with id: ' + connection.getId());
  				}
			});
}

function tableExists(tableName, fields,data, callBack){
	connection.execute({
  		sqlText: "SELECT * FROM \"PS_DATA\".\"TEST\".\""+tableName+"\"",
  		streamResult: true, // prevent rows from being returned inline in the complete callback
  		complete: function(err, stmt, rows) {
  			if(err){
  				console.log(err.message)
  				callBack(tableName, fields,data);
  			}
  			else{
  				connection.execute({
  			sqlText: "DROP TABLE \"PS_DATA\".\"TEST\".\""+tableName+"\"",
  			complete:function(err, stmt, rows){
  				if (err) {
      				console.error('Failed to execute statement due to the following error: ' + err.message);
      				return false;
    			} else {
     			 	console.log('Successfully executed statement: ' + stmt.getSqlText());
     			 	callBack(tableName, fields,data);
    			}
  			}
  		});

  			}
  		}
  	});
}

// function createTable(tableName, fields){
// 	if(tableExists(tableName)){
// 		connection.execute({
//   			sqlText: "DROP TABLE "+tableName,
//   			complete:function(err, stmt, rows){
//   				if (err) {
//       				console.error('Failed to execute statement due to the following error: ' + err.message);
//       				return false;
//     			} else {
//      			 	console.log('Successfully executed statement: ' + stmt.getSqlText());
//      			 	return true;
//     			}
//   			}
//   		});
// 	}
// 	var stmt = "CREATE TABLE \""+tableName+"\" ( ";
// 	data="";
// 	for(var i=0; i<fields.length; i++){
// 		if(i==0)
// 			data = data+fields[i].FieldName+" "+fields[i].dataType;
// 		else
// 			data = data+", "+fields[i].FieldName+" "+fields[i].dataType;
// 	}
// 	stmt = stmt+data+")";
// 	console.log(stmt);
// 	connection.execute({
//   		sqlText: stmt,
//   		complete:function(err, stmt, rows){
//   			if (err) {
//       			console.error('Failed to execute statement due to the following error: ' + err.message);
//       			return false;
//     		} else {
//      		 	console.log('Successfully executed statement: ' + stmt.getSqlText());
//      		 	return true;
//     		}
//   		}
//   	});
// 	
// }

function createTable(source, tableName, fields,fieldData, res){
	tableExists(tableName,fields,fieldData, function(tableName, fields, fieldData){
	var database = "PS_DATA";
	if(source == "Brevo")
		database = "SPREADSHEETS";
	var stmt = "CREATE TABLE \""+database+"\".\"TEST\".\""+tableName+"\" ( ";
	data="";
	for(var i=0; i<fields.length; i++){
		if(i==0)
			data = data+fields[i].FieldName+" "+fields[i].dataType;
		else
			data = data+", "+fields[i].FieldName+" "+fields[i].dataType;
	}
	stmt = stmt+data+")";
// 	console.log(stmt);
	connection.execute({
  		sqlText: stmt,
  		complete:function(err, stmt, rows){
  			if (err) {
      			console.error('Failed to execute statement due to the following error: ' + err.message);
      			return false;
    		} else {
     		 	console.log('Successfully executed statement: ' + stmt.getSqlText());
     		 	
     		 	insertData(database,tableName, fields, fieldData, res)
    		}
  		}
  	});
	});
}



function insertData(database,tableName,fields, data, res){
// console.log(fields)
	var Values = "";
	var column = "( ";
	var keys = Object.keys(data[0]);
	for(var i=0; i<fields.length; i++){
		if(i==0)
			column = column+fields[i].FieldName;
		else
			column = column+", "+fields[i].FieldName;
	}
	column= column+" )";
// 	console.log(typeof(data))
	for (var i=0; i<data.length; i++){
		if(i==0)
			Values = Values+"( ";
		else
			Values = Values+",  (";
		// console.log(data[i])
		for(var j=0; j<keys.length; j++){
			var field = keys[j];
			if(j==0)
			{
				if(fields[j].dataType == "VARCHAR(255)")
					Values = Values +"'" +data[i][keys[j]]+"'";
				else
					Values = Values +data[i][keys[j]];
			}
			else{
			console.log(fields[j].sataType)
				if(fields[j].dataType == "VARCHAR(255)")
					Values = Values+", '" + data[i][keys[j]]+"'";
				else
					Values = Values+", " + data[i][keys[j]];
			}
		}
		Values = Values + ")"
	}
	var stmt = "INSERT INTO \""+database+"\".\"TEST\".\""+tableName+"\" "+ column + " VALUES "+ Values;
	console.log(stmt)
	connection.execute({
  		sqlText: stmt,
  		complete:function(err, stmt, rows){
  			if (err) {
      			console.error('Failed to execute statement due to the following error: ' + err.message);
      			res.end(JSON.stringify({insert:false}));
    		} else {
     		 	console.log('Successfully executed statement: ' + stmt.getSqlText());
     		 	if(database == "PS_DATA"){
     		 		connection.execute({
  						sqlText: "CREATE VIEW \"_SYS_BIC\".\"TEST\".\""+tableName+"\" AS (SELECT * FROM \"PS_DATA\".\"TEST\".\""+tableName+"\")",
  						complete:function(err, stmt, rows){
  							if (err) {
      							console.error('Failed to execute statement due to the following error: ' + err.message);
      							res.end(JSON.stringify({insert:false}));
    						} else {
     						 	console.log('Successfully executed statement: ' + stmt.getSqlText());
     		 	
     		 					res.end(JSON.stringify({insert:true}));
    						}
  						}
  					});
  				}
  				else{
  					res.end(JSON.stringify({insert:true}));
  				}
     		 	
    		}
  		}
  	});
}


function getTableData(source, tableName, res){
	var database = "PS_DATA";
	if(source == "Brevo")
		database = "SPREADSHEETS";
	connection.execute({
  		sqlText: "SELECT * FROM \""+database+"\".\"TEST\".\""+tableName+"\"",
// 		sqlText:"Select * from \"OCT Monthly Report\"",
  		complete: function(err, stmt, rows) {
  			if(err){
  				console.log(err.message);
  			}
  			else{
  				console.log('Successfully executed statement: ' + stmt.getSqlText());
  				console.log(rows.length)
  				console.log(err)
     			res.end(JSON.stringify(rows));
  			}
  		}
  	});
}

// app.post("/:source/FileUploader", function (req, res) {
	// var params = req.body;
	
	// //params = JSON.parse(params);
		// console.log("Hello")
		// var keys = Object.keys(params.data[0]);
		// var fields = [];
		// for(var i=0; i<keys.length; i++){
			// var dataType = "VARCHAR(255)";
			// try{
				// var value = params.data[0][keys[i]];
				// var isNumeric = isNaN(value);
				// if(!isNumeric)
					// dataType = value % 1 != 0?"DOUBLE":"INT";
			
			// }catch(e){
				// dataType = "VARCHAR(255)";
			// }
			// fields.push({FieldName: keys[i].toUpperCase().trim().split('&').join('and').split('/').join('-').split(' ').join('_'), dataType:dataType})
		// }
		// var table = createConnection();
		// function waitFunc(){
			// createTable(req.params.source, params.FileName, fields, params.data, res);
		// }
		// setTimeout(waitFunc, 1500);
	
// });

// app.get("/:source/FileUploader", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// getTableData(req.params.source, params.FileName, res);
	// }
	// setTimeout(waitFunc, 1500);
	
// });

// app.get("/Tables", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// connection.execute({
  		// sqlText: "SELECT TABLE_NAME FROM PS_DATA.INFORMATION_SCHEMA.tables WHERE table_schema = 'TEST' AND table_type = 'BASE TABLE'",
  		// complete: function(err, stmt, rows) {
  			// if(err){
  				// console.log(err.message);
  			// }
  			// else{
  				// console.log('Successfully executed statement: ' + stmt.getSqlText());
     			// res.end(JSON.stringify(rows));
  			// }
  		// }
  	// });
	// }
	// setTimeout(waitFunc, 1500);
	
// });

// app.get("/Views", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// connection.execute({
  		// sqlText: "SELECT TABLE_NAME FROM _SYS_BIC.INFORMATION_SCHEMA.tables WHERE table_schema = 'TEST' AND table_type = 'VIEW'",
  		// complete: function(err, stmt, rows) {
  			// if(err){
  				// console.log(err.message);
  			// }
  			// else{
  				// console.log('Successfully executed statement: ' + stmt.getSqlText());
     			// res.end(JSON.stringify(rows));
  			// }
  		// }
  	// });
	// }
	// setTimeout(waitFunc, 1500);
	
// });  


// app.get("/ColumnsOfTable", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// connection.execute({
  		// sqlText: "select COLUMN_NAME, DATA_TYPE from _SYS_BIC.information_schema.columns where table_name = '"+params.FileName+"'",
  		// complete: function(err, stmt, rows) {
  			// if(err){
  				// console.log(err.message);
  			// }
  			// else{
  				// console.log('Successfully executed statement: ' + stmt.getSqlText());
  				// for(var i=0; i<rows.length; i++){
  					// if(rows[i].DATA_TYPE == "TEXT")
  						// rows[i].DATA_TYPE = "NVARCHAR";
  					// else if(rows[i].DATA_TYPE == "NUMBER")
  						// rows[i].DATA_TYPE = "INT";
  					// else if(rows[i].DATA_TYPE == "FLOAT")
  						// rows[i].DATA_TYPE = "DECIMAL";
  				// }
     			// res.end(JSON.stringify(rows));
  			// }
  		// }
  	// });
	// }
	// setTimeout(waitFunc, 1500);
// })

// app.get("/ColumnsOfView", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// connection.execute({
  		// sqlText: "select COLUMN_NAME, DATA_TYPE from PS_DATA.information_schema.columns where table_name = '"+params.FileName+"'",
  		// complete: function(err, stmt, rows) {
  			// if(err){
  				// console.log(err.message);
  			// }
  			// else{
  				// console.log('Successfully executed statement: ' + stmt.getSqlText());
  				// for(var i=0; i<rows.length; i++){
  					// if(rows[i].DATA_TYPE == "TEXT")
  						// rows[i].DATA_TYPE = "NVARCHAR";
  					// else if(rows[i].DATA_TYPE == "NUMBER")
  						// rows[i].DATA_TYPE = "INT";
  					// else if(rows[i].DATA_TYPE == "FLOAT")
  						// rows[i].DATA_TYPE = "DECIMAL";
  				// }
     			// res.end(JSON.stringify(rows));
  			// }
  		// }
  	// });
	// }
	// setTimeout(waitFunc, 1500);
// })


app.post("/login", function(req, res){
	console.log("login")
	data = req.body
	if(data.userId && data.password){
		MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
			if(err){
				res.end(JSON.stringify({login:false,"Error":"Connection Error"}))
			}else{
				var dbo = db.db("UserManagement_brevo");
				dbo.collection("user").findOne({user_emailid:data.userId, password:data.password}, function(err, result){
					if (err)
						res.end(JSON.stringify({login:false,"Error":err.toString()}))
					else{
						if(result == null)
							res.end(JSON.stringify({login:false,"Error":"Authentication Error"}))
						else{
							console.log("Login")
							var sessionKey = Session.createSession(result._id, function(sessionKey){
								if(sessionKey){
									res.cookie("session", {userid:result._id,sessionkey:sessionKey});
									res.end(JSON.stringify({login:true,"key":sessionKey}))
								}else
									res.end(JSON.stringify({login:false,"Error":"Session Error"}))
							})
							
							
						}
					}
				})
			}
		});
	}
})

app.post("/logout",function(req, res){
	console.log("logout")
	console.log(req.cookies)
	if(req.cookies.session)
		Session.deleteSession(req.cookies.session.sessionkey, function(flag){
				res.clearCookie("session")
				res.end(JSON.stringify({"logout":flag}))
		})
	else
		res.end(JSON.stringify({"logout":true}))
})

app.get("/UserDet",function(req, res){
	console.log("UserDet")
	if (req.cookies.session){
		Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
			if (sessionValidity){
				MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
					if(err){
						res.end(JSON.stringify({status:"Error","msg":"Connection Error"}))
					}else{
						var dbo = db.db("UserManagement_brevo");
						dbo.collection("user").findOne({_id:ObjectId(req.cookies.session.userid)}, function(err, result){
							if (err)
								res.end(JSON.stringify({status:"Error","msg":err.toString()}))
							else{
								res.end(JSON.stringify({status:"Success", data:result}))
							}
						})
					}
				})
			}
			else{
				res.end("Invalid Session")
			}
		})
	}else{
		res.end("Invalid Session")
	}
})

// app.post("/callPython", function(req, res){
	// console.log(req.body)
	// const spawn = require("child_process").spawn;
	
	// const pythonProcess = spawn('python',["test.py", req.body.data ]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// res.end(data);
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data)
		// res.end(data);
	// });
// });
	
// app.get("/TableData", function (req, res) {
	// var collection = req.query.fileName;
	// var result;
	// var queryOptions = {
    // $filter: {}
  // }
	// var sqlQuery = {}
  // var _url = url.parse(req.url, true)
  // if (_url.search) {
    // var query = _url.query
	// sqlQuery = query
    // var fixedQS = {}
    // if (query.$) fixedQS.$ = query.$
    // if (query.$expand) fixedQS.$expand = query.$expand
    // if (query.$filter) fixedQS.$filter = query.$filter
    // if (query.$format) fixedQS.$format = query.$format
    // if (query.$inlinecount) fixedQS.$inlinecount = query.$inlinecount
    // if (query.$select) fixedQS.$select = query.$select
    // if (query.$skip) fixedQS.$skip = query.$skip
    // if (query.$top) fixedQS.$top = query.$top
    // if (query.$orderby) fixedQS.$orderby = query.$orderby
  // }
	// if(query.$filter){
		// query.$filter = query.$filter.replace(/eq/g, '==');
		// query.$filter = query.$filter.replace(/ne/g, '!=');
		// query.$filter = query.$filter.replace(/lt/g, '<');
		// query.$filter = query.$filter.replace(/gt/g, '>');
		// query.$filter = query.$filter.toUpperCase();
	// }else{
		// query.$filter = "undefined"
	// }
	// if(query.$select)
		// query.$select = query.$select.toUpperCase();
	// else
		// query.$select = "undefined"
	// if(query.$top)
		// query.$top = parseInt(query.$top);
	// else
		// query.$top = "undefined"
	// if(query.aggregation)
		// query.$aggregation = query.$aggregation.toUpperCase();
	// else
		// query.aggregation = "undefined"
	// // console.log(query.$select+" "+query.$filter+" "+query.$top+" "+query.$aggregation)
	// // var sql = "Select "+query.$select+" from "+collection+" where "+query.$filter+" limit "+query.$top;
	// const spawn = require("child_process").spawn;
	
	// const pythonProcess = spawn('python',["getData.py",collection, query.$select, query.$filter, query.$top, query.$aggregation]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		
		// try{
			
			// var result = JSON.parse(data.toString());
			// for(var i=0; i<result.length; i++){
				// result[i] = JSON.parse(result[i]);
				// // console.log(result[i])
			// }
			// res.end(JSON.stringify(result));
		// }
		// catch(e){
			// // console.log(e.toString())
		// }
	// });
	// pythonProcess.stdout.on('end', function(){
		// //console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data.toString())
		// // res.end(data.toString());
	// });
	
// });


// app.get("/TableData/:collection", function (req, res) {
	// var collection = req.params.collection;
	// var result;
	// var queryOptions = {
    // $filter: {}
  // }
	// var sqlQuery = {}
  // var _url = url.parse(req.url, true)
  // if (_url.search) {
    // var query = _url.query
	// sqlQuery = query
    // var fixedQS = {}
    // if (query.$) fixedQS.$ = query.$
    // if (query.$expand) fixedQS.$expand = query.$expand
    // if (query.$filter) fixedQS.$filter = query.$filter
    // if (query.$format) fixedQS.$format = query.$format
    // if (query.$inlinecount) fixedQS.$inlinecount = query.$inlinecount
    // if (query.$select) fixedQS.$select = query.$select
    // if (query.$skip) fixedQS.$skip = query.$skip
    // if (query.$top) fixedQS.$top = query.$top
    // if (query.$orderby) fixedQS.$orderby = query.$orderby
  // }
	// query.$filter = query.$filter.replace(/eq/g, '==');
	// query.$filter = query.$filter.replace(/ne/g, '!=');
	// query.$filter = query.$filter.replace(/lt/g, '<');
	// query.$filter = query.$filter.replace(/gt/g, '>');
	// query.$select = query.$select.toUpperCase();
	// query.$top = parseInt(query.$top);
	// query.$filter = query.$filter.toUpperCase();
	// query.$aggregation = query.$aggregation.toUpperCase();
	// console.log(query.$select+" "+query.$filter+" "+query.$top+" "+query.$aggregation)
	// // var sql = "Select "+query.$select+" from "+collection+" where "+query.$filter+" limit "+query.$top;
	// const spawn = require("child_process").spawn;
	
	// const pythonProcess = spawn('python',["getData.py",collection, query.$select, query.$filter, query.$top, query.$aggregation]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// console.log(data.toString())
		// try{
			
			// var result = JSON.parse(data.toString());
			// for(var i=0; i<result.length; i++){
				// result[i] = JSON.parse(result[i]);
				// console.log(result[i])
			// }
			// res.end(JSON.stringify(result));
		// }
		// catch(e){
			// console.log(e.toString())
		// }
	// });
	// pythonProcess.stdout.on('end', function(){
		// //console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// //console.log(data)
		// // res.end(data);
	// });
	
// });

// app.get("/ColumnsOfView", function(req, res){
	// var params = req.query;
	// var table = createConnection();
	// function waitFunc(){
		// connection.execute({
  		// sqlText: "select COLUMN_NAME, DATA_TYPE from PS_DATA.information_schema.columns where table_name = '"+params.FileName+"'",
  		// complete: function(err, stmt, rows) {
  			// if(err){
  				// console.log(err.message);
  			// }
  			// else{
  				// console.log('Successfully executed statement: ' + stmt.getSqlText());
  				// for(var i=0; i<rows.length; i++){
  					// if(rows[i].DATA_TYPE == "TEXT")
  						// rows[i].DATA_TYPE = "NVARCHAR";
  					// else if(rows[i].DATA_TYPE == "NUMBER")
  						// rows[i].DATA_TYPE = "INT";
  					// else if(rows[i].DATA_TYPE == "FLOAT")
  						// rows[i].DATA_TYPE = "DECIMAL";
  				// }
     			// res.end(JSON.stringify(rows));
  			// }
  		// }
  	// });
	// }
	// setTimeout(waitFunc, 1500);
// })

// app.post("/callPython", function(req, res){
	// console.log(req.body)
	// const spawn = require("child_process").spawn;
	
	// const pythonProcess = spawn('python',["test.py", req.body.data ]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// res.end(data);
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data)
		// res.end(data);
	// });
// });
	
// app.get("/TableData", function (req, res) {
	// var collection = req.query.FileName;
	// var result;
	// var queryOptions = {
    // $filter: {}
  // }
	// var sqlQuery = {}
  // var _url = url.parse(req.url, true)
  // if (_url.search) {
    // var query = _url.query
	// sqlQuery = query
    // var fixedQS = {}
    // if (query.$) fixedQS.$ = query.$
    // if (query.$expand) fixedQS.$expand = query.$expand
    // if (query.$filter) fixedQS.$filter = query.$filter
    // if (query.$format) fixedQS.$format = query.$format
    // if (query.$inlinecount) fixedQS.$inlinecount = query.$inlinecount
    // if (query.$select) fixedQS.$select = query.$select
    // if (query.$skip) fixedQS.$skip = query.$skip
    // if (query.$top) fixedQS.$top = query.$top
    // if (query.$orderby) fixedQS.$orderby = query.$orderby
  // }
  // if(query.$filter){
	// query.$filter = query.$filter.replace(/eq/g, '==');
	// query.$filter = query.$filter.replace(/ne/g, '!=');
	// query.$filter = query.$filter.replace(/lt/g, '<');
	// query.$filter = query.$filter.replace(/gt/g, '>');
	// query.$filter = query.$filter.toUpperCase();
  // }
  // if(query.$select)
	// query.$select = query.$select.toUpperCase();
  // if(query.$top)
	// query.$top = parseInt(query.$top);
  // if(query.$aggregation)
	// query.$aggregation = query.$aggregation.toUpperCase();
	// // console.log(query.$select+" "+query.$filter+" "+query.$top+" "+query.$aggregation)
	// // var sql = "Select "+query.$select+" from "+collection+" where "+query.$filter+" limit "+query.$top;
	// const spawn = require("child_process").spawn;
	
	// const pythonProcess = spawn('python',["getData.py",collection, query.$select, query.$filter, query.$top, query.$aggregation]);
	// console.log("test")
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// // console.log(data.toString())
		// try{
			
			// var result = JSON.parse(data.toString());
			// for(var i=0; i<result.length; i++){
				// result[i] = JSON.parse(result[i]);
				// // console.log(result[i])
			// }
			// res.end(JSON.stringify(result));
		// }
		// catch(e){
			// console.log(e.toString())
		// }
	// });
	// pythonProcess.stdout.on('end', function(){
		// console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// // console.log(data.toString())
		// res.end(data.toString());
	// });
	
// });


// app.post("/FileUploader", function (req, res) {
	// var params = req.body;
	// const spawn = require("child_process").spawn;
	// const pythonProcess = spawn('python',["1.py",JSON.stringify({fileName:params.fileName, data:params.data, agg:params.aggregationType})]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// console.log(data.toString())
		// res.end(JSON.stringify({insert:true, columnData:JSON.parse(data.toString())}));
	// });
	// pythonProcess.stdout.on('end', function(){
		// //console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data.toString())
		// res.end(JSON.stringify({insert:false, err:data.toString()}))
	// });
	
// });

// app.put("/FileUploader", function (req, res) {
	// var params = req.body;
	// const spawn = require("child_process").spawn;
	// const pythonProcess = spawn('python',["UpdateFile.py",JSON.stringify({fileName:params.fileName, coll_det:params.COLUMN_DET})]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// console.log(data.toString())
		// if(data == "Invalid Data")
			// res.end(JSON.stringify({update:false, err:data}))
		// else
			// res.end(JSON.stringify({update:true, columnData:JSON.parse(data.toString())}));
	// });
	// pythonProcess.stdout.on('end', function(){
		// //console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data.toString())
		// res.end(JSON.stringify({update:false, err:data.toString()}))
	// });
	
// });

// app.get("/FileUploader/Tables",function(req, res){
	// const spawn = require("child_process").spawn;
	// const pythonProcess = spawn('python',["getTables.py", req.query.$filter]);
	// pythonProcess.stdout.on('data', (data) => {
		// // Do something with the data returned from python script
		// console.log(data.toString())
		// res.end(data.toString());
	// });
	// pythonProcess.stdout.on('end', function(){
		// //console.log(result)
	// });
	// pythonProcess.stderr.on('data', (data) => {
		// console.log(data.toString())
		// res.end(data.toString())
	// });
// })


	//------------------------------------------------------------------------------------------------------------------------------------
	//Proxy calls for python services
	//------------------------------------------------------------------------------------------------------------------------------------
	
	app.get("/getData", function(req, res){
		console.log("getData")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					DataAccess.verifyModelReadAccess(req.cookies.session.userid, req.query.fileName, "fileuploader", function(access){
						if(access)
							request.get('http://127.0.0.1:5000/getData?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
							});
						else
							res.end("Access Denied")
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	
	app.get("/MeasureTree", function(req, res){
		console.log("MeasureTree")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					
					request.get('http://127.0.0.1:5000/MeasureTree?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/MeasureTree'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/FileUploader/Tables", function(req, res){
		console.log("FileUploader/Tables")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000//FileUploader/Tables?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
							// try{
									// body = JSON.stringify(body)
								// }
								// catch (e){
									// console.log(e.toString())
								// }
								body = JSON.parse(body)
								for(var i=0; i<body.length; i++){
									body[i].db = "fileuploader"
								}
							
							DataAccess.verifyModelsReadAccessFU(req.cookies.session.userid, body, function(result){
								
								res.end(JSON.stringify(result))							
							})
						}

					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/FileUploader/Tables'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/Forecast", function(req, res){
		console.log("Forecast")
				if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000/Forecast?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/Forecast'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/Report_MeasureDimensionSelection", function(req, res){
		console.log("Report_MeasureDimensionSelection")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000/FileUploader/Tables?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/Report_MeasureDimensionSelection'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/Report_VariantComparision", function(req, res){
		console.log("Report_VariantComparision")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000/Report_VariantComparision?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/Report_VariantComparision'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/Report_KeyInfluencers", function(req, res){
		console.log("Report_KeyInfluencers")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000/Report_KeyInfluencers?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")		
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/Report_KeyInfluencers'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.get("/SegmentTree", function(req, res){
		console.log("SegmentTree")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.get('http://127.0.0.1:5000/SegmentTree?'+req.url.split("?")[1], (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/SegmentTree'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(data)
			// });
		// }
	})
	
	app.post("/FileUploader", function(req,res){
		console.log("FileUploaderPost")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err,db){
						if(err)
							res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
						else{
							var dbo = db.db("UserManagement_brevo");
							dbo.collection("useraccessmodulepermission").find({modelName:req.body.fileName.split(" ").join("_"),db:"fileuploader"}).toArray(function(err, access){
								if(err)
									res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
								else
								{
									if(access.length>0){
										var create = 0
										for(var i=0; i<access.length; i++){
											if(access[i].userid.toString() == req.cookies.session.userid.toString() && access[i].createid == "true"){
												create = 1
												request.post('http://127.0.0.1:5000/FileUploader', {
													json: req.body
												}, (error, response, body) => {
													if (error) {
														res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
													}else{
														try{
															body = JSON.stringify(body)
														}
														catch (e){
															console.log(e.toString())
														}
														res.end(body)
													}
												})
												break;
											}
										}
										if(create == 0){
											res.end(JSON.stringify({'status':'Error', 'message':"Access Denied"}))
										}
									}else{
										request.post('http://127.0.0.1:5000/FileUploader', {
											json: req.body
										}, (error, response, body) => {
											if (error) {
												res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
											}
											MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
												if(err){
													res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
												}else{
													try{
														body = JSON.stringify(body)
													}
													catch (e){
														console.log(e.toString())
													}
													console.log(req.body)
													var dbo = db.db("UserManagement_brevo")
													var accessObj = {
														"modelName": req.body.fileName.split(" ").join("_"),
														"userid": ObjectId(req.cookies.session.userid),
														"db":"fileuploader",
														"createdate": new Date(),
														"modifydate": new Date(),
														"createid": "true",
														"readid": "true",
														"updateid": "true",
														"deleteid": "true",
														"shareid": "true"
													}
													dbo.collection("useraccessmodulepermission").insertOne(accessObj, function(err, result){
														if(err)
															res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
														else
															res.end(body)
													})
												}
											});
										});
									}
								}
							})
						}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
	app.put("/FileUploader", function(req,res){
		console.log("FileUploaderPut")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					DataAccess.verifyModelUpdateAccess(req.cookies.session.userid, req.body.fileName,"fileuploader", function(access){
						if(access)
							request.put('http://127.0.0.1:5000/FileUploader', {
								json: req.body
							}, (error, response, body) => {
								if (error) {
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								}
								try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
								res.end(body)
							})
						else
							res.end("Access Denied")
					})
					
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.put('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
	app.delete("/FileUploader", function(req,res){
		console.log("FileUploaderDel")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					console.log(req.body)
					DataAccess.verifyModelDeleteAccess(req.cookies.session.userid, req.body.fileName, 'fileuploader', function(access){
						console.log(access)
						if(access)
							request.delete('http://127.0.0.1:5000/FileUploader', {
								json: req.body
							}, (error, response, body) => {
								if (error) {
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								}
								try{
										console.log("Test")
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
								res.end(body)
							})
						else
							res.end("Access Denied")
					})
					
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.delete('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
//--------------------------------------------------------------------------------------------------------------------------------------------------
//Query Builder Services
//--------------------------------------------------------------------------------------------------------------------------------------------------
	app.get("/TableData", function(req, res){
		console.log("TableData")
		var params = req.query
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					DataAccess.verifyModelReadAccess(req.cookies.session.userid, params.table, params.db, function(access){
						if(access)
							request.get('http://127.0.0.1:5000/TableData?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
							});	
						else
							res.end("Access Denied")
					})
					
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	app.get("/TableMetadata", function(req, res){
		console.log("TableMetadata")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
				
							request.get('http://127.0.0.1:5000/TableMetadata?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
							});
						
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	
	app.get("/getAllTablesAndViews", function(req, res){
		console.log("getAllTablesAndViews")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					
							request.get('http://127.0.0.1:5000/getAllTablesAndViews?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									
									// try{
										// body = JSON.stringify(body)
									// }
									// catch (e){
										// console.log(e.toString())
									// }
									DataAccess.verifyModelsReadAccessQB(req.cookies.session.userid, body,  function(result){
										console.log(result)
										res.end(JSON.stringify(result))
									})
								}
							});
						
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	
	app.get("/database_list", function(req, res){
		console.log("database_list")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					
							request.get('http://127.0.0.1:5000/database_list?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
							});
						
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	
	
	app.post("/CreateView", function(req,res){
		console.log("CreateView")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/CreateView', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
								MongoClient.connect("mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/", function(err, db) {
									if(err){
										res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
									}else{
										try{
											body = JSON.stringify(body)
										}
										catch (e){
											console.log(e.toString())
										}
										console.log(req.body)
										dbo = db.db("UserManagement_brevo")
										var accessObj = {
											"modelName": req.body.view_name.split(" ").join("_"),
											"userid": ObjectId(req.cookies.session.userid),
											"db":"Brevo",
											"createdate": new Date(),
											"modifydate": new Date(),
											"createid": "true",
											"readid": "true",
											"updateid": "true",
											"deleteid": "true",
											"shareid": "true"
										}
										dbo.collection("useraccessmodulepermission").insertOne(accessObj, function(err, result){
											if(err)
												res.end(JSON.stringify({'status':'Error', 'message':err.toString()}))
											else
												res.end(body)
										})
									}
								});
									
							}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	app.post("/ValidateFormula", function(req,res){
		console.log("ValidateFormula")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/ValidateFormula', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
	app.post("/UpdateView", function(req,res){
		console.log("UpdateView")
		if (req.cookies.session){
			
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					DataAccess.verifyModelUpdateAccess(req.cookies.session.userid, req.body.view_name,"fileuploader", function(access){
						if(access)
							request.post('http://127.0.0.1:5000/UpdateView', {
								json: req.body
							}, (error, response, body) => {
								if (error) {
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								}
								try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
								res.end(body)
							})
						else
							res.end("Access Denied")
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
	app.post("/GetQuery", function(req,res){
		console.log("GetQuery")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/GetQuery', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	app.post("/DataPreview", function(req,res){
		console.log("DataPreview")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					try{
					request.post('http://127.0.0.1:5000/DataPreview', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
					}
					catch (e){
						console.log(e.toString())
					}
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	app.post("/ValidateQuery", function(req,res){
		console.log("ValidateQuery")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/ValidateQuery', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	
	app.post("/WizardDetail", function(req,res){
		console.log("WizardDetail")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/WizardDetail', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})
	app.post("/AddDepartment", function(req,res){
		console.log("AddDepartment")
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					request.post('http://127.0.0.1:5000/AddDepartment', {
						json: req.body
					}, (error, response, body) => {
						if (error) {
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						}
						else{
									try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									}
									res.end(body)
								}
					})
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// else{
			// request.post('http://127.0.0.1:5000/test', {
				// json: req.body
			// }, (error, res, body) => {
				// if (error) {
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// }
				// res.end(data)
			// })
		// }
	})


//------------------------------------------------------------------------------------------------------------------------------------------
// File Scheduler Service Calls
//------------------------------------------------------------------------------------------------------------------------------------------

	app.get("/fileTypeCategory", function(req, res){
		console.log("fileTypeCategoryGet")
		request.get('http://127.0.0.1:5000/fileTypeCategory?'+req.url.split("?")[1], (error, response, body) => {
			if(error)
					res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			else{
				// try{
						// body = JSON.stringify(body)
				// }
				// catch (e){
					// console.log(e.toString())
				// }
				res.end(body)
			}
		});
	})
	app.get("/fileTypeSubCategory", function(req, res){
		console.log("fileTypeSubCategoryGet")
		request.get('http://127.0.0.1:5000/fileTypeSubCategory?'+req.url.split("?")[1], (error, response, body) => {
			if(error)
					res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			else{
				// try{
						// body = JSON.stringify(body)
				// }
				// catch (e){
					// console.log(e.toString())
				// }
				res.end(body)
			}
		});
	})
	app.get("/getFileUploadDetails", function(req, res){
		console.log("getFileUploadDetails")
		request.get('http://127.0.0.1:5000/getFileUploadDetails?'+req.url.split("?")[1], (error, response, body) => {
			if(error)
					res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			else{
				// try{
						// body = JSON.stringify(body)
				// }
				// catch (e){
					// console.log(e.toString())
				// }
				res.end(body)
			}
		});
	})
	app.get("/fileUpload", function(req, res){
		console.log("fileUploadGet")
		request.get('http://127.0.0.1:5000/fileUpload?'+req.url.split("?")[1], (error, response, body) => {
			if(error)
					res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			else{
				// try{
						// body = JSON.stringify(body)
				// }
				// catch (e){
					// console.log(e.toString())
				// }
				res.end(body)
			}
		});
	})
	
	app.post("/run", function(req,res){
		console.log("run")
		request.post('http://127.0.0.1:5000/run', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.post("/fileTypeCategory", function(req,res){
		console.log("fileTypeCategoryPost")
		request.post('http://127.0.0.1:5000/fileTypeCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.put("/fileTypeCategory", function(req,res){
		console.log("fileTypeCategoryPut")
		request.put('http://127.0.0.1:5000/fileTypeCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.delete("/fileTypeCategory", function(req,res){
		console.log("fileTypeCategoryDel")
		request.delete('http://127.0.0.1:5000/fileTypeCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.post("/fileTypeSubCategory", function(req,res){
		console.log("fileTypeSubCategoryPost")
		request.post('http://127.0.0.1:5000/fileTypeSubCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.put("/fileTypeSubCategory", function(req,res){
		console.log("fileTypeSubCategoryPut")
		request.put('http://127.0.0.1:5000/fileTypeSubCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	app.delete("/fileTypeSubCategory", function(req,res){
		console.log("fileTypeSubCategoryDel")
		request.delete('http://127.0.0.1:5000/fileTypeSubCategory', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.post("/fileUpload", function(req,res){
		console.log("fileUploadPost")
		request.post('http://127.0.0.1:5000/fileUpload', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	app.put("/fileUpload", function(req,res){
		console.log("fileUploadPut")
		request.put('http://127.0.0.1:5000/fileUpload', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	app.delete("/fileUpload", function(req,res){
		console.log("fileUploadDel")
		request.delete('http://127.0.0.1:5000/fileUpload', {
			json: req.body
		}, (error, response, body) => {
			if (error) {
				res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
			}
			else{
				try{
					body = JSON.stringify(body)
				}
				catch (e){
					console.log(e.toString())
				}
				res.end(body)
			}
		})
		
	})
	
	app.post("/TempScenario", function(req,res){
		if (req.cookies.session){
			
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					var cardid = req.body.cardid
					console.log(cardid);
					MongoClient.connect(MongoURL, function(err, db){
						if(err)
							res.end(JSON.stringify({"status":"Error","msg":err.toString()}));
						else{
							dbo.collection("Scenarios").findOne({ScenId:parseInt(cardid)},function(err, scenario){
								if(err)
									res.end(JSON.stringify({"status":"Error","msg":err.toString()}));
								else{
									if(scenario != null)
										res.end(JSON.stringify({"status":"Success"}))
									else{
										var dbo = db.db("BrevoV3");
										dbo.collection("CardConfiguration").findOne({Configid:parseInt(cardid)},function(err, cardconfig){
											
											if(err)
												res.end(JSON.stringify({"status":"Error","msg":err.toString()}));
											else{
												
												if(cardconfig == null)
													res.end(JSON.stringify({"status":"Error", "msg":"Invalid Card Id"}));
												else{
													console.log(cardconfig)
													var card = JSON.parse(cardconfig.Configuration);
													var ScenSettings = {
														"scenarioTitle":card.cardTitle,
														"Entity":card.measures[0].LABEL,
														"dataSource":"service",
														"dimension":[],
														"measures":[],
														"serviceURL":card.Entity
													}
													for(var i=0; i<card.dimension.length; i++){
														ScenSettings.dimension.push(card.dimension[i].LABEL);
													}
													for(var j=1; j<card.measures.length; j++){
														ScenSettings.measures.push(card.measures[j].LABEL);
													}
													var VariantSettings = {
														timeDimension: "", 
														timePeriod: "All", 
														MinDimension: 0, 
														minMeasure: 0
													}
													for(var j=1; j<card.allProperties.length; j++){
														if(card.allProperties[i].DATA_TYPE == "Date"){
															VariantSettings.timeDimension = card.allProperties[i].LABEL;
															break;
														}
													}
													var tempScen ={
														"ListId":Math.floor(100000 + Math.random() * 900000),
														"ScenId": parseInt(cardid),
														"CardId": parseInt(cardid),
														"temp":1,
														"Page_Id": parseInt(cardid),
														"ScenName": card.cardTitle,
														"ScenConfig": Buffer.from(JSON.stringify(ScenSettings), 'binary').toString('base64'),
														"RoleFlag": "",
														"Filter": "DTREE",
														"VariantSettings": Buffer.from(JSON.stringify(VariantSettings), 'binary').toString('base64'),
														"CreatedBy": ObjectId(req.cookies.session.userid)
													}
													dbo.collection("Scenarios").insertOne(tempScen, function(err, resp){
														if(err)
															res.end(JSON.stringify({"status":"Error","msg":err.toString()}));
														else{
															var newVariant ={
																"VariantId": Math.floor(100000 + Math.random() * 900000),
																"VariantName": "Variant 1",
																"ScenId": parseInt(cardid),
																"CardId": parseInt(cardid),
																"Page_Id": parseInt(cardid),
																"SegmentTree": "",
																"SegmentSelection": "",
																"MeasureTree": "",
																"HiddenNodes": "",
																"Filter": "DTREE",
																"CreatedBy":ObjectId(req.cookies.session.userid)
															}
															dbo.collection("Variants").insertOne(newVariant,function(err, response){
																if(err)
																	res.end(JSON.stringify({"status":"Error","msg":err.toString()}));
																else
																	res.end(JSON.stringify({"status":"Success"}));
															})
															
														}
													})
												}
												
											}
										});
									}
								}
							})
							
						}
					})
				}
			})
		}else{
			res.end("Invalid Session");
		}
		
		
	})
	app.get("/RecommendedCards", function(req, res){
		console.log("MeasureTree")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					
					request.get('http://127.0.0.1:5000/RecomendedCards?userid='+req.cookies.session.userid, (error, response, body) => {
						if(error)
							res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
						else{
									
									res.end(body)
								}
					});
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
	})
	
	app.get("/getAllTablesAndViews1", function(req, res){
		console.log("getAllTablesAndViews1")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
					
							request.get('http://127.0.0.1:5000/getAllTablesAndViews1?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									
									// try{
										// body = JSON.stringify(body)
									// }
									// catch (e){
										// console.log(e.toString())
									// }
									DataAccess.verifyModelsReadAccessQB(req.cookies.session.userid, body,  function(result){
										console.log(result)
										res.end(JSON.stringify(result))
									})
								}
							});
						
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	
	app.get("/TableMetadata1", function(req, res){
		console.log("TableMetadata1")
		if (req.cookies.session){
			Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){
				if (sessionValidity){
				
							request.get('http://127.0.0.1:5000/TableMetadata1?'+req.url.split("?")[1], (error, response, body) => {
								if(error)
									res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
								else{
									/* try{
										body = JSON.stringify(body)
									}
									catch (e){
										console.log(e.toString())
									} */
									res.end(body)
								}
							});
						
				}
				else
					res.end("Invalid Session")
			})
		}
		else
			res.end("Invalid Session")
		// if (!req.headers.SessionKey || !Session.validateSession(req.headers.SessionKey, req.cookies.session.userid) )
			// res.end("Invalid Session")
		// // sessionValidity = Session.validateSession(req.headers.SessionKey, req.cookies.session.userid)
		// // if (!sessionValidity)
			// // res.end("Invalid Session")
		// else{
			// request.get('http://127.0.0.1:5000/getData'+req.url.split("?")[1], (error, response, body) => {
				// if(error)
					// res.end(JSON.stringify({'status':'Error', 'message':error.toString()}))
				// else
					// res.end(body)
			// });
		// }
	})
	

// The app listens on port 3010 and prints the endpoint URI in console window.
var server = app.listen(3010, function () {
    console.log('Server running at http://127.0.0.1:3010/');
});

process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err)
    process.exit(1) //mandatory (as per the Node docs)
})