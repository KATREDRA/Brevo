import pandas, json, numpy
import xlrd
import datetime
import pymongo
import io
import sys
import base64
import schedule
import time
from bson import ObjectId

def getColType(data, column):
	column_det = []
	for col in column:
		if isinstance(data[1][col], type(0.1)):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col, 'DATATYPE':'Float', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[1][col], type(1)):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")),'LABEL':col, 'DATATYPE':'Int', 'AGGREGATIONTYPE':'SUM', 'TYPE':'MEASURE', 'FORMAT':'None'})
		elif isinstance(data[1][col], type(datetime.datetime.now())):
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col,'DATATYPE':'Date', 'FORMAT':'None'})
		else:
			column_det.append({'COLUMN_NAME':"_".join(col.split(" ")), 'LABEL':col,'DATATYPE':'String', 'TYPE':'DIMENSION', 'FORMAT':'None'})
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
		"MEASURES":measure,
		"TABLE_TYPE":"TABLE"
	}
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
			if pandas.isnull(row[col]):
				row[col] = None
		uData.append(row)
	return uData
 
def updateData(data, columns):
	uData = []
	for row in data:
		resRow = {}
		for col in columns:
			resRow["_".join(col.split(" "))] = row[col]
		uData.append(resRow)
	return uData

def updateMongoData(path, fileName, id, mycol, dataStructure):
	try:
		if path.split(".",1)[1] == "csv":
			excel_data_df = pandas.read_csv(path)
			data = excel_data_df.to_dict(orient='record')
			data_list = excel_data_df.to_dict(orient='list')
			column = excel_data_df.columns.ravel()
			try:
				if len(column)!=len(DataCollection):
					raise Exception
				for c in column:
					for item in dataStructure:
						if item['name'] == c:
							if item['datatype'] == "String" and not(isinstance(data[0][c], type(""))):
								raise Exception
							elif item['datatype'] == "Integer" and not(isinstance(data[0][c], type(1))):
								raise Exception
							elif item['datatype'] == "Decimal" and not(isinstance(data[0][c], type(0.1))):
								raise Exception
							elif item['datatype'] == "Date" and not(isinstance(data[0][c],type(datetime.datetime.now()))):
								raise Exception				
			except Exception:
				error = 'Number of Columns or Datatype of Columns does not match the Node Data Structure'
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pandas.Timestamp(datetime.datetime.now())}})
				return
			try:
				for c in column:
					for index,d in enumerate(data_list[c]):
						if index > 0 and type(data_list[c][index]) != type(data_list[c][index-1]):
							raise Exception
			except Exception:
				error = 'Inconsistant data in column '+c+' of file '+fileName
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pandas.Timestamp(datetime.datetime.now())}})
				return
			column_det = getColType(data, column)
			udata = updateData(data, column)
			emptyData(fileName)
			addData(fileName, udata)
			updateMetadata(fileName, column_det)
		elif path.split(".",1)[1] == "xlsx":
			excel_data_df = pandas.read_excel(path)
			data = excel_data_df.to_dict(orient='record')
			data_list = excel_data_df.to_dict(orient='list')
			column = excel_data_df.columns.ravel()
			try:
				if len(column)!=len(dataStructure):
					raise Exception
				for c in column:
					for item in dataStructure:
						print(item['name'])
						print(c)
						if item['name'] == c:
							if item['datatype'] == "String" and not(isinstance(data[0][c], type(""))):
								raise Exception
							elif item['datatype'] == "Integer" and not(isinstance(data[0][c], type(1))):
								raise Exception
							elif item['datatype'] == "Decimal" and not(isinstance(data[0][c], type(0.1))):
								raise Exception
							elif item['datatype'] == "Date" and not(isinstance(data[0][c],type(datetime.datetime.now()))):
								raise Exception				
			except Exception:
				error = 'Number of Columns or Datatype of Columns does not match the Node Data Structure'
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pandas.Timestamp(datetime.datetime.now())}})
				return
			try:
				for c in column:
					for index,d in enumerate(data_list[c]):
						if index > 0 and type(data_list[c][index]) != type(data_list[c][index-1]):
							raise Exception
			except Exception:
				error = 'Inconsistant data in column '+c+' of file '+fileName
				mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':error,'lastRefreshTime':pandas.Timestamp(datetime.datetime.now())}})
				return
			column_det = getColType(data, column)
			udata = updateData(data, column)
			emptyData(fileName)
			addData(fileName, udata)
			updateMetadata(fileName, column_det)
		mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':'Successfully Uploaded'}})
	except Exception as E:
		mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshResult':str(E)}})
	mycol.update_one({'_id':ObjectId(id)},{'$set':{'lastRefreshTime':pandas.Timestamp(datetime.datetime.now())}})

def scheduler():
	schedule.clear('uploader')
	myclient = pymongo.MongoClient("mongodb://localhost:27017")
	mydb = myclient["scheduledFileUpload"]
	mycol = mydb["uploadedDocuments"]
	for x in mycol.find():
		fileName = x['FileName']
		filePath = x['Path']
		recurrence = x['Recurrence']
		dataStructure = x['DataStructure']
		id = x['_id']
		updateMongoData(filePath,fileName,id,mycol,dataStructure)
		schedule.every(5).seconds.do(updateMongoData,filePath,fileName,id,mycol,dataStructure).tag('uploader')
	while True: 
		schedule.run_pending()
		time.sleep(1)
		
def main():	
	scheduler()

if __name__ == '__main__':
    main()