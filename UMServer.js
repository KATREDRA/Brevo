var Emitter = require('events').EventEmitter
var util = require('util')
var url = require('url')
var Router = require('./router.js')
var Buffer = require('safe-buffer').Buffer
var ObjectID = require('mongodb').ObjectID
var MongoClient = require('mongodb').MongoClient
var Session = require('./Session.js')
const excelToJson = require('convert-excel-to-json');

var Mongourl = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";

function UMServer (serviceUrl) {
  this.serviceUrl = serviceUrl
}

util.inherits(UMServer, Emitter)

UMServer.prototype.handle = function (req, res) {
  if (!this.serviceUrl && !req.protocol) {
    throw new Error('Unable to determine service url from the express request or value provided in the ODataServer constructor.')
  }

  function escapeRegExp (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
  }

  // If mounted in express, trim off the subpath (req.url) giving us just the base path
  var path = (req.originalUrl || '/').replace(new RegExp(escapeRegExp(req.url) + '$'), '')
  this.serviceUrl = this.serviceUrl ? this.serviceUrl : (req.protocol + '://' + req.get('host') + path)

  var prefix = url.parse(this.serviceUrl).pathname
  if (!this.router || (prefix !== this.router.prefix)) {
    this.router = new Router(prefix)
    this._initializeRoutes()
  }

  this.router.dispatch(req, res)
}

UMServer.prototype._initializeRoutes = function () {
  var self = this
  // Creating a post Service To get login user details
this.router.post('/loginuser',function(req,res){
		var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.225.68:27017/";  
	//var param1=req.query.param1;
	var data = req.body;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			console.log(data.toString());
			dbo.collection("user").findOne( {'user_emailid':data.user_email,'password':data.password}, function(err, res2) {
				console.log(res2);
				if(res2!=null){
					if(res2.typevalue !== "Administrator")
						res.end(JSON.stringify({login:false,"Error":"Authentication Error"}))
					if(res2.organisationid!=''){
						var organisationid=ObjectID(res2.organisationid);
						var roleid=ObjectID(res2.roleid);
						var name=res2.firstname;
						dbo.collection("user").aggregate(
							[{$match:{user_emailid:data.user_email}},							
							{
								$lookup:
								{
									from: "organisation",
									localField: "organisationid",
									foreignField: "_id",
									as: "organisation"
								}
							},
							{   $unwind:"$organisation" },
							{
								$lookup:
								{
									from: "license",
									localField: "organisationid",
									foreignField: "organisationid",
									as: "license"
								}
									
							}, 
							{   $unwind:"$license" } ,				
							{
								$lookup:
								{
									from: "role",
									localField: "roleid",
									foreignField: "_id",
									as: "role"
								}	
							},
							{   $unwind:"$role" },
							{ $lookup: {
								from: "application",
								localField: "organisation.applicationIds",
								foreignField: "_id",
								as: "applications"
							} 
						}]).toArray(function(err,result){
							if(err)
								res.end("Connection error");
							else{
								Session.createSession(result[0]._id, function(sessionKey){
									if(sessionKey){
										res.cookie("session", {userid:result[0]._id,sessionkey:sessionKey});
										res.end(JSON.stringify(result));
									}else
										res.end(JSON.stringify({login:false,"Error":"Session Error"}))
								})
							}
						});
					}else{
						var roleid=ObjectID(res2.roleid);
						var name=res2.firstname;
						dbo.collection("user").aggregate(
							[{$match:{user_emailid:data.user_email}},
							{
								$lookup:
								{
									from: "role",
									localField: "roleid",
									foreignField: "_id",
									as: "role"
								}
							}]
						).toArray(function(err,result){
							if(err)
								res.end("Connection error");
							else{
								Session.createSession(result[0]._id, function(sessionKey){
									if(sessionKey){
										res.cookie("session", {userid:result[0]._id,sessionkey:sessionKey});
										res.end(JSON.stringify(result));
									}else
										res.end(JSON.stringify({login:false,"Error":"Session Error"}))
								})
							}
						});
					}
				}else{
					res.end(JSON.stringify({login:false,"Error":"Authentication Error"}));
				}		
			});
		}
	});
});





// Creating a post Service To get login user details
this.router.post('/loginuserauthentication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	var data = req.body;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("user").findOne( {'user_emailid':data.user_email,'password':data.password}, { projection: { } }, function(err, res2) {
				if(res2!=null){
					var organisationid=ObjectID(res2.organisationid);
					var roleid=ObjectID(res2.roleid);
					var name=res2.firstname;
					dbo.collection("user").aggregate([
						{$match:{user_emailid:data.user_email}},
						{
							$lookup:
							{
								from: "organisation",
								localField: "organisationid",
								foreignField: "_id",
								as: "organisation"
							}
						},
						{   $unwind:"$organisation" },
					
						{
							$lookup:
							{
								from: "license",
								localField: "organisationid",
								foreignField: "organisationid",
								as: "license"
							}
							
						},
						{   $unwind:"$license" },
					
					
						{
							$lookup:
							{
								from: "role",
								localField: "roleid",
								foreignField: "_id",
								as: "role"
							}
							
						},
						{   $unwind:"$role" },
					
					
						{
							$lookup:
							{
								from: "organisation_application",
								localField: "organisationid",
								foreignField: "organisationid",
								as: "application"
							}
							
						}
					]).toArray(function(err,result){
						if(err)
							res.end("Connection error");
						else
							res.end("success");
					});
				
				
				}else{
					res.end("authentication error");
							
				}
			});	
		}
	});
});







// Creating a postservice for organisationcreation

this.router.post('/createorganisation', function (req, res) {
	var objectId = new ObjectID();
	var objectId_role=new ObjectID();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	console.log(data.name);
	var param1=req.query.param1;
	if(true){
		
		
		var org_email=data.org_email;
		var user_emailid=data.user_emailid;
		
		
		var applicationIds = [];
		data.applicationIds.forEach(function(id){
			applicationIds.push(ObjectID(id))
		})
		
		var organisation =
		{
            _id:objectId,
			name : data.name,
			description : data.description,
			phone : data.phone,
			org_email : data.org_email,
			address : data.address,
			createdate : data.createdate,
		    modifydate : data.modifydate,
			enddate : data.enddate,
			applicationIds:applicationIds
		
		};
		
		 var license={
			 license_type : data.license_type,
			 organisationid:objectId,
			 startdate : data.startdate,
             enddate : data.enddate,
			 dashboardcountallowed : data.dashboardcountallowed,
		     usercountallowed : data.usercountallowed,
			 createdate : data.createdate,
		     modifydate : data.modifydate
			
			};
			
			var role={
			_id:objectId_role,
			type :'Administrator',
			//typevalue :'Administrator',
			description : data.description,
			createdate : data.createdate,
		    modifydate : data.modifydate,
			countofcreatepage : data.dashboardcountallowed,
			countofcreateuser : data.usercountallowed,
			organisationid : objectId	
				
			};
			
			var user={
				
			        firstname : data.firstname,
					lastname : data.lastname,
					contactnumber : data.contactnumber,
					typevalue :'Administrator',
					user_emailid : data.user_emailid,
					password :'Vaspp@123',
					organisationid : objectId,
					roleid : objectId_role,
					verified : 'verified',
					createdate : data.createdate,
					modifydate : data.modifydate
			};
			
			var log={
				userid:param1,
				organisationid : objectId,
				descripeion:'created organisation with the name '+data.name,
				createdate : data.createdate
				
				
			};
			
		
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err)
			res.end("Connection Error");
			var dbo =  db.db("UserManagement_brevo");
			
			dbo.collection("organisation").find( { org_email: { $exists: true, $in: [ org_email ] }}).toArray( function(err, res2) {
				
				console.log(res2.length);
				if (res2.length>0)
					res.end("Organisation with this Email ID already exists");
				else{
					
					
					//organisation collection
					dbo.collection("organisation").insert(organisation, function(err, res7) {
				if (err)
					res.end("organisation Error");
				
					});
					
					//log collection
					dbo.collection("log").insert(log, function(err, res11) {
				if (err)
					res.end("log Error");
				
					});
			
			//license collection
					dbo.collection("license").insert(license, function(err, res3) {
				if (err)
					res.end("license Error");
}
		);
				if(user_emailid!=''){
						
							//role collection
					dbo.collection("role").insert(role, function(err, res5) {
				if (err)
			     res.end("role error");
		        });	
						
						//res.end("user with this Email ID already exists");
					dbo.collection("user").find( { user_emailid: { $exists: true, $in: [ user_emailid ] }}).toArray( function(err, res8) {
				if(res8.length>0)
					res.end("user with this Email ID already exists");
				else{
						//user collection
					dbo.collection("user").insert(user, function(err, res6) {
				if (err)
					res.end("user Error");
				else{
                    res.end("ok");
				}
		        });	
				}
});
				}
				
				}
		});
});
	}else{
		res.end("Missing Values");
	}
})



// Creating a postservice for organisationdeletion

this.router.post('/deleteteorganisation', function (req, res) {
	let now = new Date();
	
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	//var url = "mongodb://192.168.1.138:27017/"; 
	var param1=req.query.param1;
	var param2=req.query.param2;
	if(true){
		
        var id={
			_id:ObjectID(param1)
         };
		
		 
		 var organisationid={
			organisationid:ObjectID(param1)
         };
			
		
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) 
			res.end("Connection Error");
			var dbo =  db.db("UserManagement_brevo");
	
		dbo.collection("organisation").findOne(id,{name:1},function(err,res7){
				if (err) 
					res.end("user Error");
				else{
                  var description="deleted organisation with name "+res7.name;
				   	if(res7.name!=''){
						dbo.collection("log").insert({userid:param2,description:description,createdate:now},function(err,res7){
				if (err) 
					res.end("user Error");
				
		        });	//logend
					
					}
				}
		        });	//organisation
				
				
				
				
				dbo.collection("user").find(organisationid).toArray(function(err,res7){
				if (err) 
					res.end("user Error");
				else{
					
					for(var i=0;i<res7.length;i++){
						
						dbo.collection("userpagepermission").deleteMany({'userid':ObjectID(res7[i]._id)},function(err,res8){
								if (err) 
					res.end("user Error");
							
						});
						
					}
					
                  
				}
		        });	
				
	
	
	dbo.collection("organisation").deleteOne(id, function(err, res1) {
				if (err) 
					res.end("organisation Error");
				else{
					
					
					dbo.collection("license").deleteOne(organisationid, function(err, res2) {
				if (err) 
					res.end("license Error");
				else{
                   
				   
				   dbo.collection("role").deleteOne(organisationid, function(err, res3) {
				if (err) 
					res.end("role Error");
				else{
                   
				   dbo.collection("user").deleteOne(organisationid, function(err, res4) {
				if (err) 
					res.end("user Error");
				else{
                   
				   dbo.collection("organisation_application").deleteMany(organisationid, function(err, res6) {
				if (err) 
					res.end("organisation_application Error");
				else{
					
				
                   
				   dbo.collection("userpagepermission").deleteMany(organisationid, function(err, res7) {
				if (err) 
					res.end("userpagepermission Error");
				else{
					
				
                   
				   res.end("success");
				   
				   
				}
		        });	//organisationapplicationend
				   
				   
				}
		        });	//organisationapplicationend
				   
				   
				}
		        });	//userend
				   
				   
				}
		        });	//roleend
				   
				}
		        });	//licenseend
                   
				}
		        });	//organisationend
	
	});
	}else{
		res.end("Missing Values");
	}
})





// Creating a postservice for organisationedit
// Creating a postservice for organisationedit
// Creating a postservice for organisationedi

 this.router.post('/editorganisationnew', function (req, res) {

	var objectId_role = new ObjectID();
	let now = new Date();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	console.log(data.name);
	var param1 = req.query.param1; //userid
	var objectId = ObjectID(req.query.param2); //organisationid
	var licenceid = req.query.param3; //licenceid
	var useridadmin = req.query.param4; //useridadmin
	console.log(objectId);
	var organisationid = {
		organisationid: objectId
	};
	var id = {
		_id: objectId
	};
	if (true) {
		var query = {
			'ObjectID': param1
		};
		var org_email = data.org_email;
		var user_emailid = data.user_emailid;
		
		var applicationIds = [];
		data.applicationIds.forEach(function(id){
			applicationIds.push(ObjectID(id))
		})
		var license = {
			license_type: data.license_type,
			organisationid: objectId,
			startdate: data.startdate,
			enddate: data.enddate,
			dashboardcountallowed: data.dashboardcountallowed,
			usercountallowed: data.usercountallowed,
			createdate: data.createdate,
			modifydate: data.modifydate
		};
		var role = {
			_id:objectId_role,
			type: 'Administrator',
			description: data.description,
			createdate: data.createdate,
			modifydate: data.modifydate,
			countofcreatepage: data.dashboardcountallowed,
			countofcreateuser: data.usercountallowed,
			organisationid: objectId
		};
		var user = {
			firstname: data.firstname,
			lastname: data.lastname,
			contactnumber: data.contactnumber,
			user_emailid: data.user_emailid,
			password: 'Vaspp@123',
			organisationid: objectId,
			roleid : objectId_role,
			verified: 'verified',
			createdate: data.createdate,
			modifydate: data.modifydate
		};
		MongoClient.connect(Mongourl, {poolSize: 10, bufferMaxEntries: 0, reconnectTries: 5000, useNewUrlParser: true,useUnifiedTopology: true},
		function (err, db) {
			if (err)
				res.end("Connection Error");
			var dbo = db.db("UserManagement_brevo");
			dbo.collection("organisation").findOne(id, {
				name: 1
			}, function (err, res7) {
				if (err)
					res.end("user Error");
				else {
					//var description = "edited organisation with name " + res7.name;
					console.log(res7.toString());
					if (res7.name != '') {
						dbo.collection("log").insertOne({
							userid: param1,
							//description: description,
							createdate: now
						}, function (err, res7) {
							if (err)
								res.end("user Error");
						}); //logend
					}
					dbo.collection("organisation").updateOne({
						_id: ObjectID(req.query.param2)
					}, {
						$set: {
							name: data.name,
							description: data.description,
							phone: data.phone,
							org_email: data.org_email,
							address: data.address,
							modifydate: now,
							enddate: data.enddate,
							applicationIds:applicationIds
						}
					}, function (err, res20) {
						if (err)
							res.end("organisation Error");
						else
							console.log("inserting org");
					}); //organisationend
				}
			}); //organisation
			//license collection
			dbo.collection("license").findOne({
				organisationid: ObjectID(req.query.param2)
			}, function (err, result2) {
				if (err)
					res.end("user Error");
				else {
					console.log("edited");
					var description = "edited license with name ";
					dbo.collection("license").updateOne({
						organisationid: ObjectID(req.query.param2)
					}, {
						$set: {
							license_type: data.license_type,
							organisationid: objectId,
							startdate: data.startdate,
							enddate: data.enddate,
							dashboardcountallowed: data.dashboardcountallowed,
							usercountallowed: data.usercountallowed,
							createdate: data.createdate,
							modifydate: data.modifydate
						}
					}, function (err, result1) {
						if (err)
							res.end("organisation Error");
						else
							console.log("inserting licence");
						console.log("ok");
					}); //organisationend
				}
			});
			if (user_emailid != '') {
				//role collection
				 	dbo.collection("role").updateOne(role, function(err, res5) {
				if (err)
			     res.end("role error");
		        });
				//res.end("user with this Email ID already exists");
				// dbo.collection("user").find({
					// user_emailid: {
						// $exists: true,
						// $in: [user_emailid]
					// }
				// }).toArray(function (err, res8) {
					// //if(res8.length>0)
					// if (false)
						// res.end("user with this Email ID already exists");
					// else {
						//user collection
						console.log("switching user");
						dbo.collection("user").findOne({
							_id: ObjectID(req.query.param4)
						}, function (err, result2) {
							if (err)
								res.end("user Error");
							else {
								//console.log(JSON.stringify(result2));
								console.log("edited user with name ");
								var description = "edited user with name ";
								dbo.collection("user").updateOne({
									_id: ObjectID(req.query.param4)
								}, {
									$set: {
										firstname: data.firstname,
										lastname: data.lastname,
										contactnumber: data.contactnumber,
										user_emailid: data.user_emailid,
										password: 'Vaspp@123',
										organisationid: objectId,
										verified: 'verified',
										roleid : objectId_role,
										createdate: data.createdate,
										modifydate: data.modifydate
									}
								}, function (err, userresult) {
									console.log("Test");
									if (err) {
										console.log(err)
										res.end("organisation Error");
									} else {
										res.end("ok");
										console.log("ok done");
									}
								}); //organisationend
							}
						});
						
					// }
				// });
			}
			
		});
	} else {
		res.end("Missing Values");
	}
})

this.router.post('/editorganisation1', function (req, res) {
	
var objectId_role=new ObjectID();
    let now = new Date();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	console.log(data.name);
	var param1=req.query.param1;
	var objectId=ObjectID(req.query.param2);
	var organisationid={
			organisationid:objectId
         };
		  var id={
			_id:objectId
         };
		
	
	if(true){
		
        
		var query = {'ObjectID':param1};
		var org_email=data.org_email;
		var user_emailid=data.user_emailid;
		/* var application=[{name:'brevo',link:'https:brevo'},  {name:'brevo',link:'https:brevo'}
		
		]; */
		

		var application = data.application;
		
		 var license={
			 license_type : data.licensetype,
			 organisationid:objectId,
			 startdate : data.startdate,
             enddate : data.enddate,
			 dashboardcountallowed : data.dashboardcountallowed,
		     usercountallowed : data.usercountallowed,
			 createdate : data.createdate,
		     modifydate : data.modifydate
			
			};
			
			var role={
			_id:objectId_role,
			type :'Administrator',
			description : data.description,
			createdate : data.createdate,
		    modifydate : data.modifydate,
			countofcreatepage : data.dashboardcountallowed,
			countofcreateuser : data.usercountallowed,
			organisationid : objectId	
				
			};
			
			var user={
				
			        firstname : data.firstname,
					lastname : data.lastname,
					contactnumber : data.contactnumber,
					user_emailid : data.user_emailid,
					password :'Vaspp@123',
					organisationid : objectId,
					roleid : objectId_role,
					verified : 'verified',
					createdate : data.createdate,
					modifydate : data.modifydate
			};
			
		
		
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) 
			res.end("Connection Error");
			var dbo =  db.db("UserManagement_brevo");
			
			
					
				dbo.collection("license").deleteOne(organisationid, function(err, res2) {
				if (err) 
					res.end("license Error");
				else{
                   
				   
				   dbo.collection("role").deleteOne(organisationid, function(err, res3) {
				if (err) 
					res.end("role Error");
				else{
                   
				   dbo.collection("user").deleteOne(organisationid, function(err, res4) {
				if (err) 
					res.end("user Error");
				else{
                   
				   dbo.collection("organisation_application").deleteMany(organisationid, function(err, res6) {
				if (err) 
					res.end("organisation_application Error");
			
		        });	//licenseend
				   
				   
				}
		        });	//userend
				   
				   
				}
		        });	//roleend
				   
				}
		        });	//licenseend
				
				
					
				dbo.collection("organisation").findOne(id,{name:1},function(err,res7){
				if (err) 
					res.end("user Error");
				else{
                  var description="edited organisation with name "+res7.name;
				   	if(res7.name!=''){
						dbo.collection("log").insert({userid:param1,description:description,createdate:now},function(err,res7){
				if (err) 
					res.end("user Error");
				
		        });	//logend
					
					}
				}
		        });	//organisation
			
			//license collection 
					dbo.collection("license").insert(license, function(err, res3) {
				if (err) 
					res.end("license Error");
}
		);
				if(user_emailid!=''){
						
							//role collection
					dbo.collection("role").insert(role, function(err, res5) {
				if (err) 
			     res.end("role error");
		        });	
						
						//res.end("user with this Email ID already exists");
					dbo.collection("user").find( { user_emailid: { $exists: true, $in: [ user_emailid ] }}).toArray( function(err, res8) {
				if(res8.length>0)
					res.end("user with this Email ID already exists");
				else{
						//user collection
					dbo.collection("user").insert(user, function(err, res6) {
				if (err) 
					res.end("user Error");
				/* else{
                    res.end("ok");
				} */
		        });	
				}
});
				}
			if(application.length!=0){
						
							//application_organisation collection
						
							for(var i=0;i<application.length;i++){
								var values={
								name:application[i].name,
								application_link:application[i].link,
								description : application[i].description,
								createdate : application[i].createdate,
								modifydate : application[i].modifydate,
								organisationid:objectId
								//name:application[i].name,
								//application_link:application[i].link,
								//organisationid:objectId
								
								};
					dbo.collection("organisation_application").insert(values, function(err, res10) {
				if (err) 
			     res.end("organisation error");
			 else
				 res.end("okk");
			 db.close();
		        });	
					
				}
				}
				
		});

	}else{
		res.end("Missing Values");
	}
})



// Creating a postservice for create Application
this.router.post('/createapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	var values={
					name : data.name,
					link : data.link,
					description : data.description,
					createdate : data.createdate,
					modifydate : data.modifydate
								
				};
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("application").insert(values, function(err, res1) {
				if (err) 
			     res.end("organisation error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a get Service To get all the applications
this.router.get('/getapplications',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("application").find({}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});



// Creating a get Service To get all the applications under organisation
this.router.get('/getorganisationapplications',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("organisation_application").find({'organisationid':ObjectID(param1)}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});



// Creating a get Service To get all the roles
this.router.get('/getroles',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("role").find({'organisationid':ObjectID(param1)}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});



// Creating a get Service To get the role
this.router.get('/getrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			dbo.collection("role").aggregate(
			
			[
		
		{$match:{organisationid:ObjectID(param1)}},
		{
			$lookup:
			{
				from: "user",
				localField: "_id",
				foreignField: "roleid",
				as: "user"
			}
			
		},
		
		{
			$lookup:
			{
				from: "license",
				localField: "organisationid",
				foreignField: "organisationid",
				as: "License"
			}
		}
			,
		
		{
			$lookup:
			{
				from: "organisation_application",
				localField: "organisationid",
				foreignField: "organisationid",
				as: "application"
			}
			
		}
	//	{   $unwind:"$user" },
		
		
    
   
    ]
		
		).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
					
				
					
		}
	});
});


// Creating a postservice for create new role
this.router.post('/createrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	var data = req.body;
	var values={
		type : data.type,
		description : data.description,
		createdate : data.createdate,
		modifydate : data.modifydate,
		countofcreatepage : data.countofcreatepage,
		countofcreateuser : data.countofcreateuser,
		organisationid : ObjectID(param1)
								
				};
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("role").insert(values, function(err, res1) {
				if (err) 
			     res.end("role error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a get Service To get all organisations
this.router.get('/getorganisations',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("organisation").find().toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});

// Creating a get Service To get all pages
this.router.get('/getpages',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("page").find().toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});

// Creating a get Service To get perticular organisation detail
this.router.get('/getorganisationdetail',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	//var url = "mongodb://192.168.1.138:27017/";  
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("organisation").find({'_id':ObjectID(param1)}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});


this.router.get('/getorganisationdetailhierarchy', function(req, res){
	
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			dbo.collection("organisation").aggregate(
			
			
		[
		{$match:{_id:ObjectID(param1)}},
					{ $lookup: {
						from: "application",
						localField: "applicationIds",
						foreignField: "_id",
						as: "applications"
					} },
					{
			$lookup:
			{
				from: "license",
				localField: "_id",
				foreignField: "organisationid",
				as: "License"
			}
		}
		
			,
   // {   $unwind:"$License" },
		{
			$lookup:
			{
				from: "role",
				localField: "_id",
				foreignField: "organisationid",
				as: "role"
			}
			
		},
   // {   $unwind:"$role" },
		{
			$lookup:
			{
				from: "user",
				localField: "_id",
				foreignField: "organisationid",
				as: "user"
			}
			
		},
		{
			$lookup:
			{
				from: "log",
				localField: "_id",
				foreignField: "organisationid",
				as: "log"
			}
			
		}
		
		
		
		]).toArray(function(err,result){
			if(err){
				res.end(err);
			}
			else{
				res.end(JSON.stringify(result));
				console.log();
			}
		});
			
		}
	});
});

// Creating a get Service To get perticular organisation detail copy
this.router.get('/getorganisationdetailhierarchy_old',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("organisation").aggregate(
			
			
		[
		{$match:{_id:ObjectID(param1)}},
		
		{
			$lookup:
			{
				from: "license",
				localField: "_id",
				foreignField: "organisationid",
				as: "License"
			}
		}
			,
   // {   $unwind:"$License" },
		{
			$lookup:
			{
				from: "role",
				localField: "_id",
				foreignField: "organisationid",
				as: "role"
			}
			
		},
   // {   $unwind:"$role" },
		{
			$lookup:
			{
				from: "user",
				localField: "_id",
				foreignField: "organisationid",
				as: "user"
			}
			
		},
  //  {   $unwind:"$user" },
		{
			$lookup:
			{
				from: "organisation_application",
				localField: "_id",
				foreignField: "organisationid",
				as: "application"
			}
			
		},
		{
			$lookup:
			{
				from: "log",
				localField: "_id",
				foreignField: "organisationid",
				as: "log"
			}
			
		}
		
		]).toArray(function(err,result){
			if(err)
				res.end("Connection error");
			else
				res.end(JSON.stringify(result));
		});
		}
	});
});



// Creating a postservice for edit role
this.router.post('/editrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	var data = req.body;
	var roleid=req.query.param2;
	var query = {'_id':ObjectID(roleid)};
	var values={
		type : data.type,
		description : data.description,
		createdate : data.createdate,
		modifydate : data.modifydate,
		countofcreatepage : data.countofcreatepage,
		countofcreateuser : data.countofcreateuser,
		organisationid : ObjectID(param1)
								
				};
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("role").update(query,values, function(err, res1) {
				if (err) 
			     res.end("role error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a postservice for delete role
this.router.post('/deleterole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	var data = req.body;
	var roleid=req.query.param1;
	var query = {'_id':ObjectID(roleid)};
	var userquery = {'roleid':ObjectID(roleid)};
	
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
			
			 dbo.collection("user").find(userquery).toArray(function(err,res7){
				if (err) 
					res.end("user Error");
				else{
					console.log("role");
					for(var i=0;i<res7.length;i++){
						console.log(ObjectID(res7[i]._id));
						dbo.collection("userpagepermission").deleteMany({'userid':ObjectID(res7[i]._id)},function(err,res8){
								if (err) 
					res.end("user Error");
							
						});
						
					}
					
                  
				}
		        });	
				 
			
			
			
			dbo.collection("role").deleteOne(query, function(err, res1) {
				if (err) 
			     res.end("role error");
			 else{
				 
				 
				 
				
				 
				 
				 
				 dbo.collection("user").deleteMany(userquery, function(err, res9) {
				if (err) 
			     res.end("user error");
			 else
				 res.end("okk");
			 db.close();
		        });	
				 
			 }
				 
			 
		        });	
				
				
			res.end("role");	
		}
	});
});


// Creating a postservice for edit Application
this.router.post('/editapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var appid=req.query.param1;
	var data = req.body;
	var query = {'_id':ObjectID(appid)};
	console.log(query);
	var values={
				    name : data.name,
					link : data.link,
					description : data.description,
					createdate : data.createdate,
					modifydate : data.modifydate
								
				};
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("application").update(query,values, function(err, res1) {
				if (err) 
			     res.end("application error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a postservice for delete application
this.router.post('/deleteapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	var appid=req.query.param1;
	var query = {'_id':ObjectID(appid)};
	
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("application").deleteOne(query, function(err, res1) {
				if (err) 
			     res.end("application error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a postservice for create new user
this.router.post('/createuser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var roleid=req.query.param1;
	var organisationid=req.query.param2;
	//var typevalue = req.query.typevalue;
	var data = req.body;
	var user_emailid=data.user_emailid;
	var query = {'_id':ObjectID(roleid)};
	//res.end(data.typevalue);
	//console.log("test");
	var values={
		            firstname : data.firstname,
					lastname : data.lastname,
					contactnumber : data.contactnumber,
					user_emailid : data.user_emailid,
					password : data.password,
					organisationid : ObjectID(organisationid),
					roleid : ObjectID(roleid),
					typevalue:data.typevalue,
					verified : 'verified',
		            createdate : data.createdate,
		            modifydate : data.modifydate
								
				};
				
	console.log(values);
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
			if(user_emailid!=''){
				
				//res.end("user with this Email ID already exists");
					dbo.collection("user").find( { user_emailid: { $exists: true, $in: [ user_emailid ] }}).toArray( function(err, res8) {
				if(res8.length>0)
					res.end("user with this Email ID already exists");
				else{
						//user collection
					dbo.collection("user").insert(values, function(err, res6) {
				if (err) 
					res.end(err.toString());
					//res.end("user Error");
				else{
				
                    res.end("ok");
				}
		        });	
				}
});
				
				
			}
			
				
				
		}
	});
});

//Upload Users from excel
this.router.post('/UploadUsers', function(req, res){
	
	if(req.cookies.session){ 
		Session.validateSession(req.cookies.session.sessionkey, req.cookies.session.userid, function(sessionValidity){     
			if(sessionValidity){

				var MongoClient = require('mongodb').MongoClient;
				if(req.body.data && req.body.organisationid){
					MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
						
						if (err) res.end("Connection error");
						else{
							const result = excelToJson({
								source: new Buffer(req.body.data.split(",")[1], 'base64') // fs.readFileSync return a Buffer
							});
							console.log(result)
							
							if(result['Sheet1'] == undefined)
								res.end(JSON.stringify({"status":"Error","message":"Invalid Data"}))

							
							var col1 = result['Sheet1'].splice(0,1)[0]
							var keys = Object.keys(col1)
							var col=[]
							for(var i=0; i<keys.length;i++){
								col.push(col1[keys[i]])
							}
							var data = result['Sheet1']
							console.log(col)
							var users = []
							
							for(var i=0; i<data.length; i++){
								var newUser = {}
								console.log(data[i])
								for(var j=0; j<col.length; j++){
								
									newUser[col[j]] = data[i][keys[j]]
								}
								users.push(newUser);
							}
							console.log(users)
							var usersdata = [], userEmails = [] , userTypes = [] , userOrg = []
							for(var i=0; i<users.length; i++){
								if(users[i].firstname && users[i].user_emailid && users[i].password && users[i].role){
									var newUser = {
										firstname: users[i].firstname,
										lastname: users[i].lastname,
										contactnumber: users[i].contactnumber,
										user_emailid: users[i].user_emailid,
										password: users[i].password,
										organisationid: ObjectID(req.body.organisationid),
										typevalue: users[i].role,
										verified: 'verified',
										createdate: new Date(),
										modifydate: new Date()
							
									}
									usersdata.push(newUser);
									userEmails.push(users[i].user_emailid);
									userTypes.push(users[i].role);
								}
								
								else{
									res.end(JSON.stringify({'status':"Error",'message':"Missing Data"}));
								}
							}
							var dbo = db.db("UserManagement_brevo");
							console.log(userEmails)
							dbo.collection("user").find({user_emailid:{$in:userEmails}}).toArray(function(err, result){
								if(err)
									res.end("Error");
								else{
									if(result.length >0)
										res.end({'status':"Error",'message':"Email ID already exists"});
									else{
										console.log(req.body.organisationid)
										dbo.collection("role").find({'organisationid':ObjectID(req.body.organisationid),'type':{$in:userTypes}}).toArray(function(err, roleRes)
										{
											if(err)
												res.end(JSON.stringify({'status':"Error",'message':"Inavlid role"}));
											else
											{
												console.log(roleRes)
												for(var i=0; i<usersdata.length; i++){
													for(var j=0; j<roleRes.length;j++){
														if(roleRes[j].type == usersdata[i].typevalue){
															usersdata[i].roleid = ObjectID(roleRes[j]._id)
															break
														}
													}
												}
												console.log(usersdata)	
												dbo.collection("user").insertMany(usersdata, function(err, response){
													if(err)
														res.end("Insert Error");
													else{
														
														res.end(JSON.stringify({"status":"Success"}));
													}
												})
											}
										});
									}
								}
							})
						}	
					});
				}else{
					res.end(JSON.stringify({"status":"Error","message":"Missing Data"}))
				}
			}
			else{
				res.end(JSON.stringify({status:"error",message:"Invalid Session"})); 
			}
		})
	}else{
		res.end(JSON.stringify({status:"error",message:"Invalid Session"}));
	}
})


// Creating a postservice for edit user
this.router.post('/edituser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var roleid=req.query.param1;
	var organisationid=req.query.param2;
	var userid=req.query.param3;
	console.log(userid)
	var data = req.body;
	var user_emailid=data.user_emailid;
	var query = {'_id':ObjectID(userid)};
	var values={
		            firstname : data.firstname,
					lastname : data.lastname,
					contactnumber : data.contactnumber,
					user_emailid : data.user_emailid,
					password : data.password,
					organisationid : ObjectID(organisationid),
					roleid : ObjectID(data.roleid),
					typevalue:data.typevalue,
					verified : 'verified',
		            createdate : data.createdate,
		            modifydate : data.modifydate
								
				};
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
			if(user_emailid!=''){
				
				
						//user collection
					dbo.collection("user").update({_id:ObjectID(userid)},{'$set':values}, function(err, res6) {
				if (err) 
					res.end("user Error");
				else{
                    res.end("ok");
				}
		        });	
			
			
				
				
		}else{
			res.end("Invalid Email ID")
		}
	}
});

});


// Creating a postservice for delete user
this.router.post('/deleteuser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var data = req.body;
	var userid=req.query.param1;
	var query = {'_id':ObjectID(userid)};
	
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("userpagepermission").deleteMany({'userid':ObjectID(userid)},function(err,res8){
								if (err) 
					res.end("user Error");
							
						});
			dbo.collection("user").deleteOne(query, function(err, res1) {
				if (err) 
			     res.end("user error");
			 else
				 res.end("okk");
			 db.close();
		        });	
		}
	});
});


// Creating a get Service To get users detail
this.router.get('/getusers',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	console.log("hello");
	console.log(typeof(param1))
	if(param1!= undefined && param1 != null && param1!= "undefined" && param1!= "null"){
		MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
			if (err){ 
			res.end(err.toString());
			}
			else{
				var dbo =  db.db("UserManagement_brevo");
				dbo.collection("user").find({'organisationid':ObjectID(param1)}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
				});
			}
		});
	}
	else{
		res.end("Invalid Id");
	}
});

// Creating a get Service To get module detail
this.router.get('/getmodule',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	//var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err){ 
		res.end(err.toString());
		}
		else{
			var dbo =  db.db("UserManagement_brevo");
			//dbo.collection("user").find({'organisationid':ObjectID(param1)}).toArray(function(err,res2){
					dbo.collection("module").find({}).toArray(function(err,res2){
					if(err) res1.end("Backend Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});


// Creating a postservice for to create new createuseraccessmodule with operations
this.router.post('/createuseraccessmodule',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var userid=req.query.param1;
	var moduleid=req.query.param2;
	//var pageid=req.query.param3;
	var data = req.body;
	var user_emailid=data.user_emailid;
	var values=[{
		        userid :ObjectID(userid),
				moduleid : ObjectID(moduleid),
				//pageid :ObjectID(pageid),
				createdate : data.createdate,
				modifydate : data.modifydate,
				modulename:data.modulename,
				//pagetitle:data.pagetitle,
				createid : data.createid,
				readid : data.readid,
				updateid : data.updateid,
				deleteid : data.deleteid,
				shareid : data.shareid
								
				}
				];
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
		
				for(var i=0;i<values.length;i++){
				
						//modulepermission collection
					dbo.collection("modulepermission").insert(values[i], function(err, res6) {
				if (err) 
					res.end("modulepermission Error");
				
		        });	
			
				
				
				}
			
				
				res.end("ok");
		}
	});
});



// Creating a postservice for to create new useracess to page with operations
this.router.post('/createuseraccess',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var userid=req.query.param1;
	var applicationid=req.query.param2;
	var pageid=req.query.param3;
	var data = req.body;
	var user_emailid=data.user_emailid;
	var values=[{
		        userid :ObjectID(userid),
				applicationid : ObjectID(applicationid),
				pageid :ObjectID(pageid),
				createdate : data.createdate,
				modifydate : data.modifydate,
				applicationname:data.applicationname,
				pagetitle:data.pagetitle,
				createid : data.createid,
				readid : data.readid,
				updateid : data.updateid,
				deleteid : data.deleteid,
				shareid : data.shareid
								
				}
				];
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
		
				for(var i=0;i<values.length;i++){
				
						//userpagepermission collection
					dbo.collection("userpagepermission").insert(values[i], function(err, res6) {
				if (err) 
					res.end("userpagepermission Error");
				
		        });	
			
				
				
				}
			
				
				res.end("ok");
		}
	});
});



// Creating a postservice for to edit useracess to page with operations
this.router.post('/edituseraccess',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var userid=req.body.userid;
	
	var data = req.body;
	if(data.pageAccess == undefined)
		data.pageAccess = []
	if(data.ModelAccess == undefined)
		data.ModelAccess = []
	for (var i=0; i< data.pageAccess.length; i++){
		data.pageAccess[i].userid = ObjectID(data.pageAccess[i].userid);
		data.pageAccess[i].applicationid = ObjectID(data.pageAccess[i].applicationid);
		data.pageAccess[i].pageid = parseInt(data.pageAccess[i].pageid);
		
	}
	for (var i=0; i< data.ModelAccess.length; i++){
		data.ModelAccess[i].userid = ObjectID(data.ModelAccess[i].userid);		
	}
	var pageAccess=data.pageAccess;
	var ModelAccess=data.ModelAccess;
	var query={'userid':ObjectID(userid)};
	var values= data.pageAccess;
	var values1= data.ModelAccess;
	if(data.deletedPageAccessIds == undefined)
		data.deletedPageAccessIds = []
	var deletedAccessIds=data.deletedPageAccessIds;
	if(data.deletedModelAccessIds == undefined)
		data.deletedModelAccessIds = []
	var deletedModelAccessIds=data.deletedModelAccessIds;
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			var ObjectID = require('mongodb').ObjectID;
			//delete page access
			console.log("deletedAccessIds" + deletedAccessIds.length);
			 if(deletedAccessIds.length !=0){
				for(var k=0;k < deletedAccessIds.length; k++){
					console.log("deletedAccessIds length"+deletedAccessIds.length + deletedAccessIds );
				dbo.collection("useraccesspagepermission").deleteOne({_id:ObjectID(deletedAccessIds[k])}, function(err, res6) {
				if (err){ 
				res.end("userpagepermission Error" + err.toString());
				}else{
					res.end("userpagepermission deletedAccessIds access deleted " + res6.toString());
				}
				
		        });
				}				
			}else{
				console.log("DeletedAccessIDs are null");
			} 
			//delete module access
			 if(deletedModelAccessIds.length !=0){
				for(var k=0;k < deletedModelAccessIds.length; k++){
					console.log("deletedModelAccessIds length"+deletedModelAccessIds.length + deletedModelAccessIds );
				dbo.collection("useraccessmodulepermission").deleteOne({_id:ObjectID(deletedModelAccessIds[k])}, function(err, res6) {
				if (err){ 
				res.end("usermodulepermission Error" + err.toString());
				}else{
					res.end("usermodulepermission deletedModelAccessIds access deleted " + res6.toString());
				}
				
		        });
				}				
			}else{
				console.log("deletedModelAccessIds module are null");
			} 
			//console.log(JSON.stringify(values) + values.length);
			if(pageAccess.length != 0){
				console.log("pageAccess.length"+"   " +pageAccess.length.toString());
			for(var i=0;i < pageAccess.length; i++){
		        //console.log(i + "for loop i values");
			if(values[i]._id == undefined){	
				 console.log("if true");
				//console.log(JSON.stringify(values[i]));
				dbo.collection("useraccesspagepermission").insertOne(values[i], function(err, res6) {
				if (err) {
					res.end("userpagepermission Error" + err.toString());
				}else{
					res.end("userpagepermission" + res6.toString());
				}
				
		        });	
				
			}else{ 
				    var ObjectID = require('mongodb').ObjectID;
					console.log(values[i].length +" elseloop "+ "value length");
					console.log(i);
					console.log(values[i]._id);
					//_id property directly when your code calls update
					var query1={"_id":ObjectID(values[i]._id)}
					dbo.collection("useraccesspagepermission").updateOne({_id:ObjectID(values[i]._id)},{ $set:{applicationid:values[i].applicationid,
						applicationname:values[i].applicationname,
						createdate:values[i].createdate,
						createid:values[i].createid,
						deleteid:values[i].deleteid,
						modifydate:values[i].modifydate,
						pageid:values[i].pageid,
						pagetitle:values[i].pagetitle,
						readid:values[i].readid,
						shareid:values[i].shareid,
						updateid:values[i].updateid,
						userid:values[i].userid}}, function(err, res2) {
				if (err) {
					res.end("useraccesspagepermission Error" + err.toString());//{'userid':ObjectID(req.query.param1)},{ $set:values[i]}
				}else{
					console.log("updatewd");
					res.end("useraccesspagepermission " +res2.toString());
				}
		        });	
				
			}
	     }
		}else{
				console.log("PageAccess is null");
			}
			//.....................module access..........
			if(ModelAccess.length != 0){
				console.log("ModelAccess.length"+"   " +ModelAccess.length.toString());
			for(var i=0;i < ModelAccess.length; i++){
		        //console.log(i + "for loop i values");
			if(values1[i]._id == undefined){	
				 console.log("if true");
				//console.log(JSON.stringify(values[i]));
				dbo.collection("useraccessmodulepermission").insertOne(values1[i], function(err, res6) {
				if (err) {
					res.end("useraccessmodulepermission Error" + err.toString());
				}else{
					res.end("useraccessmodulepermission" + res6.toString());
				}
				
		        });	
				
			}else{ 
				    var ObjectID = require('mongodb').ObjectID;
					console.log(values1[i].length +" elseloop "+ "values length");
					console.log(i);
					console.log(values1[i]._id);
					//_id property directly when your code calls update
					var query1={"_id":ObjectID(values1[i]._id)}
					dbo.collection("useraccessmodulepermission").updateOne({_id:ObjectID(values1[i]._id)},
					{ $set:
					{
						createdate:values1[i].createdate,
						createid:values1[i].createid,
						deleteid:values1[i].deleteid,
						modelName:values1[i].modelName,
						db:values1[i].db,
						modifydate:values1[i].modifydate,
						readid:values1[i].readid,
						shareid:values1[i].shareid,
						updateid:values1[i].updateid,
						userid:values1[i].userid}}, function(err, res2) {
				if (err) {
					res.end("useraccessmodulepermission Error" + err.toString());//{'userid':ObjectID(req.query.param1)},{ $set:values[i]}
				}else{
					console.log("updated module");
					res.end("useraccessmodulepermission " +res2.toString());
				}
		        });	
				
			}
	     }
		}else{
				console.log("ModuleAccess is null");
			}


			
				res.end("ok");
		}
	});
});


// Creating a get Service To get user access to pages
this.router.get('/getuseraccess',function(req,res){
	console.log("getUserAccess");
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var userid=req.query.userid;
	console.log(userid)
	if(userid == undefined || userid == null)
		res.end("Invalid userid")
	try{
		userid = ObjectID(userid)
	}
	catch(e){
		res.end("Inavlid userid");
	}
		
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			
			var dbo =  db.db("UserManagement_brevo");
			var ObjectID = require('mongodb').ObjectID;
			dbo.collection("user").aggregate(
		[{$match:{_id:userid}},
		
		{
			$lookup:
			{
				from: "useraccessmodulepermission",
				localField: "_id",
				foreignField: "userid",
				as: "ModelAccess"
			}
		
		},
		{
			$lookup:
			{
				from: "useraccesspagepermission",
				localField: "_id",
				foreignField: "userid",
				as: "PageAccess"
			}
		
		}]).toArray(function(err,result){
			if(err){
				res.end("useraccess error");
				
			}
			else{
				res.end(JSON.stringify(result));
				
			}
		});
		}
	});
});

// Creating a get Service To get all the permissions
this.router.get('/getpermissions',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	var param1=req.query.param1;
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("permission").find({}).toArray(function(err,res2){
					if(err) res1.end("getpermission Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});


// Creating a get Service To get all the logs
this.router.get('/getlogs',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
	
	MongoClient.connect(Mongourl,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("log").find({}).toArray(function(err,res2){
					if(err) res1.end("log Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});

}

module.exports = UMServer