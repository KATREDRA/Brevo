from pyspark.sql import SparkSession
import sys, json
from pymongo import MongoClient
from datetime import datetime

def getColumnDetails(table):
    mongoClient = MongoClient("mongodb://localhost:27017/")
    db = mongoClient["fileuploader"]
    col = db['CollectionDetails']
    col_Det = col.find_one({'TABLENAME':"_".join(table.split(" "))})
    return col_Det

    
def main():
    table = "3250_monthly_Report"
    select = "undefined"
    filtr = "undefined"
    top = "undefined"
	# aggregation = sys.argv[5]
    print("Creating Spark Session")
    date = datetime.now()
    date1 = date
    my_spark = SparkSession \
        .builder \
        .appName("test1") \
        .config("spark.mongodb.input.uri", "mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))) \
        .config("spark.mongodb.output.uri", "mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))) \
        .config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
        .getOrCreate()
    print("Spark Session Created")
    print(datetime.now() - date)
    collDet = getColumnDetails(table)
    date = datetime.now()
    grpby = []
    print("Create SQL")
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
    print("SQL:")
    print(sql)
    print(datetime.now() - date)
    date = datetime.now()
    print("Loading Data")
    df = my_spark.read.format("com.mongodb.spark.sql.DefaultSource").load()
    print("Data Loaded")
    print(datetime.now() - date)
    print("Creating View")
    date = datetime.now()
    df.createOrReplaceTempView("_".join(table.split(" ")))
    print("View Creating")
    print(datetime.now() - date)
    print("Running SQL on server")
    date = datetime.now()
    data = my_spark.sql(sql)
    print("Running SQL Completed")
    print(datetime.now() - date)
    date = datetime.now()
    print(json.dumps(data.toPandas().to_json()))
    print(datetime.now() - date1)
    my_spark.stop()
    # data = data.toJSON().collect()
    # sys.stdout.write(json.dumps(out))
    # sys.stdout.flush()
    # print(json.dumps(data))

if __name__ == '__main__':
	main()
