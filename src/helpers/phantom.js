/* eslint no-console: 0 */
'use strict';

const phantom = require('phantom');


function* blockResourceLoading(page) {
    yield page.property('onResourceRequested', function(requestData, request) {
        var BLOCKED_RESOURCES = [
            /\.gif/gi,
            /\.png/gi,
            /\.css/gi
        ];
        var is_blacklisted_resource = BLOCKED_RESOURCES.some(function(r) {
            return r.test(requestData['url']);
        });

        if (is_blacklisted_resource) {
            request.abort();
        }
    });
}

function* fetchPageContent(url, instance, block_assets=true) {
    let is_local_instance = false;
    if (!instance) {
        instance = yield * initPhantomInstance();
        is_local_instance = true;
    }

    const page = yield instance.createPage();
    if (block_assets) {
        yield * blockResourceLoading(page);
    }

    yield page.open(url);
    let html = yield page.property('content');
    yield page.close();
    if (is_local_instance) {
        instance.exit();
    }
    return html;
}

function* initPhantomInstance() {
    return yield phantom.create();
}


module.exports = {
    blockResourceLoading: blockResourceLoading,
    fetchPageContent: fetchPageContent,
    initPhantomInstance: initPhantomInstance
};
