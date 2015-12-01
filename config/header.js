/**
 * Created by lsk on 15. 11. 5.
 */
module.exports.head = function(req,res){
    console.log('해더 출력' ,req.headers);
    res.json({code:'200'})
}