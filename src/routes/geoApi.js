const express = require('express')
// @ts-ignore
const gju = require("geojson-utils");
const { ResumeToken } = require('mongodb');
const { getConfigFileParsingDiagnostics } = require('typescript');
const router = express.Router();
const {gameArea,players} = require("../gameData/gameData");
const app = express()


const polygonForClient = {};
polygonForClient.coordinates = gameArea.coordinates[0].map(point => {
  return {latitude: point[1],longitude: point[0]}
})

router.get('/gamearea',(req,res)=>{
  res.json(polygonForClient);
});

router.get('/isuserinarea/:lon/:lat', function(req,res) {
  const { lat, lon } = req.params;
  const point = {'type':'Point','coordinates':[lon,lat]}
  const isInside = gju.pointInPolygon(point,gameArea);
  const result = { status: isInside, msg: '' };
  result.msg = isInside ? 'Point was inside the polygon.' : 'Point wasn\'t inside the polygon';
  res.json(result);
});

module.exports = router;