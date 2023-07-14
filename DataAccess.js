var url	 = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
const {ObjectId} = require('mongodb').ObjectId;
var database = "UserManagement_brevo"
var MongoClient=require('mongodb').MongoClient;

function verifyReadAccess(userid, result,  callback){
	MongoClient.connect(url,{ useUnifiedTopology: true },function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("useraccesspagepermission").find({'userid':ObjectId(userid),"readid":"true"}).toArray(function(err, access){
				if(err)
					callback(err)
				else{
					if(access!=null){
						var finalResult = []
						for(var i=0; i<result.length; i++){
							if(result[i].CreatedBy && result[i].CreatedBy.toString() == userid.toString()){
								finalResult.push(result[i]);
							}
							else{
								for(var j=0; j<access.length; j++){
									if(access[j].pageid == result[i].Page_Id){
										finalResult.push(result[i]);
										break;
									}
								}
							}
						}
						callback(finalResult)
					}
				}
			})
		}	
	})
}

function verifyUpdateAccess(userid, pageid, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			var brevodb = db.db("BrevoV3")
			brevodb.collection("OVPPageConfig").findOne({Page_Id:pageid}, function(err, res){
				if(err)
					callback(err)
				else{
					if(str(res.CreatedBy) == str(userid))
						callback(true)
					else{
						dbo.collection("useraccesspagepermission").findOne({'userid':ObjectId(userid),"updateid":"true", 'pageid':int(pageid)},function(err, access){
							if(err)
								 callback(err)
							else{
									if(access == null)
										callback(false)
									else
										callback(true)
								}

						})
					}
				}
			})
			
		}	
	})
}

function verifyDeleteAccess(userid, pageid, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			var brevodb = db.db("BrevoV3")
			brevodb.collection("OVPPageConfig").findOne({Page_Id:pageid}, function(err, res){
				if(err)
					callback(err)
				else{
					if(str(res.CreatedBy) == str(userid))
						callback(true)
					else{
						dbo.collection("useraccesspagepermission").findOne({'userid':ObjectId(userid),"deleteid":"true", 'pageid':int(pageid)},function(err, access){
							if(err)
								 callback(err)
							else{
									if(access == null)
										callback(false)
									else
										callback(true)
								}

						})
					}
				}
			})
		}	
	})
}

function verifyCreateAccess(userid, pageid, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var brevodb = db.db("BrevoV3")
			brevodb.collection("OVPPageConfig").findOne({Page_Id:pageid}, function(err, res){
				if(err)
					callback(err)
				else{
					if(str(res.CreatedBy) == str(userid))
						callback(true)
					else{
						var dbo = db.db(database);
						dbo.collection("useraccesspagepermission").findOne({'userid':ObjectId(userid),"createid":"true", 'pageid':int(pageid)},function(err, access){
							if(err)
								 callback(err)
							else{
									if(access == null)
										callback(false)
									else
										callback(true)
								}

						})
					}
				}
			})
		}	
	})
}

function verifyModelReadAccess(userid, model,db, callback){
	console.log(model)
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("user").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user !== null && user.typevalue == "Administrator")
						callback(true)
					else{
						dbo.collection("useraccessmodulepermission").findOne({'userid':ObjectId(userid),"readid":"true", 'modelName':model.split(" ").join("_"),'db':db},function(err, access){
							if(err)
								 callback(err)
							else{
								console.log(access)
								if(access == null)
									callback(false)
								else
									callback(true)
							}
						})
					}
				}
			})
			
		}	
	})
}

function verifyModelUpdateAccess(userid, model,db, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			console.log(model);
			console.log(userid);
			var dbo = db.db(database);
			dbo.collection("user").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user !== null && user.typevalue == "Administrator")
						callback(true)
					else{
						dbo.collection("useraccessmodulepermission").findOne({'userid':ObjectId(userid),"updateid":"true", 'modelName':model.split(" ").join("_"),'db':db},function(err, access){
							if(err)
							 callback(err)
							else{
								console.log(access)
								if(access == null)
									callback(false)
								else
									callback(true)
							}

						})
					}
				}
			})
			
		}	
	})
}
function verifyModelDeleteAccess(userid, model,db, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("user").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user !== null && user.typevalue == "Administrator")
						callback(true)
					else{
						dbo.collection("useraccessmodulepermission").findOne({'userid':ObjectId(userid),"deleteid":"true", 'modelName':model.split(" ").join("_"),'db':db},function(err, access){
							if(err)
							 callback(err)
							else{
								console.log(access)
								if(access == null)
									callback(false)
								else
									callback(true)
							}

						})
					}
				}
			})
		}	
	})
}
function verifyModelCreateAccess(userid, model,db, callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("user").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user !== null && user.typevalue == "Administrator")
						callback(true)
					else{
						dbo.collection("useraccessmodulepermission").findOne({'userid':ObjectId(userid),"createid":"true", 'modelName':model.split(" ").join("_"),'db':db},function(err, access){
							if(err)
							 callback(err)
							else{
								console.log(access)
								if(access == null)
									callback(false)
								else
									callback(true)
							}

						})
					}
				}
			})
		}	
	})
}

function verifyModelsReadAccessFU(userid, result,  callback){
	MongoClient.connect(url,function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("useraccessmodulepermission").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user!== null && user.typevalue == "Administrator")
						callback(result)
					else{
						dbo.collection("useraccessmodulepermission").find({'userid':ObjectId(userid),"readid":"true"}).toArray(function(err, access){
							if(err)
								callback(err)
							else{
								if(access!=null){
									var finalResult = []
									for(var i=0; i<result.length; i++){
										for(var j=0; j<access.length; j++){
											
											if(access[j].modelName.split(" ").join("_") == result[i].FileName.split(" ").join("_") && access[j].db == "fileuploader"){
												
												finalResult.push(result[i]);
												break;
											}
										}
									}
									callback(finalResult)
								}else{
									callback([])
								}
							}
						})
					}
				}
			})
			
		}	
	})
}
function verifyModelsReadAccessQB(userid, result,  callback){
	try{
		result = JSON.parse(result)
	}catch(e){
		console.log(e.toString())
	}
	MongoClient.connect(url,{ useUnifiedTopology: true },function(err,db)
	{
		if(err)
			callback(err)
		else
		{
			var dbo = db.db(database);
			dbo.collection("user").findOne({'_id':ObjectId(userid)}, function(err, user){
				if(err)
					callback(err)
				else{
					if(user !== null && user.typevalue == "Administrator")
						callback(result)
					else{
						dbo.collection("useraccessmodulepermission").find({'userid':ObjectId(userid),"readid":"true"}).toArray(function(err, access){
							if(err)
								callback(err)
							else{
								if(access!=null){
									var Tables = []
									var Views = []
									for(var i=0; i<result.Tables.length; i++){
										// if(result[i].CreatedBy && result[i].CreatedBy.toString() == userid.toString()){
											// finalResult.push(result[i]);
										// }
										// else{
											for(var j=0; j<access.length; j++){
												if(access[j].modelName.split(" ").join("_") == result.Tables[i].TABLE_NAME.split(" ").join("_") && access[j].db == result.Tables[i].TABLE_CATALOG){
													Tables.push(result.Tables[i]);
													break;
												}
											}
										// }
									}
									console.log()
									for(var i=0; i<result.Views.length; i++){
										// if(result[i].CreatedBy && result[i].CreatedBy.toString() == userid.toString()){
											// finalResult.push(result[i]);
										// }
										// else{
											for(var j=0; j<access.length; j++){
												if(access[j].modelName.split(" ").join("_") == result.Views[i].name.split(" ").join("_") && access[j].db == "Brevo"){
													Views.push(result.Views[i]);
													break;
												}
											}
										// }
									}
									callback({'Tables':Tables,'Count_Tables':Tables.length, 'Views':Views, 'Count_Views':Views.length})
								}
							}
						})
					}
				}
			})
		}	
	})
}


module.exports = {
    verifyReadAccess,
    verifyUpdateAccess,
	verifyCreateAccess,
	verifyDeleteAccess,
	verifyModelReadAccess,
	verifyModelUpdateAccess,
	verifyModelDeleteAccess,
	verifyModelCreateAccess,
	verifyModelsReadAccessFU,
	verifyModelsReadAccessQB
}
