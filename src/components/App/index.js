import { h, Component } from 'preact';

import Chat from '../Chat';
import ClosedState from '../ClosedState';
import { ThemeProvider } from '../ThemeProvider';
import {
  combineLastMessage,
  createSocket,
} from './functions';

import './styles.css';

const MESSENGER = 'messenger';
const FLOAT = 'float';
const SIDEPANEL = 'side';

class App extends Component {
  state = {
    chatOpen: true,
    messages: [],
    textBox: '',
    theme: MESSENGER, // wrapped with theme provider + HOC
  };

  componentDidMount () {
    this.socket = createSocket(this);
  }

  // Event Handlers

  toggleChat = bool => {
    this.setState({ chatOpen: bool });
  };

  handleInput = e => {
    this.setState({ textBox: e.target.value });
  };

  //  Socket Methods

  /**
  * @description On connecting to the socket server save a session object into the state
  */
  handleNewConnection = e => {
    this.setState({
      session: JSON.parse(e),
    });
  };

  //  Message Methods

  // TODO: docstring
  // save the message to local stage: either combining them or not.
  saveMessageToState = msg => {
    const formattedMsg = this.formatMessage(msg, 'local');

    this.setState({
      messages: combineLastMessage(formattedMsg, this.state.messages),
      textBox: '',
    });
  };

  saveMessageToServer = msg => {
    const formattedMsg = this.formatMessage(msg);

    this.socket.emit('client:message', JSON.stringify(formattedMsg));
  };

  /** Send Message
   * @summary - Allow a user to send a message.
   * @description - Passes the message through some functions to save it locally and remotely
   * @param {object} e - event object; used to prevent refreshing the page
   */
  sendMessage = e => {
    e.preventDefault(); // must be the first thing to happen
    if (this.state.textBox === '') return;
    const msg = this.state.textBox;
    this.saveMessageToState(msg);
    this.saveMessageToServer(msg);
  };

  receiveMessage = data => {
    const msg = JSON.parse(data); // in arr so it can be combined

    this.setState({
      messages: combineLastMessage(msg, this.state.messages),
    });
  };

  /** Format Message
   * @description: Formats a message to a proper object with metadata
   * @param {msg}: takes a plain ol' string that is a chat message
   * @param {destination}: format the message differently based on the destination it's going to.
   * @returns {obj} with timestamp, author data, and content.
   */
  formatMessage = (msg, destination) => {
    const content = destination === 'local' ? [msg] : msg;

    return {
      timestamp: new Date().toISOString(),
      author: `client-${this.state.session.client.id}`,
      content,
      chat: this.state.session.id,
    };
  };

  renderClosedChat = () => (
    <ClosedState
     toggleChat={this.toggleChat}
    />
  );

  renderOpenChat = () => (
    <Chat
      toggleChat={this.toggleChat}
      messages={this.state.messages}
      textBox={this.state.textBox}
      handleInput={this.handleInput}
      sendMessage={this.sendMessage}
    />
  );

  renderChat = () => (this.state.chatOpen ? this.renderOpenChat() : this.renderClosedChat());

  // -- Component Return -- //

  render () {
    const { theme, chatOpen } = this.state;
    const visibility = chatOpen ? 'open' : 'closed';

    return (
      <ThemeProvider theme={this.state.theme}>
        <div className={`mnml--${theme} ${visibility}`}>
          {this.renderChat()}
        </div>
      </ThemeProvider>
    );
  }
}

export default App;