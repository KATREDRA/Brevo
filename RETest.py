import pandas as pd
import numpy as np
import nltk
import json
from pymongo import MongoClient
from bson import ObjectId
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk import FreqDist
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# I define the stop_words here so I don't do it every time in the function below
stop_words = stopwords.words('english')
stop_words.append('vs')

def get_keywords(row):
    some_text = row['Configuration']
    print(some_text)
    lowered = some_text.lower()
    tokens = nltk.tokenize.word_tokenize(lowered)
    keywords = [keyword for keyword in tokens if keyword.isalpha() and not keyword in stop_words]
    keywords_string = ' '.join(keywords)
    return keywords_string

mongoURL = "mongodb://techvasppadmin:Init2020!@localhost:28017/"
mongoClient = MongoClient("mongodb://techvasppadmin:Init2020!@localhost:28017/")

db = mongoClient["UserManagement_brevo"]
col = db["user"]
userid = "5ed72c075178ee1d5c6e068b"

userIds = []
res = col.find_one({'_id':ObjectId(userid)})
print(res)

db1 = mongoClient["BrevoV3"]

for user in col.find({"typevalue":res['typevalue']}):
	# print(user)
	userIds.append(ObjectId(user['_id']))

# print(userIds)
CardsCol = db1['CardConfiguration']

trainData =[]
for card in CardsCol.find({'CreatedBy':{'$in':userIds}}):
	trainData.append(card)

Train_Data = pd.DataFrame(trainData)


similar_user_kpis=[]
similar_user_kpi_ids=[]
def get_similarUserKpis(row):
	print(row['Configid'])
	similar_user_kpi_ids.append(row['Configid'])
	similar_user_kpis.append(row['Configuration'])   

Train_Data.apply(get_similarUserKpis, axis=1)

testData = []
for card in CardsCol.find({'CreatedBy':ObjectId(userid)}):
	print(card)
	testData.append(card)

Test_Data = pd.DataFrame(testData)

print(Test_Data)
Test_Data['keywords'] = Test_Data.apply(get_keywords, axis=1)
print(Test_Data)
Train_Data['keywords'] = Train_Data.apply(get_keywords, axis=1)
print(Train_Data)

keywords = Test_Data['keywords'].tolist()
KeywordsList = ' '.join(map(str, keywords))
print(KeywordsList)

similar_user_kpis = pd.DataFrame({'Configuration':similar_user_kpis,'Configid':similar_user_kpi_ids})
# print(similar_user_kpis)
similar_user_kpis['keywords'] = Train_Data.apply(get_keywords, axis=1)
# print(similar_user_kpis)


def tf_idf(search_keys, dataframe, label):
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_weights_matrix = tfidf_vectorizer.fit_transform(dataframe.loc[:, label])
    search_query_weights = tfidf_vectorizer.transform([search_keys])
    return search_query_weights, tfidf_weights_matrix




def cos_similarity(search_query_weights, tfidf_weights_matrix):
    cosine_distance = cosine_similarity(search_query_weights, tfidf_weights_matrix)
    similarity_list = cosine_distance[0]
    return similarity_list




def most_similar(similarity_list, min_talks=5):
    most_similar= []
  
    while min_talks > 0:
        tmp_index = np.argmax(similarity_list)
        most_similar.append(tmp_index)
        similarity_list[tmp_index] = 0
        min_talks -= 1
    return most_similar




idf = tf_idf(KeywordsList,similar_user_kpis, 'keywords')
cs = cos_similarity(idf[0],idf[1])
ms = most_similar(cs)
print(ms)

cardids = []
for id in ms:
	if id !=0:
		cardids.append(similar_user_kpi_ids[id-1])
recommendedCards = []
for card in CardsCol.find({'Configid':{'$in':cardids}}):
	del card['_id']
	del card['CreatedBy']
	recommendedCards.append(card)
print(cardids)