'use strict';
var mongoose=require('mongoose')
var User = require('../user/user.model');
var Transaction = require('../user/transaction.model');
var passport = require('passport');
var config = require('../../config/environment');
var smsConfig=require('../../../config.js');
var jwt = require('jsonwebtoken');
var sms=require('../sms/sms.controller.js');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
//exports.create = function (req, res, next) {
//  var newUser = new User(req.body);
//  newUser.provider = 'local';
//  newUser.status = 'inactive';
//  newUser.save(function(err, user) {
//    if (err) return validationError(res, err);
//    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
//    res.json({ token: token });
//  });
//};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

// reset a users password:

exports.resetPassword = function(email) {
  var chars="abcdefghijklmnopqrstuvwxyz123456789"
  var newPass=''

  for (var i = 0; i < 8; i++){
    newPass += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  User.findOne({email: email}, function (err, user) {
    user.password = newPass;
    user.save(function(err) {
      if (err){
        console.log("error saving password");
      }
    });
  });

  return newPass;
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

/**
 * Get receivers
 */



exports.searchReceivers = function(req, res, next) {
 var filters=req.body.filters; console.log("details******->",req.user);
 var location=req.user.location;console.log("filters...",filters);
 if(filters!={} && filters.receiverDistance!=undefined)
     //User.geoNear([parseFloat(location.lng), parseFloat(location.lat)], { distance: parseFloat(filters.receiverDistance)/ 3963.192}, function (err, result){
     //   console.log("geo:::",result);
     //});
    var point = { type : "Point", coordinates : [location[0],location[1]] };console.log("***point",point);
    //User.geoNear([location[0],location[1]], { maxDistance : 50, spherical : false }, function(err, results, stats) {
    //    console.log("inside geo->",results);
    //    console.log("inside geoerr ->",err);
    //    console.log("inside geo stats ->",stats);
    //});
    {
        User.aggregate().near(
            {    near: [ location[1] , location[0] ] ,
                spherical: true,//filters.receiverDistance
                distanceField:'location',
                distanceMultiplier:3959,
                maxDistance:filters.receiverDistance/3959,
                query: { status: 'inactive',"receiverInfo.receiverPerishableItem":'yes',
                    "receiverInfo.receiverRefrigeratedItem":'yes'}
            })
            .exec(function(err,docs) {
                if (err) console.log(err);
                else {
                    console.log(docs)
                    res.json(docs);
                }
            });
    }


  //User.find({"receiverInfo.receiverDryGroceries":10}, function(err, user) { // don't ever give out the password or salt
  ////console.log("inside",user);
  //  if (err) return next(err);
  //  if (!user) {
  //      return res.json(401);
  //  }
  //  {   console.log("its inside !user",user[0].location);
  //      //sendReceivers(user,function(result){console.log(result)});
  //      res.json(user);
  //  }
  //});
};
/**
 *
 */
exports.storeItems=function(req, res, next){
    var itemsList=req.body.items;

    console.log("**inside save items",req.body.items);

};

/**
 * Authentication callback
 */

var sendReceivers= exports.sendReceivers=function(user,callback){
    console.log("itshere",user);
    sms.sendSMS('broadcast-olkh12','+14083342547',"hello there23",function(result){
        callback(result)
    });
}


exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

exports.test=function(){
    console.log("hewrwerwer")
}