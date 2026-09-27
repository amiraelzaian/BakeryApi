
const express=require('express')
const chatConroller=require('../controllers/chat.controller');
const {protect,allowedTo}=require('../controllers/auth.controller')


const router=express.Router();

router.post('/',protect,allowedTo('customer'),chatConroller.sendMessage)






module.exports=router