import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { KeyRound } from 'lucide-react';

export const MemberForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: 'member123',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        password: initialData.password || 'member123',
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: 'member123',
        status: 'active',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(formData);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    }
  };

  const isEditing = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Member' : 'Add New Member'}
      subtitle={isEditing ? 'Update member and login details' : 'Register a new mess member with login access'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Rahim Ahmed"
          required
          error={errors.name}
        />

        <Input
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 017XXXXXXXX"
          error={errors.phone}
        />

        <Input
          label="Email Address (Login Username)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="e.g. rahim@example.com"
          required
          error={errors.email}
          helperText="Member uses this email address to log in to their Member Portal"
        />

        <Input
          label="Member Portal Password"
          name="password"
          type="text"
          value={formData.password}
          onChange={handleChange}
          placeholder="e.g. member123"
          prefix={<KeyRound className="w-4 h-4" />}
          helperText="Default password is 'member123'"
        />

        {isEditing && (
          <Select
            label="Membership Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'active', label: 'Active Member' },
              { value: 'inactive', label: 'Inactive / Archived' },
            ]}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Register Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
