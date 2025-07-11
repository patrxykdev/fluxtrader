
import HomePage from './components/homepage/HomePage';
import Dashboard from './components/dashboard/Dashboard'; // Updated import path
import './App.css'; 

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <div className="main-app">
      {token ? <Dashboard /> : <HomePage />}
    </div>
  );
}

export default App;