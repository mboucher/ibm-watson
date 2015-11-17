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

/**
 * The <code>CQ_Analytics.PersonalityInsigthtsMgr</code> object is a store providing IBM Watson Personality Insights.
 * Based on the initial implementation by Kevin Smith.
 * @author Marcel Boucher
 * @class CQ_Analytics.PersonalityInsigthtsMgr
 * @singleton
 * @extends CQ_Analytics.PersistedSessionStore
 * @since 6.1
 */
if (!CQ_Analytics.PersonalityInsigthtsMgr) {
    CQ_Analytics.PersonalityInsigthtsMgr = function() {
        this.addListener("beforepersist", function() {
            this.checkAuthorizableId();
        }, this);
    };

    CQ_Analytics.PersonalityInsigthtsMgr.prototype = new CQ_Analytics.PersistedSessionStore();

    /**
     * @cfg {String} STOREKEY
     * Store internal key
     * @final
     * @private
     */
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.STOREKEY = "PERSONALITYINSIGHTS";

    /**
     * @cfg {String} STORENAME
     * Store internal name
     * @final
     * @private
     */
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.STORENAME = "personalityinsights";


    //inheritDoc
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.init = function() {
        this.persistence = new CQ_Analytics.SessionPersistence({'container': 'ClientContext'});

        var value = this.persistence.get(this.getStoreKey());
        if (!value || value == "") {
            this.data = {};
            for (var p in this.initProperty) {
                this.data[p] = this.initProperty[p];
            }
        } else {
            this.data = this.parse(value);
        }

        this.persist();
        this.initialized = true;
        this.fireEvent("initialize",this);
        this.fireEvent("update");
    };

    /**
     * Checks if authorizableId property is defined in personalityinsights data and updates the ClickstreamcloudMgr in consequence.
     * See {@link CQ_Analytics.ClientContextMgr#setVisitorId}.
     */
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.checkAuthorizableId = function() {
        if (!this.data) {
            this.init();
        }
        if (this.data["authorizableId"]) {
            CQ_Analytics.CCM.setVisitorId(this.data["authorizableId"]);
        } else {
            CQ_Analytics.CCM.setVisitorId("");
        }
    };

    //inheritDoc
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.getLabel = function(name) {
        return name;
    };

    //inheritDoc
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.getLink = function(name) {
        return "";
    };

    //inheritDoc
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.clear = function() {
        if (this.persistence) {
            this.persistence.remove(this.getStoreKey());
        }

        this.data = null;
        this.initProperty = {};
    };

    /**
     * Return the IBM Watson Personality Insights AEM Servlet loader URL.
     * @return {String} The URL
     * @since 6.1
     */
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.getLoaderURL = function() {
        //return CQ_Analytics.ClientContextMgr.getClientContextURL("/contextstores/watson.personality.insights.json");
        var path = window.location.pathname;
        return path.substring(0,path.lastIndexOf(".")) + "/jcr:content/watson.personality.insights.json";
    };

    /**
     * Loads a profile based on the authoriable id of the user.
     * @param {String} authorizableId The user id
     */
    CQ_Analytics.PersonalityInsigthtsMgr.prototype.loadPersonalityInsights = function(authorizableId) {

		// Fetch the current user's Twitter handle from their profile.
        var twitterHandle = CQ_Analytics.ProfileDataMgr.getProperty("twitterHandle");
        if(twitterHandle) {
            var url = this.getLoaderURL();
            url = CQ_Analytics.Utils.addParameter(url, "authorizableId", authorizableId);
            url = CQ_Analytics.Utils.addParameter(url, "locale","en"); //TODO: Make this value dynamic.
            url = CQ_Analytics.Utils.addParameter(url, "maxTweets","100"); //TODO: Make this value configurable.
            url = CQ_Analytics.Utils.addParameter(url, "twitterHandle",twitterHandle);
            //url = CQ_Analytics.Utils.addParameter(url, "runmode","production");
            
            
            try {
                var object = CQ.shared.HTTP.eval(url);
                if (object) {
                    this.data = parseWatsonResponse(object);
                    this.persist();
                    this.fireEvent("initialize",this);

                    if (CQ_Analytics.ClickstreamcloudEditor) {
                        CQ_Analytics.ClickstreamcloudEditor.reload();
                    }
                    return true;
                }
            } catch(error) {
                if (console && console.log) console.log("Error while loading IBM Watson Personality Insights", error);
            }
        } else {
            this.data={};
            if (console && console.log) console.log("Authenticated User: " + authorizableId + ". Does not have a Twitter handle defined ion their profile.");
        }

        return false;
    };

    CQ_Analytics.PersonalityInsigthtsMgr = new CQ_Analytics.PersonalityInsigthtsMgr();

    CQ_Analytics.CCM.addListener("configloaded", function() {
        this.checkAuthorizableId();
		this.loadPersonalityInsights(CQ_Analytics.ProfileDataMgr.data.authorizableId);
        //registers Profile Data to clickstreamcloud manager
        CQ_Analytics.CCM.register(this);
    }, CQ_Analytics.PersonalityInsigthtsMgr);

    /* reload PersonalityInsigthts on profile store update */
    CQ_Analytics.ProfileDataMgr.addListener('update', function() {
        if(CQ_Analytics.ProfileDataMgr.data.authorizableId) {
	        CQ_Analytics.PersonalityInsigthtsMgr.loadPersonalityInsights(CQ_Analytics.ProfileDataMgr.data.authorizableId);
        }
    });


}

function parseWatsonResponse(data) {
    if(data.tree && data.tree.children && data.tree.children[0] && data.tree.children[0].children[0]){
        var personality = data.tree.children[0].children[0];
        var jsonData = {};
        for(var i=0; i<personality.children.length; i++){
            var trait = personality.children[i].id;
            var perc = Math.round(personality.children[i].percentage * 100);
            jsonData[trait] = parseInt(perc);
        }
        return jsonData;
    }
    
}
