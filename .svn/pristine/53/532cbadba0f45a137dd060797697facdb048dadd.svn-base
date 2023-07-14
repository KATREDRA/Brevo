/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData /$metadata request
 */

/* eslint no-redeclare:0 */

var builder = require('xmlbuilder')

module.exports = function (cfg) {
  return buildMetadata(cfg.model)
}

function buildMetadata (model) {
  var entityTypes = []
  for (var typeKey in model.entityTypes) {
    var entityType = {
      'name': typeKey,
      'type':model.entityTypes[typeKey].type,
      'property': []
    }

    for (var propKey in model.entityTypes[typeKey]) {
    	if(propKey !== "type"){
      		var property = model.entityTypes[typeKey][propKey]
			var prop = {'name': propKey, 'type': property.type, 'extensions':[]};
			if(model.entityTypes[typeKey].type == "table"){
				prop.extensions.push({'name':'label',value:propKey,'namespace':model.namespace});
				if(prop.type == "Edm.Int32" || prop.type == "Edm.Decimal"){
					prop.extensions.push({'name':'aggregation-role',value:'measure','namespace':model.namespace});
					prop.extensions.push({'name':'filterable',value:'false','namespace':model.namespace});
				}
				else
					prop.extensions.push({'name':'aggregation-role',value:'dimension','namespace':model.namespace});
				
			}
     		 entityType.property.push(prop)

      		if (property.key) {
        		entityType.Key = {
        		  propertyRef: {
         		   'name': propKey
         		 }
        		}
      		}
      }
    }

    entityTypes.push(entityType)
  }

  var complexTypes = []
  for (var typeKey in model.complexTypes) {
    var complexType = {
      'name': typeKey,
      'property': []
    }

    for (var propKey in model.complexTypes[typeKey]) {
      var property = model.complexTypes[typeKey][propKey]

      complexType.property.push({'name': propKey, 'type': property.type})
    }

    complexTypes.push(complexType)
  }

  var container = {
  	
    'name': 'Context',
    'entitySet': []
  }

  for (var setKey in model.entitySets) {
  console.log(model.entitySets[setKey])
    container.entitySet.push({
      'entityType': model.entitySets[setKey].entityType+"Type",
      'name': setKey,
      'type':model.entitySets[setKey].type
    })
  }
  return{
          
         
          'namespace': model.namespace,
          'entityType': entityTypes,
          'entityContainer': container

        }

}
