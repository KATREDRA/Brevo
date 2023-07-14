from pyspark.sql import SparkSession
import sys, json

def main():
    table = sys.argv[1]
    select = sys.argv[2]
    filtr = sys.argv[3]
    top = sys.argv[4]
	# aggregation = sys.argv[5]
    my_spark = SparkSession \
        .builder \
        .appName("myApp") \
        .config("spark.mongodb.input.uri", "mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))) \
        .config("spark.mongodb.output.uri", "mongodb://localhost:27017/fileuploader."+"_".join(table.split(" "))) \
        .getOrCreate()
    my_spark.conf.set("spark.sql.shuffle.partitions", 2)
    collDet = my_spark.read.format("com.mongodb.spark.sql.DefaultSource").option("uri","mongodb://127.0.0.1/fileuploader.CollectionDetails").load()
    collDet = collDet.filter(collDet['TABLENAME'] == "_".join(table.split(" ")))
    collDet = collDet.toJSON().collect()
    collDet =json.dumps(collDet)
    collDet = json.loads(collDet)
    collDet = json.loads(collDet[0])
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
    df = my_spark.read.format("com.mongodb.spark.sql.DefaultSource").load()
    df.createOrReplaceTempView("_".join(table.split(" ")))
    data = my_spark.sql(sql)
    # print(json.dumps(data))
    # data = data.toJSON().collect()
    # sys.stdout.write(json.dumps(out))
    # sys.stdout.flush()
    # print(json.dumps(data))

if __name__ == '__main__':
	main()
