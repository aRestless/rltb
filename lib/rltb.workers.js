var SharedWorker;

(function() {
    var TOPICS = {
        CONTROL: "RLTB_CONTROL",
        SETTINGS_UPDATE: "RLTB_SETTINGS_UPDATE",
        SETTINGS_SYNC: "RLTB_SETTINGS_SYNC",
        RPC: "RLTB_RPC",
        SETTINGS: "RLTB_SETTINGS"
    };

    RLTB.workers = new (function() {

        var STRINGIFYMODE = true;
        var WORKER_TIMEOUT = 15000;
        var STARTER_WORKER = "/vendor/rltb/lib/rltb.workers.starter.js";
        var DEFAULT_TOPICS = [
            TOPICS.CONTROL,
            TOPICS.SETTINGS,
            TOPICS.SETTINGS_UPDATE,
            TOPICS.SETTINGS_SYNC
        ];

        var topicsToCallbacks = {};
        var __topics = [];
        var __synchronized = false;
        var topicsToWorkerPorts = {};
        var __workers = [];
        var __workerPaths = [];
        var __workersResponded = 0;
        var __messageBuffer = [];
        var __unansweredTopicMessages = 0;
        var __workerPortsFinished = false;
        var __mainWindowPort = null;
        var __isStarted = false;
        var __workerTimeout = undefined;
        var __bufferedReceivedMessages = {};

        this.topicsToWorkerPorts = function() {
            return topicsToWorkerPorts;
        };

        function __startWindow() {
            __topics = (RLTB.config.windows[RLTB.util.getCurrentWindowName()] &&  RLTB.config.windows[RLTB.util.getCurrentWindowName()].subscriptions) || [];
            __topics = __topics.concat(DEFAULT_TOPICS);

            __createWorkers();

            if (RLTB.windows.isMainWindow()) {
                __connectWorkers();
            }
            __subscribeToWorkers();


            if (RLTB.windows.isMainWindow()) {
                __workerTimeout = setTimeout(function() {
                    if (!__isReady()) {
                        alert("Overwolf Error: Workers are not responding, the app could not be started properly. You will have to restart Overwolf as well the game to fix this.\n\nWe're already working on a fix for this. Sorry :(");
                        RLTB.windows.closeAll();
                    }
                }, WORKER_TIMEOUT);

                var that = this;
                RLTB.windows.onClose(function() {
                    that.send(TOPICS.CONTROL, "CLOSE", {});
                });
            }

            __isStarted = true;
        }

        function __startWorker() {
            console.warn(this.getCurrentWorkerName());
            __topics = (RLTB.config.workers[this.getCurrentWorkerName()] && RLTB.config.workers[this.getCurrentWorkerName()].subscriptions) || [];
            __topics = __topics.concat(DEFAULT_TOPICS);

            RLTB.onconnect(function(evt) {
                console.warn("onconnect");
                var port = evt.ports[0];

                if (!__mainWindowPort) {
                    __mainWindowPort = port;
                }

                port.onmessage = function(evt) {
                    __receiveMessage(port, evt);
                };

                port.start();
            });

            __isStarted = true;
        }

        function __isReady() {
            if (!__isStarted) {
                return false;
            }

            if (RLTB.util.isWorker() && !__synchronized) {
                return false;
            }

            if (__unansweredTopicMessages < 0) {
                return false;
            }

            if (__unansweredTopicMessages !== 0) {
                return false;
            }

            return true;
        }

        function __getTopics() {
            return __topics;
        }

        function __getWorker(filePath) {
            console.warn("Creating: " + STARTER_WORKER + "?file=" + filePath);

            return new SharedWorker(STARTER_WORKER + "?file=" + filePath);
        }

        function __createWorkers() {
            var workers = RLTB.config.workers;

            for (var key in workers) {

                var worker = __getWorker(workers[key].file);
                worker.onerror = function(e) {
                    ERROR(e);
                };
                worker.port.start();

                __workers.push(worker);
                __workerPaths.push(workers[key].file);
            }
        }

        function __connectWorkers() {
            for (var i = 0; i < __workers.length; i++) {
                for (var j = i + 1; j < __workers.length; j++) {
                    var worker = __getWorker(__workerPaths[j]);
                    worker.port.start();
                    __sendToPort(__workers[i].port, TOPICS.CONTROL, "WORKERPORT", worker.port , true);
                }
            }

            for (var i = 0; i < __workers.length; i++) {
                __sendToPort(__workers[i].port, TOPICS.CONTROL, "WORKERPORTS_FINISHED", null);
            }
        }

        function __subscribeToWorkers()  {
            for (var i = 0; i < __workers.length; i++) {
                __sendTopics(__workers[i].port);

                __workers[i].port.onmessage = (function(port) {
                    return function(evt) {
                        __receiveMessage(port, evt);
                    };
                })(__workers[i].port);
            }
        };

        function __sendTopics(port) {
            __unansweredTopicMessages++;
            __sendToPort(port, TOPICS.CONTROL, "TOPICS", __getTopics());
        };

        function __sendToPort(workerPort, topic, type, data, transferOwnership) {
            var transferOwnershipArray = [];

            var msg;

            if (transferOwnership) {
                transferOwnershipArray.push(data);

                msg = {
                    topic : topic,
                    type : type,
                    data : data
                };
            } else {
                if (STRINGIFYMODE) {
                    msg = JSON.stringify({
                        topic : topic,
                        type : type,
                        data : data
                    });
                } else {
                    msg = {
                        topic : topic,
                        type : type,
                        data : data
                    };
                }
            }

            workerPort.postMessage(msg, transferOwnershipArray);
        };

        function __receiveMessage(workerPort, event) {
            var transferedObject = event.data;

            if (!transferedObject) {
                return;
            }

            var msg;
            if (typeof transferedObject === "string" || transferedObject instanceof String) {
                msg = JSON.parse(transferedObject);
            } else {
                msg = transferedObject;
            }

            var topic = msg.topic;

            if (__topics.indexOf(topic) < 0) {
                return;
            }

            __processMessage(workerPort, topic, msg);
        }

        function __processMessage(workerPort, topic, msg) {
            if (topic === undefined || !msg) {
                return;
            }

            if (topic === TOPICS.CONTROL && workerPort) {
                if (msg.type === "WORKERPORT") {
                    msg.data.onmessage = function(evt) {
                        __receiveMessage(msg.data, evt);
                    };

                    __sendTopics(msg.data);
                }

                if (msg.type === "TOPICS" || msg.type === "TOPICS_RESPONSE") {
                    var topics = msg.data;
                    for (var i = 0; i < topics.length; i++) {
                        __subscribeWorkerToTopic(topics[i], workerPort);
                    }

                    if (msg.type === "TOPICS_RESPONSE") {
                        __unansweredTopicMessages--;

                        if (!RLTB.util.isWorker() && !RLTB.windows.isMainWindow() && __unansweredTopicMessages === 0) {
                            RLTB.scriptReady();
                        }

                        __checkFinished();
                        __sendBufferedMessages();
                    }
                }

                if (msg.type === "TOPICS") {
                    __sendToPort(workerPort, TOPICS.CONTROL, "TOPICS_RESPONSE", __getTopics());
                }

                if (msg.type === "LOG") {
                    console.log(msg.data);
                }

                if (msg.type === "WORKERPORTS_FINISHED") {
                    __workerPortsFinished = true;
                    __checkFinished();
                }

                if (msg.type === "WORKER_FINISHED" && !RLTB.util.isWorker()) {
                    __workersResponded++;
                    console.warn("workers answered " + __workersResponded + "/" + __workers.length);
                    if (__workersResponded === __workers.length) {
                        for (var i = 0; i < __workers.length; i++) {
                            __sendToPort(
                                __workers[i].port,
                                TOPICS.CONTROL,
                                "WORKERS_SYNCHRONIZED",
                                null
                            );
                        }
                        RLTB.scriptReady();
                    }
                }

                if (msg.type === "WORKERS_SYNCHRONIZED") {
                    __synchronized = true;
                    __sendBufferedMessages();
                    RLTB.scriptReady();
                }

                if (msg.type === "CLOSE" && RLTB.util.isWorker()) {
                    close();
                }

                return;
            }

            if (topicsToCallbacks[topic]) {
                for (var i = 0; i < topicsToCallbacks[topic].length; i++) {
                    try {
                        topicsToCallbacks[topic][i](msg, workerPort);
                    } catch (e) {
                        ERROR(e.stack);
                    }
                }
            } else {
                if (!__bufferedReceivedMessages[topic]) {
                    __bufferedReceivedMessages[topic] = [];
                }

                console.log("Buffering for topic " + topic);
                console.log(JSON.stringify(msg));
                console.log(workerPort);
                __bufferedReceivedMessages[topic].push({
                    message : msg,
                    workerPort : workerPort
                });
            }
        }

        function __checkFinished() {
            if (!RLTB.util.isWorker()) {
                return;
            }

            if (__isReady() || !__workerPortsFinished) {
                return;
            }

            if (__unansweredTopicMessages === 0) {
                __sendToPort(__mainWindowPort, TOPICS.CONTROL, "WORKER_FINISHED", null);
            }
        }

        function __subscribeWorkerToTopic(topic, workerPort) {
            if (!topicsToWorkerPorts[topic]) {
                topicsToWorkerPorts[topic] = [];
            }

            topicsToWorkerPorts[topic].push(workerPort);
        };

        function __sendBufferedMessages() {
            if (__messageBuffer.length === 0) {
                return false;
            }

            if (!__isReady()) {
                return;
            }

            while (__messageBuffer.length > 0) {
                var message = __messageBuffer.splice(0, 1)[0];

                if (message.topic === undefined) {
                    console.error("Use msg.topic instead msg.port you lazy ass.");
                };

                __receiveMessage(null, {data : message});

                if (!topicsToWorkerPorts[message.topic]) {
                    continue;
                }

                for (var i = 0; i < topicsToWorkerPorts[message.topic].length; i++) {
                    __sendToPort(topicsToWorkerPorts[message.topic][i], message.topic, message.type, message.data, message.transferOwnership);
                }
            }
        }

        this.getCurrentWorkerName = function() {
            if (!RLTB.util.isWorker()) {
                return null;
            }
            var path  = self.location.search.substr("?file=".length);;
            path = path.substring(path.lastIndexOf("/") + 1);
            path = path.substring(0, path.lastIndexOf(".js"));

            return path;
        };

        this.on = function(topic, callback) {
            if ($.isArray(topic)) {
                for (var key in topic) {
                    this.on(topic[key], callback);
                }
                return;
            }

            if (!topicsToCallbacks[topic]) {
                topicsToCallbacks[topic] = [];
            }

            topicsToCallbacks[topic].push(callback);

            console.log("ON " + topic);
            console.log(JSON.stringify(__bufferedReceivedMessages[topic]));

            if (__bufferedReceivedMessages[topic]) {
                for (var index in __bufferedReceivedMessages[topic]) {
                    callback(__bufferedReceivedMessages[topic][index].message, __bufferedReceivedMessages[topic][index].workerPort);
                }
                delete __bufferedReceivedMessages[topic];
            }
        };

        this.sendMessage = function(msg) {
            __messageBuffer.push(msg);
            __sendBufferedMessages();
        };

        this.send = function(topic, type, data, transferOwnership) {
            var msg = {
                topic : topic,
                type : type,
                data : data,
                transferOwnership : transferOwnership
            };

            this.sendMessage(msg);
        };

        this.sendToPort = function(port, topic, type, data, transferOwnership) {
            __sendToPort(port, topic, type, data, transferOwnership);
        };


        var that = this;

        if (RLTB.util.isWorker()) {
            __startWorker.call(that);
        } else {
            __startWindow.call(that);
        }


    })();


})();