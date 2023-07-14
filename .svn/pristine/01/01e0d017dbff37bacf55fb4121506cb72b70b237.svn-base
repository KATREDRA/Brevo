# Pandas is used for data manipulation
import pandas as pd
from sklearn.tree.export import export_text
# Use numpy to convert to arrays
import numpy as np
from pymongo import MongoClient
from pyspark.sql import SparkSession
# Using Skicit-learn to split data into training and testing sets
from sklearn.model_selection import train_test_split

# Import the model we are using
from sklearn.ensemble import RandomForestRegressor


def RF(train_features, train_labels, feature_list):
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

def getDataST(table,collDet, select, filtr):
	# Read in data and display first 5 rows
	my_spark = SparkSession \
		.builder \
		.appName("test1") \
		.config("spark.mongodb.input.partitioner", "MongoPaginateBySizePartitioner") \
		.getOrCreate()
	my_spark.conf.set("spark.sql.shuffle.partitions", 2)
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

def getColumnDetails(table):
	mongoClient = MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	col_Det = col.find_one({'TABLENAME':"_".join(table.split(" "))})
	return col_Det

def main():
	select = "Fiscal_Year,Quarter,Month,Department,Vendor,Accounts_Receivable,Accounts_Payable"
	filtr = "undefined"
	view = "Financial Performance Data"
	collDet = getColumnDetails(view)
	features = getDataST(view, collDet['COLUMN_DET'], "Total_Amount"+","+select,filtr)
	data = features
	features = pd.get_dummies(features)
	labels = np.array(features['Total_Amount'])
	# Remove the labels from the features
	# axis 1 refers to the columns
	features= features.drop('Total_Amount', axis = 1)
	# Saving feature names for later use
	feature_list = list(features.columns)
	# Convert to numpy array
	features = np.array(features)
	# Split the data into training and testing sets
	# train_features, test_features, train_labels, test_labels = train_test_split(features, labels, test_size = 0.25, random_state = 42)
	if features.shape != (0,0):
		infl_features = RF(features, labels, feature_list)
		print(infl_features)
		agg = data.aggregate({'Total_Amount':['sum']})
		result = {
			"node_name":"LY",
			"Value":agg['Total_Amount']['sum'],
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
				print(data[feature_name])
				print(feature_value)
				data1 = data[data[feature_name] == feature_value]
				print(data1['Total_Amount'])
				agg = data1.aggregate({'Total_Amount':['sum']})
				result['children'].append({
					"node_name":feature_name,
					"node_value":feature[0][len(feature[0])-1],
					"Importance_value":feature[1],
					"Value":agg['Total_Amount']['sum'],
					"children":[]
				})
				
				data_temp = data1
				print(data_temp)
				labels = np.array(data1['Total_Amount'])
				data1 = data1.drop(feature_name, axis=1)
				data1= data1.drop('Total_Amount', axis = 1)
				data1 = pd.get_dummies(data1)
				feature_list = list(data1.columns)
				data1 = np.array(data1)
				print(data1)
				print(data1.shape)
				if data1.shape != (0,0):
					# train_features, test_features, train_labels, test_labels = train_test_split(data1, labels, test_size = 0.25, random_state = 42)
					child_infl_Features = RF(data1, labels, feature_list)
					print(child_infl_Features)
					j=0
					for child_feature in child_infl_Features:
						if child_feature[1] > 0:
							
							child_feature_name=""
							k=0
							for k in range(len(child_feature[0])-1):
								if k>0:
									child_feature_name = child_feature_name+"_"+child_feature[0][k]
									k=k+1
								else:
									child_feature_name = child_feature_name+child_feature[0][k]
									k=k+1
							child_feature_value = child_feature[0][len(child_feature[0])-1]
							print(child_feature)
							print(child_feature_value)
							data2 = data_temp[data_temp[child_feature_name] == child_feature_value]
							print(data2['Total_Amount'])
							agg = data2.aggregate({'Total_Amount':['sum']})
							result['children'][i]['children'].append({
								"node_name":child_feature_name,
								"node_value":child_feature[0][len(child_feature[0])-1],
								"Importance_value":child_feature[1],
								"Value":agg['Total_Amount']['sum'],
								"children":[]
							})
							
							data2_temp = data2
							data2 = data2.drop(child_feature_name, axis=1)
							labels2 = np.array(data2['Total_Amount'])
							data2 = data2.drop('Total_Amount', axis = 1)
							data2 = pd.get_dummies(data2)
							feature_list = list(data2.columns)
							data2 = np.array(data2)
							if data2.shape != (0,0):
								child_infl_Features2 = RF(data2, labels2, feature_list)
								for child_feature2 in child_infl_Features2:
									if child_feature2[1] >0:
										
										child_feature2_name = ""
										k=0
										length2 = len(child_feature2[0])
										print(child_feature2[0])
										for k in range(len(child_feature2[0])-1):
											if k>0:
												child_feature2_name = child_feature2_name+"_"+child_feature2[0][k]
											else:
												child_feature2_name = child_feature2_name+child_feature2[0][k]
										child_feature2_value = child_feature2[0][len(child_feature2)-1]
										print(child_feature2_name)
										data3 = data2_temp[data2_temp[child_feature2_name] == child_feature2_value]
										print(data3['Total_Amount'])
										agg = data3.aggregate({'Total_Amount':['sum']})
										result['children'][i]['children'][j]['children'].append({
											"node_name":child_feature2_name,
											"node_value":child_feature2[0][len(child_feature2[0])-1],
											"Value":agg['Total_Amount']['sum'],
											"Importance_value":child_feature2[1]
										})
						j = j+1
			i = i+1
	else:
		print("Insufficient Data")
	print(result)
		
	
if __name__ == "__main__":
	main()