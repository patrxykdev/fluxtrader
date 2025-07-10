// frontend/src/App.tsx
import HomePage from './components/HomePage';
import Profile from './components/Profile'; // Assuming you have a Profile component for logged-in users
import './App.css'; 

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <div className="main-app">
      {token ? <Profile /> : <HomePage />}
    </div>
  );
}

export default App;