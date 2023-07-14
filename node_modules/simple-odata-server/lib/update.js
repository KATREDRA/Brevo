/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData PATCH requests
 */

/* eslint no-useless-escape: 0 */

function processBody (body, cfg, req, res) {
  delete body['@odata.type']
	obj = cfg.model.entityTypes[req.params.collection]
			fields = Object.keys(obj)
			console.log(fields)
			for(i=0;i<fields.length; i++){
				if(obj[fields[i]].key){
					var key = fields[i]
				}
			}

 //  var query = {
//     _id: req.params.id.replace(/\"/g, '').replace(/'/g, '')
//   }
	var query={}
	query[key]=parseInt(req.params.id.replace(/\"/g, '').replace(/'/g, ''))
	
  var update = {
    $set: body
  }

  try {
    cfg.base64ToBuffer(req.params.collection, update.$set)
    cfg.executeUpdate(req.params.collection, query, update, req, function (e, entity) {
      if (e) {
        return res.odataError(e)
      }

      res.writeHead(204, cfg.addCorsToHeaders())
      res.end()
    })
  } catch (e) {
    res.odataError(e)
  }
}

module.exports = function (cfg, req, res) {
  if (req.body) {
    return processBody(req.body, cfg, req, res)
  }
  var body = ''
  req.on('data', function (data) {
    body += data
    if (body.length > 1e6) {
      req.connection.destroy()
    }
  })
  req.on('end', function () {
    return processBody(JSON.parse(body), cfg, req, res)
  })
}
