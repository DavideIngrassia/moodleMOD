// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * A javascript module to handler calendar view changes.
 *
 * @module     core_calendar/view_manager
 * @package    core_calendar
 * @copyright  2017 Andrew Nicols <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'core/templates', 'core/notification', 'core_calendar/repository', 'core_calendar/events'],
    function($, Templates, Notification, CalendarRepository, CalendarEvents) {

        var SELECTORS = {
            ROOT: "[data-region='calendar']",
            CALENDAR_NAV_LINK: "span.calendarwrapper .arrow_link",
            CALENDAR_MONTH_WRAPPER: ".calendarwrapper",
        };

        /**
         * Register event listeners for the module.
         *
         * @param {object} root The root element.
         */
        var registerEventListeners = function(root) {
            root = $(root);

            root.on('click', SELECTORS.CALENDAR_NAV_LINK, function(e) {
                var courseId = $(root).find(SELECTORS.CALENDAR_MONTH_WRAPPER).data('courseid');
                var link = $(e.currentTarget);
                changeMonth(link.attr('href'), link.data('time'), courseId);

                e.preventDefault();
            });
        };

        /**
         * Refresh the month content.
         *
         * @param {Number} time The calendar time to be shown
         * @param {Number} courseid The id of the course whose events are shown
         * @return {promise}
         */
        var refreshMonthContent = function(time, courseid) {
            return CalendarRepository.getCalendarMonthData(time, courseid)
                .then(function(context) {
                    return Templates.render('core_calendar/month_detailed', context);
                })
                .then(function(html, js) {
                    return Templates.replaceNode(SELECTORS.CALENDAR_MONTH_WRAPPER, html, js);
                })
                .fail(Notification.exception);
        };

        /**
         * Handle changes to the current calendar view.
         *
         * @param {String} url The calendar url to be shown
         * @param {Number} time The calendar time to be shown
         * @param {Number} courseid The id of the course whose events are shown
         * @return {promise}
         */
        var changeMonth = function(url, time, courseid) {
            return refreshMonthContent(time, courseid)
                .then(function() {
                    window.history.pushState({}, '', url);
                    return arguments;
                })
                .then(function() {
                    $('body').trigger(CalendarEvents.monthChanged, [time, courseid]);
                    return arguments;
                });
        };

        /**
         * Reload the current month view data.
         *
         * @return {promise}
         */
        var reloadCurrentMonth = function() {
            var root = $(SELECTORS.ROOT),
                courseid = root.find(SELECTORS.CALENDAR_MONTH_WRAPPER).data('courseid'),
                time = root.find(SELECTORS.CALENDAR_MONTH_WRAPPER).data('current-time');

            return refreshMonthContent(time, courseid);
        };

        return {
            init: function() {
                registerEventListeners(SELECTORS.ROOT);
            },
            reloadCurrentMonth: reloadCurrentMonth,
            changeMonth: changeMonth,
            refreshMonthContent: refreshMonthContent
        };
    });
