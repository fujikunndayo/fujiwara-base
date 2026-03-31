import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const provider = new GoogleAuthProvider();

export default function InvitePage() {
  const { token } = useParams();
  const { user, member, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | valid | invalid | used | joining

  useEffect(() => {
    checkInvite();
  }, [token]);

  useEffect(() => {
    if (!loading && user && member) {
      navigate('/', { replace: true });
    }
    if (!loading && user && !member && status === 'valid') {
      joinAsMember();
    }
  }, [user, member, loading, status]);

  async function checkInvite() {
    try {
      const snap = await getDoc(doc(db, 'invites', token));
      if (!snap.exists()) { setStatus('invalid'); return; }
      if (snap.data().used) { setStatus('used'); return; }
      setStatus('valid');
    } catch {
      setStatus('invalid');
    }
  }

  async function joinAsMember() {
    if (!user) return;
    setStatus('joining');
    try {
      const inviteSnap = await getDoc(doc(db, 'invites', token));
      if (!inviteSnap.exists() || inviteSnap.data().used) {
        setStatus('used');
        return;
      }
      await setDoc(doc(db, 'members', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        joinedAt: serverTimestamp(),
        invitedBy: inviteSnap.data().createdBy,
      });
      await updateDoc(doc(db, 'invites', token), {
        used: true,
        usedBy: user.uid,
      });
      navigate('/', { replace: true });
    } catch (e) {
      console.error(e);
      setStatus('invalid');
    }
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || status === 'loading' || status === 'joining') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
        {status === 'joining' ? 'メンバー登録中...' : '確認中...'}
      </div>
    );
  }

  if (status === 'invalid' || status === 'used') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px' }}>
        <div style={{ fontSize: '40px' }}>🔒</div>
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>
          {status === 'used' ? 'この招待リンクはすでに使用済みです。' : '招待リンクが無効です。'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌲</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-sand)' }}>FUJIWARA BASE</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '8px' }}>招待されました！Googleでログインして参加する</p>
      </div>
      <button
        onClick={handleLogin}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'white', color: '#333', borderRadius: '10px',
          padding: '14px 24px', fontSize: '15px', fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)', minWidth: '240px', justifyContent: 'center',
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
    </div>
  );
}
