import flask
from pyspark.sql import SparkSession
import sys, json
from pymongo import MongoClient
import pandas as pd
import numpy as np
import re

my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)

mongoURL = "mongodb://localhost:27017/"
app = flask.Flask(__name__)
app.config["DEBUG"] = True

def getColType(data, column):
	column_det = []
	for col in column:
		if isinstance(data[20][col], type(0.1)):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[20][col], type(1)):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[20][col], type(datetime.now())):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
		else:
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})
	return column_det

@app.route("/TableData", methods = ['GET'])
def getData():
	params = flask.request.args
	table = params['table']
	database = params['db']
	df = my_spark.read.option("uri",mongoURL+database+"."+table).format("com.mongodb.spark.sql.DefaultSource").load()
	data = df.toJSON().collect()
	res = []
	for row in data:
		row = json.loads(row)
		del row['_id']
		res.append(row)
	return json.dumps({"status":"Success", "count":len(res), "tables":res})

@app.route("/TableMetadata", methods = ['GET'])
def getTableMetadata():
	params = flask.request.args
	table = params['table']
	db = params['db']
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient[db]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':table})
	del col_Det['_id']
	return json.dumps(col_Det)
	
@app.route("/CreateView", methods = ['POST'])
def createView():
	params = flask.request.get_json()
	mongoClient = MongoClient(mongoURL)
	db = mongoClient['Brevo']
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':params['view_name'], 'TABLE_CATALOG':database})
	if col_Det != None:
		return json.dumps({"status":"Error", "message":"View name already exists"})
	if params['created_through'] == "Wizard":
		parentTable = params['parent_table']
		# db_name = params['db_name']
		tables = params['tables']
		selected_columns = params['selected_columns']
		conditions = params['conditions']
		join_type = params['join_type']
		filtr = params['filter_url']
		view = params['view_name']
		parentTableData = my_spark.read.option("uri",mongoURL+parentTable).format("com.mongodb.spark.sql.DefaultSource").load()
		# parentTableData = parentTableData.alias(parentTable.split(".")[1])
		# i=0
		# for i in range(len(tables)):
			# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			# childTable = childTable.alias(tables[i].split(".")[1])
			# resultTable = parentTable.join(childTable, conditions[i],how=join_type[i])
			# parentTable = resultTable
		parentTableData.createOrReplaceTempView("_".join(parentTable.split(".")[1].split(" ")))
		childTable = []
		for i in range(len(tables)):
			childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
		query = " "
		i = 0
		for i in range(len(tables)):
			query = query+join_type[i]+" "+tables[i].split(".")[1]+" on "+conditions[i]+" "
		sql = "select "+selected_columns+" from "+ parentTable.split(".")[1]+query
		if filtr !="":
			sql = sql + " where "+filtr
		try:
			data = my_spark.sql(sql)
			collDet = getColType(data.toPandas())
			data = data.toJSON().collect()
			res = []
			for row in data:
				res.append(json.loads(row))
			mongoClient = MongoClient(mongoURL)
			db = mongoClient['Brevo']
			col = db["_".join(view.split(" "))]
			col.drop()
			col.insert_many(data)
			metaDB = mongoClient['Brevo']
			metadataCol = metaDB['CollectionDetails']
			params['TABLENAME'] = 'Brevo'
			params['TABLE_CATALOG'] = params['view_name']
			params['COLOUMN_DET'] = collDet
			insert =  metadataCol.insert_one(params)
			return json.dumps({"status":"Success","message":"The View was created with id "+str(insert.inserted_id)})
		except Exception as e:
			return json.dumps({"status":"Error","message":"There was some technical error while creating view"})
		
	else:
		query = params['query']
		tables = []
		FromSplitQuery = re.split("from ", query, flags=re.I)
		i=0
		for i in range(len(FromSplitQuery)):
			if i%2 != 0:
				JoinSplitQuery = re.split("join ", FromSplitQuery[i], flags = re.I)
				for val in JoinSplitQuery:
					tables.append(val.split(" ")[0])
		try:
			for i in range(len(tables)):
				childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
				childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
				query = re.sub(tables[i], "_".join(tables[i].split(".")[1].split(" ")), query, flags=re.I)
			data = my_spark.sql(query)
			collDet = getColType(data.toPandas())
			data = data.toJSON().collect()
			res = []
			for row in data:
				res.append(json.loads(row))
			print(res)
			mongoClient = MongoClient(mongoURL)
			db = mongoClient["Brevo"]
			col = db["_".join(params['view_name'].split(" "))]
			col.drop()
			col.insert_many(data)
			metaDB = mongoClient['Brevo']
			metadataCol = metaDB['CollectionDetails']
			insert =  metadataCol.insert_one(params)
			return json.dumps({"status":"Success","message":"The View was created with id "+str(insert.inserted_id)})
		except Exception as e:
			return json.dumps({"status":"Error","message":"There was some technical error while creating view  by SQL Editor"})
			
@app.route("/ValidateQuery", methods = ['POST'])
def validateQuery():
	params = flask.request.get_json() 
	query = params['query']
	tables = []
	FromSplitQuery = re.split("from ", query, flags=re.I)
	i=0
	for i in range(len(FromSplitQuery)):
		if i%2 != 0:
			JoinSplitQuery = re.split("join ", FromSplitQuery[i], flags = re.I)
			for val in JoinSplitQuery:
				tables.append(val.split(" ")[0])
	try:
		for i in range(len(tables)):
			childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
			query = re.sub(tables[i], "_".join(tables[i].split(".")[1].split(" ")), query, flags=re.I)
		data = my_spark.sql(query)
		data = data.toJSON().collect()
		res = []
		for row in data:
			res.append(json.loads(row))
		if len(res)>0:
			if params['data_preview'] == True:
				return json.dumps({"status":"Success", "count":len(res), "tables":res})
			else:
				return json.dumps({"status":"Success", "message":"Valid Query"})
		else:
			return json.dumps({"status":"Error", "message":"Invalid Query"})
	except Exception as e:
			return json.dumps({"status":"Error","message":"Invalid Query"})

@app.route('/getAllTablesAndViews', methods=['GET'])
def getAllTablesAndViews():
	params = flask.request.args
	mongoClient = MongoClient(mongoURL)
	db = mongoClient[params['db']]
	col = db["CollectionDetails"]
	tables = []
	views = []
	for row in col.find():
		if row['TABLE_TYPE'] == "TABLE":
			tables.append({
				'TABLE_NAME': row['TABLENAME'],
				'TABLE_CATALOG': params['db'],
				'department': row['department'],
				'description':row['description'],
				'last_change':row['last_change']
			})
		elif row['TABLE_TYPE'] == "VIEW":
			views.append({
				'view_id':str(row['_id']),
				'name':row['view_name']
			})
	# print(views[0]['view_id'])
	return json.dumps({'Tables': tables, 'Views': views, 'Count_Tables': len(tables), 'Count_Views': len(views)})
	
@app.route('/database_list', methods=['GET'])
def getListOfDatabases():
	dbs = MongoClient().list_database_names()
	Res = []
	for val in dbs:
		Res.append({'name':val})
	return json.dumps({"status":"Success", "database_list":Res})

if __name__ == "__main__":
	app.run(port=5050)