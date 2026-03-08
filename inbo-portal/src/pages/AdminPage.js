import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', company: '', role: 'client' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/stats')])
      .then(([u, s]) => { setUsers(u); setAdminStats(s); })
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (id, changes) => {
    await api.patch(`/admin/users/${id}`, changes);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
    setEditUser(null);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addUser = async () => {
    setAddError('');
    try {
      await api.post('/admin/users', newUser);
      const updated = await api.get('/admin/users');
      setUsers(updated);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', fullName: '', company: '', role: 'client' });
    } catch (err) {
      setAddError(err.message);
    }
  };

  return (
    <Layout title="Admin Panel">
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total users', value: adminStats.totalUsers },
          { label: 'Gmail connected', value: adminStats.gmailConnected },
          { label: 'Total emails', value: adminStats.totalEmails },
          { label: 'New today', value: adminStats.newToday },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value amber">{s.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">Users</div>
            <div className="section-subtitle">{users.length} total accounts</div>
          </div>
          <button className="btn-sm amber" onClick={() => setShowAddModal(true)}>+ Add user</button>
        </div>

        {loading
          ? <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Plan</th>
                    <th>Gmail</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.company || '—'}</td>
                      <td><span className={`status-pill ${u.plan}`}>{u.plan}</span></td>
                      <td><span className={`status-pill ${u.gmail_connected ? 'connected' : 'not-connected'}`}>{u.gmail_connected ? 'Yes' : 'No'}</span></td>
                      <td><span className={`status-pill ${u.suspended ? 'suspended' : 'active'}`}>{u.suspended ? 'Suspended' : 'Active'}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-sm ghost" onClick={() => setEditUser(u)}>Edit</button>
                          <button className="btn-sm danger" onClick={() => deleteUser(u.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit user</div>
            <div className="modal-sub">{editUser.full_name} — {editUser.email}</div>
            <div className="form-group">
              <label>Plan</label>
              <select value={editUser.plan} onChange={e => setEditUser(u => ({ ...u, plan: e.target.value }))}>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={editUser.role} onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editUser.suspended ? 'suspended' : 'active'} onChange={e => setEditUser(u => ({ ...u, suspended: e.target.value === 'suspended' ? 1 : 0 }))}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-sm ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn-sm amber" onClick={() => updateUser(editUser.id, { plan: editUser.plan, role: editUser.role, suspended: editUser.suspended })}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add user</div>
            <div className="modal-sub">Create a new account manually</div>
            {addError && <div className="error-banner">{addError}</div>}
            <div className="form-group">
              <label>Full name</label>
              <input value={newUser.fullName} onChange={e => setNewUser(u => ({ ...u, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Company</label>
                <input value={newUser.company} onChange={e => setNewUser(u => ({ ...u, company: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-sm ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-sm amber" onClick={addUser}>Create user</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
