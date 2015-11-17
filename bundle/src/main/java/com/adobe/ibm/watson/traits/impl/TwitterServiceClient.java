/*
 * #%L
 * IBM Watson Demo Bundle
 * %%
 * Copyright (C) 2015 Adobe
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

package com.adobe.ibm.watson.traits.impl;

import com.day.cq.commons.inherit.HierarchyNodeInheritanceValueMap;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.webservicesupport.Configuration;
import com.day.cq.wcm.webservicesupport.ConfigurationConstants;
import com.day.cq.wcm.webservicesupport.ConfigurationManager;
import com.day.cq.wcm.webservicesupport.ConfigurationManagerFactory;
import org.apache.felix.scr.annotations.*;

import org.apache.jackrabbit.oak.commons.PropertiesUtil;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import twitter4j.*;

import javax.net.ssl.HttpsURLConnection;
import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.*;

@Service(value=TwitterServiceClient.class)
@Component(immediate = true, metatype = true, label = "Twitter Service Client")
public class TwitterServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TwitterServiceClient.class);

    //Constants
    private static final String CLOUD_SERVICE_NAME = "twitterconnect";

    private String twitterId;
    private String twitterSecret;

    @Reference
    private ConfigurationManagerFactory configManagerFactory;

    @Property(label = "Default Twitter API Username", description = "Only needed in a production environment without Geometrixx Outdoors site.", value="sPCqimbNL0oWnfCeaWkMog")
    private static final String PROP_TWITTER_ID = "twitter.clientId";

    @Property(label = "Default Twitter API Secret", description = "Only needed in a production environment without Geometrixx Outdoors site.", value="8EIopQz9MozHs9PkGN46ZS7MbkpZGYpwgwO01bG9c")
    private static final String PROP_TWITTER_SECRET = "twitter.clientSecret";

    @Activate
    protected void activate(Map<String, Object> properties) throws Exception {
        this.twitterId = PropertiesUtil.toString(properties.get(PROP_TWITTER_ID), null);
        this.twitterSecret = PropertiesUtil.toString(properties.get(PROP_TWITTER_SECRET), null);

    }


    /**
     * Fetches all of the Tweets for a given screen name.
     * @param screenName
     * @param maxTweets
     * @return ArrayList of the user's timeline tweets.
     * @throws IOException
     */
    public ArrayList<String> fetchTimelineTweets(String screenName, int maxTweets, Resource pageResource) throws IOException {
        HttpsURLConnection connection = null;
        String bearerToken =  requestBearerToken("https://api.twitter.com/oauth2/token", pageResource);
        String endPointUrl = "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=" + screenName + "&count=" + maxTweets;

        try {
            URL url = new URL(endPointUrl);
            connection = (HttpsURLConnection) url.openConnection();
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Host", "api.twitter.com");
            connection.setRequestProperty("User-Agent", "Your Program Name");
            connection.setRequestProperty("Authorization", "Bearer " + bearerToken);
            connection.setUseCaches(false);


            // Parse the JSON response into a JSON mapped object to fetch fields from.
            JSONArray obj = new JSONArray(readResponse(connection));
            ArrayList<String> tweets = new ArrayList<String>();

            if (obj != null) {
                for(int j = 0; j < obj.length(); j++){
                    if(obj.getJSONObject(j).has("retweeted_status") == false) {
                        tweets.add(obj.getJSONObject(j).get("text").toString());
                    }
                }
                return tweets;
            } else {
                return null;
            }
        }
        catch (MalformedURLException e) {
            throw new IOException("Invalid endpoint URL specified.", e);
        }
        catch (JSONException e) {
            throw new IOException("Unable to process JSON content.",e);
        }
        finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private  String requestBearerToken(String endPointUrl, Resource pageResource) throws IOException {
        HttpsURLConnection connection = null;
        String appKey;
        String appSecret;

        // Load the Twitter Connect Cloud Service Configuration from the current page.
        // If none is found (e.g. Segment Builder page, use the Geometrixx Outdoors Twitter configuration.
        log.info("Looking for Twitter Cloud Configuration at: " + pageResource.getPath());
        Configuration twitterConfig = findCloudConfiguration(pageResource.adaptTo(Page.class));
        if (twitterConfig == null) {
            log.error("Unable to locate Twitter Connect Cloud Configuration for {}. Using Geometrixx Outdoors defaults.", pageResource.getPath());
            Resource resource = pageResource.getResourceResolver().getResource("/content/geometrixx-outdoors/en");
            twitterConfig = findCloudConfiguration(resource.adaptTo(Page.class));
        }
        if(twitterConfig != null){
            // Get the configuration settings from the cloudservice config.
            Resource twitterResource = twitterConfig.getContentResource().listChildren().next();
            ValueMap twitterProps = twitterResource.adaptTo(ValueMap.class);
            appKey = twitterProps.get("oauth.client.id", String.class);
            appSecret = twitterProps.get("oauth.client.secret", String.class);
        } else {
            // Fall back to defaut credentials configured in OSGi
            appKey = this.twitterId;
            appSecret = this.twitterSecret;
        }

        String encodedCredentials = encodeKeys(appKey,appSecret);

        try {
            URL url = new URL(endPointUrl);
            connection = (HttpsURLConnection) url.openConnection();
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Host", "api.twitter.com");
            connection.setRequestProperty("User-Agent", "IBM Watson AEM Application");
            connection.setRequestProperty("Authorization", "Basic " + encodedCredentials);
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
            connection.setRequestProperty("Content-Length", "29");
            connection.setUseCaches(false);

            writeRequest(connection, "grant_type=client_credentials");

            // Parse the JSON response into a JSON mapped object to fetch fields from.
            JSONObject obj = new JSONObject(readResponse(connection));

            if (obj != null) {
                String tokenType = (String)obj.get("token_type");
                String token = (String)obj.get("access_token");

                return ((tokenType.equals("bearer")) && (token != null)) ? token : "";
            }
            return new String();
        }
        catch (MalformedURLException e) {
            throw new IOException("Invalid endpoint URL specified.", e);
        }
        catch (JSONException e){
            throw new IOException("Unable to process JSON content.", e);
        }
        finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    // Encode the Keys for the Twitter API call.
    private static String encodeKeys(String consumerKey, String consumerSecret) {
        try {
            String encodedConsumerKey = URLEncoder.encode(consumerKey, "UTF-8");
            String encodedConsumerSecret = URLEncoder.encode(consumerSecret, "UTF-8");

            String fullKey = encodedConsumerKey + ":" + encodedConsumerSecret;
            byte[] encodedBytes = Base64.getEncoder().encode(fullKey.getBytes());
            return new String(encodedBytes);
        }
        catch (UnsupportedEncodingException e) {
            return new String();
        }
    }

    // Writes a request to a connection
    private static boolean writeRequest(HttpsURLConnection connection, String textBody) {
        try {
            BufferedWriter wr = new BufferedWriter(new OutputStreamWriter(connection.getOutputStream()));
            wr.write(textBody);
            wr.flush();
            wr.close();

            return true;
        }
        catch (IOException e) { return false; }
    }


    // Reads a response for a given connection and returns it as a string.
    private static String readResponse(HttpsURLConnection connection) {
        try {
            StringBuilder str = new StringBuilder();

            BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line = "";
            while((line = br.readLine()) != null) {
                str.append(line + System.getProperty("line.separator"));
            }
            return str.toString();
        }
        catch (IOException e) { return new String(); }
    }

    // Utility function to find a Cloud Configuration on a page.
    private Configuration findCloudConfiguration(Page page) {
        final HierarchyNodeInheritanceValueMap pageProperties = new HierarchyNodeInheritanceValueMap(
                page.getContentResource());
        final String[] services = pageProperties.getInherited(ConfigurationConstants.PN_CONFIGURATIONS,
                new String[0]);
        ResourceResolver resourceResolver = page.getContentResource().getResourceResolver();
        ConfigurationManager configurationManager = configManagerFactory.getConfigurationManager(resourceResolver);
        final com.day.cq.wcm.webservicesupport.Configuration cfg = configurationManager.getConfiguration(
                CLOUD_SERVICE_NAME, services);
        return cfg;
    }

}
