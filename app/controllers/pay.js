/**
 * Created by Administrator on 2015-11-17.
 */
var request = require('request');
var https = require('https');
var iconv = require('iconv-lite');
/*var Iconv  = require('iconv').Iconv;
var iconv1 = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE');
var iconv2 = new Iconv('UTF-8', 'EUC-KR//TRANSLIT//IGNORE');*/
exports.pay = function(req,res){
    console.log(" req.body " , req.body);
    var P_STATUS = req.body.P_STATUS;
    var P_RMESG1 = req.body.P_RMESG1;
    var P_TID = req.body.P_TID;
    var P_MID = "INIpayTest"
    var P_REQ_URL = req.body.P_REQ_URL;
    console.log(' P_STATUS ',  P_STATUS)
    console.log(' P_RMESG1 ',  P_RMESG1)
    console.log(' P_TID ',  P_TID)
    console.log(' P_REQ_URL ',  P_REQ_URL)

    var url = P_REQ_URL+"?P_TID="+P_TID+"&P_MID="+P_MID
    https.get(url,function(response){
        response.pipe(iconv.decodeStream('euckr')).collect(function (err, decodedBody) {
            if(err){
                console.error('err ' , err);
            }
            console.log('decodedBody ' , decodedBody)
            res.json({result:"요청 완료",body:decodedBody});
        })
    })

    /*https://drmobile.inicis.com/smart/pay_req_url.php?P_TID=INIMX_AUTHINIpayTest20151117212658871659&P_MID=INIpayTest*/
  /*  request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Show the HTML for the Modulus homepage.

        }
    });*/
}