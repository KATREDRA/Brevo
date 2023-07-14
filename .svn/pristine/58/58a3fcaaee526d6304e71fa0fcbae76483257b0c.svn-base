import sys, json
import pymongo

def getColDet():
	mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
	db = mongoClient["fileuploader"]
	col = db['CollectionDetails']
	col_Det = []
	for row in col.find({}):
		del row['_id']
		col_Det.append(row)
	return col_Det
	
def main():
	col_Det = getColDet()
	print(json.dumps(col_Det))
if __name__ == '__main__':
    main()