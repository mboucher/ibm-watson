/*
| Copyright 2015 Adobe
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
| http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/

ContextHub.console.log('[+] loading [contexthub.store.watson.personality] store.personality.js');

;(function ($) {
    'use strict';

    var defaultConfig = {
        service: {
            jsonp: false,
            timeout: 1000
        }
    };

    var PersonalityStore = function(name, config) {
        this.config = $.extend(true, {}, defaultConfig, config);
        this.init(name, this.config);
        this.queryService(false);
    };

    ContextHub.Utils.inheritance.inherit(PersonalityStore, ContextHub.Store.PersistedJSONPStore);

    PersonalityStore.prototype.successHandler = function(response) {
        /* pause eventing for this store */
        this.pauseEventing();

        var result = $.extend(true, {}, response);

        /* store result */
        this.setItem('/', result);

        /* resume eventing */
        this.resumeEventing();
    };

    PersonalityStore.prototype.loadPersonalityInsights = function() {
        var store = ContextHub.getStore('personalityinsights');
        store.queryService(true);
    };

    PersonalityStore.prototype.updatePersonalityInsights = function(key,value) {
		var store = ClientContext.get(this.config.mappingConfig.clientContextStoreName);
		store.setItem(key,value);
    }

    ContextHub.Utils.storeCandidates.registerStoreCandidate(PersonalityStore, 'watson.personality', 0);

}(ContextHubJQ));
