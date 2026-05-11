// Single source of truth for the HTTP client.
// Previously this file declared a SEPARATE axios instance whose response
// interceptor returned the raw axios response (so callers wrote `r.data` to
// access the JSON body). The other file at @config/api unwraps `response.data`
// automatically — divergent return shapes caused download/blob bugs.
//
// Now both imports resolve to the same configured instance from @config/api,
// which unwraps the body. Callers that used to do `(await get()).data` should
// drop the `.data`; callers that did `return response.data` should just
// `return response`.
import apiClient from '@config/api';

export { apiClient };
export default apiClient;
