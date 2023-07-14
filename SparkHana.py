from pyspark.sql import SQLContext
import json
from bson.json_util import dumps as bson2json

from pyspark import SparkContext

sc = SparkContext(appName="hdfspush")

sqlctx = SQLContext(sc)

'''df = sqlctx.read.format('jdbc')\
		.options("driver", "com.sap.db.jdbc.Driver")\
		.options("url", "jdbc://sap://hxehost.techvaspp.com:39015")\
		.options("databaseName","test")\
		.options("user","SYSTEM")\
		.options("password", "Init2020#")\
		.options("dbtable", "test")
		.load()'''
		
Tables = []
Views = []
tables = sqlctx.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/brevo',dbtable='sys.tables', user='SYSTEM', password='Init2020#' ).load()

#tables = tables.toJSON().collect()

views = sqlctx.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/brevo',dbtable='sys.views', user='SYSTEM', password='Init2020#' ).load()

views = views.toJSON().collect()
print(len(views))
tableColumns = sqlctx.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/COVID',dbtable='sys.table_columns', user='SYSTEM', password='Init2020#' ).load()

#tableColumns = tableColumns.toJSON().collect()

viewColumns = sqlctx.read.format('jdbc').options(driver='com.sap.db.jdbc.Driver',url='jdbc:sap://1.186.146.208:39015/brevo',dbtable='sys.view_columns', user='SYSTEM', password='Init2020#' ).load()

#viewColumns = viewColumns.toJSON().collect()
print(len(tables.filter(tables.SCHEMA_NAME !="SYS").toJSON().collect()))
for row in views:
	row = json.loads(row)
	table = {
		'TABLE_NAME': row['VIEW_NAME'],
		'TABLE_CATALOG': "brevo",
		'property':[]
	}
	Tables.append(table)
print(Tables)