import { useEffect, useState } from 'react';
import {
  doc, onSnapshot, setDoc, addDoc, deleteDoc,
  serverTimestamp, collection, query, orderBy, getDocs, updateDoc,
} from 'firebase/firestore';
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

const ATTEND = {
  yes:   { label: '○ 参加', color: '#7BE6B0' },
  maybe: { label: '△ 未定', color: '#D4A574' },
  no:    { label: '× 難しい', color: '#e07070' },
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

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-block',
      background: color ? `${color}22` : 'var(--card-border)',
      color: color || 'var(--text-sub)',
      border: `1px solid ${color || 'var(--card-border)'}`,
      borderRadius: '20px',
      padding: '4px 12px',
      fontSize: '13px',
      fontWeight: '500',
    }}>
      {status || '未設定'}
    </span>
  );
}

function ProjectCard({ project, member, members }) {
  const [editing, setEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [goal, setGoal] = useState('');

  function startEdit() {
    setSelectedStatus(project.status || STATUS_OPTIONS[0]);
    setStatusNote(project.statusNote || '');
    setGoal(project.goal || '');
    setEditing(true);
  }

  async function save() {
    await setDoc(doc(db, 'projects', project.id), {
      name: project.name,
      status: selectedStatus,
      statusNote,
      goal,
      updatedAt: serverTimestamp(),
      updatedBy: member.uid,
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`「${project.name}」を削除しますか？`)) return;
    await deleteDoc(doc(db, 'projects', project.id));
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontWeight: '600', fontSize: '15px' }}>{project.name}</p>
        <div style={{ display: 'flex', gap: '4px' }}>
          {!editing && (
            <>
              <button onClick={startEdit} style={{ color: 'var(--accent-sand)', fontSize: '13px', padding: '4px 8px' }}>編集</button>
              <button onClick={handleDelete} style={{ color: 'var(--text-sub)', fontSize: '13px', padding: '4px 8px', opacity: 0.6 }}>削除</button>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <div>
          <StatusBadge status={project.status} />
          {project.goal && (
            <p style={{ color: 'var(--text-sub)', fontSize: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--card-border)' }}>
              🎯 {project.goal}
            </p>
          )}
          {project.statusNote && (
            <p style={{ color: 'var(--text-sub)', fontSize: '13px', marginTop: '6px' }}>{project.statusNote}</p>
          )}
          {project.updatedBy && (() => {
            const updater = members.find(m => m.uid === project.updatedBy);
            return updater ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--card-border)' }}>
                {updater.photoURL && (
                  <img src={updater.photoURL} alt="" referrerPolicy="no-referrer"
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                  {updater.displayName?.split(' ')[0]} が更新
                </span>
              </div>
            ) : null;
          })()}
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
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="最終目標（例：10ヤード打てる練習場にする）" />
          <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="ひとことメモ（任意）" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '8px', padding: '10px', fontWeight: '500' }}>保存</button>
            <button onClick={() => setEditing(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-sub)' }}>キャンセル</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function WorkdayCard({ workday, member, members }) {
  const daysUntil = Math.ceil(
    (new Date(workday.date) - new Date(new Date().toDateString())) / 86400000
  );
  const attendance = workday.attendance || {};
  const myStatus = attendance[member.uid];

  async function setAttend(status) {
    await updateDoc(doc(db, 'workdays', workday.id), {
      [`attendance.${member.uid}`]: status,
    });
  }

  async function handleDelete() {
    if (!confirm('この作業日を削除しますか？')) return;
    await deleteDoc(doc(db, 'workdays', workday.id));
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-sand)' }}>
            {new Date(workday.date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px' }}>
            {daysUntil === 0 ? '今日！' : daysUntil > 0 ? `あと ${daysUntil} 日` : `${Math.abs(daysUntil)} 日前`}
          </p>
          {workday.note && <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>{workday.note}</p>}
        </div>
        <button onClick={handleDelete} style={{ color: 'var(--text-sub)', fontSize: '16px', opacity: 0.5, padding: '2px 6px' }}>✕</button>
      </div>

      {/* 自分の参加状況 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {Object.entries(ATTEND).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setAttend(key)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
              border: `1px solid ${myStatus === key ? color : 'var(--card-border)'}`,
              background: myStatus === key ? `${color}22` : 'transparent',
              color: myStatus === key ? color : 'var(--text-sub)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* メンバーの参加状況 */}
      {members.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {members.map(m => {
            const s = attendance[m.uid];
            const a = ATTEND[s];
            return (
              <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {m.photoURL && (
                  <img src={m.photoURL} alt={m.displayName} referrerPolicy="no-referrer"
                    style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${a?.color || 'var(--card-border)'}` }} />
                )}
                <span style={{ fontSize: '11px', color: a?.color || 'var(--text-sub)' }}>
                  {m.displayName?.split(' ')[0]}
                  {a ? ` ${a.label.split(' ')[0]}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function HomePage() {
  const { member } = useAuth();
  const [projects, setProjects] = useState([]);
  const [workdays, setWorkdays] = useState([]);
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [addingWorkday, setAddingWorkday] = useState(false);
  const [newWorkDate, setNewWorkDate] = useState('');
  const [newWorkNote, setNewWorkNote] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('name'));
    return onSnapshot(q, snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'workdays'), orderBy('date'));
    return onSnapshot(q, snap => setWorkdays(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('createdAt', 'desc'));
    getDocs(q).then(snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3)));
  }, []);

  useEffect(() => {
    getDocs(collection(db, 'members')).then(snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
  }, []);

  async function addProject() {
    const name = newProjectName.trim();
    if (!name) return;
    await addDoc(collection(db, 'projects'), {
      name,
      status: '計画中',
      statusNote: '',
      goal: '',
      updatedAt: serverTimestamp(),
      updatedBy: member.uid,
    });
    setNewProjectName('');
    setAddingProject(false);
  }

  async function addWorkday() {
    if (!newWorkDate) return;
    await addDoc(collection(db, 'workdays'), {
      date: newWorkDate,
      note: newWorkNote.trim(),
      attendance: {},
      createdAt: serverTimestamp(),
      createdBy: member.uid,
    });
    setNewWorkDate('');
    setNewWorkNote('');
    setAddingWorkday(false);
  }

  // 過去の作業日は非表示
  const upcomingWorkdays = workdays.filter(w => {
    const d = Math.ceil((new Date(w.date) - new Date(new Date().toDateString())) / 86400000);
    return d >= 0;
  });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* エリア進捗 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: '500', letterSpacing: '0.05em' }}>エリア進捗</p>
          <button onClick={() => setAddingProject(true)} style={{ color: 'var(--accent-sand)', fontSize: '13px', padding: '4px 8px' }}>
            ＋ エリアを追加
          </button>
        </div>
        {projects.length === 0 && (
          <Card><p style={{ color: 'var(--text-sub)', fontSize: '14px', textAlign: 'center' }}>エリアがまだありません</p></Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} member={member} members={members} />
          ))}
        </div>
      </div>

      {/* 作業日 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: '500', letterSpacing: '0.05em' }}>作業日</p>
          <button onClick={() => setAddingWorkday(true)} style={{ color: 'var(--accent-sand)', fontSize: '13px', padding: '4px 8px' }}>
            ＋ 作業日を追加
          </button>
        </div>
        {upcomingWorkdays.length === 0 && (
          <Card><p style={{ color: 'var(--text-sub)', fontSize: '14px', textAlign: 'center' }}>予定なし</p></Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingWorkdays.map(w => (
            <WorkdayCard key={w.id} workday={w} member={member} members={members} />
          ))}
        </div>
      </div>

      {/* 最近の活動 */}
      {logs.length > 0 && (
        <Card>
          <CardTitle>最近の活動</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map(log => {
              const logCreator = members.find(m => m.uid === log.createdBy);
              return (
                <div key={log.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{log.date}</p>
                    {logCreator && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {logCreator.photoURL && (
                          <img src={logCreator.photoURL} alt="" referrerPolicy="no-referrer"
                            style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                          {logCreator.displayName?.split(' ')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {log.text}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* メンバー */}
      {members.length > 0 && (
        <Card>
          <CardTitle>メンバー</CardTitle>
          <div style={{ display: 'flex', flewWrap: 'wrap', gap: '12px' }}>
            {members.map(m => (
              <div key={m.uid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {m.photoURL && (
                  <img src={m.photoURL} alt={m.displayName} referrerPolicy="no-referrer"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--card-border)' }} />
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-sub)', maxWidth: '60px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.displayName?.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* end of main */}
      {addingProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setAddingProject(false)}>
          <div style={{ width: '100%', background: '#242920', borderRadius: '16px 16px 0 0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>エリアを追加</h3>
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProject()} placeholder="例：オプローチ絰紒場、席、狩绮..." />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addProject} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '15px' }}>追加</button>
              <button onClick={() => setAddingProject(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-sub)' }}>カャンセル</button>
            </div>
          </div>
        </div>
      )}

      {addingWorkday && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setAddingWorkday(false)}>
          <div style={{ width: '100%', background: '#242920', borderRadius: '16px 16px 0 0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>作業日を追加</h3>
            <input autoFocus type="date" value={newWorkDate} onChange={e => setNewWorkDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            <input value={newWorkNote} onChange={e => setNewWorkNote(e.target.value)} placeholder="メア（任意）" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addWorkday} style={{ flex: 1, background: 'var(--accent-green)', color: '#111', borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '15px' }}>追加</button>
              <button onClick={() => setAddingWorkday(false)} style={{ flex: 1, border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', color: 'var(--text-sub)' }}>カャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
