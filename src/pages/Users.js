import React, { useState, useEffect } from 'react';
import { usePagination, InlinePager } from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { supS } from '../styles/dashboardStyles';



// ── Reusable grouped permission picker for custom roles ─────────────────────
function CustomRolePermissionEditor({ permissions, selectedIds, onChange, roleName }) {
  const GROUP_ICONS = {
    products: '📦', categories: '🏷️', suppliers: '🏭', sales: '🧾',
    purchases: '🛒', stock: '📊', users: '👥', roles: '🔐',
  };

  const allIds = Object.values(permissions).flat().map(p => p.id);

  const selectAll = () => onChange(allIds);
  const clearAll = () => onChange([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={supS.label}>
          {roleName ? `Permissions for "${roleName}" *` : 'Permissions *'}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={selectAll}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>
            Select All
          </button>
          <button type="button" onClick={clearAll}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {Object.entries(permissions).map(([group, perms], gi) => {
          const groupIds = perms.map(p => p.id);
          const allSel = groupIds.every(id => selectedIds.includes(id));
          const someSel = groupIds.some(id => selectedIds.includes(id));

          const toggleGroup = () => {
            if (allSel) {
              onChange(selectedIds.filter(id => !groupIds.includes(id)));
            } else {
              onChange([...new Set([...selectedIds, ...groupIds])]);
            }
          };

          return (
            <div key={group} style={{ borderBottom: gi < Object.entries(permissions).length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <button type="button" onClick={toggleGroup} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: allSel ? '#f5f3ff' : someSel ? '#fafbff' : '#fff',
                transition: 'background 0.12s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${allSel ? '#7c3aed' : someSel ? '#a78bfa' : '#cbd5e1'}`,
                  background: allSel ? '#7c3aed' : someSel ? '#ede9fe' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {allSel && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  {!allSel && someSel && <span style={{ color: '#7c3aed', fontSize: 11, lineHeight: 1, fontWeight: 900 }}>–</span>}
                </div>
                <span style={{ fontSize: 13 }}>{GROUP_ICONS[group] || '⚙️'}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{group}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {groupIds.filter(id => selectedIds.includes(id)).length}/{perms.length} selected
                </span>
              </button>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 14px 12px 42px' }}>
                {perms.map(p => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <button key={p.id} type="button"
                      onClick={() => onChange(checked ? selectedIds.filter(id => id !== p.id) : [...selectedIds, p.id])}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${checked ? '#7c3aed' : '#e2e8f0'}`,
                        background: checked ? '#7c3aed' : '#f8fafc',
                        color: checked ? '#fff' : '#475569',
                        transition: 'all 0.12s',
                      }}>
                      {checked && '✓ '}{p.display_name || p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length === 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Select at least one permission</p>
      )}
      {selectedIds.length > 0 && (
        <p style={{ fontSize: 12, color: '#7c3aed', margin: 0, fontWeight: 500 }}>
          {selectedIds.length} permission{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}


function UsersTab({ token, user: currentUser, toast, canCreate = false, canEdit = false, canDelete = false, canViewRoles = false }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = {
    name: '', email: '', password: '',
    role_ids: [],
    useCustomRole: false,
    customRoleName: '', customRoleDesc: '', customPermIds: [],
    // for editing existing custom role permissions
    editCustomRoleId: null, editCustomPermIds: [],
  };
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({}); // grouped by category
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // holds user object pending deletion
  const [confirmDeleteRole, setConfirmDeleteRole] = useState(null); // holds role object pending deletion
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const isOwner = currentUser.roles?.some(r => r.name === 'owner');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, rRes, pRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/roles`, { headers }),
          fetch(`${API_URL}/permissions`, { headers }),
        ]);
        const uJson = await uRes.json();
        const rJson = await rRes.json();
        const pJson = await pRes.json();
        setUsers(uJson.data || []);
        setRoles(rJson.data || []);
        setPermissions(pJson.data || {});
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  // Load full user details (including custom role permissions) before opening edit modal
  const openEdit = async (u) => {
    setFormError(null);
    setLoadingUserDetail(true);
    setShowModal(true);
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, { headers });
      const json = await res.json();
      const fullUser = res.ok ? json.data : u;

      // Detect if any of the user's roles is a custom (non-default, tenant-owned) role
      const customRole = (fullUser.roles || []).find(r => r.is_custom);
      const editCustomPermIds = customRole ? (customRole.permissions || []).map(p => p.id) : [];

      setEditTarget(fullUser);
      setForm({
        ...EMPTY_FORM,
        name: fullUser.name,
        email: fullUser.email,
        role_ids: (fullUser.roles || []).map(r => r.id),
        editCustomRoleId: customRole ? customRole.id : null,
        editCustomPermIds,
      });
    } catch {
      setEditTarget(u);
      setForm({ ...EMPTY_FORM, name: u.name, email: u.email, role_ids: (u.roles || []).map(r => r.id) });
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const toggleRole = (id) => {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(id) ? f.role_ids.filter(r => r !== id) : [...f.role_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom validation
    if (!form.name.trim()) {
      setFormError('User name is required');
      return;
    }
    if (form.name.trim().length < 2) {
      setFormError('User name must be at least 2 characters');
      return;
    }
    if (!form.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!editTarget && !form.password) {
      setFormError('Password is required for new users');
      return;
    }
    if (!editTarget && form.password && form.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    // ── ADD USER: Custom role path (atomic endpoint) ──────────────────────────
    if (!editTarget && form.useCustomRole) {
      if (!form.customRoleName.trim()) { setFormError('Please enter a name for the custom role.'); return; }
      if (form.customPermIds.length === 0) { setFormError('Please select at least one permission for the custom role.'); return; }
      setSaving(true);
      setFormError(null);
      try {
        const res = await fetch(`${API_URL}/users/with-custom-role`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role_name: form.customRoleName.trim(),
            role_description: form.customRoleDesc.trim() || null,
            permission_ids: form.customPermIds,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setFormError(json?.message || 'Failed to create user with custom role.'); return; }

        const newUser = json.data;
        const newRole = json.data.custom_role;
        setUsers(prev => [...prev, newUser]);
        if (newRole) setRoles(prev => [...prev, newRole]);
        toast.success('User added', `"${newUser.name}" has been added with custom role "${newRole?.name || form.customRoleName}".`);
        setShowModal(false);
      } catch { setFormError('Could not reach the server.'); }
      finally { setSaving(false); }
      return;
    }

    // ── ADD USER: Standard role path ─────────────────────────────────────────
    if (!editTarget && !form.useCustomRole && form.role_ids.length === 0) {
      setFormError('Please assign at least one role.');
      return;
    }

    // ── EDIT USER ─────────────────────────────────────────────────────────────
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editTarget;

      // If editing and there's a custom role with changed permissions, update them first
      if (isEdit && form.editCustomRoleId && isOwner) {
        const permRes = await fetch(`${API_URL}/users/${editTarget.id}/custom-role-permissions`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            role_id: form.editCustomRoleId,
            permission_ids: form.editCustomPermIds,
          }),
        });
        const permJson = await permRes.json();
        if (!permRes.ok) { setFormError(permJson?.message || 'Failed to update custom role permissions.'); setSaving(false); return; }
      }

      const body = isEdit
        ? { name: form.name, email: form.email, role_ids: form.role_ids, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, role_ids: form.role_ids };

      const res = await fetch(`${API_URL}/users${isEdit ? `/${editTarget.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }

      if (isEdit) {
        setUsers(prev => prev.map(u => u.id === editTarget.id ? json.data : u));
      } else {
        setUsers(prev => [...prev, json.data]);
      }
      toast.success(isEdit ? 'User updated' : 'User added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    setDeletingId(u.id);
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete user.'); return; }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success('User deleted', `"${u.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const handleDeleteRole = async (role) => {
    setDeletingRoleId(role.id);
    try {
      const res = await fetch(`${API_URL}/roles/${role.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete role.'); return; }
      setRoles(prev => prev.filter(r => r.id !== role.id));
      // Also clear the role from any users displayed in the table
      setUsers(prev => prev.map(u => ({ ...u, roles: (u.roles || []).filter(r => r.id !== role.id) })));
      toast.success('Role deleted', `"${role.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingRoleId(null); setConfirmDeleteRole(null); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedUsers, page: uPage, setPage: setUPage, totalPages: uTotalPages, total: uTotal, pageSize: uPageSize } = usePagination(filtered);

  const roleColors = { owner: '#7c3aed', admin: '#2563eb', manager: '#0891b2', cashier: '#16a34a' };
  const getRoleColor = (name) => roleColors[name] || '#64748b';

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administration</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>User Management</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Manage team members and their access roles</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {users.length > 0 && (
            <input style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          )}
          {canCreate && (
            <button onClick={openAdd} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              + Add User
            </button>
          )}
        </div>
      </div>
      {/* Users table */}

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No users match your search' : 'No users yet'}
            description={search ? 'Try a different name or email.' : 'Add team members to get started.'}
            actionLabel={search ? 'Clear Search' : 'Add First User'}
            onAction={search ? () => setSearch('') : openAdd}
          />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['User', 'Email', 'Roles', 'Joined', ...(canEdit || canDelete ? ['Actions'] : [])].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {/* Avatar + Name */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#ede9fe',
                          color: '#7c3aed', fontWeight: 700, fontSize: 15,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{u.name}</div>
                          {u.id === currentUser.id && (
                            <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>{u.email}</td>
                    {/* Roles */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(u.roles || []).length > 0 ? u.roles.map(r => (
                          <span key={r.id} style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: getRoleColor(r.name) + '18', color: getRoleColor(r.name),
                            border: `1px solid ${getRoleColor(r.name)}40`,
                          }}>{r.name}</span>
                        )) : <span style={{ color: '#94a3b8', fontSize: 13 }}>No role</span>}
                      </div>
                    </td>
                    {/* Joined */}
                    <td style={{ padding: '14px 14px', color: '#94a3b8', fontSize: 13 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    {/* Actions */}
                    {(canEdit || canDelete) && (
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {canEdit && (
                            <button onClick={() => openEdit(u)} style={{
                              padding: '5px 12px', borderRadius: 6, border: '1px solid #3b82f6',
                              background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}>Edit</button>
                          )}
                          {canDelete && u.id !== currentUser.id && (isOwner || !u.roles?.some(r => r.name === 'owner')) && (
                            <button onClick={() => setConfirmDelete(u)} disabled={deletingId === u.id} style={{
                              padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444',
                              background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}>
                              {deletingId === u.id ? '…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <InlinePager page={uPage} totalPages={uTotalPages} total={uTotal} pageSize={uPageSize} setPage={setUPage} />
          </>
        )}
      </div>

      {/* ── Roles section (visible to anyone with canViewRoles; delete only for owners) ─── */}
      {canViewRoles && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Roles</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>All roles available in this business — default system roles cannot be deleted.</p>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {roles.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No custom roles yet. Create one by adding a user with a custom role.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Role Name', 'Type', 'Description', 'Assigned To', ...(isOwner ? ['Actions'] : [])].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => {
                    const assignedUsers = users.filter(u => (u.roles || []).some(r => r.id === role.id));
                    return (
                      <tr key={role.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>{role.is_default ? '🛡️' : '✨'}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{role.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: role.is_default ? '#ede9fe' : '#f0fdf4',
                            color: role.is_default ? '#7c3aed' : '#16a34a',
                          }}>
                            {role.is_default ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#475569', fontSize: 13 }}>{role.description || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {assignedUsers.length === 0 ? (
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>Unassigned</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {assignedUsers.map(u => (
                                <span key={u.id} style={{ padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#475569' }}>
                                  {u.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        {isOwner && (
                          <td style={{ padding: '13px 16px' }}>
                            {!role.is_default && (
                              <button
                                onClick={() => setConfirmDeleteRole(role)}
                                disabled={deletingRoleId === role.id}
                                style={{
                                  padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444',
                                  background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                  opacity: deletingRoleId === role.id ? 0.6 : 1,
                                }}
                              >
                                {deletingRoleId === role.id ? '…' : 'Delete'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteRole}
        onClose={() => setConfirmDeleteRole(null)}
        title="Delete Custom Role"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDeleteRole(null)} style={{ minWidth: 90 }}>Cancel</Button>
            <Button
              variant="danger"
              loading={deletingRoleId === confirmDeleteRole?.id}
              onClick={() => handleDeleteRole(confirmDeleteRole)}
              style={{ minWidth: 120 }}
            >
              Delete Role
            </Button>
          </div>
        }
      >
        {confirmDeleteRole && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delete "{confirmDeleteRole.name}"?</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDeleteRole.description || 'Custom role'}</p>
              </div>
            </div>
            {users.filter(u => (u.roles || []).some(r => r.id === confirmDeleteRole.id)).length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                ⚠️ This role is currently assigned to {users.filter(u => (u.roles || []).some(r => r.id === confirmDeleteRole.id)).length} user(s). They will lose this role immediately.
              </div>
            )}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c' }}>
              ⚠️ This action is permanent and cannot be undone.
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} style={{ minWidth: 90 }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId === confirmDelete?.id}
              onClick={() => handleDelete(confirmDelete)}
              style={{ minWidth: 110 }}
            >
              Delete
            </Button>
          </div>
        }
      >
        {confirmDelete && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delete "{confirmDelete.name}"?</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDelete.email}</p>
              </div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c' }}>
              ⚠️ This action is permanent. The user will lose access immediately and cannot be recovered.
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        {loadingUserDetail ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading user details…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Row 1: Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={supS.label}>Staff Full Name (Required)</label>
                <input style={supS.input} placeholder="e.g., John Mukasa" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={supS.label}>Staff Email Address (Required)</label>
                <input style={supS.input} type="email" placeholder="staff@zziwa.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>{editTarget ? 'New Password (Leave blank to keep current)' : 'Create Password (Required)'}</label>
              <input style={supS.input} type="password" placeholder={editTarget ? '••••••••' : 'Minimum 8 characters with uppercase, lowercase & number'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editTarget} minLength={editTarget ? 0 : 8} />
            </div>

            {/* Role Mode Toggle — only shown when adding a new user (owners only can create custom roles) */}
            {!editTarget && isOwner && (
              <div style={{ display: 'flex', gap: 0, borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, useCustomRole: false, customRoleName: '', customRoleDesc: '', customPermIds: [] }))}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none', borderRight: '1px solid #e2e8f0',
                    background: !form.useCustomRole ? '#4f46e5' : '#f8fafc',
                    color: !form.useCustomRole ? '#fff' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  🎭 Predefined Role
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, useCustomRole: true, role_ids: [] }))}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none',
                    background: form.useCustomRole ? '#7c3aed' : '#f8fafc',
                    color: form.useCustomRole ? '#fff' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  ✨ Custom Role
                </button>
              </div>
            )}

            {/* ── PREDEFINED ROLE PICKER ── */}
            {(!form.useCustomRole || editTarget) && !(editTarget && form.editCustomRoleId) && (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={supS.label}>Assign User Roles (Required)</label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roles.map(r => {
                  const selected = form.role_ids.includes(r.id);
                  const color = getRoleColor(r.name);

                  const ROLE_META = {
                    owner: { icon: '👑', desc: 'Full access to everything — settings, users, all reports, all data.', perms: ['Manage users & roles', 'All reports & analytics', 'View & edit all sales', 'Manage products & inventory', 'Manage suppliers & customers', 'All purchases'] },
                    admin: { icon: '🛡️', desc: 'Same as owner except cannot delete the owner account.', perms: ['Manage users & roles', 'All reports & analytics', 'View & edit all sales', 'Manage products & inventory', 'Manage suppliers & customers', 'All purchases'] },
                    manager: { icon: '📋', desc: 'Operational access — can see all sales, run reports, manage stock.', perms: ['View all sales (any staff)', 'Daily, weekly, monthly & yearly reports', 'Manage products & inventory', 'Manage suppliers & customers', 'View purchases'] },
                    cashier: { icon: '🧾', desc: 'POS-only access — can process sales and view only their own transactions.', perms: ['Process sales (POS)', 'View own sales only', 'View products & stock levels', 'View customers'] },
                  };

                  const meta = ROLE_META[r.name?.toLowerCase()] || { icon: '👤', desc: r.description || 'Custom role.', perms: [] };

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${selected ? color : '#e2e8f0'}`,
                        background: selected ? color + '0d' : '#fafbff',
                        transition: 'all 0.15s',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: `2px solid ${selected ? color : '#cbd5e1'}`,
                        background: selected ? color : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {selected && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{meta.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: selected ? color : '#0f172a', textTransform: 'capitalize' }}>{r.name}</span>
                          {selected && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: color + '20', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected</span>}
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{meta.desc}</p>
                        {meta.perms.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {meta.perms.map(p => (
                              <span key={p} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: selected ? color + '15' : '#f1f5f9', color: selected ? color : '#475569', fontWeight: 500 }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.role_ids.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Select at least one role</p>
              )}
            </div>
            )}

            {/* ── EDIT: Custom Role Permission Manager (owner only) ── */}
            {editTarget && form.editCustomRoleId && isOwner && (
              <CustomRolePermissionEditor
                permissions={permissions}
                selectedIds={form.editCustomPermIds}
                onChange={ids => setForm(f => ({ ...f, editCustomPermIds: ids }))}
                roleName={(editTarget.roles || []).find(r => r.id === form.editCustomRoleId)?.name}
              />
            )}

            {/* ── EDIT: Custom role info for non-owners (read-only notice) ── */}
            {editTarget && form.editCustomRoleId && !isOwner && (
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6d28d9' }}>
                ✨ This user has a <strong>custom role</strong>. Only the owner can modify its permissions.
              </div>
            )}

            {/* ── ADD USER: CUSTOM ROLE BUILDER ── */}
            {form.useCustomRole && !editTarget && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6d28d9' }}>
                  <strong>Custom Role</strong> — a new role will be created and assigned exclusively to this user. You pick exactly which permissions it includes.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={supS.label}>Role Name *</label>
                    <input
                      style={supS.input}
                      placeholder="e.g. Warehouse Staff"
                      value={form.customRoleName}
                      onChange={e => setForm(f => ({ ...f, customRoleName: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={supS.label}>Description (optional)</label>
                    <input
                      style={supS.input}
                      placeholder="e.g. Can view stock and process sales"
                      value={form.customRoleDesc}
                      onChange={e => setForm(f => ({ ...f, customRoleDesc: e.target.value }))}
                    />
                  </div>
                </div>

                <CustomRolePermissionEditor
                  permissions={permissions}
                  selectedIds={form.customPermIds}
                  onChange={ids => setForm(f => ({ ...f, customPermIds: ids }))}
                />
              </div>
            )}

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add User'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default UsersTab;
export { UsersTab };
