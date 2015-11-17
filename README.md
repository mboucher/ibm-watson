IBM Watson Personality
======================

This is an AEM Content Package which include a demo of integration between the IBM Watson Personality assessment service and the AEM ContextHub. 
This demo  is based on the initial work done by Kevin Smith.

Contents:
    OSGi bundle that contains:
     # An entrypoint servlet that exposes AJAX calls made by the contexthub store.
     # Twitter service client that retrieves timeline tweets based on the screen name provided. (uses Twitter4j).
     # IBM Watson client that submits the twitter stream and retrieves the assessment data.
       
    Content Package that contains:
     # Custom ContextHub renderes to display the data from Watson.
     # Custom ContextHub Store that makes a call to the above mentioned servlet to get the data 


Building
--------

This project uses Maven for building. Common commands:

From the root directory, run ``mvn -PautoInstallPackage clean install`` to build the bundle and content package and install to a CQ instance.

From the bundle directory, run ``mvn -PautoInstallBundle clean install`` to build *just* the bundle and install to a CQ instance.

Using with VLT
--------------

To use vlt with this project, first build and install the package to your local CQ instance as described above. Then cd to `content/src/main/content/jcr_root` and run

    vlt --credentials admin:admin checkout -f ../META-INF/vault/filter.xml --force http://localhost:4502/crx

Once the working copy is created, you can use the normal ``vlt up`` and ``vlt ci`` commands.

Specifying CRX Host/Port
------------------------

The CRX host and port can be specified on the command line with:
mvn -Dcrx.host=otherhost -Dcrx.port=5502 <goals>


