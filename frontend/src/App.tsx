import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Currencies from './pages/Currencies';
import ProtectedRoute from './components/ProtectedRoute';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from './store/slices/authSlice';
import Categories from './pages/Categories';
import CurrencyRates from './pages/CurrencyRates';
import Countries from './pages/Countries';
import Seasonality from './pages/Seasonality';
import Nomenclature from './pages/Nomenclature';

// Временный компонент для главной страницы
const Home = () => <div className="p-4">Главная страница</div>;

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className='flex flex-row'>
      {!isLoginPage && (
        <div className='max-w-[200px] w-full bg-blue-500 flex flex-col justify-between h-screen'>
          <div className='flex flex-col gap-[50px] p-4'>
            <div>
              <span className='text-white font-bold text-[22px]'>Нуминклатура</span>
            </div>
            <div>
              <ul className='space-y-2'>
                <li><Link to="/" className='text-white hover:text-gray-200'>Главная</Link></li>
                <li><Link to="/profile" className='text-white hover:text-gray-200'>Профиль</Link></li>
                <li><Link to="/currencies" className='text-white hover:text-gray-200'>Справочник валют</Link></li>
                <li><Link to="/currency-rates" className='text-white hover:text-gray-200'>Курсы валют</Link></li>
                <li><Link to="/categories" className='text-white hover:text-gray-200'>Справочник категорий</Link></li>
                <li><Link to="/countries" className='text-white hover:text-gray-200'>Справочник стран</Link></li>
                <li><Link to="/seasonality" className='text-white hover:text-gray-200'>Шаблоны сезонности</Link></li>
                <li><Link to="/nomenclature" className='text-white hover:text-gray-200'>Номенклатура</Link></li>
              </ul>
            </div>
          </div>
          <div className='p-4'>
            <button
              onClick={handleLogout}
              className='w-full text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors'
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      <div className='w-full h-screen overflow-y-auto'>
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/currencies"
            element={
              <ProtectedRoute>
                <Currencies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/currency-rates"
            element={
              <ProtectedRoute>
                <CurrencyRates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/countries"
            element={
              <ProtectedRoute>
                <Countries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seasonality"
            element={
              <ProtectedRoute>
                <Seasonality />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nomenclature"
            element={
              <ProtectedRoute>
                <Nomenclature />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>        
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
