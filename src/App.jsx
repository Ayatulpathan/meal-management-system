import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MessProvider } from './context/MessContext';
import { MonthProvider } from './context/MonthContext';
import { ChatProvider } from './context/ChatContext';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MessProvider>
          <MonthProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </MonthProvider>
        </MessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
