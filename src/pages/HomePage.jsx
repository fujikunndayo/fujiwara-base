import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const STATUS_OPTIONS = ['計画中', '整備中', 'ほぼ完成', '完成！', 'メンテ中'];
const STATUS_COLORS = {
  '計画中': '#8B9DAF',
  '整備中': '#7BAE6E',
  'ほぼ完成': '#D4A574',
  '完成！': '#7BE6B0',
  'メンテ中': '#e07070',
};

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      padding: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '10px', fontWeight: '500', letterSpacing: '0.05em' }}>
      {children}
    </p>
  );
}

export default function HomePage() {
  const { member } = useAuth();
  const [base, setBase] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingWorkday, setEditingWorkday] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [nextWorkDay, setNextWorkDay] = useState('');
  const [nextWorkNote, setNextWorkNote] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'base', 'main'), snap => {
      if (snap.exists()) setBase(snap.data());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    getDocs(q).then(snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('createdAt', 'desc'), limit(3));
    getDocs(q).then(snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    getDocs(collection(db, 'members')).then(snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
  }, []);

  const todoCnt = tasks.filter(t => t.status === 'todo').length;
  const inProgressCnt = tasks.filter(t => t.status === 'inprogress').length;
  const doneCnt = tasks.filter(t => t.status === 'done').length;
  const totalCnt = tasks.length;
  const progressPct = totalCnt > 0 ? Math.round((doneCnt / totalCnt) * 100) : 0;

  const daysUntil = base?.nextWorkDay
    ? Math.ceil((new Date(base.nextWorkDay) - new Date(new Date().toDateString())) / 86400000)
    : null;

  async function saveStatus() {
    await setDoc(doc(db, 'base', 'main'), {
      ...(base || {}),
      status: selectedStatus,
      statusNote,
      updatedAt: serverTimestamp(),
      updatedBy: member.uid,
    }, { merge: true });
    setEditingStatus(false);
  }

  async function saveWorkday() {
    await setDoc(doc(db, 'base', 'main'), {
      ...(base || {}),
      nextWorkDay,
      nextWorkNote,
      updatedAt: serverTimestamp(),
      updatedBy: member.uid,
    }, { merge: true });
    setEditingWorkday(false);
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ステータスカード */}
      <Card>
        <CardTitle>現在のステータス</CardTitle>
        {!editingStatus ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{
                display: 'inline-block',
                background: STATUS_COLORS[base?.status] ? `${STATUS_COLORS[base?.status]}22` : 'var(--card-border)',
                color: STATUS_COLORS[base?.status] || 'var(--text-sub)',
                border: `1px solid ${STATUS_COLORS[base?.status] || 'var(--card-border)'}`,
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {base?.status || '未設定'}
              </span>
              {base?.statusNote && (
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', marginTop: '6px' }}>{base.statusNote}</p>
              )}
            </div>
            <button onClick={() => {
              setSelectedStatus(base?.status || STATUS_OPTIONS[0]);
              setStatusNote(base?.statusNote || '');
              setEditingStatus(true);
            }} style={{ color: 'var(--accent-sand)', fontSize: '13px', padding: '6px 10px' }}>
              編集
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => setSelectedStatus(s)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '13px',
                  border: `1px solid ${selectedStatus === s ? STATUS_COLORS[s] : 'var(--card-border)'}`,
                  background: selectedStatus === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                  color: selectedStatus === s ? STATUS_COLORS[s] : 'var(--text-sub)',
                }}>
                  {s}
                </button>
              ))}
            </div>
            <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="ひとことメモ（任意）" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveStatus} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '8px', padding: '10px', fontWeight: '500' }}>保存</button>
              <button onClick={() => setEditingStatus(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-sub)' }}>キャンセル</button>
            </div>
          </div>
        )}
      </Card>

      {/* 次の作業日カード */}
      <Card>
        <CardTitle>次の作業日</CardTitle>
        {!editingWorkday ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {base?.nextWorkDay ? (
                <>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-sand)' }}>
                    {new Date(base.nextWorkDay).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '2px' }}>
                    {daysUntil === 0 ? '今日！' : daysUntil > 0 ? `あと ${daysUntil} 日` : `${Math.abs(daysUntil)} 日前`}
                  </p>
                  {base.nextWorkNote && <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>{base.nextWorkNote}</p>}
                </>
              ) : (
                <p style={{ color: 'var(--text-sub)', fontSize: '14px' }}>未定</p>
              )}
            </div>
            <button onClick={() => {
              setNextWorkDay(base?.nextWorkDay || '');
              setNextWorkNote(base?.nextWorkNote || '');
              setEditingWorkday(true);
            }} style={{ color: 'var(--accent-sand)', fontSize: '13px', padding: '6px 10px' }}>
              編集
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="date" value={nextWorkDay} onChange={e => setNextWorkDay(e.target.value)}
              style={{ colorScheme: 'dark' }} />
            <input value={nextWorkNote} onChange={e => setNextWorkNote(e.target.value)} placeholder="予定メモ（任意）" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveWorkday} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '8px', padding: '10px', fontWeight: '500' }}>保存</button>
              <button onClick={() => setEditingWorkday(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-sub)' }}>キャンセル</button>
            </div>
          </div>
        )}
      </Card>

      {/* 進捗カード */}
      <Card>
        <CardTitle>タスク進捗</CardTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '5px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontWeight: '700', color: 'var(--accent-green)', fontSize: '15px', minWidth: '40px', textAlign: 'right' }}>{progressPct}%</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['やりたい', todoCnt, 'var(--text-sub)'], ['作業中', inProgressCnt, 'var(--accent-sand)'], ['完了', doneCnt, 'var(--accent-green)']].map(([label, cnt, color]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color }}>{cnt}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近の活動 */}
      {logs.length > 0 && (
        <Card>
          <CardTitle>最近の活動</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '2px' }}>
                  {log.date}
                </p>
                <p style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {log.text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* メンバー */}
      {members.length > 0 && (
        <Card>
          <CardTitle>メンバー</CardTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {members.map(m => (
              <div key={m.uid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <img
                  src={m.photoURL}
                  alt={m.displayName}
                  referrerPolicy="no-referrer"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--card-border)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-sub)', maxWidth: '60px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.displayName?.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
