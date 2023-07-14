var express = require('express');
var bodyParser = require('body-parser')
// var app = express();
//const {ObjectId} = require('mongodb').ObjectId;
var ObjectID = require('mongodb').ObjectID;
// app.use( bodyParser.json({limit: '10mb', extended: true}) );       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({limit: '10mb', extended: true})); 



var url = "mongodb://1.186.146.208:27017";

// Creating a post Service To get login user details
app.post('/loginuser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.225.68:27017/";  
	var param1=req.query.param1;
	var data = req.body;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
				dbo.collection("user").findOne( {'user_emailid':data.user_email,'password':data.password}, { projection: { } }, function(err, res2) {
					
					if(res2!=null){
						
						
						
						
						if(res2.organisationid!=''){
			
			var organisationid=ObjectID(res2.organisationid);
			var roleid=ObjectID(res2.roleid);
			var name=res2.firstname;
		
			
			
			
			
		dbo.collection("user").aggregate(
		[
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
				res.end(JSON.stringify(result));
		});
}else{
	var roleid=ObjectID(res2.roleid);
			var name=res2.firstname;
			
		dbo.collection("user").aggregate(
		[
		{$match:{user_emailid:data.user_email}},
	
		{
			$lookup:
			{
				from: "role",
				localField: "roleid",
				foreignField: "_id",
				as: "role"
			}
			
		}
  	
		]).toArray(function(err,result){
			if(err)
				res.end("Connection error");
			else
				res.end(JSON.stringify(result));
		});
					}
				
					}else{
						res.end("authentication error");
						
					}		
				});
		}
	});
});





// Creating a post Service To get login user details
app.post('/loginuserauthentication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	var data = req.body;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
				dbo.collection("user").findOne( {'user_emailid':data.user_email,'password':data.password}, { projection: { } }, function(err, res2) {
					
					if(res2!=null){
			
			var organisationid=ObjectID(res2.organisationid);
			var roleid=ObjectID(res2.roleid);
			var name=res2.firstname;
		
			
			
			
			
		dbo.collection("user").aggregate(
		[
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

app.post('/createorganisation', function (req, res) {
	var objectId = new ObjectID();
var objectId_role=new ObjectID();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var data = req.body;
	console.log(data.name);
	var param1=req.query.param1;
	if(true){
		
        
		
		var org_email=data.org_email;
		var user_emailid=data.user_emailid;
		/* var application=[{name:'brevo',link:'https:brevo', description:'test'},  {name:'brevo',link:'https:brevo',description:'test'}
		
		]; */
		
		var application = data.application;
		
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
			enddate : data.enddate
		
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
			
		
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
								
								}; 
					
					dbo.collection("organisation_application").insert(values, function(err, res10) {
				if (err) 
			     res.end("role error");
			 else
				 res.end("okk");
		        });	
					
							}
			 }
				
				}
		});
});
	}else{
		res.end("Missing Values");
	}
})



// Creating a postservice for organisationdeletion

app.post('/deleteteorganisation', function (req, res) {
	let now = new Date();
	
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://1.186.146.208:27017";
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
			
		
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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

 app.post('/editorganisationnew', function (req, res) {

	var objectId_role = new ObjectID();
	let now = new Date();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var data = req.body;
	console.log(data.name);
	var param1 = req.query.param1;
	var objectId = ObjectID(req.query.param2);
	var licenceid = req.query.param3;
	var useridadmin = req.query.param4;
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
		/* var application=[{name:'brevo',link:'https:brevo'},  {name:'brevo',link:'https:brevo'}
		
		]; */

		var application = data.application;

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

		MongoClient.connect(url, {poolSize: 10, bufferMaxEntries: 0, reconnectTries: 5000, useNewUrlParser: true,useUnifiedTopology: true},
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
							enddate: data.enddate
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
				/* 	dbo.collection("role").updateOne(role, function(err, res5) {
				if (err) 
			     res.end("role error");
		        }); */

				//res.end("user with this Email ID already exists");
				dbo.collection("user").find({
					user_emailid: {
						$exists: true,
						$in: [user_emailid]
					}
				}).toArray(function (err, res8) {
					//if(res8.length>0)
					if (false)
						res.end("user with this Email ID already exists");
					else {
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

						//dbo.collection("user").insertOne(user, function(err, res6) {
						// if (err)
							// res.end("user Error");
						// else {
							// res.end("ok");
							// //console.log(JSON.stringify(res8));
						// }
					}
				});
			}
			if (application.length != 0) {

				//application_organisation collection

				for (var i = 0; i < application.length; i++) {
					var values = {
						name: application[i].name,
						application_link: application[i].link,
						description: application[i].description,
						createdate: application[i].createdate,
						modifydate: application[i].modifydate,
						organisationid: objectId

					};
					console.log(JSON.stringify(values));
					var values1 = Object.entries(values);
					console.log(JSON.stringify(values1));
					dbo.collection("organisation_application").deleteMany(organisationid, function (err, result6) {
						if (result6)

							res.end("ok");

					});
					dbo.collection("organisation_application").insertOne(values, function (err, res10) {
						if (err)
							res.end(err.toString());
						else
							res.end("okk");
						////db.close();
					});

				}
			} else {
				//application_organisation collection

				for (var i = 0; i < application.length; i++) {
					var values = {
						name: application[i].name,
						application_link: application[i].link,
						description: application[i].description,
						createdate: application[i].createdate,
						modifydate: application[i].modifydate,
						organisationid: objectId

					};
					//console.log(JSON.stringify(values));

					dbo.collection("organisation_application").find({});

				}

			}

		});

	} else {
		res.end("Missing Values");
	}
})

app.post('/editorganisation1', function (req, res) {
	
var objectId_role=new ObjectID();
    let now = new Date();
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
			
		
		
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/createapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var data = req.body;
	var values={
					name : data.name,
					link : data.link,
					description : data.description,
					createdate : data.createdate,
					modifydate : data.modifydate
								
				};
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getapplications',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getorganisationapplications',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getroles',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
				localField: "organisationid",
				foreignField: "organisationid",
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
app.post('/createrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getorganisations',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getpages',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getorganisationdetail',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://1.186.146.208:27017";
	//var url = "mongodb://192.168.1.138:27017/";  
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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


// Creating a get Service To get perticular organisation detail copy
app.get('/getorganisationdetailhierarchy',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/editrole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/deleterole',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	var data = req.body;
	var roleid=req.query.param1;
	var query = {'_id':ObjectID(roleid)};
	var userquery = {'roleid':ObjectID(roleid)};
	
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/editapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/deleteapplication',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var data = req.body;
	var appid=req.query.param1;
	var query = {'_id':ObjectID(appid)};
	
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/createuser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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



// Creating a postservice for edit user
app.post('/edituser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var roleid=req.query.param1;
	var organisationid=req.query.param2;
	var userid=req.query.param3;
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
					roleid : ObjectID(roleid),
					typevalue:data.typevalue,
					verified : 'verified',
		            createdate : data.createdate,
		            modifydate : data.modifydate
								
				};
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			
			if(user_emailid!=''){
				
				
						//user collection
					dbo.collection("user").update(values, function(err, res6) {
				if (err) 
					res.end("user Error");
				else{
                    res.end("ok");
				}
		        });	
			
			
				
				
		}
	}
});

});


// Creating a postservice for delete user
app.post('/deleteuser',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var data = req.body;
	var userid=req.query.param1;
	var query = {'_id':ObjectID(userid)};
	
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getusers',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	console.log("hello");
	if(param1!== undefined){
		MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getmodule',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	//var param1=req.query.param1;
	console.log("hello");
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/createuseraccessmodule',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/createuseraccess',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.post('/edituseraccess',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/"; 
	var url = "mongodb://1.186.146.208:27017";
	var userid=req.query.param1;
	var applicationid=req.query.param2;
	var pageid=req.query.param3;
	var data = req.body;
	var query={'userid':ObjectID(userid)};
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
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			var dbo =  db.db("UserManagement_brevo");
			
			dbo.collection("userpagepermission").deleteMany(query, function(err, res2) {
				if (err) 
					res.end("userpagepermission Error");
				
		        });	
		
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


// Creating a get Service To get user access to pages
app.get('/getuseraccess',function(req,res){
	console.log("getUserAccess");
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
		if (err) res.end("Connection Error");
		else{
			
			var dbo =  db.db("UserManagement_brevo");
			dbo.collection("userpagepermission").find({'userid':ObjectID(param1)}).toArray(function(err,res2){
					if(err) res1.end("userpagepermission Error");
					else{
						res.end(JSON.stringify(res2));
					}
					
					});
		}
	});
});

// Creating a get Service To get all the permissions
app.get('/getpermissions',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	var param1=req.query.param1;
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
app.get('/getlogs',function(req,res){
	var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://192.168.1.138:27017/";  
	var url = "mongodb://1.186.146.208:27017";
	
	MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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


//Running the server
// var server = app.listen(4050, function () {
   // var host = server.address().address
   // var port = server.address().port
   // console.log("Example app listening at http://%s:%s", host, port)
// });