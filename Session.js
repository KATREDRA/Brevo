var crypto = require('crypto');   // for generating session id
var url	 = "mongodb://techvasppadmin:Init2020!@127.0.0.1:28017/";
const {ObjectId} = require('mongodb').ObjectId;
var database = "BrevoV3"
var MongoClient=require('mongodb').MongoClient;



function createSession(id, callback)
{
	console.log("createSession")
	MongoClient.connect(url,{useNewUrlParser: true},function(err,db)
	{
		if(err)
		{
			return "Error"
		}
		else
		{	
			var dbo=db.db(database);
			var session_key = crypto.randomBytes(16).toString('base64');
			dbo.collection("Session").insertOne({"sessionKey":session_key,"userId":id,"expireAt":new Date()}, function(err,res)
			{
				if(err)
				{
					return "Error"
					db.close();
				}
				else
				{
					console.log(session_key)
					// dbo.collection("Session").createIndex({"expireAt":1},{"expireAfterSeconds":200})
					callback(session_key)
				}
			});
		}
	});
}

function test(){
	return "Success"
}

function validateSession(sessionKey, userId, callback)
{
	MongoClient.connect(url,{useNewUrlParser: true},function(err,db)
	{
		if(err)
		{
			callback(false)
		}
		else
		{
			var dbo=db.db(database);
   			dbo.collection("Session").findOne({sessionKey:sessionKey,userId:ObjectId(userId)},function(err,res1)
			{
				if(err)
				{
					db.close();
					callback(false)
				}
				else
				{
					if(res1==null)
					{
						db.close();
						callback(false);
					}
					else
					{
						db.close();			
						callback(true);
					}
				}
			});
		}
	});
}	


function deleteSession(sessionKey, callback)
{
	MongoClient.connect(url,{useNewUrlParser: true},function(err,db)
	{
		if(err)
		{
			
			callback(false)
		}
		else
		{
			var dbo=db.db(database);
			dbo.collection("Session").deleteOne({sessionKey:sessionKey},function(err,res1)
			{
				if(err)
				{
					db.close();
					callback(false)
				}	
				else
				{
					db.close();
					callback(true)
				}
			});
				
		}
	});
}


module.exports = {
    createSession,
    validateSession,
	deleteSession,
}