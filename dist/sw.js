/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.
var CACHE_VERSION = '2019-01-05T07:09:35.989Z';
var CURRENT_CACHES = {
  prefetch: 'prefetch-cache-v' + CACHE_VERSION
};

self.addEventListener('install', function(event) {
  var now = Date.now();

  var urlsToPrefetch = ["./",
"opensearch.xml",
"css/app.cfa56bca.css",
"css/app.css",
"css/lib.365f8ae0.css",
"css/lib.css",
"fonts/Dressedless_Three.svg",
"fonts/Dressedless_Three.ttf",
"fonts/FontAwesome.otf",
"fonts/LatoLatin-Bold.woff2",
"fonts/LatoLatin-BoldItalic.woff2",
"fonts/LatoLatin-Italic.woff2",
"fonts/LatoLatin-Regular.woff2",
"fonts/fontawesome-webfont.eot",
"fonts/fontawesome-webfont.svg",
"fonts/fontawesome-webfont.ttf",
"fonts/fontawesome-webfont.woff",
"fonts/fontawesome-webfont.woff2",
"js/app.b95fa2fc.js",
"js/app.js",
"js/lib.2ef380a5.js",
"js/lib.js",
"images/404_dribbble.ae94d03c.gif",
"images/404_dribbble.gif",
"images/codelf_logo.f4ae25bd.png",
"images/codelf_logo.png",
"images/paypal.69412e83.png",
"images/paypal.png",
"images/twohardtings.0db8462a.jpg",
"images/twohardtings.jpg",
"images/wechatpay.48ba089d.jpg",
"images/wechatpay.jpg",
"images/zhifubao.70c19370.png",
"images/zhifubao.png",
"css/themes/default/assets/images/flags.png",
"css/themes/default/assets/fonts/brand-icons.eot",
"css/themes/default/assets/fonts/brand-icons.svg",
"css/themes/default/assets/fonts/brand-icons.ttf",
"css/themes/default/assets/fonts/brand-icons.woff",
"css/themes/default/assets/fonts/brand-icons.woff2",
"css/themes/default/assets/fonts/icons.eot",
"css/themes/default/assets/fonts/icons.otf",
"css/themes/default/assets/fonts/icons.svg",
"css/themes/default/assets/fonts/icons.ttf",
"css/themes/default/assets/fonts/icons.woff",
"css/themes/default/assets/fonts/icons.woff2",
"css/themes/default/assets/fonts/outline-icons.eot",
"css/themes/default/assets/fonts/outline-icons.svg",
"css/themes/default/assets/fonts/outline-icons.ttf",
"css/themes/default/assets/fonts/outline-icons.woff",
"css/themes/default/assets/fonts/outline-icons.woff2"];

  // All of these logging statements should be visible via the "Inspect" interface
  // for the relevant SW accessed via chrome://serviceworker-internals
  console.log('Handling install event. Resources to prefetch:', urlsToPrefetch);

  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
      var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
        // This constructs a new URL object using the service worker's script location as the base
        // for relative URLs.
        var url = new URL(urlToPrefetch, location.href);
        // Append a cache-bust=TIMESTAMP URL parameter to each URL's query string.
        // This is particularly important when precaching resources that are later used in the
        // fetch handler as responses directly, without consulting the network (i.e. cache-first).
        // If we were to get back a response from the HTTP browser cache for this precaching request
        // then that stale response would be used indefinitely, or at least until the next time
        // the service worker script changes triggering the install flow.
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;

        // It's very important to use {mode: 'no-cors'} if there is any chance that
        // the resources being fetched are served off of a server that doesn't support
        // CORS (http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
        // In this example, www.chromium.org doesn't support CORS, and the fetch()
        // would fail if the default mode of 'cors' was used for the fetch() request.
        // The drawback of hardcoding {mode: 'no-cors'} is that the response from all
        // cross-origin hosts will always be opaque
        // (https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cross-origin-resources)
        // and it is not possible to determine whether an opaque response represents a success or failure
        // (https://github.com/whatwg/fetch/issues/14).
        var request = new Request(url, {mode: 'no-cors'});
        return fetch(request).then(function(response) {
          if (response.status >= 400) {
            throw new Error('request for ' + urlToPrefetch +
              ' failed with status ' + response.statusText);
          }

          // Use the original URL without the cache-busting parameter as the key for cache.put().
          return cache.put(urlToPrefetch, response);
        }).catch(function(error) {
          console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
        });
      });

      return Promise.all(cachePromises).then(function() {
        console.log('Pre-fetching complete.');
      });
    }).catch(function(error) {
      console.error('Pre-fetching failed:', error);
    })
  );
});

self.addEventListener('activate', function(event) {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic will handle the case where
  // there are multiple versioned caches.
  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log('Handling fetch event for', event.request.url);
  var requestURL = new URL(event.request.url);
  requestURL.origin == location.origin && event.respondWith(
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    // It's an alternative to first opening a specific named cache and then matching on that.
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log('Found response in cache:', response);

        return response;
      }

      console.log('No response found in cache. About to fetch from network...');

      // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
      // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
      return fetch(event.request).then(function(response) {
        console.log('Response from network is:', response);

        return response;
      }).catch(function(error) {
        // This catch() will handle exceptions thrown from the fetch() operation.
        // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
        // It will return a normal response object that has the appropriate error code set.
        console.error('Fetching failed:', error);

        throw error;
      });
    })
  );
});
