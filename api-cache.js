const LRUCache = require('mnemonist/lru-cache');


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

const ApiCache = function (apiCall, poll = false) {

    const self = this;
    self.lastUpdate = new Date();
    self.lastValue = new LRUCache(1000);//use mnemunics lru cache
    self.lastSuccessfulValue = new LRUCache(1000);
    self.lastSuccessTime = {};
    self.pollers= {};
    self.apiCall = apiCall;
    self.poll = poll;
    return {
        getValue: function (args, callback) {
            const key = (args == null) ? -1 : JSON.stringify(args);
            const sendResult_ = function (resultWasError = false) {
                try {
                    if (callback) {
                        if (!resultWasError) {
                            console.log(self.lastUpdate.toISOString());
                            callback(self.lastValue.get(key));
                        } else {
							let resultTime = self.lastSuccessTime[key];
							if(resultTime != null)
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
                    new Date(self.lastUpdate.getTime()).setMinutes(self.lastUpdate.getMinutes() + 2);
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

                let updateResultPollCb =
                    function (result) {
                        if (result == "error")
                            console.log("bg poll: quota exceeded");

                        self.lastUpdate = new Date();
                        self.lastValue.set(key, result || {});
                        console.log("updated cache: " + key);

                        if (result != "error") {
                            self.lastSuccessfulValue.set(key, self.lastValue.get(key));
                            self.lastSuccessTime[key] = new Date();
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
                if (self.poll == true && self.pollers[key] == null) {
                    //poll in background without waiting for user to call , so it will be cached when called
                    self.pollers[key] = setInterval(() => {
                        console.log("bg poll:" + key);
                        if (args == null) {
                            self.apiCall(updateResultPollCb);
                        } else {
                            switch (args.length) {
                                case 0:
                                    self.apiCall(updateResultPollCb);
                                    break;
                                case 1:
                                    self.apiCall(args[0], updateResultPollCb);
                                    break;
                                case 2:
                                    self.apiCall(args[0], args[1], updateResultPollCb);
                                    break;
                                case 3:
                                    self.apiCall(args[0], args[1], args[2], updateResultPollCb);
                                    break;
                                case 4:
                                    self.apiCall(args[0], args[1], args[2], args[3], updateResultPollCb);
                                    break;
                                case 5:
                                    self.apiCall(args[0], args[1], args[2], args[3], args[4], updateResultPollCb);
                                    break;
                            }
                        }
                    }, 5*60 * 1000);
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
