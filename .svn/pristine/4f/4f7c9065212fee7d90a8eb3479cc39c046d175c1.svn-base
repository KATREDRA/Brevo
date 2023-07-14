from pyspark.sql import SparkSession

print("0")
my_spark = SparkSession \
    .builder \
    .appName("myApp") \
    .config("spark.mongodb.input.uri", "mongodb://localhost/test.OVPPageConfig") \
    .config("spark.mongodb.output.uri", "mongodb://localhost/BrevoV3.OVPPageConfig") \
    .getOrCreate()
print("1")
# collDet = my_spark.read.format("com.mongodb.spark.sql.DefaultSource").option("uri", "mongodb://localhost/BrevoV3.OVPPageConfig").load()
# collDet.show()
people = my_spark.createDataFrame([("Bilbo Baggins",  50), ("Gandalf", 1000), ("Thorin", 195), ("Balin", 178), ("Kili", 77),
   ("Dwalin", 169), ("Oin", 167), ("Gloin", 158), ("Fili", 82), ("Bombur", None)], ["name", "age"])
people.write.format("om.mongodb.spark.sql.DefaultSource").option("uri", "mongodb://localhost/test.People").mode("append").save()


