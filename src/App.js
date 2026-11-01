import './App.css';
import React from 'react';
import Header from './react-components/Header'
import Parser from './react-components/Parser'
import About from './react-components/About'

class App extends React.Component{
  constructor(){
    super();
    this.state = { termGpas: [] };
  }

  render(){
    return(
      <div>
        <Header />
        <main>
          <Parser onTermGpas={termGpas => this.setState({ termGpas })} />
          <About termGpas={this.state.termGpas} />
        </main>
      </div>
    )
  }
}

export default App;
