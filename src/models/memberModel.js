/**
 * Member Data Model
 * Structure:
 * {
 *   id: string,
 *   name: string,
 *   phone?: string,
 *   email?: string,
 *   password?: string,
 *   role: 'member',
 *   status: 'active' | 'inactive',
 *   joinedAt: Timestamp | Date | string,
 *   updatedAt: Timestamp | Date | string
 * }
 */

export const createMemberModel = (data = {}) => {
  return {
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    password: data.password || 'member123',
    role: 'member',
    status: data.status === 'inactive' ? 'inactive' : 'active',
    joinedAt: data.joinedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeMember = (id, data = {}) => {
  return {
    id,
    name: data.name || 'Unnamed Member',
    phone: data.phone || '',
    email: data.email || '',
    password: data.password || 'member123',
    role: data.role || 'member',
    status: data.status || 'active',
    joinedAt: data.joinedAt || null,
    updatedAt: data.updatedAt || null,
  };
};
