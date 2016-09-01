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

define(['products', 'filters'], function() {
    'use strict';

    /**
     * @class
     * @classdesc Represents current category selection.
     * @alias App.Models.CategorySelection
     * @augments Backbone.Model
     * @example
     * // create a category selection model
     * require(['models/category_products'], function() {
     *     var categorySelection = new App.Models.CategorySelection();
     * });
     */
    App.Models.CategorySelection = Backbone.Model.extend(
    /**
     * @lends Backbone.Model.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum
         */
        defaults: {
            /**
             * Current selected sub category.
             * @type {number}
             * @default -1
             */
            subCategory: -1,
            /**
             * Current selected parent category.
             * @type {number}
             * @default -1
             */
            parentCategory: -1,
            /**
             * Saved sub category
             * @type {object}
             * @default null
             */
            subCategorySaved: null
        },
        /**
         * @returns {boolean} `true` is `subCategory` or `parentCategory` doesn't have default values.
         */
        areDefaultAttrs: function() {
            return _.isMatch(this.toJSON(), this.defaults);
        }
    });

    /**
     * @class
     * @classdesc Represents category's products set.
     * @alias App.Models.CategoryProducts
     * @augments Backbone.Model
     * @example
     * // create a category's products model
     * require(['models/category_products'], function() {
     *     var categoryProducts = new App.Models.categoryProducts({id: '1,2,3,4'});
     * });
     */
    App.Models.CategoryProducts = App.Models.ProductsBunch.extend(
    /**
     * @lends Backbone.Model.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum
         */
        defaults: {
            /**
             * Products set's id. It may be category's id or search line.
             * @type {string}
             * @default ''
             */
            id: '',
            /**
             * Products request status ('pending', 'resolved').
             * @type {string}
             * @default 'pending'
             */
            status: 'pending',
            /**
             * Products set's name.
             * @type {string}
             * @default ''
             */
            name: '',
            /**
             * Attributes filters.
             * @type {App.Collections.Filters}
             * @default null
             */
            filters: null
        },
        /**
         * Initializes `products` attribute as new instance of App.Collections.Products and `filters` attribute as new instance of App.Collections.Filters.
         */
        initialize: function() {
            var products = new App.Collections.Products(),
                filters = new App.Collections.Filters();
            this.set('products', products);
            this.set('filters', filters);
            this.listenTo(products, 'reset add remove', this.updateFilters);
        },
        /**
         * Updates `filters` collection depending on `attribute1`, `attribute2` values of products.
         *
         * @param {Backbone.Collection} collection - products collection that provides attributes for filters
         * @param {Object} opts - options
         */
        updateFilters: function(collection, opts) {
            if (_.isObject(opts) && opts.ignoreFilters) {
                return;
            }

            var products = this.get('products'),
                attr1 = products.getAttributeValues(1),
                attr2 = products.getAttributeValues(2),
                filters = this.get('filters'),
                filtersData = [],
                prop, filterItem;

            // process attribute1 values
            for (prop in attr1) {
                filtersData.push({
                    title: prop,
                    optional: true,
                    filterItems: attr1[prop].map(mapFilterItem.bind(window, 'attribute1' + prop)),
                    compare: function(prop, product, filterItem) {
                        product = product.toJSON();
                        return product.attribute_1_enable && product.attribute_1_name === prop
                                && product.attribute_1_values.indexOf(filterItem.get('value')) > -1;
                    }.bind(window, prop)
                });
            }

            // process attribute2 values
            for (prop in attr2) {
                filtersData.push({
                    title: prop,
                    optional: true,
                    filterItems: attr2[prop].map(mapFilterItem.bind(window, 'attribute1' + prop)),
                    compare: function(prop, product, filterItem) {
                        product = product.toJSON();
                        return product.attribute_2_enable && product.attribute_2_name === prop
                            && product.attribute_2_values.indexOf(filterItem.get('value')) > -1;
                    }.bind(window, prop)
                });
            }

            filters.reset();
            filters.setData(filtersData);

            filters.invalid = products.models;
            filters.valid = [];
            filters.applyFilters('invalid')

            function mapFilterItem(uprefix, item) {
                return {
                    value: item,
                    title: item,
                    uid: btoa(uprefix + item)
                };
            }
        },
        /**
         * Predefines order item attributes specified by filters.
         *
         * @param {App.Models.Myorder} orderItem - order item.
         */
        predefineAttributes: function(orderItem) {
            var product = orderItem.get('product'),
                filters = this.get('filters'),
                attr1_predefined = !product.get('attribute_1_enable'),
                attr2_predefined = !product.get('attribute_2_enable'),
                product_atts = product.get_attributes_list(),
                attr_1_all = _.invert(product_atts.attribute_1_all),
                attr_2_all = _.invert(product_atts.attribute_2_all);

            product.isParent() && needToPredefine() && filters.every(function(filter) {
                var name = filter.get('title');
                filter.getSelected().every(function(filterItem) {
                    if (!attr1_predefined && product.get('attribute_1_name') === name && filterItem.get('value') in attr_1_all) {
                        product.set('attribute_1_selected', Number(attr_1_all[filterItem.get('value')]));
                        attr1_predefined = true;
                    }

                    if (!attr2_predefined && product.get('attribute_2_name') === name && filterItem.get('value') in attr_2_all) {
                        product.set('attribute_2_selected', Number(attr_2_all[filterItem.get('value')]));
                        attr2_predefined = true;
                    }

                    return needToPredefine();
                });

                return needToPredefine();
            });

            function needToPredefine() {
                return !attr1_predefined || !attr2_predefined;
            }
        }
    });

    App.Models.CategoryProductsPages = App.Models.CategoryProducts.extend(
    {
        defaults: {
            products_page: null,
        },
        initialize: function() {
            App.Models.CategoryProducts.prototype.initialize.apply(this, arguments);
            this.pageModel = new App.Models.PagesCtrl;
            this.listenTo(this.pageModel, "change:cur_page", this.loadProductsPage, this);
            this.listenTo(this.get('products'), "sort", this.updateProducts, this);
            this.listenTo(this.get('filters'), 'onFiltered', this.onFiltered.bind(this, {flow: 'filtering'}));
            this.set('products_page', new App.Collections.Products);
        },
        updateProducts: function(opt) {
            var page_size = this.pageModel.get('page_size'),
                start_index = (this.pageModel.get('cur_page') - 1) * page_size,
                ignoreFilters = App.Data.categoriesTree.get(this.get('id')) ? true : false; //ignore filtering for root categories selections

            var products = this.getPortion(start_index, page_size, {ignoreFilters: ignoreFilters});

            products = _.map(products, function(product){
                if (product.get('is_combo') || product.get('has_upsell')) {
                    product.set('active', false, {silent: true});
                }
                return product;
            });
            this.get('products_page').reset(products, {ignoreFilters: ignoreFilters});
        },
        loadProductsPage: function() {
            var dfd, self = this;
            var start_index = (this.pageModel.get('cur_page') - 1) * this.pageModel.get('page_size');
            this.set('status', "pending");
            this.pageModel.disableControls();

            dfd = this.get_products({start_index: start_index});
            dfd.always(function() {
                self.onFiltered();
                App.Data.sortItems.sortCollection(self.get('products'));
                self.set('status', "resolved");
                self.pageModel.enableControls();
            });
        },
        onFiltered: function(opt) {
            var is_filtering = _.isObject(opt) ? opt.flow == 'filtering' : false,
                cur_page = this.pageModel.get('cur_page'),
                isFiltersSelected = this.get('filters').isSomeSelected();
            var filtered = this.get('products').filter(function(model){
                return model.get("filterResult") == true;
            });
            this.pageModel.calcPages(isFiltersSelected ? filtered.length : this.get('num_of_products'));
            if (cur_page > this.pageModel.get('page_count')) {
                cur_page = this.pageModel.get('page_count') > 1 ? this.pageModel.get('page_count') : 1;
                this.pageModel.set('cur_page', cur_page);
            }
            is_filtering && this.updateProducts(); //otherwise updateProducts will be called after the collection is sorted
        }
    });

    /**
     * @class
     * @classdesc Represents products sets.
     * @alias App.Collections.ProductsSets
     * @augments Backbone.Collection
     * @example
     * // create a products sets
     * require(['models/category_products'], function() {
     *     var productsSets = new App.Collections.ProductsSets([{id: '1,2,3,4'}, {id: '1'}]);
     * });
     */
    App.Collections.ProductsSets = Backbone.Collection.extend(
    /**
     * @lends Backbone.Collection.prototype
     */
    {
        /**
         * Item's constructor.
         * @type {Function}
         * @default App.Models.CategoryProductsPages
         */
        model: App.Models.CategoryProductsPages
    });
});