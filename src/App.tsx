import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Calc from './pages/Calc.tsx'
import './App.css'


function App() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}><Link to="/" style={{ textDecoration: 'none' }}>web-tools</Link></h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <NavLink to="/calc">計算</NavLink>
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calc" element={<Calc />} />
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  return (
    <section>
      <h2>メニュー</h2>
      <ul>
        <li><NavLink to="/calc">計算（改行テキストの合計）</NavLink></li>
      </ul>
    </section>
  )
}

export default App
