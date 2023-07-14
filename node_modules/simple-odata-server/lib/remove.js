/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData DELETE request
 */

/* eslint no-useless-escape: 0 */

module.exports = function (cfg, req, res) {
  try {
  obj = cfg.model.entityTypes[req.params.collection]
			fields = Object.keys(obj)
			console.log(fields)
			for(i=0;i<fields.length; i++){
				if(obj[fields[i]].key){
					var key = fields[i]
				}
			}
    // var query = {
//       _id: req.params.id.replace(/\"/g, '').replace(/'/g, '')
//     }
var query={}
	query[key]=parseInt(req.params.id.replace(/\"/g, '').replace(/'/g, ''))
    cfg.executeRemove(req.params.collection, query, req, function (e) {
      if (e) {
        return res.odataError(e)
      }

      res.writeHead(204, cfg.addCorsToHeaders())
      res.end()
    })
  } catch (e) {
    return res.odataError(e)
  }
}
