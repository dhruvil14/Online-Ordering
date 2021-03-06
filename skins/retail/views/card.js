/*
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

define(["card_view"], function(card_view) {
    'use strict';

    var checkoutAddress = 1,
        profileAddress = 2,
        newAddress = -1;

    var CardMainView = App.Views.CoreCardView.CoreCardMainView.extend({
        bindings: {
            '.checkbox-outer': 'classes: {hide: not(token_paymentsExist)}',
            '.checkbox': "checkedSpan: {value: rememberCard, outer_elem: '.checkbox-outer'}",
            '.dialog-input': 'classes: {hide: not(paymentMethods_credit_card_dialog)}'
        }
    });

    var CardBillingAddressView = App.Views.FactoryView.extend({
        name: 'card',
        mod: 'billing_address',
        initialize: function() {
            var dfd = this.options.customer.addressesRequest || Backbone.$.Deferred().resolve(),
                self = this;

            // wait until customer addresses are loaded
            dfd.always(function() {
                // set default country for new address
                self.setDefaultCountry();
                App.Views.FactoryView.prototype.initialize.apply(self, arguments);

                self.listenTo(self.options.customer.get('addresses'), 'change:selected', function() {
                    self.getBinding('$customerAddresses').trigger('change');
                });
            });
        },
        bindings: {
            '.countries': 'value: country_code, options: countries',
            '.states': 'value: state, options: states',
            '.states-wrap': 'classes: {hide: not(equal(country_code, "US"))}',
            '.addresses': 'value: selectedAddress, options: addresses',
            '.zip-code-label': 'text: select(equal(country_code, "US"), _lp_PROFILE_ZIP_CODE, _lp_PROFILE_POSTAL_CODE)',
            '.new-address': 'classes: {hide: hideNewAddress}',
            '.street_1': 'value: street_1, events: ["input"]',
            '.city': 'value: city, events: ["input"]',
            '.zipcode': 'value: zipcode, events: ["input"]'
        },
        bindingSources: {
            // used to trigger update of 'addresses' computed attribute
            customerAddresses: function() {
                return new Backbone.Model();
            }
        },
        computeds: {
            hideNewAddress: function() {
                return this.getBinding('selectedAddress') != newAddress;
            },
            selectedAddress: {
                get: function() {
                    var card = this.getBinding('$card');
                    if (card.get('use_profile_address')) {
                        return profileAddress;
                    } else if (card.get('use_checkout_address')) {
                        return checkoutAddress
                    } else {
                        return newAddress;
                    }
                },
                set: function(value) {
                    var card = this.getBinding('$card');
                    card.set({
                        use_profile_address: value == profileAddress,
                        use_checkout_address: value == checkoutAddress
                    });
                }
            },
            addresses: {
                deps: ['checkout_dining_option', '$customer', 'customer_addresses', 'customer_access_token', '$customerAddresses'],
                get: function(dining_option, customer, customer_addresses) {
                    var shipping_address = customer_addresses.getSelectedAddress(),
                        options = [];
                    if (customer.isAuthorized() && customer_addresses.getDefaultProfileAddress()) {
                        options.push({
                            label: _loc.CARD_PROFILE_ADDRESS,
                            value: profileAddress
                        });
                    }
                    if (shipping_address && shipping_address.get('id') == dining_option && dining_option == 'DINING_OPTION_SHIPPING') {
                        options.push({
                            label: _loc.CARD_SHIPPING_ADDRESS,
                            value: checkoutAddress
                        });
                    }
                    options.push({
                        label: _loc.ENTER_NEW_ADDRESS,
                        value: newAddress
                    });
                    return options;
                }
            },
            countries: function() {
                return sortObj(_loc['COUNTRIES']);
            },
            states: function() {
                return sortObj(_loc['STATES']);
            }
        },
        setDefaultCountry: function() {
            var checkoutAddress = this.options.customer.get('addresses').getCheckoutAddress(),
                storeAddress = App.Settings.address;
            if (_.isObject(checkoutAddress) && checkoutAddress.country) {
                this.model.set('country_code', checkoutAddress.country);
            } else if (_.isObject(storeAddress) && storeAddress.country) {
                this.model.set('country_code', storeAddress.country);
            }
        }
    });

    function sortObj(obj) {
        var sorted = sort_i18nObject(obj),
            result = [];
        for (var key in sorted) {
            result.push({
                label: sorted[key],
                value: key
            });
        }
        return result;
    }

    return new (require('factory'))(card_view.initViews.bind(card_view), function() {
        App.Views.CardView.CardMainView = CardMainView;
        App.Views.CardView.CardBillingAddressView = CardBillingAddressView;
    });
});