import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function Settings({ user, token, toast, onBusinessInfoUpdate }) {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    contacts: [],
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contacts: [],
    address: ''
  });

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/settings/business?tenant_id=${user.tenant_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Ensure contacts is always an array
        const data = {
          ...result.data,
          contacts: Array.isArray(result.data.contacts) ? result.data.contacts : []
        };
        setBusinessInfo(data);
        setFormData(data);
      } else {
        toast.error('Failed to load', result.message || 'Failed to load business information');
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
      toast.error('Error loading', 'Error loading business information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`${API}/settings/business?tenant_id=${user.tenant_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Ensure contacts is always an array
        const data = {
          ...result.data,
          contacts: Array.isArray(result.data.contacts) ? result.data.contacts : []
        };
        setBusinessInfo(data);
        setIsEditing(false);
        
        // Update the user state immediately throughout the entire system
        if (onBusinessInfoUpdate) {
          onBusinessInfoUpdate(prevUser => ({
            ...prevUser,
            tenant: {
              ...prevUser.tenant,
              name: data.name,
              email: data.email,
              phone: data.phone,
              contacts: data.contacts,
              address: data.address,
            }
          }));
          
          // Also update localStorage so the change persists
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userObj = JSON.parse(storedUser);
              userObj.tenant = {
                ...userObj.tenant,
                name: data.name,
                email: data.email,
                phone: data.phone,
                contacts: data.contacts,
                address: data.address,
              };
              localStorage.setItem('user', JSON.stringify(userObj));
            } catch (e) {
              console.error('Error updating localStorage:', e);
            }
          }
        }
        
        toast.success('Settings updated', 'Business information updated successfully');
      } else {
        toast.error('Update failed', result.message || 'Failed to update business information');
      }
    } catch (error) {
      console.error('Error updating business info:', error);
      toast.error('Update failed', 'Error updating business information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(businessInfo);
    setIsEditing(false);
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { type: 'mobile', number: '' }]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Business Settings</h1>
          <p style={styles.subtitle}>Manage your business information and preferences</p>
        </div>
        {!isEditing && (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            ✏️ Edit Information
          </Button>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>📋 Business Information</h2>
          <p style={styles.cardSubtitle}>Your business details that appear on invoices and documents</p>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="name">
                Business Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={styles.input}
                required
                placeholder="Enter business name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email">
                Business Email <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                required
                placeholder="business@example.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phone">
                Primary Contact Phone (Legacy)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="+256 XXX XXX XXX"
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Note: Use the contacts section below for multiple phone numbers
              </p>
            </div>

            <div style={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={styles.label}>
                  Contact Numbers
                </label>
                <Button 
                  type="button" 
                  variant="primary" 
                  size="sm"
                  onClick={addContact}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  + Add Contact
                </Button>
              </div>
              
              {formData.contacts && formData.contacts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formData.contacts.map((contact, index) => (
                    <div key={index} style={styles.contactRow}>
                      <select
                        value={contact.type || 'mobile'}
                        onChange={(e) => updateContact(index, 'type', e.target.value)}
                        style={{ ...styles.input, flex: '0 0 140px' }}
                      >
                        <option value="mobile">Mobile</option>
                        <option value="office">Office</option>
                        <option value="landline">Landline</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="tel"
                        value={contact.number || ''}
                        onChange={(e) => updateContact(index, 'number', e.target.value)}
                        style={{ ...styles.input, flex: 1 }}
                        placeholder="+256 XXX XXX XXX"
                      />
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        style={styles.removeBtn}
                        title="Remove contact"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyContacts}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    No contacts added. Click "Add Contact" to add phone numbers.
                  </p>
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="address">
                Business Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="3"
                placeholder="Enter your business address"
              />
            </div>

            <div style={styles.formActions}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div style={styles.infoDisplay}>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Business Name</div>
              <div style={styles.infoValue}>{businessInfo.name || 'Not set'}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Business Email</div>
              <div style={styles.infoValue}>{businessInfo.email || 'Not set'}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Contact Phone (Legacy)</div>
              <div style={styles.infoValue}>{businessInfo.phone || 'Not set'}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Contact Numbers</div>
              <div style={styles.infoValue}>
                {businessInfo.contacts && businessInfo.contacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {businessInfo.contacts.map((contact, index) => (
                      <div key={index} style={styles.contactDisplay}>
                        <span style={styles.contactType}>
                          {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}:
                        </span>
                        <span style={styles.contactNumber}>{contact.number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>No contacts added</span>
                )}
              </div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Business Address</div>
              <div style={styles.infoValue}>{businessInfo.address || 'Not set'}</div>
            </div>

            <div style={styles.infoFooter}>
              <span style={styles.lastUpdated}>
                Last updated: {new Date(businessInfo.updated_at).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  form: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '8px',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0',
  },
  infoDisplay: {
    padding: '24px',
  },
  infoRow: {
    display: 'flex',
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  infoLabel: {
    flex: '0 0 180px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
  },
  infoValue: {
    flex: '1',
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
  },
  infoFooter: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  lastUpdated: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    fontSize: '16px',
    color: '#64748b',
  },
  contactRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  removeBtn: {
    flex: '0 0 36px',
    height: '38px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContacts: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    textAlign: 'center',
  },
  contactDisplay: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  contactType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
    minWidth: '80px',
  },
  contactNumber: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
  },
};
