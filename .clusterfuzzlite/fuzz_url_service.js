/* eslint-disable no-undef */
/**
 * ClusterFuzzLite fuzz target for urlService.parseQueryStringToFilterState.
 * Tests that arbitrary query strings never cause crashes or uncaught errors.
 * @param {Buffer} data - Fuzz input from the fuzzing engine.
 */
module.exports.fuzz = function (data) {
    const { urlService } = require('../services/urlService')
    const input = data.toString('utf-8')
    try {
        urlService.parseQueryStringToFilterState(input)
    } catch {
        // parseQueryStringToFilterState should never throw — if it does, it's a bug
        throw new Error('parseQueryStringToFilterState threw on input: ' + input.slice(0, 200))
    }
}
