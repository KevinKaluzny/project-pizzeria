import { select, templates, settings, classNames } from "../settings.js";
import { utils } from '../utils.js';
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";

class Booking {
    constructor(element) {
        this.element = element;
        this.selectedTable = 0;
        this.starters = [];

        this.render(this.element);
        this.initWidgets();
        this.getData();
        this.initActions();
    }

    getData() {
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(this.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(this.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('getData params', params);

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking
                + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.event
                + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.event
                + '?' + params.eventsRepeat.join('&'),
        };

        // console.log('getData urls', urls);

        const thisBooking = this;

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ]).then(function (allResponses) {
            const bookingsResponse = allResponses[0];
            const eventsCurrentResponse = allResponses[1];
            const eventsRepeatResponse = allResponses[2];
            return Promise.all([
                bookingsResponse.json(),
                eventsCurrentResponse.json(),
                eventsRepeatResponse.json(),
            ]);
        }).then(function ([bookings, eventsCurrent, eventsRepeat]) {
            // console.log(bookings);
            // console.log(eventsCurrent);
            // console.log(eventsRepeat);
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        this.booked = {};

        for (let item of bookings) {
            this.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of eventsCurrent) {
            this.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = this.datePicker.minDate;
        const maxDate = this.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if(item.repeat == 'daily') {
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    this.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        // console.log('this.booked', this.booked);

        this.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        if (typeof this.booked[date] == 'undefined') {
            this.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            // console.log('loop', hourBlock);

            if (typeof this.booked[date][hourBlock] == 'undefined') {
                this.booked[date][hourBlock] = [];
            }

            this.booked[date][hourBlock].push(table);
        }

        console.log(this.booked[date]);
    }

    updateDOM() {
        this.date = this.datePicker.value;
        this.hour = utils.hourToNumber(this.hourPicker.value);

        let allAvailable = false;

        if (
            typeof this.booked[this.date] == 'undefined'
            ||
            typeof this.booked[this.date][this.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of this.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }

            if (
                !allAvailable
                &&
                this.booked[this.date][this.hour].includes(tableId)
            )  {
                console.log(table);
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }

        for (let table of this.dom.tables) {
            table.classList.remove(classNames.booking.tableClicked);
        }
    }

    render(element) {
        const generatedHTML = templates.bookingWidget();

        this.dom = {};
        this.dom.wrapper = element;
        this.dom.wrapper.innerHTML = generatedHTML;

        this.dom.peopleAmount = this.dom.wrapper.querySelector(select.booking.peopleAmount);
        this.dom.hoursAmount = this.dom.wrapper.querySelector(select.booking.hoursAmount);
        this.dom.datePicker = this.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        this.dom.hourPicker = this.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    
        this.dom.tables = this.dom.wrapper.querySelectorAll(select.booking.tables);
        this.dom.floorPlan = this.dom.wrapper.querySelector(select.booking.floorPlan);

        this.dom.formSubmit = this.dom.wrapper.querySelector(select.booking.formSubmit);
        this.dom.phone = this.dom.wrapper.querySelector(select.booking.phone);
        this.dom.address = this.dom.wrapper.querySelector(select.booking.address);
        this.dom.checkboxes = this.dom.wrapper.querySelector(select.booking.checkboxes);
    }

    initWidgets() {
        this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
        this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
        this.datePicker = new DatePicker(this.dom.datePicker);
        this.hourPicker = new HourPicker(this.dom.hourPicker);

        const thisBooking = this;

        this.dom.wrapper.addEventListener('updated', function() {
            thisBooking.updateDOM();
        });
    }

    initActions() {
        const thisBooking = this;

        this.dom.floorPlan.addEventListener('click', function(event) {
            event.preventDefault();
            const clickedElem = event.target;
            const selectedTable = document.querySelector(select.booking.selectedTable);

            if (!clickedElem.classList.contains(select.booking.tableBooked)) {
                clickedElem.classList.toggle(classNames.booking.tableClicked);
                if (selectedTable !== null && clickedElem !== selectedTable) {
                    selectedTable.classList.remove(classNames.booking.tableClicked);
                }
                thisBooking.selectedTable = clickedElem.getAttribute(settings.booking.tableIdAttribute);
            }
        });
        this.dom.formSubmit.addEventListener('click', function(event) {
            event.preventDefault();
            thisBooking.sendBooking();
        });
        this.dom.checkboxes.addEventListener('change', function (event) {
          const clickedElem = event.target;
    
          if (clickedElem.tagName == 'INPUT' && clickedElem.getAttribute('type') && clickedElem.getAttribute('name')) {
            const value = clickedElem.getAttribute('value');
    
            if (clickedElem.checked == true) {
              thisBooking.starters.push(value);
            } else {
              const indexOf = thisBooking.starters.indexOf(value);
              thisBooking.starters.splice(indexOf, 1);
            }
          }
          
          console.log(thisBooking.starters);
        });
    }

    sendBooking() {
        const url = settings.db.url + '/' + settings.db.booking;

        const payload = {
            "date": this.datePicker.value,
            "hour": this.hourPicker.value,
            "table": this.selectedTable,
            "duration": this.hoursAmount.value,
            "ppl": this.peopleAmount.value,
            "starters": this.starters,
            "phone": this.dom.phone.value,
            "address": this.dom.address.value,
        };
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
        
        fetch(url, options)
            .then(rawResponse => rawResponse.json())
            .then(parsedResponse => {
                console.log(parsedResponse)
            });

        this.makeBooked(this.datePicker.value, this.hourPicker.value, this.hoursAmount.value, parseInt(this.selectedTable));
        this.updateDOM();
    }
}

export default Booking;