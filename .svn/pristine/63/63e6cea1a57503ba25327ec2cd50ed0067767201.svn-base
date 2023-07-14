

function update(cfg, getDB){
	return function(table, query, update, req, cb){
		getDB(function(err, db){
			if(err)
				return cb(err);
			var fields = cfg.model.entityTypes[table];
			console.log(query);
			var sql = "update "+table+" set ";
			for(var j=0; j<Object.keys(update.$set).length; j++){
				if(j>0)
					sql = sql+","
				if(fields[Object.keys(update.$set)[j]].type == "Edm.String")
					sql = sql+Object.keys(update.$set)[j]+"= \'"+update.$set[Object.keys(update.$set)[j]]+"\'";
				else
					sql = sql+sql+Object.keys(update.$set)[j]+"= "+update.$set[Object.keys(update.$set)[j]];
			}
			sql = sql+" where "+Object.keys(query)[0]+"="+query[Object.keys(query)[0]];
			console.log(sql)
			db.query(sql,function(err, result){
				cb(err, result);
			})
		})
	}
}	

function query(cfg, getDB){
	console.log("query");
	return function(table, query,  req, cb){
		getDB(function(err, db){
			if(err){
				console.log(err);
				return cb(err);
			}
		var sql = "Select ";
		sql = query.$select?sql+query.$select:sql+"*";
		sql = sql+" from "+table;
		// var filter = createFilter(query.$filter);
		// var sqlQuery = createQuery(query);
		// console.log(sqlQuery)
		// console.log(filter);
		sql = (query.$filter && Object.keys(query.$filter).length !== 0)?sql+"where "+ query.$filter:sql;
		
		sql = query.$orderby?sql+" order by "+query.$orderby:sql;
		sql = query.$top?sql+" limit "+query.$top:sql;
		console.log(sql)
		db.query(sql, function (err,result){
			if(err)
				console.log(err);
			else
				console.log(result);
			// console.log(cb);
			cb(err,result);
		});
		});
		
	}
}
function remove(getDB){
	return function(table, query, req, cb){
		getDB(function(err, db){
			if(err)
				return cb(err);
			var sql = "delete from "+table+" where "+Object.keys(query)[0]+"="+query[Object.keys(query)[0]];
			console.log(sql);
			db.query(sql, function(err, result){
				cb(err, result);
			})
		})
	}
}

function insert(cfg, getDB){
	return function(table, doc,  req, cb){
		getDB(function(err, db){
			if(err)
				return cb(err);
			var fields = cfg.model.entityTypes[table];
			console.log(fields);
			var columns = Object.keys(doc).join(",");
			var sql = "insert into "+table+" ( " +columns+" ) values (";
			// for(var i=0; i< Object.keys(doc).length;i++){
				// if(i>0)
					// sql = sql+",";
				// sql = sql+Object.keys(doc)[i];
			// }
			// sql = sql +" ) values ( ";
			var res={};
			for(var j=0; j<Object.keys(doc).length; j++){
				if(j>0)
					sql= sql+",";
				if(fields[Object.keys(doc)[j]].type == "Edm.String")
					sql = sql+"\'"+doc[Object.keys(doc)[j]]+"\'";
				else
					sql = sql+doc[Object.keys(doc)[j]];
				if(fields[Object.keys(doc)[j]].key)
					res._id = doc[Object.keys(doc)[j]];
			}
			sql = sql+" )";
			console.log(sql);
			db.query(sql, function(err, result){
				console.log(res)
				cb(err, res);
			});
		})
	}
}
module.exports = function(getDB){
	return function(odataServer){
		odataServer.update(update(odataServer.cfg, getDB))
			.remove(remove(getDB))
			.query(query(odataServer.cfg, getDB))
			.insert(insert(odataServer.cfg, getDB))
	}
}