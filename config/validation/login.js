/**
 * Created by Administrator on 2016-03-30.
 */
var Joi = require('joi');
exports.login = {
    options : { allowUnknownBody: true},
    body: {
        phone: Joi.string().required()
    }
};