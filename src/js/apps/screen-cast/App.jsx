import { useState } from 'react'
import logo from 'ASSETS/images/logo.svg'
import './scss/App.scss'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Screen Cast</h1>
    </div>
  )
}

export default App
