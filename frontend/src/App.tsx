import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Link } from 'react-router-dom';

// Временный компонент для главной страницы
const Home = () => <div className="p-4">Главная страница</div>;

function App() {
  return (
    <Provider store={store}>

    <div className='flex flex-row'>

    <div className='max-w-[300px] w-full bg-blue-500 flex flex-col justify-between'>
     <div className='flex flex-col'>
       <div>
        Нуминклатура
       </div>

       <div>
        <ul>
          <li><Link to="/">Главная</Link></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
       </div>
     
     </div>
    </div>

    <div className='w-full'>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>        
    </div>

    </Provider>
  );
}

export default App;
