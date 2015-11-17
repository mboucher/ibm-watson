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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import javax.servlet.ServletException;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.sling.SlingServlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")

@Component(metatype = false, immediate = true, label = "IBM Watson Personality Insight Servlet")
@SlingServlet(
        extensions = {"json"},
        methods = {"GET","POST"},
        resourceTypes = {"sling/servlet/default"},
        selectors = {"personality.insights"},
        generateComponent = false
)
public class WatsonPersonalityInsightServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(WatsonPersonalityInsightServlet.class);

    @Reference
    WatsonServiceClient watsonServiceClient;

    @Reference
    TwitterServiceClient twitterServiceClient;

    private static final String RUN_MODE = "run.mode";

    private final String placeholderFeed = "But I must explain to you how all this mistaken idea of denouncing pleasure and praising " +
            "pain was born and I will give you a complete account of the system, and expound the actual teachings of the " +
            "great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure " +
            "itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter " +
            "consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain " +
            "of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him " +
            "some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain " +
            "some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no " +
            "annoying consequences, or one who avoids a pain that produces no resultant pleasure?";


    /**
     * Resource Mapping Servlet that will query the given user's Twitter timeline and pass the results to IBM Watson
     * to produce a Personality Insight report.
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    public void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        try {

            Resource pageResource = request.getResource().getParent().getParent();

            String runmode = request.getRequestParameter("runmode") == null ? "production" : request.getRequestParameter("runmode").getString();
            String locale = request.getRequestParameter("locale") == null ? "en" : request.getRequestParameter("locale").getString();
            int maxTweets = request.getParameter("locale") == null ? 100 : Integer.parseInt(request.getRequestParameter("maxTweets").getString());
            String screenName = request.getRequestParameter("twitterHandle").getString();

            if(screenName == null) {
                throw new ServletException("No Twitter profile was supplied.");
            }

            String personalityAssesment = "";

            if(runmode == "production") {
                ArrayList<String> tweets = twitterServiceClient.fetchTimelineTweets(screenName, maxTweets, pageResource);
                personalityAssesment = watsonServiceClient.getWatsonScore(locale, String.join(" ", tweets), pageResource);
            } else {
                ResourceResolver resolver = request.getResource().getResourceResolver();
                Resource cache = resolver.getResource("/apps/ibm-watson/cache/result.txt");
                InputStream is = cache.adaptTo(InputStream.class);
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                StringBuilder out = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    out.append(line);
                }
                personalityAssesment = out.toString();
            }
            response.setContentType("application/json");
            response.getWriter().print(personalityAssesment);
            response.flushBuffer();
        } catch (Exception e) {
            throw new ServletException("An Error occured while retrieveing personality insights from IBM Watson: " + e.getMessage());
        }
    }

    /**
     * The POST method is used to validate the account credentials provided in the Cloud Service configuration.
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    public void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        String username = request.getRequestParameter("username") == null ? "" : request.getRequestParameter("username").getString();
        String password = request.getRequestParameter("password") == null ? "" : request.getRequestParameter("password").getString();

        try {
            watsonServiceClient.setUsername(username);
            watsonServiceClient.setPassword(password);
            String personalityAssesment = watsonServiceClient.getWatsonScore("en",placeholderFeed,null);
            response.setContentType("application/json");
            response.getWriter().print("{\"responseCode\":\"200\"}");
            response.flushBuffer();
        } catch(Exception e) {
            throw new ServletException("An error occurred while connecting to IBM Watson");
        }

    }

}
