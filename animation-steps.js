var Animation = (function() {

    var instance = null;

    function init() {

        if(!instance) {
            instance = new Animation();
        }

        if(arguments.length>0) {
            instance.add.apply(instance, arguments);
        }

        return instance;
    }

    return {init: init};


    function Animation() {

        this.list = [];
        this.interval;
        this.checkTimeInterval = 100;
        this.isStarted = false;

        this.add = function(obj, steps) {
            if(arguments.length==1 && arguments[0].length) {
                var list = Array.prototype.map.call(obj, function(item) {
                    return this.createStep(item);
                }.bind(this));
                this.addToList(list);
            } else if(arguments.length==1 && !arguments[0].length) {
                var step = this.createStep(obj);
                this.addToList([step]);
            } else if(arguments.length==2) {
                var step = this.createStep({
                    el: obj,
                    steps: steps
                });
                this.addToList([step]);
            }
        }

        this.addToList = function(obj) {
        	this.list.push(new AnimateSteps(obj));
        }

        this.createStep = function(obj) {
            obj.styles = window.getComputedStyle(obj.el);
            obj.properties = {};
            obj.index = 0;
            Array.prototype.map.call(obj.styles, function(property) {
              obj.properties[property] = obj.styles[property];
            });
            return obj;
        }

        this.setCheckTimeInterval = function(time) {
            this.checkTimeInterval = time;
        }

        this.start = function() {
            if(this.isStarted) {
                return;
            }

            this.isStarted = true;

         	this.list.map(function(item) {
              if(item.styleElement) {
                item.currentStep.el.classList.add(item.lastClassName);
          		item.currentStep.el.classList.remove(item.stopClassName());
                item.styleElement.remove();
              }
            });
            this.interval = setInterval(function() {
            	var isRunAnimations = false;
                this.list.map(function(item) {

                    var isChangedStyles = item.isChangedStyles();

                    if(isChangedStyles || item.isRun()) {
                       isRunAnimations = true;
                    }

                    if(!isChangedStyles) {
                        if(item.currentStep['onEndStep' + item.currentStep.index]) {
                            item.currentStep['onEndStep' + item.currentStep.index]();
                            item.currentStep['onEndStep' + item.currentStep.index] = null;
                        }
                    }

                    if(item.isRun() && !isChangedStyles) {
                        var step = item.hasSteps() ? item.currentStep : item.nextStep();
                        if(step) {
                            var className = item.getNextClassName();
                            step.el.classList.add(className);
                            item.currentStep.index++;
                            if(item.currentStep['onStartStep' + item.currentStep.index]) {
                                item.currentStep['onStartStep' + item.currentStep.index]();
                                item.currentStep['onStartStep' + item.currentStep.index] = null;
                            }
                        }
                    }
                });

                 if(!isRunAnimations) {
                  this.end();
                }

            }.bind(this), this.checkTimeInterval);
        }

        this.stop = function() {
            clearInterval(this.interval);
            this.isStarted = false;

        	// this.list.map(function(item) {
            // 	item.stop();
            // });
            //console.log('stoped this...', this.isStarted)
        }

        this.end = function() {
            this.stop();
            this.list = [];
        }


    }


    function AnimateSteps(items) {

        var self = this;

        this.lastStyle = {};
        this.lastClassName;
        this.styleElement;
        this.stopClassName = function() {
        	return 'stop-animation-class__' + this.lastClassName;
        };

        this.isRun = function() {
            return this.currentStep.steps.length > 0 || items.length>0;
        }

        this.nextStep = function() {
            while(this.currentStep && this.currentStep.steps.length==0) {
              this.currentStep = items.shift();
              this.lastStyle = {};
            }
            return this.currentStep;
        };

    	this.hasSteps = function() {
        	return this.currentStep.steps.length > 0;
        }

    	this.getNextClassName = function() {
           this.lastClassName = this.currentStep.steps.shift();
        	return this.lastClassName;
        }
        this.stop = function() {
          this.styleElement = document.createElement('style');
          this.styleElement.innerText = '#' + this.currentStep.el.id + '.' + this.stopClassName() + ' {';
          var prop;
          for(prop in this.lastStyle) {
              this.styleElement.innerText = this.styleElement.innerText + prop + ':' + this.lastStyle[prop] + ';';
          }
          this.styleElement.innerText = this.styleElement.innerText + '}';
          document.body.appendChild(this.styleElement);
          this.currentStep.el.classList.add(this.stopClassName());
          this.currentStep.el.classList.remove(this.lastClassName);
          //this.currentStep.steps.push(this.lastClassName);
        }

        this.isChangedStyles = function() {
          var changedStyles = false;
          var block = items[0];
          var property;
          for(property in this.currentStep.properties) {
          	if(this.currentStep.properties[property] !== this.currentStep.styles[property]) {
              this.currentStep.properties[property] = this.currentStep.styles[property];
              this.lastStyle[property] = this.currentStep.styles[property]
              changedStyles = true;
            }
          }

          return changedStyles;
        }

        this.currentStep = items.shift();
        this.lastClassName = this.currentStep.steps.shift();
        this.currentStep.el.classList.add(this.lastClassName);
        this.currentStep.index++;
        if(this.currentStep['onStartStep' + this.currentStep.index]) {
            this.currentStep['onStartStep' + this.currentStep.index]();
            this.currentStep['onStartStep' + this.currentStep.index] = null;
        }
    }

})();
