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

ContextHub.console.log('[+] loading [contexthub.store.personality.insights] personality.insights.store.js (clientcontext connector)');

;(function ($) {
    'use strict';

    /* default config */
    var defaultConfig = {
        mappingConfig: {
            /* ClientContext store name */
            clientContextStoreName: 'personalityinsights',

            /* ContextHub property: ClientContext property */
            propertyMapping: {
                Openness: 'Openness',
                path: 'path'
            },

            /* replicate properties not mentioned in propertyMapping? */
            mapOtherProperties: true,

            /* replicate to ClientContext? */
            replicateToClientContext: true
        }
    };


    /**
     * Constructor.
     *
     * @constructor
     * @extends ContextHub.Store.ClientContextBackedStore
     * @param {String} name - store name
     * @param {Object} config - config
     */
    var PersonalityStore = function(name, config) {
        this.config = $.extend({}, true, defaultConfig, config);
        this.init(name, this.config);
        this.queryService(true);
    };

    ContextHub.Utils.inheritance.inherit(PersonalityStore, ContextHub.Store.ClientContextBackedStore);

    /**
     * Loads given profile in ClientContext.
     *
     * @param {String} path - path
     */
    PersonalityStore.prototype.loadPersonalityInsights = function(authorizableId) {
        /* extract authorizableId from the path */
        //var authorizableId = (path || '').split('/').pop();
        console.log("check it");

        if (authorizableId.length) {
            ClientContext.get(this.config.mappingConfig.clientContextStoreName).loadPersonalityInsights(authorizableId);
        }
    };

    PersonalityStore.prototype.updatePersonalityInsight = function(key,value) {
		var store = ClientContext.get(this.config.mappingConfig.clientContextStoreName);
		store.data[key] = value;
    }

    /**
     * Resets PersonalityInsights's store.
     */
    PersonalityStore.prototype.reset = function() {
        var store = ClientContext.get(this.config.mappingConfig.clientContextStoreName);
        if (store) {
            store.reset();
        }
    };

    /* register ClientContext - ContextHub profile connector */
    ContextHub.Utils.storeCandidates.registerStoreCandidate(PersonalityStore, 'watson.personality', 10, function() {
        return !!window.ClientContext;
    });

}(ContextHubJQ));
