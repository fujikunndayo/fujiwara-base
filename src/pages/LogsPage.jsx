import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function LogEntry({ log, members, onDelete }) {
  const creator = members.find(m => m.uid === log.createdBy);
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      padding: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--accent-sand)', fontWeight: '500' }}>{log.date}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {creator?.photoURL && (
              <img src={creator.photoURL} alt="" referrerPolicy="no-referrer"
                style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{creator?.displayName?.split(' ')[0]}</span>
          </div>
          <button onClick={() => onDelete(log.id)} style={{ color: 'var(--text-sub)', opacity: 0.5, fontSize: '15px' }}>✕</button>
        </div>
      </div>
      <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{log.text}</p>
    </div>
  );
}

export default function LogsPage() {
  const { member } = useAuth();
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  async function addLog() {
    if (!text.trim()) return;
    await addDoc(collection(db, 'logs'), {
      date,
      text: text.trim(),
      createdBy: member.uid,
      createdAt: serverTimestamp(),
      photoURLs: [],
    });
    setText('');
    setDate(new Date().toISOString().slice(0, 10));
    setAdding(false);
  }

  async function deleteLog(id) {
    if (!confirm('このログを削除しますか？')) return;
    await deleteDoc(doc(db, 'logs', id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {logs.length === 0 && (
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', marginTop: '32px', fontSize: '14px' }}>
            まだ活動ログがありません
          </p>
        )}
        {logs.map(log => (
          <LogEntry key={log.id} log={log} members={members} onDelete={deleteLog} />
        ))}
      </div>

      {/* Add modal */}
      {adding && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }} onClick={e => e.target === e.currentTarget && setAdding(false)}>
          <div style={{
            width: '100%', background: '#242920', borderRadius: '16px 16px 0 0',
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>活動ログを追加</h3>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>日付</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>やったこと</label>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="今日の作業内容を記録..."
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addLog} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '15px' }}>
                保存
              </button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-sub)' }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setAdding(true)}
        style={{
          position: 'fixed', right: '20px', bottom: 'calc(var(--tab-height) + 16px)',
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--accent-sand)', color: '#111',
          fontSize: '28px', fontWeight: '300',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}
      >
        +
      </button>
    </div>
  );
}
