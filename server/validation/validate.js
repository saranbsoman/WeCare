//@author => Saran B Soman

const Joi = require('joi')

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(5).required()
}).unknown()

module.exports = registerSchema