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

;(function($) {

    var GraniteHelpers = $.extend(true, {
        HTTP: {
            externalize: function(url) { return url; }
        }
    }, window.top.window.Granite);

    var TEMPLATE_POPOVER_CONTAINER =
        '<div class="coral-Popover contexthub-popover">' +
            '<div class="coral-Popover-content">' +
                '<div class="contexthub-popover-title">' +
                    '<i class="coral-Icon coral-Icon--add coral-Icon--sizeS u-coral-pullRight js-add-product-activator" title="{{i18n title}}"></i>' +
                    '{{i18n title}}' +
                '</div>' +
                '<div class="contexthub-popover-content"></div>' +
            '</div>' +
        '</div>';

    function handleSliderChange($input, store, context) {
        var $slider = $input.closest(".coral-Slider"),
            $popover = $input.closest(".contexthub-popover"),
            $tooltip = $popover.find("[data-target='#contexthub-cart-total-slider']"),
            newValue = parseFloat($input.val());

        $tooltip.text($tooltip.text().replace(/[0-9]+\.[0-9]+/, newValue));

        if ($slider.find(".is-dragged").length == 0) {
            store.setItem("Neuroticism", newValue);

        } else {
            setTimeout(function() {
                handleSliderChange($input, store,context);
            }, 100)
        }
    }



    var NeuroticismRenderer = new Class({
        extend: ContextHub.UI.BaseModuleRenderer,

        defaultConfig: {
            icon: "coral-Icon--graphBubble",
            title: "Neuroticism",
            clickable: true,
            storeMapping: {
                p: "ibm_watson_store"
            },
            template:
                '<p>{{i18n title}}</p>' +
                '<p>{{neuroticism}}</p>',
            popoverTemplate:
                '<ul class="coral-SelectList is-visible is-inline">' +
                    '<div class="coral-Slider coral-Slider--filled" data-init="slider">' +
                        '<label><input id="contexthub-cart-total-slider" min="0" max="100" value="{{neuroticism}}" type="range"/></label>' +
                    '</div>' +
                    '<div class="coral-Tooltip coral-Tooltip--info coral-Tooltip--positionRight" data-init="tooltip" data-interactive="false" data-target="#contexthub-cart-total-slider">{{neuroticism}}</div>' +
                '</ul>'
        },

        /**
         * @override
         */
        render: function(module) {
            var config = $.extend({}, this.defaultConfig, module.config);
            var context = this.getTemplateContext(config);
            module.config = config;

            return this.superClass.render.call(this, module);
        },

        /**
         * @override
         */
        onClickModuleIcon: function(module, event) {
            this.superClass.onClickModuleIcon.call(this, module, event);
            var popover = this.getPopover(module);

        },

        /**
         * @override
         */
        getTemplateContext: function(config) {

            var context = {};
            if (config.storeMapping) {
                var store = ContextHub.getStore(config.storeMapping.p);
                if (store) {
                    context = store.getTree();
                } else {
                    ContextHub.console.log("Could not find store for mapping c: " + config.storeMapping.c);
                }
            }
            context.neuroticism = store.getItem("Neuroticism") || 0;
            context.title = config.title  || "";

            return context;
        },

        /**
         * @override
         */
        getPopoverContent: function(module) {
            var config = $.extend({}, this.defaultConfig, module.config),
                store = ContextHub.getStore(config.storeMapping.p);

            if (config.popoverTemplate) {
                var context = this.getTemplateContext(config);
                var $html = $(Handlebars.compile(config.popoverTemplate)(context));

                // TODO: figure out a generic way to do this...
                CUI.Slider.init($(".coral-Slider[data-init~='slider']", $html));

                $html.find(".contexthub-cart-quantity")
                    .blur(function(event) {
                        handleQuantityChange($(event.target), store, context);
                    })
                    .keydown(function(event) {
                        if (event.keyCode === 9 || event.keyCode === 13) {
                            $(event.target).blur();
                        }
                    });

                $html.find('#contexthub-cart-total-slider')[0].onchange = function(event) {
                    handleSliderChange($(event.target), store, context);
                };

                $html.find(".js-contexthub-delete-item-activator").click(function(event) {
                    var index = $(event.target).data("index");
                    store.setSimulatedScore(config.trait,index);
                });

                return $html;
            }

            return null;
        }
    });

    ContextHub.UI.registerRenderer("watson.neuroticism", new NeuroticismRenderer());

}(ContextHubJQ));