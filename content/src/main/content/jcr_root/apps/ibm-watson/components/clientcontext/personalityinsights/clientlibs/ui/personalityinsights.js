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

if (window.CQ_Analytics
    && window.CQ_Analytics.CCM && window.CQ_Analytics.PersonalityInsigthtsMgr) {

    var initPersonalityInsigthtsMgr = function() {
        //add to std clickstream cloud ui
        CQ_Analytics.ClickstreamcloudUI.register(
            this.getSessionStore(),
            CQ_Analytics.CCM.getUIConfig(this.getName()));


        /* event handler (called when setting/updating data in ClientSidePersistence) */
        $CQ(CQ.shared.ClientSidePersistence).bind(CQ.shared.ClientSidePersistence.EVENT_NAME, function(event, data) {
            if (!data) {
                return;
            }
            /* we want to replicate CLIENTCONTEXT and PERSONALITYINSIGHTS to the cookie */
            if (((data.key === 'CLIENTCONTEXT') || (data.key === 'PERSONALITYINSIGHTS')) && (data.mode != CQ.shared.ClientSidePersistence.MODE_COOKIE.name)) {

                var replicate = new CQ.shared.ClientSidePersistence({'container': '', 'mode': CQ.shared.ClientSidePersistence.MODE_COOKIE});
                var value = replicate.get(data.key);
                if( data.key === 'PERSONALITYINSIGHTS' && (!value || value == "") && data.action != "set") {
                    //case if no cookie was set -> force a delete of the local storage or any data storage
                    CQ.shared.ClientSidePersistence.clearAllMaps();
                }

                var key = data.key;
                var finalValue = "";
                var map = null;
                if( data.value && data.value != "") {
                    //parse persistence to extract and store only authorizableId
                    var psstore = new CQ_Analytics.PersistedSessionStore();
                    psstore.init = function() {
                        this.data = {};
                    };
                    psstore.persist = function() {};

                    map = psstore.parse(data.value);

                    if( map["authorizableId"]) {
                        psstore.setProperty("authorizableId",map["authorizableId"]);
                    }
                    if( map["visitorId"]) {
                        psstore.setProperty("visitorId",map["visitorId"]);
                    }
                    finalValue = psstore.toString();

                }

                replicate.set(key, finalValue);
            }
        });
    };

    if (CQ_Analytics.CCM.isConfigLoaded) {
        initPersonalityInsigthtsMgr.call(CQ_Analytics.PersonalityInsigthtsMgr);
    } else {
        CQ_Analytics.CCM.addListener("configloaded", initPersonalityInsigthtsMgr, CQ_Analytics.PersonalityInsigthtsMgr);
    }

    CQ_Analytics.PersonalityInsigthtsMgr.renderer = function(store, divId) {

		var name = CQ_Analytics.ProfileDataMgr.getProperty("formattedName");
		var templateRenderer = CQ_Analytics.PersonalityInsigthtsMgr.templateRenderer;
        var storeDiv = $CQ("#" + divId);
        storeDiv.empty();
        // Set title
		storeDiv.addClass("cq-cc-customstore");
		var div = $CQ("<div id='ibmwatson-header'>").html(name + " IBM Watson's  Personality Insights");
		storeDiv.append(div);

        CQ_Analytics.PersonalityInsigthtsMgr.rendered = true;

        var data = this.data;
        var val;

        if (data) {
            var table = $CQ("<table class='pi_table'>");

            for (var i in data) {
                val = parseInt(data[i]);
                console.log(i + ":::" + val);
                var cell = templateRenderer(i,val);
                table.append(cell);
            }

            table.append("<tr><td colspan=2><div style='font-size:8pt; text-align:right; padding-top:10px; padding-right:10px;'>Powered by IBM Watson <img src='/etc/designs/ibm-watson/images/avatar-bl-150.png' width='20' align='top'> </div></td></tr>");
            storeDiv.append(table);
        }
    }


    var slider_colors = ['dd1a18','de1f19','df261a','e0291a','e1311b','e1351b','e33c1c','e3421c','e5471d','e54d1e','e7521f','e7581f','e85d20','e96420','ea6921','eb6f22','ec7423','ed7a23','ee7f24','ee8524','f08a25','f09025','f29727','f29b27','f4a328','f5ae29','f6b229','f7b92b','f7bd2b','f9c42c','f9c82c','fbcf2d','fbd32d','fdda2e','fdde2e','fee630','feea30','fdeb30','fbec30','fbed30','f8ed30','f8ee30','f6ef30','f5f030','f3f030','f2f130','f0f230','eff330','edf330','ecf430','eaf530','e9f630','e7f630','e6f830','e5f830','e3f930','e2fa30','e0fb30','dffb30','defd30','dcfd30','dbfe30','d9fe30','d5fd2f','cdf92d','c9f82d','c2f42b','bef32a','b7ef28','b3ee27','acea25','a8e825','a1e523','9de322','96e020','92de20','8adb1e','86d91d','7fd51b','79d31a','74d019','6ece18','69cb16','63c815','5ec614','58c313','53c111','4cbe10','47bc0e','41b90d','3cb60c','36b40b','31b109','2baf08','24ab06','20a906','18a604','15a403','0da101','099f01','069901'];
    var slider_colors2 = ['ab0000','ac0000','ad0000','ae0000','af0000','af0300','b10a00','b11000','b31500','b31b00','b52000','b52600','b62b00','b73200','b83700','b93d00','ba4200','bb4800','bc4d00','bc5300','be5800','be5e00','c06500','c06900','c27100','c37c00','c48000','c58700','c58b00','c79200','c79600','c99d00','c9a100','cba800','cbac00','ccb400','ccb800','cbb900','c9ba00','c9bb00','c6bb00','c6bc00','c4bd00','c3be00','c1be00','c0bf00','bec000','bdc100','bbc100','bac200','b8c300','b7c400','b5c400','b4c600','b3c600','b1c700','b0c800','aec900','adc900','accb00','aacb00','a9cc00','a7cc00','a3cb00','9bc700','97c600','90c200','8cc100','85bd00','81bc00','7ab800','76b600','6fb300','6bb100','64ae00','60ac00','58a900','54a700','4da300','47a100','429e00','3c9c00','379900','319600','2c9400','269100','218f00','1a8c00','158a00','0f8700','0a8400','048200','007f00','007d00','007900','007700','007400','007200','006f00','006d00','006700'];


    // HTML template
    CQ_Analytics.PersonalityInsigthtsMgr.template =
         '<tr><td><div>%label%</div></td>'
    + '<td><input type="range" class="slider" style="background: linear-gradient(%slider_col%,%slider_col2%);" name="%key%" value="%value%" onChange="rangeChanged(this,value, false)" onInput="updateRange(this)" onLoad="updateRange(this)">'
		+ '<input type="text" size="1" value="%value%" id="%key%_val" class="slider_box"></td></tr>'
        ;

    CQ_Analytics.PersonalityInsigthtsMgr.templateRenderer = function(key, value) {

         var checkedString = ""; var checkedClass = "";
         if (value==="true") {
             checkedString = "checked='checked'";
             checkedClass  = "checked";
         }
         var template = CQ_Analytics.PersonalityInsigthtsMgr.template;
         return template.replace(/%label%/g, key)
             .replace(/%key%/g, key)
             .replace(/%checked%/g, checkedString)
             .replace(/%checkedClass%/g, checkedClass)
         	 .replace(/%value%/g, value)
         	 .replace(/%slider_col%/g, '#'+slider_colors[value])
         	 .replace(/%slider_col2%/g, '#'+slider_colors2[value]);
     }

    /* reload PersonalityInsigthts on profile store update */
    CQ_Analytics.ProfileDataMgr.addListener('update', function() {
        CQ_Analytics.PersonalityInsigthtsMgr.fireEvent('update');
    });
}

function updateRange(obj){
    var divId = CQ_Analytics.PersonalityInsigthtsMgr.divId;
    //var obj = $CQ("#" + divId).children('.pi_table').children(name).context.activeElement;
    $CQ(obj).parent().children('.slider_box').val(obj.value);
    obj.style.background = 	'linear-gradient('+'#' + slider_colors[obj.value]+ ',' +'#' + slider_colors2[obj.value]+')';

    // Update the ContextHub data store.
    var store = ContextHub.getStore("ibm_watson_store");
    store.preventSelfUpdating = true;
    store.setItem(obj.name,obj.value);
    store.preventSelfUpdating = false;

}

function rangeChanged(obj,val,prevent_update){
    var divId = CQ_Analytics.PersonalityInsigthtsMgr.divId;
    //var obj = $CQ("#" + divId).children('.pi_table').children(name).context.activeElement;
    if(val != null) obj.value = val;
    updateRange(obj.name,val);
    if(!prevent_update)	CQ_Analytics.PersonalityInsigthtsMgr.fireEvent("update");
}

