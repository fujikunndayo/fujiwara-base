import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export default function SettingsPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  async function generateInvite() {
    const token = genToken();
    await setDoc(doc(db, 'invites', token), {
      createdBy: member.uid,
      createdAt: serverTimestamp(),
      used: false,
      usedBy: null,
    });
    const url = `${window.location.origin}/invite/${token}`;
    setInviteUrl(url);
    setCopied(false);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* My profile */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {member?.photoURL && (
          <img src={member.photoURL} alt="" referrerPolicy="no-referrer"
            style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--accent-green)' }} />
        )}
        <div>
          <p style={{ fontWeight: '600', fontSize: '16px' }}>{member?.displayName}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>{member?.email}</p>
        </div>
      </div>

      {/* Invite */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '10px', fontWeight: '500' }}>招待リンク</p>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '12px', lineHeight: '1.5' }}>
          友達を招待するリンクを生成します。リンクは1回のみ使用可能です。
        </p>
        <button
          onClick={generateInvite}
          style={{
            width: '100%', background: 'rgba(123,174,110,0.15)', color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)', borderRadius: '10px', padding: '12px',
            fontWeight: '500', fontSize: '14px',
          }}
        >
          招待リンクを生成
        </button>
        {inviteUrl && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)',
              borderRadius: '8px', padding: '10px', fontSize: '13px', color: 'var(--text-sub)',
              wordBreak: 'break-all', marginBottom: '8px',
            }}>
              {inviteUrl}
            </div>
            <button
              onClick={copyInvite}
              style={{
                width: '100%', background: copied ? 'rgba(123,174,110,0.2)' : 'rgba(255,255,255,0.06)',
                color: copied ? 'var(--accent-green)' : 'var(--text)',
                border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px',
                fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
              }}
            >
              {copied ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
        )}
      </div>

      {/* Members list */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '12px', fontWeight: '500' }}>
          メンバー ({members.length}人)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map(m => (
            <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {m.photoURL && (
                <img src={m.photoURL} alt="" referrerPolicy="no-referrer"
                  style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px' }}>{m.displayName}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                  {m.joinedAt?.toDate
                    ? m.joinedAt.toDate().toLocaleDateString('ja-JP')
                    : '参加日不明'}
                  {m.uid === member?.uid && <span style={{ marginLeft: '8px', color: 'var(--accent-green)' }}>（自分）</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', border: '1px solid rgba(224,112,112,0.4)', borderRadius: '12px',
          padding: '14px', color: 'var(--danger)', fontSize: '15px', fontWeight: '500',
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
