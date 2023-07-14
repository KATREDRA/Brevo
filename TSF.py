# Importing required libraries 
import numpy as np 
import pandas as pd 
from statsmodels.tsa.seasonal import seasonal_decompose 
from statsmodels.tsa.statespace.sarimax import SARIMAX
from pymongo import MongoClient
from pyspark.sql import SparkSession
from datetime import datetime, timedelta

my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)

def getColumnDetails(table):
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':"_".join(table.split(" "))})
	return col_Det

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
	sql = sql+" ORDER BY "+ select[0].upper()+" ASC "
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
	
	forecast = result.get_prediction(start=pdate)
	return forecast.predicted_mean[0]
	
def main():
	view = "Test Date Report"
	target = "VAT_Amount"
	date = "Reporting_Date"
	filtr = "undefined"
	selectM = "CoCD"
	month = 3
	collDet = getColumnDetails(view)
	select = selectM.split(",")
	
	pdate = pd.to_datetime(datetime.now()) + timedelta(int(month)*30)
	
	result = {
		'name':target,
		'value': forecast(view, collDet, target, date, pdate, filtr),
		'Children':[]
	}
	for val in select:
		result['Children'].append({
			'name':val,
			'value':forecast(view, collDet, val, date, pdate, filtr)
		})
	print(result)
	
	
if __name__ == "__main__":
	main()