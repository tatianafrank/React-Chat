import intro1 from '../conversations/intro1.tsv';
import welcome from '../conversations/welcome.tsv';
import intro2 from '../conversations/intro2.tsv';
import proceed from '../conversations/proceed.tsv';
import blended_intro from '../conversations/blended_intro.tsv'
import blended_main from '../conversations/blended_main.tsv'
import blended_outro from '../conversations/blended_outro.tsv'
import sustained_intro from '../conversations/sustained_intro.tsv'
import sustained_main from '../conversations/sustained_main.tsv'
import sustained_outro from '../conversations/sustained_outro.tsv'
import mco_intro from '../conversations/mco_intro.tsv'
import mco_a from '../conversations/mco_a.tsv'
import mco_b from '../conversations/mco_b.tsv'
import mco_outro from '../conversations/mco_outro.tsv'
import aftercare_intro from '../conversations/aftercare_intro.tsv'
import aftercare_main from '../conversations/aftercare_main.tsv'
import aftercare_outro from '../conversations/aftercare_outro.tsv'
import intense from '../conversations/intense.tsv';
import * as d3 from 'd3-fetch';
import SimpleMessage from '../components/SimpleMessage';
import IntenseProceed from '../components/IntenseProceed';
import name_response from '../conversations/name_response.tsv'
import NameResponse from './NameResponse';

/**
 * Some steps are statically defined and the rest are dynamically built by looping through
 * the lines of each conversation file. 
 * Each tab delimited line of a conversation file represents an individual speech 
 * bubble from the bot. 
 */

export const GetSteps = async () => {
    const fileNames = ['welcome','intro1', 'proceed', 'intro2', 
    'blended_intro', 'blended_main', 'blended_outro',
    'sustained_intro', 'sustained_main', 'sustained_outro',
    'mco_intro', 'mco_a', 'mco_b', 'mco_outro',
    'aftercare_intro', 'aftercare_main', 'aftercare_outro',
    'intense'];
    let dataObj = {}
    dataObj['welcome'] = await d3.tsv(welcome);
    dataObj['intro1'] = await d3.tsv(intro1);
    dataObj['proceed'] = await d3.tsv(proceed);
    dataObj['intro2'] = await d3.tsv(intro2); 
    dataObj['blended_intro'] = await d3.tsv(blended_intro);
    dataObj['blended_main'] = await d3.tsv(blended_main);
    dataObj['blended_outro'] = await d3.tsv(blended_outro);
    dataObj['sustained_intro'] = await d3.tsv(sustained_intro);
    dataObj['sustained_main'] = await d3.tsv(sustained_main);
    dataObj['sustained_outro'] = await d3.tsv(sustained_outro);
    dataObj['mco_intro'] = await d3.tsv(mco_intro);
    dataObj['mco_a'] = await d3.tsv(mco_a);
    dataObj['mco_b'] = await d3.tsv(mco_b);
    dataObj['mco_outro'] = await d3.tsv(mco_outro);
    dataObj['aftercare_intro'] = await d3.tsv(aftercare_intro);
    dataObj['aftercare_main'] = await d3.tsv(aftercare_main);
    dataObj['aftercare_outro'] = await d3.tsv(aftercare_outro);
    dataObj['intense'] = await d3.tsv(intense);

    const name_text = await d3.tsv(name_response);
    console.log(['name text', name_text])

    
    let steps = [
      {
      id:'name',
      user: true,
      trigger: 'name_response',
      },
      {
        id: 'name_response',
        component: <NameResponse />,
        metadata: {'text': name_text},
        asMessage: true,
        trigger: 'intro1_0',
      },
      {
        id: 'intense_end',
        component: <IntenseProceed />,
        asMessage: true,
        waitAction: true,
        trigger: 'aftercare_intro_0'
      },
      {
        id: 'proceed_button_proceed',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'proceed_0', },
        ],
      },
      {
        id: 'proceed_button_intro2',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'intro2_0' },
        ],
      },
      {
        id: 'proceed_button_blended_intro',
        options: [
          { value: 1, label: 'Proceed to Blended module', trigger: 'blended_intro_0' },
          { value: 2, label: 'Skip Blended module (not recommended)', trigger: 'proceed_button_sustained_intro' },
        ],
      },
      {
        id: 'proceed_button_blended_main',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'blended_main_0' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'blended_main_0'
        }
      },
      {
        id: 'proceed_button_blended_outro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'blended_outro_0' },
        ],
        metadata:  {
          'timerLength': 'long',
          'trigger': 'blended_outro_0' 
        }
      },
      {
        id: 'proceed_button_sustained_intro',
        options: [
          { value: 1, label: 'Proceed to Sustained', trigger: 'sustained_intro_0' },
          { value: 2, label: 'Skip Sustained (not recommended)', trigger: 'proceed_button_mco_a' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'aftercare_intro_0' 
        }
      },
      {
        id: 'proceed_button_sustained_main',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'sustained_main_0' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'sustained_main_0' 
        }
      },
      {
        id: 'proceed_button_sustained_outro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'sustained_outro_0' },
        ],
        metadata:  {
          'timerLength': 'long',
          'trigger': 'sustained_outro_0' 
        }
      },
      {
        id: 'proceed_button_mco_intro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'mco_intro_0' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'aftercare_intro_0' 
        }
      },
      {
        id: 'proceed_button_mco_a',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'mco_a_0' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'mco_a_0' 
        }
      },
      {
        id: 'proceed_button_mco_b',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'mco_b_0' },
        ],
        metadata:  {
          'timerLength': 'long',
          'trigger': 'mco_b_0' 
        }
      },
      {
        id: 'proceed_button_mco_outro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'mco_outro_0' },
        ],
        metadata:  {
          'timerLength': 'long',
          'trigger': 'mco_outro_0' 
        }
      },
      {
        id: 'proceed_button_aftercare_intro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'aftercare_intro_0' },
        ],
        metadata:  {
          'timerLength': 'short',
          'trigger': 'aftercare_intro_0' 
        }
      },
      {
        id: 'proceed_button_aftercare_main',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'aftercare_main_0' },
        ],
      },
      {
        id: 'proceed_button_aftercare_outro',
        options: [
          { value: true, label: 'Press here to proceed', trigger: 'aftercare_outro_0' },
        ],
      },
      {
        id: 'ending',
        message: 'the end',
        // hideInput: true,
        end: true,
      },
    ]

    let lines = {};
    for(let fi=0; fi<fileNames.length;fi++){
      let fileName = fileNames[fi];
      lines = dataObj[fileName];
      
      for(let li=0; li < lines.length; li++) {
        let id = `${fileName}_${li}`
        let line = lines[li]['text']
        let trigger = `${fileName}_${li+1}`;
        let ending= false;
        if(id=='welcome_0'){
            id='1'
        }
        if(li==(lines.length-1)){
          if (fi<(fileNames.length-1)) {
            trigger = `${fileNames[fi+1]}_0`;
          }
          if(fileName=='welcome'){
            trigger='name'
          }
          if(fileName=='intense'){
            trigger='intense_end'
          }
          if(fileName=='intro1'){
            trigger='proceed_button_proceed'
          }
          if(fileName=='proceed') {
            trigger= 'proceed_button_intro2'
          }
          if(fileName=='intro2') {
            trigger= 'proceed_button_blended_intro'
          }
          if(fileName=='blended_intro') {
            trigger= 'proceed_button_blended_main'
          }
          if(fileName=='blended_main') {
            trigger= 'proceed_button_blended_outro'
          }
          if(fileName=='blended_outro') {
            trigger= 'proceed_button_sustained_intro'
          }
          if(fileName=='sustained_intro') {
            trigger= 'proceed_button_sustained_main'
          }
          if(fileName=='sustained_main') {
            trigger= 'proceed_button_sustained_outro'
          }
          if(fileName=='sustained_outro') {
            trigger= 'proceed_button_mco_intro'
          }
          if(fileName=='mco_intro') {
            trigger= 'proceed_button_mco_a'
          }
          if(fileName=='mco_a') {
            trigger= 'proceed_button_mco_b'
          }
          if(fileName=='mco_b') {
            trigger= 'proceed_button_mco_outro'
          }
          if(fileName=='mco_outro') {
            trigger= 'aftercare_intro_0'
          }
          if(fileName=='aftercare_intro') {
            trigger= 'proceed_button_aftercare_main'
          }
          if(fileName=='aftercare_main') {
            trigger= 'proceed_button_aftercare_outro'
          }
          if(fileName=='aftercare_outro') {
            trigger= 'ending'
            ending=true;
          }
        }

        let step = {
          id: id,
          component: <SimpleMessage />, 
          metadata : {
            'text': `${line}`,
          },
          asMessage: true,
          hideInput: true,
          trigger: trigger,
          end: ending
        }
        if(id=='1') {
            steps.unshift(step)
        } else {
            steps.push(step)
        }
      }
    }
    return steps;
  }