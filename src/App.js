import './App.css';
import React from 'react';
import Header from './react-components/Header'
import Parser from './react-components/Parser'
import About from './react-components/About'

class App extends React.Component{

  render(){
    return(
      <div>
        <Header />
        <main>
          <Parser />
          <About />
        </main>
      </div>
    )
  }
}

export default App;
