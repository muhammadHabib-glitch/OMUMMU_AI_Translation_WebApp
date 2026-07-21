import {BrowserRouter as Router,
 Routes, Route } from 'react-router-dom'
import './App.css'
import Signup from './components/Signup'
import Login from './components/Login'
import AiAssistant from './components/AiAssistant'
import Translate from './components/Translate'
import Learning from './components/Learning'
import Community from './components/Community'
import History from './components/History'

function App() {
  return (

      <Routes>
        <Route path="/" element={<Translate />} />
        <Route path="/translate" element={<Translate />} />
        <Route path="/assistant" element={<AiAssistant />} />
        <Route path="/learn" element={<Learning />} />
        <Route path="/community" element={<Community />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>

  )
}

export default App














// import { useState } from 'react'

// import './App.css'
// import Signup from './components/Signup'
// import Login from './components/Login'
// import AiAssistant from './components/AiAssistant'
// import Translate from './components/Translate'
// import Learning from './components/Learning'
// import Community from './components/Community'
// import History from './components/History'


// function App() {
//   // const [count, setCount] = useState(0)

//   return (
//     <>
//       <Signup/>
//       <Login />
//       <Translate/>
//       <AiAssistant/>
//       <Learning />
//       <Community />
//       <History />
//     </>
//   )
// }

// export default App
