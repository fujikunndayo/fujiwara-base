import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const { user, member, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && member) navigate('/', { replace: true });
  }, [user, member, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌲</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-sand)', letterSpacing: '0.05em' }}>
          FUJIWARA BASE
        </h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '14px' }}>
          秘密基地の進捗管理
        </p>
      </div>

      <button
        onClick={handleLogin}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'white',
          color: '#333',
          borderRadius: '10px',
          padding: '14px 24px',
          fontSize: '15px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          minWidth: '240px',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.8 33.2 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.1-2.7-.1-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36.5 24 36.5c-5.4 0-9.8-3.5-11.4-8.3l-6.5 5C9.8 39.9 16.4 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C40.8 35.1 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        Googleでログイン
      </button>

      <p style={{ color: 'var(--text-sub)', fontSize: '13px', textAlign: 'center', maxWidth: '280px' }}>
        Googleアカウントでログインしてください
      </p>
    </div>
  );
}
