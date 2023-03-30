

export function chatReducer(fileContents, action) {
    switch (action.type) {
    case 'read_line': {
        return [
            fileContents,
            {
                index: action.index,
                text: fileContents[action.fileName][action.index]['text'],
            },
        ];
    }
      default: {
        throw Error('Unknown action: ' + action.type);
      }
    }
  }
  