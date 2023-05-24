class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      this.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log('new Product:', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;

      thisProduct.dom = {};

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */
      thisProduct.dom.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.dom.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.dom.accordionTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);
      thisProduct.dom.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
    }

    initAccordion() {
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct !== null & activeProduct != thisProduct.dom.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        /* toggle active class on thisProduct.element */
        thisProduct.dom.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;

      // console.log('initOrderForm()');

      thisProduct.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.dom.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.dom.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);

        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // console.log(optionId, option);

          if (option.hasOwnProperty('default') && !formData[paramId].includes(optionId)) {
            price -= option.price;
          } else if (!option.hasOwnProperty('default') && formData[paramId].includes(optionId)) {
            price += option.price;
          }

          const imageClass = paramId + '-' + optionId;
          const image = thisProduct.dom.imageWrapper.querySelector('img.' + imageClass);

          if (formData[paramId].includes(optionId)) {
            if (image !== null) {
              image.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {
            if (image !== null) {
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      // console.log(price);

      thisProduct.priceSingle = price;

      /* multiply price by amount */
      if (thisProduct.amountWidget?.value !== undefined) {
        price *= thisProduct.amountWidget.value;
      }

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.dom.amountWidgetElem.addEventListener('updated', function () { thisProduct.processOrder() });
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    }

    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      const optionsSummary = {};

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        optionsSummary[paramId] = {};
        optionsSummary[paramId].label = thisProduct.data.params[paramId].label;

        for (let optionId in param.options) {
          const option = param.options[optionId];

          if (formData[paramId].includes(optionId)) {
            optionsSummary[paramId].options = {};
            optionsSummary[paramId].options[optionId] = option.label;
          }
        }
      }

      return optionsSummary;
    }
  }