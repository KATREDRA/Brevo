import flask
from pyspark.sql import SparkSession
import sys, json
from pymongo import MongoClient
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import pandas as pd
import numpy as np
import flask
from flask import Flask,Response, request
import pymongo
from pymongo import MongoClient,errors,TEXT,ASCENDING,DESCENDING
import bson 
from bson import ObjectId
from bson.json_util import dumps as bson2json
import json as pyjson
import base64, io
from sklearn.model_selection import train_test_split

# Import the model we are using
from sklearn.ensemble import RandomForestRegressor

mongoURL = "mongodb://techvasppadmin:Init2020!@localhost:28017/"

my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)

def RF(train_features, train_labels, feature_list):
	print(train_features)
	# Instantiate model with 1000 decision trees
	rf = RandomForestRegressor(n_estimators = 1000, random_state = 42)
	# Train the model on training data
	rf.fit(train_features, train_labels);

	# Get numerical feature importances
	importances = list(rf.feature_importances_)
	# List of tuples with variable and importance
	feature_importances = [(feature, round(importance, 2)) for feature, importance in zip(feature_list, importances)]
	# Sort the feature importances by most important first
	feature_importances = sorted(feature_importances, key = lambda x: x[1], reverse = True)

	feature1 = [feature_importances[0][0].split("_"),feature_importances[0][1]]
	feature2 = [feature_importances[1][0].split("_"),feature_importances[1][1]]
	feature3 = [feature_importances[2][0].split("_"),feature_importances[2][1]]
	return [feature1, feature2, feature3]

def getColType(data, column):
	column_det = []
	for col in column:
		if isinstance(data[2][col], type(0.1)):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[2][col], type(1)):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[2][col], type(datetime.now())):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
		else:
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})
	return column_det

def addData(collection, data):
	mongoClient = pymongo.MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	print(data)
	col.insert_many(data)
	
def updateMetadata(collection, column_det):
	mongoClient = pymongo.MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	coll = db['CollectionDetails']
	measure = []
	dimension = []
	for col in column_det:
		if col['DATATYPE'] == "String":
			dimension.append(col['COLUMN_NAME'].upper())
		elif col['DATATYPE'] == "Int" or col['DATATYPE'] == "Float":
			measure.append(col['COLUMN_NAME'].upper())
			
	data = {
		"TABLENAME":"_".join(collection.split(" ")),
		"FileName":collection,
		"DIMENSIONS":dimension,
		"COLUMN_DET": column_det,
		"MEASURES":measure
	}
	dele = coll.delete_one({"TABLENAME":"_".join(collection.split(" "))})
	coll.insert_one(data)
	return data

def emptyData(collection):
	mongoClient = pymongo.MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.delete_many({})
	col2 = db['CollectionDetails']
	col2.delete_one({"TABLENAME":"_".join(collection.split(" "))})
	
def removeNATValues(data, columns):
	uData=[]
	for row in data:
		for col in columns:
			if pd.isnull(row[col]):
				row[col] = None
		uData.append(row)
	return uData
 
def updateData1(data, columns):
	uData = []
	for row in data:
		resRow = {}
		for col in columns:
			resRow["_".join(col.split(" "))] = row[col]
		uData.append(resRow)
	return uData
    
def getColumnDetails(table):
	mongoClient = MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':"_".join(table.split(" "))})
	return col_Det

def getTableData(table, collDet, select, filtr):
	select = select.split(",")
	sql = "SELECT "
	grpby = []
	i=0
	for val in select:
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "MEASURE":
				if i>0:
					sql = sql+","
				sql =  sql = sql + col['AGGREGATIONTYPE'].upper()+"("+val.upper()+")"+" AS "+val.upper()
				i = i+1
			elif col['COLUMN_NAME'].upper() == val.upper():
				grpby.append(val.upper())
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr.upper()+" GROUP BY "
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))+" GROUP BY "
	i=0
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val.upper()
		i = i+1
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getTableDataST(table, select, filtr):
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	sql = "SELECT "+ select +" FROM "+ "_".join(table.split(" "))
	if filtr != "undefined":
		sql = sql + " WHERE "+filtr
	data = my_spark.sql(sql)
	return data.toPandas()

	
def getValue(table,collDet, select, filtr):
	select = select.split(",")
	sql = "SELECT "
	i=0
	for val in select:
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "MEASURE":
				if i>0:
					sql = sql+","
				sql =  sql = sql +"AVG("+val.upper()+")"+" AS "+val.upper()
				i = i+1
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr.upper()
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getData1(collection):
	mongoClient = pymongo.MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	data = []
	for row in col.find({}):
		del row['_id']
		data.append(row)
	return data

def updateData(data, column_det):
	updatedData = []
	for row in data:
		for col in column_det:
			if col['DATATYPE'] == "Int":
				row[col['COLUMN_NAME']] = int(row[col['COLUMN_NAME']])
			elif col['DATATYPE'] == "Float":
				row[col['COLUMN_NAME']] = float(row[col['COLUMN_NAME']])
			elif col['DATATYPE'] == "Date":
				row[col['COLUMN_NAME']] = pd.Timestamp(dateparser.parse('02.01.2020'))
			else:
				row[col['COLUMN_NAME']] = str(row[col['COLUMN_NAME']])
			updatedData.append(row)
	return updatedData	

def emptyData(collection):
	mongoClient = pymongo.MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.delete_many({})
    
def addNewColumn(data, column_det, node_name, fileName, formula):
	for col in column_det['COLUMN_DET']:
		formula = formula.replace(col['COLUMN_NAME'], 'row[\''+col['COLUMN_NAME']+'\']')
	print(formula)
	uData = []
	for row in data:
		row[node_name] = eval(formula)
		uData.append(row)
	return uData
    
app = flask.Flask(__name__)
app.config["DEBUG"] = True

@app.route('/SegmentTree', methods = ['GET'])
def SegmentTree():
	params = flask.request.args
	view = params['view']
	select = params['select']
	target = params['target']
	variantId = params['variantID']
	year = params['year']
	filtr = "undefined"
	Quarter = params['Quarter']
	contribution = params['contribution']
	print(view)
	print(select)
	print(target)
	#select = "LY, Account_Hierarchy, VersionVersion, ORG, DepartmentId,DepartmentDescription"
	#filtr = "undefined"
	#view = "BudgetPlanner200"
	features = getTableDataST(view, target+","+select,filtr)
	data = features
	features = pd.get_dummies(features)
	labels = np.array(features[target])
	# Remove the labels from the features
	# axis 1 refers to the columns
	features= features.drop(target, axis = 1)
	# Saving feature names for later use
	feature_list = list(features.columns)
	# Convert to numpy array
	features = np.array(features)
	print(features)
	# Split the data into training and testing sets
	# train_features, test_features, train_labels, test_labels = train_test_split(features, labels, test_size = 0.25, random_state = 42)
	if features.shape != (0,0):
		infl_features = RF(features, labels, feature_list)
		result = {
			"node_name":"LY",
			"children":[]
		}
		i=0;
		for feature in infl_features:
			feature_name=""
			k=0
			for k in range(len(feature[0])-1):
				if k>0:
					feature_name = feature_name+"_"+feature[0][k]
				else:
					feature_name = feature_name+feature[0][k]
			result['children'].append({
				"node_name":feature_name,
				"node_value":feature[0][len(feature)-1],
				"Importance_value":feature[1],
				"children":[]
			})
			data1 = data[data[feature_name] == feature[0][len(feature)-1]]
			data_temp = data1
			labels = np.array(data1[target])
			data1 = data1.drop(feature_name, axis=1)
			data1= data1.drop(target, axis = 1)
			data1 = pd.get_dummies(data1)
			feature_list = list(data1.columns)
			data1 = np.array(data1)
			if data1.shape != (0,0):
				# train_features, test_features, train_labels, test_labels = train_test_split(data1, labels, test_size = 0.25, random_state = 42)
				child_infl_Features = RF(data1, labels, feature_list)
				j=0
				for child_feature in child_infl_Features:
					child_feature_name=""
					k=0
					for k in range(len(child_feature[0])-1):
						if k>0:
							child_feature_name = child_feature_name+"_"+child_feature[0][k]
						else:
							child_feature_name = child_feature_name+child_feature[0][k]
					result['children'][i]['children'].append({
						"node_name":child_feature_name,
						"node_value":child_feature[0][len(child_feature)-1],
						"Importance_value":child_feature[1],
						"children":[]
					})
					
					data2 = data_temp[data_temp[child_feature_name] == child_feature[0][len(child_feature)-1]]
					data2 = data2.drop(child_feature_name, axis=1)
					labels2 = np.array(data2[target])
					data2 = data2.drop(target, axis = 1)
					data2 = pd.get_dummies(data2)
					feature_list = list(data2.columns)
					data2 = np.array(data2)
					if data2.shape != (0,0):
						child_infl_Features2 = RF(data2, labels2, feature_list)
						for child_feature2 in child_infl_Features2:
							child_feature2_name = ""
							k=0
							for k in range(len(child_feature2[0])-1):
								if k>0:
									child_feature2_name = child_feature2_name+"_"+child_feature2[0][k]
								else:
									child_feature2_name = child_feature2_name+child_feature2[0][k]
								result['children'][i]['children'][j]['children'].append({
									"node_name":child_feature2_name,
									"node_value":child_feature2[0][len(child_feature2)-1],
									"Importance_value":child_feature2[1]
								})
					j = j+1
			i = i+1
		else:
			return "Insufficient Data"
	return result

@app.route('/FileUploader', methods = ['POST', 'PUT'])
def FileUploader():
	if flask.request.method == 'POST':
		params = request.get_json()
		encrypted = params['data']
		fileName = params['fileName']
		# agg = params['agg']
		decrypted=base64.b64decode(encrypted)
		toread = io.BytesIO()
		toread.write(decrypted)  # pass your `decrypted` string as the argument here
		toread.seek(0)
		excel_data_df = pd.read_excel(toread)
		data = excel_data_df.to_dict(orient='record')
		column = excel_data_df.columns.ravel()
		column_det = getColType(data, column)
		dateCol = []
		for col in column_det:
			if col['DATATYPE'] == "Date, formula":
				dateCol.append(col['LABEL'])
		emptyData(fileName)
		data = removeNATValues(data, dateCol)
		udata = updateData1(data, column)
		addData(fileName, udata)
		updateMetadata(fileName, column_det)
		return json.dumps({"insert": True, "columnData": column_det})
	elif flask.request.method == 'PUT':
		params = request.get_json()
		column_det = params['COLUMN_DET']
		fileName = params['fileName']
		data = getData1(fileName)
		data = updateData(data,column_det)
		emptyData(fileName)
		addData(fileName, data)
		updateMetadata(fileName, column_det)
		return json.dumps({"update": True, "columnData": column_det})

@app.route('/getAllTablesAndViews', methods=['GET'])
def getAllTablesAndViews():
    params = flask.request.args
    mongoClient = MongoClient(mongoURL)
    db = mongoClient[params['db']]
    col = db["CollectionDetails"]
    tables = []
    views = []
    if '$filter' in params:
        filtr = {
            'department': params['$filter'].split(" eq ")[1]
        }
    else:
        filtr = {}
    print(filtr)
    # for row in col.find(filtr).sort('last_change', pymongo.DESCENDING):
    for row in col.find({ '$query': {}, '$orderby': { '_id' : -1 } }):
        print(row['TABLENAME'])
        if row['TABLE_TYPE'] == "TABLE":
            properties = []
            i = 0
            for col in row['COLUMN_DET']:
                property = {
                    "name": col['COLUMN_NAME'],
                    "label": col['LABEL'],
                    "datatype": col['DATATYPE'],
                    "type": col['TYPE'],
                    "format": col['FORMAT']
                }
                properties.append(property)
            tables.append({
                'TABLE_NAME': row['TABLENAME'],
                'TABLE_CATALOG': params['db'],
                'property': properties,
                'COLUMN_DET': row['COLUMN_DET']
            })
        elif row['TABLE_TYPE'] == "VIEW":
            properties = []
            i = 0
            for col in row['COLUMN_DET']:
                property = {
                    "name": col['COLUMN_NAME'],
                    "label": col['LABEL'],
                    "datatype": col['DATATYPE'],
                    "type": col['TYPE'],
                    "format": col['FORMAT']
                }
                properties.append(property)
            tables.append({
                'TABLE_NAME': row['view_name'],
                'TABLE_CATALOG': params['db'],
                'department': row['department'],
                'description': row['description'],
                'last_change': row['last_change'],
                'property': properties,
                'COLUMN_DET': row['COLUMN_DET']
            })
            views.append({
                'view_id': str(row['_id']),
                'name': row['view_name'],
                'department': row['department'],
                'last_change': row['last_change']
            })
        else:
            print("Error")
    # print(views[0]['view_id'])
    return json.dumps({'Tables': tables, 'Views': views, 'Count_Tables': len(tables), 'Count_Views': len(views)})

@app.route('/AddNode', methods = ['POST'])
def addNode():
	params = request.get_json()
	fileName = params['fileName']
	node_name = params['node_name']
	formula = params['formula']
	data = getData1(fileName)
	column_det = getColumnDetails(fileName)
	uData = addNewColumn(data, column_det, node_name, fileName, formula)
	column_det['MEASURES'].append(node_name)
	if type(uData[0][node_name]) == type(1):
		datatype = "Int"
	else:
		datatype = "Float"
	column_det['COLUMN_DET'].append({'COLUMN_NAME':"_".join(node_name.split(" ")), 'LABEL':node_name, 'DATATYPE':datatype, 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
	emptyData(fileName)
	addData(fileName, data)
	updateMetadata(fileName, column_det['COLUMN_DET'])
	return json.dumps({"update": True})
    
@app.route('/MeasureTree', methods = ['GET'])
def measureTree():
	params = flask.request.args
	table = params['view'] 
	select = params['select']
	target = params['target']
	filtr = "undefined"
	VariantId = params['variantID']
	if "year" in params and params['year'] != "All":
		time = params['time']
		year = params['year']
		print(time+" "+year)
		days=0
		if len(year.split("M"))>1:
			days = Int(year.split("M")[0]) * 30
		elif len(year.split("Y"))>1:
			days = Int(year.split("Y")[0]) * 365
		date1 = pd.Timestamp(datetime.today() - timedelta(days=days))
		date2 = pd.Timestamp(datetime.today())
		datefilter = time+" >= "+date1+" AND "+ time+" <= "+date2
		filtr = datefilter
	tableDet = getColumnDetails(table)
	data = getTableData(table, tableDet, target+","+select, filtr)
	test_data = getValue(table, tableDet, select,filtr)
	X = data.iloc[:,1:]
	Y = data.iloc[:,0:1]
	regressor = LinearRegression()
	regressor.fit(X, Y)
	B0 = regressor.intercept_
	coefficients = regressor.coef_
	coeff_df = pd.DataFrame(regressor.coef_[0], X.columns.ravel(), columns=['Coefficient'])  
	result = {
		"id":"Node1",
		"intercept" : regressor.intercept_[0],
		"title" : "Measure",
		"children":[],
		"name":target.upper(),
		"value_org":regressor.predict(test_data)[0][0],
		"value":regressor.predict(test_data)[0][0],
		"Difference":0
	}
	i=0
	select = select.split(",")
	print(select)
	columns = test_data.columns.ravel()
	for val in columns:
		result["children"].append({
			"name":val,
			"co_val":coeff_df['Coefficient'][i],
			"isHidden":False,
			"isLocked":False,
			"selected":False,
			"nodecomments":[],
			"value_org":test_data[val.upper()][0],
			"value":test_data[val.upper()][0],
			"Difference":0
		})
	mongoClient = MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	col.update_one({"VariantId":VariantId},{'$set':{"MeasureTree":result}})
	return json.dumps(result)
    
@app.route('/getData', methods=['GET'])
def getData():
	params = flask.request.args
	table = params['fileName']
	if '$select' in params:
		select = params['$select']
	else:
		select = 'undefined'
	if '$filter' in params:
		filtr = params['$filter'].upper()
		filtr = filtr.replace("EQ", "=")
		filtr = filtr.replace("NE", "!=")
		filtr = filtr.replace("LT", "<")
		filtr = filtr.replace("GT", ">")
		filtr = filtr.replace("LE", "<=")
		filtr = filtr.replace("GE", ">=")
	else:
		filtr = 'undefined'
	if '$top' in params:
		top = params['$top']
	else:
		top = 'undefined'
	collDet = getColumnDetails(table)
	date = datetime.now()
	date1 = date
	grpby = []
	if select != "undefined": 
		select = select.upper()
		select = select.split(",")
	else:
		select =[]
		for col in collDet['COLUMN_DET']:
			select.append(col['COLUMN_NAME'])
	sql = "SELECT "
	i=0
	for val in select:
		if i>0:
			sql = sql+","
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'] == val and col['TYPE'] == "MEASURE":
				sql =  sql = sql + col['AGGREGATIONTYPE'].upper()+"("+val.upper()+")"+" AS "+val.upper()
				i = i+1
			elif col['COLUMN_NAME'] == val:
				sql = sql + val.upper()
				grpby.append(val.upper())
				i = i+1
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr.upper()+" GROUP BY "
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))+" GROUP BY "
	i=0
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val.upper()
		i = i+1
	if top != "undefined":
		sql = sql + " LIMIT "+ top
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	date = datetime.now()
	data = my_spark.sql(sql)
	date = datetime.now()
	data =  data.toJSON().collect()
	res = []
	for row in data:
		res.append(json.loads(row))
	return json.dumps(res)
	print(datetime.now() - date1)
app.run(port=5000)