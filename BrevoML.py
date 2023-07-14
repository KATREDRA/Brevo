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
from pymongo import MongoClient,errors,TEXT,ASCENDING,DESCENDING
import bson 
from bson import ObjectId
from bson.json_util import dumps as bson2json
import json as pyjson
import base64, io
from sklearn.model_selection import train_test_split
import schedule
import time

# Import the model we are using
from sklearn.ensemble import RandomForestRegressor
import re
import dateparser
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk import FreqDist
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

with open("config.json") as json_data_file:
	config = json.load(json_data_file)
print(config)


# I define the stop_words here so I don't do it every time in the function below
stop_words = stopwords.words('english')
stop_words.append('vs')

def get_keywords(row):
    some_text = row['Configuration']
    # print(some_text)
    lowered = some_text.lower()
    tokens = nltk.tokenize.word_tokenize(lowered)
    keywords = [keyword for keyword in tokens if keyword.isalpha() and not keyword in stop_words]
    keywords_string = ' '.join(keywords)
    return keywords_string

similar_user_kpis = []
def get_similarUserKpis(row):
	# print(row)
	similar_user_kpis.append(row['Configuration'])  
	
def tf_idf(search_keys, dataframe, label):
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_weights_matrix = tfidf_vectorizer.fit_transform(dataframe.loc[:, label])
    search_query_weights = tfidf_vectorizer.transform([search_keys])
    return search_query_weights, tfidf_weights_matrix




def cos_similarity(search_query_weights, tfidf_weights_matrix):
    cosine_distance = cosine_similarity(search_query_weights, tfidf_weights_matrix)
    similarity_list = cosine_distance[0]
    return similarity_list




def most_similar(similarity_list, min_talks=5):
    most_similar= []
  
    while min_talks > 0:
        tmp_index = np.argmax(similarity_list)
        most_similar.append(tmp_index)
        similarity_list[tmp_index] = 0
        min_talks -= 1
    return most_similar

my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.config("spark.network.timeout","100000000s")\
		.config("spark.executer.heartbeatInterval","10000000s")\
		.config("spark.driver.maxResultSize","10g")\
		.config("spark.driver.cores","2")\
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)
mongoURL = config['mongodb']['connection_String']
client = MongoClient(mongoURL)
_db = client.scheduledFileUpload

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
		if isinstance(data[0][col], type(0.1)):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[0][col], type(1)):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[0][col], type(datetime.now())):
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
		else:
			column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})
	return column_det

def addData(collection, data):
	mongoClient = pymongo.MongoClient(mongoURL)
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.insert_many(data)
		
def updateMetadata(collection, column_det):
	mongoClient = pymongo.MongoClient(mongoURL)
	db = mongoClient["fileuploader"]
	coll = db['CollectionDetails']
	measure = []
	dimension = []
	spl_char = [' ', '!', '@', '#', '$', '%', '^', '&', '*', '(',')', '-', '/', '>', '<', ':', ';', '+', '[', ']', '{', '}', '.', ',']
	for col in column_det:
		for char in spl_char:
				col['COLUMN_NAME'] = "_".join(str(col['COLUMN_NAME']).split(char))
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
		"MEASURES":measure,
		"TABLE_TYPE":"TABLE"
	}
	dele = coll.delete_one({"TABLENAME":"_".join(collection.split(" "))})
	coll.insert_one(data)
	return data

def emptyData(collection):
	mongoClient = pymongo.MongoClient(mongoURL)
	db = mongoClient["fileuploader"]
	col = db["_".join(collection.split(" "))]
	col.delete_many({})
	col2 = db['CollectionDetails']
	col2.delete_one({"TABLENAME":"_".join(collection.split(" "))})
	
def removeNATValues(data, columns):
	print(columns)
	uData=[]
	for row in data:
		for col in columns:
			if pd.isnull(row[col]):
				row[col] = pd.Timestamp.min
		uData.append(row)
	return uData
 
def updateData1(data, columns):
	uData = []
	for row in data:
		resRow = {}
		for col in columns:
			if col['DATATYPE'] == "Int" or col['DATATYPE'] == "Float":
				try:
					int(row[col['LABEL']])
				except Exception as e:
					row[col['LABEL']] = 0
			colname = col['COLUMN_NAME']
			spl_char = [' ', '!', '@', '#', '$', '%', '^', '&', '*', '(',')', '-', '/', '>', '<', ':', ';', '+', '[', ']', '{', '}', '.', ',']
			for char in spl_char:
				colname = "_".join(str(colname).split(char))
			resRow[colname] = row[col['LABEL']]
		uData.append(resRow)
	return uData
    
def getColumnDetails(table):
	mongoClient = MongoClient(mongoURL)
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	print("_".join(table.split(" ")))
	col_Det = col.find_one({'TABLENAME':"_".join(table.split(" "))})
	return col_Det

def getTableDetails(db,table):
	print(db)
	print(table)
	mongoClient = MongoClient(mongoURL)
	db = mongoClient[db]
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
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr.upper()
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))
	if len(grpby) > 0:
		sql = sql + " GROUP BY "
	i=0
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val.upper()
		i = i+1
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getTableDataST(table, collDet, select, filtr):
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
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
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	return data

def getData1(collection):
	mongoClient = pymongo.MongoClient(mongoURL)
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
			elif col['DATATYPE'] == "Date" and isinstance(row[col['COLUMN_NAME']], type("")):
				row[col['COLUMN_NAME']] = pd.Timestamp(dateparser.parse(row[col['COLUMN_NAME']]))
			else:
				row[col['COLUMN_NAME']] = str(row[col['COLUMN_NAME']])
		updatedData.append(row)
	return updatedData	

def updateData2(data, column_det, prev_col_det):
	updatedData = []
	for row in data:
		for col in column_det:
			if col['DATATYPE'] == "Int":
				row[col['COLUMN_NAME']] = int(row[col['COLUMN_NAME']])
			elif col['DATATYPE'] == "Float":
				row[col['COLUMN_NAME']] = float(row[col['COLUMN_NAME']])
			elif col['DATATYPE'] == "Date" and isinstance(row[col['COLUMN_NAME']], type("")):
				row[col['COLUMN_NAME']] = pd.Timestamp(dateparser.parse(row[col['COLUMN_NAME']]))
			else:
				for prev_col in prev_col_det:
					if prev_col['COLUMN_NAME'] == col['COLUMN_NAME'] and prev_col['DATATYPE'] == "Float":
						val = str(row[col['COLUMN_NAME']]).split(".")[0]
						row[col['COLUMN_NAME']] = val
		updatedData.append(row)
	return updatedData	

def emptyData(collection):
	mongoClient = pymongo.MongoClient(mongoURL)
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
	mongoClient = MongoClient(mongoURL)
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	print(variantId)
	result = col.find_one({"VariantId":int(variantId)})
	MT = json.loads(result['MeasureTree'])
	return MT

def getSegmentTree(variantId):
	mongoClient = MongoClient(mongoURL)
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
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
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
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

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
	print(features.shape)
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
				try:
					data1 = data[data[feature_name] == feature_value]
				except Exception as e:
					continue
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
				print(data1.shape)
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
							try:
								data2 = data_temp[data_temp[child_feature_name] == child_feature_value]
							except Exception as e:
								continue
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
							print("tst")
							print(data2.shape)
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
										try:
											data3 = data2_temp[data2_temp[child_feature2_name] == child_feature2_value]
										except Exception as e:
											continue
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
		print("Insufficient Data")
		return "Insufficient Data"
	mongoClient = MongoClient(mongoURL)
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
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(view.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(view.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
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
	mongoClient = MongoClient(mongoURL)
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	# print({'FileName':params['FileName']})
	if "FileName" in params:
		col_Det = getColumnDetails(params['FileName'])
		if '_id' in col_Det:
			del col_Det['_id']
	else:
		col_Det = []
		for row in col.find({}):
			del row['_id']
			col_Det.append(row)
	return json.dumps(col_Det)

@app.route('/FileUploader', methods = ['POST', 'PUT', 'DELETE'])
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
		udata = updateData1(data, column_det)
		addData(fileName, udata)
		updateMetadata(fileName, column_det)
		return json.dumps({"insert": True, "columnData": column_det})
	elif flask.request.method == 'PUT':
		params = request.get_json()
		column_det = params['COLUMN_DET']
		fileName = params['fileName']
		prev_col_det = getColumnDetails(fileName)
		data = getData1(fileName)
		data = updateData2(data,column_det, prev_col_det['COLUMN_DET'])
		emptyData(fileName)
		addData(fileName, data)
		updateMetadata(fileName, column_det)
		return json.dumps({"update": True, "columnData": column_det})
	elif flask.request.method == 'DELETE':
		params = request.get_json()
		fileName = params['fileName']
		try:
			mongoClient = pymongo.MongoClient(mongoURL)
			db = mongoClient["fileuploader"]
			metaCol = db['CollectionDetails']
			metaCol.delete_one({'TABLENAME':"_".join(fileName.split(" "))})
			col = db["_".join(fileName.split(" "))]
			col.drop()
			return json.dumps({"delete":True})
		except Exception as e:
			print(str(e))
			return json.dumps({"delete":False})

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
	test_data = getValue(table, tableDet, target+","+select,filtr)
	X = data.iloc[:,1:]
	Y = data.iloc[:,0:1]
	regressor = LinearRegression()
	print(X)
	print(Y)
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
		"value_org":test_data[target.upper()][0],
		"value":test_data[target.upper()][0],
		"value_copy":test_data[target.upper()][0],
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
	mongoClient = MongoClient(mongoURL)
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	col.update_one({"VariantId":int(VariantId)},{'$set':{"MeasureTree":json.dumps(result)}})
	return json.dumps(result)
    
@app.route('/getData', methods=['GET'])
def getData():
	params = flask.request.args
	# print(type(params['$aggregate']))
	table = params['fileName']
	if '$select' in params:
		select = params['$select']
	else:
		select = 'undefined'
	print(select)
	if '$filter' in params:
		filtr = params['$filter']
		filtr = filtr.replace(" eq ", " = ")
		filtr = filtr.replace(" ne ", " != ")
		filtr = filtr.replace(" lt ", " < ")
		filtr = filtr.replace(" gt ", " > ")
		filtr = filtr.replace(" le ", " <= ")
		filtr = filtr.replace(" ge ", " >= ")
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
		# select = select.upper()
		select = select.split(",")
	else:
		select =[]
		for col in collDet['COLUMN_DET']:
			select.append(col['COLUMN_NAME'])
	print(select)
	sql = "SELECT "
	i=0
	for val in select:
		
		# if i>0:
			# sql = sql+","
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "MEASURE":
				if i>0:
					sql = sql+","
				if '$aggregate' in params and params['$aggregate'] == "true":
					sql =  sql = sql + col['AGGREGATIONTYPE'].upper()+"("+val+")"+" AS "+val
				else:
					sql =  sql = sql + val+" AS "+val
				i = i+1
				break;
			elif col['COLUMN_NAME'].upper() == val.upper():
				if i>0:
					sql = sql+","
				sql = sql + val
				if '$aggregate' in params and params['$aggregate'] == "true":
					grpby.append(val)
				i = i+1
				break;
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))
	if len(grpby)>0:
		sql = sql+" GROUP BY "
	i=0
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val
		i = i+1
	print(sql)
	
	if 'orderby' in params and params['orderby']!= "":
		sql = sql+" ORDER BY "+params['orderby']
	if top != "undefined":
		sql = sql + " LIMIT "+ top
	print(sql)
	# df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/fileuploader."+"_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", "fileuploader").option("collection","_".join(table.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
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
	
#----------------------------------------------------------------------------------------------------------------------------
# QUERY BUILDER Services
#----------------------------------------------------------------------------------------------------------------------------

@app.route("/TableData", methods = ['GET'])
def TableData():
	params = flask.request.args
	table = "_".join(params['table'].split(" "))
	database = params['db']
	if '$select' in params:
		select = params['$select']
	else:
		select = 'undefined'
	print(select)
	if '$filter' in params:
		filtr = params['$filter']
		filtr = filtr.replace(" eq ", " = ")
		filtr = filtr.replace(" ne ", " != ")
		filtr = filtr.replace(" lt ", " < ")
		filtr = filtr.replace(" gt ", " > ")
		filtr = filtr.replace(" le ", " <= ")
		filtr = filtr.replace(" ge ", " >= ")
	else:
		filtr = 'undefined'
	if '$top' in params:
		top = params['$top']
	else:
		top = 'undefined'
	print(database)
	print(table)
	collDet = getTableDetails(database, table)
	date = datetime.now()
	date1 = date
	grpby = []
	if select != "undefined": 
		select = select.split(",")
	else:
		select =[]
		for col in collDet['COLUMN_DET']:
			select.append(col['COLUMN_NAME'])
	print(select)
	print(filtr)
	sql = "SELECT "
	i=0
	for val in select:
		
		# if i>0:
			# sql = sql+","
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "MEASURE":
				if i>0:
					sql = sql+","
				if '$aggregate' in params and params['$aggregate'] == "true":
					sql =  sql = sql + col['AGGREGATIONTYPE'].upper()+"("+val+")"+" AS "+val
				else:
					sql =  sql = sql + val+" AS "+val
				i = i+1
				break;
			elif col['COLUMN_NAME'].upper() == val.upper():
				if i>0:
					sql = sql+","
				sql = sql + val
				if '$aggregate' in params and params['$aggregate'] == "true":
					grpby.append(val)
				i = i+1
				break;
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))
	if len(grpby)>0:
		sql = sql+" GROUP BY "
	i=0
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val
		i = i+1
	if 'orderby' in params:
		sql = sql+" ORDER BY "+params['orderby']
	if top != "undefined":
		sql = sql + " LIMIT "+ top
	print(sql)
	# df = my_spark.read.option("uri",mongoURL+database+"."+table).format("com.mongodb.spark.sql.DefaultSource").load()
	df = my_spark.read.option("uri",mongoURL+"?authSource=admin").option("database", database).option("collection",table).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	# try:
	data = my_spark.sql(sql)
	data = data.toJSON().collect()
	res = []
	for row in data:
		row = json.loads(row)
		if len(row)>0:
			if '_id' in row:
				del row['_id']
			res.append(row)
	return json.dumps({"status":"Success", "count":len(res), "tables":res})
	# except Exception as e:
		# print(e)

@app.route("/TableMetadata", methods = ['GET'])
def getTableMetadata():
	params = flask.request.args
	table = params['table']
	db = params['db']
	mongoClient = MongoClient(mongoURL)
	db = mongoClient[db]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':table})
	col_Det['_id'] = str(col_Det['_id'])
	return json.dumps(col_Det)
	
@app.route("/CreateView", methods = ['POST'])
def createView():
	params = flask.request.get_json()
	mongoClient = MongoClient(mongoURL)
	db = mongoClient['Brevo']
	col = db['CollectionDetails']
	view_exits = col.find_one({'TABLENAME':params['view_name']})
	if view_exits != None:
		return json.dumps({"status":"Error", "message":"View name already exists"})
	if params['created_through'] == "wizard":
		parentTable = params['parent_table']
		# db_name = params['db_name']
		tables = params['tables']
		selected_columns = params['selected_columns']
		conditions = params['conditions']
		join_type = params['join_type']
		filtr = params['filter_url']
		view = params['view_name']
		# parentTableData = my_spark.read.option("uri",mongoURL+parentTable).format("com.mongodb.spark.sql.DefaultSource").load()
		parentTableData = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", parentTable.split(".")[0]).option("collection",parentTable.split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
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
			# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
		query = " "
		i = 0
		for i in range(len(tables)):
			query = query+join_type[i]+" "+tables[i].split(".")[1]+" on "+conditions[i]+" "
		sql = "select "+selected_columns+" from "+ parentTable.split(".")[1]+query
		if filtr !="":
			sql = sql + " where "+filtr
		if 'orderby' in params and params['orderby'] != "":
			print(params['orderby'])
			sql = sql + " order by "+params['orderby']
		print(sql)
		data = my_spark.sql(sql)
		columns = data.toPandas().columns.ravel()
		data = data.toJSON().collect()
		res = []
		for row in data:
			res.append(json.loads(row))
		if len(res) == 0:
			return json.dumps({'status':"Error",'message':"Query has 0 results"})
		# collDet = getColType(res, columns)
		collDet = json.loads(params['table_config'])
		# params['COLOUMN_DET'] = collDet
		measures = []
		dimensions = []
		column_det = []
		for col in columns:
			for row in res:
				if col in row:
					if isinstance(row[col], type(0.1)):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
					elif isinstance(row[col], type(1)):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
					elif isinstance(row[col], type(datetime.now())):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
					else:
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})	
					break
		for col in collDet:
			print(col)
			if col['datatype'] == "DIMENSION":
				dimensions.append(col['id'])
			elif col['datatype'] == "MEASURE":
				measures.append(col['id'])

		result = []
		for row in res:
			for col in column_det:
				if not(col["COLUMN_NAME"] in row):
					row[col["COLUMN_NAME"]] = 0
			result.append(row)
		mongoClient = MongoClient(mongoURL)
		db = mongoClient['Brevo']
		col = db["_".join(view.split(" "))]
		col.drop()
		col.insert_many(result)
		metaDB = mongoClient['Brevo']
		metadataCol = metaDB['CollectionDetails']
		params['TABLENAME'] = "_".join(params['view_name'].split(" "))
		params['TABLE_CATALOG'] = 'Brevo'
		params['MEASURES'] = measures
		params['COLUMN_DET'] = column_det
		params['DIMENSIONS'] = dimensions
		params['TABLE_TYPE'] = 'VIEW'
		insert =  metadataCol.insert_one(params)
		return json.dumps({"status":"Success","message":"The View was created with id "+str(insert.inserted_id)})
		# except Exception as e:
			# print(str(e))
			# return json.dumps({"status":"Error","message":"There was some technical error while creating view"})
		
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
				# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
				childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
				childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
				query = re.sub(tables[i], "_".join(tables[i].split(".")[1].split(" ")), query, flags=re.I)
			try:
				data = my_spark.sql(query)
			except Exception as e:
				return json.dumps({'status':"Error",'message':"Invalid Query"})
			# collDet = getColType(data.toPandas())
			columns = data.toPandas().columns.ravel()
			data = data.toJSON().collect()
			res = []
			for row in data:
				res.append(json.loads(row))
			if len(res) == 0:
				return json.dumps({'status':"Error",'message':"Query has 0 results"})
			
			# params['COLOUMN_DET'] = collDet
			measures = []
			dimensions = []
			column_det = []
			for col in columns:
				for row in res:
					if col in row:
						if isinstance(row[col], type(0.1)):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
						elif isinstance(row[col], type(1)):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
						elif isinstance(row[col], type(datetime.now())):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
						else:
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})	
						break
			for col in column_det:
				if col['DATATYPE'] == "String":
					dimensions.append(col['COLUMN_NAME'])
				elif col['DATATYPE'] == "Int" or col['DATATYPE'] == "Float":
					measures.append(col['COLUMN_NAME'])
			result = []
			for row in res:
				for col in column_det:
					if not(col["COLUMN_NAME"] in row):
						row[col["COLUMN_NAME"]] = 0
				result.append(row)
			mongoClient = MongoClient(mongoURL)
			db = mongoClient["Brevo"]
			col = db["_".join(params['view_name'].split(" "))]
			col.drop()
			col.insert_many(res)
			metaDB = mongoClient['Brevo']
			metadataCol = metaDB['CollectionDetails']
			params['TABLENAME'] = "_".join(params['view_name'].split(" "))
			params['TABLE_CATALOG'] = 'Brevo'
			params['COLUMN_DET'] = column_det
			params['MEASURES'] = measures
			params['DIMENSIONS'] = dimensions
			params['TABLE_TYPE'] = 'VIEW'
			insert =  metadataCol.insert_one(params)
			return json.dumps({"status":"Success","message":"The View was created with id "+str(insert.inserted_id)})
		except Exception as e:
			print(str(e))
			return json.dumps({"status":"Error","message":"There was some technical error while creating view  by SQL Editor"})

@app.route("/UpdateView", methods = ['POST'])
def updateView():
	params = flask.request.get_json()
	mongoClient = MongoClient(mongoURL)
	db = mongoClient['Brevo']
	col = db['CollectionDetails']
	view_exits = col.find_one({'TABLENAME':params['view_name']})
	if view_exits != None and str(view_exits['_id']) != params['_id']:
		return json.dumps({"status":"Error", "message":"View name already exists"})
	if params['created_through'] == "wizard":
		parentTable = params['parent_table']
		# db_name = params['db_name']
		tables = params['tables']
		selected_columns = params['selected_columns']
		conditions = params['conditions']
		join_type = params['join_type']
		filtr = params['filter_url']
		view = params['view_name']
		# parentTableData = my_spark.read.option("uri",mongoURL+parentTable).format("com.mongodb.spark.sql.DefaultSource").load()
		parentTableData = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", parentTable.split(".")[0]).option("collection",parentTable.split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
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
			# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
		query = " "
		i = 0
		for i in range(len(tables)):
			print(tables[i])
			print(join_type[i])
			print(conditions[i])
			query = query+join_type[i]+" "+tables[i].split(".")[1]+" on "+conditions[i]+" "
		sql = "select "+selected_columns+" from "+ parentTable.split(".")[1]+query
		if filtr !="":
			sql = sql + " where "+filtr
		if 'orderby' in params and params["orderby"] != "":
			sql = sql + " order by "+params['orderby']
		print(sql)
		data = my_spark.sql(sql)
		columns = data.toPandas().columns.ravel()
		data = data.toJSON().collect()
		res = []
		for row in data:
			res.append(json.loads(row))
		if len(res) == 0:
			return json.dumps({'status':"Error",'message':"Query has 0 results"})
		# collDet = getColType(res, columns)
		collDet = json.loads(params['table_config'])
		column_det = []
		for col in columns:
			for row in res:
				if col in row:
					if isinstance(row[col], type(0.1)):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
					elif isinstance(row[col], type(1)):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
					elif isinstance(row[col], type(datetime.now())):
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
					else:
						column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})	
					break
		result = []
		for row in res:
			for col in column_det:
				if not(col["COLUMN_NAME"] in row):
					row[col["COLUMN_NAME"]] = 0
			result.append(row)
		mongoClient = MongoClient(mongoURL)
		db = mongoClient['Brevo']
		col = db["_".join(view.split(" "))]
		col.drop()
		col.insert_many(result)
		metaDB = mongoClient['Brevo']
		metadataCol = metaDB['CollectionDetails']
		params['TABLENAME'] = "_".join(params['view_name'].split(" "))
		params['COLUMN_DET'] = column_det
		params['TABLE_CATALOG'] = 'Brevo'
		# params['COLOUMN_DET'] = collDet
		measures = []
		dimensions = []
		for col in collDet:
			print(col)
			if col['datatype'] == "DIMENSION":
				dimensions.append(col['id'])
			elif col['datatype'] == "MEASURE":
				measures.append(col['id'])
		params['MEASURES'] = measures
		params['DIMENSIONS'] = dimensions
		params['TABLE_TYPE'] = 'VIEW'
		id = params['_id']
		del params['_id']
		insert =  metadataCol.update_one({'_id':ObjectId(id)},{'$set':params})
		return json.dumps({"status":"Success","message":"The View with id "+str(id)+ " was updated"})
		# except Exception as e:
			# print(str(e))
			# return json.dumps({"status":"Error","message":"There was some technical error while creating view"})
		
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
				# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
				childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
				childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
				query = re.sub(tables[i], "_".join(tables[i].split(".")[1].split(" ")), query, flags=re.I)
			try:
				data = my_spark.sql(query)
			except Exception as e:
				return json.dumps({'status':"Error",'message':"Invalid Query"})
			# collDet = getColType(data.toPandas())
			columns = data.toPandas().columns.ravel()
			data = data.toJSON().collect()
			res = []
			for row in data:
				res.append(json.loads(row))
			if len(res) == 0:
				return json.dumps({'status':"Error",'message':"Query has 0 results"})
			
			# params['COLOUMN_DET'] = collDet
			measures = []
			dimensions = []
			column_det = []
			for col in columns:
				for row in res:
					if col in row:
						if isinstance(row[col], type(0.1)):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
						elif isinstance(row[col], type(1)):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
						elif isinstance(row[col], type(datetime.now())):
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None', 'TYPE':'None'})
						else:
							column_det.append({'COLUMN_NAME':"_".join(str(col).split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})	
						break
			for col in column_det:
				if col['DATATYPE'] == "String":
					dimensions.append(col['COLUMN_NAME'])
				elif col['DATATYPE'] == "Int" or col['DATATYPE'] == "Float":
					measures.append(col['COLUMN_NAME'])
			result = []
			for row in res:
				for col in column_det:
					if not(col["COLUMN_NAME"] in row):
						row[col["COLUMN_NAME"]] = 0
				result.append(row)
			mongoClient = MongoClient(mongoURL)
			db = mongoClient["Brevo"]
			col = db["_".join(params['view_name'].split(" "))]
			col.drop()
			col.insert_many(res)
			metaDB = mongoClient['Brevo']
			metadataCol = metaDB['CollectionDetails']
			params['TABLENAME'] = "_".join(params['view_name'].split(" "))
			params['TABLE_CATALOG'] = 'Brevo'
			params['COLUMN_DET'] = column_det
			params['MEASURES'] = measures
			params['DIMENSIONS'] = dimensions
			params['TABLE_TYPE'] = 'VIEW'
			id = params['_id']
			del params['_id']
			insert =  metadataCol.update_one({'_id':ObjectId(id)},{'$set':params})
			return json.dumps({"status":"Success","message":"The View with id "+str(id)+ " was updated"})
		except Exception as e:
			print(str(e))
			return json.dumps({"status":"Error","message":"There was some technical error while creating view  by SQL Editor"})


@app.route("/GetQuery", methods = ['POST'])
def getQueryQB():
	params = flask.request.get_json()
	parentTable = params['parent_table']
	tables = params['tables']
	selected_columns = params['selected_columns']
	conditions = params['conditions']
	join_type = params['join_type']
	filtr = params['filter_url']
	# parentTableData = my_spark.read.option("uri",mongoURL+parentTable).format("com.mongodb.spark.sql.DefaultSource").load()
	# parentTableData.createOrReplaceTempView("_".join(parentTable.split(".")[1].split(" ")))
	# childTable = []
	# for i in range(len(tables)):
		# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
		# childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
	query = " "
	i = 0
	for i in range(len(tables)):
		query = query+join_type[i]+" "+tables[i]+" on "+conditions[i]+" "
	sql = "select "+selected_columns+" from "+ parentTable+query
	if filtr !="":
		sql = sql + " where "+filtr
	return json.dumps({'status':"Success",'query':sql})	
	
@app.route("/DataPreview", methods = ['POST'])
def dataPreview():
	params = flask.request.get_json()
	parentTable = params['parent_table']
	tables = params['tables']
	selected_columns = params['selected_columns']
	conditions = params['conditions']
	join_type = params['join_type']
	filtr = params['filter_url']
	# parentTableData = my_spark.read.option("uri",mongoURL+parentTable).format("com.mongodb.spark.sql.DefaultSource").load()
	parentTableData = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", parentTable.split(".")[0]).option("collection",parentTable.split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
	parentTableData.createOrReplaceTempView("_".join(parentTable.split(".")[1].split(" ")))
	childTable = []
	for i in range(len(tables)):
		# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
		childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
		childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
	query = " "
	i = 0
	print(tables)
	for i in range(len(tables)):
		print(join_type[i])
		print(tables[i])
		print(conditions[i])
		query = query+join_type[i]+" "+tables[i].split(".")[1]+" on "+conditions[i]+" "
	sql = "select "+selected_columns+" from "+ parentTable.split(".")[1]+query
	if filtr !="":
		sql = sql + " where "+filtr
	if 'orderby' in params and params['orderby']!="":
		sql = sql+" order by "+params['orderby']
	print(sql)
	data = my_spark.sql(sql)
	data = data.toJSON().collect()
	res = []
	for row in data:
		res.append(json.loads(row))
	if len(res) == 0:
		return json.dumps({'status':"Error",'message':"Query has 0 results"})	
	else:
		return json.dumps({'status':"Success",'data':res})	
		
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
			# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
			query = re.sub(tables[i], "_".join(tables[i].split(".")[1].split(" ")), query, flags=re.I)
		print(query)
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
			return json.dumps({"status":"Error", "message":"Query has 0 results"})
	except Exception as e:
			return json.dumps({"status":"Error","message":"Invalid Query"})

@app.route('/WizardDetail', methods = ['POST'])
def getWizardDetail():
	params = flask.request.get_json()
	query = params['query']
	parent_table = re.split(" from ", query, flags=re.I)[1].split(" ")[0]

	selected_columns = re.split(" from ", query, flags=re.I)[0].split("select ")[1]

	join_types = []
	tables =[]
	conditions = []

	fromSplitQuery = re.split(" from ", query, flags=re.I)

	for i in range(len(fromSplitQuery)):
		if i%2 !=0:
			joinSplitQuery = re.split(" join ", fromSplitQuery[i], flags = re.I)
			for j in range(len(joinSplitQuery)):
				if j == 0:
					tables.append(joinSplitQuery[j].split(" ")[0])
					join_types.append(joinSplitQuery[j].split(" ")[1]+" join")
				elif j == (len(joinSplitQuery)-1):
					print(joinSplitQuery[j])
					tables.append(re.split(" on ",joinSplitQuery[j], flags = re.I)[0])
					conditions.append(re.split(" on ",joinSplitQuery[j], flags = re.I)[1])
				else:
					tables.append(joinSplitQuery[j].split(" ")[0])
					join_types.append(joinSplitQuery[j].split(" ")[len(joinSplitQuery[j].split(" "))-1]+" join")
					conditions.append(" ".join(re.split(" on ",joinSplitQuery[j], flags = re.I)[1].split(" ")[:-1]))
					
	return json.dumps({'status':"Success",'data':{
		'parent_table':parent_table,
		'selected_columns':selected_columns,
		'tables':tables,
		'db_name':parent_table.split(".")[0],
		'conditions':conditions,
		'join_types':join_types
	}})
# @app.route('/getAllTablesAndViews', methods=['GET'])
# def getAllTablesAndViews():
	# params = flask.request.args
	# mongoClient = MongoClient(mongoURL)
	# db = mongoClient[params['db']]
	# col = db["CollectionDetails"]
	# tables = []
	# views = []
	# if '$filter' in params:
		# filtr = {
			# 'department':params['$filter'].split(" eq ")[1]
		# }
	# else:
		# filtr = {}
	# print(filtr)
	# for row in col.find(filtr).sort('last_change', pymongo.DESCENDING):
		# if row['TABLE_TYPE'] == "TABLE":
			# tables.append({
				# 'TABLE_NAME': row['TABLENAME'],
				# 'TABLE_CATALOG': params['db'],
				# 'department': row['department'],
				# 'description':row['description'],
				# 'last_change':row['last_change'],
				# 'property':row['COLUMN_DET']
			# })
		# elif row['TABLE_TYPE'] == "VIEW":
			# tables.append({
				# 'TABLE_NAME': row['view_name'],
				# 'TABLE_CATALOG': params['db'],
				# 'department': row['department'],
				# 'description':row['description'],
				# 'last_change':row['last_change'],
				# 'property':row['COLUMN_DET']
			# })
			# views.append({
				# 'view_id':str(row['_id']),
				# 'name':row['view_name'],
				# 'department':row['department']
			# })
	# # print(views[0]['view_id'])
	# return json.dumps({'Tables': tables, 'Views': views, 'Count_Tables': len(tables), 'Count_Views': len(views)})

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
			'department':params['$filter'].split(" eq ")[1]
		}
	else:
		filtr = {}
	print(filtr)
	for row in col.find(filtr).sort('last_change', pymongo.DESCENDING):
		if row['TABLE_TYPE'] == "TABLE":
			properties = []
			i=0
			for col in row['COLUMN_DET']:
				property={
					"name":col['COLUMN_NAME'],
					"label":col['LABEL'],
					"datatype":col['DATATYPE'],
					"type":col['TYPE'],
					"format":col['FORMAT']
				}
				properties.append(property)
			tables.append({
				'TABLE_NAME': row['TABLENAME'],
				'TABLE_CATALOG': params['db'],
				'property':properties,
				'COLUMN_DET':row['COLUMN_DET']
			})
		elif row['TABLE_TYPE'] == "VIEW":
			properties = []
			i=0
			for col in row['COLUMN_DET']:
				property={
					"name":col['COLUMN_NAME'],
					"label":col['LABEL'],
					"datatype":col['DATATYPE'],
					"type":col['TYPE'],
					"format":col['FORMAT']
				}
				properties.append(property)
			tables.append({
				'TABLE_NAME': row['view_name'],
				'TABLE_CATALOG': params['db'],
				'department': row['department'],
				'description':row['description'],
				'last_change':row['last_change'],
				'property':properties,
				'COLUMN_DET':row['COLUMN_DET']
			})
			views.append({
				'view_id':str(row['_id']),
				'name':row['view_name'],
				'department':row['department'],
				'last_change':row['last_change']
			})
	# print(views[0]['view_id'])
	return json.dumps({'Tables': tables, 'Views': views, 'Count_Tables': len(tables), 'Count_Views': len(views)})
	
@app.route('/database_list', methods=['GET'])
def getListOfDatabases():
	dbs = MongoClient(mongoURL).list_database_names()
	Res = []
	for val in dbs:
		Res.append({'name':val})
	return json.dumps({"status":"Success", "database_list":Res})

@app.route('/AddDepartment', methods=['POST'])
def addDepartment():
	params = flask.request.get_json()
	mongoClient = MongoClient(mongoURL)
	db = mongoClient['Brevo']
	col = db["department"]
	dept_exits = col.find_one({'Department_name':params['Department_name']})
	if dept_exits != None :
		return json.dumps({"status":"Error", "message":"Department name already exists"})
	insert = col.insert_one(params)
	return json.dumps({'status':"Success", 'inserted_id':str(insert.inserted_id)})
	

@app.route('/ValidateFormula', methods = ['POST'])
def validateFormula():
	params = flask.request.get_json()
	# conditions = ["1170_Monthly_Report.Reporting_Period=3200_Monthly_Report.Reporting_Period"]
	# encodecondition = "MzIwMF9Nb250aGx5X1JlcG9ydC5WQVRfQW1vdW50ICsgMTE3MF9Nb250aGx5X1JlcG9ydC5WQVRfQW1vdW50"
	# table_name = "fileuploader.1170_Monthly_Report"
	# tables = ["fileuploader.3200_Monthly_Report"]
	# join_type = ["inner join"]
	
	conditions = params['conditions']
	encodecondition = params['encodecondition']
	table_name = params['table_name']
	tables = params['tables']
	join_type = params['join_type']

	formula = base64.b64decode(encodecondition).decode("utf-8") 
	print(formula)
	query ="select ("+ formula +") as calulated_Measure from "+ table_name.split(".")[1]
	print(query)
	i = 0
	for i in range(len(join_type)):
		query = query+ " "+ join_type[i] +" "+tables[i].split(".")[1]+" "+" on "+conditions[i]
	try:
		# parentTableData = my_spark.read.option("uri",mongoURL+table_name).format("com.mongodb.spark.sql.DefaultSource").load()
		parentTableData = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", table_name.split(".")[0]).option("collection",table_name.split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
		parentTableData.createOrReplaceTempView("_".join(table_name.split(".")[1].split(" ")))
		childTable = []
		for i in range(len(tables)):
			# childTable = my_spark.read.option("uri",mongoURL+tables[i]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable = my_spark.read.option("uri","mongodb://techvasppadmin:Init2020!@localhost:28017/?authSource=admin").option("database", tables[i].split(".")[0]).option("collection",tables[i].split(".")[1]).format("com.mongodb.spark.sql.DefaultSource").load()
			childTable.createOrReplaceTempView("_".join(tables[i].split(".")[1].split(" ")))
		data = my_spark.sql(query)
		# data = data.toJSON().collect()
		# print(data['calulated_Measure'])
		return json.dumps({'status':"Success", "message":"Valid Formula"})
	except Exception as e:
		return json.dumps({'status':"Error", "message":"Invalid Formula"})
		
		
#-------------------------------------------------------------------------------------------------------------------------------------------
# File Scheduler Services
#-------------------------------------------------------------------------------------------------------------------------------------------
	
def updateMongoData(id):
	global _db
	mycol = _db['uploadedDocuments']
	fileData = mycol.find_one({'_id':ObjectId(id)})
	fileName = fileData['FileName']
	path = fileData['Path']
	try:
		if path.split(".",1)[1] == "csv":
			excel_data_df = pd.read_csv(path)
			data = excel_data_df.to_dict(orient='record')
			data_list = excel_data_df.to_dict(orient='list')
			column = excel_data_df.columns.ravel()
			try:
				for c in column:
					for index,d in enumerate(data_list[c]):
						if index > 0 and type(data_list[c][index]) != type(data_list[c][index-1]):
							raise Exception
			except Exception:
				error = 'Inconsistant data in column '+c+' of file '+fileName
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pd.Timestamp(datetime.datetime.now())}})
				return
			column_det = getColType(data, column)
			udata = updateData(data, column)
			emptyData(fileName.split(".")[0])
			addData(fileName.split(".")[0], udata)
			updateMetadata(fileName.split(".")[0], column_det)
		elif path.split(".",1)[1] == "xlsx":
			excel_data_df = pd.read_excel(path)
			data = excel_data_df.to_dict(orient='record')
			data_list = excel_data_df.to_dict(orient='list')
			column = excel_data_df.columns.ravel()
			try:
				for c in column:
					for index,d in enumerate(data_list[c]):
						if index > 0 and type(data_list[c][index]) != type(data_list[c][index-1]):
							raise Exception
			except Exception:
				error = 'Inconsistant data in column '+c+' of file '+fileName
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pd.Timestamp(datetime.datetime.now())}})
				return
			column_det = getColType(data, column)
			udata = updateData(data, column)
			emptyData(fileName.split(".")[0])
			addData(fileName.split(".")[0], udata)
			updateMetadata(fileName.split(".")[0], column_det)
		mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':'Successfully Uploaded'}})
	except Exception as E:
		mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':str(E)}})
	mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshTime':pd.Timestamp(datetime.datetime.now())}})
	fileData = mycol.find_one({'_id':ObjectId(id)})
	return bson2json(fileData)

@app.route('/run', methods=["POST"])
def uploadNow():
	if request.method=='POST':
		json = request.get_json()
		id = json['_id']['$oid']
		response = updateMongoData(id)
		return response

@app.route('/fileTypeCategory', methods=["POST","PUT","DELETE","GET"])
def storeFileType():
	global _db
	_collection = _db['fileTypes']
	if request.method=='POST':
		json = request.get_json()
		json["ValidFrom"]=pd.Timestamp(json["ValidFrom"])
		json["ValidTo"]=pd.Timestamp(json["ValidTo"])
		inserted = _collection.insert_one(json)
		resp = Response(pyjson.dumps({
							'status':200,
							'error':'',
							'message': bson2json({'inserted_file_id':inserted.inserted_id}),
									}), 200)	
		return resp
	elif request.method == 'PUT':
		json = request.get_json()
		json["ValidFrom"]=pd.Timestamp(json["ValidFrom"])
		json["ValidTo"]=pd.Timestamp(json["ValidTo"])		
		id = json['_id']['$oid']
		del json['_id']
		updated = _collection.update_one({'_id':ObjectId(id)},{'$set':json})
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'updated_id':{'$oid':id}}),
									}), 200)	
		return resp		
	elif request.method == 'GET':
		result = []
		for x in _collection.find():
			result.append(x)
		return bson2json(result)
	elif request.method == 'DELETE':
		_collection_sub = _db['fileTypeSubCategories']
		json = request.get_json()
		id = json['_id']['$oid']
		deleted = _collection.delete_one({'_id':ObjectId(id)})
		_collection_sub.delete_one({'fileTypeID':id})
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'deleted_id':{'$oid':id}}),
									}), 200)	
		return resp

@app.route('/fileTypeSubCategory', methods=["POST","PUT","GET","DELETE"])
def storeFileTypeSubCategory():
	global _db
	_collection = _db['fileTypeSubCategories']
	if request.method=='POST':
		json = request.get_json()
		inserted = _collection.insert_one(json)
		resp = Response(pyjson.dumps({
							'status':200,
							'error':'',
							'message': bson2json({'inserted_file_id':inserted.inserted_id}),
									}), 200)	
		return resp
	elif request.method == 'PUT':
		json = request.get_json()
		id = json['_id']['$oid']
		del json['_id']
		if '_id' in json:
			del json['_id']
		updated = _collection.update_one({'_id':ObjectId(id)},{'$set':json})
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'updated_id':id}),
									}), 200)	
		return resp		
	elif request.method == 'GET':
		json = request.args
		id = json['fileTypeID']
		result = _collection.find({'fileTypeID':id})
		return bson2json(result)
	elif request.method == 'DELETE':
		json = request.get_json()
		id = json['_id']['$oid']
		deleted = _collection.delete_one({'_id':ObjectId(id)})
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'deleted_id':{'$oid':id}}),
									}), 200)	
		return resp
		
@app.route('/getFileUploadDetails', methods=["GET"])
def uploadDetails():
	global _db
	_collection = _db['uploadedDocuments']
	if request.method == 'GET':
		result = []
		for x in _collection.find():
			result.append(x)
		return bson2json(result)

@app.route('/fileUpload', methods=["GET","POST","PUT","DELETE"])
def scheduleUploader():
	global _db
	_collection = _db['uploadedDocuments']
	if request.method == 'POST':
		json = request.get_json()
		inserted = _collection.insert_one(json)
		resp = Response(pyjson.dumps({
							'status':200,
							'error':'',
							'message': bson2json({'inserted_file_id':inserted.inserted_id}),
									}), 200)	
		return resp
	elif request.method == 'PUT':
		json = request.get_json()
		try:
			json['NodeID']
			id = json['NodeID']
			updated = _collection.update_one({'NodeID':id},{'$set':json})
		except:
			try:
				id = json['_id']['$oid']
				del json['_id']
				updated = _collection.update_one({'_id':ObjectId(id)},{'$set':json})
			except:
				json = request.get_json()
				inserted = _collection.insert_one(json)
				resp = Response(pyjson.dumps({	
									'status':200,
									'error':'',
									'message': bson2json({'inserted_file_id':inserted.inserted_id}),
											}), 200)	
				return resp
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'updated_id':{'$oid':id}}),
									}), 200)	
		return resp
	elif request.method == 'GET':
		json = request.args
		fileTypeID = json['FileTypeID']
		subCategoryID = json['SubCategoryID']
		nodeId = json['NodeID']
		result = _collection.find({'FileTypeID':fileTypeID,'SubCategoryID':subCategoryID,'NodeID':nodeId})
		return bson2json(result)
	elif request.method == 'DELETE':
		json = request.get_json()
		id = json['_id']['$oid']
		deleted = _collection.delete_one({'_id':ObjectId(id)})        
		resp = Response(pyjson.dumps({	
							'status':200,
							'error':'',
							'message': bson2json({'deleted_id':{'$oid':id}}),
									}), 200)	
		return resp		
		
@app.route('/RecomendedCards', methods=["GET"])
def RecomendedCards():
	mongoClient = MongoClient(mongoURL)
	db = mongoClient["UserManagement_brevo"]
	col = db["user"]
	# userid = "5ef23801ec799414e4878b4c"
	userid = request.args['userid']

	userIds = []
	res = col.find_one({'_id':ObjectId(userid)})
	# print(res)

	db1 = mongoClient["BrevoV3"]

	for user in col.find({"typevalue":res['typevalue']}):
		# print(user)
		userIds.append(ObjectId(user['_id']))

	# print(userIds)
	CardsCol = db1['CardConfiguration']

	trainData =[]
	for card in CardsCol.find({'CreatedBy':{'$in':userIds}}):
		trainData.append(card)
	Train_Data = pd.DataFrame(trainData)
	testData = []
	for card in CardsCol.find({'CreatedBy':ObjectId(userid)}):
		# print(card)
		testData.append(card)

	Test_Data = pd.DataFrame(testData)

	# print(Test_Data)
	Test_Data['keywords'] = Test_Data.apply(get_keywords, axis=1)
	# print(Test_Data)
	Train_Data['keywords'] = Train_Data.apply(get_keywords, axis=1)
	# print(Train_Data.head(5))

	keywords = Test_Data['keywords'].tolist()
	KeywordsList = ' '.join(map(str, keywords))
	# print(KeywordsList)

	# Train_Data.apply(get_similarUserKpis, axis=1)
	similar_user_kpis=[]
	similar_user_kpi_ids=[]
	for index, row in Train_Data.head().iterrows():
		similar_user_kpi_ids.append(row['Configid'])
		similar_user_kpis.append(row['Configuration'])
	
	similar_user_kpis = pd.DataFrame({'Configuration':similar_user_kpis,'Configid':similar_user_kpi_ids})
	# print(similar_user_kpis)
	similar_user_kpis['keywords'] = Train_Data.apply(get_keywords, axis=1)
	# print(similar_user_kpis)

	idf = tf_idf(KeywordsList,similar_user_kpis, 'keywords')
	cs = cos_similarity(idf[0],idf[1])
	ms = most_similar(cs)
	cardids = []
	for id in ms:
		if id !=0:
			cardids.append(similar_user_kpi_ids[id-1])
	recommendedCards = []
	for card in CardsCol.find({'Configid':{'$in':cardids}}):
		del card['_id']
		del card['CreatedBy']
		recommendedCards.append(card)
	# print(recommendedCards)
	return {'status':"Success",'result':recommendedCards}

# @app.route('/GetAllTablesAndViewsHana', methods = ["GET"])
def getAllTablesAndViewsHana(db):
	# params = request.args
	# db = params["db"]
	df = my_spark.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/'+db,dbtable='sys.tables', user='SYSTEM', password='Init2020#' ).load()
	df.createOrReplaceTempView(db+"tables")
	data = my_spark.sql("SELECT * FROM "+db+"tables WHERE IS_SYSTEM_TABLE='FALSE' AND SCHEMA_NAME NOT LIKE '\_%'")
	
	tables = data.toJSON().collect()
	df1 = my_spark.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/'+db,dbtable='sys.views', user='SYSTEM', password='Init2020#' ).load()
	df1.createOrReplaceTempView(db+"views")
	data1 = my_spark.sql("SELECT * FROM "+db+"views WHERE SCHEMA_NAME NOT LIKE '\_%'")

	views = data1.toJSON().collect()
	Tables = []
	Views = []
	for row in tables:
		row = json.loads(row)
		table = {
			'TABLE_NAME': row['TABLE_NAME'],
			'TABLE_CATALOG': db,
			'TABLE_SCHEMA': row['SCHEMA_NAME'],
			'TABLE_TYPE':"TABLE"
		}
		Tables.append(table)
	for row in views:
		row = json.loads(row)
		table = {
			'TABLE_NAME': row['VIEW_NAME'],
			'TABLE_CATALOG': db,
			'TABLE_SCHEMA': row['SCHEMA_NAME'],
			'TABLE_TYPE':"VIEW"
		}
		Tables.append(table)
		view = {
			'view_id':row['VIEW_OID'],
			'name':row['VIEW_NAME'],
			'last_change':row['CREATE_TIME']
		}
		Views.append(view)
	return json.dumps({'Tables': Tables, 'Views': Views, 'Count_Tables': len(Tables), 'Count_Views': len(Views)})
	
# @app.route('/TableMetadataHana', methods = ['GET'])
def TableMetadataHana(db, schema, table, type):
	# params = request.args
	# db = params["db"]
	# schema = params["schema"]
	# type = params["type"]
	# table = params["table"]
	if type == "TABLE":
		tableName = "sys.TABLE_COLUMNS"
	else:
		tableName = "sys.VIEW_COLUMNS"
	tableColumns = my_spark.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/'+db,dbtable=tableName, user='SYSTEM', password='Init2020#' ).load()
	print(tableColumns)
	tableDet = {
		"TABLENAME":table,
		"MEASURES":[],
		"DIMENSIONS":[],
		"COLUMN_DET":[]
	}
	if type == "TABLE":
		tableCol = tableColumns.filter((tableColumns.SCHEMA_NAME==schema)&(tableColumns.TABLE_NAME==table)).toJSON().collect()
	else:
		tableCol = tableColumns.filter((tableColumns.SCHEMA_NAME==schema)&(tableColumns.VIEW_NAME==table)).toJSON().collect()
	for col in tableCol:
		col = json.loads(col)
		property = {
			"COLUMN_NAME":col['COLUMN_NAME'],
			"LABEL":col['COLUMN_NAME'],
			"DATATYPE":col['DATA_TYPE_NAME'],
			"AGGREGATIONTYPE":"None",
			"TYPE":"None",
			"FORMAT":"None"
		}
		if property["DATATYPE"] in ["TINYINT","SMALLINT", "INTEGER", "BIGINT"]: 
			property['AGGREGATIONTYPE'] = "SUM"
			property['DATATYPE'] = "Int"
			property['TYPE'] = "MEASURE"
			tableDet['MEASURES'].append(property["COLUMN_NAME"])
		elif property["DATATYPE"] in ["SMALLDECIMAL","DECIMAL","REAL","DOUBLE"]:
			property['AGGREGATIONTYPE'] = "SUM"
			property['DATATYPE'] = "Float"
			property['TYPE'] = "MEASURE"
			tableDet['MEASURES'].append(property["COLUMN_NAME"])
		elif property["DATATYPE"] in ["VARCHAR", "NVARCHAR", "ALPHANUM", "SHORTTEXT"]:
			property['DATATYPE'] = "String"
			property['TYPE'] = "DIMENSION"
			tableDet['DIMENSIONS'].append(property["COLUMN_NAME"])
		tableDet["COLUMN_DET"].append(property)
	return json.dumps(tableDet)
	
def getAllTablesAndViewsMongo(db, params):
	# params = flask.request.args
	mongoClient = MongoClient(mongoURL)
	db = mongoClient[db]
	col = db["CollectionDetails"]
	tables = []
	views = []
	if '$filter' in params:
		filtr = {
			'department':params['$filter'].split(" eq ")[1]
		}
	else:
		filtr = {}
	print(filtr)
	for row in col.find(filtr).sort('last_change', pymongo.DESCENDING):
		if row['TABLE_TYPE'] == "TABLE":
			properties = []
			i=0
			for col in row['COLUMN_DET']:
				property={
					"name":col['COLUMN_NAME'],
					"label":col['LABEL'],
					"datatype":col['DATATYPE'],
					"type":col['TYPE'],
					"format":col['FORMAT']
				}
				properties.append(property)
			tables.append({
				'TABLE_NAME': row['TABLENAME'],
				'TABLE_CATALOG': params['db'],
				'property':properties,
				'COLUMN_DET':row['COLUMN_DET']
			})
		elif row['TABLE_TYPE'] == "VIEW":
			properties = []
			i=0
			for col in row['COLUMN_DET']:
				property={
					"name":col['COLUMN_NAME'],
					"label":col['LABEL'],
					"datatype":col['DATATYPE'],
					"type":col['TYPE'],
					"format":col['FORMAT']
				}
				properties.append(property)
			tables.append({
				'TABLE_NAME': row['view_name'],
				'TABLE_CATALOG': params['db'],
				'department': row['department'],
				'description':row['description'],
				'last_change':row['last_change'],
				'property':properties,
				'COLUMN_DET':row['COLUMN_DET']
			})
			views.append({
				'view_id':str(row['_id']),
				'name':row['view_name'],
				'department':row['department'],
				'last_change':row['last_change']
			})
	# print(views[0]['view_id'])
	return json.dumps({'Tables': tables, 'Views': views, 'Count_Tables': len(tables), 'Count_Views': len(views)})

def TableMetadataMongo(db, table):
	# params = flask.request.args
	# table = params['table']
	# db = params['db']
	mongoClient = MongoClient(mongoURL)
	db = mongoClient[db]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':table})
	del col_Det['_id']
	return json.dumps(col_Det)
	
@app.route('/getAllTablesAndViews1', methods = ["GET"])
def getAllTablesAndViews1():
	params = request.args
	if params['source'] == "MONGODB":
		result = getAllTablesAndViewsMongo(params['db'], params)
	elif params['source'] == "HANA":
		result = getAllTablesAndViewsHana(params['db'])
	else:
		result = getAllTablesAndViewsMongo(params['db'], params)
	return result

@app.route('/TableMetadata1', methods = ["GET"])
def TableMetadata1():
	params = request.args
	print(params)
	if params['source'] == "MONGODB":
		result = TableMetadataMongo(params['db'], params['table'])
	elif params['source'] == "HANA":
		result = TableMetadataHana(params['db'], params['schema'], params['table'], params['type'])
	else:
		result = TableMetadataMongo(params['db'], params['table'])
	return result

@app.route('/TableData1', methods = ["GET"])
def TableData1():
	params = flask.request.args
	table = "_".join(params['table'].split(" "))
	database = params['db']
	if 'source' in params:
		source = params['source']
	else:
		source = "MONGODB"
	if '$select' in params:
		select = params['$select']
	else:
		select = 'undefined'
	print(select)
	if '$filter' in params:
		filtr = params['$filter']
		filtr = filtr.replace(" eq ", " = ")
		filtr = filtr.replace(" ne ", " != ")
		filtr = filtr.replace(" lt ", " < ")
		filtr = filtr.replace(" gt ", " > ")
		filtr = filtr.replace(" le ", " <= ")
		filtr = filtr.replace(" ge ", " >= ")
	else:
		filtr = 'undefined'
	if '$top' in params:
		top = params['$top']
	else:
		top = 'undefined'
	print(database)
	print(table)
	if source == "HANA":
		schema = params["schema"]
		type = params["type"]
		print(database)
		print(schema)
		print(table)
		print(type)
		collDet = TableMetadataHana(database, schema, table, type)
		collDet = json.loads(collDet)
	else:
		collDet = getTableDetails(database, table)
	date = datetime.now()
	date1 = date
	grpby = []
	if select != "undefined": 
		select = select.split(",")
	else:
		select =[]
		for col in collDet['COLUMN_DET']:
			select.append(col['COLUMN_NAME'])
	print(select)
	print(filtr)
	sql = "SELECT "
	i=0
	for val in select:
		
		# if i>0:
			# sql = sql+","
		for col in collDet['COLUMN_DET']:	
			if col['COLUMN_NAME'].upper() == val.upper() and col['TYPE'] == "MEASURE":
				if i>0:
					sql = sql+","
				if '$aggregate' in params and params['$aggregate'] == "true":
					sql =  sql = sql + col['AGGREGATIONTYPE'].upper()+"("+val+")"+" AS "+val
				else:
					sql =  sql = sql + val+" AS "+val
				i = i+1
				break;
			elif col['COLUMN_NAME'].upper() == val.upper():
				if i>0:
					sql = sql+","
				sql = sql + val
				if '$aggregate' in params and params['$aggregate'] == "true":
					grpby.append(val)
				i = i+1
				break;
	if filtr != "undefined":
		sql = sql + " FROM "+"_".join(table.split(" "))+" WHERE "+filtr
	else:
		sql = sql + " FROM "+"_".join(table.split(" "))
	print(sql)
	print(params)
	if len(grpby)>0:
		sql = sql+" GROUP BY "
	i=0
	print(len(grpby))
	for val in grpby:
		if i>0:
			sql = sql+","
		sql = sql + val
		i = i+1
	print(params['orderby'])
	if 'orderby' in params:
		sql = sql+" ORDER BY "+params['orderby']
	if top != "undefined":
		sql = sql + " LIMIT "+ top
	print(sql)
	# df = my_spark.read.option("uri",mongoURL+database+"."+table).format("com.mongodb.spark.sql.DefaultSource").load()
	if source == "HANA":
		df = my_spark.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/'+database,dbtable=schema+"."+table, user='SYSTEM', password='Init2020#' ).load()
	else:
		df = my_spark.read.option("uri",mongoURL+"?authSource=admin").option("database", database).option("collection",table).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(table.split(" ")))
	# try:
	data = my_spark.sql(sql)
	data = data.toJSON().collect()
	res = []
	for row in data:
		row = json.loads(row)
		if len(row)>0:
			if '_id' in row:
				del row['_id']
			res.append(row)
	return json.dumps({"status":"Success", "count":len(res), "tables":res})
	# except Exception as e:
		# print(e)

app.run(port=5000)