import { select, settings } from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
    constructor(element) {
      super(element, settings.amountWidget.defaultValue);

      const thisWidget = this;

      // console.log('AmountWidget:', thisWidget);
      // console.log('constructor arguments:', element);

      thisWidget.getElements(element);
      // thisWidget.setValue(thisWidget.input.value || settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }

    getElements() {
      const thisWidget = this;

      thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
      thisWidget.dom.linkeDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
    }

    isValid(value) {
      return !isNaN(value)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax;
    }

    renderValue() {
      const thisWidget = this;

      thisWidget.dom.input.value = thisWidget.value;
    }

    initActions() {
      const thisWidget = this;

      thisWidget.dom.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.dom.input.value)
      });
      thisWidget.dom.linkeDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      })
    }
  }

  export default AmountWidget;