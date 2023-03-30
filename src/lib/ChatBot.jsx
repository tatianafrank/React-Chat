import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Random from 'random-id';
import { CustomStep, OptionsStep, TextStep } from './steps_components';
import schema from './schemas/schema';
import * as storage from './storage';
import {KeysContext, KeysDispatchContext, useKeys, useKeysDispatch } from '../components/KeysContext';

import {
  ChatBotContainer,
  Content,
  Header,
  HeaderTitle,
  HeaderIcon,
  FloatButton,
  FloatingIcon,
  Footer,
  Input,
  SubmitButton
} from './components';
import Recognition from './recognition';
import { ChatIcon, CloseIcon, SubmitIcon, MicIcon } from './icons';
import { isMobile } from './utils';
import { speakFn } from './speechSynthesis';

class ChatBot extends Component {
  /* istanbul ignore next */
  static contextType = KeysDispatchContext;
  constructor(props) {
    super(props);

    this.content = null;
    this.input = null;

    this.supportsScrollBehavior = false;

    this.setContentRef = element => {
      this.content = element;
    };

    this.setInputRef = element => {
      this.input = element;
    };
    

    this.state = {
      renderedSteps: [],
      previousSteps: [],
      currentStep: {},
      previousStep: {},
      steps: {},
      disabled: true,
      opened: props.opened || !props.floating,
      inputValue: '',
      inputInvalid: false,
      speaking: false,
      recognitionEnable: props.recognitionEnable && Recognition.isSupported(),
      defaultUserSettings: {},
      sliderValue: 1,
      contentsObj: {},
      pressedKeys: [],
      intensePrevious: null,
    };

    this.speak = speakFn(props.speechSynthesis);
  }

  componentDidMount() {
    const { steps } = this.props;
    const {
      botDelay,
      botAvatar,
      botName,
      cache,
      cacheName,
      customDelay,
      enableMobileAutoFocus,
      userAvatar,
      userDelay,
      sliderValue,
      contentsObj,
    } = this.props;
    const chatSteps = {};

    const defaultBotSettings = { delay: botDelay, avatar: botAvatar, botName };
    const defaultUserSettings = {
      delay: userDelay,
      avatar: userAvatar,
      hideInput: false,
      hideExtraControl: false
    };
    const defaultCustomSettings = { delay: customDelay };

    for (let i = 0, len = steps.length; i < len; i += 1) {
      const step = steps[i];
      let settings = {};

      if (step.user) {
        settings = defaultUserSettings;
      } else if (step.message || step.asMessage) {
        settings = defaultBotSettings;
      } else if (step.component) {
        settings = defaultCustomSettings;
      }

      chatSteps[step.id] = Object.assign({}, settings, schema.parse(step));
    }

    schema.checkInvalidIds(chatSteps);

    const firstStep = steps[0];

    if (firstStep.message) {
      const { message } = firstStep;
      firstStep.message = typeof message === 'function' ? message() : message;
      chatSteps[firstStep.id].message = firstStep.message;
    }

    const { recognitionEnable } = this.state;
    const { recognitionLang } = this.props;

    if (recognitionEnable) {
      this.recognition = new Recognition(
        this.onRecognitionChange,
        this.onRecognitionEnd,
        this.onRecognitionStop,
        recognitionLang
      );
    }

    this.supportsScrollBehavior = 'scrollBehavior' in document.documentElement.style;

    if (this.content) {
      this.content.addEventListener('DOMNodeInserted', this.onNodeInserted);
      window.addEventListener('resize', this.onResize);
    }

    const { currentStep, previousStep, previousSteps, renderedSteps } = storage.getData(
      {
        cacheName,
        cache,
        firstStep,
        steps: chatSteps
      },
      () => {
        // focus input if last step cached is a user step
        this.setState({ disabled: false }, () => {
          if (enableMobileAutoFocus || !isMobile()) {
            if (this.input) {
              this.input.focus();
            }
          }
        });
      }
    
      );

    this.setState({
      currentStep,
      defaultUserSettings,
      previousStep,
      previousSteps,
      renderedSteps,
      steps: chatSteps,
      sliderValue,
      contentsObj,
    });

    // if currentStep in []
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('click', this.onButtonClick);
    // document.addEventListener('keyup', this.onKeyUp);
  }

  static getDerivedStateFromProps(props, state) {
    const { opened, toggleFloating } = props;
    if (toggleFloating !== undefined && opened !== undefined && opened !== state.opened) {
      return {
        ...state,
        opened
      };
    }
    return state;
  }

  componentWillUnmount() {
    if (this.content) {
      this.content.removeEventListener('DOMNodeInserted', this.onNodeInserted);
      window.removeEventListener('resize', this.onResize);
    }
    document.removeEventListener('keydown', this.onKeyDown);
    // document.removeEventListener('keyup', this.onKeyUp);
  }

  onNodeInserted = event => {
    const { currentTarget: target } = event;
    const { enableSmoothScroll } = this.props;

    if (enableSmoothScroll && this.supportsScrollBehavior) {
      target.scroll({
        top: target.scrollHeight,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      target.scrollTop = target.scrollHeight;
    }
  };

  onResize = () => {
    this.content.scrollTop = this.content.scrollHeight;
  };

  onRecognitionChange = value => {
    this.setState({ inputValue: value });
  };

  onRecognitionEnd = () => {
    this.setState({ speaking: false });
    this.handleSubmitButton();
  };

  onRecognitionStop = () => {
    this.setState({ speaking: false });
  };

  onValueChange = event => {
    this.setState({ inputValue: event.target.value });
  };

  getTriggeredStep = (trigger, value) => {
    const steps = this.generateRenderedStepsById();
    return typeof trigger === 'function' ? trigger({ value, steps }) : trigger;
  };

  getStepMessage = message => {
    const { previousSteps } = this.state;
    const lastStepIndex = previousSteps.length > 0 ? previousSteps.length - 1 : 0;
    const steps = this.generateRenderedStepsById();
    const previousValue = previousSteps[lastStepIndex].value;
    return typeof message === 'function' ? message({ previousValue, steps }) : message;
  };

  generateRenderedStepsById = () => {
    const { previousSteps } = this.state;
    const steps = {};

    for (let i = 0, len = previousSteps.length; i < len; i += 1) {
      const { id, message, value, metadata } = previousSteps[i];

      steps[id] = {
        id,
        message,
        value,
        metadata
      };
    }

    return steps;
  };

  triggerNextStep = data => {
    const { enableMobileAutoFocus } = this.props;
    const { defaultUserSettings, previousSteps, renderedSteps, steps } = this.state;

    let { currentStep, previousStep } = this.state;
    const isEnd = currentStep.end;

    if (data && data.value) {
      currentStep.value = data.value;
    }
    if (data && data.hideInput) {
      currentStep.hideInput = data.hideInput;
    }
    if (data && data.hideExtraControl) {
      currentStep.hideExtraControl = data.hideExtraControl;
    }
    if (data && data.trigger) {
      currentStep.trigger = this.getTriggeredStep(data.trigger, data.value);
    }

    if (isEnd) {
      this.handleEnd();
    } else if (currentStep.options && data && currentStep.options.filter(o => o.value === data.value)[0]) {
      const option = currentStep.options.filter(o => o.value === data.value)[0];
      let trigger = null;
      if(option) {
        trigger = this.getTriggeredStep(option.trigger, currentStep.value);
      } else {
        trigger = this.getTriggeredStep(data.trigger, data.value);
      }

      delete currentStep.options;

      // replace choose option for user message
      currentStep = Object.assign({}, currentStep, option, defaultUserSettings, {
        user: true,
        message: option.label,
        trigger
      });

      renderedSteps.pop();
      previousSteps.pop();
      renderedSteps.push(currentStep);
      previousSteps.push(currentStep);
      
      this.setState({
        currentStep,
        renderedSteps,
        previousSteps
      });
    } else if (currentStep.trigger) {
      if (currentStep.replace) {
        renderedSteps.pop();
      }

      if (data && data.replace) {
        renderedSteps.pop();
      }

      const trigger = this.getTriggeredStep(currentStep.trigger, currentStep.value);
      let nextStep = Object.assign({}, steps[trigger]);

      if (nextStep.message) {
        nextStep.message = this.getStepMessage(nextStep.message);
      } else if (nextStep.update) {
        const updateStep = nextStep;
        nextStep = Object.assign({}, steps[updateStep.update]);

        if (nextStep.options) {
          for (let i = 0, len = nextStep.options.length; i < len; i += 1) {
            nextStep.options[i].trigger = updateStep.trigger;
          }
        } else {
          nextStep.trigger = updateStep.trigger;
        }
      }

      nextStep.key = Random(24);

      previousStep = currentStep;
      currentStep = nextStep;

      this.setState({ renderedSteps, currentStep, previousStep }, () => {
        if (nextStep.user) {
          this.setState({ disabled: false }, () => {
            if (enableMobileAutoFocus || !isMobile()) {
              if (this.input) {
                this.input.focus();
              }
            }
          });
        } else {
          renderedSteps.push(nextStep);
          previousSteps.push(nextStep);

          this.setState({ renderedSteps, previousSteps });
        }
      });
    }

    const { cache, cacheName } = this.props;
    if (cache) {
      setTimeout(() => {
        storage.setData(cacheName, {
          currentStep,
          previousStep,
          previousSteps,
          renderedSteps
        });
      }, 300);
    }
  };

  handleEnd = () => {
    const { handleEnd } = this.props;

    if (handleEnd) {
      const { previousSteps } = this.state;

      const renderedSteps = previousSteps.map(step => {
        const { id, message, value, metadata } = step;

        return {
          id,
          message,
          value,
          metadata
        };
      });

      const steps = [];

      for (let i = 0, len = previousSteps.length; i < len; i += 1) {
        const { id, message, value, metadata } = previousSteps[i];

        steps[id] = {
          id,
          message,
          value,
          metadata
        };
      }

      const values = previousSteps.filter(step => step.value).map(step => step.value);

      handleEnd({ renderedSteps, steps, values });
    }
  };

  isInputValueEmpty = () => {
    const { inputValue } = this.state;
    return !inputValue || inputValue.length === 0;
  };

  isLastPosition = step => {
    const { renderedSteps } = this.state;
    const { length } = renderedSteps;
    const stepIndex = renderedSteps.map(s => s.key).indexOf(step.key);

    if (length <= 1 || stepIndex + 1 === length) {
      return true;
    }

    const nextStep = renderedSteps[stepIndex + 1];
    const hasMessage = nextStep.message || nextStep.asMessage;

    if (!hasMessage) {
      return true;
    }

    const isLast = step.user !== nextStep.user;
    return isLast;
  };

  isFirstPosition = step => {
    const { renderedSteps } = this.state;
    const stepIndex = renderedSteps.map(s => s.key).indexOf(step.key);

    if (stepIndex === 0) {
      return true;
    }

    const lastStep = renderedSteps[stepIndex - 1];
    const hasMessage = lastStep.message || lastStep.asMessage;

    if (!hasMessage) {
      return true;
    }

    const isFirst = step.user !== lastStep.user;
    return isFirst;
  };

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.submitUserMessage();
    }
  };

  onButtonClick = (e) => {
    let { currentStep } = this.state;
    const triggerNext = this.triggerNextStep
    if(e.target.localName == 'button') {
      if(currentStep.id == 'proceed_button_blended_main') {
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
      } 
      if(currentStep.id == 'proceed_button_sustained_main') {
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
      }
      if(currentStep.id == 'proceed_button_mco_b'){
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
      }
      if(currentStep.id == 'proceed_button_blended_outro' 
      || currentStep.id == 'proceed_button_sustained_outro'
      || currentStep.id == 'proceed_button_mco_outro'
      ) {
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
      }
      if(currentStep.id.includes('proceed_button_blended_outro')){
        this.triggerNextStep({
          trigger: 'blended_outro_0',
          replace: true,
        })
      }
  
      if(currentStep.id.includes('proceed_button_aftercare_main')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: true,
        })
      }
      if(currentStep.id.includes('proceed_button_mco_a')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: true,
          skipAftercareButton: false,
        })
      }
    }
   
  }
  onKeyDown = ({key}) => {
    let { pressedKeys, currentStep, previousStep } = this.state;
    const triggerNext = this.triggerNextStep
    if(currentStep.id) {
      if(key=="4"){
        if(currentStep.id == "proceed_button_four") {
          this.triggerNextStep({
            trigger: 'mco_intro_0'
          })
        }
      }
      if(currentStep.id.includes('proceed_button_proceed')){
      // if(previousStep.id.includes('intro1') || previousStep.id.includes('proceed_button_proceed')){
        
        triggerNext({
          trigger: 'proceed_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_intro2')){
      // if(previousStep.id.includes('proceed') || previousStep.id.includes('proceed_button_intro2')){
        this.triggerNextStep({
          trigger: 'intro2_0',
          replace: true,
        })
      }
      // if(currentStep.id.includes('proceed_button_blended_intro')){
      // // if(previousStep.id.includes('intro2') || previousStep.id.includes('proceed_button_blended_intro')){
      //   this.triggerNextStep({
      //     trigger: 'blended_intro_0',
      //     replace: true,
      //   })

      // }
      if(currentStep.id.includes('proceed_button_blended_main')){
      // if(previousStep.id.includes('blended_intro') || previousStep.id.includes('proceed_button_blended_main')){
        
        this.triggerNextStep({
          trigger: 'blended_main_0',
          replace: true,
        })
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: true,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
      }
      if(currentStep.id.includes('proceed_button_blended_outro')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'blended_outro_0',
          replace: true,
        })
        
      }
      // if(currentStep.id.includes('proceed_button_sustained_intro')){
      //   this.triggerNextStep({
      //     trigger: 'sustained_intro_0',
      //     replace: true,
      //   })
  
      // }
      if(currentStep.id.includes('proceed_button_sustained_main')){
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: true,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'sustained_main_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_sustained_outro')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'sustained_outro_0',
          replace: true,
        })
        
      }
      if(currentStep.id.includes('proceed_button_mco_intro')){
        this.triggerNextStep({
          trigger: 'mco_intro_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_mco_a')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: true,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'mco_a_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_mco_b')){
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'mco_b_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_mco_outro')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'mco_outro_0',
          replace: true,
        })
        
      }
      if(currentStep.id.includes('sustained_main_')) {
 
        this.triggerNextStep({
          trigger: 'sustained_outro_0',
          replace: true,
        })
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          // skipSustainedButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        
      }
      if(currentStep.id.includes('mco_a_')){
        this.context({
          type: 'change',
          intenseButton: true,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: false,
        })
        this.triggerNextStep({
          trigger: 'mco_b_0',
          replace: true,
        })
      }
      
      
      if(currentStep.id.includes('proceed_button_aftercare_intro')){
        this.triggerNextStep({
          trigger: 'aftercare_intro_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('proceed_button_aftercare_main')){
        this.context({
          type: 'change',
          intenseButton: false,
          resumeButton: false,
          aftercareButton: false,
          skipMcoButton: false,
          skipAftercareButton: true,
        })
        this.triggerNextStep({
          trigger: 'aftercare_main_0',
          replace: true,
        })
      }
      if(currentStep.id.includes('aftercare_main_')){
        if(key=='3') {
          this.context({
            type: 'change',
            intenseButton: false,
            resumeButton: false,
            aftercareButton: false,
            skipMcoButton: false,
            skipAftercareButton: false,
          })
          this.triggerNextStep({
            trigger: 'aftercare_outro_0',
            replace: true,
          })
        }
      }
      if(key=='z' || key =='Z') {
        if(currentStep.id.includes('blended_main')
        || currentStep.id.includes('sustained_main')
        || currentStep.id.includes('mco_b')
        ){
          this.setState({
            intensePrevious: currentStep.id
          })
          this.context({
            type: 'change',
            intenseButton: false,
            resumeButton: true,
            aftercareButton: true,
            // skipSustainedButton: false,
            skipMcoButton: false,
            skipAftercareButton: false,
          })

          this.triggerNextStep({
            trigger: 'intense_0',
            replace: true,
          })
        }
      }
      if(currentStep.id.includes('intense')){
        if(key=='f' || key =='F') {
          this.triggerNextStep({
            trigger: this.state.intensePrevious,
            replace: true,
          })
          this.context({
            type: 'change',
            intenseButton: true,
            resumeButton: false,
            aftercareButton: false,
            skipMcoButton: false,
            skipAftercareButton: false,
          })
        }
        if(key=='k' || key =='K') {
          this.triggerNextStep({
            trigger: 'aftercare_intro_0',
            replace: true,
          })
          this.context({
            type: 'change',
            intenseButton: false,
            resumeButton: false,
            aftercareButton: false,
            // skipSustainedButton: false,
            skipMcoButton: false,
            skipAftercareButton: false,
          })
        }
      }
    }
    

  }



  handleSubmitButton = () => {
    const { speaking, recognitionEnable } = this.state;

    if ((this.isInputValueEmpty() || speaking) && recognitionEnable) {
      this.recognition.speak();
      if (!speaking) {
        this.setState({ speaking: true });
      }
      return;
    }

    this.submitUserMessage();
  };



  submitUserMessage = () => {
    const { defaultUserSettings, inputValue, previousSteps, renderedSteps } = this.state;
    let { currentStep } = this.state;

    const isInvalid = currentStep.validator && this.checkInvalidInput();

    if (!isInvalid) {
      const step = {
        message: inputValue,
        value: inputValue
      };

      currentStep = Object.assign({}, defaultUserSettings, currentStep, step);

      renderedSteps.push(currentStep);
      previousSteps.push(currentStep);

      this.setState(
        {
          currentStep,
          renderedSteps,
          previousSteps,
          disabled: true,
          inputValue: ''
        },
        () => {
          if (this.input) {
            this.input.blur();
          }
        }
      );
    }
  };

  checkInvalidInput = () => {
    const { enableMobileAutoFocus } = this.props;
    const { currentStep, inputValue } = this.state;
    const result = currentStep.validator(inputValue);
    const value = inputValue;

    if (typeof result !== 'boolean' || !result) {
      this.setState(
        {
          inputValue: result.toString(),
          inputInvalid: true,
          disabled: true
        },
        () => {
          setTimeout(() => {
            this.setState(
              {
                inputValue: value,
                inputInvalid: false,
                disabled: false
              },
              () => {
                if (enableMobileAutoFocus || !isMobile()) {
                  if (this.input) {
                    this.input.focus();
                  }
                }
              }
            );
          }, 2000);
        }
      );

      return true;
    }

    return false;
  };

  toggleChatBot = opened => {
    const { toggleFloating } = this.props;

    if (toggleFloating) {
      toggleFloating({ opened });
    } else {
      this.setState({ opened });
    }
  };

  renderStep = (step, index) => {
    const { renderedSteps } = this.state;
    const {
      avatarStyle,
      bubbleStyle,
      bubbleOptionStyle,
      customStyle,
      hideBotAvatar,
      hideUserAvatar,
      speechSynthesis,
      sliderValue,
      contentsObj,
    } = this.props;
    const { options, component, asMessage, metadata } = step;
    const steps = this.generateRenderedStepsById();
    const previousStep = index > 0 ? renderedSteps[index - 1] : {};

    if (component && !asMessage) {
      return (
        <CustomStep
          key={index}
          speak={this.speak}
          step={step}
          steps={steps}
          style={customStyle}
          previousStep={previousStep}
          previousValue={previousStep.value}
          triggerNextStep={this.triggerNextStep}
        />
      );
    }

    if (options) {
      let triggerDelay = 0;
      if(metadata !== undefined && metadata.timerLength !== undefined) {
        const handleTimer = (ev,timerId) =>{
          clearTimeout(timerId)
          document.removeEventListener(ev.type, handleTimer);
        }
        if(metadata.timerLength === 'short'){
          triggerDelay = 60*1000;
          const timerIdOne = setTimeout(() => {
            this.triggerNextStep({trigger: 'aftercare_intro_0', replace: true})
          }, triggerDelay);
          document.addEventListener('keydown', function(ev){handleTimer(ev,timerIdOne)});
          document.addEventListener('click', function(ev){handleTimer(ev,timerIdOne)});
        }
        if(metadata.timerLength === 'long'){
          triggerDelay = 5*60*1000;
          const timerIdTwo = setTimeout(() => {
            this.triggerNextStep({trigger: metadata.trigger, replace: true})
          }, triggerDelay);
          document.addEventListener('keydown', function(ev){handleTimer(ev,timerIdTwo)});
          document.addEventListener('click', function(ev){handleTimer(ev,timerIdTwo)});
        }
      }
      
      this.context({
        type: 'change',
        intenseButton: false,
        resumeButton: false,
        aftercareButton: false,
        skipMcoButton: false,
        skipAftercareButton: false,
      })
      return (
        <OptionsStep
          key={index}
          step={step}
          previousValue={previousStep.value}
          triggerNextStep={this.triggerNextStep}
          bubbleOptionStyle={bubbleOptionStyle}
        />
      );
    }

    return (
      <TextStep
        key={index}
        step={step}
        steps={steps}
        speak={this.speak}
        previousStep={previousStep}
        previousValue={previousStep.value}
        triggerNextStep={this.triggerNextStep}
        avatarStyle={avatarStyle}
        bubbleStyle={bubbleStyle}
        hideBotAvatar={hideBotAvatar}
        hideUserAvatar={hideUserAvatar}
        speechSynthesis={speechSynthesis}
        isFirst={this.isFirstPosition(step)}
        isLast={this.isLastPosition(step)}
        sliderValue={sliderValue}
        contentsObj={contentsObj}
      />
    );
  };

  render() {
    const {
      currentStep,
      disabled,
      inputInvalid,
      inputValue,
      opened,
      renderedSteps,
      speaking,
      recognitionEnable,
    } = this.state;
    const {
      className,
      contentStyle,
      extraControl,
      controlStyle,
      floating,
      floatingIcon,
      floatingStyle,
      footerStyle,
      headerComponent,
      headerTitle,
      hideHeader,
      hideSubmitButton,
      inputStyle,
      placeholder,
      inputAttributes,
      recognitionPlaceholder,
      style,
      submitButtonStyle,
      width,
      height,
      sliderValue,
    } = this.props;

    const header = headerComponent || (
      <Header className="rsc-header">
        <HeaderTitle className="rsc-header-title">{headerTitle}</HeaderTitle>
        {floating && (
          <HeaderIcon className="rsc-header-close-button" onClick={() => this.toggleChatBot(false)}>
            <CloseIcon />
          </HeaderIcon>
        )}
      </Header>
    );

    let customControl;
    if (extraControl !== undefined) {
      customControl = React.cloneElement(extraControl, {
        disabled,
        speaking,
        invalid: inputInvalid
      });
    }

    const icon =
      (this.isInputValueEmpty() || speaking) && recognitionEnable ? <MicIcon /> : <SubmitIcon />;

    const inputPlaceholder = speaking
      ? recognitionPlaceholder
      : currentStep.placeholder || placeholder;

    const inputAttributesOverride = currentStep.inputAttributes || inputAttributes;

    return (
      <div className={`rsc ${className}`}>
        {floating && (
          <FloatButton
            className="rsc-float-button"
            style={floatingStyle}
            opened={opened}
            onClick={() => this.toggleChatBot(true)}
          >
            {typeof floatingIcon === 'string' ? <FloatingIcon src={floatingIcon} /> : floatingIcon}
          </FloatButton>
        )}
        <ChatBotContainer
          className="rsc-container"
          floating={floating}
          floatingStyle={floatingStyle}
          opened={opened}
          style={style}
          width={width}
          height={height}
        >
          {!hideHeader && header}
          <Content
            className="rsc-content"
            ref={this.setContentRef}
            floating={floating}
            style={contentStyle}
            height={height}
            hideInput={currentStep.hideInput}
          >
            {renderedSteps.map(this.renderStep)}
          </Content>
          <Footer className="rsc-footer" style={footerStyle}>
            {!currentStep.hideInput && (
              <Input
                type="textarea"
                style={inputStyle}
                ref={this.setInputRef}
                className="rsc-input"
                placeholder={inputInvalid ? '' : inputPlaceholder}
                onKeyPress={this.handleKeyPress}
                onChange={this.onValueChange}
                value={inputValue}
                floating={floating}
                invalid={inputInvalid}
                disabled={disabled}
                hasButton={!hideSubmitButton}
                {...inputAttributesOverride}
              />
            )}
            <div style={controlStyle} className="rsc-controls">
              {!currentStep.hideInput && !currentStep.hideExtraControl && customControl}
              {!currentStep.hideInput && !hideSubmitButton && (
                <SubmitButton
                  className="rsc-submit-button"
                  style={submitButtonStyle}
                  onClick={this.handleSubmitButton}
                  invalid={inputInvalid}
                  disabled={disabled}
                  speaking={speaking}
                >
                  {icon}
                </SubmitButton>
              )}
            </div>
          </Footer>
        </ChatBotContainer>
      </div>
    );
  }
}

ChatBot.propTypes = {
  avatarStyle: PropTypes.objectOf(PropTypes.any),
  sliderValue: PropTypes.any,
  botAvatar: PropTypes.string,
  botName: PropTypes.string,
  botDelay: PropTypes.number,
  bubbleOptionStyle: PropTypes.objectOf(PropTypes.any),
  bubbleStyle: PropTypes.objectOf(PropTypes.any),
  cache: PropTypes.bool,
  cacheName: PropTypes.string,
  className: PropTypes.string,
  contentStyle: PropTypes.objectOf(PropTypes.any),
  customDelay: PropTypes.number,
  customStyle: PropTypes.objectOf(PropTypes.any),
  controlStyle: PropTypes.objectOf(PropTypes.any),
  enableMobileAutoFocus: PropTypes.bool,
  enableSmoothScroll: PropTypes.bool,
  extraControl: PropTypes.objectOf(PropTypes.element),
  floating: PropTypes.bool,
  floatingIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  floatingStyle: PropTypes.objectOf(PropTypes.any),
  footerStyle: PropTypes.objectOf(PropTypes.any),
  handleEnd: PropTypes.func,
  headerComponent: PropTypes.element,
  headerTitle: PropTypes.string,
  height: PropTypes.string,
  hideBotAvatar: PropTypes.bool,
  hideHeader: PropTypes.bool,
  hideSubmitButton: PropTypes.bool,
  hideUserAvatar: PropTypes.bool,
  inputAttributes: PropTypes.objectOf(PropTypes.any),
  inputStyle: PropTypes.objectOf(PropTypes.any),
  opened: PropTypes.bool,
  toggleFloating: PropTypes.func,
  placeholder: PropTypes.string,
  recognitionEnable: PropTypes.bool,
  recognitionLang: PropTypes.string,
  recognitionPlaceholder: PropTypes.string,
  speechSynthesis: PropTypes.shape({
    enable: PropTypes.bool,
    lang: PropTypes.string,
    voice:
      typeof window !== 'undefined'
        ? PropTypes.instanceOf(window.SpeechSynthesisVoice)
        : PropTypes.any
  }),
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  style: PropTypes.objectOf(PropTypes.any),
  submitButtonStyle: PropTypes.objectOf(PropTypes.any),
  userAvatar: PropTypes.string,
  userDelay: PropTypes.number,
  width: PropTypes.string
};

ChatBot.defaultProps = {
  avatarStyle: {},
  botDelay: 1000,
  botName: 'The bot',
  bubbleOptionStyle: {},
  bubbleStyle: {},
  cache: false,
  cacheName: 'rsc_cache',
  className: '',
  contentStyle: {},
  customStyle: {},
  controlStyle: { position: 'absolute', right: '0', top: '0' },
  customDelay: 1000,
  enableMobileAutoFocus: false,
  enableSmoothScroll: false,
  extraControl: undefined,
  floating: false,
  floatingIcon: <ChatIcon />,
  floatingStyle: {},
  footerStyle: {},
  handleEnd: undefined,
  headerComponent: undefined,
  headerTitle: 'Chat',
  height: '520px',
  hideBotAvatar: false,
  hideHeader: false,
  hideSubmitButton: false,
  hideUserAvatar: false,
  inputStyle: {},
  opened: undefined,
  placeholder: 'Type the message ...',
  inputAttributes: {},
  recognitionEnable: false,
  recognitionLang: 'en',
  recognitionPlaceholder: 'Listening ...',
  speechSynthesis: {
    enable: false,
    lang: 'en',
    voice: null
  },
  style: {},
  submitButtonStyle: {},
  toggleFloating: undefined,
  userDelay: 1000,
  width: '350px',
  botAvatar:
    "data:image/svg+xml,%3csvg version='1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3e%3cpath d='M303 70a47 47 0 1 0-70 40v84h46v-84c14-8 24-23 24-40z' fill='%2393c7ef'/%3e%3cpath d='M256 23v171h23v-84a47 47 0 0 0-23-87z' fill='%235a8bb0'/%3e%3cpath fill='%2393c7ef' d='M0 240h248v124H0z'/%3e%3cpath fill='%235a8bb0' d='M264 240h248v124H264z'/%3e%3cpath fill='%2393c7ef' d='M186 365h140v124H186z'/%3e%3cpath fill='%235a8bb0' d='M256 365h70v124h-70z'/%3e%3cpath fill='%23cce9f9' d='M47 163h419v279H47z'/%3e%3cpath fill='%2393c7ef' d='M256 163h209v279H256z'/%3e%3cpath d='M194 272a31 31 0 0 1-62 0c0-18 14-32 31-32s31 14 31 32z' fill='%233c5d76'/%3e%3cpath d='M380 272a31 31 0 0 1-62 0c0-18 14-32 31-32s31 14 31 32z' fill='%231e2e3b'/%3e%3cpath d='M186 349a70 70 0 1 0 140 0H186z' fill='%233c5d76'/%3e%3cpath d='M256 349v70c39 0 70-31 70-70h-70z' fill='%231e2e3b'/%3e%3c/svg%3e",
  userAvatar:
    "data:image/svg+xml,%3csvg viewBox='-208.5 21 100 100' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3e%3ccircle cx='-158.5' cy='71' fill='%23F5EEE5' r='50'/%3e%3cdefs%3e%3ccircle cx='-158.5' cy='71' id='a' r='50'/%3e%3c/defs%3e%3cclipPath id='b'%3e%3cuse overflow='visible' xlink:href='%23a'/%3e%3c/clipPath%3e%3cpath clip-path='url(%23b)' d='M-108.5 121v-14s-21.2-4.9-28-6.7c-2.5-.7-7-3.3-7-12V82h-30v6.3c0 8.7-4.5 11.3-7 12-6.8 1.9-28.1 7.3-28.1 6.7v14h100.1z' fill='%23E6C19C'/%3e%3cg clip-path='url(%23b)'%3e%3cdefs%3e%3cpath d='M-108.5 121v-14s-21.2-4.9-28-6.7c-2.5-.7-7-3.3-7-12V82h-30v6.3c0 8.7-4.5 11.3-7 12-6.8 1.9-28.1 7.3-28.1 6.7v14h100.1z' id='c'/%3e%3c/defs%3e%3cclipPath id='d'%3e%3cuse overflow='visible' xlink:href='%23c'/%3e%3c/clipPath%3e%3cpath clip-path='url(%23d)' d='M-158.5 100.1c12.7 0 23-18.6 23-34.4 0-16.2-10.3-24.7-23-24.7s-23 8.5-23 24.7c0 15.8 10.3 34.4 23 34.4z' fill='%23D4B08C'/%3e%3c/g%3e%3cpath d='M-158.5 96c12.7 0 23-16.3 23-31 0-15.1-10.3-23-23-23s-23 7.9-23 23c0 14.7 10.3 31 23 31z' fill='%23F2CEA5'/%3e%3c/svg%3e"
};

export default ChatBot;
