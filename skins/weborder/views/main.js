﻿/*
 * Revel Systems Online Ordering Application
 *
 *  Copyright (C) 2014 by Revel Systems
 *
 * This file is part of Revel Systems Online Ordering open source application.
 *
 * Revel Systems Online Ordering open source application is free software: you
 * can redistribute it and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Revel Systems Online Ordering open source application is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Revel Systems Online Ordering Application.
 * If not, see <http://www.gnu.org/licenses/>.
 */

define(["backbone", "factory", "generator"], function(Backbone) {
    'use strict';

    App.Views.MainView = {};

    App.Views.MainView.MainMainView = App.Views.FactoryView.extend({
        name: 'main',
        mod: 'main',
        initialize: function() {
            this.listenTo(this.model, 'change:content', this.content_change, this);
            this.listenTo(this.model, 'change:header', this.header_change, this);
            this.listenTo(this.model, 'change:cart', this.cart_change, this);
            this.listenTo(this.model, 'change:popup', this.popup_change, this);
            this.listenTo(this.model, 'loadStarted', this.loadStarted, this);
            this.listenTo(this.model, 'loadCompleted', this.loadCompleted, this);
            this.listenTo(this.model, 'change:isShowPromoMessage', this.calculatePromoMessageWidth, this);
            this.listenTo(this.model, 'change:isShowStoreChoice', this.checkBlockStoreChoice, this);
            this.listenTo(this.model, 'change:isBlurContent', this.blurEffect, this);

            this.iOSFeatures();

            this.subViews.length = 3;

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            if (App.Settings.promo_message) this.calculatePromoMessageWidth(); // calculate a promo message width
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            if (App.Data.establishments.length > 1) this.model.set('isShowStoreChoice', true);
            !this.iPad7Feature.init && this.iPad7Feature();

            var spinner = this.$('#main-spinner');
            spinner.spinner();
            spinner.css('position', 'fixed');

            return this;
        },
        events: {
            'click #popup .cancel': 'hide_popup',
            'click .change_establishment': 'change_establishment'
        },
        content_change: function() {
            var content = this.$('#content'),
                data = this.model.get('content'),
                content_defaults = this.content_defaults();

            while (this.subViews.length > 3)
                this.subViews.pop().removeFromDOMTree();

            if (Array.isArray(data))
                data.forEach(function(data) {
                    content.append(this.addContent(data));
                }, this);
            else
                content.append(this.addContent(data));
        },
        header_change: function() {
            var data = _.defaults(this.model.get('header'), this.header_defaults()),
                id = 'header_' + data.modelName + '_' + data.mod;

            this.subViews[0] && this.subViews[0].removeFromDOMTree();
            this.subViews[0] = App.Views.GeneratorView.create(data.modelName, data, id);
            this.$('#header').append(this.subViews[0].el);
        },
        cart_change: function() {
            var data = _.defaults(this.model.get('cart'), this.cart_defaults()),
                id = 'cart_' + data.modelName + '_' + data.mod;

            this.subViews[1] && this.subViews[1].removeFromDOMTree();
            this.subViews[1] = App.Views.GeneratorView.create(data.modelName, data, id);
            this.$('#cart').append(this.subViews[1].el);
        },
        popup_change: function(model, value) {
            var popup = this.$('.popup'),
                data, id;

            this.subViews[2] && this.subViews[2].remove();//this.subViews[2].removeFromDOMTree();

            if (typeof value == 'undefined')
                return popup.removeClass('ui-visible');

            data = _.defaults(this.model.get('popup'), this.popup_defaults());
             if (data.two_columns_view === true) {
                $('#popup').removeClass("popup-background");
            } else {
                $('#popup').addClass("popup-background");
            }

            id = 'popup_' + data.modelName + '_' + data.mod;
            this.subViews[2] = App.Views.GeneratorView.create(data.modelName, data);
            this.$('#popup').append(this.subViews[2].el);

            popup.addClass('ui-visible');
        },
        hide_popup: function() {
            this.model.unset('popup');
        },
        header_defaults: function() {
            return {
                model: this.options.headerModel,
                className: 'header',
                modelName: 'Header'
            };
        },
        cart_defaults: function() {
            return {
                collection: this.options.cartCollection,
                className: 'cart',
                modelName: 'Cart'
            };
        },
        content_defaults: function() {
            return {
                className: 'content'
            };
        },
        popup_defaults: function() {
            /*return {
             className: 'popup'
             };*/
        },
        addContent: function(data, removeClass) {
            var id = 'content_' + data.modelName + '_' + data.mod;
            data = _.defaults(data, this.content_defaults());

            if (removeClass)
                delete data.className;

            var subView = App.Views.GeneratorView.create(data.modelName, data, id);
            this.subViews.push(subView); // subViews length always > 3

            return subView.el;
        },
        iOSFeatures: function() {
            if (/iPad|iPod|iPhone/.test(window.navigator.userAgent))
                document.addEventListener('touchstart', new Function, false); // enable css :active pseudo-class for all elements
        },
        iPad7Feature: function() {
            if (/iPad;.*CPU.*OS 7_\d/i.test(window.navigator.userAgent))
                this.$el.on('orientationchange', listen);
            else
                return;

            this.iPad7Feature.init = true;
            listen();

            function listen() {
                if (matchMedia('(orientation:landscape)').matches && window.innerHeight != window.outerHeight) {
                    $('html').addClass('ipad');
                    $(window).scrollTop(0, 0);
                } else {
                    $('html').removeClass('ipad');
                }
            }
        },
        loadCompleted: function() {
            $(window).trigger('loadCompleted');
            clearTimeout(this.spinner);
            delete this.spinner;
            this.hideSpinner();
        },
        loadStarted: function() {
            this.spinner = setTimeout(this.showSpinner.bind(this), 50);
        },
        showSpinner: function() {
            this.$('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
        },
        hideSpinner: function() {
            this.$('#main-spinner').addClass('ui-visible').removeClass('ui-visible');
        },
        remove: function() {
            $(window).off('resize', this.resizePromoMessage);
            App.Views.FactoryView.prototype.remove.apply(this, arguments);
        },
        /**
         * Calculate a promo message width.
         */
        calculatePromoMessageWidth: function() {
            if (this.model.get('isShowPromoMessage')) {
                var promo_message = Backbone.$('<div class="promo_message promo_message_internal"> <span>' + App.Settings.promo_message + '</span> </div>');
                $('body').append(promo_message);
                this.model.set('widthPromoMessage', promo_message.find('span').width());
                promo_message.remove();
                this.model.set('widthWindow', $(window).width());
                this.addPromoMessage(); // add a promo message
                $(window).resize(this, this.resizePromoMessage);
            } else {
                this.$('.promo_message').hide();
            }
        },
        /**
         * Resize of a promo message.
         */
        resizePromoMessage: function() {
            if (arguments[0].data.model.get('widthWindow') !== $(window).width()) {
                arguments[0].data.model.set('widthWindow', $(window).width());
                arguments[0].data.addPromoMessage(); // add a promo message
            }
        },
        /**
         * Add promo message.
         */
        addPromoMessage: function() {
            var self = this;
            window.setTimeout(function() {
                var promo_text = self.$('.promo_text');
                var promo_marquee = self.$('.promo_marquee');
                if (self.model.get('widthPromoMessage') >= promo_text.parent().width() - 20) {
                    var isFirefox = /firefox/g.test(navigator.userAgent.toLowerCase());
                    if (isFirefox) {
                        // bug #15981: "First Firefox displays long promo message completely then erases it and starts scrolling"
                        $(document).ready(function() {
                            promo_text.hide();
                            promo_marquee.show();
                        });
                    } else {
                        promo_text.hide();
                        promo_marquee.show();
                    }
                } else {
                    promo_text.show();
                    promo_marquee.hide();
                }
            }, 0);
        },
        /**
         * Show the "Store Choice" block if a brand have several stores.
         */
        checkBlockStoreChoice: function() {
            if (this.model.get('isShowStoreChoice')) {
                this.$('.current_establishment').show();
            } else {
                this.$('.current_establishment').hide();
            }
        },
        /**
         * Show the "Change Establishment" modal window.
         */
        change_establishment: function() {
            $('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
            App.Data.establishments.getModelForView().set({
                storeDefined: true,
                showFooter: true
            }); // get a model for the stores list view
            App.Data.establishments.trigger('loadStoresList');
            this.model.set('isBlurContent', true);
            $('#main-spinner').removeClass('ui-visible');
        },
        /**
         * A blur effect of content.
         * Blur effect supported on Firefox 35, Google Chrome 18, Safari 6, iOS Safari 6.1, Android browser 4.4, Chrome for Android 39.
         */
        blurEffect: function() {
            // http://wordpress-club.com/krossbrauzernyiy-effekt-razmyitiya-blur-izobrazheniya-v-css
            // http://caniuse.com/#search=filter
            if (this.model.get('isBlurContent')) {
                this.$('.main_el').css({
                    '-webkit-filter': 'url(#blur)',
                    'filter': 'url(#blur)'
                });
            } else {
                this.$('.main_el').removeAttr('style');
            }
        }
    });

    App.Views.MainView.MainMaintenanceView = App.Views.FactoryView.extend({
        name: 'main',
        mod: 'maintenance',
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.listenToOnce(App.Data.mainModel, 'loadCompleted', App.Data.myorder.check_maintenance);
        },
        events: {
            "click .btn": 'reload'
        },
        reload: function() {
            window.location.replace(window.location.href.replace(/#.*$/, ''));
        }
    });

});