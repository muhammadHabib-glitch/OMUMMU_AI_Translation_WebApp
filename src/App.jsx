import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Signup from './components/Signup'
import Translate from './components/Translate'
import Header from './components/Navbar'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <Signup/> */}
      <Navbar/>
      <Translate/>
    </>
  )
}

export default App
