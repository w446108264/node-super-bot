let request = require("co-request");

/**
 * get pgyer build history
 * @param options  {@code {
      aId: "",
      _api_key: ""
 }}
 * @param callback
 * @see https://www.pgyer.com/doc/api#viewAppGroup
 * @example {@link routes/version#router.get('/build')}
 */
exports.getPgyerHistroy = function *(options) {
    var opt = {
        uri: 'http://www.pgyer.com/apiv1/app/viewGroup',
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        form: {
            aId: options.aId,
            _api_key: options._api_key
        }
    };
    return yield request(opt);
}