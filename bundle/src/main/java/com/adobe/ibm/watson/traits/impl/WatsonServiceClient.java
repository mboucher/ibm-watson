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

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

import org.apache.commons.codec.binary.Base64;
import org.apache.http.entity.ContentType;
import org.apache.jackrabbit.oak.commons.PropertiesUtil;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import javax.net.ssl.HttpsURLConnection;
import javax.servlet.ServletException;


@Service(value=WatsonServiceClient.class)
@Component(immediate = true, metatype = true, label = "IBM Watson Personality Insight Client")
public class WatsonServiceClient {

    @Property(label = "IBM Watson Personality Insights Base URL", description = "The base REST API URL.", value="https://gateway.watsonplatform.net/personality-insights/api")
    private static final String PROP_WATSON_BASE_URL = "watson.baseurl";

    @Reference
    private ConfigurationManagerFactory configurationManagerFactory;

    private static final String CLOUD_SERVICE_NAME = "ibmwatson";
    private static final Logger log = LoggerFactory.getLogger(WatsonServiceClient.class);

    private BundleContext bundleContext;
    private String baseUrl;
    private String username;
    private String password;


    @Activate
    protected void activate(Map<String, Object> properties) {
        this.baseUrl = PropertiesUtil.toString(properties.get(PROP_WATSON_BASE_URL), null);
        log.info("Initializing IBM Watson service pointing to: " + this.baseUrl);
    }

    /**
     * Fetches the IBM Watson Personal Insights report using the user's Twitter Timeline.
     * @param language
     * @param tweets
     * @param resource
     * @return
     * @throws Exception
     */
    public String getWatsonScore(String language,String tweets, Resource resource) throws Exception{

        HttpsURLConnection connection = null;

        // Check if the username and password have been injected to the service.
        // If not, extract them from the cloud service configuration attached to the page.
        if(this.username == null || this.password == null) {
            getWatsonCloudSettings(resource);
        }

        // Build the request to IBM Watson.
        log.info("The Base Url is: " + this.baseUrl);
        String encodedCreds = getBasicAuthenticationEncoding();
        URL url = new URL(this.baseUrl + "/v2/profile");

        connection = (HttpsURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setDoInput(true);
        connection.setRequestProperty("Accept","application/json");
        connection.setRequestProperty("Content-Language", language);
        connection.setRequestProperty("Accept-Language", "en-us");
        connection.setRequestProperty("Content-Type", ContentType.TEXT_PLAIN.toString());
        connection.setRequestProperty ("Authorization", "Basic " + encodedCreds);
        connection.setUseCaches(false);
        connection.getOutputStream().write(tweets.getBytes());
        connection.getOutputStream().flush();
        connection.connect();

        log.info("Parsing response from Watson");
        StringBuilder str = new StringBuilder();

        BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        String line = "";
        while((line = br.readLine()) != null) {
            str.append(line + System.getProperty("line.separator"));
        }

        if(connection.getResponseCode() != 200) {
            // The call failed, throw an exception.
            log.error(connection.getResponseCode() + " : " + connection.getResponseMessage());
            connection.disconnect();
            throw new Exception("IBM Watson Server responded with an error: " + connection.getResponseMessage());
        } else {
            connection.disconnect();
            return str.toString();
        }
    }

    // Build the credential string to be used when authenticating to the IBM Watson Cloud Service.
    private String getBasicAuthenticationEncoding() {
        String userPassword = this.username + ":" + this.password;
        return new String(Base64.encodeBase64(userPassword.getBytes()));
    }

    private void getWatsonCloudSettings(Resource pageResource) throws Exception {
        // Load the IBM Watson Cloud Service Configuration
        Page page = pageResource.adaptTo(Page.class);
        Configuration watsonConfig = findCloudConfiguration(page);
        if (watsonConfig == null) {
            log.error("Unable to locate IBM Watson Cloud Configuration for {} ", pageResource.getPath());
            throw new Exception("IBM Watson Cloud Service Config not found.");
        } else {
            // Get the configuration settings.
            Resource watsonRes = watsonConfig.getContentResource().listChildren().next();
            ValueMap watsonProps = watsonRes.adaptTo(ValueMap.class);
            String watsonUsername = watsonProps.get("username", String.class);
            String watsonPassword = watsonProps.get("password", String.class);

            if ((watsonUsername == "" || watsonPassword == "") && (this.password == "" || this.username == "") ) {
                log.error("IBM Watson Cloud Configuration for {} is not configured properly", pageResource.getPath());
                throw new ServletException("IBM Watson Cloud Configuration is not configured properly");
            } else {
                this.setUsername(watsonUsername);
                this.setPassword(watsonPassword);
            }
        }
    }

    private Configuration findCloudConfiguration(Page page) {
        final HierarchyNodeInheritanceValueMap pageProperties = new HierarchyNodeInheritanceValueMap(page.getContentResource());
        final String[] services = pageProperties.getInherited(ConfigurationConstants.PN_CONFIGURATIONS, new String[0]);
        ResourceResolver resourceResolver = page.getContentResource().getResourceResolver();
        ConfigurationManager configurationManager = configurationManagerFactory.getConfigurationManager(resourceResolver);
        final com.day.cq.wcm.webservicesupport.Configuration cfg = configurationManager.getConfiguration(CLOUD_SERVICE_NAME, services);
        return cfg;
    }




    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
