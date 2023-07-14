import flask
from pyspark.sql import SparkSession
import sys, json
from pymongo import MongoClient
from statsmodels.tsa.seasonal import seasonal_decompose 
from statsmodels.tsa.statespace.sarimax import SARIMAX
from datetime import datetime, timedelta

from sklearn.linear_model import LinearRegression
import pandas as pd
import numpy as np
from flask import Flask,Response, request
import pymongo
# from pymongo import MongoClient,errors,TEXT,ASCENDING,DESCENDING
import bson 
from bson import ObjectId
from bson.json_util import dumps as bson2json
import json as pyjson
import base64, io
from sklearn.model_selection import train_test_split

# Import the model we are using
from sklearn.ensemble import RandomForestRegressor



my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)

def RF(train_features, train_labels, feature_list):
	print(train_features)
	print(train_labels)
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
	print(feature_importances)
	if len(feature_importances)>=3:
		feature1 = [feature_importances[0][0].split("_"),feature_importances[0][1]]
		feature2 = [feature_importances[1][0].split("_"),feature_importances[1][1]]
		feature3 = [feature_importances[2][0].split("_"),feature_importances[2][1]]
		return [feature1, feature2, feature3]
	elif len(feature_importances) == 2:
		feature1 = [feature_importances[0][0].split("_"),feature_importances[0][1]]
		feature2 = [feature_importances[1][0].split("_"),feature_importances[1][1]]
		return [feature1, feature2]
	elif len(feature_importances) == 1:
		feature1 = [feature_importances[0][0].split("_"),feature_importances[0][1]]
		return [feature1]
	else:
		return []

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

def addData(collection, data):
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.insert_many(data)
		
def updateMetadata(collection, column_det):
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
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
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
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
			resRow["_".join(str(col).split(" "))] = row[col]
		uData.append(resRow)
	return uData
    
def getColumnDetails(table):
	mongoClient = MongoClient("mongodb://localhost:27017/")
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
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getTableDataST(table, collDet, select, filtr):
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	sql = "SELECT "
	select= select.split(",")
	i=0
	for val in select:
		for col in collDet:
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "DIMENSION":
				if i>0:
					sql = sql +","
				sql = sql + val
				i = i+1
	sql = sql + ","+select[0]
	if filtr != "undefined":
		sql = sql +" FROM "+ "_".join(table.split(" "))+ " WHERE "+filtr
	else:
		sql = sql +" FROM "+ "_".join(table.split(" "))
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
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getData1(collection):
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	data = []
	for row in col.find():
		#del row['_id']
		#print(row)
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
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.drop()
    
def addNewColumn(data, column_det, node_name, fileName, formula):
	for col in column_det['COLUMN_DET']:
		formula = formula.replace(col['COLUMN_NAME'], 'row[\''+col['COLUMN_NAME']+'\']')
	print(formula)
	uData = []
	for row in data:
		row[node_name] = eval(formula)
		uData.append(row)
	return uData
	
def getMeasureTree(variantId):
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	print(variantId)
	result = col.find_one({"VariantId":int(variantId)})
	MT = json.loads(result['MeasureTree'])
	return MT

def getSegmentTree(variantId):
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	print(variantId)
	result = col.find_one({"VariantId":int(variantId)})
	print(type(result['SegmentTree']))
	if type(result['SegmentTree']) == type("") and result['SegmentTree']!="":
		ST = json.loads(result['SegmentTree'])
	else:
		ST = result['SegmentTree']
	return ST

def getCoeff(MT):
	result = []
	for child in MT['children']:
		try:
			result.append({
				"name":child['name'],
				"co_val":child['co_val'],
				"delta_diff":child['difference']/child['value_org']
			})
		except:
			result.append({
				"name":child['name'],
				"co_val":child['co_val'],
				"delta_diff":0
			})
	return result

def getActual(MT):
	result = []
	for child in MT['children']:
		result.append({
			"name":child['name'],
			"co_val":child['co_val'],
			"delta_diff":0
		})
	return result

def getQuery(table, filtr, selectD, variant1_Coeff, variant2_Coeff, I1, I2, TM, actual):
	sql = "SELECT "+selectD+" , ("+str(I1)
	for val in variant1_Coeff:
		sql = sql+"+("+str(val['co_val'])+"*(first("+val['name']+")+(first("+val['name']+")*("+str(val['delta_diff'])+"))))"
	sql = sql +") AS "+TM+"_variant1"+", "+"("+str(I2)
	for val in variant2_Coeff:
		sql = sql+"+("+str(val['co_val'])+"*(first("+val['name']+")+(first("+val['name']+")*("+str(val['delta_diff'])+"))))"
	sql = sql +") AS "+TM
	if actual == True:
		sql = sql +"_actual"
	else:
		sql = sql +"_variant2"
	sql = sql+" FROM "+"_".join(table.split(" "))
	if filtr != "undefined":
		sql = sql+" WHERE "+filtr
	sql = sql+" GROUP BY "+selectD
	return sql
    

def getTableDataTSF(table, collDet, select, filtr):
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
				if i>0:
					sql = sql+","
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
	sql = sql+" ORDER BY "+ select[0]+" ASC "
	print(sql)
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def forecast(view, collDet, target, date, pdate, filtr):
	data = getTableDataTSF(view, collDet, target+","+date, filtr)
	print(data)
	data[date.upper()] = pd.to_datetime(data[date.upper()],infer_datetime_format=True, unit='ms') #convert from string to datetime
	data = data.set_index([date.upper()])
	data = data.sort_values(by = date.upper())
	print(data)
	
	model = SARIMAX(data[target.upper()], order=(0, 1,0), seasonal_order=(1,0,0,12),enforce_stationarity=False)
	print(model)
	result = model.fit()
	if pdate == True:
		forecast = result.predict(start = 0,  
							  end = (len(data)-1),  
							  typ = 'levels').rename('Forecast') 
		return forecast
	else:
		forecast = result.get_prediction(start=pdate)
		return forecast.predicted_mean[0]

app = flask.Flask(__name__)
app.config["DEBUG"] = True

@app.route('/SegmentTree', methods = ['GET'])
def SegmentTree():
	params = flask.request.args
	view = params['view']
	select = params['select']
	target = params['target']
	VariantId = params['variantID']
	filtr = "undefined"
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
	contribution = params['contribution']
	print(view)
	print(select)
	print(target)
	#select = "LY, Account_Hierarchy, VersionVersion, ORG, DepartmentId,DepartmentDescription"
	#filtr = "undefined"
	#view = "BudgetPlanner200"
	collDet = getColumnDetails(view)
	features = getTableDataST(view, collDet['COLUMN_DET'], target+","+select,filtr)
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
		agg = data.aggregate({target:['sum']})
		result = {
			"name":target,
			"title":target,
			"Value":int(agg[target]['sum']),
			"children":[]
		}
		i=0;
		for feature in infl_features:
			if feature[1] > 0:
				feature_name=""
				k=0
				for k in range(len(feature[0])-1):
					if k>0:
						feature_name = feature_name+"_"+feature[0][k]
					else:
						feature_name = feature_name+feature[0][k]
				feature_value = feature[0][len(feature[0])-1]
				print(feature_name)
				print(feature_value)
				data1 = data[data[feature_name] == feature_value]
				print(data1)
				agg = data1.aggregate({target:['sum']})
				result['children'].append({
					"name":feature_name,
					"name1":feature_name,
					"title":feature[0][len(feature[0])-1],
					"Value":int(agg[target]['sum']),
					"impact":feature[1],
					"children":[]
				})
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
						if child_feature[1] > 0:
							child_feature_name=""
							k=0
							for k in range(len(child_feature[0])-1):
								if k>0:
									child_feature_name = child_feature_name+"_"+child_feature[0][k]
								else:
									child_feature_name = child_feature_name+child_feature[0][k]
							child_feature_value = child_feature[0][len(child_feature[0])-1]
							data2 = data_temp[data_temp[child_feature_name] == child_feature_value]
							print(data2)
							agg = data2.aggregate({target:['sum']})
							result['children'][i]['children'].append({
								"name":child_feature_name,
								"name1":child_feature_name,
								"title":child_feature[0][len(child_feature[0])-1],
								"Value":int(agg[target]['sum']),
								"impact":child_feature[1],
								"children":[]
							})
							data2_temp = data2
							data2 = data2.drop(child_feature_name, axis=1)
							labels2 = np.array(data2[target])
							data2 = data2.drop(target, axis = 1)
							data2 = pd.get_dummies(data2)
							feature_list = list(data2.columns)
							data2 = np.array(data2)
							if data2.shape != (0,0):
								child_infl_Features2 = RF(data2, labels2, feature_list)
								for child_feature2 in child_infl_Features2:
									if child_feature2[1] >0:
										child_feature2_name = ""
										k=0
										for k in range(len(child_feature2[0])-1):
											if k>0:
												child_feature2_name = child_feature2_name+"_"+child_feature2[0][k]
											else:
												child_feature2_name = child_feature2_name+child_feature2[0][k]
										child_feature2_value = child_feature2[0][len(child_feature2)-1]
										data3 = data2_temp[data2_temp[child_feature2_name] == child_feature2_value]
										agg = data3.aggregate({target:['sum']})
										result['children'][i]['children'][j]['children'].append({
											"name":child_feature2_name,
											"name1":child_feature2_name,
											"title":child_feature2[0][len(child_feature2[0])-1],
											"Value":int(agg[target]['sum']),
											"impact":child_feature2[1]
										})
						j = j+1
			i = i+1
	else:
		return "Insufficient Data"
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	res = {"root":result}
	update = col.update_one({"VariantId":int(VariantId)},{'$set':{"SegmentTree":json.dumps(result)}})
	print(update.matched_count)
	return res

@app.route('/Report_KeyInfluencers', methods = ['GET'])
def CompareKeyInfluencers():
	params = flask.request.args
	variantID=params['variantID']
	view = params['view']
	collDet = getColumnDetails(view)
	ST = getSegmentTree(variantID)
	result = []
	print(ST)
	if ST != "":
		for val in ST['children']:
			for col in collDet['COLUMN_DET']:
				if col['COLUMN_NAME'] == val['name'] or col['COLUMN_NAME'].upper() == val['name']:
					val['name'] = col['LABEL']
					break
			result.append({'Name':val['name']+" "+val['dtitle'], 'Value':val['impact']})
			if 'children' in val:
				for val1 in val['children']:
					for col in collDet['COLUMN_DET']:
						if col['COLUMN_NAME'] == val1['name'] or col['COLUMN_NAME'].upper() == val1['name']:
							val1['name'] = col['LABEL']
							break
					result.append({'Name':val1['name']+" "+val1['dtitle'], 'Value':val1['impact']})
					if 'children' in val1:
						for val2 in val1['children']:
							for col in collDet['COLUMN_DET']:
								if col['COLUMN_NAME'] == val2['name'] or col['COLUMN_NAME'].upper() == val2['name']:
									val2['name'] = col['LABEL']
									break
							result.append({'Name':val2['name']+" "+val2['dtitle'], 'Value':val2['impact']})
	return json.dumps(sorted(result, key = lambda i: i['Value'],reverse=True))

@app.route('/Report_VariantComparision', methods = ['GET'])
def VariantCompare():
	params = flask.request.args
	view=params['view']
	variantID=params['variantID']
	#select=params['select']
	# target=params['target']
	# selectD=params['selectD']
	#selectM=params['selectM']
	filtr = "undefined"
	variants = variantID.split(",")
	collDet = getColumnDetails(view)
	if variants[0] == "101" and variants[1] != "102":
		variant1 =getMeasureTree(variants[1])
		result = [{
			"name":variant1['name'],
			"Actual value":variant1['value_org'],
			"Variant value":variant1['value']
		}]
		for val in variant1['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":val['value']
			})
	elif variants[1] == "101" and variants[0] != "102":
		variant1 =getMeasureTree(variants[0])
		result = [{
			"name":variant1['name'],
			"Actual value":variant1['value_org'],
			"Variant value":variant1['value']
		}]
		for val in variant1['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":val['value']
			})
	elif variants[0] == "102" and variants[1] == "101":
		view = params['view']
		collDet = getColumnDetails(view)
		date = params['Date']
		# selectM = params['selectM']
		month = params['Month']
		filtr = "undefined"
		collDet = getColumnDetails(view)
		pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
		variant = getMeasureTree(variants[2])
		result = [{
			"name": variant['name'],
			"Actual value":variant['value_org'],
			"Forecast value":forecast(view, collDet, variant['name'], date, pdate, filtr)
		}]
		for val in variant['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":forecast(view, collDet, variant['name'], date, pdate, filtr)
			})		
	elif variants[0] == "101" and variants[1] == "102":
		view = params['view']
		collDet = getColumnDetails(view)
		date = params['Date']
		# selectM = params['selectM']
		month = params['Month']
		filtr = "undefined"
		collDet = getColumnDetails(view)
		pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
		variant = getMeasureTree(variants[2])
		result = [{
			"name": variant['name'],
			"Actual value":variant['value_org'],
			"Forecast value":forecast(view, collDet, variant['name'], date, pdate, filtr)
		}]
		for val in variant['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":forecast(view, collDet, variant['name'], date, pdate, filtr)
			})		
	elif variants[0] == "102" and variants[1] != "101":
		view = params['view']
		collDet = getColumnDetails(view)
		date = params['Date']
		# selectM = params['selectM']
		month = params['Month']
		filtr = "undefined"
		collDet = getColumnDetails(view)
		pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
		variant = getMeasureTree(variants[1])
		result = [{
			"name": variant['name'],
			"Actual value":variant['value_org'],
			"Forecast value":forecast(view, collDet, variant['name'], date, pdate, filtr)
		}]
		for val in variant['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":forecast(view, collDet, variant['name'], date, pdate, filtr)
			})
	elif variants[1] == "102" and variants[0] != "101":
		view = params['view']
		collDet = getColumnDetails(view)
		date = params['Date']
		# selectM = params['selectM']
		month = params['Month']
		filtr = "undefined"
		collDet = getColumnDetails(view)
		pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
		variant = getMeasureTree(variants[0])
		result = [{
			"name": variant['name'],
			"Actual value":variant['value_org'],
			"Forecast value":forecast(view, collDet, variant['name'], date, pdate, filtr)
		}]
		for val in variant['children']:
			result.append({
				"name":val['name'],
				"Actual value":val['value_org'],
				"Variant value":forecast(view, collDet, variant['name'], date, pdate, filtr)
			})
	else:
		variant1 = getMeasureTree(variants[0])
		variant2 = getMeasureTree(variants[1])
		result = [{
			"name":variant1.name,
			"Variant1 value":variant1['value'],
			"Variant2 value":variant2['value']
		}]
		for val in variant1.children:
			value = {
				"name":val['name'],
				"Variant1 value":val['value']
			}
			for val2 in variant2.children:
				if val2['name'] == val['name']:
					value['Variant2 value'] = val2['value'] 
			result.append(Value)
	for row in result:
		for col in collDet['COLUMN_DET']:
			if col["COLUMN_NAME"] == row['name']:
				row['name'] = col["LABEL"]
				break
			elif col['COLUMN_NAME'].upper() == row['name']:
				row['name'] = col['LABEL']
				break
	return json.dumps(result)
@app.route('/Report_MeasureDimensionSelection', methods = ['GET'])
def VariantComapareWithMAndN():
	params = flask.request.args
	view=params['view']
	variantID=params['variantID']
	#select=params['select']
	target=params['target']
	selectD=params['selectD']
	#selectM=params['selectM']
	filtr = "undefined"
	collDet = getColumnDetails(view)
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
	variants = variantID.split(",")
	isforecast = False
	#ActualModel, Variant
	if variants[0] == "101" and variants[1] != "102":
		MT1 = getMeasureTree(variants[1])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
	#Variant,ActualModel
	elif variants[1] == "101" and variants[0] != "102":
		MT1 = getMeasureTree(variants[0])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
	# Forecast,Variant
	elif variants[0] == "102" and variants[1] != "101":
		MT1 = getMeasureTree(variants[1])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, params['Date']+","+selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
		isActual = False
		isforecast = True
		collDet = getColumnDetails(view)
		forecastVal = forecast(view, collDet, target, params['Date'], True, filtr)
	#Forecast,ActualModel
	elif variants[0] == "102" and variants[1] == "101":
		MT1 = getMeasureTree(variants[2])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, params['Date']+","+selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
		isActual = True
		isforecast = True
		collDet = getColumnDetails(view)
		forecastVal = forecast(view, collDet, target, params['Date'], True, filtr)
	#ActualModel,Forecast
	elif variants[0] == "101" and variants[1] == "102":
		MT1 = getMeasureTree(variants[2])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, params['Date']+","+selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
		isActual = True
		isforecast = True
		collDet = getColumnDetails(view)
		forecastVal = forecast(view, collDet, target, params['Date'], True, filtr)
	#Variant,Forecast
	elif variants[1] == "102" and variants[0] != "101":
		MT1 = getMeasureTree(variants[0])
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery(view, filtr, params['Date']+","+selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
		isActual = False
		isforecast = True
		collDet = getColumnDetails(view)
		forecastVal = forecast(view, collDet, target, params['Date'], True, filtr)
	# Variant,Variant
	else:
		MT1 = getMeasureTree(variants[0])
		MT2 = getMeasureTree(variants[1])
		variant1_Coeff = getCoeff(MT1)
		variant2_Coeff = getCoeff(MT2)
		sql = getQuery(view, filtr, selectD, variant1_Coeff, variant2_Coeff,MT1['intercept'],MT2['intercept'], target,False)
	# MT1 = getMeasureTree(variants[0])
	# if int(variants[1]) != 101:
		# MT2 = getMeasureTree(variants[1])
		# variant1_Coeff = getCoeff(MT1)
		# variant2_Coeff = getCoeff(MT2)
		# sql = getQuery(view, filtr, selectD, variant1_Coeff, variant2_Coeff,MT1['intercept'],MT2['intercept'], target,False)
	# else:
		# variant1_Coeff = getCoeff(MT1)
		# actual_Coeff = getActual(MT1)
		# sql = getQuery(view, filtr, selectD, variant1_Coeff, actual_Coeff,MT1['intercept'],MT1['intercept'], target,True)
	print(sql)
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(view.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(view.split(" ")))
	data = my_spark.sql(sql)
	data = data.toJSON().collect()
	res = []
	for row in data:
		row = json.loads(row)
		for col in collDet['COLUMN_DET']:
			if col['COLUMN_NAME'] in row:
				row[col['LABEL']] = row[col['COLUMN_NAME']]
				del row[col['COLUMN_NAME']]
				if col['DATATYPE'] == "Date":
					Date = col['LABEL']
				break
			elif col['COLUMN_NAME'].upper() in row:
				row[col['LABEL']] = row[col['COLUMN_NAME'].upper()]
				del row[col['COLUMN_NAME'].upper()]
				break
		if target+"_actual" in row:
			row[" ".join(target.split("_"))+" Actual"] = row[target+"_actual"]
			del row[target+"_actual"]
		if target+"_variant1" in row:
			row[" ".join(target.split("_"))+" Variant1"] = row[target+"_variant1"]
			del row[target+"_variant1"]
		if target+"_variant2" in row:
			row[" ".join(target.split("_"))+" Variant2"] = row[target+"_variant2"]
			del row[target+"_variant2"]
		
		res.append(row)
	if isforecast:
		for row in res:
			for val in forecastVal.index:
				if val.tz_localize(None) == pd.to_datetime(row[Date],infer_datetime_format=True).tz_localize(None):
					row[" ".join(target.split("_"))+" Forecast"] = forecastVal[val]
			if isActual:
				del row[" ".join(target.split("_"))+" Variant1"]
			else:
				del row[" ".join(target.split("_"))+" Actual"]
	
	return json.dumps(res)


@app.route('/Forecast', methods = ['GET'])
def TSF():
	params = flask.request.args
	view = params['view']
	target = params['target']
	date = params['Date']
	selectM = params['selectM']
	month = params['Month']
	filtr = "undefined"
	collDet = getColumnDetails(view)
	
	select = selectM.split(",")
	
	pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
	
	result = {
		'name':target,
		'value': forecast(view, collDet, target, date, pdate, filtr),
		'children':[]
	}
	for val in select:
		result['children'].append({
			'name':val,
			'value':forecast(view, collDet, val, date, pdate, filtr)
		})
	print(result)

	return json.dumps({"root":result},  indent=4, sort_keys=True, default=str )

@app.route('/FileUploader/Tables', methods = ['GET'])
def getTables():
	params = flask.request.args
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	print({'FileName':params['FileName']})
	if "FileName" in params:
		col_Det = getColumnDetails(params['FileName'])
		del col_Det['_id']
	else:
		col_Det = []
		for row in col.find({}):
			del row['_id']
			col_Det.append(row)
	return json.dumps(col_Det)

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
		"value_copy":regressor.predict(test_data)[0][0],
		"difference":0
	}
	i=0
	select = select.split(",")
	print(select)
	columns = test_data.columns.ravel()
	for val in columns:
		result["children"].append({
			"name":val,
			"title":val,
			"co_val":coeff_df['Coefficient'][i],
			"isHidden":False,
			"isLocked":False,
			"selected":False,
			"nodecomments":[],
			"value_org":test_data[val.upper()][0],
			"value":test_data[val.upper()][0],
			"value_copy":test_data[val.upper()][0],
			"difference":0
		})
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	col.update_one({"VariantId":int(VariantId)},{'$set':{"MeasureTree":json.dumps(result)}})
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
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
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
app.run()