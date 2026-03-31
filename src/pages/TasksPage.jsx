import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const COLUMNS = [
  { key: 'todo', label: 'やりたい', color: 'var(--text-sub)' },
  { key: 'inprogress', label: '作業中', color: 'var(--accent-sand)' },
  { key: 'done', label: '完了', color: 'var(--accent-green)' },
];

const NEXT_STATUS = { todo: 'inprogress', inprogress: 'done', done: 'todo' };

function Avatar({ member }) {
  if (!member?.photoURL) return null;
  return (
    <img src={member.photoURL} alt={member.displayName} referrerPolicy="no-referrer"
      style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 }} />
  );
}

function TaskCard({ task, members, onStatusChange, onDelete, onEdit }) {
  const creator = members.find(m => m.uid === task.createdBy);
  const colColor = COLUMNS.find(c => c.key === task.status)?.color || 'var(--text-sub)';

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '10px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <p style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>{task.text}</p>
        <button onClick={() => onDelete(task.id)} style={{ color: 'var(--text-sub)', fontSize: '16px', flexShrink: 0, opacity: 0.6, padding: '2px' }}>✕</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Avatar member={creator} />
          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{creator?.displayName?.split(' ')[0]}</span>
        </div>
        <button
          onClick={() => onStatusChange(task.id, NEXT_STATUS[task.status])}
          style={{
            fontSize: '11px', borderRadius: '20px', padding: '4px 10px',
            border: `1px solid ${colColor}`, color: colColor,
            background: `${colColor}18`,
          }}
        >
          {COLUMNS.find(c => c.key === task.status)?.label} →
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { member } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeCol, setActiveCol] = useState('todo');
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  async function addTask() {
    if (!newText.trim()) return;
    await addDoc(collection(db, 'tasks'), {
      text: newText.trim(),
      status: 'todo',
      createdBy: member.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      order: Date.now(),
      photoURLs: [],
    });
    setNewText('');
    setAdding(false);
  }

  async function changeStatus(id, newStatus) {
    await updateDoc(doc(db, 'tasks', id), { status: newStatus, updatedAt: serverTimestamp() });
  }

  async function deleteTask(id) {
    if (!confirm('このタスクを削除しますか？')) return;
    await deleteDoc(doc(db, 'tasks', id));
  }

  const colTasks = tasks.filter(t => t.status === activeCol);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Column tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', flexShrink: 0 }}>
        {COLUMNS.map(col => {
          const cnt = tasks.filter(t => t.status === col.key).length;
          return (
            <button
              key={col.key}
              onClick={() => setActiveCol(col.key)}
              style={{
                flex: 1, padding: '12px 4px', fontSize: '13px', fontWeight: '500',
                color: activeCol === col.key ? col.color : 'var(--text-sub)',
                borderBottom: activeCol === col.key ? `2px solid ${col.color}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {col.label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {colTasks.length === 0 && (
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', marginTop: '32px', fontSize: '14px' }}>
            タスクなし
          </p>
        )}
        {colTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            onStatusChange={changeStatus}
            onDelete={deleteTask}
          />
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
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>タスクを追加</h3>
            <textarea
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="タスク名を入力..."
              rows={3}
              onKeyDown={e => e.key === 'Enter' && e.metaKey && addTask()}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addTask} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '15px' }}>
                追加
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
