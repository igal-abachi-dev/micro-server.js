const LRUCache = require('mnemonist/lru-cache');
const PollInterval = (6 * 60) * (60 * 1000);//15 * 60 * 1000;
const microCacheExpiration = 6*60;//2; , if no external get , read from file once 6 minutes
//once 24 hours , for 65 playlists

/*
usage:

const ApiCache = require('./api-cache.js');

const cached_getLatestVids = new ApiCache(_vimApi.getLatestVids);
const cached_getPlaylistVideos = new ApiCache(_vimApi.getPlaylistVideos,true);

api.tryGetLatestVids = function (cb) {
    cached_getLatestVids.getValue(null, cb);
};
api.getPlaylistVideos = function (playlistID, cb) {
    cached_getPlaylistVideos.getValue([playlistID, null, null], cb);
};
*/

const ApiCache = function (apiCall,apiName="", poll = false,isPrefetch = false) {

    const self = this;
    self.lastUpdate = new Date();
    self.lastValue = new LRUCache(10000);//use mnemunics lru cache
    self.lastSuccessfulValue = new LRUCache(10000);
    self.lastSuccessTime = {};
    self.pollers = {};
    self.apiCall = apiCall;
    self.apiName = apiName;
    self.poll = poll;
    return {
        setCacheData: function (data) {
            if (data != null) {
                self.lastUpdate = new Date(data.lastUpdate);
                self.lastSuccessTime = data.times;
                try {
                    if(isPrefetch == false) {
                        self.lastValue.clear();
                    }
                    for (let key in data.kv) {
                        let value = data.kv[key];
                        self.lastValue.set(key, value);
                    }
                } catch (e) {
                    console.error("error: setCacheData()");
                }
            }
        },
        getCacheTestData: function () {
            return {
                kv: {},
                times: self.lastSuccessTime,
                lastUpdate: self.lastUpdate
            };
        },
        getCacheData: function () {
            let kv = {};
            const entriesIterator = self.lastValue.entries();

            let entry = null;
            do {//from lru to dictionary
                entry = entriesIterator.next();
                let e = entry.value;
                if (e != null)
                    kv[e[0]] = e[1];
            }
            while (!entry.done);

            console.log("getCacheData: saving "+ Object.keys(kv).length + " entries");
            return {
                kv: kv,
                times: self.lastSuccessTime,
                lastUpdate: self.lastUpdate
            };
        },
        getValue: function (args, callback) {
            const key = (args == null) ? -1 : JSON.stringify(args);
            /*new*/
            if(isPrefetch == false) {
                if (callback) { //get from file cache
                    console.log(self.lastUpdate.toISOString()+ self.apiName+"()"+ key);
                    callback(self.lastValue.get(key));
                }
                return;
            }
            /*new*/

            const sendResult_ = function (resultWasError = false) {
                try {
                    if (callback) {
                        if (!resultWasError) {
                            console.log(self.lastUpdate.toISOString());
                            callback(self.lastValue.get(key));
                        } else {
                            let resultTime = self.lastSuccessTime[key];
                            if (resultTime != null)
                                console.log(resultTime.toISOString());
                            callback(self.lastSuccessfulValue.get(key));
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            if (self.lastValue.get(key) != null) {
                const cacheExpiration =
                    new Date(self.lastUpdate.getTime()).setMinutes(self.lastUpdate.getMinutes() + microCacheExpiration);
                //>100sec (min: >35 sec)

                if (cacheExpiration > new Date().getTime()) {
                    console.log("from Api-Cache");
                    sendResult_();
                    return;
                }
            }
            try {
                console.log("apiCall()");
                let updateResultCb =
                    function (result) {
                        self.lastUpdate = new Date();
                        self.lastValue.set(key, result || {});
                        if (result != "error") {
                            self.lastSuccessfulValue.set(key, self.lastValue.get(key));
                            self.lastSuccessTime[key] = new Date();
                        }

                        try {
                            sendResult_(result == "error");
                        } catch (e) {
                            sendResult_(true);
//bg poll , no res to return in callback
                        }
                    };

                if (args == null) {
                    self.apiCall(updateResultCb);
                } else {
                    switch (args.length) {
                        case 0:
                            self.apiCall(updateResultCb);
                            break;
                        case 1:
                            self.apiCall(args[0], updateResultCb);
                            break;
                        case 2:
                            self.apiCall(args[0], args[1], updateResultCb);
                            break;
                        case 3:
                            self.apiCall(args[0], args[1], args[2], updateResultCb);
                            break;
                        case 4:
                            self.apiCall(args[0], args[1], args[2], args[3], updateResultCb);
                            break;
                        case 5:
                            self.apiCall(args[0], args[1], args[2], args[3], args[4], updateResultCb);
                            break;
                    }
                }
            } catch (e) {
                //self.lastValue = null;
                console.error("error", e);
                sendResult_(true);
            }
        }
    };
};

module.exports = ApiCache;
