from pymongo import MongoClient
import json
from pyspark.sql import SparkSession

my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
my_spark.conf.set("spark.sql.shuffle.partitions", 2)


def getMeasureTree(variantId):
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["BrevoV3"]
	col = db['Variants']
	result = col.find_one({"VariantId":int(variantId)})
	MT = json.loads(result['MeasureTree'])
	return MT

def getCoeff(MT):
	result = []
	for child in MT['children']:
		result.append({
			"name":"VAT_Amount",
			"co_val":child['co_val'],
			"delta_diff":child['difference']/child['value_org']
		})
	return result

def getActual(MT):
	result = []
	for child in MT['children']:
		result.append({
			"name":"VAT_Amount",
			"co_val":child['co_val'],
			"delta_diff":0
		})
	return result

def getQuery(table, filtr, selectD, variant1_Coeff, variant2_Coeff, I1, I2, TM):
	sql = "SELECT "+selectD
	for val in variant1_Coeff:
		sql = sql+", "+"("+str(I1)+"+(first("+str(val['co_val'])+")*(first("+val['name']+")+(first("+val['name']+")*("+str(val['delta_diff'])+")))))"+" AS "+TM+"_variant1"
	for val in variant2_Coeff:
		sql = sql+", "+"("+str(I2)+"+(first("+str(val['co_val'])+")*(first("+val['name']+")+(first("+val['name']+")*("+str(val['delta_diff'])+")))))"+" AS "+TM+"_variant2"
	sql = sql+" FROM "+"_".join(table.split(" "))
	if filtr != "undefined":
		sql = sql+" WHERE "+filtr
	sql = sql+" GROUP BY "+selectD
	return sql

def getQuery1(table, filtr, selectD, variant1_Coeff, variant2_Coeff, I1, I2, TM, actual):
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
	
def main():
	view="Test Date Report"
	variantID="173125,101"
	select="CUSTOMER_SATISFACTION,DISCOUNT,NUMBER_OF_ISSUES_REPORTED,SALES_REVENUE,CITY,COMMENTS"
	target="GROSS_MARGIN"
	time="DATE"
	year="2018"
	Quarter="All"
	selectD="BOXES"
	selectM="CUSTOMER_SATISFACTION,DISCOUNT,NUMBER_OF_ISSUES_REPORTED,SALES_REVENUE"
	filtr = "undefined"
	
	variants = variantID.split(",")
	MT1 = getMeasureTree(variants[0])
	if int(variants[1]) != 101:
		MT2 = getMeasureTree(variants[1])
		variant1_Coeff = getCoeff(MT1)
		variant2_Coeff = getCoeff(MT2)
		sql = getQuery(view, filtr, selectD, variant1_Coeff, variant2_Coeff,MT1['intercept'],MT2['intercept'], MT1['name'], false)
	else:
		variant1_Coeff = getCoeff(MT1)
		actual_Coeff = getActual(MT1)
		sql = getQuery1(view, filtr, selectD, variant1_Coeff, actual_Coeff,1,2, MT1['name'], True)
	print(sql)
	df = my_spark.read.option("uri","mongodb://localhost:27017/fileuploader."+"_".join(view.split(" "))).format("com.mongodb.spark.sql.DefaultSource").load()
	df.createOrReplaceTempView("_".join(view.split(" ")))
	data = my_spark.sql(sql)
	data = data.toPandas()
	print(data)

if __name__ == "__main__":
	main()