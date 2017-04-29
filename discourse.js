/**
 * Fetches forex and Brent crude oil prices for Discourse.scot widget
 */

(function($) {
    $(function() {
        var cfg = {
                base: 'GBP',
                symbols: 'USD,EUR'
            },
            month_friendly = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            brent_crude = {},
            forex = {},
            date = getDate(),
            date_previous;

        /**
         * Converts, e.g., 2017-04-29 to 29 Apr
         * @param {String} date - in format YYYY-MM-DD
         * @returns {String}
         */
        function friendlyDate(date) {
            var d = date.split('-');
            return d[2] + ' ' + month_friendly[d[1] - 1];
        }

        /**
         * Gets date in YYYY-MM-DD format
         * @param {String} date (optional) - e.g. '2017-04-27'
         * @returns {String}
         */
        function getDate(date) { // From http://stackoverflow.com/a/4929629
            var d = date ? new Date(date) : new Date(),
                dd = d.getDate(),
                mm = d.getMonth() + 1, // January is 0!
                yyyy = d.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }

            return yyyy + '-' + mm + '-' + dd;
        }

        /**
         * Formats the change percentage: adds + or - and relevant colour class
         * @param {Number} val
         * @param {Strings} selector
         */
        function formatPCChange(val, selector) {

            if (val > 0) {
                $(selector).text('+' + val + '%').addClass('highlight-green');
            } else if (val < 0) {
                $(selector).text(val + '%').addClass('highlight-red');
            } else if (val === 0) {
                $(selector).text('No change');
            }
        }

        if ($('.discourse-widget').length) {
            /**
             * Forex
             * Alternative 1: https://www.quandl.com/api/v3/datasets/ECB/EURGBP?limit=2
             * Alternative 2a (not as timely as fixer.io): https://www.quandl.com/api/v3/datasets/BOE/XUDLGBD?limit=2 (rate for GBP to USD)
             * Alternative 2b (not as timely as fixer.io): https://www.quandl.com/api/v3/datasets/BOE/XUDLSER?limit=2 (rate for GBP to EUR)
             */

            // Most recent
            $.ajax({
                type: 'GET',
                url: 'https://api.fixer.io/latest' + date,
                data: {
                    base: cfg.base,
                    symbols: cfg.symbols
                },
                dataType: 'json',
                success: function(d) {
                    forex.latest = d;
                    date_previous = new Date(forex.latest.date);
                    date_previous.setDate(date_previous.getDate() - 1);
                    date_previous = getDate(date_previous);

                    // Previous day
                    $.ajax({
                        type: 'GET',
                        url: 'https://api.fixer.io/' + date_previous,
                        data: {
                            base: cfg.base,
                            symbols: cfg.symbols
                        },
                        dataType: 'json',
                        success: function(d) {
                            forex.previous = d;
                            forex.one_day_pc_change = {};

                            $.each(forex.latest.rates, function(k, v) {
                                // 1 day % change
                                forex.one_day_pc_change[k] = (((forex.latest.rates[k] - forex.previous.rates[k]) / forex.previous.rates[k]) * 100).toFixed(2);
                            });

                            $('.ds-forex-date').text(friendlyDate(forex.latest.date) + ' (change from ' + friendlyDate(forex.previous.date) + ')');
                            $('.ds-euro-val').text(forex.latest.rates.EUR);
                            $('.ds-usd-val').text(forex.latest.rates.USD);
                            formatPCChange(forex.one_day_pc_change.EUR, '.ds-euro-chg');
                            formatPCChange(forex.one_day_pc_change.USD, '.ds-usd-chg');
                            $('.ds-forex').addClass('ds-in');
                        },
                        error: function(type, xhr) {
                            console.log(type + ': ' + xhr.responseText);
                        }
                    });
                },
                error: function(type, xhr) {
                    console.log(type + ': ' + xhr.responseText);
                }
            });

            /**
             * Brent crude
             */
            $.ajax({
                type: 'GET',
                url: 'https://www.quandl.com/api/v1/datasets/CHRIS/CME_BZ1.json',
                data: {
                    limit: '2',
                    api_key: '5Vms_cFiREVBAeztLzE1'
                },
                dataType: 'json',
                success: function(d) {
                    var o;

                    // Latest price
                    o = {};
                    o.date = d.data[0][0];
                    o.price_settle = d.data[0][6].toFixed(2);
                    brent_crude.latest = o;

                    // Previous price
                    o = {};
                    o.date = d.data[1][0];
                    o.price_settle = d.data[1][6].toFixed(2);
                    brent_crude.previous = o;

                    // 1 day % change
                    brent_crude.one_day_pc_change = (((brent_crude.latest.price_settle - brent_crude.previous.price_settle) / brent_crude.previous.price_settle) * 100).toFixed(2);

                    $('.ds-brent-date').text(friendlyDate(brent_crude.latest.date) + ' (change from ' + friendlyDate(brent_crude.previous.date) + ')');
                    $('.ds-brent-val').text(brent_crude.latest.price_settle);
                    formatPCChange(brent_crude.one_day_pc_change, '.ds-brent-chg');
                    $('.ds-brent').addClass('ds-in');
                },
                error: function(type, xhr) {
                    console.log(type + ': ' + xhr.responseText);
                }
            });
        }
    });
})(jQuery);
