from pyspark.sql import SparkSession
# from pyspark.sql import S
import sys

def main():
	# data = sys.argv[1]
	my_spark = SparkSession \
    .builder \
    .appName("myApp") \
    .config("spark.mongodb.input.uri", "mongodb://localhost:27017/") \
    .config("spark.mongodb.output.uri", "mongodb://localhost:27017/") \
    .config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
	.config('spark.jars.packages', 'org.mongodb.spark:mongo-spark-connector_2.12:2.4.1')\
    .getOrCreate()
	df = my_spark.sql("show tables in test").show()
	print(df)
	
#start process
if __name__ == '__main__':
	main()


