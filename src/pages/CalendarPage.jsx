import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { member } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [workdays, setWorkdays] = useState({});
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'workdays'), snap => {
      const obj = {};
      snap.docs.forEach(d => { obj[d.id] = d.data(); });
      setWorkdays(obj);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getDocs(collection(db, 'logs')).then(snap =>
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const nextWorkDay = Object.keys(workdays).sort().find(d => d >= today.toISOString().slice(0, 10));
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  async function saveWorkday(dateStr) {
    await setDoc(doc(db, 'workdays', dateStr), {
      note,
      createdBy: member.uid,
      createdAt: serverTimestamp(),
    }, { merge: true });
    setAdding(false);
    setNote('');
  }

  async function removeWorkday(dateStr) {
    if (!confirm('この作業日を削除しますか？')) return;
    await deleteDoc(doc(db, 'workdays', dateStr));
    setSelected(null);
  }

  const selectedStr = selected
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`
    : null;
  const selectedLogs = logs.filter(l => l.date === selectedStr);
  const isWorkday = selectedStr && workdays[selectedStr];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => {
          if (month === 0) { setMonth(11); setYear(y => y - 1); }
          else setMonth(m => m - 1);
        }} style={{ fontSize: '22px', padding: '6px 12px', color: 'var(--text-sub)' }}>‹</button>
        <span style={{ fontWeight: '700', fontSize: '16px' }}>{year}年 {month + 1}月</span>
        <button onClick={() => {
          if (month === 11) { setMonth(0); setYear(y => y + 1); }
          else setMonth(m => m + 1);
        }} style={{ fontSize: '22px', padding: '6px 12px', color: 'var(--text-sub)' }}>›</button>
      </div>

      {/* Calendar grid */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: i === 0 ? '#e07070' : i === 6 ? '#7BAE6E' : 'var(--text-sub)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const isNext = dateStr === nextWorkDay;
            const hasWork = !!workdays[dateStr];
            const hasLog = logs.some(l => l.date === dateStr);
            const isSel = selected === day;
            const dow = (firstDay + i) % 7;

            return (
              <button
                key={day}
                onClick={() => setSelected(selected === day ? null : day)}
                style={{
                  aspectRatio: '1', borderRadius: '8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '2px',
                  background: isSel ? 'rgba(123,174,110,0.2)' : isNext ? 'rgba(212,165,116,0.15)' : 'transparent',
                  border: isToday ? '1px solid var(--accent-green)' : isNext ? '1px solid var(--accent-sand)' : '1px solid transparent',
                  color: dow === 0 ? '#e07070' : dow === 6 ? '#7BAE6E' : 'var(--text)',
                  fontSize: '14px',
                  transition: 'all 0.1s',
                }}
              >
                <span>{day}</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {hasWork && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-green)' }} />}
                  {hasLog && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-sand)' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {[['var(--accent-green)', '作業日'], ['var(--accent-sand)', '活動ログあり']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selected && selectedStr && (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600' }}>
              {month + 1}月{selected}日
              {selectedStr === nextWorkDay && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--accent-sand)' }}>次の作業日</span>}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isWorkday ? (
                <button onClick={() => setAdding(true)} style={{ fontSize: '12px', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: '6px', padding: '4px 10px' }}>
                  作業日に追加
                </button>
              ) : (
                <button onClick={() => removeWorkday(selectedStr)} style={{ fontSize: '12px', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px', padding: '4px 10px' }}>
                  作業日を削除
                </button>
              )}
            </div>
          </div>
          {isWorkday && workdays[selectedStr].note && (
            <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>{workdays[selectedStr].note}</p>
          )}
          {selectedLogs.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '6px' }}>活動ログ</p>
              {selectedLogs.map(log => (
                <p key={log.id} style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '4px' }}>{log.text}</p>
              ))}
            </div>
          )}
          {!isWorkday && selectedLogs.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>この日の記録はありません</p>
          )}
        </div>
      )}

      {/* Add workday note modal */}
      {adding && selectedStr && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }} onClick={e => e.target === e.currentTarget && setAdding(false)}>
          <div style={{
            width: '100%', background: '#242920', borderRadius: '16px 16px 0 0',
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{month + 1}月{selected}日 を作業日に追加</h3>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="予定メモ（任意）" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => saveWorkday(selectedStr)} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '10px', padding: '12px', fontWeight: '600' }}>
                追加
              </button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-sub)' }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
