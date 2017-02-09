RLTB.workers.on("RLTB_SETTINGS_REQUEST", function(msg, workerPort) {
    console.log("Received SETTINGS REQUEST");
    if (workerPort === null) { //ignore, that request comes from us
        return;
    }

    RLTB.workers.sendToPort(workerPort, "RLTB_SETTINGS_UPDATE", "", RLTB.settings.get());
});