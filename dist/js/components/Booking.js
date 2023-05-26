import { select, templates } from "../settings.js";
import AmountWidget from "./AmountWidget.js";

class Booking {
    constructor(element) {
        this.element = element;

        this.render(this.element);
        this.initWidgets();
    }

    render(element) {
        const generatedHTML = templates.bookingWidget();

        this.dom = {};
        this.dom.wrapper = element;
        this.dom.wrapper.innerHTML = generatedHTML;

        this.dom.peopleAmount = this.dom.wrapper.querySelector(select.booking.peopleAmount);
        this.dom.hoursAmount = this.dom.wrapper.querySelector(select.booking.hoursAmount);
    }

    initWidgets() {
        new AmountWidget(this.dom.peopleAmount);
        new AmountWidget(this.dom.hoursAmount);
    }
}

export default Booking;