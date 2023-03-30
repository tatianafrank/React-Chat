import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Bubble from './common/Bubble';
import Image from './common/Image';
import ImageContainer from './common/ImageContainer';
import Loading from './common/Loading';
import TextStepContainer from './common/TextStepContainer';

class TextStep extends Component {
  state = {
    loading: true
  };

  componentDidMount() {
    const { step, triggerNextStep, text } = this.props;
    const { component, delay, waitAction } = step;
    const isComponentWatingUser = component && waitAction;

    setTimeout(() => {
      this.setState({ loading: false }, () => {
        if (!isComponentWatingUser && !step.rendered) {
          triggerNextStep();
        }
      });
    }, delay);
  }

  getMessage = () => {
    const { text, triggerNextStep, step } = this.props;
    const { message } = step;

    return message ? message.replace(/{text}/g, text) : '';
  };

  renderMessage = () => {
    const { step, steps, previousStep, triggerNextStep } = this.props;
    const { component } = step;

    if (component) {
      return React.cloneElement(component, {
        step,
        steps,
        previousStep,
        triggerNextStep
      });
    }

    return this.getMessage();
  };

  render() {
    const {
      step,
      isFirst,
      isLast,
    } = this.props;
    const { loading } = this.state;
    const { avatar, user, botName } = step;

    const showAvatar = true;

    const imageAltText = user ? "Your avatar" : `${botName}'s avatar`;

    return (
      <TextStepContainer className={`rsc-ts ${user ? 'rsc-ts-user' : 'rsc-ts-bot'}`} user={user}>
        <ImageContainer className="rsc-ts-image-container" user={user}>
          {isFirst && showAvatar && (
            <Image
              className="rsc-ts-image"
              showAvatar={showAvatar}
              user={user}
              src={avatar}
              alt={imageAltText}
            />
          )}
        </ImageContainer>
        <Bubble
          className="rsc-ts-bubble"
          user={user}
          showAvatar={showAvatar}
          isFirst={isFirst}
          isLast={isLast}
        >
          {loading ? <Loading /> : this.renderMessage()}
        </Bubble>
      </TextStepContainer>
    );
  }
}


export default TextStep;