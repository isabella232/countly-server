var plugin = {},
    plugins = require('../../pluginManager.js'),
    versionInfo = require('../../../frontend/express/version.info'),
    COUNTLY_VERSION = versionInfo.version,
    COUNTLY_TYPE = versionInfo.type,
    countlyStats = require('../../../api/parts/data/stats.js'),
    countlyConfig = require('../../../frontend/express/config');

(function (plugin) {
	plugin.init = function(app, countlyDb){
		app.get(countlyConfig.path+'/sso/login', function(req, res, next) {
            var link = req.query.redirect || countlyConfig.path+'/dashboard',
                username = req.query.user,
                password = req.query.api_key;
            
            if (username && password) {
                countlyDb.collection('members').findOne({$or: [ {"username":username}, {"email":username} ], "api_key":password}, function (err, member) {
                    if (member) {
                        plugins.callMethod("loginSuccessful", {req:req, res:res, next:next, data:member});
                        if (countlyConfig.web.use_intercom && member['global_admin']) {
                            countlyStats.getOverall(countlyDb, function(statsObj){
                                request({
                                    uri:"https://cloud.count.ly/s",
                                    method:"POST",
                                    timeout:4E3,
                                    json:{
                                        email:member.email,
                                        full_name:member.full_name,
                                        v:COUNTLY_VERSION,
                                        t:COUNTLY_TYPE,
                                        u:statsObj["total-users"],
                                        e:statsObj["total-events"],
                                        a:statsObj["total-apps"],
                                        m:statsObj["total-msg-users"],
                                        mc:statsObj["total-msg-created"],
                                        ms:statsObj["total-msg-sent"]
                                    }
                                }, function(a, c, b) {
                                    a = {};
                                    b && (b.in_user_id && !member.in_user_id && (a.in_user_id = b.in_user_id), b.in_user_hash && !member.in_user_hash && (a.in_user_hash = b.in_user_hash));
                                    Object.keys(a).length && countlyDb.collection("members").update({_id:member._id}, {$set:a}, function() {})
                                });
                            });
                        }
                        if (!countlyConfig.web.track || countlyConfig.web.track == "GA" && member['global_admin'] || countlyConfig.web.track == "noneGA" && !member['global_admin']) {
                            countlyStats.getUser(countlyDb, member, function(statsObj){
                                var date = new Date();
                                request({
                                    uri:"https://stats.count.ly/i",
                                    method:"GET",
                                    timeout:4E3,
                                    qs:{
                                        device_id:member.email,
                                        app_key:"386012020c7bf7fcb2f1edf215f1801d6146913f",
                                        timestamp: Math.round(date.getMilliseconds()/1000),
                                        hour: date.getHours(),
                                        dow: date.getDay(),
                                        user_details:JSON.stringify(
                                            {
                                                custom:{
                                                    apps: (member.user_of) ? member.user_of.length : 0,
                                                    platforms:{"$addToSet":statsObj["total-platforms"]},
                                                    events:statsObj["total-events"],
                                                    pushes:statsObj["total-msg-sent"],
                                                    crashes:statsObj["total-crash-groups"],
                                                    users:statsObj["total-users"]
                                                }
                                            }
                                        )
                                        
                                    }
                                }, function(a, c, b) {});
                            });
                        }
        
                        req.session.uid = member["_id"];
                        req.session.gadm = (member["global_admin"] == true);
                        req.session.email = member["email"];
                        if(req.query.lang && req.query.lang != member["lang"]){
                            countlyDb.collection('members').update({_id:member["_id"]}, {$set:{lang:req.query.lang}}, function(){});
                        }
                        if(plugins.getConfig("frontend").session_timeout)
                            req.session.expires = Date.now()+plugins.getConfig("frontend").session_timeout;
                        res.redirect(link);
                    } else {
                        plugins.callMethod("loginFailed", {req:req, res:res, next:next, data:req.query});
                        if(req.query.ignore)
                            res.redirect(link);
                        else
                            res.redirect(countlyConfig.path+'/login?message=login.result');
                    }
                });
            } else {
                if(req.query.ignore)
                    res.redirect(link);
                else
                    res.redirect(countlyConfig.path+'/login?message=login.result');
            }
		});
        
        app.get(countlyConfig.path+'/sso/logout', function(req, res, next) {
            if (req.session) {
                plugins.callMethod("userLogout", {req:req, res:res, next:next, data:{uid:req.session.uid, email:req.session.email}});
                req.session.uid = null;
                req.session.gadm = null;
                req.session.email = null;
                res.clearCookie('uid');
                res.clearCookie('gadm');
                req.session.destroy(function () {
                });
            }
            var link = req.query.redirect || countlyConfig.path+'/login';
            res.redirect(link);
        });
	};
}(plugin));

module.exports = plugin;