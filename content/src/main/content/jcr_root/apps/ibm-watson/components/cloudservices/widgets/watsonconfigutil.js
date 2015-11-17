CQ = window.CQ || {};
CQ.ibmwatson = CQ.ibmwatson || {};

CQ.Ext.namespace("CQ.ibmwatson");

CQ.ibmwatson.IBMWatson = CQ.ibmwatson.IBMWatson ||
        {

            /**
             * Shows a progress bar dialog.
             *
             * @param dialog
             *            Parent dialog to attach the progress bar to.
             * @param isShown
             *            Indicator if progress dialog is shown or not.
             */
            showButtonIndicator : function(dialog, isShown) {
                var btn = dialog.find("localName", "connectButton")[0];
                if (this.labelBtn === null) {
                    this.labelBtn = btn.getText();
                }
                if (!isShown) {
                    CQ.Ext.Msg.wait(CQ.I18n.getMessage("Connection successful")).hide();
                } else {
                    CQ.Ext.Msg.wait(CQ.I18n.getMessage("Connecting to IBM Watson Cloud Services ..."));
                }
            },

            /**
             * Gets a field with the provided key from a panel.
             *
             * @param panel
             *            Panel which holds the field.
             * @param key
             *            Field name
             */
            getField : function(panel, key) {
                var items = panel.find("name", "./" + key);
                if ((CQ.Ext.isArray(items)) && (items.length > 0))
                    return items[0];
            },

            /**
             * Loads the form with data after loading.
             */
            afterRender : function(comp) {
                var dialog = comp.findParentByType('dialog');
                dialog.on('loadcontent', function(dlg) {
                    var username = dialog.find('name', './public/username');
                    if (username[0].getValue() !== '') {
                        comp.setText(CQ.I18n.getMessage('Re-Connect to IBM Watson'));
                    }
                });
            },

            fieldEmpty : function fieldEmpty(dialog, field, msg) {
                if (!field || field.getValue() === "") {
                    this.showButtonIndicator(dialog, false);
                    CQ.Ext.Msg.alert(CQ.I18n.getMessage("Error"), msg);
                    return true;
                }
                return false;
            },

            checkWatson: function(comp, evt) {
                try {
					var dialog = comp.findParentByType('dialog');
                    var username = this.getField(dialog, 'public/username');
                    var password = this.getField(dialog, 'public/password');

                    if (this.fieldEmpty(dialog, username, CQ.I18n.getMessage("Please enter the Watson API Username.")) ||
                            this.fieldEmpty(dialog, password, CQ.I18n.getMessage("Please enter Watson API Password."))) {
                        return;
                    }
					this.showButtonIndicator(dialog, true);
                    that = this;

                    $.post("/etc/cloudservices/watson.personality.insights.json",
                           {
                               "username" : username.getValue(),
                               "password" : password.getValue()
                           }, function(data, txtStatus, jqXHR) {
								that.showButtonIndicator(dialog, false);
                               if(data.responseCode == "200") {
                                   // Inform the user of success
                                   that.showButtonIndicator(dialog, false);
                                   CQ.Ext.Msg.alert(CQ.I18n.getMessage("Success"), CQ.I18n
                                        .getMessage("Connection to IBM Watson Cloud Services succeded."));
                               } else {
									CQ.Ext.Msg.alert(CQ.I18n.getMessage("ERROR"), CQ.I18n
                                        .getMessage("Unable to establish connection to IBM Watson Cloud Services, please check the Watson API Base URL in the OSGi Configuration."));
                               }

                           }, "json").fail(function failedToConnect(data, txtStatus, jqXHR) {
                                        console.log("Failed to connect to IBM Watson Cloud Services :"+textStatus);
                                        	CQ.Ext.Msg.alert(CQ.I18n.getMessage("Error"), CQ.I18n
                                            	.getMessage("Unable to establish connection to IBM Watson Cloud Services, please check the Watson API Base URL in the OSGi Configuration."));

                });


                } catch(error) {
                    if (console && console.log) console.log("Error while connecting to IBM Watson.", error);
                }
            }

        };

